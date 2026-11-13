// The three recorded calls in "Try it": tabs, one shared audio player, captions that follow the audio.

export function createRecordings({ tablist, audio, say, onPlay }) {
  const tabs = Array.from(tablist.querySelectorAll('[role="tab"]'));
  const panels = tabs.map((tab) => document.getElementById(tab.getAttribute('aria-controls')));
  let current = null; // the panel whose recording is loaded

  const clock = (s) => `${Math.floor(s / 60)}:${String(Math.floor(Number.isFinite(s) ? s : 0) % 60).padStart(2, '0')}`;

  function paint() {
    panels.forEach((panel) => {
      const active = panel === current;
      const playing = active && !audio.paused && !audio.ended;
      const button = panel.querySelector('.rec-play');
      button.setAttribute('aria-pressed', String(playing));
      button.querySelector('[data-icon="play"]').hidden = playing;
      button.querySelector('[data-icon="pause"]').hidden = !playing;
      say(button.querySelector('[data-rec-verb]'), playing ? 'try.rec.pause' : 'try.rec.play');
      const duration = Number(panel.dataset.duration) || audio.duration || 1;
      const t = active ? audio.currentTime : 0;
      panel.querySelector('.rec-bar span').style.width = `${Math.min(100, (t / duration) * 100).toFixed(1)}%`;
      panel.querySelector('.rec-time').textContent = `${clock(t)} / ${clock(duration)}`;
      panel.classList.toggle('is-synced', active && t > 0 && !audio.ended);
      let now = null;
      panel.querySelectorAll('.cap[data-t]').forEach((cap) => {
        const said = active && t >= Number(cap.dataset.t);
        cap.classList.toggle('is-future', !said);
        cap.classList.remove('is-now');
        if (said) now = cap;
      });
      if (now && active && !audio.paused) {
        now.classList.add('is-now');
        const box = panel.querySelector('.caption-window');
        const top = now.offsetTop - box.offsetTop - 40;
        if (Math.abs(box.scrollTop - top) > 30) box.scrollTo({ top, behavior: 'smooth' });
      }
    });
  }

  function select(tab, focus) {
    tabs.forEach((item, i) => {
      const active = item === tab;
      item.setAttribute('aria-selected', String(active));
      item.tabIndex = active ? 0 : -1;
      panels[i].hidden = !active;
    });
    if (focus) tab.focus();
    const panel = panels[tabs.indexOf(tab)];
    if (current && current !== panel) { audio.pause(); }
    paint();
  }

  function play(panel) {
    if (current !== panel) {
      current = panel;
      audio.src = panel.dataset.src;
    }
    if (onPlay) onPlay();
    audio.play().catch(() => {});
    paint();
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => select(tab, false));
    tab.addEventListener('keydown', (event) => {
      const move = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
      if (move) { event.preventDefault(); select(tabs[(index + move + tabs.length) % tabs.length], true); }
    });
  });
  panels.forEach((panel) => {
    panel.querySelector('.rec-play').addEventListener('click', () => {
      if (current === panel && !audio.paused) audio.pause(); else play(panel);
    });
  });
  ['play', 'pause', 'ended', 'timeupdate', 'error'].forEach((name) => audio.addEventListener(name, paint));
  select(tabs.find((tab) => tab.getAttribute('aria-selected') === 'true') || tabs[0], false);

  return {
    playCall(id) {
      const tab = tabs.find((item) => item.id === `rec-tab-${id}`);
      if (!tab) return;
      select(tab, false);
      play(panels[tabs.indexOf(tab)]);
    },
    pause() { audio.pause(); },
    refresh: paint,
  };
}
