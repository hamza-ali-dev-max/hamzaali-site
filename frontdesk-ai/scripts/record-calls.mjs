// Records the sample calls on the website from the REAL demo receptionist: Grok listens, decides
// and books (real tool calls against the demo diary), and the receptionist's words are spoken by
// the same ElevenLabs voice the live demo uses. Callers are other South African ElevenLabs voices.
// Writes the MP3s into web/public/audio and the captions, events and waveforms into web/src/calls.json.
//
// Usage:  node scripts/record-calls.mjs [callId ...]        (needs XAI_API_KEY and ELEVENLABS_API_KEY in .env, and ffmpeg)
// Costs a few US cents per call. Re-run after changing the receptionist's voice or instructions.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import WebSocket from 'ws';
import { loadConfig } from '../server/config.js';
import { buildInstructions, TOOLS, OPENING_PROMPT, BUSINESSES } from '../server/agent.js';
import { createCalendar } from '../server/calendar.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const outAudio = path.join(root, 'web', 'public', 'audio');
const outJson = path.join(root, 'web', 'src', 'calls.json');
const only = process.argv.slice(2);
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'fd-rec-'));
const cfg = loadConfig();
const KEY = cfg.voice.xai.apiKey;
const VOICE = cfg.voice.xai.voice;
const MODEL = cfg.voice.xai.model;
const EL_KEY = process.env.ELEVENLABS_API_KEY || 'set-by-proxy';
const AGENT_VOICE = cfg.tts.elevenlabs.voiceId;
const AGENT_MODEL = cfg.tts.elevenlabs.model;
if (!KEY) { console.error('Set XAI_API_KEY in .env first.'); process.exit(1); }
// Optional: route through an HTTPS proxy when one is set (some sandboxes need it).
let agent;
if (process.env.HTTPS_PROXY) {
  try {
    const { HttpsProxyAgent } = await import('https-proxy-agent');
    const ca = process.env.NODE_EXTRA_CA_CERTS && fs.existsSync(process.env.NODE_EXTRA_CA_CERTS) ? fs.readFileSync(process.env.NODE_EXTRA_CA_CERTS) : undefined;
    agent = new HttpsProxyAgent(process.env.HTTPS_PROXY, { ca });
  } catch { /* no proxy module: connect directly */ }
}
const RATE = 24000;

const CALLER_VOICES = { thandi: 'BcpjRWrYhDBHmOnetmBl', nicole: 'miTHcVblZMXYolDQgUgx', martin: 'jUPpyDXEJa6IgBrnTet4' };

// "when" picks a line when the receptionist's last words match; lines without "when" go in order.
const CALLS = [
  {
    id: 'dentist', business: 'dentist', voice: 'thandi',
    now: '2026-11-17T17:02:00Z', when: 'Tuesday 19:02', situation: 'The practice is closed.',
    title: 'A cracked tooth, after hours',
    lines: [
      { text: 'Hi. I cracked a tooth at supper and it is quite sore. Can someone see me tomorrow morning?' },
      { when: /(which|what).*(suit|work|prefer)|would you like|shall i|eight|nine|ten|half past/i, text: 'The earliest one, please.' },
      { when: /name/i, text: 'It is Aisha Jacobs.' },
    ],
  },
  {
    id: 'salon', business: 'salon', voice: 'nicole',
    now: '2026-11-21T08:40:00Z', when: 'Saturday 10:40', situation: 'Both stylists have clients in the chair.',
    title: 'A price and a booking, on a busy Saturday',
    lines: [
      { text: 'Hi there. How much is a cut and blow-dry? And do you have anything next Saturday morning?' },
      { when: /(which|what).*(suit|work|prefer)|would you like|shall i|eight|nine|ten|eleven|half past|o.clock/i, text: 'The first one sounds great.' },
      { when: /name/i, text: 'It is Lerato. Lerato Smith.' },
    ],
  },
  {
    id: 'plumber', business: 'plumber', voice: 'martin',
    override: { transfer_to_owner: () => ({ ok: true, status: 'transferring', note: 'The line to Thabo is ringing now. Tell the caller in one short sentence that you are putting them through to Thabo, and that he also has their details on WhatsApp.' }) },
    now: '2026-11-22T19:15:00Z', when: 'Sunday 21:15', situation: 'Thabo is off duty.',
    title: 'A burst geyser on a Sunday night',
    lines: [
      { text: 'Hi, sorry to phone so late. My geyser has burst and there is water coming through the ceiling. Can someone come out?' },
      { when: /name|who|number/i, text: 'It is Pieter van Wyk, in Durbanville. My number is 082 555 0147.' },
    ],
  },
];

const run = (cmd, args) => execFileSync(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] });
const seconds = (file) => Number(run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]).toString().trim());

// The receptionist's words, spoken by the live demo's voice (16-bit PCM, 24 kHz).
function agentSpeech(text, previousText, file) {
  const body = JSON.stringify({ text, model_id: AGENT_MODEL, ...(previousText ? { previous_text: previousText } : {}) });
  const code = run('curl', ['-sS', '-m', '120', '-X', 'POST', `https://api.elevenlabs.io/v1/text-to-speech/${AGENT_VOICE}?output_format=pcm_24000`, '-H', `xi-api-key: ${EL_KEY}`, '-H', 'Content-Type: application/json', '-d', body, '-o', file, '-w', '%{http_code}']).toString();
  if (code !== '200') throw new Error(`Agent TTS failed ${code}: ${fs.readFileSync(file, 'utf8').slice(0, 200)}`);
  return fs.readFileSync(file);
}

function tts(voice, text, file, model = 'eleven_v4') {
  if (fs.existsSync(file) && fs.statSync(file).size > 2000) return;
  const body = JSON.stringify({ text, model_id: model, voice_settings: { stability: 0.5, similarity_boost: 0.8 } });
  const code = run('curl', ['-sS', '-m', '120', '-X', 'POST', `https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=mp3_44100_128`, '-H', `xi-api-key: ${EL_KEY}`, '-H', 'Content-Type: application/json', '-d', body, '-o', file, '-w', '%{http_code}']).toString();
  if (code !== '200') throw new Error(`TTS failed ${code}: ${fs.readFileSync(file, 'utf8').slice(0, 200)}`);
}

async function record(call) {
  const b = BUSINESSES[call.business];
  const fixedNow = new Date(call.now);
  const calendar = createCalendar({ business: call.business, now: () => fixedNow });
  const ws = new WebSocket(`${cfg.voice.xai.realtimeUrl}?model=${encodeURIComponent(MODEL)}`, { headers: { Authorization: `Bearer ${KEY}` }, agent });
  const send = (o) => ws.send(JSON.stringify(o));
  const turns = []; // { who, text, pcm, events }
  let current = null;
  let resolveTurn = null;
  let pendingEvents = [];

  const waitForAgentTurn = () => new Promise((resolve) => { resolveTurn = resolve; });
  const startAgent = () => { current = { who: 'ai', text: '', chunks: [], events: pendingEvents }; pendingEvents = []; };

  ws.on('message', (raw, isBinary) => {
    if (isBinary) return;
    const e = JSON.parse(raw.toString());
    if (e.type === 'response.created') startAgent();
    else if (e.type === 'response.output_audio.delta') { if (!current) startAgent(); current.chunks.push(Buffer.from(e.delta, 'base64')); }
    else if (e.type === 'response.output_audio_transcript.done') { if (current) current.text = (current.text + ' ' + (e.transcript || '')).trim(); }
    else if (e.type === 'conversation.item.input_audio_transcription.completed') turns.push({ who: 'heard', text: e.transcript });
    else if (e.type === 'error') console.log('   provider error:', JSON.stringify(e.error));
    else if (e.type === 'response.function_call_arguments.done') {
      const args = JSON.parse(e.arguments || '{}');
      const logged = calendar.run(e.name, args);
      const result = call.override?.[e.name] ? call.override[e.name](args) : logged;
      console.log(`   tool ${e.name}(${JSON.stringify(args)}) -> ${result.ok ? 'ok' : result.error}`);
      pendingEvents.push({ type: e.name, args, result });
      send({ type: 'conversation.item.create', item: { type: 'function_call_output', call_id: e.call_id, output: JSON.stringify(result) } });
      send({ type: 'response.create' });
      current._tool = true;
    } else if (e.type === 'response.done') {
      if (current) {
        const pcm = Buffer.concat(current.chunks);
        if (pcm.length > 2400 || current.text) turns.push({ who: 'ai', text: current.text, pcm, events: current.events });
        else if (current.events.length) pendingEvents.push(...current.events);
        const hadTool = (e.response?.output || []).some((o) => o.type === 'function_call');
        current = null;
        if (!hadTool && resolveTurn) { const r = resolveTurn; resolveTurn = null; r(); }
      }
    }
  });
  await new Promise((resolve, reject) => { ws.on('open', resolve); ws.on('error', reject); });
  console.log('   connected');
  ws.on('message', (raw, bin) => { if (!bin && process.env.DEBUG) { const e = JSON.parse(raw.toString()); if (!/delta/.test(e.type)) console.log('     <', e.type); } });
  send({ type: 'session.update', session: { instructions: buildInstructions({ business: call.business, channel: 'phone', now: fixedNow, sample: true }), voice: VOICE, turn_detection: null, temperature: 0.6, tools: TOOLS, audio: { input: { format: { type: 'audio/pcm', rate: RATE } }, output: { format: { type: 'audio/pcm', rate: RATE } } } } });
  send({ type: 'conversation.item.create', item: { type: 'message', role: 'user', content: [{ type: 'input_text', text: OPENING_PROMPT }] } });
  send({ type: 'response.create' });
  await waitForAgentTurn();

  const used = new Set();
  for (let guard = 0; guard < 8 && used.size < call.lines.length; guard += 1) {
    const lastAgent = [...turns].reverse().find((t) => t.who === 'ai')?.text || '';
    let index = call.lines.findIndex((l, i) => !used.has(i) && l.when && l.when.test(lastAgent));
    if (index < 0) index = call.lines.findIndex((l, i) => !used.has(i) && !l.when);
    if (index < 0) index = call.lines.findIndex((l, i) => !used.has(i));
    used.add(index);
    const line = call.lines[index];
    const mp3 = path.join(TMP, `${call.id}-${index}.mp3`);
    tts(CALLER_VOICES[call.voice], line.text, mp3, call.ttsModel);
    const pcmFile = path.join(TMP, `${call.id}-${index}.pcm`);
    run('ffmpeg', ['-y', '-loglevel', 'error', '-i', mp3, '-af', 'silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse', '-ac', '1', '-ar', String(RATE), '-f', 's16le', pcmFile]);
    const pcm = fs.readFileSync(pcmFile);
    turns.push({ who: 'caller', text: line.text, pcm, file: pcmFile });
    const wait = waitForAgentTurn();
    for (let i = 0; i < pcm.length; i += 4800) send({ type: 'input_audio_buffer.append', audio: pcm.subarray(i, i + 4800).toString('base64') });
    send({ type: 'input_audio_buffer.commit' });
    send({ type: 'response.create' });
    const timeout = new Promise((r) => setTimeout(() => r('timeout'), 40000));
    if ((await Promise.race([wait, timeout])) === 'timeout') throw new Error('no reply from the receptionist');
  }
  ws.close();
  // Replace Grok's own audio with the live demo's voice.
  let said = '';
  for (const [i, turn] of turns.entries()) {
    if (turn.who !== 'ai' || !turn.text) continue;
    turn.pcm = agentSpeech(turn.text, said.slice(-600), path.join(TMP, `${call.id}-agent-${i}.pcm`));
    said = `${said} ${turn.text}`;
  }
  return { call, b, turns };
}

function assemble({ call, b, turns }) {
  const parts = [];
  const lines = [];
  const events = [];
  let t = 0;
  const pushPcm = (pcm, gap) => {
    const file = path.join(TMP, `${call.id}-part-${parts.length}.pcm`);
    fs.writeFileSync(file, Buffer.concat([pcm, Buffer.alloc(Math.round(RATE * gap) * 2)]));
    parts.push(file);
    const start = t;
    t += pcm.length / 2 / RATE + gap;
    return start;
  };
  // Ringback tone first
  const ring = path.join(TMP, 'ring.pcm');
  run('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'lavfi', '-i', "aevalsrc='0.06*(sin(2*PI*400*t)+sin(2*PI*450*t))*max(0,min(1,min(mod(t,0.6),0.4-mod(t,0.6))*100))':d=1.0:s=24000", '-af', 'apad=pad_dur=0.5', '-ac', '1', '-ar', String(RATE), '-f', 's16le', ring]);
  pushPcm(fs.readFileSync(ring), 0);
  for (const turn of turns) {
    if (turn.who === 'heard') { const last = lines[lines.length - 1]; if (last && last.who === 'caller') last.heard = turn.text; continue; }
    if (turn.who === 'caller') {
      const filtered = path.join(TMP, `${call.id}-callerf-${lines.length}.pcm`);
      run('ffmpeg', ['-y', '-loglevel', 'error', '-f', 's16le', '-ar', String(RATE), '-ac', '1', '-i', turn.file, '-af', 'highpass=f=180,lowpass=f=4200,acompressor=threshold=-20dB:ratio=3,volume=1.1', '-f', 's16le', filtered]);
      const pcm = fs.readFileSync(filtered);
      const start = pushPcm(pcm, 0.3 + (lines.length % 3) * 0.08);
      lines.push({ who: 'caller', text: turn.text, t: Math.round(start * 10) / 10, d: Math.round((pcm.length / 2 / RATE) * 10) / 10 });
    } else {
      const start = pushPcm(turn.pcm, 0.28 + (lines.length % 2) * 0.1);
      for (const ev of turn.events || []) events.push({ type: ev.type, t: Math.round(start * 10) / 10, args: ev.args, result: ev.result });
      if (turn.text) lines.push({ who: 'ai', text: turn.text, t: Math.round(start * 10) / 10, d: Math.round((turn.pcm.length / 2 / RATE) * 10) / 10 });
    }
  }
  const joined = path.join(TMP, `${call.id}-joined.pcm`);
  fs.writeFileSync(joined, Buffer.concat(parts.map((p) => fs.readFileSync(p))));
  const out = path.join(outAudio, `call-${call.id}.mp3`);
  run('ffmpeg', ['-y', '-loglevel', 'error', '-f', 's16le', '-ar', String(RATE), '-ac', '1', '-i', joined, '-af', 'loudnorm=I=-18:TP=-2:LRA=11', '-ac', '1', '-ar', '44100', '-codec:a', 'libmp3lame', '-b:a', '64k', '-metadata', `title=Front Desk AI sample call: ${call.title}`, out]);
  // Waveform for the player: 72 bars, 0 to 1.
  const raw = run('ffmpeg', ['-loglevel', 'error', '-i', out, '-ac', '1', '-ar', '8000', '-f', 's16le', '-']);
  const samples = new Int16Array(raw.buffer, raw.byteOffset, Math.floor(raw.length / 2));
  const bars = 72;
  const step = Math.floor(samples.length / bars);
  const rms = Array.from({ length: bars }, (_, i) => { let sum = 0; for (let j = i * step; j < (i + 1) * step; j += 1) sum += samples[j] * samples[j]; return Math.sqrt(sum / step); });
  const top = Math.max(...rms) || 1;
  const peaks = rms.map((v) => Math.round(Math.max(0.08, v / top) * 100) / 100);
  return { id: call.id, business: call.business, voice: `elevenlabs:${AGENT_MODEL}`, brain: `xai:${MODEL}`, peaks, name: b.name, area: b.area, owner: b.owner, when: call.when, situation: call.situation, title: call.title, file: `audio/call-${call.id}.mp3`, duration: Math.round(seconds(out)), recorded: new Date().toISOString().slice(0, 10), lines, events };
}

const existingRaw = fs.existsSync(outJson) ? JSON.parse(fs.readFileSync(outJson, 'utf8')) : [];
const existing = existingRaw;
const results = [...existing];
for (const call of CALLS.filter((c) => !only.length || only.includes(c.id))) {
  console.log(`== ${call.id}`);
  const data = assemble(await record(call));
  const i = results.findIndex((r) => r.id === call.id);
  if (i >= 0) results[i] = data; else results.push(data);
  for (const l of data.lines) console.log(`   ${String(l.t).padStart(5)}s ${l.who === 'ai' ? 'AI    ' : 'CALLER'} ${l.text}${l.heard ? `   [heard: ${l.heard}]` : ''}`);
  for (const e of data.events) console.log(`   ${String(e.t).padStart(5)}s EVENT ${e.type} ${e.result.ok ? 'ok' : 'FAILED'}`);
  console.log(`   duration ${data.duration}s`);
}
results.sort((a, b) => CALLS.findIndex((c) => c.id === a.id) - CALLS.findIndex((c) => c.id === b.id));
fs.writeFileSync(outJson, JSON.stringify(results, null, 2));
