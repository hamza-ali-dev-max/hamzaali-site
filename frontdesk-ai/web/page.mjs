// The page template. All wording comes from src/i18n.js (English is rendered into the HTML,
// and each element carries a data-i18n key so the language switcher can swap it).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { siWhatsapp, siGmail, siGooglemaps } from 'simple-icons';
import { LANGUAGES } from './src/i18n.js';

const here = path.dirname(fileURLToPath(import.meta.url));

function lucide(name, cls = 'h-5 w-5', stroke = 2) {
  const file = path.join(here, '..', 'node_modules', 'lucide-static', 'icons', `${name}.svg`);
  if (!fs.existsSync(file)) throw new Error(`Unknown icon: ${name}`);
  const inner = fs.readFileSync(file, 'utf8').replace(/<!--[\s\S]*?-->/g, '').match(/<svg[^>]*>([\s\S]*?)<\/svg>/)[1].replace(/\s+/g, ' ').replace(/> </g, '><').replace(/ \/>/g, '/>').trim();
  return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
}
const brand = (icon, cls = 'h-7 w-7') => `<svg class="${cls}" viewBox="0 0 24 24" fill="#${icon.hex}" aria-hidden="true"><path d="${icon.path}"/></svg>`;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function renderPage({ env, strings }) {
  const t = (key) => { if (!(key in strings)) throw new Error(`Missing text: ${key}`); return esc(strings[key]); };
  // An element whose text the language switcher can replace.
  const x = (key, tag = 'span', cls = '', attrs = '') => `<${tag}${cls ? ` class="${cls}"` : ''} data-i18n="${key}"${attrs ? ` ${attrs}` : ''}>${t(key)}</${tag}>`;
  const PH = (key) => `<span class="ph-tag" data-ph="${key}">Placeholder</span>`;
  const playGlyph = (cls) => `<svg class="${cls}" viewBox="0 0 10 12" fill="currentColor" aria-hidden="true"><path d="M0 0v12l10-6z"/></svg>`;
  const pauseGlyph = (cls) => `<svg class="${cls}" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true"><path d="M1 0h3.5v12H1zM7.5 0H11v12H7.5z"/></svg>`;

  const NAV = [['#what', 'nav.what'], ['#examples', 'nav.examples'], ['#pricing', 'nav.pricing'], ['#faq', 'nav.faq'], ['#contact', 'nav.contact']];
  const langButtons = (id) => `<div class="lang-switch" role="group" data-i18n-attr="aria-label:nav.language" aria-label="${t('nav.language')}" id="${id}">
${LANGUAGES.map((l) => `          <button type="button" data-lang="${l.code}" aria-pressed="${l.code === 'en'}" title="${l.label}"><span aria-hidden="true">${l.short}</span><span class="sr-only">${l.label}</span></button>`).join('\n')}
        </div>`;
  const logo = `<span class="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-sky text-white">${lucide('concierge-bell', 'h-5 w-5', 2.25)}</span><span class="font-display text-[1.0625rem] font-bold tracking-tight">Front Desk AI</span>`;

  const header = `
<a href="#main" class="skip-link" data-i18n="nav.skip">${t('nav.skip')}</a>

<!-- ============================== 1. NAVBAR ============================== -->
<header id="site-header" class="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5 sm:pt-4">
  <div class="mx-auto max-w-6xl">
    <div class="flex h-14 items-center justify-between gap-2 rounded-full bg-card pl-2.5 pr-2 text-ink shadow-pill sm:h-16 sm:pl-3.5 sm:pr-2.5">
      <a href="#top" class="flex items-center gap-2.5 rounded-full pr-2" aria-label="Front Desk AI">${logo}</a>
      <nav class="hidden items-center gap-6 lg:flex" aria-label="Main">
${NAV.map(([href, key]) => `        <a class="nav-link" href="${href}" data-i18n="${key}">${t(key)}</a>`).join('\n')}
      </nav>
      <div class="flex items-center gap-1.5">
        <div class="hidden sm:block">${langButtons('lang-desktop')}</div>
        <button type="button" class="icon-btn" data-theme-toggle aria-pressed="false" data-i18n-attr="aria-label:nav.theme" aria-label="${t('nav.theme')}">
          <span data-icon="moon">${lucide('moon', 'h-5 w-5')}</span><span data-icon="sun" hidden>${lucide('sun', 'h-5 w-5')}</span>
        </button>
        <a href="#demo" class="btn btn-pill btn-sm hidden md:inline-flex" data-i18n="nav.cta">${t('nav.cta')}</a>
        <button id="menu-toggle" type="button" class="icon-btn lg:hidden" aria-expanded="false" aria-controls="mobile-menu" data-i18n-attr="aria-label:nav.menu" aria-label="${t('nav.menu')}">
          <span data-icon="open">${lucide('menu', 'h-6 w-6')}</span><span data-icon="close" hidden>${lucide('x', 'h-6 w-6')}</span>
        </button>
      </div>
    </div>
    <div id="mobile-menu" class="mt-2 rounded-card bg-card p-4 text-ink shadow-pill lg:hidden" hidden>
      <nav class="flex flex-col" aria-label="Mobile">
${NAV.map(([href, key]) => `        <a class="flex min-h-[3rem] items-center border-b border-line font-display text-lg font-semibold" href="${href}" data-i18n="${key}">${t(key)}</a>`).join('\n')}
      </nav>
      <div class="mt-4 flex items-center justify-between gap-3 sm:hidden">
        ${x('nav.language', 'span', 'text-sm font-semibold text-muted')}
        ${langButtons('lang-mobile')}
      </div>
      <a href="#demo" class="btn btn-pill mt-4 w-full" data-i18n="nav.cta">${t('nav.cta')}</a>
    </div>
  </div>
</header>`;

  const heroCards = [
    ['hero.card1', 'phone-incoming', 'bg-sky text-white', '-rotate-3'],
    ['hero.card2', 'calendar-check', 'bg-leaf text-white', 'rotate-2 sm:-translate-y-3'],
    ['hero.card3', 'send', 'bg-sun text-night', '-rotate-1 sm:rotate-3'],
  ];
  const hero = `
<!-- ============================== 2. HERO ============================== -->
<section class="hero relative isolate overflow-hidden bg-sky text-white">
  <img class="absolute inset-0 -z-20 h-full w-full object-cover object-bottom" src="img/hero-sky-1600.webp" srcset="img/hero-sky-800.webp 800w, img/hero-sky-1600.webp 1600w, img/hero-sky-2400.webp 2400w" sizes="100vw" width="1600" height="1100" alt="${t('hero.alt')}" data-i18n-attr="alt:hero.alt" fetchpriority="high" decoding="async">
  <div class="hero-shade absolute inset-0 -z-10" aria-hidden="true"></div>
  <div class="wrap flex flex-col items-center pb-16 pt-28 text-center sm:pt-36 lg:pb-24 lg:pt-40">
    ${x('hero.badge', 'p', 'rounded-full bg-white px-4 py-2 text-sm font-bold text-night shadow-card')}
    <h1 class="hero-title mt-6 max-w-5xl font-display font-extrabold text-white" data-i18n="hero.title">${t('hero.title')}</h1>
    ${x('hero.sub', 'p', 'mt-6 max-w-2xl text-xl font-semibold leading-relaxed text-white sm:text-2xl')}
    <div class="mt-8 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row">
      <a href="#demo" class="btn btn-white btn-lg w-full sm:w-auto"><span data-i18n="nav.cta">${t('nav.cta')}</span>${lucide('arrow-right', 'h-5 w-5', 2.5)}</a>
      <a href="#try" class="btn btn-white btn-lg w-full sm:w-auto">${lucide('mic', 'h-5 w-5', 2.5)}<span data-i18n="hero.cta2">${t('hero.cta2')}</span></a>
    </div>
    <p class="mt-6 flex items-center gap-2 text-base font-bold text-white">${lucide('shield-check', 'h-5 w-5', 2.25)}<span data-i18n="hero.trust">${t('hero.trust')}</span></p>

    <ul class="mt-12 grid w-full max-w-4xl grid-cols-1 gap-4 text-left sm:mt-16 sm:grid-cols-3 sm:gap-5">
${heroCards.map(([key, icon, tone, tilt], i) => `      <li class="float-card ${tilt}" style="--drift:${i}">
        <span class="flex h-11 w-11 items-center justify-center rounded-2xl ${tone}">${lucide(icon, 'h-5 w-5', 2.25)}</span>
        <p class="mt-4 font-display text-lg font-bold leading-snug text-night" data-i18n="${key}.label">${t(`${key}.label`)}</p>
        <p class="mt-1 text-[0.9375rem] font-semibold leading-snug text-[#33415C]" data-i18n="${key}.text">${t(`${key}.text`)}</p>
      </li>`).join('\n')}
    </ul>
  </div>
</section>`;

  const WHAT = [['phone-call', 'sky'], ['calendar-check', 'leaf'], ['message-circle-question', 'sun'], ['notebook-pen', 'sky'], ['send', 'leaf'], ['languages', 'sun']];
  const what = `
<!-- ============================== 3. WHAT IT DOES ============================== -->
<section id="what" class="section bg-tint" aria-labelledby="what-title">
  <div class="wrap">
    <div class="section-head" data-reveal>
      <h2 id="what-title" class="h2" data-i18n="what.title">${t('what.title')}</h2>
      ${x('what.sub', 'p', 'lead')}
    </div>
    <ul class="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
${WHAT.map(([icon, tone], i) => `      <li class="card p-6 sm:p-7" data-reveal style="--d:${(i % 3) * 70}ms">
        <span class="icon-badge icon-${tone}">${lucide(icon, 'h-6 w-6', 2.25)}</span>
        <h3 class="h3 mt-5" data-i18n="what.${i + 1}.title">${t(`what.${i + 1}.title`)}</h3>
        <p class="mt-2 text-lg leading-relaxed text-body" data-i18n="what.${i + 1}.text">${t(`what.${i + 1}.text`)}</p>
      </li>`).join('\n')}
    </ul>
  </div>
</section>`;

  const EX = [['dentist', 'dentist', 'stethoscope'], ['salon', 'salon', 'scissors'], ['doctor', 'doctor', 'activity'], ['guest', 'guesthouse', 'bed-double']];
  const examples = `
<!-- ============================== 4. EXAMPLES ============================== -->
<section id="examples" class="section bg-page" aria-labelledby="examples-title">
  <div class="wrap">
    <div class="section-head" data-reveal>
      <h2 id="examples-title" class="h2" data-i18n="ex.title">${t('ex.title')}</h2>
      ${x('ex.sub', 'p', 'lead')}
    </div>
    <ul class="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
${EX.map(([key, img, icon], i) => `      <li class="card flex flex-col overflow-hidden" data-reveal style="--d:${(i % 4) * 70}ms">
        <img class="aspect-[4/3] w-full object-cover" src="img/${img}-960.webp" srcset="img/${img}-480.webp 480w, img/${img}-960.webp 960w" sizes="(min-width: 1280px) 290px, (min-width: 768px) 46vw, 92vw" width="960" height="720" loading="lazy" decoding="async" alt="${t(`ex.${key}.alt`)}" data-i18n-attr="alt:ex.${key}.alt">
        <div class="flex flex-1 flex-col p-6">
          <p class="chip self-start">${lucide(icon, 'h-4 w-4', 2.25)}<span data-i18n="ex.${key}.label">${t(`ex.${key}.label`)}</span></p>
          <p class="mt-4 text-lg leading-relaxed text-body" data-i18n="ex.${key}.text">${t(`ex.${key}.text`)}</p>
        </div>
      </li>`).join('\n')}
    </ul>
  </div>
</section>`;

  const HOW = ['forward', 'sliders-horizontal', 'layout-dashboard'];
  const how = `
<!-- ============================== 5. HOW IT WORKS ============================== -->
<section id="how" class="section bg-mint" aria-labelledby="how-title">
  <div class="wrap">
    <div class="section-head" data-reveal>
      <h2 id="how-title" class="h2" data-i18n="how.title">${t('how.title')}</h2>
      ${x('how.sub', 'p', 'lead')}
    </div>
    <ol class="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3 lg:gap-5">
${HOW.map((icon, i) => `      <li class="card p-6 sm:p-7" data-reveal style="--d:${i * 80}ms">
        <div class="flex items-center justify-between">
          <span class="flex h-12 w-12 items-center justify-center rounded-full bg-pill font-display text-xl font-extrabold text-pill-ink"><span class="sr-only" data-i18n="how.step">${t('how.step')}</span> ${i + 1}</span>
          <span class="text-leaf-deep dark:text-leaf">${lucide(icon, 'h-7 w-7', 2)}</span>
        </div>
        <h3 class="h3 mt-6" data-i18n="how.${i + 1}.title">${t(`how.${i + 1}.title`)}</h3>
        <p class="mt-2 text-lg leading-relaxed text-body" data-i18n="how.${i + 1}.text">${t(`how.${i + 1}.text`)}</p>
      </li>`).join('\n')}
    </ol>
  </div>
</section>`;

  const IND = [['dentists', 'stethoscope'], ['doctors', 'activity'], ['salons', 'scissors'], ['physios', 'accessibility'], ['vets', 'paw-print'], ['law', 'scale'], ['guest', 'bed-double'], ['auto', 'wrench']];
  const industries = `
<!-- ============================== 6. INDUSTRIES ============================== -->
<section id="industries" class="section bg-page" aria-labelledby="industries-title">
  <div class="wrap">
    <div class="section-head" data-reveal>
      <h2 id="industries-title" class="h2" data-i18n="ind.title">${t('ind.title')}</h2>
      ${x('ind.sub', 'p', 'lead')}
    </div>
    <div id="industry-tabs" class="mt-8 flex flex-wrap gap-2" role="tablist" aria-labelledby="industries-title" data-reveal>
${IND.map(([key, icon], i) => `      <button type="button" role="tab" class="tab-pill" id="ind-tab-${key}" aria-controls="ind-panel-${key}" aria-selected="${i === 0}">${lucide(icon, 'h-[1.125rem] w-[1.125rem]', 2.25)}<span data-i18n="ind.${key}.tab">${t(`ind.${key}.tab`)}</span></button>`).join('\n')}
    </div>
${IND.map(([key, icon]) => `    <div id="ind-panel-${key}" role="tabpanel" aria-labelledby="ind-tab-${key}" tabindex="0" class="card mt-5 grid grid-cols-1 gap-5 p-6 sm:p-8 md:grid-cols-2 md:gap-8">
      <div>
        <p class="chip self-start">${lucide('phone-incoming', 'h-4 w-4', 2.25)}<span data-i18n="ind.says">${t('ind.says')}</span></p>
        <p class="mt-4 font-display text-2xl font-bold leading-snug text-ink sm:text-[1.75rem]">&ldquo;<span data-i18n="ind.${key}.says">${t(`ind.${key}.says`)}</span>&rdquo;</p>
      </div>
      <div class="rounded-3xl bg-tint p-5 sm:p-6">
        <p class="chip chip-sky">${lucide('concierge-bell', 'h-4 w-4', 2.25)}<span data-i18n="ind.does">${t('ind.does')}</span></p>
        <p class="mt-4 flex items-start gap-3 text-xl font-semibold leading-snug text-ink"><span class="mt-1 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-leaf text-white">${lucide('check', 'h-3.5 w-3.5', 3.5)}</span><span data-i18n="ind.${key}.does">${t(`ind.${key}.does`)}</span></p>
      </div>
    </div>`).join('\n')}
  </div>
</section>`;

  const ROWS = [['cmp.row1', 'cmp.row1.human', null], ['cmp.row2', 'cmp.row2.human', 'cmp.row2.ai'], ['cmp.row3', 'cmp.row3.human', 'cmp.row3.ai'], ['cmp.row4', 'cmp.row4.human', 'cmp.row4.ai']];
  const compare = `
<!-- ============================== 7. COST COMPARISON ============================== -->
<section id="compare" class="section bg-tint" aria-labelledby="compare-title">
  <div class="wrap">
    <div class="section-head" data-reveal>
      <h2 id="compare-title" class="h2" data-i18n="cmp.title">${t('cmp.title')}</h2>
      ${x('cmp.sub', 'p', 'lead')}
    </div>
    <div class="card mt-10 p-5 sm:p-4" data-reveal>
      <table class="compare" role="table">
        <caption class="sr-only" data-i18n="cmp.title">${t('cmp.title')}</caption>
        <thead>
          <tr role="row">
            <td role="presentation"></td>
            <th role="columnheader" scope="col" data-i18n="cmp.human">${t('cmp.human')}</th>
            <th role="columnheader" scope="col" class="col-ai">Front Desk AI</th>
          </tr>
        </thead>
        <tbody>
${ROWS.map(([row, human, ai]) => `          <tr role="row">
            <th role="rowheader" scope="row" data-i18n="${row}">${t(row)}</th>
            <td role="cell"><span class="cell-label" data-i18n="cmp.human">${t('cmp.human')}</span><span data-i18n="${human}">${t(human)}</span></td>
            <td role="cell" class="col-ai"><span class="cell-label">Front Desk AI</span>${ai ? `<span data-i18n="${ai}">${t(ai)}</span>` : '<span class="font-display text-2xl font-extrabold">R1,999</span>'}</td>
          </tr>`).join('\n')}
        </tbody>
      </table>
    </div>
    ${x('cmp.note', 'p', 'mt-6 max-w-2xl text-lg font-semibold text-ink', 'data-reveal')}
  </div>
</section>`;

  const pricing = `
<!-- ============================== 8. PRICING ============================== -->
<section id="pricing" class="section bg-sky text-white" aria-labelledby="pricing-title">
  <div class="wrap">
    <div class="section-head mx-auto text-center" data-reveal>
      <h2 id="pricing-title" class="h2 !text-white" data-i18n="price.title">${t('price.title')}</h2>
      ${x('price.sub', 'p', 'lead !text-white')}
    </div>
    <div class="price-card mx-auto mt-10 max-w-xl rounded-[32px] bg-white p-7 text-night shadow-float sm:p-10" data-reveal>
      <p class="font-display text-lg font-bold text-[#0B4FB8]">Front Desk AI</p>
      <p class="mt-3 flex flex-wrap items-baseline gap-x-3">
        <span class="font-display text-[4rem] font-extrabold leading-none tracking-tight sm:text-[5rem]">R1,999</span>
        <span class="text-xl font-bold text-[#33415C]" data-i18n="price.per">${t('price.per')}</span>
      </p>
      <ul class="mt-7 space-y-3.5 text-lg font-semibold">
${[1, 2, 3, 4].map((n) => `        <li class="flex items-start gap-3"><span class="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-leaf text-white">${lucide('check', 'h-3.5 w-3.5', 3.5)}</span><span data-i18n="price.${n}">${t(`price.${n}`)}</span></li>`).join('\n')}
      </ul>
      <p class="mt-7 rounded-3xl bg-[#FFF3CC] px-5 py-4 font-display text-lg font-bold leading-snug text-night" data-i18n="price.line">${t('price.line')}</p>
      <a href="#demo" class="btn btn-black btn-lg mt-7 w-full"><span data-i18n="nav.cta">${t('nav.cta')}</span>${lucide('arrow-right', 'h-5 w-5', 2.5)}</a>
    </div>
  </div>
</section>`;

  const SAMPLES = [['dentist', 'audio/sample-call-dentist.mp3'], ['salon', 'audio/sample-call-salon.mp3'], ['clinic', 'audio/sample-call-medical-clinic.mp3']];
  const tryIt = `
<!-- ============================== 9. TRY IT (live voice demo) ==============================
     The page asks the backend (/api/health) what is available:
       voice configured  -> microphone demo
       not configured    -> "unavailable" notice plus the sample recordings in audio/
       Twilio configured -> the call-me form and the demo number are shown as well
-->
<section id="try" class="section bg-mint" aria-labelledby="try-title">
  <div class="wrap">
    <div class="section-head" data-reveal>
      <h2 id="try-title" class="h2" data-i18n="try.title">${t('try.title')}</h2>
      ${x('try.sub', 'p', 'lead')}
    </div>

    <div id="demo-box" class="card mt-10 p-5 sm:p-8" data-state="checking" data-reveal>
      <!-- Loading -->
      <p data-show="checking" class="flex items-center gap-3 py-6 text-lg font-semibold text-body" role="status">${lucide('loader-circle', 'h-6 w-6 animate-spin motion-reduce:animate-none')}<span data-i18n="try.checking">${t('try.checking')}</span></p>

      <!-- Live microphone demo -->
      <div data-show="live" class="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-8" hidden>
        <div class="flex flex-col items-center rounded-3xl bg-tint p-6 text-center sm:p-8">
          <h3 class="h3" data-i18n="try.mic.title">${t('try.mic.title')}</h3>
          <button id="mic-button" type="button" class="mic-button mt-6" aria-describedby="mic-status">
            <span data-icon="idle">${lucide('mic', 'h-10 w-10', 2)}</span>
            <span data-icon="busy" hidden>${lucide('loader-circle', 'h-10 w-10 animate-spin motion-reduce:animate-none', 2)}</span>
            <span data-icon="live" hidden>${lucide('phone-off', 'h-10 w-10', 2)}</span>
            <span class="sr-only" id="mic-label" data-i18n="try.mic.start">${t('try.mic.start')}</span>
          </button>
          <p class="mt-4 font-display text-lg font-bold text-ink" id="mic-caption" data-i18n="try.mic.start">${t('try.mic.start')}</p>
          <p id="mic-status" class="mt-2 min-h-[3.5rem] text-base font-semibold text-body" role="status" aria-live="polite" data-i18n="try.status.idle">${t('try.status.idle')}</p>
          <p class="mt-2 flex items-center gap-2 rounded-full bg-card px-4 py-2 text-base font-bold text-ink shadow-card">${lucide('clock', 'h-4 w-4', 2.5)}<span data-i18n="try.mic.left">${t('try.mic.left')}</span><span id="mic-timer" class="tabular-nums" role="timer" aria-live="off">3:00</span></p>
        </div>
        <div class="flex min-h-[18rem] flex-col rounded-3xl border border-line p-5 sm:p-6">
          <h3 class="font-display text-base font-bold text-ink" data-i18n="try.transcript">${t('try.transcript')}</h3>
          <ol id="transcript" class="mt-3 flex-1 space-y-3 overflow-y-auto lg:max-h-[21rem]" aria-live="polite" aria-relevant="additions"></ol>
          <p id="transcript-empty" class="my-auto text-center text-base text-muted" data-i18n="try.empty">${t('try.empty')}</p>
        </div>
      </div>

      <!-- Fallback when the live demo is not configured or cannot be reached -->
      <div data-show="off" hidden>
        <div class="flex items-start gap-3 rounded-3xl bg-[#FFF3CC] p-5 text-night">
          <span class="mt-0.5 flex-none">${lucide('circle-alert', 'h-6 w-6', 2.25)}</span>
          <div>
            <h3 class="font-display text-lg font-bold" data-i18n="try.off.title">${t('try.off.title')}</h3>
            <p class="mt-1 text-base font-semibold" data-i18n="try.off.text">${t('try.off.text')}</p>
          </div>
        </div>
        <ul id="samples" class="mt-5 space-y-3">
${SAMPLES.map(([key, src]) => `          <li class="sample flex items-center gap-4 rounded-3xl border border-line p-3 sm:p-4" data-src="${src}">
            <button type="button" class="sample-play" aria-pressed="false"><span data-icon="play">${playGlyph('ml-0.5 h-4 w-4')}</span><span data-icon="pause" hidden>${pauseGlyph('h-4 w-4')}</span><span class="sr-only"><span data-role="verb" data-i18n="try.sample.play">${t('try.sample.play')}</span>: <span data-i18n="try.sample.${key}">${t(`try.sample.${key}`)}</span></span></button>
            <div class="min-w-0 flex-1">
              <p class="font-display text-base font-bold leading-snug text-ink" data-i18n="try.sample.${key}">${t(`try.sample.${key}`)}</p>
              <div class="sample-bar mt-2" aria-hidden="true"><span></span></div>
            </div>
            <span class="sample-time text-sm font-bold tabular-nums text-muted">0:00</span>
          </li>`).join('\n')}
        </ul>
        ${x('try.sample.note', 'p', 'mt-4 text-sm text-muted')}
        <audio id="sample-audio" preload="none"></audio>
      </div>

      <!-- Phone test (only shown when Twilio is configured on the backend) -->
      <div id="phone-test" class="mt-6 grid grid-cols-1 gap-4 border-t border-line pt-6 md:grid-cols-2" hidden>
        <form id="call-form" class="rounded-3xl border border-line p-5 sm:p-6" novalidate>
          <h3 class="h3 !text-xl" data-i18n="try.call.title">${t('try.call.title')}</h3>
          ${x('try.call.text', 'p', 'mt-1 text-base text-body')}
          <label class="mt-4 block text-sm font-bold text-ink" for="call-phone" data-i18n="try.call.label">${t('try.call.label')}</label>
          <div class="mt-1.5 flex flex-col gap-2 sm:flex-row">
            <input class="input" id="call-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="082 123 4567" aria-describedby="call-status" required>
            <button type="submit" class="btn btn-pill flex-none">${lucide('phone-call', 'h-5 w-5', 2.25)}<span id="call-button-label" data-i18n="try.call.button">${t('try.call.button')}</span></button>
          </div>
          <p id="call-status" class="mt-3 min-h-[1.5rem] text-base font-semibold text-body" role="status" aria-live="polite"></p>
        </form>
        <div class="flex flex-col justify-center rounded-3xl border border-line p-5 sm:p-6">
          <h3 class="h3 !text-xl" data-i18n="try.dial.title">${t('try.dial.title')}</h3>
          ${x('try.dial.text', 'p', 'mt-1 text-base text-body')}
          <a id="dial-link" href="tel:" class="mt-3 inline-flex items-center gap-3 font-display text-3xl font-extrabold tracking-tight text-ink underline-offset-4 hover:underline">${lucide('phone', 'h-7 w-7', 2.25)}<span id="dial-number"></span></a>
        </div>
      </div>

      <p class="mt-6 flex items-start gap-2 text-base font-semibold text-body">${lucide('shield-check', 'mt-0.5 h-5 w-5 flex-none', 2.25)}<span data-i18n="try.note">${t('try.note')}</span></p>
    </div>
  </div>
</section>`;

  const contactCard = (iconHtml, titleKey, valueHtml, attrs, ph) => `      <li class="card flex items-center gap-4 p-5">
        <a class="contact-link flex min-w-0 flex-1 items-center gap-4" ${attrs}>
          <span class="flex h-14 w-14 flex-none items-center justify-center rounded-2xl bg-white shadow-card">${iconHtml}</span>
          <span class="min-w-0"><span class="block font-display text-lg font-bold text-ink" data-i18n="${titleKey}">${t(titleKey)}</span>${valueHtml}</span>
        </a>
        ${ph ? PH(ph) : ''}
      </li>`;
  const contact = `
<!-- ============================== 10. MAP AND CONTACT ==============================
     Contact details are PLACEHOLDERS. Change them once in site-config.js.
-->
<section id="contact" class="section bg-page" aria-labelledby="contact-title">
  <div class="wrap">
    <div class="section-head" data-reveal>
      <h2 id="contact-title" class="h2" data-i18n="contact.title">${t('contact.title')}</h2>
      ${x('contact.sub', 'p', 'lead')}
    </div>
    <div class="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
      <div class="card overflow-hidden p-2" data-reveal>
        <div id="map" class="h-[22rem] w-full rounded-[22px] bg-tint sm:h-[26rem]" role="region" data-i18n-attr="aria-label:contact.map.label" aria-label="${t('contact.map.label')}"></div>
        <p class="flex items-center gap-2 px-3 py-2.5 text-sm font-semibold text-muted md:hidden">${lucide('hand', 'h-4 w-4', 2.25)}<span data-i18n="contact.map.hint">${t('contact.map.hint')}</span></p>
      </div>
      <ul class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1" data-reveal style="--d:100ms">
${contactCard(brand(siGmail), 'contact.email', '<span class="block truncate text-base font-semibold text-body" data-text="email">hello@example.com</span>', 'href="mailto:hello@example.com" data-mailto="email"', 'email')}
${contactCard(lucide('phone', 'h-7 w-7 text-sky', 2.25), 'contact.phone', '<span class="block truncate text-base font-semibold text-body" data-text="phone">+27 00 000 0000</span>', 'href="tel:+27000000000" data-tel="phone"', 'phone')}
${contactCard(brand(siWhatsapp), 'contact.whatsapp', '<span class="block truncate text-base font-semibold text-body" data-text="whatsapp">+27 00 000 0000</span>', 'href="https://wa.me/27000000000" data-wa target="_blank" rel="noopener"', 'whatsapp')}
${contactCard(brand(siGooglemaps), 'contact.maps', `<span class="block truncate text-base font-semibold text-body" data-i18n="contact.maps.text">${t('contact.maps.text')}</span>`, 'href="https://www.google.com/maps/search/?api=1&amp;query=Cape+Town%2C+South+Africa" data-maps target="_blank" rel="noopener"', '')}
      </ul>
    </div>
  </div>
</section>`;

  const faq = `
<!-- ============================== 11. FAQ ============================== -->
<section id="faq" class="section bg-tint" aria-labelledby="faq-title">
  <div class="wrap max-w-4xl">
    <div class="section-head" data-reveal>
      <h2 id="faq-title" class="h2" data-i18n="faq.title">${t('faq.title')}</h2>
    </div>
    <div class="mt-8 space-y-3" data-reveal>
${[1, 2, 3, 4, 5, 6, 7].map((n) => `      <div class="faq-item card" data-open="${n === 1}">
        <h3><button type="button" class="faq-q" id="faq-q-${n}" aria-expanded="${n === 1}" aria-controls="faq-a-${n}"><span data-i18n="faq.${n}.q">${t(`faq.${n}.q`)}</span><span class="faq-icon">${lucide('plus', 'h-5 w-5', 2.5)}</span></button></h3>
        <div class="faq-panel" id="faq-a-${n}" role="region" aria-labelledby="faq-q-${n}"><div><p class="px-6 pb-6 text-lg leading-relaxed text-body sm:px-7" data-i18n="faq.${n}.a">${t(`faq.${n}.a`)}</p></div></div>
      </div>`).join('\n')}
    </div>
  </div>
</section>`;

  const field = (name, key, attrs) => `          <div class="field">
            <label for="demo-${name}" data-i18n="${key}">${t(key)}</label>
            <input class="input" id="demo-${name}" name="${name}" ${attrs} aria-describedby="error-${name}">
            <p class="field-error" id="error-${name}" role="alert" hidden></p>
          </div>`;
  const cta = `
<!-- ============================== 12. BOOK A FREE DEMO ==============================
     No backend for this form yet: it checks the details, shows a confirmation and opens
     WhatsApp with the message filled in. The WhatsApp number is a PLACEHOLDER in site-config.js.
-->
<section id="demo" class="relative isolate overflow-hidden bg-leaf-deep py-20 text-white sm:py-28" aria-labelledby="demo-title">
  <img class="absolute inset-0 -z-20 h-full w-full object-cover" src="img/field-1800.webp" srcset="img/field-800.webp 800w, img/field-1800.webp 1800w" sizes="100vw" width="1800" height="1100" loading="lazy" decoding="async" alt="${t('cta.alt')}" data-i18n-attr="alt:cta.alt">
  <div class="cta-shade absolute inset-0 -z-10" aria-hidden="true"></div>
  <div class="wrap grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-14">
    <div data-reveal>
      <h2 id="demo-title" class="font-display text-[2.75rem] font-extrabold leading-[1.02] tracking-tight text-white sm:text-6xl lg:text-7xl" data-i18n="cta.title">${t('cta.title')}</h2>
      ${x('cta.sub', 'p', 'mt-5 max-w-md text-xl font-semibold leading-relaxed text-white sm:text-2xl')}
    </div>
    <div class="rounded-[32px] bg-white p-6 text-night shadow-float sm:p-8" data-reveal style="--d:100ms">
      <form id="demo-form" novalidate>
        <h3 class="font-display text-2xl font-extrabold tracking-tight" data-i18n="cta.form.title">${t('cta.form.title')}</h3>
        <div class="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
${field('name', 'cta.name', 'type="text" autocomplete="name" required')}
${field('business', 'cta.business', 'type="text" autocomplete="organization" required')}
          <div class="field sm:col-span-2">
            <label for="demo-type" data-i18n="cta.type">${t('cta.type')}</label>
            <select class="input" id="demo-type" name="type" required aria-describedby="error-type">
              <option value="" selected disabled data-i18n="cta.type.choose">${t('cta.type.choose')}</option>
${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => `              <option value="${t(`cta.type.${n}`)}" data-i18n="cta.type.${n}">${t(`cta.type.${n}`)}</option>`).join('\n')}
            </select>
            <p class="field-error" id="error-type" role="alert" hidden></p>
          </div>
${field('phone', 'cta.phone', 'type="tel" inputmode="tel" autocomplete="tel" placeholder="082 123 4567" required')}
${field('email', 'cta.email', 'type="email" inputmode="email" autocomplete="email" placeholder="you@business.co.za" required')}
        </div>
        <button type="submit" class="btn btn-black btn-lg mt-6 w-full"><span data-i18n="cta.submit">${t('cta.submit')}</span>${lucide('arrow-right', 'h-5 w-5', 2.5)}</button>
        <p class="mt-4 flex items-start gap-2.5 text-sm font-semibold text-[#33415C]"><span class="mt-0.5 flex-none">${brand(siWhatsapp, 'h-5 w-5')}</span><span data-i18n="cta.note">${t('cta.note')}</span></p>
        <p class="mt-2 text-xs font-semibold text-[#33415C]" data-ph="whatsapp"><span class="ph-tag">Placeholder</span> <span class="ml-1">WhatsApp: <span data-text="whatsapp">+27 00 000 0000</span></span></p>
      </form>
      <div id="demo-success" class="py-6 text-center outline-none sm:py-8" tabindex="-1" role="status" hidden>
        <span class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-leaf text-white">${lucide('check', 'h-8 w-8', 3)}</span>
        <h3 class="mt-5 font-display text-3xl font-extrabold tracking-tight" data-i18n="cta.ok.title">${t('cta.ok.title')}</h3>
        ${x('cta.ok.text', 'p', 'mx-auto mt-3 max-w-sm text-lg font-semibold text-[#33415C]')}
        <div class="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <a id="success-whatsapp" href="https://wa.me/27000000000" target="_blank" rel="noopener" class="btn btn-black">${brand(siWhatsapp, 'h-5 w-5')}<span data-i18n="cta.ok.again">${t('cta.ok.again')}</span></a>
          <button id="success-edit" type="button" class="btn btn-outline" data-i18n="cta.ok.edit">${t('cta.ok.edit')}</button>
        </div>
      </div>
    </div>
  </div>
</section>`;

  const footer = `
<!-- ============================== 13. FOOTER ============================== -->
<footer class="bg-night py-14 text-white">
  <div class="wrap">
    <div class="grid grid-cols-1 gap-10 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1.2fr)]">
      <div>
        <a href="#top" class="inline-flex items-center gap-2.5 text-white" aria-label="Front Desk AI">${logo}</a>
        ${x('foot.desc', 'p', 'mt-4 max-w-sm text-base leading-relaxed text-[#C9D6EE]')}
        <p class="mt-4 flex items-center gap-2 text-base font-semibold text-white">${lucide('map-pin', 'h-5 w-5 text-sun', 2.25)}<span data-i18n="foot.place">${t('foot.place')}</span></p>
      </div>
      <nav aria-label="Footer">
        ${x('foot.explore', 'p', 'font-display text-sm font-bold uppercase tracking-wider text-[#9FB0CE]')}
        <ul class="mt-4 space-y-3 text-base font-semibold">
${[...NAV, ['#how', 'foot.how'], ['#try', 'foot.try'], ['#demo', 'nav.cta']].map(([href, key]) => `          <li><a class="foot-link" href="${href}" data-i18n="${key}">${t(key)}</a></li>`).join('\n')}
        </ul>
      </nav>
      <div>
        ${x('foot.contact', 'p', 'font-display text-sm font-bold uppercase tracking-wider text-[#9FB0CE]')}
        <ul class="mt-4 space-y-3 text-base font-semibold">
          <li><a class="foot-link inline-flex items-center gap-2.5" href="mailto:hello@example.com" data-mailto="email">${lucide('mail', 'h-5 w-5', 2.25)}<span data-text="email">hello@example.com</span></a> ${PH('email')}</li>
          <li><a class="foot-link inline-flex items-center gap-2.5" href="tel:+27000000000" data-tel="phone">${lucide('phone', 'h-5 w-5', 2.25)}<span data-text="phone">+27 00 000 0000</span></a> ${PH('phone')}</li>
          <li><a class="foot-link inline-flex items-center gap-2.5" href="https://wa.me/27000000000" data-wa target="_blank" rel="noopener">${brand({ ...siWhatsapp, hex: 'FFFFFF' }, 'h-5 w-5')}<span data-i18n="contact.whatsapp">${t('contact.whatsapp')}</span></a> ${PH('whatsapp')}</li>
        </ul>
      </div>
    </div>
    <div class="mt-10 flex flex-col gap-2 border-t border-white/15 pt-6 text-sm font-semibold text-[#C9D6EE] sm:flex-row sm:items-center sm:justify-between">
      <p>&copy; <span id="year">2026</span> Front Desk AI. <span data-i18n="foot.rights">${t('foot.rights')}</span></p>
      <p class="flex items-center gap-2">${lucide('shield-check', 'h-4 w-4', 2.25)}<span data-i18n="hero.trust">${t('hero.trust')}</span></p>
    </div>
  </div>
</footer>`;

  // ---------------------------------------------------------------- Search engine data
  const url = `${env.siteUrl}/`;
  const title = 'Front Desk AI | AI Receptionist for South African Businesses';
  const description = 'Front Desk AI is an AI receptionist for South African businesses. It answers your phone day and night, books appointments and takes messages, in English, Afrikaans and isiXhosa. R1,999 per month.';
  const ld = [
    {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      '@id': `${url}#business`,
      name: 'Front Desk AI',
      description: 'An AI receptionist and AI answering service for small businesses in South Africa. It answers the phone 24/7, books appointments and takes messages for dentists, doctors, salons, spas, physios, vets, law firms, guesthouses and auto workshops.',
      url,
      image: `${env.siteUrl}/og-image.png`,
      telephone: '+27 00 000 0000',
      email: 'hello@example.com',
      priceRange: 'R1,999 per month',
      address: { '@type': 'PostalAddress', addressLocality: 'Cape Town', addressRegion: 'Western Cape', addressCountry: 'ZA' },
      geo: { '@type': 'GeoCoordinates', latitude: -33.9249, longitude: 18.4241 },
      areaServed: ['Cape Town', 'Johannesburg', 'Pretoria', 'Durban', 'Gqeberha', 'Bloemfontein'].map((name) => ({ '@type': 'City', name })),
      knowsLanguage: ['en', 'af', 'xh'],
      makesOffer: { '@type': 'Offer', name: 'Front Desk AI receptionist', price: '1999', priceCurrency: 'ZAR', description: 'R1,999 per month, R2,500 once-off setup, 400 call minutes included, R3 per extra minute. No contracts.' },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [1, 2, 3, 4, 5, 6, 7].map((n) => ({ '@type': 'Question', name: strings[`faq.${n}.q`], acceptedAnswer: { '@type': 'Answer', text: strings[`faq.${n}.a`] } })),
    },
  ];
  const favicon = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="#1570EF"/><g transform="translate(6 6) scale(.8333)" fill="none" stroke="#fff" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"><path d="M3 20a1 1 0 0 1-1-1v-1a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v1a1 1 0 0 1-1 1Z"/><path d="M20 16a8 8 0 1 0-16 0"/><path d="M12 4v4"/><path d="M10 4h4"/></g></svg>')}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>${title}</title>
  <meta name="description" content="${description}">
  <link rel="canonical" href="${url}">
  <meta name="theme-color" content="#1570EF">
  <meta name="google-site-verification" content="${esc(env.googleVerification)}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Front Desk AI">
  <meta property="og:locale" content="en_ZA">
  <meta property="og:url" content="${url}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${env.siteUrl}/og-image.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="Front Desk AI: the AI receptionist that answers your phone and books your appointments.">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${env.siteUrl}/og-image.png">
  <link rel="icon" href="${favicon}">
  <link rel="preload" href="fonts/poppins-latin-800-normal.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="fonts/nunito-sans-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="assets/app.css">
  <script>
    // Set the theme before the page paints: saved choice first, then the visitor's system setting.
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
<body id="top" class="bg-page font-sans text-body antialiased">
${header}

<main id="main">
${hero}
${what}
${examples}
${how}
${industries}
${compare}
${pricing}
${tryIt}
${contact}
${faq}
${cta}
</main>
${footer}

<script src="site-config.js"></script>
<script type="module" src="assets/app.js"></script>
</body>
</html>
`;
}
