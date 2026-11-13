// The hero scene: a real recorded call, played as it happened, told by floating chips.
// Without sound it plays by itself (silently) while it is on screen, with a Pause button.
// "Hear a real call" plays the recording and the scene follows the audio exactly.
// What moves: each speech bubble types out word by word as its line is spoken (caller in the
// dark bubble, receptionist in the blue one), the waveform moves for whoever talks, the call
// button rings, the diary card goes from "checking" to "booked", the steps tick off and the
// WhatsApps pop in. With reduced motion it shows the finished call and only moves when asked.

export function createStage(root, { call, say, reduceMotion, onSound }) {
  const $ = (s) => root.querySelector(s);
  const lines = (call && call.lines) || [];
  const audio = $('#stage-audio');
  const duration = Number(root.dataset.duration) || 50;
  const bookAt = Number(root.dataset.book) || duration;
  const checkAt = Number(root.dataset.check) || bookAt;
  const sentAt = Number(root.dataset.sent) || Math.min(bookAt + 2.5, duration);
  const firstLine = lines.length ? lines[0].t : 1;
  const steps = Array.from(root.querySelectorAll('[data-step]')).map((el) => ({ el, at: Number(el.dataset.at) }));
  const toasts = [[root.querySelector('[data-wa="client"]'), sentAt], [root.querySelector('[data-wa="owner"]'), Math.min(sentAt + 1.6, duration)]];
  const waCount = $('[data-wa-count]');
  const statusText = $('[data-status-text]');
  const clockEl = $('[data-stage-clock]');
  const progress = $('[data-stage-progress]');
  const toggle = $('[data-stage-toggle]');
  const errorEl = document.querySelector('[data-stage-error]');
  const HOLD = 4; // seconds to rest on the finished call before the silent loop starts again

  // One speech bubble per side. Each shows that side's latest line, typed as it is spoken.
  const bubbles = ['caller', 'ai'].map((who) => {
    const el = root.querySelector(`[data-cap="${who}"]`);
    return { who, text: el && el.querySelector('[data-cap-text]'), index: -2, words: [], shown: -1 };
  }).filter((b) => b.text);

  let pos = reduceMotion ? duration : 0;
  let playing = false;
  let userPaused = reduceMotion;
  let visible = false;
  let sound = false;
  let last = 0;
  let raf = 0;
  let status = '';

  const clock = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s) % 60).padStart(2, '0')}`;

  function paintBubble(b, p) {
    // The latest line from this side that has started; before any, the first line still to come.
    let index = -1;
    lines.forEach((line, i) => { if (line.who === b.who && line.t <= p) index = i; });
    const upcoming = index < 0 ? lines.findIndex((line) => line.who === b.who) : index;
    if (upcoming !== b.index) {
      b.index = upcoming;
      const line = lines[upcoming];
      b.text.replaceChildren(...(line ? line.text.split(/\s+/) : []).map((word, i) => {
        const span = document.createElement('span');
        span.className = 'w is-hidden';
        span.textContent = i ? ` ${word}` : word;
        return span;
      }));
      b.words = Array.from(b.text.children);
      b.shown = -1;
    }
    let count = 0;
    let speaking = false;
    if (index >= 0) {
      const line = lines[index];
      const into = (p - line.t) / Math.max(0.6, line.d || 3);
      count = Math.min(b.words.length, Math.ceil(b.words.length * Math.min(1, into * 1.06)));
      speaking = into < 1;
    }
    if (count !== b.shown) {
      b.words.forEach((w, i) => w.classList.toggle('is-hidden', i >= count));
      b.shown = count;
      const box = b.text.parentElement;
      box.scrollTop = box.scrollHeight; // long lines: keep the newest words in view
      box.classList.toggle('is-scrolled', box.scrollTop > 0);
    }
    return speaking;
  }

  function render() {
    const p = Math.min(pos, duration);
    let speaking = '';
    bubbles.forEach((b) => { if (paintBubble(b, p)) speaking = b.who; });
    if (root.dataset.speaking !== speaking) root.dataset.speaking = speaking;
    root.dataset.phase = p < firstLine ? 'ringing' : 'live';
    root.dataset.diary = p >= bookAt ? 'booked' : p >= checkAt ? 'checked' : 'none';
    root.classList.toggle('is-sent', p >= sentAt);
    root.querySelectorAll('.slot-target').forEach((el) => el.classList.toggle('is-filled', p >= bookAt));

    steps.forEach((s) => s.el.classList.toggle('is-done', p >= s.at));
    let sent = 0;
    toasts.forEach(([el, at]) => { if (el) { el.classList.toggle('is-shown', p >= at); if (p >= at) sent += 1; } });
    if (waCount) waCount.textContent = String(sent);

    const next = p < firstLine ? 'stage.incoming' : p < bookAt ? 'stage.s1' : 'stage.s3';
    if (next !== status) { status = next; say(statusText, next); }
    clockEl.textContent = clock(p);
    progress.style.transform = `scaleX(${(p / duration).toFixed(4)})`;
  }

  function paintButton() {
    toggle.querySelector('[data-icon="pause"]').hidden = !playing;
    toggle.querySelector('[data-icon="play"]').hidden = playing;
    say(toggle, playing ? 'stage.pause' : (pos >= duration ? 'stage.replay' : 'stage.resume'), 'aria-label');
    root.dataset.sound = sound ? 'on' : 'off';
  }

  function frame(now) {
    if (!playing) return;
    if (sound) {
      pos = audio.currentTime;
    } else {
      pos += (now - last) / 1000;
      last = now;
      if (pos > duration + HOLD) pos = 0;
    }
    render();
    raf = requestAnimationFrame(frame);
  }

  function start() {
    if (playing) return;
    playing = true;
    last = performance.now();
    raf = requestAnimationFrame(frame);
    paintButton();
  }
  function stop() {
    playing = false;
    cancelAnimationFrame(raf);
    if (!sound) root.dataset.speaking = '';
    paintButton();
  }
  // Silent mode runs only while the scene is on screen and the visitor has not paused it.
  function autoplay() {
    if (sound) return;
    if (visible && !userPaused && !document.hidden) start(); else stop();
  }

  function playSound() {
    if (errorEl) errorEl.hidden = true;
    if (!audio.getAttribute('src')) audio.src = root.dataset.src;
    sound = true;
    userPaused = false;
    if (onSound) onSound();
    try { audio.currentTime = 0; } catch { /* not loaded yet */ }
    pos = 0;
    render();
    const attempt = audio.play();
    start();
    paintButton();
    if (attempt && attempt.catch) {
      attempt.catch(() => { sound = false; if (errorEl) errorEl.hidden = false; stop(); autoplay(); });
    }
  }

  toggle.addEventListener('click', () => {
    if (playing) {
      userPaused = true;
      if (sound) audio.pause();
      stop();
      return;
    }
    userPaused = false;
    if (pos >= duration) { pos = 0; render(); }
    if (sound) {
      if (audio.ended) audio.currentTime = 0;
      audio.play().catch(() => {});
    }
    start();
  });
  audio.addEventListener('ended', () => { pos = duration; render(); sound = false; userPaused = true; stop(); });
  audio.addEventListener('error', () => { if (sound) { sound = false; if (errorEl) errorEl.hidden = false; stop(); autoplay(); } });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => { visible = entries[0].isIntersecting; autoplay(); }, { threshold: 0.2 }).observe(root);
  } else {
    visible = true;
  }
  document.addEventListener('visibilitychange', () => { if (!sound) autoplay(); });

  render();
  paintButton();
  if (!reduceMotion) autoplay();

  return {
    playSound,
    pauseSound() { if (sound && playing) { audio.pause(); userPaused = true; stop(); } },
    refreshText() { status = ''; render(); paintButton(); },
    state: () => ({ pos, playing, sound, phase: root.dataset.phase, speaking: root.dataset.speaking, diary: root.dataset.diary }),
  };
}
