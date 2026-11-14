// Live voice demo client.
// The backend hands us a short-lived connection (never the real API key). We then talk to
// the voice provider directly from the browser: microphone in, speech out, transcript on screen.
//
// Providers are chosen by the "protocol" field the backend returns. "openai-realtime" covers
// xAI Grok voice (and anything else that speaks the OpenAI Realtime protocol). To support a
// provider with its own browser SDK later, add one more entry to ADAPTERS below.

const RATE = 24000; // PCM16 mono at 24 kHz, as the xAI docs recommend for browsers

const WORKLET = `
class MicCapture extends AudioWorkletProcessor {
  constructor() { super(); this.step = sampleRate / ${RATE}; this.pos = 0; this.out = new Int16Array(2400); this.n = 0; }
  process(inputs) {
    const input = inputs[0] && inputs[0][0];
    if (!input) return true;
    while (this.pos < input.length) {
      const i = Math.floor(this.pos);
      const a = input[i];
      const b = i + 1 < input.length ? input[i + 1] : a;
      const s = Math.max(-1, Math.min(1, a + (b - a) * (this.pos - i)));
      this.out[this.n++] = s < 0 ? s * 0x8000 : s * 0x7fff;
      if (this.n === this.out.length) { this.port.postMessage(this.out.slice(0).buffer, []); this.n = 0; }
      this.pos += this.step;
    }
    this.pos -= input.length;
    return true;
  }
}
registerProcessor('mic-capture', MicCapture);
`;

const toBase64 = (buffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(binary);
};
const fromBase64 = (text) => {
  const binary = atob(text);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
};

export const micSupported = () => Boolean(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && (window.AudioContext || window.webkitAudioContext) && window.AudioWorkletNode && window.WebSocket);

// ---- Adapter for the OpenAI Realtime protocol (xAI Grok voice) --------------------------
function openaiRealtime({ connection, openingPrompt, audio, on, runTool }) {
  const ws = new WebSocket(connection.url, connection.subprotocols);
  const send = (payload) => { if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(payload)); };
  let agentText = '';
  let closedByUs = false;

  ws.addEventListener('open', () => {
    send(connection.sessionUpdate);
    if (openingPrompt) {
      send({ type: 'conversation.item.create', item: { type: 'message', role: 'user', content: [{ type: 'input_text', text: openingPrompt }] } });
      send({ type: 'response.create' });
    }
    on.open();
  });
  ws.addEventListener('message', async (message) => {
    if (typeof message.data !== 'string') return;
    let event;
    try { event = JSON.parse(message.data); } catch { return; }
    switch (event.type) {
      case 'response.output_audio.delta':
      case 'response.audio.delta':
        if (event.delta) audio.play(fromBase64(event.delta));
        break;
      case 'response.output_audio_transcript.delta':
      case 'response.audio_transcript.delta':
        agentText += event.delta || '';
        on.agentText(agentText, false);
        break;
      case 'response.output_audio_transcript.done':
      case 'response.audio_transcript.done':
        on.agentText(event.transcript || agentText, true);
        agentText = '';
        break;
      case 'input_audio_buffer.speech_started':
        audio.stopPlayback(); // the visitor started talking: stop the agent mid-sentence
        on.userSpeaking();
        break;
      case 'conversation.item.input_audio_transcription.completed':
        if (event.transcript) on.userText(event.transcript.trim());
        break;
      case 'response.function_call_arguments.done': {
        on.tool(event.name);
        let args = {};
        try { args = JSON.parse(event.arguments || '{}'); } catch { /* keep empty */ }
        const result = await runTool(event.name, args);
        send({ type: 'conversation.item.create', item: { type: 'function_call_output', call_id: event.call_id, output: JSON.stringify(result) } });
        await audio.whenQuiet(); // docs: wait for the current speech to finish before asking for more
        send({ type: 'response.create' });
        break;
      }
      case 'error':
        on.providerError(event.error || {});
        break;
      default:
    }
  });
  ws.addEventListener('close', () => { if (!closedByUs) on.closed(); });
  ws.addEventListener('error', () => { /* a close event always follows */ });

  return {
    sendAudio: (pcm16) => send({ type: 'input_audio_buffer.append', audio: toBase64(pcm16) }),
    close() { closedByUs = true; try { ws.close(1000); } catch { /* already closed */ } },
  };
}

// ---- Adapter for our own server relay (Grok listens, an ElevenLabs voice speaks) -------
// Microphone audio goes up as binary PCM16; the receptionist's voice comes back the same way.
function relay({ connection, apiBase, sessionId, audio, on }) {
  const base = new URL(apiBase || window.location.origin, window.location.href);
  const url = new URL(connection.path, base);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  url.searchParams.set('session', sessionId);
  url.searchParams.set('token', connection.token);
  const ws = new WebSocket(url.toString());
  ws.binaryType = 'arraybuffer';
  let agentText = '';
  let closedByUs = false;
  let opened = false;

  ws.addEventListener('message', (message) => {
    if (typeof message.data !== 'string') { audio.play(new Uint8Array(message.data)); return; }
    let event;
    try { event = JSON.parse(message.data); } catch { return; }
    switch (event.type) {
      case 'ready':
        if (!opened) { opened = true; on.open(); }
        break;
      case 'agent_text':
        if (event.final) { on.agentText(event.text || agentText, true); agentText = ''; } else { agentText += event.text || ''; on.agentText(agentText, false); }
        break;
      case 'interrupt':
        audio.stopPlayback();
        on.userSpeaking();
        break;
      case 'user_text':
        if (event.text) on.userText(event.text.trim());
        break;
      case 'tool':
        on.tool(event.name);
        break;
      case 'events':
        if (on.events) on.events(event.events || []);
        break;
      default:
    }
  });
  ws.addEventListener('close', () => { if (!closedByUs) on.closed(); });
  ws.addEventListener('error', () => { /* a close event always follows */ });

  return {
    sendAudio: (pcm16) => { if (ws.readyState === WebSocket.OPEN) ws.send(pcm16); },
    close() {
      closedByUs = true;
      try { if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'end' })); ws.close(1000); } catch { /* already closed */ }
    },
  };
}

const ADAPTERS = { 'openai-realtime': openaiRealtime, relay };

// ---- Audio in and out -----------------------------------------------------------------
async function createAudio(stream) {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  let ctx;
  try { ctx = new Ctx({ sampleRate: RATE }); } catch { ctx = new Ctx(); }
  if (ctx.state === 'suspended') await ctx.resume();
  const moduleUrl = URL.createObjectURL(new Blob([WORKLET], { type: 'application/javascript' }));
  await ctx.audioWorklet.addModule(moduleUrl);
  URL.revokeObjectURL(moduleUrl);
  const source = ctx.createMediaStreamSource(stream);
  const capture = new AudioWorkletNode(ctx, 'mic-capture', { numberOfInputs: 1, numberOfOutputs: 0 });
  source.connect(capture);

  let playhead = 0;
  let playing = [];
  return {
    onChunk(handler) { capture.port.onmessage = (e) => handler(e.data); },
    play(bytes) {
      const samples = new Int16Array(bytes.buffer, bytes.byteOffset, Math.floor(bytes.byteLength / 2));
      if (!samples.length) return;
      const buffer = ctx.createBuffer(1, samples.length, RATE);
      const channel = buffer.getChannelData(0);
      for (let i = 0; i < samples.length; i += 1) channel[i] = samples[i] / 0x8000;
      const node = ctx.createBufferSource();
      node.buffer = buffer;
      node.connect(ctx.destination);
      playhead = Math.max(playhead, ctx.currentTime + 0.04);
      node.start(playhead);
      playhead += buffer.duration;
      playing.push(node);
      node.onended = () => { playing = playing.filter((n) => n !== node); };
    },
    stopPlayback() {
      playing.forEach((node) => { try { node.stop(); } catch { /* already stopped */ } });
      playing = [];
      playhead = 0;
    },
    whenQuiet() {
      const wait = Math.max(0, playhead - ctx.currentTime);
      return new Promise((resolve) => setTimeout(resolve, Math.min(wait, 15) * 1000));
    },
    close() {
      capture.port.onmessage = null;
      try { source.disconnect(); capture.disconnect(); } catch { /* fine */ }
      stream.getTracks().forEach((track) => track.stop());
      ctx.close().catch(() => {});
    },
  };
}

// ---- One demo call --------------------------------------------------------------------
// handlers: state(name, detail), timer(secondsLeft), agentText(text, final), userText(text), userSpeaking(), tool(name), events(list)
// Resolves to { end(reason) }. Rejects with an Error whose .code says what went wrong:
//   no_mic_support, mic_denied, not_configured, busy, rate_limited, daily_limit, network, provider_error
export async function startCall({ apiBase, business, handlers }) {
  const fail = (code, message) => Object.assign(new Error(message || code), { code });
  if (!micSupported()) throw fail('no_mic_support');

  // Ask for the microphone first, so a refused permission never uses up a demo session.
  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 } });
  } catch (error) {
    throw fail(error && (error.name === 'NotFoundError' || error.name === 'OverconstrainedError') ? 'no_mic_support' : 'mic_denied');
  }

  let session;
  try {
    const res = await fetch(`${apiBase}/api/demo/session`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ business }) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { stream.getTracks().forEach((t) => t.stop()); throw fail(data.code || 'provider_error', data.message); }
    session = data;
  } catch (error) {
    stream.getTracks().forEach((t) => t.stop());
    throw error.code ? error : fail('network');
  }

  const adapter = ADAPTERS[session.connection.protocol];
  let audio;
  try {
    if (!adapter) throw fail('provider_error', `No adapter for ${session.connection.protocol}`);
    audio = await createAudio(stream);
  } catch (error) {
    stream.getTracks().forEach((t) => t.stop());
    fetch(`${apiBase}/api/demo/session/end`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: session.sessionId, reason: 'client_error' }) }).catch(() => {});
    throw error.code ? error : fail('provider_error', error.message);
  }

  let ended = false;
  let link = null;
  let ticker = null;
  const deadline = Date.now() + session.maxSeconds * 1000;

  const end = (reason = 'user') => {
    if (ended) return;
    ended = true;
    clearInterval(ticker);
    window.removeEventListener('pagehide', onLeave);
    if (link) link.close();
    audio.close();
    const body = JSON.stringify({ sessionId: session.sessionId, reason });
    // sendBeacon still delivers when the tab is closing
    if (!(navigator.sendBeacon && navigator.sendBeacon(`${apiBase}/api/demo/session/end`, new Blob([body], { type: 'text/plain' })))) {
      fetch(`${apiBase}/api/demo/session/end`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {});
    }
    handlers.state('ended', reason);
  };
  const onLeave = () => end('left_page');
  window.addEventListener('pagehide', onLeave);

  const runTool = async (name, args) => {
    try {
      const res = await fetch(`${apiBase}/api/demo/tool`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId: session.sessionId, name, args }) });
      const data = await res.json();
      if (data.events && handlers.events) handlers.events(data.events);
      return data.result || { ok: false, error: data.message || 'The demo diary is not available.' };
    } catch {
      return { ok: false, error: 'The demo diary is not available right now.' };
    }
  };

  handlers.timer(session.maxSeconds);
  link = adapter({
    connection: session.connection,
    apiBase,
    sessionId: session.sessionId,
    openingPrompt: session.openingPrompt,
    audio,
    runTool,
    on: {
      events: handlers.events,
      open() {
        audio.onChunk((chunk) => link.sendAudio(chunk));
        ticker = setInterval(() => {
          const left = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
          handlers.timer(left);
          if (left <= 0) end('time_limit');
        }, 500);
        handlers.state('live');
      },
      agentText: handlers.agentText,
      userText: handlers.userText,
      userSpeaking: handlers.userSpeaking,
      tool: handlers.tool,
      providerError(error) { if (error.type === 'max_duration' || error.type === 'timeout') end('time_limit'); },
      closed() { end(Date.now() >= deadline - 1500 ? 'time_limit' : 'network'); },
    },
  });

  return { end, maxSeconds: session.maxSeconds };
}
