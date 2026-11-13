// The hero scene: a real recorded call, played as it happened.
// Without sound it plays by itself (silently) while it is on screen, with a Pause button.
// "Hear a real call" plays the recording and the scene follows the audio exactly.
// What moves: the caption types out word by word as each line is spoken, the waveform moves
// for whoever is talking, the steps tick off, the diary slot fills and the WhatsApps slide in.
// With reduced motion it shows the finished call and only moves when asked.

export function createStage(root, { call, say, reduceMotion, onSound }) {
  const $ = (s) => root.querySelector(s);
  const lines = (call && call.lines) || [];
  const audio = $('#stage-audio');
  const duration = Number(root.dataset.duration) || 50;
  const bookAt = Number(root.dataset.book) || duration;
  const sentAt = Number(root.dataset.sent) || Math.min(bookAt + 2.5, duration);
  const firstLine = lines.length ? lines[0].t : 1;
  const steps = Array.from(root.querySelectorAll('[data-step]')).map((el) => ({ el, at: Number(el.dataset.at) }));
  const toasts = [[root.querySelector('[data-wa="client"]'), sentAt], [root.querySelector('[data-wa="owner"]'), Math.min(sentAt + 1.6, duration)]];
  const target = root.querySelector('.slot-target');
  const capWho = $('[data-cap-who]');
  const capText = $('[data-cap-text]');
  const statusText = $('[data-status-text]');
  const clockEl = $('[data-stage-clock]');
  const progress = $('[data-stage-progress]');
  const toggle = $('[data-stage-toggle]');
  const errorEl = document.querySelector('[data-stage-error]');
  const HOLD = 4; // seconds to rest on the finished call before the silent loop starts again

  let pos = reduceMotion ? duration : 0;
  let playing = false;
  let userPaused = reduceMotion;
  let visible = false;
  let sound = false;
  let last = 0;
  let raf = 0;
  let status = '';
  let lineIndex = -2;
  let words = [];
  let shown = -1;

  const clock = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s) % 60).padStart(2, '0')}`;

  function setLine(index) {
    lineIndex = index;
    const line = lines[Math.max(0, index)];
    if (!line) return;
    root.dataset.who = line.who;
    say(capWho, line.who === 'ai' ? 'stage.ai' : 'stage.caller');
    capText.replaceChildren(...line.text.split(/\s+/).map((word, i) => {
      const span = document.createElement('span');
      span.className = 'w is-hidden';
      span.textContent = i ? ` ${word}` : word;
      return span;
    }));
    words = Array.from(capText.children);
    shown = -1;
  }

  function render() {
    const p = Math.min(pos, duration);
    // Which line is being said, and how far into it
    let index = -1;
    for (let i = 0; i < lines.length; i += 1) if (lines[i].t <= p) index = i;
    if (index !== lineIndex) setLine(index);
    const line = lines[index];
    let count = 0;
    let speaking = '';
    if (line) {
      const length = Math.max(0.6, line.d || 3);
      const progressInLine = (p - line.t) / length;
      count = Math.min(words.length, Math.ceil(words.length * Math.min(1, progressInLine * 1.06)));
      if (progressInLine < 1) speaking = line.who;
    }
    if (count !== shown) {
      words.forEach((w, i) => w.classList.toggle('is-hidden', i >= count));
      shown = count;
      // Long lines: keep the newest words in view
      const box = capText.parentElement;
      box.scrollTop = box.scrollHeight;
      box.classList.toggle('is-scrolled', box.scrollTop > 0);
    }
    if (root.dataset.speaking !== speaking) root.dataset.speaking = speaking;
    root.dataset.phase = p < firstLine ? 'ringing' : 'live';

    steps.forEach((s) => s.el.classList.toggle('is-done', p >= s.at));
    if (target) target.classList.toggle('is-filled', p >= bookAt);
    toasts.forEach(([el, at]) => { if (el) el.classList.toggle('is-shown', p >= at); });

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
    new IntersectionObserver((entries) => { visible = entries[0].isIntersecting; autoplay(); }, { threshold: 0.25 }).observe(root);
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
    refreshText() { status = ''; const i = lineIndex; lineIndex = -2; if (i >= -1) render(); paintButton(); },
    state: () => ({ pos, playing, sound, phase: root.dataset.phase, speaking: root.dataset.speaking }),
  };
}
