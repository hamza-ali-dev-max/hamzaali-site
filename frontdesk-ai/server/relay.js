// Grok listens, thinks and runs the diary tools; another voice (ElevenLabs) says the words.
// This wraps a server-held Grok session so the rest of the server sees the same neutral events
// as a native voice session: ready, audio, interrupt, user_transcript, agent_text, tool_call,
// error, closed. Audio events carry a Buffer in the requested format (pcm24 or pcmu).
//
// How the words become speech: Grok's transcript streams in as text, it is cut into sentences,
// and each sentence is sent to ElevenLabs as soon as it is complete. Sentences play in order.
// When the caller talks over the receptionist, every pending sentence is cancelled at once.

const MIN_SENTENCE = 12; // join very short sentences ("Sure.") to the next one for better rhythm

export function nextSentence(buffer, final = false) {
  const re = /[.!?]+["')\]]?(?=\s)/g;
  let match;
  while ((match = re.exec(buffer))) {
    const end = match.index + match[0].length;
    if (end >= MIN_SENTENCE) return { sentence: buffer.slice(0, end).trim(), rest: buffer.slice(end).replace(/^\s+/, '') };
  }
  if (final && buffer.trim()) return { sentence: buffer.trim(), rest: '' };
  return null;
}

export function createSpokenSession({ provider, tts, format = 'pcm24', instructions, tools, openingPrompt, onEvent }) {
  let text = '';         // words from Grok not yet sent to the voice
  let spoken = '';       // what has been said so far (gives the voice context for natural intonation)
  let chain = Promise.resolve();
  let controller = new AbortController();
  let closed = false;
  const stats = { characters: 0, sentences: 0, ttsErrors: 0, firstAudioMs: [] };
  let turnStarted = 0;

  // Each sentence is requested from the voice at once (so the next one is ready before the
  // current one ends) but played strictly in order.
  const say = (sentence) => {
    const signal = controller.signal;
    const previousText = spoken;
    spoken = `${spoken} ${sentence}`.slice(-1000);
    stats.characters += sentence.length;
    stats.sentences += 1;
    const held = [];
    let emit = null;
    const finished = tts.speak({
      text: sentence,
      format,
      previousText,
      signal,
      onChunk(chunk) { if (emit) emit(chunk); else held.push(chunk); },
    }).catch((error) => {
      stats.ttsErrors += 1;
      onEvent({ type: 'error', message: error.message, code: 'tts' });
    });
    chain = chain.then(async () => {
      const out = (chunk) => {
        if (signal.aborted || closed) return;
        if (turnStarted) { stats.firstAudioMs.push(Date.now() - turnStarted); turnStarted = 0; }
        onEvent({ type: 'audio', audio: chunk });
      };
      held.splice(0).forEach(out);
      emit = out;
      await finished;
    });
  };

  const drain = (final) => {
    let next;
    while ((next = nextSentence(text, final))) {
      text = next.rest;
      say(next.sentence);
    }
  };

  const voice = provider.connectServerSession({
    instructions,
    tools,
    format,
    openingPrompt,
    speech: 'external',
    onEvent(event) {
      if (closed && event.type !== 'closed') return;
      switch (event.type) {
        case 'agent_delta':
          if (!turnStarted && !text) turnStarted = Date.now();
          text += event.text;
          onEvent({ type: 'agent_text', text: event.text, final: false });
          drain(false);
          break;
        case 'agent_transcript':
          drain(true);
          onEvent({ type: 'agent_text', text: event.text, final: true });
          break;
        case 'response_done':
          drain(true);
          break;
        case 'interrupt':
          // The caller is talking: stop every sentence still queued or playing.
          controller.abort();
          controller = new AbortController();
          text = '';
          turnStarted = 0;
          onEvent({ type: 'interrupt' });
          break;
        case 'audio':
          break; // Grok's own voice is not used in this mode
        default:
          onEvent(event);
      }
    },
  });

  return {
    sendAudio: (base64) => voice.sendAudio(base64),
    sendToolResult: (id, output) => voice.sendToolResult(id, output),
    stats: () => ({ ...stats }),
    close() {
      if (closed) return;
      closed = true;
      controller.abort();
      voice.close();
    },
  };
}
