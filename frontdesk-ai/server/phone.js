// Phone call testing with Twilio.
//   Call-me:  POST /api/demo/call-me   -> we ask Twilio to ring the visitor
//   Call-in:  the visitor dials the Twilio number -> Twilio hits POST /api/twilio/voice
// Either way Twilio opens a Media Stream (WebSocket) to /api/twilio/stream and this file
// bridges the call audio to the same voice agent the browser demo uses.
import crypto from 'node:crypto';
import { buildInstructions, TOOLS, OPENING_PROMPT } from './agent.js';
import { createCalendar } from './calendar.js';
import { log, usd, maskPhone } from './limits.js';
import { phoneConfigured } from './config.js';

const HOUR = 3600000;
const xml = (s) => String(s).replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[c]));
const twiml = (body) => `<?xml version="1.0" encoding="UTF-8"?><Response>${body}</Response>`;
const sayAndHangUp = (text) => twiml(`<Say voice="alice" language="en-ZA">${xml(text)}</Say><Hangup/>`);

// Twilio signs every webhook: base64(HMAC-SHA1(authToken, fullUrl + each POST field name and value, sorted by name)).
export function twilioSignature(authToken, url, params = {}) {
  const data = Object.keys(params).sort().reduce((acc, key) => acc + key + params[key], url);
  return crypto.createHmac('sha1', authToken).update(Buffer.from(data, 'utf-8')).digest('base64');
}
export function validTwilioSignature(authToken, signature, url, params) {
  const expected = Buffer.from(twilioSignature(authToken, url, params));
  const given = Buffer.from(String(signature || ''));
  return expected.length === given.length && crypto.timingSafeEqual(expected, given);
}

// Turns "082 123 4567" into "+27821234567". Returns '' when it is not a number we allow.
export function normalisePhone(input, allowedPrefixes = ['+27']) {
  let n = String(input || '').replace(/[\s\-().]/g, '');
  if (/^0\d{9}$/.test(n)) n = `+27${n.slice(1)}`;
  else if (/^27\d{9}$/.test(n)) n = `+${n}`;
  else if (/^00\d{9,14}$/.test(n)) n = `+${n.slice(2)}`;
  if (!/^\+\d{9,15}$/.test(n)) return '';
  return allowedPrefixes.some((prefix) => n.startsWith(prefix)) ? n : '';
}

export function createPhone({ cfg, provider, limiter, slots }) {
  const calls = new Map(); // callSid -> { direction, startedAt, number }
  const enabled = () => phoneConfigured(cfg) && provider.configured;

  const streamToken = (callSid) => {
    const expires = Date.now() + 120000;
    const mac = crypto.createHmac('sha256', cfg.phone.authToken).update(`${callSid}.${expires}`).digest('hex');
    return `${expires}.${mac}`;
  };
  const validStreamToken = (callSid, token) => {
    const [expires, mac] = String(token || '').split('.');
    if (!expires || !mac || Number(expires) < Date.now()) return false;
    const expected = crypto.createHmac('sha256', cfg.phone.authToken).update(`${callSid}.${expires}`).digest('hex');
    return expected.length === mac.length && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(mac));
  };

  // ---- Call-me: ring the visitor -------------------------------------------------------
  async function callMe({ phone, ip }) {
    if (!enabled()) return { status: 503, body: { code: 'phone_unavailable', message: 'Phone testing is not set up.' } };
    const number = normalisePhone(phone, cfg.phone.allowedPrefixes);
    if (!number) return { status: 400, body: { code: 'bad_number', message: 'Enter a South African number, for example 082 123 4567.' } };
    if (!slots.available()) return { status: 429, body: { code: 'busy', message: 'All demo lines are busy. Try again in a few minutes.', retryAfterSeconds: 120 } };
    const perIp = limiter.take(`call-ip:${ip}`, cfg.phone.perIpPerHour, HOUR);
    if (!perIp.ok) return { status: 429, body: { code: 'rate_limited', message: 'You have used your test calls for now. Try again later.', retryAfterSeconds: perIp.retryAfterSeconds } };
    const perNumber = limiter.take(`call-number:${number}`, cfg.phone.perNumberPerHour, HOUR);
    if (!perNumber.ok) return { status: 429, body: { code: 'rate_limited', message: 'That number has already had a test call this hour.', retryAfterSeconds: perNumber.retryAfterSeconds } };

    const form = new URLSearchParams({
      To: number,
      From: cfg.phone.number,
      Url: `${cfg.publicUrl}/api/twilio/voice`,
      Method: 'POST',
      StatusCallback: `${cfg.publicUrl}/api/twilio/status`,
      StatusCallbackMethod: 'POST',
      TimeLimit: String(cfg.demo.maxSeconds + 15),
    });
    for (const event of ['initiated', 'ringing', 'answered', 'completed']) form.append('StatusCallbackEvent', event);

    try {
      const res = await fetch(`${cfg.phone.apiBase}/2010-04-01/Accounts/${cfg.phone.accountSid}/Calls.json`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${cfg.phone.accountSid}:${cfg.phone.authToken}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: form,
        signal: AbortSignal.timeout(10000),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        log('phone_call_failed', { number: maskPhone(number), status: res.status, twilioCode: data.code });
        const trial = data.code === 21219 || data.code === 21608;
        return {
          status: 502,
          body: {
            code: trial ? 'unverified_number' : 'call_failed',
            message: trial ? 'This demo line can only call verified numbers for now. Use the microphone demo, or dial the demo number.' : 'We could not place the call. Please try the microphone demo.',
          },
        };
      }
      calls.set(data.sid, { direction: 'outbound', startedAt: Date.now(), number });
      log('phone_call_requested', { callSid: data.sid, number: maskPhone(number), direction: 'outbound' });
      return { status: 200, body: { ok: true, message: 'Calling you now. Your phone should ring within a few seconds.' } };
    } catch (error) {
      log('phone_call_failed', { number: maskPhone(number), error: error.message });
      return { status: 502, body: { code: 'call_failed', message: 'We could not place the call. Please try the microphone demo.' } };
    }
  }

  // ---- Twilio voice webhook: answer with TwiML that opens the media stream --------------
  function voiceWebhook({ params, url, signature }) {
    if (!phoneConfigured(cfg)) return { status: 503, body: sayAndHangUp('This demo line is not set up yet.') };
    if (!validTwilioSignature(cfg.phone.authToken, signature, url, params)) {
      log('twilio_bad_signature', { path: 'voice' });
      return { status: 403, body: 'Invalid signature' };
    }
    const callSid = params.CallSid || '';
    const inbound = (params.Direction || 'inbound') === 'inbound';
    if (inbound) {
      const from = params.From || 'unknown';
      if (!provider.configured) return { status: 200, body: sayAndHangUp('Thanks for calling the Front Desk A I demo line. The demo is not available right now. Please try again later.') };
      if (!slots.available()) return { status: 200, body: sayAndHangUp('Thanks for calling the Front Desk A I demo line. All lines are busy. Please try again in a few minutes.') };
      const allowed = limiter.take(`call-number:${from}`, cfg.phone.perNumberPerHour, HOUR);
      if (!allowed.ok) {
        log('phone_call_rate_limited', { callSid, number: maskPhone(from) });
        return { status: 200, body: sayAndHangUp('Thanks for calling the Front Desk A I demo line. You have already had a test call this hour. Please try again later.') };
      }
      calls.set(callSid, { direction: 'inbound', startedAt: Date.now(), number: from });
      log('phone_call_answered', { callSid, number: maskPhone(from), direction: 'inbound' });
    }
    const wsUrl = `${cfg.publicUrl.replace(/^http/, 'ws')}/api/twilio/stream`;
    return {
      status: 200,
      body: twiml(`<Connect><Stream url="${xml(wsUrl)}"><Parameter name="token" value="${xml(streamToken(callSid))}"/></Stream></Connect>`),
    };
  }

  // ---- Twilio status webhook: log how each call ended ----------------------------------
  function statusWebhook({ params, url, signature }) {
    if (!phoneConfigured(cfg) || !validTwilioSignature(cfg.phone.authToken, signature, url, params)) {
      log('twilio_bad_signature', { path: 'status' });
      return { status: 403, body: 'Invalid signature' };
    }
    const callSid = params.CallSid || '';
    const fields = { callSid, status: params.CallStatus, direction: calls.get(callSid)?.direction };
    if (params.CallStatus === 'completed' || ['busy', 'failed', 'no-answer', 'canceled'].includes(params.CallStatus)) {
      const seconds = Number(params.CallDuration || 0);
      fields.seconds = seconds;
      fields.voiceUsd = usd(seconds, cfg.voice.usdPerMinute);
      fields.phoneUsd = usd(seconds, cfg.phone.usdPerMinute);
      fields.totalUsd = Math.round((fields.voiceUsd + fields.phoneUsd) * 10000) / 10000;
      calls.delete(callSid);
    }
    log('phone_call_status', fields);
    return { status: 204, body: '' };
  }

  // ---- Media stream: one voice session per call ----------------------------------------
  function handleStream(ws) {
    let streamSid = '';
    let callSid = '';
    let voice = null;
    let timer = null;
    let startedAt = 0;
    let ended = false;
    const calendar = createCalendar();

    const end = (reason) => {
      if (ended) return;
      ended = true;
      clearTimeout(timer);
      if (voice) voice.close();
      if (callSid) slots.release(`call:${callSid}`);
      const seconds = startedAt ? Math.round((Date.now() - startedAt) / 1000) : 0;
      log('phone_session_end', { callSid, reason, seconds, voiceUsd: usd(seconds, cfg.voice.usdPerMinute), phoneUsd: usd(seconds, cfg.phone.usdPerMinute), bookings: calendar.bookings().length });
      try { ws.close(); } catch { /* already closed */ }
    };

    ws.on('message', (raw) => {
      let msg;
      try { msg = JSON.parse(raw.toString()); } catch { return; }
      if (msg.event === 'start') {
        streamSid = msg.start?.streamSid || msg.streamSid || '';
        callSid = msg.start?.callSid || '';
        if (voice || !validStreamToken(callSid, msg.start?.customParameters?.token) || !provider.configured) { end('rejected'); return; }
        if (!slots.acquire(`call:${callSid}`)) { end('busy'); return; }
        startedAt = Date.now();
        timer = setTimeout(() => end('time_limit'), cfg.demo.maxSeconds * 1000);
        voice = provider.connectServerSession({
          instructions: buildInstructions({ channel: 'phone', maxSeconds: cfg.demo.maxSeconds }),
          tools: TOOLS,
          format: 'pcmu',
          openingPrompt: OPENING_PROMPT,
          onEvent(event) {
            if (ended) return;
            if (event.type === 'audio') ws.send(JSON.stringify({ event: 'media', streamSid, media: { payload: event.audio } }));
            else if (event.type === 'interrupt') ws.send(JSON.stringify({ event: 'clear', streamSid }));
            else if (event.type === 'tool_call') {
              const result = calendar.run(event.name, event.args);
              log('demo_tool', { channel: 'phone', callSid, tool: event.name, ok: result.ok });
              voice.sendToolResult(event.id, result);
            } else if (event.type === 'error') log('phone_voice_error', { callSid, message: event.message });
            else if (event.type === 'closed') end(event.reason === 'ended' ? 'ended' : 'voice_closed');
          },
        });
        log('phone_session_start', { callSid, direction: calls.get(callSid)?.direction });
      } else if (msg.event === 'media') {
        if (voice && msg.media?.payload) voice.sendAudio(msg.media.payload);
      } else if (msg.event === 'stop') {
        end('hangup');
      }
    });
    ws.on('close', () => end('hangup'));
    ws.on('error', () => end('stream_error'));
    setTimeout(() => { if (!startedAt) end('no_start'); }, 10000);
  }

  return { enabled, callMe, voiceWebhook, statusWebhook, handleStream };
}
