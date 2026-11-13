// Everything interactive on the page: language, dark mode, menu, tabs, FAQ, map,
// contact details, the demo request form and the live voice demo.
import { STRINGS, LANGUAGES } from './i18n.js';
import { startCall, micSupported } from './voice.js';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
const store = {
  get(key) { try { return localStorage.getItem(key); } catch { return null; } },
  set(key, value) { try { localStorage.setItem(key, value); } catch { /* private mode: just do not remember */ } },
};
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------------------------------------------------------------- Settings and placeholders */
const PLACEHOLDERS = { email: 'hello@example.com', phone: '+27 00 000 0000', whatsapp: '+27 00 000 0000' };
const CONFIG = window.FRONT_DESK_CONFIG || {};
const API = String(CONFIG.apiBase || '').replace(/\/+$/, '');
const setting = (key) => String(CONFIG[key] || '').trim() || PLACEHOLDERS[key];
const dial = (number) => number.replace(/[^\d+]/g, '');
const waDigits = (number) => { const d = number.replace(/\D/g, ''); return d.startsWith('0') ? `27${d.slice(1)}` : d; };

/* ---------------------------------------------------------------- Language */
let lang = 'en';
let mapApi = null;
const tr = (key) => (STRINGS[lang] && STRINGS[lang][key]) || STRINGS.en[key] || key;
// Show a translated message in an element and remember its key, so it follows the language switcher.
const say = (el, key) => { if (!el) return; if (key) { el.dataset.i18n = key; el.textContent = tr(key); } else { delete el.dataset.i18n; el.textContent = ''; } };

function applyLanguage(next, remember = true) {
  lang = STRINGS[next] ? next : 'en';
  document.documentElement.lang = lang;
  $$('[data-i18n]').forEach((el) => { el.textContent = tr(el.dataset.i18n); });
  $$('[data-i18n-attr]').forEach((el) => {
    el.dataset.i18nAttr.split(';').forEach((pair) => { const [attr, key] = pair.split(':'); if (attr && key) el.setAttribute(attr, tr(key)); });
  });
  $$('[data-lang]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.lang === lang)));
  if (mapApi) mapApi.refreshText();
  refreshWhatsappLinks();
  if (remember) store.set('fd-lang', lang);
}
$$('[data-lang]').forEach((button) => button.addEventListener('click', () => applyLanguage(button.dataset.lang)));

/* ---------------------------------------------------------------- Contact details */
function refreshWhatsappLinks() {
  const text = encodeURIComponent(tr('cta.wa.intro'));
  $$('[data-wa]').forEach((el) => el.setAttribute('href', `https://wa.me/${waDigits(setting('whatsapp'))}?text=${text}`));
}
$$('[data-text]').forEach((el) => { el.textContent = setting(el.dataset.text); });
$$('[data-tel]').forEach((el) => el.setAttribute('href', `tel:${dial(setting(el.dataset.tel))}`));
$$('[data-mailto]').forEach((el) => el.setAttribute('href', `mailto:${setting(el.dataset.mailto)}`));
$$('[data-maps]').forEach((el) => { if (CONFIG.mapsUrl) el.setAttribute('href', CONFIG.mapsUrl); });
$$('[data-ph]').forEach((el) => { el.hidden = setting(el.dataset.ph) !== PLACEHOLDERS[el.dataset.ph]; });
$('#year').textContent = String(new Date().getFullYear());

/* ---------------------------------------------------------------- Dark mode */
const themeColor = $('meta[name="theme-color"]');
function applyTheme(dark, remember) {
  document.documentElement.classList.toggle('dark', dark);
  $$('[data-theme-toggle]').forEach((button) => {
    button.setAttribute('aria-pressed', String(dark));
    $('[data-icon="moon"]', button).hidden = dark;
    $('[data-icon="sun"]', button).hidden = !dark;
  });
  if (themeColor) themeColor.setAttribute('content', dark ? '#081226' : '#1570EF');
  if (remember) store.set('fd-theme', dark ? 'dark' : 'light');
}
applyTheme(document.documentElement.classList.contains('dark'), false);
$$('[data-theme-toggle]').forEach((button) => button.addEventListener('click', () => applyTheme(!document.documentElement.classList.contains('dark'), true)));
// Follow the system setting until the visitor makes their own choice.
window.matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', (event) => { if (!store.get('fd-theme')) applyTheme(event.matches, false); });

/* ---------------------------------------------------------------- Mobile menu */
const menuToggle = $('#menu-toggle');
const mobileMenu = $('#mobile-menu');
function setMenu(open) {
  mobileMenu.hidden = !open;
  menuToggle.setAttribute('aria-expanded', String(open));
  $('[data-icon="open"]', menuToggle).hidden = open;
  $('[data-icon="close"]', menuToggle).hidden = !open;
}
menuToggle.addEventListener('click', () => setMenu(mobileMenu.hidden));
$$('a', mobileMenu).forEach((link) => link.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !mobileMenu.hidden) { setMenu(false); menuToggle.focus(); } });
document.addEventListener('click', (event) => { if (!mobileMenu.hidden && !$('#site-header').contains(event.target)) setMenu(false); });
window.matchMedia('(min-width: 1024px)').addEventListener?.('change', (event) => { if (event.matches) setMenu(false); });

/* ---------------------------------------------------------------- Fade-in on scroll */
const revealItems = $$('[data-reveal]');
if ('IntersectionObserver' in window && !reduceMotion) {
  const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
    if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
  }), { threshold: 0.1, rootMargin: '0px 0px -5% 0px' });
  revealItems.forEach((el) => observer.observe(el));
} else {
  revealItems.forEach((el) => el.classList.add('is-visible'));
}

/* ---------------------------------------------------------------- Industry tabs */
function initTabs(tablist) {
  const tabs = $$('[role="tab"]', tablist);
  const select = (tab, focus) => {
    tabs.forEach((item) => {
      const active = item === tab;
      item.setAttribute('aria-selected', String(active));
      item.tabIndex = active ? 0 : -1;
      const panel = document.getElementById(item.getAttribute('aria-controls'));
      panel.hidden = !active;
      panel.classList.toggle('is-entering', active);
    });
    if (focus) tab.focus();
  };
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => select(tab, false));
    tab.addEventListener('keydown', (event) => {
      const move = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
      let next = null;
      if (move) next = tabs[(index + move + tabs.length) % tabs.length];
      else if (event.key === 'Home') next = tabs[0];
      else if (event.key === 'End') next = tabs[tabs.length - 1];
      if (next) { event.preventDefault(); select(next, true); }
    });
  });
  select(tabs.find((tab) => tab.getAttribute('aria-selected') === 'true') || tabs[0], false);
}
initTabs($('#industry-tabs'));

/* ---------------------------------------------------------------- FAQ accordion */
$$('.faq-item').forEach((item) => {
  const button = $('.faq-q', item);
  button.addEventListener('click', () => {
    const open = item.dataset.open !== 'true';
    item.dataset.open = String(open);
    button.setAttribute('aria-expanded', String(open));
  });
});

/* ---------------------------------------------------------------- Map (loads when it scrolls into view) */
const mapElement = $('#map');
let mapLoading = false;
async function loadMap() {
  if (mapLoading) return;
  mapLoading = true;
  try {
    const { createMap } = await import('./map.js');
    mapApi = createMap(mapElement, tr);
    window.__frontDeskMap = mapApi;
  } catch {
    mapLoading = false;
  }
}
if ('IntersectionObserver' in window) {
  const mapObserver = new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting)) { mapObserver.disconnect(); loadMap(); }
  }, { rootMargin: '600px 0px' });
  mapObserver.observe(mapElement);
} else {
  loadMap();
}

/* ---------------------------------------------------------------- Book a free demo form */
const form = $('#demo-form');
const success = $('#demo-success');
let submitted = false;
const cleanPhone = (value) => value.replace(/[\s\-().]/g, '');
const validSaPhone = (value) => /^(?:\+27|0027|27|0)[1-8]\d{8}$/.test(cleanPhone(value));
const validators = {
  name: (v) => (v.length >= 2 ? '' : 'cta.err.name'),
  business: (v) => (v.length >= 2 ? '' : 'cta.err.business'),
  type: (v) => (v ? '' : 'cta.err.type'),
  phone: (v) => (validSaPhone(v) || /^\+\d{8,15}$/.test(cleanPhone(v)) ? '' : 'cta.err.phone'),
  email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? '' : 'cta.err.email'),
};
const control = (name) => form.elements.namedItem(name);
const value = (name) => String(control(name).value || '').trim();
function validateField(name) {
  const key = validators[name](value(name));
  const error = $(`#error-${name}`);
  say(error, key);
  error.hidden = !key;
  if (key) control(name).setAttribute('aria-invalid', 'true'); else control(name).removeAttribute('aria-invalid');
  return !key;
}
Object.keys(validators).forEach((name) => {
  const input = control(name);
  input.addEventListener('blur', () => { if (submitted || value(name)) validateField(name); });
  input.addEventListener('input', () => { if (input.getAttribute('aria-invalid') === 'true') validateField(name); });
  input.addEventListener('change', () => { if (submitted) validateField(name); });
});
function demoLink() {
  const lines = [tr('cta.wa.intro'), '', `${tr('cta.name')}: ${value('name')}`, `${tr('cta.business')}: ${value('business')}`, `${tr('cta.type')}: ${value('type')}`, `${tr('cta.phone')}: ${value('phone')}`, `${tr('cta.email')}: ${value('email')}`];
  return `https://wa.me/${waDigits(setting('whatsapp'))}?text=${encodeURIComponent(lines.join('\n'))}`;
}
form.addEventListener('submit', (event) => {
  event.preventDefault();
  submitted = true;
  const invalid = Object.keys(validators).filter((name) => !validateField(name));
  if (invalid.length) { control(invalid[0]).focus(); return; }
  const link = demoLink();
  $('#success-whatsapp').setAttribute('href', link);
  form.hidden = true;
  success.hidden = false;
  success.focus();
  window.open(link, '_blank', 'noopener');
});
$('#success-edit').addEventListener('click', () => { success.hidden = true; form.hidden = false; control('name').focus(); });

/* ---------------------------------------------------------------- Live voice demo */
const demoBox = $('#demo-box');
const micButton = $('#mic-button');
const micStatus = $('#mic-status');
const micTimer = $('#mic-timer');
const transcript = $('#transcript');
const transcriptEmpty = $('#transcript-empty');
let call = null;
let agentLine = null;
let pendingUser = null;

function showDemo(state) {
  demoBox.dataset.state = state;
  $$('[data-show]', demoBox).forEach((el) => { el.hidden = el.dataset.show !== state; });
}
const clock = (seconds) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
function setMic(state) {
  micButton.dataset.state = state;
  micButton.disabled = state === 'busy';
  ['idle', 'busy', 'live'].forEach((name) => { $(`[data-icon="${name}"]`, micButton).hidden = name !== state; });
  const key = state === 'live' ? 'try.mic.end' : 'try.mic.start';
  say($('#mic-label'), key);
  say($('#mic-caption'), key);
}
function addLine(who) {
  transcriptEmpty.hidden = true;
  const li = document.createElement('li');
  li.className = `flex flex-col ${who === 'you' ? 'items-end' : 'items-start'}`;
  const label = document.createElement('span');
  label.className = 'who';
  say(label, who === 'you' ? 'try.you' : 'try.ai');
  const bubble = document.createElement('p');
  bubble.className = `bubble ${who === 'you' ? 'bubble-you' : 'bubble-ai'}`;
  li.append(label, bubble);
  transcript.append(li);
  return { li, bubble };
}
function addNote(key) {
  transcriptEmpty.hidden = true;
  const li = document.createElement('li');
  li.className = 'flex';
  const note = document.createElement('p');
  note.className = 'bubble-note';
  say(note, key);
  li.append(note);
  transcript.append(li);
  transcript.scrollTop = transcript.scrollHeight;
}
const scrollTranscript = () => { transcript.scrollTop = transcript.scrollHeight; };

const ERROR_KEYS = { no_mic_support: 'try.err.nomic', mic_denied: 'try.err.mic', busy: 'try.err.busy', rate_limited: 'try.err.limit', daily_limit: 'try.err.limit', network: 'try.err.network' };
const END_KEYS = { user: 'try.status.ended', time_limit: 'try.status.timeup', network: 'try.err.network', left_page: 'try.status.ended' };

async function beginCall() {
  setMic('busy');
  say(micStatus, 'try.status.connecting');
  transcript.replaceChildren();
  transcriptEmpty.hidden = false;
  agentLine = null;
  pendingUser = null;
  try {
    call = await startCall({
      apiBase: API,
      handlers: {
        state(name, detail) {
          if (name === 'live') { setMic('live'); say(micStatus, 'try.status.live'); }
          if (name === 'ended') {
            call = null;
            if (pendingUser && !pendingUser.bubble.textContent) pendingUser.li.remove();
            setMic('idle');
            say(micStatus, END_KEYS[detail] || 'try.status.ended');
          }
        },
        timer(left) { micTimer.textContent = clock(left); },
        agentText(text, final) {
          if (!agentLine) agentLine = addLine('ai');
          agentLine.bubble.textContent = text;
          if (final) agentLine = null;
          scrollTranscript();
        },
        userSpeaking() {
          agentLine = null;
          if (!pendingUser) { pendingUser = addLine('you'); pendingUser.li.hidden = true; }
        },
        userText(text) {
          if (!pendingUser) pendingUser = addLine('you');
          pendingUser.li.hidden = false;
          pendingUser.bubble.textContent = text;
          pendingUser = null;
          scrollTranscript();
        },
        tool() { addNote('try.tool'); },
      },
    });
  } catch (error) {
    call = null;
    setMic('idle');
    micTimer.textContent = clock(180);
    if (error.code === 'not_configured') { showDemo('off'); return; }
    say(micStatus, ERROR_KEYS[error.code] || 'try.err.generic');
  }
}
micButton.addEventListener('click', () => { if (call) call.end('user'); else if (micButton.dataset.state !== 'busy') beginCall(); });

// Sample recordings, used when the live demo is not available.
const sampleAudio = $('#sample-audio');
let currentSample = null;
const sampleClock = (s) => clock(Math.floor(Number.isFinite(s) ? s : 0));
function paintSamples() {
  $$('.sample').forEach((row) => {
    const active = row === currentSample;
    const playing = active && !sampleAudio.paused && !sampleAudio.ended;
    const button = $('.sample-play', row);
    button.setAttribute('aria-pressed', String(playing));
    $('[data-icon="play"]', button).hidden = playing;
    $('[data-icon="pause"]', button).hidden = !playing;
    say($('[data-role="verb"]', button), playing ? 'try.sample.pause' : 'try.sample.play');
    const ratio = active && sampleAudio.duration ? sampleAudio.currentTime / sampleAudio.duration : 0;
    $('.sample-bar span', row).style.width = `${(ratio * 100).toFixed(1)}%`;
    $('.sample-time', row).textContent = active ? sampleClock(sampleAudio.currentTime) : '0:00';
  });
}
$$('.sample').forEach((row) => {
  $('.sample-play', row).addEventListener('click', () => {
    if (currentSample !== row) {
      currentSample = row;
      sampleAudio.src = row.dataset.src;
      sampleAudio.play().catch(() => {});
    } else if (sampleAudio.paused) sampleAudio.play().catch(() => {}); else sampleAudio.pause();
    paintSamples();
  });
});
['play', 'pause', 'ended', 'timeupdate', 'error'].forEach((name) => sampleAudio.addEventListener(name, paintSamples));

// Phone test (Twilio). Only shown when the backend says it is configured.
const callForm = $('#call-form');
const callStatus = $('#call-status');
const CALL_KEYS = { bad_number: 'try.call.bad', rate_limited: 'try.call.limit', unverified_number: 'try.call.unverified', busy: 'try.err.busy' };
callForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const input = $('#call-phone');
  const button = $('button[type="submit"]', callForm);
  if (!validSaPhone(input.value)) { input.setAttribute('aria-invalid', 'true'); say(callStatus, 'try.call.bad'); input.focus(); return; }
  input.removeAttribute('aria-invalid');
  button.disabled = true;
  say($('#call-button-label'), 'try.call.sending');
  say(callStatus, null);
  try {
    const res = await fetch(`${API}/api/demo/call-me`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: input.value }) });
    const data = await res.json().catch(() => ({}));
    say(callStatus, res.ok ? 'try.call.ok' : (CALL_KEYS[data.code] || 'try.call.fail'));
  } catch {
    say(callStatus, 'try.call.fail');
  }
  button.disabled = false;
  say($('#call-button-label'), 'try.call.button');
});

async function checkDemo() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(`${API}/api/health`, { signal: controller.signal, headers: { Accept: 'application/json' } });
    clearTimeout(timeout);
    const health = await res.json();
    if (!res.ok || !health.ok) throw new Error('unhealthy');
    showDemo(health.voice && health.voice.configured && micSupported() ? 'live' : 'off');
    if (health.demo && health.demo.maxSeconds) micTimer.textContent = clock(health.demo.maxSeconds);
    if (health.phone && health.phone.configured && health.phone.number) {
      $('#dial-number').textContent = health.phone.number.replace(/^(\+27)(\d{2})(\d{3})(\d{4})$/, '$1 $2 $3 $4');
      $('#dial-link').setAttribute('href', `tel:${health.phone.number}`);
      $('#phone-test').hidden = false;
    }
  } catch {
    showDemo('off'); // no backend reachable: show the sample calls instead of a broken demo
  }
}

/* ---------------------------------------------------------------- Start */
setMic('idle');
applyLanguage(store.get('fd-lang') || 'en', false);
checkDemo();

// Google Analytics loads only once a real measurement ID is set in site-config.js.
const gaId = String(CONFIG.googleAnalyticsId || '');
if (/^G-[A-Z0-9]{6,}$/.test(gaId) && gaId !== 'G-XXXXXXXXXX') {
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
  document.head.append(script);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', gaId, { anonymize_ip: true });
}

export { LANGUAGES };
