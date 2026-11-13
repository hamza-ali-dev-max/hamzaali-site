// The recorded call cards: one shared audio player, a waveform that fills as the call plays
// (and can be dragged or arrowed to seek), and a one-line subtitle that follows the audio.

export function createRecordings({ list, audio, calls, say, onPlay }) {
  const cards = Array.from(list.querySelectorAll('.rec-card')).map((el) => ({
    el,
    id: el.dataset.rec,
    call: calls.find((c) => c.id === el.dataset.rec),
    bars: Array.from(el.querySelectorAll('.rec-bars i')),
    seek: el.querySelector('.rec-seek'),
    button: el.querySelector('.rec-play'),
    who: el.querySelector('.rec-who'),
    line: el.querySelector('.rec-line'),
    sub: el.querySelector('.rec-sub'),
    time: el.querySelector('.rec-time'),
    lineIndex: -1,
    played: -1,
  }));
  let current = null;

  const clock = (s) => `${Math.floor(s / 60)}:${String(Math.floor(Number.isFinite(s) ? s : 0) % 60).padStart(2, '0')}`;

  function paintCard(card) {
    const active = card === current;
    const playing = active && !audio.paused && !audio.ended;
    const duration = Number(card.el.dataset.duration) || audio.duration || 1;
    const t = active ? audio.currentTime : 0;
    card.button.setAttribute('aria-pressed', String(playing));
    card.button.querySelector('[data-icon="play"]').hidden = playing;
    card.button.querySelector('[data-icon="pause"]').hidden = !playing;
    say(card.button.querySelector('[data-rec-verb]'), playing ? 'calls.pause' : 'calls.play');
    card.el.classList.toggle('is-playing', playing);
    // Waveform fill
    const played = Math.round((t / duration) * card.bars.length);
    if (played !== card.played) {
      card.bars.forEach((bar, i) => bar.classList.toggle('is-played', i < played));
      card.played = played;
    }
    if (document.activeElement !== card.seek) card.seek.value = String(t);
    card.time.textContent = active && t > 0 ? `${clock(t)} / ${clock(duration)}` : clock(duration);
    // Subtitle: the line being said now (the first line when idle)
    const lines = (card.call && card.call.lines) || [];
    let index = 0;
    if (active) lines.forEach((line, i) => { if (line.t <= t + 0.15) index = i; });
    if (index !== card.lineIndex && lines[index]) {
      card.lineIndex = index;
      card.line.textContent = lines[index].text;
      card.sub.dataset.who = lines[index].who;
      say(card.who, lines[index].who === 'ai' ? 'stage.ai' : 'stage.caller');
    }
  }
  const paint = () => cards.forEach(paintCard);

  function play(card) {
    if (current !== card) {
      if (current) { audio.pause(); }
      current = card;
      audio.src = card.el.dataset.src;
    }
    if (onPlay) onPlay();
    audio.play().catch(() => {});
    paint();
  }

  cards.forEach((card) => {
    card.button.addEventListener('click', () => {
      if (current === card && !audio.paused) audio.pause(); else play(card);
    });
    card.seek.addEventListener('input', () => {
      const t = Number(card.seek.value);
      if (current !== card) { current = card; audio.src = card.el.dataset.src; }
      const apply = () => { try { audio.currentTime = t; } catch { /* not ready */ } paint(); };
      if (audio.readyState >= 1) apply(); else { audio.addEventListener('loadedmetadata', apply, { once: true }); audio.load(); }
    });
  });
  ['play', 'pause', 'ended', 'timeupdate', 'error', 'seeked'].forEach((name) => audio.addEventListener(name, paint));
  paint();

  return {
    playCall(id) {
      const card = cards.find((c) => c.id === id);
      if (card) play(card);
    },
    pause() { audio.pause(); },
    refresh() { cards.forEach((c) => { c.lineIndex = -1; }); paint(); },
    state: () => ({ id: current && current.id, t: audio.currentTime, paused: audio.paused }),
  };
}
