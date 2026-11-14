// Stand-ins for xAI and Twilio so the whole flow can be tested without real keys or real calls.
// The mock voice server speaks the same message shapes as the xAI Speech to Speech docs.
import http from 'node:http';
import { WebSocketServer } from 'ws';

const tone = (bytes) => Buffer.alloc(bytes, 0x7f).toString('base64');

export function startMockXai({ port = 0 } = {}) {
  const state = { ttsRequests: [], tokens: [], connections: [], sessionUpdates: [], audioChunks: 0, toolOutputs: [], authHeaders: [], twilioCalls: [] };
  const server = http.createServer((req, res) => {
    let body = '';
    req.on('data', (c) => { body += c; });
    req.on('end', () => {
      if (req.method === 'POST' && req.url === '/v1/realtime/client_secrets') {
        if (req.headers.authorization !== 'Bearer test-xai-key') { res.writeHead(401); res.end('{"error":"bad key"}'); return; }
        const value = `eph_${state.tokens.length + 1}`;
        state.tokens.push({ value, request: JSON.parse(body || '{}') });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ value, expires_at: Math.floor(Date.now() / 1000) + 240 }));
        return;
      }
      // Mock of ElevenLabs streaming text to speech. Sends audio in odd-sized pieces, like a real stream can.
      const tts = /^\/v1\/text-to-speech\/([^/]+)\/stream\?output_format=(\w+)$/.exec(req.url);
      if (req.method === 'POST' && tts) {
        const request = JSON.parse(body || '{}');
        state.ttsRequests.push({ voice: tts[1], format: tts[2], key: req.headers['xi-api-key'], ...request });
        if (req.headers['xi-api-key'] !== 'test-el-key') { res.writeHead(401); res.end('{"detail":"bad key"}'); return; }
        res.writeHead(200, { 'Content-Type': 'audio/pcm' });
        const size = tts[2] === 'ulaw_8000' ? 801 : 4801;
        res.write(Buffer.alloc(size, 1));
        setTimeout(() => { res.end(Buffer.alloc(size, 2)); }, 10);
        return;
      }
      // Mock of the Twilio REST "create call" endpoint.
      if (req.method === 'POST' && /\/2010-04-01\/Accounts\/[^/]+\/Calls\.json$/.test(req.url)) {
        const form = Object.fromEntries(new URLSearchParams(body));
        state.twilioCalls.push({ form, auth: req.headers.authorization });
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ sid: `CA${String(state.twilioCalls.length).padStart(32, '0')}`, status: 'queued' }));
        return;
      }
      res.writeHead(404); res.end();
    });
  });

  const wss = new WebSocketServer({
    server,
    path: '/v1/realtime',
    handleProtocols: (protocols) => [...protocols].find((p) => p.startsWith('xai-client-secret.')) || false,
  });
  wss.on('connection', (ws, req) => {
    const protocol = ws.protocol || '';
    const auth = req.headers.authorization || '';
    const okBrowser = protocol.startsWith('xai-client-secret.') && state.tokens.some((t) => `xai-client-secret.${t.value}` === protocol);
    const okServer = auth === 'Bearer test-xai-key';
    state.authHeaders.push(auth || protocol);
    if (!okBrowser && !okServer) { ws.close(4401, 'unauthorized'); return; }
    const conn = { via: okServer ? 'api-key' : 'client-secret', events: [], heardAudio: 0, turn: 0 };
    state.connections.push(conn);
    const send = (o) => ws.readyState === 1 && ws.send(JSON.stringify(o));
    const say = (text, { tool } = {}) => {
      send({ type: 'response.created', response: { id: `resp_${conn.turn}` } });
      for (let i = 0; i < 3; i += 1) send({ type: 'response.output_audio.delta', delta: tone(conn.format === 'audio/pcmu' ? 160 : 4800) });
      for (const word of text.split(' ')) send({ type: 'response.output_audio_transcript.delta', delta: `${word} ` });
      send({ type: 'response.output_audio_transcript.done', transcript: text });
      if (tool) send({ type: 'response.function_call_arguments.done', call_id: `call_${conn.turn}`, name: tool.name, arguments: JSON.stringify(tool.args) });
      send({ type: 'response.done', response: { id: `resp_${conn.turn}`, status: 'completed' } });
    };
    send({ type: 'session.created', session: { id: 'sess_mock', type: 'realtime' } });
    send({ type: 'conversation.created' });

    ws.on('message', (raw, isBinary) => {
      if (isBinary) return;
      const event = JSON.parse(raw.toString());
      conn.events.push(event.type);
      if (event.type === 'session.update') {
        state.sessionUpdates.push(event.session);
        conn.format = event.session?.audio?.output?.format?.type;
        send({ type: 'session.updated', session: event.session });
      } else if (event.type === 'response.create') {
        if (conn.pendingToolReply) { conn.pendingToolReply = false; say('You are booked for half past eight. Is there anything else?'); return; }
        conn.turn += 1;
        say('Good day, Milkwood Dental. This is the practice\'s virtual assistant. How can I help?');
      } else if (event.type === 'input_audio_buffer.append') {
        state.audioChunks += 1;
        conn.heardAudio += 1;
        // After a little caller audio, pretend the caller asked for a booking.
        if (conn.heardAudio === 12) {
          conn.turn += 1;
          send({ type: 'input_audio_buffer.speech_started', item_id: 'msg_user' });
          send({ type: 'input_audio_buffer.speech_stopped', item_id: 'msg_user' });
          send({ type: 'conversation.item.input_audio_transcription.completed', item_id: 'msg_user', transcript: 'Can I book a cleaning for tomorrow morning?' });
          const tomorrow = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Johannesburg' }).format(new Date(Date.now() + 86400000));
          say('Let me check the diary.', { tool: { name: 'check_availability', args: { date: tomorrow, part_of_day: 'any' } } });
        }
      } else if (event.type === 'conversation.item.create' && event.item?.type === 'function_call_output') {
        state.toolOutputs.push(JSON.parse(event.item.output));
        conn.pendingToolReply = true;
      }
    });
  });

  return new Promise((resolve) => {
    server.listen(port, '127.0.0.1', () => {
      const actual = server.address().port;
      resolve({
        state,
        port: actual,
        apiBase: `http://127.0.0.1:${actual}/v1`,
        realtimeUrl: `ws://127.0.0.1:${actual}/v1/realtime`,
        twilioBase: `http://127.0.0.1:${actual}`,
        elevenBase: `http://127.0.0.1:${actual}`,
        close: () => new Promise((done) => { wss.clients.forEach((c) => c.terminate()); server.close(done); server.closeAllConnections?.(); }),
      });
    });
  });
}
