// Reads every setting from environment variables. Nothing secret is hard-coded.
// See .env.example for what each variable does.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

// Load a local .env file when there is one (local runs). Hosts such as Railway inject variables directly.
const envFile = path.join(here, '..', '.env');
if (fs.existsSync(envFile) && typeof process.loadEnvFile === 'function') {
  try { process.loadEnvFile(envFile); } catch { /* ignore a malformed .env, variables may still come from the host */ }
}

const num = (value, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) && value !== undefined && value !== '' ? n : fallback;
};
const list = (value) => String(value || '').split(',').map((s) => s.trim()).filter(Boolean);
const real = (value) => {
  const v = String(value || '').trim();
  return v && !/^(your_|placeholder|changeme|xxx)/i.test(v) ? v : '';
};

export function loadConfig(env = process.env) {
  const publicUrl = String(env.PUBLIC_URL || '').replace(/\/+$/, '');
  return {
    port: num(env.PORT, 8787),
    publicUrl,
    allowedOrigins: list(env.ALLOWED_ORIGINS),
    trustProxy: env.TRUST_PROXY !== 'false',
    staticDir: env.STATIC_DIR || path.join(here, '..', 'web', 'dist'),

    voice: {
      provider: (env.VOICE_PROVIDER || 'xai').toLowerCase(),
      usdPerMinute: num(env.VOICE_USD_PER_MINUTE, 0.08),
      xai: {
        apiKey: real(env.XAI_API_KEY),
        apiBase: (env.XAI_API_BASE || 'https://api.x.ai/v1').replace(/\/+$/, ''),
        realtimeUrl: env.XAI_REALTIME_URL || 'wss://api.x.ai/v1/realtime',
        model: env.XAI_VOICE_MODEL || 'grok-voice-3.0',
        voice: env.XAI_VOICE || 'ara',
      },
    },

    // Who speaks the receptionist's words. "elevenlabs": Grok listens, thinks and books, and an
    // ElevenLabs South African voice says the reply (more natural, ranked top for naturalness).
    // "native": Grok's own voice, straight from the browser to xAI (cheaper, a little faster).
    // Default: elevenlabs when its key is set, otherwise native.
    tts: {
      mode: (env.VOICE_TTS || (real(env.ELEVENLABS_API_KEY) ? 'elevenlabs' : 'native')).toLowerCase(),
      elevenlabs: {
        apiKey: real(env.ELEVENLABS_API_KEY),
        apiBase: (env.ELEVENLABS_API_BASE || 'https://api.elevenlabs.io').replace(/\/+$/, ''),
        model: env.ELEVENLABS_MODEL || 'eleven_v4_turbo',
        voiceId: env.ELEVENLABS_VOICE_ID || 'gsm4lUH9bnZ3pjR1Pw7w', // "Claire", South African English
        usdPer1kChars: num(env.ELEVENLABS_USD_PER_1K_CHARS, 0.04),
      },
    },

    demo: {
      maxSeconds: num(env.DEMO_MAX_SECONDS, 180),
      maxConcurrent: num(env.DEMO_MAX_CONCURRENT, 3),
      perIpPerHour: num(env.DEMO_SESSIONS_PER_IP_PER_HOUR, 5),
      perDay: num(env.DEMO_SESSIONS_PER_DAY, 200),
    },

    phone: {
      accountSid: real(env.TWILIO_ACCOUNT_SID),
      authToken: real(env.TWILIO_AUTH_TOKEN),
      number: real(env.TWILIO_PHONE_NUMBER),
      apiBase: (env.TWILIO_API_BASE || 'https://api.twilio.com').replace(/\/+$/, ''),
      perNumberPerHour: num(env.PHONE_CALLS_PER_NUMBER_PER_HOUR, 1),
      perIpPerHour: num(env.PHONE_CALLS_PER_IP_PER_HOUR, 3),
      usdPerMinute: num(env.PHONE_USD_PER_MINUTE, 0),
      allowedPrefixes: list(env.PHONE_ALLOWED_PREFIXES || '+27'),
    },
  };
}

export const phoneConfigured = (cfg) => Boolean(cfg.phone.accountSid && cfg.phone.authToken && cfg.phone.number && cfg.publicUrl);
