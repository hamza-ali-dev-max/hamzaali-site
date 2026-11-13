// Backend tests. Run with: npm test
// Uses mock xAI and Twilio servers (tests/mocks.mjs), so no keys and no real calls are needed.
import test from 'node:test';
import assert from 'node:assert/strict';
import WebSocket from 'ws';
import { createApp } from '../server/index.js';
import { loadConfig } from '../server/config.js';
import { twilioSignature, normalisePhone } from '../server/phone.js';
import { createCalendar } from '../server/calendar.js';
import { startMockXai } from './mocks.mjs';
import { nextSentence } from '../server/relay.js';

const listen = (app) => new Promise((resolve) => app.server.listen(0, '127.0.0.1', () => resolve(app.server.address().port)));
const json = async (url, options = {}) => {
  const res = await fetch(url, { ...options, headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }, body: options.body ? JSON.stringify(options.body) : undefined });
  return { status: res.status, body: await res.json().catch(() => ({})), headers: res.headers };
};
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function boot(extraEnv = {}) {
  const mock = await startMockXai();
  const env = {
    PORT: '0', STATIC_DIR: '/nonexistent', TRUST_PROXY: 'true',
    XAI_API_KEY: 'test-xai-key', XAI_API_BASE: mock.apiBase, XAI_REALTIME_URL: mock.realtimeUrl,
    ...extraEnv,
  };
  if (extraEnv.TWILIO_ACCOUNT_SID) env.TWILIO_API_BASE = mock.twilioBase;
  if (extraEnv.ELEVENLABS_API_KEY) env.ELEVENLABS_API_BASE = mock.elevenBase;
  const app = createApp(loadConfig(env));
  const port = await listen(app);
  if (extraEnv.TWILIO_ACCOUNT_SID) app.cfg.publicUrl = `http://127.0.0.1:${port}`;
  return { mock, app, base: `http://127.0.0.1:${port}`, port, stop: async () => { await app.close(); await mock.close(); } };
}

test('health reports configuration without exposing secrets', async () => {
  const t = await boot();
  const { status, body } = await json(`${t.base}/api/health`);
  assert.equal(status, 200);
  assert.equal(body.voice.configured, true);
  assert.equal(body.voice.provider, 'xai');
  assert.equal(body.phone.configured, false);
  assert.equal(body.demo.maxSeconds, 180);
  assert.ok(!JSON.stringify(body).includes('test-xai-key'));
  await t.stop();
});

test('without an API key the demo reports "not configured" and health says so', async () => {
  const t = await boot({ XAI_API_KEY: '' });
  assert.equal((await json(`${t.base}/api/health`)).body.voice.configured, false);
  const res = await json(`${t.base}/api/demo/session`, { method: 'POST' });
  assert.equal(res.status, 503);
  assert.equal(res.body.code, 'not_configured');
  await t.stop();
});

test('placeholder keys count as not configured', async () => {
  const t = await boot({ XAI_API_KEY: 'your_xai_api_key_here' });
  assert.equal((await json(`${t.base}/api/health`)).body.voice.configured, false);
  await t.stop();
});

test('browser demo: ephemeral secret, session config from the docs, tools, clean end', async () => {
  const t = await boot();
  const res = await json(`${t.base}/api/demo/session`, { method: 'POST' });
  assert.equal(res.status, 200);
  const { sessionId, connection, maxSeconds } = res.body;
  assert.equal(maxSeconds, 180);
  assert.equal(connection.protocol, 'openai-realtime');
  assert.match(connection.url, /\/v1\/realtime\?model=grok-voice-3\.0$/);
  assert.deepEqual(connection.subprotocols, ['xai-client-secret.eph_1']);
  assert.ok(!JSON.stringify(res.body).includes('test-xai-key'), 'the real key must never reach the browser');
  assert.equal(t.mock.state.tokens[0].request.expires_after.seconds, 240);
  const s = connection.sessionUpdate.session;
  assert.equal(connection.sessionUpdate.type, 'session.update');
  assert.deepEqual(s.turn_detection, { type: 'server_vad' });
  assert.deepEqual(s.audio.input.format, { type: 'audio/pcm', rate: 24000 });
  assert.deepEqual(s.audio.output.format, { type: 'audio/pcm', rate: 24000 });
  assert.deepEqual(s.tools.map((x) => x.name), ['check_availability', 'book_appointment', 'take_message', 'transfer_to_owner']);
  assert.match(s.instructions, /Milkwood Dental/);
  assert.match(s.instructions, /AI assistant/);
  assert.equal(res.body.business, 'dentist');

  // The browser would now connect straight to the voice provider with the secret.
  const ws = new WebSocket(connection.url, connection.subprotocols);
  const events = [];
  await new Promise((resolve, reject) => { ws.on('open', resolve); ws.on('error', reject); });
  ws.on('message', (raw) => events.push(JSON.parse(raw.toString())));
  ws.send(JSON.stringify(connection.sessionUpdate));
  ws.send(JSON.stringify({ type: 'response.create' }));
  await wait(150);
  assert.ok(events.some((e) => e.type === 'response.output_audio.delta'));
  assert.ok(events.some((e) => e.type === 'response.output_audio_transcript.done' && /Milkwood Dental/.test(e.transcript)));
  ws.close();

  // Tools run on the server against this session's demo calendar.
  const tomorrow = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Johannesburg' }).format(new Date(Date.now() + 86400000 * 2));
  const avail = await json(`${t.base}/api/demo/tool`, { method: 'POST', body: { sessionId, name: 'check_availability', args: { date: tomorrow } } });
  assert.equal(avail.status, 200);
  assert.equal(avail.body.result.ok, true);

  const end = await json(`${t.base}/api/demo/session/end`, { method: 'POST', body: { sessionId, reason: 'user' } });
  assert.equal(end.body.ok, true);
  const gone = await json(`${t.base}/api/demo/tool`, { method: 'POST', body: { sessionId, name: 'check_availability', args: { date: tomorrow } } });
  assert.equal(gone.status, 410);
  assert.equal((await json(`${t.base}/api/health`)).body.demo.activeSessions, 0);
  await t.stop();
});

test('concurrent sessions are capped and freed when a session ends', async () => {
  const t = await boot({ DEMO_MAX_CONCURRENT: '2', DEMO_SESSIONS_PER_IP_PER_HOUR: '50' });
  const a = await json(`${t.base}/api/demo/session`, { method: 'POST' });
  const b = await json(`${t.base}/api/demo/session`, { method: 'POST' });
  const c = await json(`${t.base}/api/demo/session`, { method: 'POST' });
  assert.deepEqual([a.status, b.status, c.status], [200, 200, 429]);
  assert.equal(c.body.code, 'busy');
  await json(`${t.base}/api/demo/session/end`, { method: 'POST', body: { sessionId: a.body.sessionId } });
  assert.equal((await json(`${t.base}/api/demo/session`, { method: 'POST' })).status, 200);
  await t.stop();
});

test('one visitor cannot start unlimited sessions (per-IP rate limit)', async () => {
  const t = await boot({ DEMO_SESSIONS_PER_IP_PER_HOUR: '2', DEMO_MAX_CONCURRENT: '10' });
  const hit = () => json(`${t.base}/api/demo/session`, { method: 'POST', headers: { 'X-Forwarded-For': '203.0.113.9' } });
  assert.equal((await hit()).status, 200);
  assert.equal((await hit()).status, 200);
  const third = await hit();
  assert.equal(third.status, 429);
  assert.equal(third.body.code, 'rate_limited');
  assert.ok(Number(third.headers.get('retry-after')) > 0);
  const other = await json(`${t.base}/api/demo/session`, { method: 'POST', headers: { 'X-Forwarded-For': '203.0.113.10' } });
  assert.equal(other.status, 200);
  await t.stop();
});

test('a provider failure is reported cleanly and frees the slot', async () => {
  const t = await boot({ XAI_API_KEY: 'wrong-key' });
  const res = await json(`${t.base}/api/demo/session`, { method: 'POST' });
  assert.equal(res.status, 502);
  assert.equal(res.body.code, 'provider_error');
  assert.equal((await json(`${t.base}/api/health`)).body.demo.activeSessions, 0);
  await t.stop();
});

test('each demo business gets its own receptionist and diary', async () => {
  const t = await boot({ DEMO_SESSIONS_PER_IP_PER_HOUR: '20', DEMO_MAX_CONCURRENT: '10' });
  for (const [business, name] of [['salon', 'Studio Lumi'], ['physio', 'Harbour Physio'], ['plumber', 'Khoza Plumbing'], ['nonsense', 'Milkwood Dental']]) {
    const res = await json(`${t.base}/api/demo/session`, { method: 'POST', body: { business } });
    assert.equal(res.status, 200);
    assert.match(res.body.connection.sessionUpdate.session.instructions, new RegExp(name));
    assert.equal(res.body.business, business === 'nonsense' ? 'dentist' : business);
  }
  await t.stop();
});

test('tool calls return what the owner would get on WhatsApp', async () => {
  const t = await boot();
  const { body } = await json(`${t.base}/api/demo/session`, { method: 'POST', body: { business: 'plumber' } });
  const msg = await json(`${t.base}/api/demo/tool`, { method: 'POST', body: { sessionId: body.sessionId, name: 'take_message', args: { caller_name: 'Pieter', callback_number: '082 555 0147', message: 'Burst geyser' } } });
  assert.equal(msg.body.result.ok, true);
  const early = await json(`${t.base}/api/demo/tool`, { method: 'POST', body: { sessionId: body.sessionId, name: 'transfer_to_owner', args: { reason: 'Burst geyser' } } });
  assert.equal(early.body.result.ok, false, 'no transfer before the caller\'s name and number');
  assert.match(early.body.result.error, /name and a callback number/);
  const transfer = await json(`${t.base}/api/demo/tool`, { method: 'POST', body: { sessionId: body.sessionId, name: 'transfer_to_owner', args: { reason: 'Burst geyser', caller_name: 'Pieter', callback_number: '082 555 0147' } } });
  assert.match(transfer.body.result.note, /demo/);
  assert.deepEqual(transfer.body.events.map((e) => e.type), ['message', 'transfer']);
  assert.equal(transfer.body.events[0].number, '082 555 0147');
  await t.stop();
});

test('demo calendar: availability, booking, double booking, closed days', () => {
  const now = () => new Date('2026-11-16T07:00:00Z'); // a Monday, 09:00 in Cape Town
  const cal0 = createCalendar({ business: 'dentist', now });
  const cal = {};
  cal.checkAvailability = (a) => cal0.run('check_availability', a);
  cal.bookAppointment = (a) => cal0.run('book_appointment', a);
  const day = cal.checkAvailability({ date: '2026-11-17' });
  assert.equal(day.ok, true);
  assert.ok(day.slots.length > 0 && day.slots.length <= 6);
  const slot = day.slots[0];
  const booked = cal.bookAppointment({ date: '2026-11-17', time: slot.time, service: 'cleaning', patient_name: 'Thandi' });
  assert.equal(booked.status, 'confirmed');
  assert.match(booked.reference, /^DEMO-\d{4}$/);
  assert.equal(cal.bookAppointment({ date: '2026-11-17', time: slot.time, service: 'cleaning', patient_name: 'Sipho' }).ok, false);
  assert.ok(!cal.checkAvailability({ date: '2026-11-17' }).slots.some((s) => s.time === slot.time));
  assert.equal(cal.checkAvailability({ date: '2026-11-22' }).closed, true); // Sunday
  assert.equal(cal.checkAvailability({ date: '2026-11-01' }).ok, false);    // in the past
  assert.equal(cal.checkAvailability({ date: 'tomorrow' }).ok, false);
  assert.equal(createCalendar({ business: 'dentist', now }).run('check_availability', { date: '2026-11-17' }).slots[0].time, slot.time, 'each session gets a fresh diary');
  assert.equal(createCalendar({ business: 'salon', now }).run('check_availability', { date: '2026-11-16' }).closed, true, 'the salon is closed on Mondays');
});

test('phone numbers are normalised and limited to South Africa by default', () => {
  assert.equal(normalisePhone('082 123 4567'), '+27821234567');
  assert.equal(normalisePhone('+27 82 123 4567'), '+27821234567');
  assert.equal(normalisePhone('0027821234567'), '+27821234567');
  assert.equal(normalisePhone('+1 415 555 0100'), '');
  assert.equal(normalisePhone('12345'), '');
  assert.equal(normalisePhone('+14155550100', ['+27', '+1']), '+14155550100');
});

const TWILIO = { TWILIO_ACCOUNT_SID: 'ACtest', TWILIO_AUTH_TOKEN: 'twilio-secret', TWILIO_PHONE_NUMBER: '+27210000000', PUBLIC_URL: 'http://placeholder.test' };
const signed = (t, path, params) => fetch(`${t.base}${path}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'X-Twilio-Signature': twilioSignature('twilio-secret', `${t.app.cfg.publicUrl}${path}`, params) },
  body: new URLSearchParams(params),
});

test('phone testing is hidden when Twilio is not configured', async () => {
  const t = await boot();
  const res = await json(`${t.base}/api/demo/call-me`, { method: 'POST', body: { phone: '0821234567' } });
  assert.equal(res.status, 503);
  assert.equal(res.body.code, 'phone_unavailable');
  await t.stop();
});

test('call-me: validates the number, places the call, one call per number per hour', async () => {
  const t = await boot(TWILIO);
  assert.equal((await json(`${t.base}/api/health`)).body.phone.configured, true);
  assert.equal((await json(`${t.base}/api/demo/call-me`, { method: 'POST', body: { phone: 'abc' } })).status, 400);
  const ok = await json(`${t.base}/api/demo/call-me`, { method: 'POST', body: { phone: '082 123 4567' } });
  assert.equal(ok.status, 200);
  const call = t.mock.state.twilioCalls[0];
  assert.equal(call.form.To, '+27821234567');
  assert.equal(call.form.From, '+27210000000');
  assert.equal(call.form.Url, `${t.app.cfg.publicUrl}/api/twilio/voice?business=dentist`);
  assert.equal(call.form.TimeLimit, '195');
  assert.equal(call.auth, `Basic ${Buffer.from('ACtest:twilio-secret').toString('base64')}`);
  const again = await json(`${t.base}/api/demo/call-me`, { method: 'POST', body: { phone: '+27821234567' } });
  assert.equal(again.status, 429);
  assert.equal(again.body.code, 'rate_limited');
  await t.stop();
});

test('Twilio webhooks: bad signatures are rejected, good ones get a media stream', async () => {
  const t = await boot(TWILIO);
  const params = { CallSid: 'CAinbound1', From: '+27821112222', To: '+27210000000', Direction: 'inbound', CallStatus: 'ringing' };
  const bad = await fetch(`${t.base}/api/twilio/voice`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'X-Twilio-Signature': 'nope' }, body: new URLSearchParams(params) });
  assert.equal(bad.status, 403);
  const good = await signed(t, '/api/twilio/voice', params);
  assert.equal(good.status, 200);
  const body = await good.text();
  assert.match(body, /<Connect><Stream url="ws:\/\/127\.0\.0\.1:\d+\/api\/twilio\/stream"><Parameter name="token" value="[^"]+"\/><Parameter name="business" value="dentist"\/><\/Stream><\/Connect>/);
  // The same number calling in again within the hour is turned away politely.
  const second = await (await signed(t, '/api/twilio/voice', { ...params, CallSid: 'CAinbound2' })).text();
  assert.match(second, /already had a test call/);
  const status = await signed(t, '/api/twilio/status', { CallSid: 'CAinbound1', CallStatus: 'completed', CallDuration: '42' });
  assert.equal(status.status, 204);
  await t.stop();
});

test('phone call audio is bridged to the voice agent, with tools and a hard time cap', async () => {
  const t = await boot({ ...TWILIO, DEMO_MAX_SECONDS: '2' });
  const params = { CallSid: 'CAbridge', From: '+27823334444', To: '+27210000000', Direction: 'inbound' };
  const body = await (await signed(t, '/api/twilio/voice', params)).text();
  const token = /name="token" value="([^"]+)"/.exec(body)[1];

  const ws = new WebSocket(`ws://127.0.0.1:${t.port}/api/twilio/stream`);
  const out = [];
  let closedAt = 0;
  await new Promise((resolve, reject) => { ws.on('open', resolve); ws.on('error', reject); });
  ws.on('message', (raw) => out.push(JSON.parse(raw.toString())));
  ws.on('close', () => { closedAt = Date.now(); });
  const started = Date.now();
  ws.send(JSON.stringify({ event: 'connected', protocol: 'Call' }));
  ws.send(JSON.stringify({ event: 'start', start: { streamSid: 'MZ1', callSid: 'CAbridge', customParameters: { token } } }));
  await wait(200);
  for (let i = 0; i < 14; i += 1) ws.send(JSON.stringify({ event: 'media', media: { payload: Buffer.alloc(160, 0xff).toString('base64') } }));
  await wait(400);

  const session = t.mock.state.sessionUpdates.at(-1);
  assert.deepEqual(session.audio.input.format, { type: 'audio/pcmu' }, 'phone audio goes through as mu-law, no conversion');
  assert.deepEqual(session.audio.output.format, { type: 'audio/pcmu' });
  assert.equal(t.mock.state.connections.at(-1).via, 'api-key');
  assert.ok(out.some((m) => m.event === 'media' && m.streamSid === 'MZ1' && m.media.payload), 'agent audio is sent back to the caller');
  assert.ok(out.some((m) => m.event === 'clear'), 'caller speech interrupts the agent');
  assert.equal(t.mock.state.toolOutputs.at(-1).ok, true, 'check_availability ran on the server');
  assert.ok(t.mock.state.audioChunks >= 14);
  assert.equal((await json(`${t.base}/api/health`)).body.demo.activeSessions, 1);

  await wait(2000);
  assert.ok(closedAt && closedAt - started >= 1900 && closedAt - started < 3500, 'the call is cut off at the time cap');
  assert.equal((await json(`${t.base}/api/health`)).body.demo.activeSessions, 0);
  await t.stop();
});

test('a media stream without a valid token is refused', async () => {
  const t = await boot(TWILIO);
  const ws = new WebSocket(`ws://127.0.0.1:${t.port}/api/twilio/stream`);
  await new Promise((resolve, reject) => { ws.on('open', resolve); ws.on('error', reject); });
  const closed = new Promise((resolve) => ws.on('close', resolve));
  ws.send(JSON.stringify({ event: 'start', start: { streamSid: 'MZ2', callSid: 'CAfake', customParameters: { token: 'forged' } } }));
  await closed;
  assert.equal(t.mock.state.connections.length, 0);
  await t.stop();
});

// ---------------------------------------------------------------- natural voice (Grok brain, ElevenLabs voice)
const ELEVEN = { ELEVENLABS_API_KEY: 'test-el-key' };

test('replies are cut into whole sentences for the voice', () => {
  assert.deepEqual(nextSentence('Good day, Milkwood Dental. This is'), { sentence: 'Good day, Milkwood Dental.', rest: 'This is' });
  assert.equal(nextSentence('Sure. '), null, 'very short sentences wait for the next one');
  assert.deepEqual(nextSentence('Sure. Half past eight works. '), { sentence: 'Sure. Half past eight works.', rest: '' });
  assert.equal(nextSentence('That is R1,500.00 for'), null, 'a decimal point is not a sentence end');
  assert.deepEqual(nextSentence('How can I help', true), { sentence: 'How can I help', rest: '' });
});

test('browser demo with the ElevenLabs voice: relay through our server, keys stay put', async () => {
  const t = await boot(ELEVEN);
  const health = (await json(`${t.base}/api/health`)).body;
  assert.equal(health.voice.speech, 'elevenlabs');
  assert.equal(health.voice.tts.model, 'eleven_v4_turbo');
  assert.ok(!JSON.stringify(health).includes('test-el-key'));

  const res = await json(`${t.base}/api/demo/session`, { method: 'POST', body: { business: 'dentist' } });
  assert.equal(res.status, 200);
  const { sessionId, connection } = res.body;
  assert.equal(connection.protocol, 'relay');
  assert.equal(connection.path, '/api/demo/stream');
  assert.equal(t.mock.state.tokens.length, 0, 'no xAI browser secret is issued in relay mode');
  assert.ok(!/test-xai-key|test-el-key/.test(JSON.stringify(res.body)));

  // A wrong token is refused.
  const bad = new WebSocket(`ws://127.0.0.1:${t.port}${connection.path}?session=${sessionId}&token=nope`);
  await new Promise((resolve) => { bad.on('error', resolve); bad.on('close', resolve); });

  const ws = new WebSocket(`ws://127.0.0.1:${t.port}${connection.path}?session=${sessionId}&token=${connection.token}`);
  const events = [];
  const audio = [];
  ws.on('message', (data, isBinary) => { if (isBinary) audio.push(data.length); else events.push(JSON.parse(data.toString())); });
  await new Promise((resolve, reject) => { ws.on('open', resolve); ws.on('error', reject); });
  await wait(300);
  assert.ok(events.some((e) => e.type === 'ready'));
  assert.ok(audio.length > 0 && audio.every((n) => n % 2 === 0), 'voice audio arrives in whole 16-bit samples');
  const first = t.mock.state.ttsRequests[0];
  assert.equal(first.voice, 'gsm4lUH9bnZ3pjR1Pw7w');
  assert.equal(first.format, 'pcm_24000');
  assert.equal(first.model_id, 'eleven_v4_turbo');
  assert.equal(first.text, 'Good day, Milkwood Dental.');
  assert.ok(t.mock.state.ttsRequests[1].previous_text.includes('Milkwood Dental'), 'later sentences get the earlier ones as context');
  assert.equal(t.mock.state.sessionUpdates.at(-1).audio.output.format.type, 'audio/pcm');

  // Caller audio goes up as binary; the agent books through the server diary.
  for (let i = 0; i < 14; i += 1) ws.send(Buffer.alloc(4800));
  await wait(400);
  assert.ok(events.some((e) => e.type === 'interrupt'), 'caller speech stops the voice');
  assert.ok(events.some((e) => e.type === 'user_text' && /cleaning/.test(e.text)));
  assert.ok(events.some((e) => e.type === 'tool' && e.name === 'check_availability'));
  assert.ok(events.some((e) => e.type === 'events' && Array.isArray(e.events)));
  assert.equal(t.mock.state.toolOutputs.at(-1).ok, true);
  assert.ok(t.mock.state.ttsRequests.some((r) => /booked for half past eight/.test(r.text)), 'the reply after the tool is spoken');

  ws.close();
  await wait(150);
  assert.equal((await json(`${t.base}/api/health`)).body.demo.activeSessions, 0, 'closing the socket ends the session');
  await t.stop();
});

test('VOICE_TTS=native keeps Grok\'s own voice even with an ElevenLabs key', async () => {
  const t = await boot({ ...ELEVEN, VOICE_TTS: 'native' });
  const res = await json(`${t.base}/api/demo/session`, { method: 'POST' });
  assert.equal(res.body.connection.protocol, 'openai-realtime');
  await t.stop();
});

test('phone calls use the ElevenLabs voice as mu-law, straight to Twilio', async () => {
  const t = await boot({ ...TWILIO, ...ELEVEN });
  const params = { CallSid: 'CAvoice', From: '+27825556666', To: '+27210000000', Direction: 'inbound' };
  const body = await (await signed(t, '/api/twilio/voice', params)).text();
  const token = /name="token" value="([^"]+)"/.exec(body)[1];
  const ws = new WebSocket(`ws://127.0.0.1:${t.port}/api/twilio/stream`);
  const out = [];
  await new Promise((resolve, reject) => { ws.on('open', resolve); ws.on('error', reject); });
  ws.on('message', (raw) => out.push(JSON.parse(raw.toString())));
  ws.send(JSON.stringify({ event: 'start', start: { streamSid: 'MZ9', callSid: 'CAvoice', customParameters: { token } } }));
  await wait(300);
  assert.equal(t.mock.state.ttsRequests[0].format, 'ulaw_8000');
  const media = out.filter((m) => m.event === 'media');
  assert.ok(media.length > 0 && Buffer.from(media[0].media.payload, 'base64').length > 0);
  ws.close();
  await t.stop();
});
