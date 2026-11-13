// Front Desk AI backend.
// - Issues short-lived voice tokens for the browser demo (the xAI key stays on the server).
// - Runs the demo calendar tools.
// - Bridges Twilio phone calls to the same voice agent.
// - Reports health, and can also serve the built website (single-container hosting).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
import { WebSocketServer } from 'ws';
import { loadConfig, phoneConfigured } from './config.js';
import { createVoiceProvider } from './providers/index.js';
import { buildInstructions, TOOLS, OPENING_PROMPT, businessKey } from './agent.js';
import { createCalendar } from './calendar.js';
import { createLimiter, log, usd } from './limits.js';
import { createPhone } from './phone.js';
import { createElevenLabs } from './tts/elevenlabs.js';
import { createSpokenSession } from './relay.js';

const HOUR = 3600000;
const DAY = 24 * HOUR;

export function createApp(cfg = loadConfig()) {
  const provider = createVoiceProvider(cfg);
  const tts = createElevenLabs(cfg);
  // With an ElevenLabs key the receptionist speaks with its voice: the browser then talks to this
  // server (which holds both keys) instead of straight to xAI.
  const relayed = () => cfg.tts.mode === 'elevenlabs' && tts.configured && provider.configured;
  const voiceName = () => (relayed() ? `elevenlabs:${tts.model}` : `${provider.name}:${cfg.voice.xai?.voice || ''}`);

  // One voice session held by the server, in whichever mode is set. Audio events carry base64 (native) or a Buffer (relay).
  const openVoice = ({ instructions, format, onEvent }) => (relayed()
    ? createSpokenSession({ provider, tts, format, instructions, tools: TOOLS, openingPrompt: OPENING_PROMPT, onEvent })
    : provider.connectServerSession({ instructions, tools: TOOLS, format, openingPrompt: OPENING_PROMPT, onEvent }));
  const limiter = createLimiter();
  const sessions = new Map(); // browser demo sessions
  const active = new Set();   // every live voice session, browser or phone

  const slots = {
    available: () => active.size < cfg.demo.maxConcurrent,
    acquire(id) { if (active.size >= cfg.demo.maxConcurrent) return false; active.add(id); return true; },
    release(id) { active.delete(id); },
  };
  const phone = createPhone({ cfg, provider, limiter, slots, openVoice });

  // ---------------------------------------------------------------- helpers
  const clientIp = (req) => {
    const forwarded = cfg.trustProxy ? String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() : '';
    return forwarded || req.socket.remoteAddress || 'unknown';
  };
  const corsHeaders = (req) => {
    const origin = req.headers.origin;
    if (!origin) return {};
    const allowed = cfg.allowedOrigins.includes('*') || cfg.allowedOrigins.includes(origin) || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
    return allowed ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '600' } : {};
  };
  const send = (req, res, status, body, headers = {}) => {
    const isJson = typeof body === 'object' && body !== null && !Buffer.isBuffer(body);
    const payload = isJson ? JSON.stringify(body) : body;
    res.writeHead(status, { 'Content-Type': isJson ? 'application/json; charset=utf-8' : 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...corsHeaders(req), ...headers });
    res.end(payload);
  };
  const readBody = (req, limit = 16 * 1024) => new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > limit) { reject(Object.assign(new Error('Body too large'), { status: 413 })); req.destroy(); return; }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    req.on('error', reject);
  });
  const readJson = async (req) => { try { return JSON.parse((await readBody(req)) || '{}'); } catch (e) { if (e.status) throw e; return {}; } };
  const readForm = async (req) => Object.fromEntries(new URLSearchParams(await readBody(req)));

  // ---------------------------------------------------------------- browser demo sessions
  function endSession(id, reason) {
    const session = sessions.get(id);
    if (!session) return false;
    sessions.delete(id);
    clearTimeout(session.timer);
    slots.release(`web:${id}`);
    const spoken = session.voice?.stats ? session.voice.stats() : null;
    if (session.voice) session.voice.close();
    if (session.ws) { try { session.ws.close(1000); } catch { /* already closed */ } }
    const seconds = Math.min(cfg.demo.maxSeconds + 30, Math.round((Date.now() - session.startedAt) / 1000));
    log('demo_session_end', {
      sessionId: id, business: session.calendar.business, reason, seconds,
      voiceUsd: usd(seconds, cfg.voice.usdPerMinute),
      ...(spoken ? { ttsCharacters: spoken.characters, ttsUsd: Math.round(spoken.characters * cfg.tts.elevenlabs.usdPer1kChars * 10) / 10000, firstAudioMs: spoken.firstAudioMs.slice(0, 6) } : {}),
      bookings: session.calendar.bookings().length,
    });
    return true;
  }

  async function startSession(req, res) {
    const body = await readJson(req);
    const business = businessKey(String(body.business || ''));
    if (!provider.configured) {
      return send(req, res, 503, { code: 'not_configured', message: 'The live demo is not available right now.' });
    }
    const ip = clientIp(req);
    if (!slots.available()) {
      return send(req, res, 429, { code: 'busy', message: 'All demo lines are busy. Try again in a few minutes.', retryAfterSeconds: 120 }, { 'Retry-After': '120' });
    }
    if (!limiter.peek('demo-day', cfg.demo.perDay, DAY)) {
      return send(req, res, 429, { code: 'daily_limit', message: 'The demo has reached its limit for today. Please book a free demo instead.', retryAfterSeconds: 3600 }, { 'Retry-After': '3600' });
    }
    const perIp = limiter.take(`demo-ip:${ip}`, cfg.demo.perIpPerHour, HOUR);
    if (!perIp.ok) {
      return send(req, res, 429, { code: 'rate_limited', message: 'You have used your demo calls for now. Try again later.', retryAfterSeconds: perIp.retryAfterSeconds }, { 'Retry-After': String(perIp.retryAfterSeconds) });
    }
    limiter.take('demo-day', cfg.demo.perDay, DAY);

    const id = crypto.randomUUID();
    if (!slots.acquire(`web:${id}`)) {
      return send(req, res, 429, { code: 'busy', message: 'All demo lines are busy. Try again in a few minutes.', retryAfterSeconds: 120 }, { 'Retry-After': '120' });
    }
    try {
      const instructions = buildInstructions({ business, channel: 'browser', maxSeconds: cfg.demo.maxSeconds });
      const token = crypto.randomBytes(24).toString('base64url');
      const connection = relayed()
        ? { protocol: 'relay', path: '/api/demo/stream', token, sampleRate: 24000 }
        : await provider.createBrowserSession({ instructions, tools: TOOLS, ttlSeconds: cfg.demo.maxSeconds + 60 });
      const session = { startedAt: Date.now(), calendar: createCalendar({ business }), timer: null, token, instructions, ws: null, voice: null };
      session.timer = setTimeout(() => endSession(id, 'expired'), (cfg.demo.maxSeconds + 30) * 1000);
      sessions.set(id, session);
      log('demo_session_start', { sessionId: id, business, provider: provider.name, voice: voiceName() });
      return send(req, res, 200, { sessionId: id, business, maxSeconds: cfg.demo.maxSeconds, provider: provider.name, openingPrompt: OPENING_PROMPT, connection });
    } catch (error) {
      slots.release(`web:${id}`);
      log('demo_session_error', { message: error.message, status: error.status });
      return send(req, res, 502, { code: 'provider_error', message: 'The live demo could not start. Please try again in a moment.' });
    }
  }

  async function runTool(req, res) {
    const body = await readJson(req);
    const session = sessions.get(String(body.sessionId || ''));
    if (!session) return send(req, res, 410, { code: 'session_ended', message: 'This demo session has ended.' });
    if (!limiter.take(`tool:${body.sessionId}`, 30, HOUR).ok) return send(req, res, 429, { code: 'rate_limited', message: 'Too many requests.' });
    const result = session.calendar.run(String(body.name || ''), body.args && typeof body.args === 'object' ? body.args : {});
    log('demo_tool', { channel: 'browser', sessionId: body.sessionId, tool: body.name, ok: result.ok });
    return send(req, res, 200, { result, events: session.calendar.events() });
  }

  // ---------------------------------------------------------------- static files
  const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.mp3': 'audio/mpeg', '.xml': 'application/xml; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.webmanifest': 'application/manifest+json' };
  const gzipCache = new Map();
  const hasStatic = fs.existsSync(path.join(cfg.staticDir, 'index.html'));

  function serveStatic(req, res, pathname) {
    if (!hasStatic) return send(req, res, 404, { code: 'not_found', message: 'Not found' });
    let rel = decodeURIComponent(pathname);
    if (rel.endsWith('/')) rel += 'index.html';
    const file = path.join(cfg.staticDir, path.normalize(rel));
    if (!file.startsWith(cfg.staticDir) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
      return send(req, res, 404, 'Not found');
    }
    const ext = path.extname(file).toLowerCase();
    const headers = {
      'Content-Type': TYPES[ext] || 'application/octet-stream',
      'Cache-Control': ext === '.html' ? 'no-cache' : (/\/(assets|fonts|img)\//.test(pathname) ? 'public, max-age=31536000, immutable' : 'public, max-age=3600'),
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    };
    const compressible = /\.(html|js|css|json|svg|xml|txt|webmanifest)$/.test(ext);
    if (compressible && /\bgzip\b/.test(String(req.headers['accept-encoding'] || ''))) {
      const stamp = `${file}:${fs.statSync(file).mtimeMs}`;
      if (!gzipCache.has(stamp)) gzipCache.set(stamp, zlib.gzipSync(fs.readFileSync(file)));
      res.writeHead(200, { ...headers, 'Content-Encoding': 'gzip', Vary: 'Accept-Encoding' });
      return res.end(req.method === 'HEAD' ? undefined : gzipCache.get(stamp));
    }
    const size = fs.statSync(file).size;
    const range = /^bytes=(\d*)-(\d*)$/.exec(String(req.headers.range || ''));
    if (range && (range[1] || range[2])) {
      const start = range[1] ? Number(range[1]) : Math.max(0, size - Number(range[2]));
      const end = range[1] && range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
      if (start > end || start >= size) { res.writeHead(416, { 'Content-Range': `bytes */${size}` }); return res.end(); }
      res.writeHead(206, { ...headers, 'Accept-Ranges': 'bytes', 'Content-Range': `bytes ${start}-${end}/${size}`, 'Content-Length': end - start + 1 });
      return req.method === 'HEAD' ? res.end() : fs.createReadStream(file, { start, end }).pipe(res);
    }
    res.writeHead(200, { ...headers, 'Accept-Ranges': 'bytes', 'Content-Length': size });
    return req.method === 'HEAD' ? res.end() : fs.createReadStream(file).pipe(res);
  }

  // ---------------------------------------------------------------- routes
  async function handle(req, res) {
    const url = new URL(req.url, 'http://local');
    const route = `${req.method} ${url.pathname}`;
    if (req.method === 'OPTIONS') return send(req, res, 204, '');

    switch (route) {
      case 'GET /api/health':
        return send(req, res, 200, {
          ok: true,
          voice: { provider: provider.name, configured: Boolean(provider.configured), speech: relayed() ? 'elevenlabs' : 'native', tts: { configured: tts.configured, model: relayed() ? tts.model : null } },
          phone: { configured: phone.enabled(), number: phone.enabled() ? cfg.phone.number : null },
          demo: { maxSeconds: cfg.demo.maxSeconds, activeSessions: active.size, maxConcurrent: cfg.demo.maxConcurrent },
          time: new Date().toISOString(),
        });
      case 'POST /api/demo/session':
        return startSession(req, res);
      case 'POST /api/demo/tool':
        return runTool(req, res);
      case 'POST /api/demo/session/end': {
        const body = await readJson(req);
        endSession(String(body.sessionId || ''), String(body.reason || 'ended').slice(0, 40));
        return send(req, res, 200, { ok: true });
      }
      case 'POST /api/demo/call-me': {
        const body = await readJson(req);
        const result = await phone.callMe({ phone: body.phone, business: body.business, ip: clientIp(req) });
        return send(req, res, result.status, result.body, result.body.retryAfterSeconds ? { 'Retry-After': String(result.body.retryAfterSeconds) } : {});
      }
      case 'POST /api/twilio/voice':
      case 'POST /api/twilio/status': {
        const params = await readForm(req);
        const args = { params, query: Object.fromEntries(url.searchParams), url: `${cfg.publicUrl}${url.pathname}${url.search}`, signature: req.headers['x-twilio-signature'] };
        const result = route.endsWith('voice') ? phone.voiceWebhook(args) : phone.statusWebhook(args);
        res.writeHead(result.status, { 'Content-Type': result.body.startsWith('<?xml') ? 'text/xml; charset=utf-8' : 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
        return res.end(result.body);
      }
      default:
    }
    if (url.pathname.startsWith('/api/')) return send(req, res, 404, { code: 'not_found', message: 'Not found' });
    if (req.method === 'GET' || req.method === 'HEAD') return serveStatic(req, res, url.pathname);
    return send(req, res, 405, { code: 'method_not_allowed', message: 'Method not allowed' });
  }

  const server = http.createServer((req, res) => {
    handle(req, res).catch((error) => {
      if (!res.headersSent) send(req, res, error.status || 500, { code: 'server_error', message: error.status === 413 ? 'Request too large.' : 'Something went wrong.' });
      if (!error.status) log('server_error', { message: error.message, path: req.url });
    });
  });

  // ---------------------------------------------------------------- browser relay (ElevenLabs voice)
  // The browser streams microphone audio here (binary PCM16, 24 kHz). We send back the
  // receptionist's voice (binary PCM16, 24 kHz) and small JSON events for the screen.
  function handleRelay(ws, id, session) {
    session.ws = ws;
    const json = (o) => { if (ws.readyState === 1) ws.send(JSON.stringify(o)); };
    const voice = openVoice({
      instructions: session.instructions,
      format: 'pcm24',
      onEvent(event) {
        if (!sessions.has(id)) return;
        switch (event.type) {
          case 'ready': json({ type: 'ready' }); break;
          case 'audio': if (ws.readyState === 1) ws.send(event.audio); break;
          case 'agent_text': json({ type: 'agent_text', text: event.text, final: event.final }); break;
          case 'user_transcript': json({ type: 'user_text', text: event.text }); break;
          case 'interrupt': json({ type: 'interrupt' }); break;
          case 'tool_call': {
            json({ type: 'tool', name: event.name });
            const result = limiter.take(`tool:${id}`, 30, HOUR).ok ? session.calendar.run(event.name, event.args) : { ok: false, error: 'Too many requests.' };
            log('demo_tool', { channel: 'browser', sessionId: id, tool: event.name, ok: result.ok });
            json({ type: 'events', events: session.calendar.events() });
            voice.sendToolResult(event.id, result);
            break;
          }
          case 'error':
            log('demo_voice_error', { sessionId: id, message: event.message, code: event.code });
            break;
          case 'closed':
            json({ type: 'closed', reason: 'voice_closed' });
            endSession(id, 'voice_closed');
            break;
          default:
        }
      },
    });
    session.voice = voice;
    ws.on('message', (data, isBinary) => {
      if (isBinary) { voice.sendAudio(Buffer.from(data).toString('base64')); return; }
      try { if (JSON.parse(data.toString()).type === 'end') endSession(id, 'user'); } catch { /* ignore */ }
    });
    ws.on('close', () => endSession(id, 'ended'));
    ws.on('error', () => endSession(id, 'stream_error'));
  }

  // WebSocket upgrades: Twilio media streams, and the browser relay.
  const wss = new WebSocketServer({ noServer: true, maxPayload: 64 * 1024 });
  server.on('upgrade', (req, socket, head) => {
    const url = new URL(req.url, 'http://local');
    if (url.pathname === '/api/twilio/stream' && phoneConfigured(cfg)) {
      wss.handleUpgrade(req, socket, head, (ws) => phone.handleStream(ws));
      return;
    }
    if (url.pathname === '/api/demo/stream') {
      const id = url.searchParams.get('session') || '';
      const session = sessions.get(id);
      const given = Buffer.from(url.searchParams.get('token') || '');
      const ok = session && !session.ws && relayed() && given.length === Buffer.from(session.token).length && crypto.timingSafeEqual(given, Buffer.from(session.token));
      if (!ok) { socket.destroy(); return; }
      wss.handleUpgrade(req, socket, head, (ws) => handleRelay(ws, id, session));
      return;
    }
    socket.destroy();
  });

  const sweeper = setInterval(() => limiter.sweep(), 10 * 60000);
  sweeper.unref();

  return {
    server,
    cfg,
    close: () => new Promise((resolve) => {
      clearInterval(sweeper);
      for (const id of [...sessions.keys()]) endSession(id, 'shutdown');
      wss.clients.forEach((ws) => ws.terminate());
      server.close(() => resolve());
      server.closeAllConnections?.();
    }),
  };
}

// Start the server when this file is run directly (npm start).
if (process.argv[1] && fs.realpathSync(process.argv[1]) === fs.realpathSync(new URL(import.meta.url).pathname)) {
  const app = createApp();
  app.server.listen(app.cfg.port, () => {
    log('server_started', { port: app.cfg.port, voiceProvider: app.cfg.voice.provider, voiceConfigured: Boolean(createVoiceProvider(app.cfg).configured), speech: app.cfg.tts.mode, ttsConfigured: Boolean(app.cfg.tts.elevenlabs.apiKey), phoneConfigured: phoneConfigured(app.cfg), publicUrl: app.cfg.publicUrl || null });
  });
  const stop = () => app.close().then(() => process.exit(0));
  process.on('SIGTERM', stop);
  process.on('SIGINT', stop);
}
