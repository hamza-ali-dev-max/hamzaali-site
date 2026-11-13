// The hero "call stage": a real recorded call, played step by step.
// Without sound it plays by itself (silently) while it is on screen, with a Pause button.
// "Hear a real call" plays the recording and the stage follows the audio exactly.
// With reduced motion it starts on the finished call and only moves when asked.

export function createStage(root, { say, reduceMotion, onSound }) {
  const $ = (s) => root.querySelector(s);
  const caps = Array.from(root.querySelectorAll('.cap[data-t]')).map((el) => ({ el, t: Number(el.dataset.t) }));
  const audio = $('#stage-audio');
  const duration = Number(root.dataset.duration) || 50;
  const bookAt = Number(root.dataset.book) || duration;
  const checkAt = Number(root.dataset.check) || bookAt;
  const firstLine = caps.length ? caps[0].t : 1;
  const waClient = root.querySelector('[data-wa="client"]');
  const waOwner = root.querySelector('[data-wa="owner"]');
  const clientAt = Math.min(bookAt + 2.5, duration);
  const ownerAt = Math.min(bookAt + 5, duration);
  const target = root.querySelector('.diary-target');
  const statusText = root.querySelector('[data-status-text]');
  const clockEl = root.querySelector('[data-stage-clock]');
  const progress = root.querySelector('[data-stage-progress]');
  const toggle = root.querySelector('[data-stage-toggle]');
  const errorEl = document.querySelector('[data-stage-error]');
  const HOLD = 4; // seconds to rest on the finished call before the silent loop starts again

  let pos = reduceMotion ? duration : 0;
  let playing = false;
  let userPaused = reduceMotion;
  let visible = false;
  let sound = false;
  let last = 0;
  let raf = 0;
  let phase = '';

  const clock = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s) % 60).padStart(2, '0')}`;

  function render(animate) {
    const p = Math.min(pos, duration);
    caps.forEach((c) => {
      const future = c.t > p;
      const was = c.el.classList.contains('is-future');
      c.el.classList.toggle('is-future', future);
      if (was && !future && animate) { c.el.classList.remove('is-new'); void c.el.offsetWidth; c.el.classList.add('is-new'); }
    });
    if (target) target.classList.toggle('is-filled', p >= bookAt);
    if (waClient) waClient.classList.toggle('is-shown', p >= clientAt);
    if (waOwner) waOwner.classList.toggle('is-shown', p >= ownerAt);
    const next = p < firstLine ? 'ringing' : p < checkAt ? 'answered' : p < bookAt ? 'checking' : 'booked';
    if (next !== phase) {
      phase = next;
      root.dataset.phase = next;
      say(statusText, { ringing: 'stage.ringing', answered: 'stage.answered', checking: 'stage.answered', booked: 'stage.done' }[next]);
    }
    clockEl.textContent = playing || p < duration ? clock(p) : clock(duration);
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
      if (pos > duration + HOLD) { pos = 0; }
    }
    render(true);
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
    paintButton();
  }
  // Silent mode runs only while the stage is on screen and the visitor has not paused it.
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
    render(false);
    const attempt = audio.play();
    start();
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
    if (pos >= duration) { pos = 0; render(false); }
    if (sound) {
      if (audio.ended) audio.currentTime = 0;
      audio.play().catch(() => {});
    }
    start();
  });
  audio.addEventListener('ended', () => { pos = duration; render(false); sound = false; userPaused = true; stop(); });
  audio.addEventListener('error', () => { if (sound) { sound = false; if (errorEl) errorEl.hidden = false; stop(); autoplay(); } });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => { visible = entries[0].isIntersecting; autoplay(); }, { threshold: 0.3 }).observe(root);
  } else {
    visible = true;
  }
  document.addEventListener('visibilitychange', () => { if (!sound) autoplay(); });

  render(false);
  paintButton();
  if (!reduceMotion) autoplay();

  return {
    playSound,
    pauseSound() { if (sound && playing) { audio.pause(); userPaused = true; stop(); } },
    refreshText() { phase = ''; render(false); paintButton(); },
    state: () => ({ pos, playing, sound, phase }),
  };
}
