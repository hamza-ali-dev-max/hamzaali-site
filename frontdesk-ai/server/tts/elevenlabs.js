// ElevenLabs text to speech, streamed. Used to give the receptionist a natural South African voice
// while Grok does the listening, thinking and booking (see server/relay.js).
// API: POST /v1/text-to-speech/{voice_id}/stream?output_format=... with { text, model_id, previous_text }.
// The key stays on the server. Audio comes back in small chunks as it is generated.

const OUTPUT = {
  pcm24: 'pcm_24000', // 16-bit PCM, 24 kHz mono: the browser demo
  pcmu: 'ulaw_8000',  // G.711 mu-law, 8 kHz: phone lines (Twilio), no conversion needed
};

export function createElevenLabs(cfg) {
  const { apiKey, apiBase, model, voiceId } = cfg.tts.elevenlabs;
  return {
    name: 'elevenlabs',
    configured: Boolean(apiKey),
    model,
    voiceId,

    // Speaks one piece of text. onChunk(Buffer) is called as audio arrives.
    // Resolves with the number of bytes sent. Rejects on HTTP errors; an abort resolves quietly.
    async speak({ text, format = 'pcm24', previousText = '', signal, onChunk }) {
      const url = `${apiBase}/v1/text-to-speech/${encodeURIComponent(voiceId)}/stream?output_format=${OUTPUT[format] || OUTPUT.pcm24}`;
      let res;
      try {
        res = await fetch(url, {
          method: 'POST',
          headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json', Accept: 'audio/*' },
          body: JSON.stringify({ text, model_id: model, ...(previousText ? { previous_text: previousText.slice(-600) } : {}) }),
          signal,
        });
      } catch (error) {
        if (signal?.aborted) return 0;
        throw error;
      }
      if (!res.ok) {
        const detail = (await res.text().catch(() => '')).slice(0, 300);
        throw Object.assign(new Error(`ElevenLabs refused the request (${res.status})`), { status: res.status, detail });
      }
      // 16-bit PCM must be sent in whole samples, so hold back an odd trailing byte.
      const sampleBytes = format === 'pcmu' ? 1 : 2;
      let spare = Buffer.alloc(0);
      let sent = 0;
      try {
        for await (const part of res.body) {
          if (signal?.aborted) break;
          let chunk = spare.length ? Buffer.concat([spare, Buffer.from(part)]) : Buffer.from(part);
          const usable = chunk.length - (chunk.length % sampleBytes);
          spare = chunk.subarray(usable);
          chunk = chunk.subarray(0, usable);
          if (chunk.length) { sent += chunk.length; onChunk(chunk); }
        }
      } catch (error) {
        if (!signal?.aborted) throw error;
      }
      return sent;
    },
  };
}
