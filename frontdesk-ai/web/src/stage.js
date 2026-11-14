// The hero scene: a real recorded call, played as it happened, on three cards.
// Without sound it plays by itself (silently) while it is on screen, with a Pause button.
// "Hear a real call" plays the recording and the scene follows the audio exactly.
// One thing moves at a time: the caption types out word by word as each line is spoken,
// then the diary card turns to "booked", then the WhatsApp to the owner arrives.
// With reduced motion it shows the finished call and only moves when asked.

export function createStage(root, { call, say, reduceMotion, onSound }) {
  const $ = (s) => root.querySelector(s);
  const lines = (call && call.lines) || [];
  const audio = $('#stage-audio');
  const duration = Number(root.dataset.duration) || 50;
  const bookAt = Number(root.dataset.book) || duration;
  const checkAt = Number(root.dataset.check) || bookAt;
  const sentAt = Number(root.dataset.sent) || Math.min(bookAt + 2.5, duration);
  const firstLine = lines.length ? lines[0].t : 1;
  const messages = Array.from(root.querySelectorAll('[data-wa]'));
  const target = root.querySelector('.slot-target');
  const capWho = $('[data-cap-who]');
  const capText = $('[data-cap-text]');
  const statusText = $('[data-status-text]');
  const clockEl = $('[data-stage-clock]');
  const progress = $('[data-stage-progress]');
  const toggle = $('[data-stage-toggle]');
  const errorEl = document.querySelector('[data-stage-error]');
  const HOLD = 5; // seconds to rest on the finished call before the silent loop starts again

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
      const into = (p - line.t) / Math.max(0.6, line.d || 3);
      count = Math.min(words.length, Math.ceil(words.length * Math.min(1, into * 1.06)));
      if (into < 1) speaking = line.who;
    }
    if (count !== shown) {
      words.forEach((w, i) => w.classList.toggle('is-hidden', i >= count));
      shown = count;
      const box = capText.parentElement;
      box.scrollTop = box.scrollHeight; // long lines: keep the newest words in view
      box.classList.toggle('is-scrolled', box.scrollTop > 0);
    }
    if (root.dataset.speaking !== speaking) root.dataset.speaking = speaking;
    root.dataset.phase = p < firstLine ? 'ringing' : 'live';
    root.dataset.diary = p >= bookAt ? 'booked' : p >= checkAt ? 'checked' : 'none';
    root.classList.toggle('is-sent', p >= sentAt);
    if (target) target.classList.toggle('is-filled', p >= bookAt);
    messages.forEach((el) => el.classList.toggle('is-shown', p >= sentAt));

    const next = p < firstLine ? 'stage.incoming' : p < checkAt ? 'stage.s1' : p < bookAt ? 'stage.s2' : p < sentAt ? 'stage.s3' : 'stage.s4';
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
    refreshText() { status = ''; const i = lineIndex; lineIndex = -2; if (i >= -1) render(); paintButton(); },
    state: () => ({ pos, playing, sound, phase: root.dataset.phase, speaking: root.dataset.speaking, diary: root.dataset.diary }),
  };
}
