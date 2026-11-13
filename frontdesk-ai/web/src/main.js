// Everything interactive on the page: language, dark mode, menu, the call stage, recordings,
// the live demo, tabs, FAQ, the calculator, the trial form and contact details.
import { STRINGS, LANGUAGES, fill } from './i18n.js';
import CALLS from './calls.json';
import { messagesFor } from './whatsapp.js';
import { createStage } from './stage.js';
import { createRecordings } from './recordings.js';
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
const tr = (key) => (STRINGS[lang] && STRINGS[lang][key]) || STRINGS.en[key] || key;
const locale = () => (LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0]).locale;
// Put a translated text (or attribute) on an element and remember the key for the language switcher.
function say(el, key, attr) {
  if (!el) return;
  if (attr) { el.dataset.i18nAttr = `${attr}:${key}`; el.setAttribute(attr, tr(key)); return; }
  if (key) { el.dataset.i18n = key; el.textContent = tr(key); } else { delete el.dataset.i18n; el.textContent = ''; }
}
let stage = null;
let recordings = null;

function renderWhatsapp() {
  $$('[data-wa-call]').forEach((el) => {
    const call = CALLS.find((c) => c.id === el.dataset.waCall);
    if (!call) return;
    const msgs = messagesFor(call.events, { business: call.name, when: call.when.split(' ').pop() }, tr, locale());
    const text = msgs[el.dataset.waKind];
    if (text) el.textContent = text;
  });
}

function applyLanguage(next, remember = true) {
  lang = STRINGS[next] ? next : 'en';
  document.documentElement.lang = lang;
  $$('[data-i18n]').forEach((el) => { el.textContent = tr(el.dataset.i18n); });
  $$('[data-i18n-attr]').forEach((el) => {
    el.dataset.i18nAttr.split(';').forEach((pair) => { const [attr, key] = pair.split(':'); if (attr && key) el.setAttribute(attr, tr(key)); });
  });
  $$('[data-lang]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.lang === lang)));
  renderWhatsapp();
  refreshWhatsappLinks();
  updateCalc();
  if (stage) stage.refreshText();
  if (lastEvents) showSummary(lastEvents);
  if (remember) store.set('fd-lang', lang);
}
$$('[data-lang]').forEach((button) => button.addEventListener('click', () => applyLanguage(button.dataset.lang)));

/* ---------------------------------------------------------------- Contact details */
function refreshWhatsappLinks() {
  const text = encodeURIComponent(tr('start.wa.intro'));
  $$('[data-wa-link]').forEach((el) => el.setAttribute('href', `https://wa.me/${waDigits(setting('whatsapp'))}?text=${text}`));
}
$$('[data-text]').forEach((el) => { el.textContent = setting(el.dataset.text); });
$$('[data-tel]').forEach((el) => el.setAttribute('href', `tel:${dial(setting(el.dataset.tel))}`));
$$('[data-mailto]').forEach((el) => el.setAttribute('href', `mailto:${setting(el.dataset.mailto)}`));
$$('[data-ph]').forEach((el) => { el.hidden = setting(el.dataset.ph) !== PLACEHOLDERS[el.dataset.ph]; });
$$('[data-wa-link]').forEach((el) => el.setAttribute('target', '_blank'));
const vat = String(CONFIG.vatNote || '').trim();
$$('[data-vat]').forEach((el) => { el.textContent = vat; });
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
  if (themeColor) themeColor.setAttribute('content', dark ? '#15120F' : '#F5EFE3');
  if (remember) store.set('fd-theme', dark ? 'dark' : 'light');
}
applyTheme(document.documentElement.classList.contains('dark'), false);
$$('[data-theme-toggle]').forEach((button) => button.addEventListener('click', () => applyTheme(!document.documentElement.classList.contains('dark'), true)));
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

/* ---------------------------------------------------------------- Fade-ins and the two lanes */
const revealItems = $$('[data-reveal]');
const lanes = $('[data-lanes]');
if ('IntersectionObserver' in window && !reduceMotion) {
  const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
    if (entry.isIntersecting) { entry.target.classList.add('is-visible', 'is-in'); observer.unobserve(entry.target); }
  }), { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
  revealItems.forEach((el) => observer.observe(el));
  if (lanes) observer.observe(lanes);
} else {
  revealItems.forEach((el) => el.classList.add('is-visible'));
  if (lanes) lanes.classList.add('is-in');
}

/* ---------------------------------------------------------------- The call stage and the recordings */
const stageRoot = $('#stage');
if (stageRoot) {
  stage = createStage(stageRoot, { say, reduceMotion, onSound: () => recordings && recordings.pause() });
  $$('[data-stage-sound]').forEach((button) => button.addEventListener('click', () => {
    const rect = stageRoot.getBoundingClientRect();
    if (rect.top < 0 || rect.bottom > window.innerHeight) stageRoot.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
    stage.playSound();
  }));
}
recordings = createRecordings({ tablist: $('#rec-tabs'), audio: $('#rec-audio'), say, onPlay: () => stage && stage.pauseSound() });
$$('[data-play-rec]').forEach((link) => link.addEventListener('click', (event) => {
  event.preventDefault();
  $('#rec-tabs').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
  recordings.playCall(link.dataset.playRec);
}));

/* ---------------------------------------------------------------- Tabs (industries) */
function initTabs(tablist) {
  const tabs = $$('[role="tab"]', tablist);
  const select = (tab, focus) => {
    tabs.forEach((item) => {
      const active = item === tab;
      item.setAttribute('aria-selected', String(active));
      item.tabIndex = active ? 0 : -1;
      document.getElementById(item.getAttribute('aria-controls')).hidden = !active;
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
initTabs($('#ind-tabs'));

/* ---------------------------------------------------------------- FAQ */
$$('.faq-item').forEach((item) => {
  const button = $('.faq-q', item);
  button.addEventListener('click', () => {
    const open = item.dataset.open !== 'true';
    item.dataset.open = String(open);
    button.setAttribute('aria-expanded', String(open));
  });
});

/* ---------------------------------------------------------------- Calculator: the owner's own numbers */
const rand = (n) => `R${Math.round(n).toLocaleString('en-US')}`;
function updateCalc() {
  const missed = Number($('#calc-missed').value);
  const value = Number($('#calc-value').value);
  const rate = Number($('#calc-rate').value);
  $$('#calc .range').forEach((input) => {
    const p = ((Number(input.value) - Number(input.min)) / (Number(input.max) - Number(input.min))) * 100;
    input.style.setProperty('--p', `${p}%`);
    const shown = input.id === 'calc-value' ? Number(input.value).toLocaleString('en-US') : input.value;
    $(`#${input.id}-out`).textContent = `${input.dataset.prefix}${shown}${input.dataset.suffix}`;
  });
  const monthly = missed * 4.33 * value * (rate / 100);
  $('#calc-result').textContent = rand(monthly);
  const ratio = monthly / 1999;
  const verdict = $('#calc-verdict');
  if (ratio >= 1) { verdict.removeAttribute('data-i18n'); verdict.textContent = fill(tr('calc.covers'), { x: ratio >= 10 ? Math.round(ratio) : ratio.toFixed(1) }); } else say(verdict, 'calc.short');
}
$$('#calc .range').forEach((input) => input.addEventListener('input', updateCalc));

/* ---------------------------------------------------------------- Free trial form */
const form = $('#start-form');
const success = $('#start-success');
let submitted = false;
const cleanPhone = (v) => v.replace(/[\s\-().]/g, '');
const validSaPhone = (v) => /^(?:\+27|0027|27|0)[1-8]\d{8}$/.test(cleanPhone(v));
const validators = {
  name: (v) => (v.length >= 2 ? '' : 'start.err.name'),
  business: (v) => (v.length >= 2 ? '' : 'start.err.business'),
  type: (v) => (v ? '' : 'start.err.type'),
  phone: (v) => (validSaPhone(v) || /^\+\d{8,15}$/.test(cleanPhone(v)) ? '' : 'start.err.phone'),
  email: (v) => (!v || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? '' : 'start.err.email'),
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
$$('[data-plan]').forEach((link) => link.addEventListener('click', () => { control('plan').value = link.dataset.plan; }));
function trialLink() {
  const typeOption = control('type').selectedOptions[0];
  const when = form.querySelector('input[name="when"]:checked');
  const lines = [
    tr('start.wa.intro'), '',
    `${tr('start.name')}: ${value('name')}`,
    `${tr('start.business')}: ${value('business')}`,
    `${tr('start.type')}: ${typeOption ? typeOption.textContent : ''}`,
    `${tr('start.phone')}: ${value('phone')}`,
  ];
  if (value('email')) lines.push(`${tr('start.email').replace(/\s*\(.*\)$/, '')}: ${value('email')}`);
  lines.push(`${tr('start.when')} ${tr(when && when.value === 'all' ? 'start.when.all' : 'start.when.busy')}`);
  if (value('plan')) lines.push(`Plan: ${value('plan')}`);
  return `https://wa.me/${waDigits(setting('whatsapp'))}?text=${encodeURIComponent(lines.join('\n'))}`;
}
form.addEventListener('submit', (event) => {
  event.preventDefault();
  submitted = true;
  const invalid = Object.keys(validators).filter((name) => !validateField(name));
  if (invalid.length) { control(invalid[0]).focus(); return; }
  const link = trialLink();
  $('#start-whatsapp').setAttribute('href', link);
  form.hidden = true;
  success.hidden = false;
  success.focus();
  window.open(link, '_blank', 'noopener');
});
$('#start-edit').addEventListener('click', () => { success.hidden = true; form.hidden = false; control('name').focus(); });

/* ---------------------------------------------------------------- Live demo */
const demoBox = $('#demo-box');
const micButton = $('#mic-button');
const micStatus = $('#mic-status');
const micTimer = $('#mic-timer');
const transcript = $('#transcript');
const transcriptEmpty = $('#transcript-empty');
const summary = $('#live-summary');
let business = 'dentist';
let call = null;
let agentLine = null;
let pendingUser = null;
let lastEvents = null;
let maxSeconds = 180;

$$('[data-biz]').forEach((chip) => chip.addEventListener('click', () => {
  if (call) return; // do not switch business in the middle of a call
  business = chip.dataset.biz;
  $$('[data-biz]').forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
}));

function showDemo(state) {
  demoBox.dataset.state = state;
  $$('[data-show]', demoBox).forEach((el) => { el.hidden = el.dataset.show !== state; });
}
const clock = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
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
  li.className = `t-line${who === 'you' ? ' is-you' : ''}`;
  const label = document.createElement('span');
  label.className = 'cap-who';
  say(label, who === 'you' ? 'try.you' : 'stage.ai');
  const bubble = document.createElement('p');
  li.append(label, bubble);
  transcript.append(li);
  return { li, bubble };
}
function addNote(key) {
  transcriptEmpty.hidden = true;
  const li = document.createElement('li');
  li.className = 'flex';
  const note = document.createElement('p');
  note.className = 't-note';
  say(note, key);
  li.append(note);
  transcript.append(li);
  transcript.scrollTop = transcript.scrollHeight;
}
const scrollTranscript = () => { transcript.scrollTop = transcript.scrollHeight; };
const BUSINESS_NAMES = { dentist: 'Milkwood Dental', salon: 'Studio Lumi', physio: 'Harbour Physio', plumber: 'Khoza Plumbing' };
function showSummary(events) {
  lastEvents = events;
  const now = new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Johannesburg', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date());
  const msgs = messagesFor(events, { business: BUSINESS_NAMES[business], when: now }, tr, locale());
  const text = $('#live-summary-text');
  if (msgs.owner) { text.removeAttribute('data-i18n'); text.textContent = msgs.owner; } else say(text, 'try.summary.none');
  summary.hidden = false;
}

const ERROR_KEYS = { no_mic_support: 'try.err.nomic', mic_denied: 'try.err.mic', busy: 'try.err.busy', rate_limited: 'try.err.limit', daily_limit: 'try.err.limit', network: 'try.err.network' };
const END_KEYS = { user: 'try.status.ended', time_limit: 'try.status.timeup', network: 'try.err.network', left_page: 'try.status.ended' };

async function beginCall() {
  if (stage) stage.pauseSound();
  if (recordings) recordings.pause();
  setMic('busy');
  say(micStatus, 'try.status.connecting');
  transcript.replaceChildren();
  transcriptEmpty.hidden = false;
  summary.hidden = true;
  lastEvents = null;
  agentLine = null;
  pendingUser = null;
  let events = [];
  try {
    call = await startCall({
      apiBase: API,
      business,
      handlers: {
        state(name, detail) {
          if (name === 'live') { setMic('live'); say(micStatus, 'try.status.live'); }
          if (name === 'ended') {
            call = null;
            if (pendingUser && !pendingUser.bubble.textContent) pendingUser.li.remove();
            setMic('idle');
            say(micStatus, END_KEYS[detail] || 'try.status.ended');
            showSummary(events);
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
          // The provider sometimes repeats the previous chunk at the start of the next one: merge them.
          const last = transcript.lastElementChild;
          const lastText = last && last.classList.contains('is-you') ? last.querySelector('p').textContent : '';
          if (lastText && text.startsWith(lastText)) {
            if (pendingUser && pendingUser.li !== last) pendingUser.li.remove();
            last.querySelector('p').textContent = text;
            pendingUser = null;
            scrollTranscript();
            return;
          }
          if (!pendingUser) pendingUser = addLine('you');
          pendingUser.li.hidden = false;
          pendingUser.bubble.textContent = text;
          pendingUser = null;
          scrollTranscript();
        },
        tool() { addNote('try.tool'); },
        events(list) { events = list; },
      },
    });
  } catch (error) {
    call = null;
    setMic('idle');
    micTimer.textContent = clock(maxSeconds);
    if (error.code === 'not_configured') { showDemo('off'); return; }
    say(micStatus, ERROR_KEYS[error.code] || 'try.err.generic');
  }
}
micButton.addEventListener('click', () => { if (call) call.end('user'); else if (micButton.dataset.state !== 'busy') beginCall(); });

// Phone test (Twilio): only shown when the backend says it is set up.
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
    const res = await fetch(`${API}/api/demo/call-me`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: input.value, business }) });
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
    if (health.demo && health.demo.maxSeconds) { maxSeconds = health.demo.maxSeconds; micTimer.textContent = clock(maxSeconds); }
    if (health.phone && health.phone.configured && health.phone.number) {
      const pretty = health.phone.number.replace(/^\+27(\d{2})(\d{3})(\d{4})$/, '0$1 $2 $3');
      $('#dial-number').textContent = pretty;
      $('#dial-link').setAttribute('href', `tel:${health.phone.number}`);
      $('#phone-test').hidden = false;
      const header = $('#header-demo');
      header.setAttribute('href', `tel:${health.phone.number}`);
      header.dataset.ready = 'true';
    }
  } catch {
    showDemo('off'); // no backend reachable: the recorded calls still play
  }
  const header = $('#header-demo');
  if (header.dataset.ready !== 'true') header.remove(); // no demo line to call yet
}

/* ---------------------------------------------------------------- Start */
setMic('idle');
updateCalc();
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
window.__frontDesk = { stage: () => stage, recordings: () => recordings };
