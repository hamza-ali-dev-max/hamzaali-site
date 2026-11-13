// Voice provider registry. To add Retell, Bland or Vapi later, write one file next to xai.js
// that exports the same three things and register it here. Nothing else on the server changes.
//
// A provider is an object with:
//   name                     short id, shown by /api/health
//   configured               true when its credentials are present
//   createBrowserSession()   returns what the browser needs to connect: { protocol, url, subprotocols, sessionUpdate, sampleRate }
//   connectServerSession()   opens a server-side session for phone calls and reports neutral events (see xai.js)
//
// The frontend picks its connection code by the "protocol" field, so a provider that speaks the
// OpenAI Realtime protocol needs no frontend change at all. A provider with its own browser SDK
// needs one small adapter in web/src/voice.js.
import { createXaiProvider } from './xai.js';

const REGISTRY = {
  xai: createXaiProvider,
};

export function createVoiceProvider(cfg) {
  const factory = REGISTRY[cfg.voice.provider];
  if (!factory) {
    return { name: cfg.voice.provider, configured: false, unknown: true };
  }
  return factory(cfg);
}
