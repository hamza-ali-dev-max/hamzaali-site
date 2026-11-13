// The page template (v3). All wording comes from src/i18n.js: English is rendered into the HTML,
// and each element carries a data-i18n key so the language switcher can swap it.
// Everything that moves on the page is driven by the real recorded calls in src/calls.json.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { siWhatsapp, siGmail } from 'simple-icons';
import { LANGUAGES, fill } from './src/i18n.js';
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
const clock = (s) => `${Math.floor(s / 60)}:${String(Math.round(s) % 60).padStart(2, '0')}`;
const round1 = (n) => Math.round(n * 10) / 10;

export function renderPage({ env, strings }) {
  const t = (key) => { if (!(key in strings)) throw new Error(`Missing text: ${key}`); return strings[key]; };
  const h = (key) => esc(t(key));
  // An element whose text the language switcher can replace.
  const x = (key, tag = 'span', cls = '', attrs = '') => `<${tag}${cls ? ` class="${cls}"` : ''} data-i18n="${key}"${attrs ? ` ${attrs}` : ''}>${h(key)}</${tag}>`;
  // The same, for text with {values} in it.
  const xf = (key, values, tag = 'span', cls = '') => `<${tag}${cls ? ` class="${cls}"` : ''} data-i18n="${key}" data-fill="${esc(JSON.stringify(values))}">${esc(fill(t(key), values))}</${tag}>`;
  const PH = (key) => `<span class="ph-tag" data-ph="${key}">Placeholder</span>`;
  const check = (cls = 'h-4 w-4') => lucide('check', cls, 3);
  const play = (cls) => `<svg class="${cls}" viewBox="0 0 10 12" fill="currentColor" aria-hidden="true"><path d="M0 0v12l10-6z"/></svg>`;
  const pause = (cls) => `<svg class="${cls}" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true"><path d="M1 0h3.5v12H1zM7.5 0H11v12H7.5z"/></svg>`;
  const wa = (cls = 'h-4 w-4') => brand(siWhatsapp, cls);

  const NAV = [['#how', 'nav.how'], ['#calls', 'nav.calls'], ['#try', 'nav.try'], ['#pricing', 'nav.pricing'], ['#faq', 'nav.faq']];
  const langButtons = (id) => `<div class="lang-switch" role="group" aria-label="${h('nav.language')}" data-i18n-attr="aria-label:nav.language" id="${id}">
${LANGUAGES.map((l) => `          <button type="button" data-lang="${l.code}" aria-pressed="${l.code === 'en'}" title="${l.label}"><span aria-hidden="true">${l.short}</span><span class="sr-only">${l.label}</span></button>`).join('\n')}
        </div>`;
  const logo = `<span class="logo-mark">${lucide('phone-call', 'h-4 w-4', 2.5)}</span><span class="text-[1.0625rem] font-bold tracking-tight">Front Desk AI</span>`;

  // ---------------------------------------------------------------- Header
  const header = `
<a href="#main" class="skip-link" data-i18n="nav.skip">${h('nav.skip')}</a>

<header id="site-header" class="site-header">
  <div class="wrap flex h-16 items-center justify-between gap-3">
    <a href="#top" class="flex items-center gap-2.5 text-ink" aria-label="Front Desk AI">${logo}</a>
    <nav class="hidden items-center gap-1 lg:flex" aria-label="Main">
${NAV.map(([href, key]) => `      <a class="nav-link" href="${href}" data-i18n="${key}">${h(key)}</a>`).join('\n')}
    </nav>
    <div class="flex items-center gap-1.5">
      <a id="header-demo" href="#try" class="btn btn-ghost btn-sm hidden xl:inline-flex">${lucide('phone', 'h-4 w-4', 2.25)}<span data-i18n="nav.demoline">${h('nav.demoline')}</span></a>
      <div class="hidden sm:block">${langButtons('lang-desktop')}</div>
      <button type="button" class="icon-btn" data-theme-toggle aria-pressed="false" aria-label="${h('nav.theme')}" data-i18n-attr="aria-label:nav.theme">
        <span data-icon="moon">${lucide('moon', 'h-[1.125rem] w-[1.125rem]')}</span><span data-icon="sun" hidden>${lucide('sun', 'h-[1.125rem] w-[1.125rem]')}</span>
      </button>
      <a href="#start" class="btn btn-brand btn-sm hidden md:inline-flex" data-i18n="nav.trial">${h('nav.trial')}</a>
      <button id="menu-toggle" type="button" class="icon-btn lg:hidden" aria-expanded="false" aria-controls="mobile-menu" aria-label="${h('nav.menu')}" data-i18n-attr="aria-label:nav.menu">
        <span data-icon="open">${lucide('menu', 'h-6 w-6')}</span><span data-icon="close" hidden>${lucide('x', 'h-6 w-6')}</span>
      </button>
    </div>
  </div>
  <div id="mobile-menu" class="border-t border-line bg-bg lg:hidden" hidden>
    <nav class="wrap flex flex-col py-3" aria-label="Mobile">
${NAV.map(([href, key]) => `      <a class="flex min-h-[3rem] items-center border-b border-line text-lg font-semibold text-ink" href="${href}" data-i18n="${key}">${h(key)}</a>`).join('\n')}
      <div class="mt-4 flex items-center justify-between gap-3 sm:hidden">${x('nav.language', 'span', 'text-sm font-semibold text-muted')}${langButtons('lang-mobile')}</div>
      <a href="#start" class="btn btn-brand mb-2 mt-4 w-full" data-i18n="nav.trial">${h('nav.trial')}</a>
    </nav>
  </div>
</header>`;

  // ---------------------------------------------------------------- Hero, with the live call scene
  const hero = CALLS.find((c) => c.id === 'dentist');
  const heroMsgs = messagesFor(hero.events, { business: hero.name, when: hero.when.split(' ').pop() }, t, 'en-ZA');
  const heroBooking = normaliseEvents(hero.events).find((e) => e.type === 'booking');
  const heroCheck = hero.events.find((e) => e.type === 'check_availability');
  const bookT = hero.events.find((e) => e.type === 'book_appointment').t;
  const checkT = heroCheck ? heroCheck.t : bookT;
  const sentT = round1(Math.min(bookT + 2.5, hero.duration));
  const openSlots = (heroCheck && heroCheck.result.slots || []).map((s) => s.time);
  const diaryRows = ['07:30', '08:00', '08:30', '09:00'].map((time) => {
    const target = heroBooking && heroBooking.time === time;
    const open = openSlots.includes(time);
    return `          <li class="slot${target ? ' slot-target' : ''}${!target && !open ? ' is-taken' : ''}"><span class="slot-time">${time}</span>${target
      ? `<span class="slot-body"><span class="slot-open" data-i18n="stage.free">${h('stage.free')}</span><span class="slot-booked"><b>${esc(heroBooking.name)}</b> <span class="slot-new" data-i18n="stage.new">${h('stage.new')}</span></span></span>`
      : `<span class="slot-body" data-i18n="${open ? 'stage.free' : 'stage.taken'}">${h(open ? 'stage.free' : 'stage.taken')}</span>`}</li>`;
  }).join('\n');
  const first = hero.lines[0];
  const bars = (n) => Array.from({ length: n }, (_, i) => `<i style="--i:${i}"></i>`).join('');
  const STEPS = [['stage.s1', first.t], ['stage.s2', checkT], ['stage.s3', bookT], ['stage.s4', sentT]];

  const heroSection = `
<section id="hero" class="hero-shell" aria-labelledby="hero-title">
  <div class="hero">
    <div class="hero-grid">
      <div class="hero-copy">
        <p class="kicker-dark"><span class="kicker-dot"></span><span data-i18n="hero.kicker">${h('hero.kicker')}</span></p>
        <h1 id="hero-title" class="hero-title" data-i18n="hero.title">${h('hero.title')}</h1>
        ${x('hero.sub', 'p', 'hero-sub')}
        <div class="mt-8 flex flex-col gap-3 sm:flex-row">
          <a href="#start" class="btn btn-brand btn-lg" data-i18n="hero.cta">${h('hero.cta')}</a>
          <button type="button" class="btn btn-glass btn-lg" data-stage-sound>${lucide('volume-2', 'h-5 w-5', 2)}<span data-i18n="hero.listen">${h('hero.listen')}</span></button>
        </div>
        <ul class="hero-points">
${['hero.p1', 'hero.p2', 'hero.p3'].map((k) => `          <li>${check('h-4 w-4 text-brand-hero')}<span data-i18n="${k}">${h(k)}</span></li>`).join('\n')}
        </ul>
      </div>

      <!-- THE SCENE: a real recorded call, played as it happened. Timings come from src/calls.json. -->
      <div id="stage" class="scene" data-call="dentist" data-duration="${hero.duration}" data-book="${bookT}" data-check="${checkT}" data-sent="${sentT}" data-src="${hero.file}" role="region" aria-label="${h('stage.label')}" data-i18n-attr="aria-label:stage.label">
        <div class="call-card">
          <div class="call-head">
            <span class="call-avatar" aria-hidden="true"><span class="ring"></span><span class="ring ring-2"></span>${lucide('phone', 'h-5 w-5', 2.25)}</span>
            <div class="min-w-0 flex-1">
              <p class="call-kicker"><span data-status-text data-i18n="stage.incoming">${h('stage.incoming')}</span><span aria-hidden="true"> · </span><span class="tabular-nums" data-stage-clock>0:00</span></p>
              <p class="call-name">${esc(hero.name)}</p>
              <p class="call-when">${esc(hero.when)}</p>
            </div>
            <span class="live-pill"><span class="live-dot"></span><span data-i18n="stage.live">${h('stage.live')}</span></span>
          </div>
          <div class="wave" data-wave aria-hidden="true">${bars(36)}</div>
          <div class="caption">
            <p class="caption-who" data-cap-who data-i18n="${first.who === 'ai' ? 'stage.ai' : 'stage.caller'}">${h(first.who === 'ai' ? 'stage.ai' : 'stage.caller')}</p>
            <div class="caption-box"><p class="caption-text" data-cap-text>${esc(first.text)}</p></div>
          </div>
          <ol class="steps">
${STEPS.map(([key, at], i) => `            <li class="step" data-step="${i + 1}" data-at="${at}"><span class="step-dot">${check('h-3 w-3')}</span><span data-i18n="${key}">${h(key)}</span></li>`).join('\n')}
          </ol>
          <div class="call-bar">
            <button type="button" class="round-btn" data-stage-toggle aria-label="${h('stage.pause')}"><span data-icon="pause">${pause('h-3 w-3')}</span><span data-icon="play" hidden>${play('ml-0.5 h-3 w-3')}</span></button>
            <div class="call-progress" aria-hidden="true"><span data-stage-progress></span></div>
            <button type="button" class="sound-btn" data-stage-sound>${lucide('volume-2', 'h-4 w-4', 2.25)}<span data-i18n="stage.play">${h('stage.play')}</span></button>
          </div>
          <audio id="stage-audio" preload="none"></audio>
        </div>

        <div class="scene-side">
          <div class="diary-card" data-diary>
            <p class="side-h">${lucide('calendar-days', 'h-4 w-4', 2.25)}<span data-i18n="stage.diary">${h('stage.diary')}</span><span class="ml-auto font-medium opacity-70">${esc(shortDay(heroBooking.date))}</span></p>
            <ol class="mt-2 space-y-1.5">
${diaryRows}
            </ol>
          </div>
          <div class="toast" data-wa="client"><span class="toast-icon">${wa('h-4 w-4')}</span><div class="min-w-0"><p class="toast-to" data-i18n="stage.toClient">${h('stage.toClient')}</p><p class="toast-text" data-wa-call="dentist" data-wa-kind="client">${esc(heroMsgs.client)}</p></div></div>
          <div class="toast" data-wa="owner"><span class="toast-icon">${wa('h-4 w-4')}</span><div class="min-w-0"><p class="toast-to" data-i18n="stage.toOwner">${h('stage.toOwner')}</p><p class="toast-text" data-wa-call="dentist" data-wa-kind="owner">${esc(heroMsgs.owner)}</p></div></div>
        </div>
      </div>
    </div>
    <div class="hero-foot">
      ${x('stage.recording', 'p', '')}
      <p class="font-semibold text-[color:var(--hero-coral)]" data-stage-error hidden data-i18n="stage.error">${h('stage.error')}</p>
    </div>
  </div>
</section>`;

  // ---------------------------------------------------------------- Ring to booked: the real timeline
  const TIMELINE = [['how.t1', 0, 'phone-incoming'], ['how.t2', first.t, 'audio-lines'], ['how.t3', checkT, 'calendar-search'], ['how.t4', bookT, 'calendar-check'], ['how.t5', sentT, 'message-circle']];
  const how = `
<section id="how" class="section" aria-labelledby="how-title">
  <div class="wrap">
    <div class="section-head" data-reveal>
      <h2 id="how-title" class="h2">${xf('how.title', { s: Math.round(bookT) })}</h2>
      ${x('how.sub', 'p', 'lead')}
    </div>
    <div class="timeline-card" data-reveal>
      <ol class="timeline" data-timeline data-total="${sentT}">
${TIMELINE.map(([key, at, icon], i) => `        <li class="tl-node" data-t="${round1(at)}" style="--n:${i}"><span class="tl-dot">${lucide(icon, 'h-5 w-5', 2)}</span><span class="tl-time tabular-nums">${xf('how.sec', { s: round1(at) })}</span><span class="tl-label" data-i18n="${key}">${h(key)}</span></li>`).join('\n')}
      </ol>
    </div>
  </div>
</section>`;

  // ---------------------------------------------------------------- What it does: four tiles that move
  const viz = {
    1: `<div class="viz viz-ring"><span class="vr-ring"></span><span class="vr-ring vr-2"></span><span class="vr-phone">${lucide('phone-call', 'h-6 w-6', 2)}</span></div>`,
    2: `<div class="viz viz-diary"><span class="vd-row"><b>07:30</b><i></i></span><span class="vd-row vd-target"><b>08:00</b><i><em>Aisha</em></i></span><span class="vd-row"><b>08:30</b><i></i></span></div>`,
    3: `<div class="viz viz-wa"><span class="vw-bubble"><span class="vw-dots"><i></i><i></i><i></i></span><span class="vw-text" data-i18n="feat.wa">${h('feat.wa')}</span></span></div>`,
    4: `<div class="viz viz-transfer"><span class="vt-node vt-ai">${lucide('bot', 'h-5 w-5', 2)}</span><span class="vt-line"><i></i></span><span class="vt-node vt-owner">${lucide('user-round', 'h-5 w-5', 2)}</span><span class="vt-name" data-i18n="feat.owner">${h('feat.owner')}</span></div>`,
  };
  const WORKS = [['works.1', 'smile'], ['works.2', 'stethoscope'], ['works.3', 'activity'], ['works.4', 'scissors'], ['works.5', 'bed-double'], ['works.6', 'wrench'], ['works.7', 'zap'], ['works.8', 'paw-print']];
  const features = `
<section id="features" class="section pt-0" aria-labelledby="feat-title">
  <div class="wrap">
    <div class="section-head" data-reveal>
      <h2 id="feat-title" class="h2" data-i18n="feat.title">${h('feat.title')}</h2>
    </div>
    <ul class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
${[1, 2, 3, 4].map((n) => `      <li class="tile" data-reveal style="--d:${(n - 1) * 70}ms">
        ${viz[n]}
        <h3 class="tile-title" data-i18n="feat.${n}.title">${h(`feat.${n}.title`)}</h3>
        ${x(`feat.${n}.text`, 'p', 'tile-text')}
        ${n === 4 ? `<a href="#calls" class="tile-link" data-play-rec="plumber">${play('h-2.5 w-2.5')}<span data-i18n="feat.4.listen">${h('feat.4.listen')}</span></a>` : ''}
      </li>`).join('\n')}
    </ul>
    <div class="works" data-reveal>
      ${x('works.title', 'p', 'works-title')}
      <ul class="works-list">
${WORKS.map(([key, icon]) => `        <li>${lucide(icon, 'h-4 w-4', 2)}<span data-i18n="${key}">${h(key)}</span></li>`).join('\n')}
      </ul>
    </div>
  </div>
</section>`;

  // ---------------------------------------------------------------- Real calls: cards with waveforms
  const REC_ICON = { dentist: 'smile', salon: 'scissors', plumber: 'wrench' };
  const recCard = (c) => {
    const ev = normaliseEvents(c.events);
    const booked = ev.some((e) => e.type === 'booking');
    const peaks = c.peaks || Array.from({ length: 72 }, () => 0.4);
    return `      <article class="rec-card" data-rec="${c.id}" data-src="${c.file}" data-duration="${c.duration}" data-reveal>
        <div class="rec-top">
          <span class="rec-icon">${lucide(REC_ICON[c.id] || 'phone', 'h-5 w-5', 2)}</span>
          <div class="min-w-0 flex-1">
            <h3 class="rec-title" data-i18n="calls.${c.id}">${h(`calls.${c.id}`)}</h3>
            <p class="rec-meta">${esc(c.name)} · ${esc(c.when)}</p>
          </div>
          <span class="rec-tag">${lucide(booked ? 'calendar-check' : 'phone-forwarded', 'h-3.5 w-3.5', 2.25)}<span data-i18n="${booked ? 'calls.booked' : 'calls.through'}">${h(booked ? 'calls.booked' : 'calls.through')}</span></span>
        </div>
        <div class="rec-wave">
          <div class="rec-bars" aria-hidden="true">${peaks.map((p) => `<i style="--h:${Math.max(0.1, p).toFixed(2)}"></i>`).join('')}</div>
          <input class="rec-seek" type="range" min="0" max="${c.duration}" step="0.1" value="0" aria-label="${h('calls.seek')}" data-i18n-attr="aria-label:calls.seek">
        </div>
        <div class="rec-controls">
          <button type="button" class="rec-play" aria-pressed="false"><span data-icon="play">${play('ml-0.5 h-3.5 w-3.5')}</span><span data-icon="pause" hidden>${pause('h-3.5 w-3.5')}</span><span class="sr-only" data-rec-verb data-i18n="calls.play">${h('calls.play')}</span></button>
          <p class="rec-sub" aria-hidden="true"><span class="rec-who" data-i18n="${c.lines[0].who === 'ai' ? 'stage.ai' : 'stage.caller'}">${h(c.lines[0].who === 'ai' ? 'stage.ai' : 'stage.caller')}</span><span class="rec-line">${esc(c.lines[0].text)}</span></p>
          <span class="rec-time tabular-nums">${clock(c.duration)}</span>
        </div>
        <details class="rec-details">
          <summary>${lucide('chevron-down', 'h-4 w-4', 2.25)}<span data-i18n="calls.transcript">${h('calls.transcript')}</span></summary>
          <ol class="transcript">
${c.lines.map((line) => `            <li class="cap cap-${line.who}" data-t="${line.t}"><span class="cap-who" data-i18n="${line.who === 'ai' ? 'stage.ai' : 'stage.caller'}">${h(line.who === 'ai' ? 'stage.ai' : 'stage.caller')}</span><p>${esc(line.text)}</p></li>`).join('\n')}
          </ol>
        </details>
      </article>`;
  };
  const calls = `
<section id="calls" class="section bg-soft" aria-labelledby="calls-title">
  <div class="wrap">
    <div class="section-head" data-reveal>
      <h2 id="calls-title" class="h2" data-i18n="calls.title">${h('calls.title')}</h2>
      ${x('calls.sub', 'p', 'lead')}
    </div>
    <div id="rec-list" class="grid grid-cols-1 gap-4 lg:grid-cols-3">
${CALLS.map(recCard).join('\n')}
    </div>
    <audio id="rec-audio" preload="none"></audio>
  </div>
</section>`;

  // ---------------------------------------------------------------- Try it live
  const BIZ = ['dentist', 'salon', 'physio', 'plumber'];
  const tryIt = `
<!-- ============================== TRY IT ==============================
     The page asks the backend (/api/health) what is set up:
       voice configured  -> talk in the browser
       Twilio configured -> "call me" and the demo number as well
       nothing reachable -> a short notice; the recorded calls above still play
-->
<section id="try" class="section" aria-labelledby="try-title">
  <div class="wrap">
    <div class="section-head" data-reveal>
      <h2 id="try-title" class="h2" data-i18n="try.title">${h('try.title')}</h2>
      ${x('try.sub', 'p', 'lead')}
    </div>

    <div id="demo-box" class="demo" data-state="checking" data-reveal>
      <div class="flex flex-wrap gap-2" role="group" aria-label="${h('try.pick')}" data-i18n-attr="aria-label:try.pick" id="biz-pick">
${BIZ.map((b, i) => `        <button type="button" class="chip" data-biz="${b}" aria-pressed="${i === 0}" data-i18n="try.biz.${b}">${h(`try.biz.${b}`)}</button>`).join('\n')}
      </div>

      <p data-show="checking" class="mt-6 flex items-center gap-3 font-medium text-body" role="status">${lucide('loader-circle', 'h-5 w-5 animate-spin motion-reduce:animate-none')}<span data-i18n="try.checking">${h('try.checking')}</span></p>

      <div data-show="off" class="notice mt-6" hidden>
        <span class="mt-0.5 flex-none text-brand">${lucide('circle-alert', 'h-5 w-5', 2.25)}</span>
        <div><p class="font-semibold text-ink" data-i18n="try.off.title">${h('try.off.title')}</p>${x('try.off.text', 'p', 'mt-0.5 text-[0.9375rem]')} <a href="#calls" class="text-link text-[0.9375rem] font-semibold" data-i18n="nav.calls">${h('nav.calls')}</a></div>
      </div>

      <div data-show="live" class="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)]" hidden>
        <div class="mic-panel">
          <button id="mic-button" type="button" class="mic-button" data-state="idle" aria-describedby="mic-status">
            <span class="mic-ring" aria-hidden="true"></span>
            <span data-icon="idle">${lucide('mic', 'h-8 w-8', 2)}</span>
            <span data-icon="busy" hidden>${lucide('loader-circle', 'h-8 w-8 animate-spin motion-reduce:animate-none', 2)}</span>
            <span data-icon="live" hidden>${lucide('phone-off', 'h-8 w-8', 2)}</span>
            <span class="sr-only" id="mic-label" data-i18n="try.mic.start">${h('try.mic.start')}</span>
          </button>
          <p class="mt-4 text-lg font-semibold text-ink" id="mic-caption" data-i18n="try.mic.start">${h('try.mic.start')}</p>
          <p id="mic-status" class="mt-1 min-h-[3rem] text-[0.9375rem] text-body" role="status" aria-live="polite" data-i18n="try.status.idle">${h('try.status.idle')}</p>
          <p class="pill-timer">${lucide('clock', 'h-3.5 w-3.5', 2.5)}<span data-i18n="try.mic.left">${h('try.mic.left')}</span><span id="mic-timer" class="tabular-nums" role="timer" aria-live="off">3:00</span></p>
        </div>
        <div class="flex min-h-[18rem] flex-col gap-4">
          <div class="transcript-box">
            <p class="eyebrow" data-i18n="try.transcript">${h('try.transcript')}</p>
            <ol id="transcript" class="mt-3 flex-1 space-y-2.5 overflow-y-auto lg:max-h-[18rem]" aria-live="polite" aria-relevant="additions"></ol>
            <p id="transcript-empty" class="my-auto py-6 text-center text-[0.9375rem] text-muted" data-i18n="try.empty">${h('try.empty')}</p>
          </div>
          <div id="live-summary" class="toast is-static" hidden>
            <span class="toast-icon">${wa('h-4 w-4')}</span>
            <div class="min-w-0"><p class="toast-to" data-i18n="try.summary">${h('try.summary')}</p><p class="toast-text" id="live-summary-text"></p></div>
          </div>
        </div>
      </div>

      <div id="phone-test" class="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2" hidden>
        <form id="call-form" class="sub-card" novalidate>
          <p class="font-semibold text-ink" data-i18n="try.call.title">${h('try.call.title')}</p>
          ${x('try.call.text', 'p', 'mt-1 text-[0.9375rem] text-body')}
          <label class="mt-4 block text-sm font-semibold text-ink" for="call-phone" data-i18n="try.call.label">${h('try.call.label')}</label>
          <div class="mt-1.5 flex flex-col gap-2 sm:flex-row">
            <input class="input" id="call-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="082 123 4567" aria-describedby="call-status" required>
            <button type="submit" class="btn btn-ink flex-none">${lucide('phone-call', 'h-4 w-4', 2.25)}<span id="call-button-label" data-i18n="try.call.button">${h('try.call.button')}</span></button>
          </div>
          <p id="call-status" class="mt-3 min-h-[1.5rem] text-[0.9375rem] font-medium text-body" role="status" aria-live="polite"></p>
        </form>
        <div class="sub-card flex flex-col justify-center">
          <p class="font-semibold text-ink" data-i18n="try.dial.title">${h('try.dial.title')}</p>
          ${x('try.dial.text', 'p', 'mt-1 text-[0.9375rem] text-body')}
          <a id="dial-link" href="tel:" class="mt-3 inline-flex items-center gap-2.5 text-3xl font-bold tracking-tight text-ink hover:text-brand">${lucide('phone', 'h-6 w-6', 2.25)}<span id="dial-number"></span></a>
        </div>
      </div>

      <p class="demo-notes"><span class="inline-flex items-center gap-1.5">${lucide('languages', 'h-4 w-4', 2)}<span data-i18n="try.lang">${h('try.lang')}</span></span><span class="inline-flex items-center gap-1.5">${lucide('info', 'h-4 w-4', 2)}<span data-i18n="try.note">${h('try.note')}</span></span></p>
    </div>
  </div>
</section>`;

  // ---------------------------------------------------------------- Pricing
  const item = (k) => `          <li>${check('h-4 w-4 flex-none text-brand')}<span data-i18n="${k}">${h(k)}</span></li>`;
  const pricing = `
<section id="pricing" class="section bg-soft" aria-labelledby="price-title">
  <div class="wrap">
    <div class="section-head" data-reveal>
      <h2 id="price-title" class="h2" data-i18n="price.title">${h('price.title')}</h2>
      ${x('price.sub', 'p', 'lead')}
    </div>
    <div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div class="plan" data-reveal>
        <p class="plan-name" data-i18n="price.ah.name">${h('price.ah.name')}</p>
        ${x('price.ah.for', 'p', 'plan-for')}
        <p class="plan-price"><span>R999</span><span class="plan-per" data-i18n="price.month">${h('price.month')}</span></p>
        <ul class="plan-list">
${['price.ah.1', 'price.ah.2', 'price.ah.3'].map(item).join('\n')}
        </ul>
        <a href="#start" class="btn btn-line mt-auto w-full" data-plan="After Hours" data-i18n="price.cta">${h('price.cta')}</a>
      </div>
      <div class="plan is-featured" data-reveal style="--d:70ms">
        <div class="flex items-center justify-between gap-3"><p class="plan-name" data-i18n="price.fd.name">${h('price.fd.name')}</p><span class="tag" data-i18n="price.fd.tag">${h('price.fd.tag')}</span></div>
        ${x('price.fd.for', 'p', 'plan-for')}
        <p class="plan-price"><span>R1,999</span><span class="plan-per" data-i18n="price.month">${h('price.month')}</span></p>
        <ul class="plan-list">
${['price.fd.1', 'price.fd.2', 'price.fd.3'].map(item).join('\n')}
        </ul>
        <a href="#start" class="btn btn-brand mt-auto w-full" data-plan="Front Desk" data-i18n="price.cta">${h('price.cta')}</a>
      </div>
      <div class="plan" data-reveal style="--d:140ms">
        <p class="plan-name" data-i18n="price.mb.name">${h('price.mb.name')}</p>
        ${x('price.mb.for', 'p', 'plan-for')}
        <p class="plan-price"><span class="plan-from" data-i18n="price.mb.from">${h('price.mb.from')}</span><span>R3,999</span><span class="plan-per" data-i18n="price.month">${h('price.month')}</span></p>
        <ul class="plan-list">
${['price.mb.1', 'price.mb.2', 'price.mb.3'].map(item).join('\n')}
        </ul>
        <a href="#" class="btn btn-line mt-auto w-full" data-wa-link target="_blank" rel="noopener">${wa('h-4 w-4')}<span data-i18n="price.mb.cta">${h('price.mb.cta')}</span></a>
      </div>
    </div>
    <p class="price-line" data-reveal>${lucide('sparkles', 'h-4 w-4 flex-none text-brand', 2)}<span data-i18n="price.line">${h('price.line')}</span></p>
    <p class="mx-auto mt-3 max-w-3xl text-center text-sm text-muted" data-reveal><span data-i18n="price.small">${h('price.small')}</span> <span data-vat></span></p>
  </div>
</section>`;

  // ---------------------------------------------------------------- FAQ
  const FAQ = [1, 2, 3, 4, 5];
  const faq = `
<section id="faq" class="section" aria-labelledby="faq-title">
  <div class="wrap max-w-3xl">
    <h2 id="faq-title" class="h2 text-center" data-i18n="faq.title" data-reveal>${h('faq.title')}</h2>
    <div class="mt-8" data-reveal>
${FAQ.map((n) => `      <div class="faq-item" data-open="false">
        <h3><button type="button" class="faq-q" id="faq-q-${n}" aria-expanded="false" aria-controls="faq-a-${n}"><span data-i18n="faq.${n}.q">${h(`faq.${n}.q`)}</span><span class="faq-icon">${lucide('plus', 'h-4 w-4', 2.5)}</span></button></h3>
        <div class="faq-panel" id="faq-a-${n}" role="region" aria-labelledby="faq-q-${n}"><div><p class="pb-5 pr-10 text-[1rem] leading-relaxed text-body" data-i18n="faq.${n}.a">${h(`faq.${n}.a`)}</p></div></div>
      </div>`).join('\n')}
    </div>
  </div>
</section>`;

  // ---------------------------------------------------------------- Start (free trial form)
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
<section id="start" class="hero-shell pb-16 sm:pb-24" aria-labelledby="start-title">
  <div class="hero start-panel">
    <div class="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-center">
      <div data-reveal>
        <h2 id="start-title" class="h2 text-white" data-i18n="start.title">${h('start.title')}</h2>
        ${x('start.sub', 'p', 'hero-sub mt-4')}
        <ul class="hero-points mt-7 flex-col !items-start">
${['hero.p1', 'hero.p2', 'hero.p3'].map((k) => `          <li>${check('h-4 w-4 text-brand-hero')}<span data-i18n="${k}">${h(k)}</span></li>`).join('\n')}
        </ul>
      </div>
      <div class="form-card" data-reveal style="--d:70ms">
        <form id="start-form" novalidate>
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
${field('name', 'start.name', 'type="text" autocomplete="name" required')}
${field('business', 'start.business', 'type="text" autocomplete="organization" required')}
            <div class="field sm:col-span-2">
              <label for="start-type" data-i18n="start.type">${h('start.type')}</label>
              <select class="input" id="start-type" name="type" required aria-describedby="error-type">
                <option value="" selected disabled data-i18n="start.type.choose">${h('start.type.choose')}</option>
${[1, 2, 3, 4, 5, 6, 7, 8].map((n) => `                <option value="${n}" data-i18n="start.type.${n}">${h(`start.type.${n}`)}</option>`).join('\n')}
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
          <button type="submit" class="btn btn-brand btn-lg mt-6 w-full" data-i18n="start.submit">${h('start.submit')}</button>
          <p class="mt-4 flex items-start gap-2.5 text-sm text-body"><span class="mt-0.5 flex-none">${wa('h-5 w-5')}</span><span data-i18n="start.note">${h('start.note')}</span></p>
          <p class="mt-2 text-xs text-muted" data-ph="whatsapp"><span class="ph-tag">Placeholder</span> <span class="ml-1">WhatsApp: <span data-text="whatsapp">+27 00 000 0000</span></span></p>
        </form>
        <div id="start-success" class="py-6 text-center outline-none sm:py-8" tabindex="-1" role="status" hidden>
          <span class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand text-on-brand">${check('h-7 w-7')}</span>
          <h3 class="mt-5 text-2xl font-bold tracking-tight text-ink" data-i18n="start.ok.title">${h('start.ok.title')}</h3>
          ${x('start.ok.text', 'p', 'mx-auto mt-2 max-w-sm text-body')}
          <div class="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <a id="start-whatsapp" href="https://wa.me/27000000000" target="_blank" rel="noopener" class="btn btn-ink">${brand(siWhatsapp, 'h-5 w-5', 'currentColor')}<span data-i18n="start.ok.again">${h('start.ok.again')}</span></a>
            <button id="start-edit" type="button" class="btn btn-line" data-i18n="start.ok.edit">${h('start.ok.edit')}</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>`;

  // ---------------------------------------------------------------- Footer
  const footer = `
<footer class="site-footer">
  <div class="wrap flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
    <div>
      <a href="#top" class="inline-flex items-center gap-2.5 text-ink" aria-label="Front Desk AI">${logo}</a>
      <p class="mt-3 text-[0.9375rem] text-muted"><span data-i18n="foot.desc">${h('foot.desc')}</span> <span data-i18n="foot.place">${h('foot.place')}</span></p>
    </div>
    <ul class="flex flex-col gap-2.5 text-[0.9375rem] font-medium text-ink sm:flex-row sm:flex-wrap sm:gap-x-6" aria-label="${h('foot.contact')}" data-i18n-attr="aria-label:foot.contact">
      <li class="flex flex-wrap items-center gap-2"><a class="contact" href="mailto:hello@example.com" data-mailto="email">${brand(siGmail, 'h-4 w-4')}<span data-text="email">hello@example.com</span></a>${PH('email')}</li>
      <li class="flex flex-wrap items-center gap-2"><a class="contact" href="tel:+27000000000" data-tel="phone">${lucide('phone', 'h-4 w-4 text-brand', 2.25)}<span data-text="phone">+27 00 000 0000</span></a>${PH('phone')}</li>
      <li class="flex flex-wrap items-center gap-2"><a class="contact" href="https://wa.me/27000000000" data-wa-link target="_blank" rel="noopener">${wa('h-4 w-4')}<span data-i18n="foot.whatsapp">${h('foot.whatsapp')}</span></a>${PH('whatsapp')}</li>
    </ul>
  </div>
  <div class="wrap mt-8 flex flex-col gap-1 border-t border-line pt-6 text-sm text-muted sm:flex-row sm:justify-between">
    <p>&copy; <span id="year">2026</span> Front Desk AI. <span data-i18n="foot.rights">${h('foot.rights')}</span></p>
    <p data-i18n="foot.prices">${h('foot.prices')}</p>
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
        { '@type': 'Offer', name: 'Multi-branch', price: '3999', priceCurrency: 'ZAR', description: 'Up to three numbers and diaries. No setup fee.' },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQ.map((n) => ({ '@type': 'Question', name: strings[`faq.${n}.q`], acceptedAnswer: { '@type': 'Answer', text: strings[`faq.${n}.a`] } })),
    },
  ];
  const favicon = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#0F766E"/><g transform="translate(6.5 6.5) scale(.79)" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2a9 9 0 0 1 9 9"/><path d="M13 6a5 5 0 0 1 5 5"/><path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"/></g></svg>')}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>${title}</title>
  <meta name="description" content="${esc(description)}">
  <link rel="canonical" href="${url}">
  <meta name="theme-color" content="#FFFFFF">
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
<body id="top" class="bg-bg font-sans text-body antialiased">
${header}

<main id="main">
${heroSection}
${how}
${features}
${calls}
${tryIt}
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
