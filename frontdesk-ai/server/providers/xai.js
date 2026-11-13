// xAI Grok voice provider (Speech to Speech API).
// Checked against docs.x.ai: endpoint wss://api.x.ai/v1/realtime?model=grok-voice-latest,
// ephemeral tokens from POST /v1/realtime/client_secrets, session set up with session.update,
// audio set under session.audio.{input,output}.format, OpenAI Realtime event shapes.
import WebSocket from 'ws';

const FORMATS = {
  pcm24: { type: 'audio/pcm', rate: 24000 }, // browser microphone and speaker
  pcmu: { type: 'audio/pcmu' },              // G.711 mu-law at 8 kHz, what phone lines (Twilio) use
};

export function createXaiProvider(cfg) {
  const { apiKey, apiBase, realtimeUrl, model, voice } = cfg.voice.xai;
  const url = `${realtimeUrl}?model=${encodeURIComponent(model)}`;

  const sessionUpdate = ({ instructions, tools, format }) => ({
    type: 'session.update',
    session: {
      instructions,
      voice,
      turn_detection: { type: 'server_vad' },
      tools,
      audio: { input: { format: FORMATS[format] }, output: { format: FORMATS[format] } },
    },
  });

  return {
    name: 'xai',
    configured: Boolean(apiKey),

    // For the browser demo: a short-lived token, so the real API key never leaves the server.
    async createBrowserSession({ instructions, tools, ttlSeconds }) {
      const res = await fetch(`${apiBase}/realtime/client_secrets`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ expires_after: { seconds: ttlSeconds } }),
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) {
        const detail = (await res.text()).slice(0, 300);
        const error = new Error(`xAI refused to issue a client secret (${res.status})`);
        error.status = res.status;
        error.detail = detail;
        throw error;
      }
      const data = await res.json();
      const secret = data.value || data.client_secret?.value;
      if (!secret) throw new Error('xAI did not return a client secret');
      return {
        protocol: 'openai-realtime',
        url,
        subprotocols: [`xai-client-secret.${secret}`],
        sessionUpdate: sessionUpdate({ instructions, tools, format: 'pcm24' }),
        sampleRate: 24000,
      };
    },

    // For phone calls: the server itself holds the voice session and reports neutral events.
    // Events: ready, audio, interrupt, user_transcript, agent_transcript, tool_call, error, closed.
    connectServerSession({ instructions, tools, format = 'pcmu', openingPrompt, onEvent }) {
      const ws = new WebSocket(url, { headers: { Authorization: `Bearer ${apiKey}` } });
      let open = false;
      let closed = false;
      const send = (payload) => { if (open && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(payload)); };

      ws.on('open', () => {
        open = true;
        send(sessionUpdate({ instructions, tools, format }));
        if (openingPrompt) {
          send({ type: 'conversation.item.create', item: { type: 'message', role: 'user', content: [{ type: 'input_text', text: openingPrompt }] } });
          send({ type: 'response.create' });
        }
        onEvent({ type: 'ready' });
      });
      ws.on('message', (raw, isBinary) => {
        if (isBinary) return;
        let event;
        try { event = JSON.parse(raw.toString()); } catch { return; }
        switch (event.type) {
          case 'response.output_audio.delta':
          case 'response.audio.delta':
            if (event.delta) onEvent({ type: 'audio', audio: event.delta });
            break;
          case 'input_audio_buffer.speech_started':
            onEvent({ type: 'interrupt' });
            break;
          case 'conversation.item.input_audio_transcription.completed':
            if (event.transcript) onEvent({ type: 'user_transcript', text: event.transcript });
            break;
          case 'response.output_audio_transcript.done':
          case 'response.audio_transcript.done':
            if (event.transcript) onEvent({ type: 'agent_transcript', text: event.transcript });
            break;
          case 'response.function_call_arguments.done': {
            let args = {};
            try { args = JSON.parse(event.arguments || '{}'); } catch { /* leave empty */ }
            onEvent({ type: 'tool_call', id: event.call_id, name: event.name, args });
            break;
          }
          case 'error':
            onEvent({ type: 'error', message: event.error?.message || 'Voice provider error', code: event.error?.type });
            break;
          default:
        }
      });
      const finish = (reason) => { if (!closed) { closed = true; open = false; onEvent({ type: 'closed', reason }); } };
      ws.on('close', (code) => finish(`closed:${code}`));
      ws.on('error', (err) => { onEvent({ type: 'error', message: err.message }); finish('error'); });

      return {
        sendAudio: (base64) => send({ type: 'input_audio_buffer.append', audio: base64 }),
        sendToolResult(callId, output) {
          send({ type: 'conversation.item.create', item: { type: 'function_call_output', call_id: callId, output: JSON.stringify(output) } });
          send({ type: 'response.create' });
        },
        close() { try { ws.close(1000); } catch { /* already closed */ } finish('ended'); },
      };
    },
  };
}
