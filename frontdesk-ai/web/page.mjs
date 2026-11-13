// The page template (v2). All wording comes from src/i18n.js: English is rendered into the HTML,
// and each element carries a data-i18n key so the language switcher can swap it.
// The hero and the recordings use the real calls in src/calls.json.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { siWhatsapp, siGmail } from 'simple-icons';
import { LANGUAGES } from './src/i18n.js';
import { messagesFor, shortDay, normaliseEvents } from './src/whatsapp.js';

const here = path.dirname(fileURLToPath(import.meta.url));
export const CALLS = JSON.parse(fs.readFileSync(path.join(here, 'src', 'calls.json'), 'utf8'));

function lucide(name, cls = 'h-5 w-5', stroke = 2) {
  const file = path.join(here, '..', 'node_modules', 'lucide-static', 'icons', `${name}.svg`);
  if (!fs.existsSync(file)) throw new Error(`Unknown icon: ${name}`);
  const inner = fs.readFileSync(file, 'utf8').replace(/<!--[\s\S]*?-->/g, '').match(/<svg[^>]*>([\s\S]*?)<\/svg>/)[1].replace(/\s+/g, ' ').replace(/> </g, '><').replace(/ \/>/g, '/>').trim();
  return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
}
const brand = (icon, cls = 'h-6 w-6', color = `#${icon.hex}`) => `<svg class="${cls}" viewBox="0 0 24 24" fill="${color}" aria-hidden="true"><path d="${icon.path}"/></svg>`;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// A hand-drawn arrow for the handwritten notes.
const arrow = (cls = '') => `<svg class="hand-arrow ${cls}" viewBox="0 0 80 48" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8c14-4 34 0 46 12 6 6 10 13 12 20"/><path d="M52 36l10 6 4-12"/></svg>`;
const clock = (s) => `${Math.floor(s / 60)}:${String(Math.round(s) % 60).padStart(2, '0')}`;

export function renderPage({ env, strings }) {
  const t = (key) => { if (!(key in strings)) throw new Error(`Missing text: ${key}`); return strings[key]; };
  const h = (key) => esc(t(key));
  // An element whose text the language switcher can replace.
  const x = (key, tag = 'span', cls = '', attrs = '') => `<${tag}${cls ? ` class="${cls}"` : ''} data-i18n="${key}"${attrs ? ` ${attrs}` : ''}>${h(key)}</${tag}>`;
  const PH = (key) => `<span class="ph-tag" data-ph="${key}">Placeholder</span>`;
  const check = (cls = 'h-4 w-4') => lucide('check', cls, 3);
  const play = (cls) => `<svg class="${cls}" viewBox="0 0 10 12" fill="currentColor" aria-hidden="true"><path d="M0 0v12l10-6z"/></svg>`;
  const pause = (cls) => `<svg class="${cls}" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true"><path d="M1 0h3.5v12H1zM7.5 0H11v12H7.5z"/></svg>`;
  const waBadge = brand(siWhatsapp, 'h-4 w-4');

  const NAV = [['#how', 'nav.how'], ['#try', 'nav.try'], ['#pricing', 'nav.pricing'], ['#faq', 'nav.faq']];
  const langButtons = (id) => `<div class="lang-switch" role="group" aria-label="${h('nav.language')}" data-i18n-attr="aria-label:nav.language" id="${id}">
${LANGUAGES.map((l) => `          <button type="button" data-lang="${l.code}" aria-pressed="${l.code === 'en'}" title="${l.label}"><span aria-hidden="true">${l.short}</span><span class="sr-only">${l.label}</span></button>`).join('\n')}
        </div>`;
  const logo = `<span class="logo-mark">${lucide('phone-call', 'h-[1.125rem] w-[1.125rem]', 2.5)}</span><span class="font-display text-[1.1875rem] font-extrabold tracking-tight">Front Desk AI</span>`;

  // ---------------------------------------------------------------- Captions for a recorded call
  const captions = (call, cls = '') => `<ol class="captions ${cls}" data-captions="${call.id}">
${call.lines.map((line) => `            <li class="cap cap-${line.who}" data-t="${line.t}"><span class="cap-who" data-i18n="${line.who === 'ai' ? 'stage.ai' : 'stage.caller'}">${h(line.who === 'ai' ? 'stage.ai' : 'stage.caller')}</span><p>${esc(line.text)}</p></li>`).join('\n')}
          </ol>`;

  // ---------------------------------------------------------------- 1. Header
  const header = `
<a href="#main" class="skip-link" data-i18n="nav.skip">${h('nav.skip')}</a>

<header id="site-header" class="site-header">
  <div class="wrap flex h-16 items-center justify-between gap-3">
    <a href="#top" class="flex items-center gap-2.5 text-ink" aria-label="Front Desk AI">${logo}</a>
    <nav class="hidden items-center gap-7 lg:flex" aria-label="Main">
${NAV.map(([href, key]) => `      <a class="nav-link" href="${href}" data-i18n="${key}">${h(key)}</a>`).join('\n')}
    </nav>
    <div class="flex items-center gap-1.5">
      <a id="header-demo" href="#try" class="btn btn-ghost btn-sm hidden xl:inline-flex">${lucide('phone', 'h-4 w-4', 2.25)}<span data-i18n="nav.demoline">${h('nav.demoline')}</span></a>
      <div class="hidden sm:block">${langButtons('lang-desktop')}</div>
      <button type="button" class="icon-btn" data-theme-toggle aria-pressed="false" aria-label="${h('nav.theme')}" data-i18n-attr="aria-label:nav.theme">
        <span data-icon="moon">${lucide('moon', 'h-5 w-5')}</span><span data-icon="sun" hidden>${lucide('sun', 'h-5 w-5')}</span>
      </button>
      <a href="#start" class="btn btn-accent btn-sm hidden md:inline-flex" data-i18n="nav.trial">${h('nav.trial')}</a>
      <button id="menu-toggle" type="button" class="icon-btn lg:hidden" aria-expanded="false" aria-controls="mobile-menu" aria-label="${h('nav.menu')}" data-i18n-attr="aria-label:nav.menu">
        <span data-icon="open">${lucide('menu', 'h-6 w-6')}</span><span data-icon="close" hidden>${lucide('x', 'h-6 w-6')}</span>
      </button>
    </div>
  </div>
  <div id="mobile-menu" class="border-t border-line bg-paper lg:hidden" hidden>
    <nav class="wrap flex flex-col py-3" aria-label="Mobile">
${NAV.map(([href, key]) => `      <a class="flex min-h-[3rem] items-center border-b border-line font-display text-lg font-bold text-ink" href="${href}" data-i18n="${key}">${h(key)}</a>`).join('\n')}
      <div class="mt-4 flex items-center justify-between gap-3 sm:hidden">${x('nav.language', 'span', 'text-sm font-semibold text-muted')}${langButtons('lang-mobile')}</div>
      <a href="#start" class="btn btn-accent mb-2 mt-4 w-full" data-i18n="nav.trial">${h('nav.trial')}</a>
    </nav>
  </div>
</header>`;

  // ---------------------------------------------------------------- 2. Hero with the call stage
  const hero = CALLS.find((c) => c.id === 'dentist');
  const heroMsgs = messagesFor(hero.events, { business: hero.name, when: hero.when.split(' ').pop() }, t, 'en-ZA');
  const heroBooking = normaliseEvents(hero.events).find((e) => e.type === 'booking');
  const heroCheck = hero.events.find((e) => e.type === 'check_availability');
  const bookT = hero.events.find((e) => e.type === 'book_appointment').t;
  const slots = ['08:00', '08:30', '09:00', '09:30'];
  const diaryRows = slots.map((time) => {
    const target = heroBooking && heroBooking.time === time;
    const open = (heroCheck && heroCheck.result.slots || []).some((s) => s.time === time);
    return `              <li class="diary-row${target ? ' diary-target' : ''}"><span class="diary-time">${time}</span>${target
      ? `<span class="diary-slot"><span class="diary-empty" data-i18n="stage.free">${h('stage.free')}</span><span class="diary-filled">${esc(heroBooking.name)} · ${esc(heroBooking.service)}</span></span>`
      : `<span class="diary-slot ${open ? '' : 'is-taken'}" data-i18n="${open ? 'stage.free' : 'stage.taken'}">${h(open ? 'stage.free' : 'stage.taken')}</span>`}</li>`;
  }).join('\n');

  const heroSection = `
<section id="top-hero" class="hero relative overflow-hidden" aria-labelledby="hero-title">
  <div class="wrap grid grid-cols-1 items-center gap-10 pb-16 pt-8 sm:pt-12 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-12 lg:pb-24 lg:pt-16">
    <div>
      <p class="kicker">${x('hero.kicker')}</p>
      <h1 id="hero-title" class="hero-title mt-5" data-i18n="hero.title">${h('hero.title')}</h1>
      ${x('hero.sub', 'p', 'lead mt-6 max-w-xl')}
      <div class="mt-8 flex flex-col gap-3 sm:flex-row">
        <a href="#start" class="btn btn-accent btn-lg" data-i18n="hero.cta">${h('hero.cta')}</a>
        <button type="button" class="btn btn-line btn-lg" data-stage-sound>${play('h-3.5 w-3.5')}<span data-i18n="hero.listen">${h('hero.listen')}</span></button>
      </div>
      <ul class="mt-8 grid gap-2.5 text-[0.9375rem] font-semibold text-ink sm:grid-cols-3 sm:gap-4">
${['hero.point1', 'hero.point2', 'hero.point3'].map((k) => `        <li class="flex items-start gap-2"><span class="tick">${check('h-3.5 w-3.5')}</span><span data-i18n="${k}">${h(k)}</span></li>`).join('\n')}
      </ul>
      ${x('hero.terms', 'p', 'mt-5 text-sm font-medium text-muted')}
    </div>

    <div class="relative">
      <p class="hand-note hidden lg:flex" aria-hidden="true"><span data-i18n="hero.note">${h('hero.note')}</span>${arrow()}</p>
      <!-- THE CALL STAGE: a real recorded call, played step by step. Timings come from src/calls.json. -->
      <div id="stage" class="stage" data-call="dentist" data-duration="${hero.duration}" data-book="${bookT}" data-check="${heroCheck ? heroCheck.t : 0}" data-src="${hero.file}" role="region" aria-label="${h('stage.label')}" data-i18n-attr="aria-label:stage.label">
        <div class="stage-top">
          <p class="stage-when"><span class="font-bold text-ink">${esc(hero.when)}</span> · ${esc(hero.name)}, ${esc(hero.area.split(',')[0])}</p>
          <p class="stage-status" aria-live="polite"><span class="status-dot"></span><span data-status-text data-i18n="stage.answered">${h('stage.answered')}</span></p>
        </div>
        <div class="stage-grid">
          <div class="stage-call">
            <div class="stage-h"><span data-i18n="stage.call">${h('stage.call')}</span><span class="stage-clock tabular-nums" data-stage-clock>${clock(hero.duration)}</span></div>
            <div class="caption-window">
          ${captions(hero, 'is-stage')}
            </div>
          </div>
          <div class="stage-side">
            <div class="stage-h" data-i18n="stage.diary">${h('stage.diary')}</div>
            <div class="diary" data-diary>
              <p class="diary-day">${esc(shortDay(heroBooking.date))}</p>
              <ol>
${diaryRows}
              </ol>
            </div>
            <div class="stage-h is-start mt-4">${waBadge}<span data-i18n="stage.whatsapp">${h('stage.whatsapp')}</span></div>
            <div class="wa-wall">
              <div class="wa-msg" data-wa="client"><span class="wa-to" data-i18n="stage.toClient">${h('stage.toClient')}</span><p data-wa-call="dentist" data-wa-kind="client">${esc(heroMsgs.client)}</p></div>
              <div class="wa-msg" data-wa="owner"><span class="wa-to" data-i18n="stage.toOwner">${h('stage.toOwner')}</span><p data-wa-call="dentist" data-wa-kind="owner">${esc(heroMsgs.owner)}</p><span class="wa-link">${lucide('play', 'h-3 w-3', 2.5)}<span data-i18n="wa.listen">${h('wa.listen')}</span></span></div>
            </div>
          </div>
        </div>
        <div class="stage-bar">
          <button type="button" class="stage-btn" data-stage-toggle aria-label="${h('stage.pause')}"><span data-icon="pause">${pause('h-3.5 w-3.5')}</span><span data-icon="play" hidden>${play('ml-0.5 h-3.5 w-3.5')}</span></button>
          <div class="stage-progress" aria-hidden="true"><span data-stage-progress></span></div>
          <button type="button" class="stage-sound" data-stage-sound>${lucide('volume-2', 'h-4 w-4', 2.25)}<span data-i18n="stage.play">${h('stage.play')}</span></button>
        </div>
        <audio id="stage-audio" preload="none"></audio>
      </div>
      ${x('stage.recording', 'p', 'mt-3 text-xs text-muted')}
      <p class="stage-error mt-2 text-sm font-semibold text-accent" data-stage-error hidden data-i18n="stage.error">${h('stage.error')}</p>
    </div>
  </div>
</section>`;

  // ---------------------------------------------------------------- 3. Lost twice
  const lane = (side, rows, endKey, noteKey, tone) => `
      <div class="lane lane-${tone}" data-lane>
        <h3 class="lane-title">${tone === 'bad' ? lucide('phone-missed', 'h-5 w-5', 2.25) : lucide('phone-call', 'h-5 w-5', 2.25)}<span data-i18n="${side}">${h(side)}</span></h3>
        <ol class="lane-rows">
${rows.map(([time, key], i) => `          <li class="lane-row" style="--i:${i}"><span class="lane-time">${time}</span><span data-i18n="${key}">${h(key)}</span></li>`).join('\n')}
        </ol>
        <p class="lane-end" style="--i:${rows.length}"><span data-i18n="${endKey}">${h(endKey)}</span><span class="hand-inline" data-i18n="${noteKey}">${h(noteKey)}</span></p>
      </div>`;
  const lost = `
<section id="lost" class="section bg-paper2" aria-labelledby="lost-title">
  <div class="wrap">
    <div class="section-head" data-reveal>
      <h2 id="lost-title" class="h2" data-i18n="lost.title">${h('lost.title')}</h2>
      ${x('lost.sub', 'p', 'lead mt-4')}
    </div>
    <div class="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2" data-lanes>
${lane('lost.without', [['18:42', 'lost.a1'], ['18:43', 'lost.a2'], ['18:44', 'lost.a3'], ['19:30', 'lost.a4'], ['19:30', 'lost.a5']], 'lost.aEnd', 'lost.aNote', 'bad')}
${lane('lost.with', [['18:42', 'lost.b1'], ['18:42', 'lost.b2'], ['18:44', 'lost.b3'], ['18:44', 'lost.b4'], ['18:45', 'lost.b5']], 'lost.bEnd', 'lost.bNote', 'good')}
    </div>
    <p class="mt-6 max-w-2xl text-sm text-muted" data-reveal><span data-i18n="lost.foot">${h('lost.foot')}</span> <a class="text-link" href="https://www.itweb.co.za/article/call-screen-culture-hurts-small-businesses-snupit-warns/GxwQDM1DWpJ7lPVo" target="_blank" rel="noopener" data-i18n="lost.source">${h('lost.source')}</a></p>
  </div>
</section>`;

  // ---------------------------------------------------------------- 4. Try it
  const BIZ = ['dentist', 'salon', 'physio', 'plumber'];
  const recTabs = CALLS.map((c, i) => `        <button type="button" role="tab" class="rec-tab" id="rec-tab-${c.id}" aria-controls="rec-panel-${c.id}" aria-selected="${i === 0}" data-i18n="try.rec.${c.id}">${h(`try.rec.${c.id}`)}</button>`).join('\n');
  const recPanels = CALLS.map((c) => {
    const msgs = messagesFor(c.events, { business: c.name, when: c.when.split(' ').pop() }, t, 'en-ZA');
    return `      <div id="rec-panel-${c.id}" role="tabpanel" aria-labelledby="rec-tab-${c.id}" class="rec-panel" data-rec="${c.id}" data-src="${c.file}" data-duration="${c.duration}">
        <div class="rec-player">
          <button type="button" class="rec-play" aria-pressed="false"><span data-icon="play">${play('ml-0.5 h-4 w-4')}</span><span data-icon="pause" hidden>${pause('h-4 w-4')}</span><span class="sr-only" data-rec-verb data-i18n="try.rec.play">${h('try.rec.play')}</span></button>
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-bold text-ink">${esc(c.when)} · ${esc(c.name)}</p>
            <div class="rec-bar" aria-hidden="true"><span></span></div>
          </div>
          <span class="rec-time tabular-nums">0:00 / ${clock(c.duration)}</span>
        </div>
        <div class="rec-body">
          <div class="caption-window is-tall" tabindex="0" role="region" aria-label="${h('try.rec.transcript')}" data-i18n-attr="aria-label:try.rec.transcript">
          ${captions(c)}
          </div>
          <div class="wa-wall">
${msgs.client ? `            <div class="wa-msg is-shown"><span class="wa-to" data-i18n="stage.toClient">${h('stage.toClient')}</span><p data-wa-call="${c.id}" data-wa-kind="client">${esc(msgs.client)}</p></div>` : ''}
            <div class="wa-msg is-shown"><span class="wa-to" data-i18n="stage.toOwner">${h('stage.toOwner')}</span><p data-wa-call="${c.id}" data-wa-kind="owner">${esc(msgs.owner)}</p></div>
          </div>
        </div>
      </div>`;
  }).join('\n');

  const tryIt = `
<!-- ============================== TRY IT ==============================
     The page asks the backend (/api/health) what is set up:
       voice configured  -> talk in the browser
       Twilio configured -> "call me" and the demo number as well
       nothing reachable -> a notice, and the recorded calls below still play
-->
<section id="try" class="section" aria-labelledby="try-title">
  <div class="wrap">
    <div class="section-head" data-reveal>
      <h2 id="try-title" class="h2" data-i18n="try.title">${h('try.title')}</h2>
      ${x('try.sub', 'p', 'lead mt-4')}
    </div>

    <div id="demo-box" class="card mt-10 p-5 sm:p-7" data-state="checking" data-reveal>
      <p class="step-label" data-i18n="try.pick">${h('try.pick')}</p>
      <div class="mt-3 flex flex-wrap gap-2" role="group" aria-label="${h('try.pick')}" data-i18n-attr="aria-label:try.pick" id="biz-pick">
${BIZ.map((b, i) => `        <button type="button" class="chip" data-biz="${b}" aria-pressed="${i === 0}" data-i18n="try.biz.${b}">${h(`try.biz.${b}`)}</button>`).join('\n')}
      </div>

      <p class="step-label mt-7" data-i18n="try.how">${h('try.how')}</p>
      <p data-show="checking" class="mt-3 flex items-center gap-3 text-base font-semibold text-body" role="status">${lucide('loader-circle', 'h-5 w-5 animate-spin motion-reduce:animate-none')}<span data-i18n="try.checking">${h('try.checking')}</span></p>

      <div data-show="off" class="notice mt-3" hidden>
        <span class="mt-0.5 flex-none">${lucide('circle-alert', 'h-5 w-5', 2.25)}</span>
        <div><p class="font-display text-lg font-bold text-ink" data-i18n="try.off.title">${h('try.off.title')}</p>${x('try.off.text', 'p', 'mt-1 text-[0.9375rem]')}</div>
      </div>

      <div data-show="live" class="mt-3 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]" hidden>
        <div class="flex flex-col items-center rounded-3xl bg-paper2 p-6 text-center">
          <p class="font-display text-xl font-bold text-ink" data-i18n="try.mic.title">${h('try.mic.title')}</p>
          ${x('try.mic.text', 'p', 'mt-1 text-sm text-muted')}
          <button id="mic-button" type="button" class="mic-button mt-5" data-state="idle" aria-describedby="mic-status">
            <span data-icon="idle">${lucide('mic', 'h-9 w-9', 2)}</span>
            <span data-icon="busy" hidden>${lucide('loader-circle', 'h-9 w-9 animate-spin motion-reduce:animate-none', 2)}</span>
            <span data-icon="live" hidden>${lucide('phone-off', 'h-9 w-9', 2)}</span>
            <span class="sr-only" id="mic-label" data-i18n="try.mic.start">${h('try.mic.start')}</span>
          </button>
          <p class="mt-3 font-display text-lg font-bold text-ink" id="mic-caption" data-i18n="try.mic.start">${h('try.mic.start')}</p>
          <p id="mic-status" class="mt-1 min-h-[3rem] text-[0.9375rem] font-medium text-body" role="status" aria-live="polite" data-i18n="try.status.idle">${h('try.status.idle')}</p>
          <p class="pill-timer">${lucide('clock', 'h-4 w-4', 2.5)}<span data-i18n="try.mic.left">${h('try.mic.left')}</span><span id="mic-timer" class="tabular-nums" role="timer" aria-live="off">3:00</span></p>
        </div>
        <div class="flex min-h-[18rem] flex-col gap-4">
          <div class="flex flex-1 flex-col rounded-3xl border border-line p-5">
            <p class="text-sm font-bold uppercase tracking-wider text-muted" data-i18n="try.transcript">${h('try.transcript')}</p>
            <ol id="transcript" class="mt-3 flex-1 space-y-2.5 overflow-y-auto lg:max-h-[18rem]" aria-live="polite" aria-relevant="additions"></ol>
            <p id="transcript-empty" class="my-auto text-center text-[0.9375rem] text-muted" data-i18n="try.empty">${h('try.empty')}</p>
          </div>
          <div id="live-summary" class="wa-wall" hidden>
            <p class="wa-title">${waBadge}<span data-i18n="try.summary">${h('try.summary')}</span></p>
            <div class="wa-msg is-shown"><span class="wa-to" data-i18n="stage.toOwner">${h('stage.toOwner')}</span><p id="live-summary-text"></p></div>
          </div>
        </div>
      </div>

      <div id="phone-test" class="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2" hidden>
        <form id="call-form" class="rounded-3xl border border-line p-5" novalidate>
          <p class="font-display text-lg font-bold text-ink" data-i18n="try.call.title">${h('try.call.title')}</p>
          ${x('try.call.text', 'p', 'mt-1 text-[0.9375rem] text-body')}
          <label class="mt-4 block text-sm font-bold text-ink" for="call-phone" data-i18n="try.call.label">${h('try.call.label')}</label>
          <div class="mt-1.5 flex flex-col gap-2 sm:flex-row">
            <input class="input" id="call-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="082 123 4567" aria-describedby="call-status" required>
            <button type="submit" class="btn btn-ink flex-none">${lucide('phone-call', 'h-4 w-4', 2.25)}<span id="call-button-label" data-i18n="try.call.button">${h('try.call.button')}</span></button>
          </div>
          <p id="call-status" class="mt-3 min-h-[1.5rem] text-[0.9375rem] font-semibold text-body" role="status" aria-live="polite"></p>
        </form>
        <div class="flex flex-col justify-center rounded-3xl border border-line p-5">
          <p class="font-display text-lg font-bold text-ink" data-i18n="try.dial.title">${h('try.dial.title')}</p>
          ${x('try.dial.text', 'p', 'mt-1 text-[0.9375rem] text-body')}
          <a id="dial-link" href="tel:" class="mt-3 inline-flex items-center gap-2.5 font-display text-3xl font-extrabold tracking-tight text-ink hover:text-accent">${lucide('phone', 'h-6 w-6', 2.25)}<span id="dial-number"></span></a>
        </div>
      </div>

      <p class="mt-6 flex items-start gap-2 text-[0.9375rem] text-body">${lucide('languages', 'mt-0.5 h-5 w-5 flex-none text-teal', 2)}<span data-i18n="try.lang">${h('try.lang')}</span></p>
      <p class="mt-2 flex items-start gap-2 text-sm text-muted">${lucide('info', 'mt-0.5 h-4 w-4 flex-none', 2)}<span data-i18n="try.note">${h('try.note')}</span></p>
    </div>

    <div class="mt-12" data-reveal>
      <h3 class="h3" data-i18n="try.rec.title">${h('try.rec.title')}</h3>
      ${x('try.rec.sub', 'p', 'mt-2 max-w-2xl text-[0.9375rem] text-muted')}
      <div class="mt-5 flex flex-wrap gap-2" role="tablist" aria-label="${h('try.rec.title')}" data-i18n-attr="aria-label:try.rec.title" id="rec-tabs">
${recTabs}
      </div>
      <div class="card mt-4 p-4 sm:p-6">
${recPanels}
        <audio id="rec-audio" preload="none"></audio>
      </div>
    </div>
  </div>
</section>`;

  // ---------------------------------------------------------------- 5. Every call ends in four things
  const how = `
<section id="how" class="section bg-paper2" aria-labelledby="how-title">
  <div class="wrap">
    <div class="section-head" data-reveal>
      <h2 id="how-title" class="h2" data-i18n="how.title">${h('how.title')}</h2>
      ${x('how.sub', 'p', 'lead mt-4')}
    </div>
    <ol class="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <li class="card artefact" data-reveal style="--d:0ms">
        <div class="art-frame"><p class="bubble-ai" data-i18n="how.1.quote">${h('how.1.quote')}</p></div>
        <h3 class="art-title"><span class="art-num">1</span><span data-i18n="how.1.title">${h('how.1.title')}</span></h3>
        ${x('how.1.text', 'p', 'art-text')}
      </li>
      <li class="card artefact" data-reveal style="--d:80ms">
        <div class="art-frame"><div class="diary is-mini"><p class="diary-day">${esc(shortDay(heroBooking.date))}</p><ol><li class="diary-row"><span class="diary-time">07:30</span><span class="diary-slot is-taken" data-i18n="stage.taken">${h('stage.taken')}</span></li><li class="diary-row diary-target is-filled"><span class="diary-time">${heroBooking.time}</span><span class="diary-slot"><span class="diary-filled">${esc(heroBooking.name)}</span></span></li></ol></div></div>
        <h3 class="art-title"><span class="art-num">2</span><span data-i18n="how.2.title">${h('how.2.title')}</span></h3>
        ${x('how.2.text', 'p', 'art-text')}
      </li>
      <li class="card artefact" data-reveal style="--d:160ms">
        <div class="art-frame"><div class="wa-wall is-mini"><div class="wa-msg is-shown"><p data-wa-call="dentist" data-wa-kind="client">${esc(heroMsgs.client)}</p></div></div></div>
        <h3 class="art-title"><span class="art-num">3</span><span data-i18n="how.3.title">${h('how.3.title')}</span></h3>
        ${x('how.3.text', 'p', 'art-text')}
      </li>
      <li class="card artefact" data-reveal style="--d:240ms">
        <div class="art-frame"><div class="wa-wall is-mini"><div class="wa-msg is-shown"><p data-wa-call="dentist" data-wa-kind="owner">${esc(heroMsgs.owner)}</p><span class="wa-link">${lucide('play', 'h-3 w-3', 2.5)}<span data-i18n="wa.listen">${h('wa.listen')}</span></span></div></div></div>
        <h3 class="art-title"><span class="art-num">4</span><span data-i18n="how.4.title">${h('how.4.title')}</span></h3>
        ${x('how.4.text', 'p', 'art-text')}
      </li>
    </ol>
    <div class="setup mt-8" data-reveal>
      <p class="font-display text-xl font-bold text-ink" data-i18n="how.setup.title">${h('how.setup.title')}</p>
      <ol class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
${[1, 2, 3].map((n) => `        <li class="flex items-start gap-3"><span class="art-num">${n}</span><span class="text-[0.9375rem] text-body" data-i18n="how.setup.${n}">${h(`how.setup.${n}`)}</span></li>`).join('\n')}
      </ol>
    </div>
  </div>
</section>`;

  // ---------------------------------------------------------------- 6. Handover
  const handCard = (n, icon) => `      <li class="card p-6" data-reveal style="--d:${(n - 1) * 80}ms">
        <span class="icon-plain">${lucide(icon, 'h-6 w-6', 2)}</span>
        <h3 class="mt-4 font-display text-xl font-bold text-ink" data-i18n="hand.${n}.title">${h(`hand.${n}.title`)}</h3>
        <p class="bubble-ai mt-4" data-i18n="hand.${n}.quote">${h(`hand.${n}.quote`)}</p>
        ${n === 2 ? `<a href="#try" class="text-link mt-4 inline-flex items-center gap-1.5 text-sm font-bold" data-play-rec="plumber">${lucide('play', 'h-3.5 w-3.5', 2.5)}<span data-i18n="hand.2.listen">${h('hand.2.listen')}</span></a>` : ''}
      </li>`;
  const handover = `
<section id="handover" class="section" aria-labelledby="hand-title">
  <div class="wrap">
    <div class="section-head" data-reveal>
      <h2 id="hand-title" class="h2" data-i18n="hand.title">${h('hand.title')}</h2>
      ${x('hand.sub', 'p', 'lead mt-4')}
    </div>
    <ul class="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
${handCard(1, 'user-round')}
${handCard(2, 'siren')}
${handCard(3, 'message-square-text')}
    </ul>
    <div class="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div class="card p-6" data-reveal>
        <p class="font-display text-xl font-bold text-ink" data-i18n="hand.wont.title">${h('hand.wont.title')}</p>
        <ul class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
${[1, 2, 3, 4].map((n) => `          <li class="flex items-start gap-2.5 text-[0.9375rem] text-body"><span class="cross">${lucide('x', 'h-3.5 w-3.5', 3)}</span><span data-i18n="hand.wont.${n}">${h(`hand.wont.${n}`)}</span></li>`).join('\n')}
        </ul>
      </div>
      <div class="fact-card" data-reveal style="--d:80ms">
        <p class="text-[1.0625rem] leading-relaxed"><span data-i18n="hand.fact">${h('hand.fact')}</span></p>
        <a class="mt-3 inline-block text-sm font-semibold underline underline-offset-4" href="https://whichvoip.co.za/ai-voice-agent/ai-receptionist-call-data/" target="_blank" rel="noopener">WhichVoIP, ${esc('2026')}</a>
      </div>
    </div>
  </div>
</section>`;

  // ---------------------------------------------------------------- 7. Industries
  const IND = [['med', 'stethoscope'], ['physio', 'activity'], ['salon', 'scissors'], ['guest', 'bed-double'], ['trade', 'wrench']];
  const industries = `
<section id="industries" class="section bg-paper2" aria-labelledby="ind-title">
  <div class="wrap">
    <div class="section-head" data-reveal>
      <h2 id="ind-title" class="h2" data-i18n="ind.title">${h('ind.title')}</h2>
      ${x('ind.sub', 'p', 'lead mt-4')}
    </div>
    <div id="ind-tabs" class="mt-8 flex flex-wrap gap-2" role="tablist" aria-labelledby="ind-title" data-reveal>
${IND.map(([k, icon], i) => `      <button type="button" role="tab" class="chip chip-tab" id="ind-tab-${k}" aria-controls="ind-panel-${k}" aria-selected="${i === 0}">${lucide(icon, 'h-4 w-4', 2.25)}<span data-i18n="ind.${k}.tab">${h(`ind.${k}.tab`)}</span></button>`).join('\n')}
    </div>
${IND.map(([k]) => `    <div id="ind-panel-${k}" role="tabpanel" aria-labelledby="ind-tab-${k}" tabindex="0" class="card mt-4 grid grid-cols-1 gap-6 p-6 sm:p-8 md:grid-cols-2 md:gap-10">
      <div>
        <p class="step-label" data-i18n="ind.asks">${h('ind.asks')}</p>
        <ul class="mt-4 space-y-3">
${[1, 2, 3, 4].map((n) => `          <li class="ask" data-i18n="ind.${k}.q${n}">${h(`ind.${k}.q${n}`)}</li>`).join('\n')}
        </ul>
      </div>
      <div>
        <p class="step-label" data-i18n="ind.gets">${h('ind.gets')}</p>
        <div class="wa-wall mt-4"><div class="wa-msg is-shown"><span class="wa-to" data-i18n="stage.toOwner">${h('stage.toOwner')}</span><p data-i18n="ind.${k}.wa">${h(`ind.${k}.wa`)}</p></div></div>
        <p class="mt-5 text-[0.9375rem] text-body"><span class="font-bold text-ink" data-i18n="ind.fit">${h('ind.fit')}</span>: <span data-i18n="ind.${k}.fit">${h(`ind.${k}.fit`)}</span></p>
      </div>
    </div>`).join('\n')}
    ${x('ind.more', 'p', 'mt-6 text-[0.9375rem] text-muted', 'data-reveal')}
  </div>
</section>`;

  // ---------------------------------------------------------------- 8. Your own numbers
  const slider = (id, key, min, max, step, value, prefix, suffix) => `        <div class="calc-row">
          <div class="flex items-baseline justify-between gap-3"><label for="calc-${id}" class="text-[0.9375rem] font-semibold text-ink" data-i18n="${key}">${h(key)}</label><output for="calc-${id}" class="calc-out tabular-nums" id="calc-${id}-out">${prefix}${value}${suffix}</output></div>
          <input class="range" type="range" id="calc-${id}" min="${min}" max="${max}" step="${step}" value="${value}" data-prefix="${prefix}" data-suffix="${suffix}">
        </div>`;
  const calc = `
<section id="numbers" class="section" aria-labelledby="calc-title">
  <div class="wrap grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center">
    <div data-reveal>
      <h2 id="calc-title" class="h2" data-i18n="calc.title">${h('calc.title')}</h2>
      ${x('calc.sub', 'p', 'lead mt-4')}
      ${x('calc.note', 'p', 'mt-5 text-[0.9375rem] font-semibold text-ink')}
    </div>
    <div class="card p-6 sm:p-8" data-reveal style="--d:80ms">
      <form id="calc" class="space-y-6" onsubmit="return false">
${slider('missed', 'calc.missed', 0, 40, 1, 5, '', '')}
${slider('value', 'calc.value', 100, 5000, 50, 550, 'R', '')}
${slider('rate', 'calc.rate', 10, 100, 10, 50, '', '%')}
      </form>
      <div class="calc-result mt-7">
        <p class="text-sm font-bold uppercase tracking-wider" data-i18n="calc.resultLabel">${h('calc.resultLabel')}</p>
        <p class="mt-1 font-display text-5xl font-extrabold tracking-tight tabular-nums" id="calc-result" aria-live="polite">R5,957</p>
        <p class="mt-2 text-[0.9375rem]"><span data-i18n="calc.compare">${h('calc.compare')}</span> <span id="calc-verdict"></span></p>
      </div>
    </div>
  </div>
</section>`;

  // ---------------------------------------------------------------- 9. Pricing
  const planItem = (k) => `          <li class="flex items-start gap-2.5"><span class="tick">${check('h-3.5 w-3.5')}</span><span data-i18n="${k}">${h(k)}</span></li>`;
  const pricing = `
<section id="pricing" class="section bg-paper2" aria-labelledby="price-title">
  <div class="wrap">
    <div class="section-head" data-reveal>
      <h2 id="price-title" class="h2" data-i18n="price.title">${h('price.title')}</h2>
      ${x('price.sub', 'p', 'lead mt-4')}
    </div>
    <div class="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-2">
      <div class="card plan" data-reveal>
        <p class="plan-name" data-i18n="price.ah.name">${h('price.ah.name')}</p>
        ${x('price.ah.for', 'p', 'mt-1 text-[0.9375rem] text-muted')}
        <p class="mt-5 flex items-baseline gap-2"><span class="plan-price">R999</span><span class="text-base font-semibold text-muted" data-i18n="price.month">${h('price.month')}</span></p>
        <ul class="mt-6 space-y-3 text-[0.9375rem] text-ink">
${['price.ah.1', 'price.ah.2', 'price.ah.3', 'price.ah.4'].map(planItem).join('\n')}
        </ul>
        <a href="#start" class="btn btn-line mt-7 w-full" data-plan="After Hours" data-i18n="price.cta">${h('price.cta')}</a>
      </div>
      <div class="card plan is-featured" data-reveal style="--d:80ms">
        <div class="flex items-center justify-between gap-3"><p class="plan-name" data-i18n="price.fd.name">${h('price.fd.name')}</p><span class="tag" data-i18n="price.fd.tag">${h('price.fd.tag')}</span></div>
        ${x('price.fd.for', 'p', 'mt-1 text-[0.9375rem] text-muted')}
        <p class="mt-5 flex items-baseline gap-2"><span class="plan-price">R1,999</span><span class="text-base font-semibold text-muted" data-i18n="price.month">${h('price.month')}</span></p>
        <ul class="mt-6 space-y-3 text-[0.9375rem] text-ink">
${['price.fd.1', 'price.fd.2', 'price.fd.3', 'price.fd.4', 'price.fd.5'].map(planItem).join('\n')}
        </ul>
        <a href="#start" class="btn btn-accent mt-7 w-full" data-plan="Front Desk" data-i18n="price.cta">${h('price.cta')}</a>
      </div>
    </div>
    <div class="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3" data-reveal>
${['price.inc1', 'price.inc2', 'price.inc3'].map((k) => `      <p class="inc">${check('h-4 w-4 flex-none text-teal')}<span data-i18n="${k}">${h(k)}</span></p>`).join('\n')}
    </div>
    <p class="mt-6 text-[0.9375rem] text-body" data-reveal><span data-i18n="price.multi">${h('price.multi')}</span> <a class="text-link font-semibold" href="#" data-wa-link data-i18n="price.multiLink">${h('price.multiLink')}</a></p>
    <p class="price-line mt-8" data-reveal><span data-i18n="price.line">${h('price.line')}</span></p>
    <p class="mt-4 max-w-3xl text-sm text-muted" data-reveal><span data-i18n="price.small">${h('price.small')}</span> <span data-vat></span></p>
  </div>
</section>`;

  // ---------------------------------------------------------------- 10. FAQ
  const faq = `
<section id="faq" class="section" aria-labelledby="faq-title">
  <div class="wrap max-w-4xl">
    <h2 id="faq-title" class="h2" data-i18n="faq.title" data-reveal>${h('faq.title')}</h2>
    <div class="mt-8" data-reveal>
${[1, 2, 3, 4, 5, 6, 7, 8].map((n) => `      <div class="faq-item" data-open="${n === 1}">
        <h3><button type="button" class="faq-q" id="faq-q-${n}" aria-expanded="${n === 1}" aria-controls="faq-a-${n}"><span data-i18n="faq.${n}.q">${h(`faq.${n}.q`)}</span><span class="faq-icon">${lucide('plus', 'h-5 w-5', 2.5)}</span></button></h3>
        <div class="faq-panel" id="faq-a-${n}" role="region" aria-labelledby="faq-q-${n}"><div><p class="pb-6 pr-12 text-[1.0625rem] leading-relaxed text-body" data-i18n="faq.${n}.a">${h(`faq.${n}.a`)}</p></div></div>
      </div>`).join('\n')}
    </div>
  </div>
</section>`;

  // ---------------------------------------------------------------- 11. Start (free trial form)
  const field = (name, key, attrs, wide = false) => `          <div class="field${wide ? ' sm:col-span-2' : ''}">
            <label for="start-${name}" data-i18n="${key}">${h(key)}</label>
            <input class="input" id="start-${name}" name="${name}" ${attrs} aria-describedby="error-${name}">
            <p class="field-error" id="error-${name}" role="alert" hidden></p>
          </div>`;
  const start = `
<!-- ============================== START ==============================
     No backend for this form yet: it checks the details, shows a confirmation and opens
     WhatsApp with the message filled in. The WhatsApp number is a PLACEHOLDER in site-config.js.
-->
<section id="start" class="section section-ink" aria-labelledby="start-title">
  <div class="wrap grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-start">
    <div data-reveal>
      <h2 id="start-title" class="h2 !text-[color:var(--on-ink)]" data-i18n="start.title">${h('start.title')}</h2>
      ${x('start.sub', 'p', 'lead mt-4 !text-[color:var(--on-ink-soft)]')}
      <ul class="mt-7 space-y-3 text-[0.9375rem] font-semibold">
${['price.inc1', 'price.inc2', 'price.inc3'].map((k) => `        <li class="flex items-start gap-2.5"><span class="tick tick-light">${check('h-3.5 w-3.5')}</span><span data-i18n="${k}">${h(k)}</span></li>`).join('\n')}
      </ul>
      <p class="hand-note-light mt-8 hidden lg:block" aria-hidden="true" data-i18n="price.line">${h('price.line')}</p>
    </div>
    <div class="card p-6 text-ink sm:p-8" data-reveal style="--d:80ms">
      <form id="start-form" novalidate>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
${field('name', 'start.name', 'type="text" autocomplete="name" required')}
${field('business', 'start.business', 'type="text" autocomplete="organization" required')}
          <div class="field sm:col-span-2">
            <label for="start-type" data-i18n="start.type">${h('start.type')}</label>
            <select class="input" id="start-type" name="type" required aria-describedby="error-type">
              <option value="" selected disabled data-i18n="start.type.choose">${h('start.type.choose')}</option>
${[1, 2, 3, 4, 5, 6, 7, 8].map((n) => `              <option value="${n}" data-i18n="start.type.${n}">${h(`start.type.${n}`)}</option>`).join('\n')}
            </select>
            <p class="field-error" id="error-type" role="alert" hidden></p>
          </div>
${field('phone', 'start.phone', 'type="tel" inputmode="tel" autocomplete="tel" placeholder="082 123 4567" required')}
${field('email', 'start.email', 'type="email" inputmode="email" autocomplete="email" placeholder="you@business.co.za"')}
          <fieldset class="field sm:col-span-2">
            <legend data-i18n="start.when">${h('start.when')}</legend>
            <div class="mt-1.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <label class="radio"><input type="radio" name="when" value="busy" checked><span data-i18n="start.when.busy">${h('start.when.busy')}</span></label>
              <label class="radio"><input type="radio" name="when" value="all"><span data-i18n="start.when.all">${h('start.when.all')}</span></label>
            </div>
          </fieldset>
        </div>
        <input type="hidden" name="plan" value="">
        <button type="submit" class="btn btn-accent btn-lg mt-6 w-full" data-i18n="start.submit">${h('start.submit')}</button>
        <p class="mt-4 flex items-start gap-2.5 text-sm text-body"><span class="mt-0.5 flex-none">${brand(siWhatsapp, 'h-5 w-5')}</span><span data-i18n="start.note">${h('start.note')}</span></p>
        <p class="mt-2 text-xs text-muted" data-ph="whatsapp"><span class="ph-tag">Placeholder</span> <span class="ml-1">WhatsApp: <span data-text="whatsapp">+27 00 000 0000</span></span></p>
      </form>
      <div id="start-success" class="py-6 text-center outline-none sm:py-8" tabindex="-1" role="status" hidden>
        <span class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-teal text-white">${check('h-8 w-8')}</span>
        <h3 class="mt-5 font-display text-3xl font-extrabold tracking-tight" data-i18n="start.ok.title">${h('start.ok.title')}</h3>
        ${x('start.ok.text', 'p', 'mx-auto mt-3 max-w-sm text-[1.0625rem] text-body')}
        <div class="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <a id="start-whatsapp" href="https://wa.me/27000000000" target="_blank" rel="noopener" class="btn btn-ink">${brand(siWhatsapp, 'h-5 w-5', '#fff')}<span data-i18n="start.ok.again">${h('start.ok.again')}</span></a>
          <button id="start-edit" type="button" class="btn btn-line" data-i18n="start.ok.edit">${h('start.ok.edit')}</button>
        </div>
      </div>
    </div>
  </div>
</section>`;

  // ---------------------------------------------------------------- 12. Footer
  const footer = `
<footer class="site-footer">
  <div class="wrap">
    <div class="grid grid-cols-1 gap-10 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1.2fr)]">
      <div>
        <a href="#top" class="inline-flex items-center gap-2.5 text-ink" aria-label="Front Desk AI">${logo}</a>
        ${x('foot.desc', 'p', 'mt-4 max-w-sm text-[0.9375rem] leading-relaxed text-body')}
        <p class="mt-4 flex items-center gap-2 text-[0.9375rem] font-semibold text-ink">${lucide('map-pin', 'h-4 w-4 text-accent', 2.25)}<span data-i18n="foot.place">${h('foot.place')}</span></p>
      </div>
      <nav aria-label="Footer">
        ${x('foot.explore', 'p', 'text-sm font-bold uppercase tracking-wider text-muted')}
        <ul class="mt-4 space-y-2.5 text-[0.9375rem] font-semibold text-ink">
${[...NAV, ['#start', 'nav.trial']].map(([href, key]) => `          <li><a class="hover:text-accent" href="${href}" data-i18n="${key}">${h(key)}</a></li>`).join('\n')}
        </ul>
      </nav>
      <div>
        ${x('foot.contact', 'p', 'text-sm font-bold uppercase tracking-wider text-muted')}
        <ul class="mt-4 space-y-3 text-[0.9375rem] font-semibold text-ink">
          <li class="flex flex-wrap items-center gap-2"><a class="contact" href="mailto:hello@example.com" data-mailto="email">${brand(siGmail, 'h-5 w-5')}<span data-text="email">hello@example.com</span></a>${PH('email')}</li>
          <li class="flex flex-wrap items-center gap-2"><a class="contact" href="tel:+27000000000" data-tel="phone">${lucide('phone', 'h-5 w-5 text-accent', 2.25)}<span data-text="phone">+27 00 000 0000</span></a>${PH('phone')}</li>
          <li class="flex flex-wrap items-center gap-2"><a class="contact" href="https://wa.me/27000000000" data-wa-link target="_blank" rel="noopener">${brand(siWhatsapp, 'h-5 w-5')}<span data-i18n="foot.whatsapp">${h('foot.whatsapp')}</span></a>${PH('whatsapp')}</li>
        </ul>
      </div>
    </div>
    <div class="mt-10 flex flex-col gap-2 border-t border-line pt-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
      <p>&copy; <span id="year">2026</span> Front Desk AI. <span data-i18n="foot.rights">${h('foot.rights')}</span></p>
      <p data-i18n="foot.prices">${h('foot.prices')}</p>
    </div>
  </div>
</footer>`;

  // ---------------------------------------------------------------- Search engine data
  const url = `${env.siteUrl}/`;
  const title = 'Front Desk AI | AI Receptionist for South African Businesses';
  const description = 'Front Desk AI is an AI receptionist for South African businesses. It answers your phone when you are busy or closed, books the client and sends you the details on WhatsApp. From R999 a month, no setup fee.';
  const ld = [
    {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      '@id': `${url}#business`,
      name: 'Front Desk AI',
      description: 'An AI receptionist and AI answering service for South African businesses: practices, salons, guesthouses and trades. It answers calls when the team cannot, books appointments and sends the owner every call on WhatsApp.',
      url,
      image: `${env.siteUrl}/og-image.png`,
      telephone: '+27 00 000 0000',
      email: 'hello@example.com',
      priceRange: 'R999 to R3,999 per month',
      address: { '@type': 'PostalAddress', addressLocality: 'Cape Town', addressRegion: 'Western Cape', addressCountry: 'ZA' },
      areaServed: { '@type': 'Country', name: 'South Africa' },
      knowsLanguage: ['en'],
      makesOffer: [
        { '@type': 'Offer', name: 'After Hours', price: '999', priceCurrency: 'ZAR', description: 'Up to 100 calls a month, after hours and when you do not pick up. No setup fee.' },
        { '@type': 'Offer', name: 'Front Desk', price: '1999', priceCurrency: 'ZAR', description: 'Up to 250 calls a month, every call, day and night. No setup fee.' },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({ '@type': 'Question', name: strings[`faq.${n}.q`], acceptedAnswer: { '@type': 'Answer', text: strings[`faq.${n}.a`] } })),
    },
  ];
  const favicon = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#B8431B"/><g transform="translate(6.5 6.5) scale(.79)" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2a9 9 0 0 1 9 9"/><path d="M13 6a5 5 0 0 1 5 5"/><path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"/></g></svg>')}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>${title}</title>
  <meta name="description" content="${esc(description)}">
  <link rel="canonical" href="${url}">
  <meta name="theme-color" content="#F5EFE3">
  <meta name="google-site-verification" content="${esc(env.googleVerification)}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Front Desk AI">
  <meta property="og:locale" content="en_ZA">
  <meta property="og:url" content="${url}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:image" content="${env.siteUrl}/og-image.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="Front Desk AI: when you can't pick up, we answer.">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${esc(description)}">
  <meta name="twitter:image" content="${env.siteUrl}/og-image.png">
  <link rel="icon" href="${favicon}">
  <link rel="preload" href="fonts/bricolage-grotesque-latin-opsz-normal.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="fonts/inter-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="assets/app.css">
  <script>
    // Theme before first paint: saved choice first, then the visitor's system setting.
    (function () {
      var saved = null;
      try { saved = localStorage.getItem('fd-theme'); } catch (e) {}
      var dark = saved ? saved === 'dark' : window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', dark);
      document.documentElement.classList.add('js');
    })();
  </script>
  <script type="application/ld+json">${JSON.stringify(ld[0])}</script>
  <script type="application/ld+json">${JSON.stringify(ld[1])}</script>
</head>
<body id="top" class="bg-paper font-sans text-body antialiased">
${header}

<main id="main">
${heroSection}
${lost}
${tryIt}
${how}
${handover}
${industries}
${calc}
${pricing}
${faq}
${start}
</main>
${footer}

<script src="site-config.js"></script>
<script type="module" src="assets/app.js"></script>
</body>
</html>
`;
}
