// Click-through test of the whole site in a real browser. Run with: npm run build && npm run test:e2e
// It starts its own servers with mock voice and phone providers (tests/mocks.mjs),
// so it needs no keys and makes no real calls.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { createApp } from '../server/index.js';
import { loadConfig } from '../server/config.js';
import { STRINGS, KEYS } from '../web/src/i18n.js';
import { startMockXai } from './mocks.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'web', 'dist');

let failures = 0;
const check = (name, ok, detail = '') => { if (!ok) failures += 1; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail && !ok ? `  [${String(detail).slice(0, 300)}]` : ''}`); };
const listen = (app) => new Promise((resolve) => app.server.listen(0, '127.0.0.1', () => resolve(app.server.address().port)));

async function boot(extra = {}) {
  const mock = await startMockXai();
  const env = { STATIC_DIR: dist, XAI_API_KEY: 'test-xai-key', XAI_API_BASE: mock.apiBase, XAI_REALTIME_URL: mock.realtimeUrl, DEMO_SESSIONS_PER_IP_PER_HOUR: '50', DEMO_MAX_CONCURRENT: '10', ...extra };
  if (extra.TWILIO_ACCOUNT_SID) env.TWILIO_API_BASE = mock.twilioBase;
  if (extra.ELEVENLABS_API_KEY) env.ELEVENLABS_API_BASE = mock.elevenBase;
  const app = createApp(loadConfig(env));
  const port = await listen(app);
  return { mock, app, url: `http://127.0.0.1:${port}/`, stop: async () => { await app.close(); await mock.close(); } };
}
const TWILIO = { TWILIO_ACCOUNT_SID: 'ACtest', TWILIO_AUTH_TOKEN: 'twilio-secret', TWILIO_PHONE_NUMBER: '+27215550100', PUBLIC_URL: 'https://demo.example.test' };

const browser = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--autoplay-policy=no-user-gesture-required'] });
const strictBrowser = await chromium.launch(); // no fake devices: used for "microphone refused"

async function open(b, url, options = {}) {
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, ...options });
  await ctx.addInitScript(() => { window.__opened = []; window.open = (u) => { window.__opened.push(u); return null; }; });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text().slice(0, 200)); });
  await page.goto(url, { waitUntil: 'load' });
  return { ctx, page, errors };
}
const inView = (page, selector) => page.evaluate((s) => { const r = document.querySelector(s).getBoundingClientRect(); return r.top >= -4 && r.top < window.innerHeight * 0.75; }, selector);
const stageState = (page) => page.evaluate(() => window.__frontDesk.stage().state());

/* ============================== copy ============================== */
{
  const empty = KEYS.filter((k) => ['en', 'af'].some((l) => !String(STRINGS[l][k] || '').trim()));
  check(`all ${KEYS.length} texts exist in English and Afrikaans`, empty.length === 0, empty.join(','));
  const same = KEYS.filter((k) => STRINGS.af[k] === STRINGS.en[k] && !['stage.ai', 'price.fd.name', 'how.sec', 'feat.owner'].includes(k));
  check('Afrikaans is a real translation, not copied English', same.length === 0, same.join(','));
  const dashes = KEYS.filter((k) => ['en', 'af'].some((l) => /[—–]/.test(STRINGS[l][k])));
  check('no em dashes in any language', dashes.length === 0, dashes.join(','));
  const stats = KEYS.filter((k) => /\b(62|85|80|78)% of\b/.test(STRINGS.en[k]));
  check('no borrowed missed-call statistics in the copy', stats.length === 0, stats.join(','));
  check('copy promises English only, Afrikaans "in testing"', /English/.test(STRINGS.en['try.lang']) && /in testing/.test(STRINGS.en['try.lang']) && !/isiXhosa(?! or isiZulu, it takes)/.test(STRINGS.en['try.lang']));
}

/* ============================== main run: voice and phone configured ============================== */
const A = await boot(TWILIO);
{
  const { ctx, page, errors } = await open(browser, A.url, { permissions: ['microphone'] });

  // Search engine basics
  const seo = await page.evaluate(() => ({
    title: document.title,
    h1: document.querySelectorAll('h1').length,
    h1Text: document.querySelector('h1').textContent,
    description: document.querySelector('meta[name="description"]').content,
    canonical: document.querySelector('link[rel="canonical"]').href,
    og: ['og:title', 'og:description', 'og:image', 'og:url'].every((p) => document.querySelector(`meta[property="${p}"]`)?.content),
    twitter: document.querySelector('meta[name="twitter:card"]').content,
    ld: Array.from(document.querySelectorAll('script[type="application/ld+json"]')).map((s) => JSON.parse(s.textContent)['@type']),
    imgs: document.images.length,
  }));
  check('title tag', seo.title === 'Front Desk AI | AI Receptionist for South African Businesses', seo.title);
  check('one H1, and the first screen says what it is', seo.h1 === 1 && /When you can't pick up, we answer/.test(seo.h1Text) && await page.isVisible('text=AI receptionist for South African businesses'));
  check('meta description, canonical, Open Graph and Twitter card', seo.description.length > 80 && seo.canonical === 'https://frontdeskai.co.za/' && seo.og && seo.twitter === 'summary_large_image');
  check('JSON-LD for LocalBusiness and FAQPage', seo.ld.join(',') === 'LocalBusiness,FAQPage', seo.ld.join(','));
  check('no stock photos on the page', seo.imgs === 0, seo.imgs);
  for (const file of ['robots.txt', 'sitemap.xml', 'og-image.png', 'site-config.js', 'audio/call-dentist.mp3', 'audio/call-salon.mp3', 'audio/call-plumber.mp3']) {
    const res = await page.request.get(A.url + file);
    check(`${file} is served`, res.ok(), res.status());
  }
  check('search terms appear in the page', await page.evaluate(() => { const t = document.body.innerText; const ld = Array.from(document.querySelectorAll('script[type="application/ld+json"]')).map((s) => s.textContent).join(' '); return /AI receptionist/i.test(t) && /South Africa/.test(t) && /AI answering service/i.test(ld); }));
  check('no blur anywhere', (await page.evaluate(() => Array.from(document.querySelectorAll('*')).filter((el) => { const s = getComputedStyle(el); return (s.backdropFilter && s.backdropFilter !== 'none') || /blur/.test(s.filter); }).length)) === 0);
  check('no emojis in the page text', !(await page.evaluate(() => /\p{Extended_Pictographic}/u.test(document.body.innerText.replace(/©/g, '')))));
  const links = await page.evaluate(() => Array.from(document.querySelectorAll('a')).map((a) => a.getAttribute('href')));
  const missing = await page.evaluate((list) => list.filter((h) => h.startsWith('#') && (h.length < 2 || !document.querySelector(h))), links);
  check(`all ${links.length} links go somewhere`, missing.length === 0 && links.every((h) => h && h !== '#'), missing.join(',') + links.filter((h) => !h || h === '#').join(','));

  // Header
  for (const [label, id] of [['How it works', '#how'], ['Hear it', '#calls'], ['Try it', '#try'], ['Pricing', '#pricing'], ['Questions', '#faq']]) {
    await page.click(`header nav[aria-label="Main"] >> text="${label}"`);
    await page.waitForTimeout(1300);
    check(`nav "${label}" scrolls to ${id}`, await inView(page, id));
  }
  await page.click('header >> text="Start free trial"');
  await page.waitForTimeout(1400);
  check('header "Start free trial" goes to the trial form', await inView(page, '#start'));
  const demoHeader = await page.evaluate(() => { const a = document.getElementById('header-demo'); return a && a.getAttribute('href'); });
  check('header shows "Call the demo line" when a demo number exists', demoHeader === 'tel:+27215550100', demoHeader);

  // The call stage
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(2500);
  let s1 = await stageState(page);
  check('hero stage plays the call by itself (silently) when on screen', s1.playing && !s1.sound && s1.pos > 1, JSON.stringify(s1));
  await page.waitForTimeout(1500);
  const cap = await page.evaluate(() => ({ shown: document.querySelectorAll('#stage .bubble-text .w:not(.is-hidden)').length, all: document.querySelectorAll('#stage .bubble-text .w').length, diary: document.getElementById('stage').dataset.diary, status: document.querySelector('[data-status-text]').textContent }));
  check('the caption types out word by word, in step with the call', cap.shown >= 1 && cap.all >= cap.shown && cap.diary === 'none' && cap.status === 'Answered', JSON.stringify(cap));
  await page.click('[data-stage-toggle]');
  const p1 = await stageState(page);
  await page.waitForTimeout(700);
  const p2 = await stageState(page);
  check('Pause stops the stage', !p2.playing && Math.abs(p1.pos - p2.pos) < 0.05);
  await page.click('.hero [data-stage-sound]');
  await page.waitForTimeout(2500);
  const snd = await page.evaluate(() => { const a = document.getElementById('stage-audio'); return { t: a.currentTime, paused: a.paused, src: a.getAttribute('src') }; });
  check('"Hear a real call" plays the recording', snd.src === 'audio/call-dentist.mp3' && !snd.paused && snd.t > 1, JSON.stringify(snd));
  await page.evaluate(() => { document.getElementById('stage-audio').currentTime = 44; });
  await page.waitForTimeout(800);
  const late = await page.evaluate(() => ({ diary: document.getElementById('stage').dataset.diary, time: document.querySelector('#stage .big-time').innerText.trim(), wa: document.querySelector('#stage [data-wa="owner"]').classList.contains('is-shown') && document.querySelector('#stage [data-wa="owner"]').offsetParent !== null, status: document.querySelector('[data-status-text]').textContent }));
  check('the scene follows the audio: the diary card books, the WhatsApp lands', late.diary === 'booked' && late.time === '08:00' && late.wa && late.status === 'WhatsApp sent', JSON.stringify(late));
  await page.click('[data-stage-toggle]');

  // Language
  await page.click('#lang-desktop [data-lang="af"]');
  let lang = await page.evaluate(() => ({ html: document.documentElement.lang, h1: document.querySelector('h1').textContent, nav: document.querySelector('header nav a').textContent, faq: document.querySelector('#faq-q-1').textContent.trim(), price: document.querySelector('#price-title').textContent, wa: document.querySelector('[data-wa-call="dentist"][data-wa-kind="owner"]').textContent }));
  check('Afrikaans translates the page, including the WhatsApp messages', lang.html === 'af' && lang.h1 === `${STRINGS.af['hero.t1']} ${STRINGS.af['hero.t2']} ${STRINGS.af['hero.t3']}` && lang.nav === 'Hoe dit werk' && lang.faq === STRINGS.af['faq.1.q'] && lang.price === STRINGS.af['price.title'] && /^Nuwe bespreking/.test(lang.wa), JSON.stringify(lang));
  const untranslated = await page.evaluate((en) => Array.from(document.querySelectorAll('[data-i18n]')).filter((el) => el.textContent === en[el.dataset.i18n]).map((el) => el.dataset.i18n), STRINGS.en);
  check('nothing stays in English after switching', untranslated.filter((k) => STRINGS.af[k] !== STRINGS.en[k]).length === 0, untranslated.join(','));
  await page.reload({ waitUntil: 'load' });
  check('language choice is remembered', await page.evaluate(() => document.documentElement.lang === 'af'));
  await page.click('#lang-desktop [data-lang="en"]');

  // Dark mode
  await page.click('[data-theme-toggle]');
  const dark = await page.evaluate(() => ({ cls: document.documentElement.classList.contains('dark'), bg: getComputedStyle(document.body).backgroundColor }));
  check('dark mode toggles', dark.cls && dark.bg === 'rgb(0, 0, 0)', JSON.stringify(dark));
  await page.reload({ waitUntil: 'load' });
  check('dark mode is remembered', await page.evaluate(() => document.documentElement.classList.contains('dark')));
  await page.click('[data-theme-toggle]');

  // Ring to booked: the timeline plays the real timings
  await page.locator('[data-timeline]').scrollIntoViewIfNeeded();
  await page.waitForTimeout(1500);
  const midway = await page.$$eval('.tl-node.is-on', (els) => els.length);
  await page.waitForTimeout(5000);
  const tl = await page.evaluate(() => ({ on: document.querySelectorAll('.tl-node.is-on').length, title: document.getElementById('how-title').textContent }));
  check('the ring-to-booked timeline plays in when scrolled to', midway >= 1 && midway < 5 && tl.on === 5 && /Ring to booked in \d+ seconds/.test(tl.title), JSON.stringify({ midway, tl }));

  // Recorded calls
  await page.locator('#rec-list').scrollIntoViewIfNeeded();
  await page.click('.rec-card[data-rec="salon"] .rec-play');
  await page.waitForTimeout(2200);
  let rec = await page.evaluate(() => { const a = document.getElementById('rec-audio'); return { src: a.getAttribute('src'), t: a.currentTime, paused: a.paused, played: document.querySelectorAll('.rec-card[data-rec="salon"] .rec-bars i.is-played').length, pressed: document.querySelector('.rec-card[data-rec="salon"] .rec-play').getAttribute('aria-pressed') }; });
  check('a recorded call plays and its waveform fills', rec.src === 'audio/call-salon.mp3' && rec.t > 1 && !rec.paused && rec.played >= 1 && rec.pressed === 'true', JSON.stringify(rec));
  await page.evaluate(() => { const r = document.querySelector('.rec-card[data-rec="salon"] .rec-seek'); r.value = '30'; r.dispatchEvent(new Event('input', { bubbles: true })); });
  await page.waitForTimeout(600);
  rec = await page.evaluate(() => ({ t: document.getElementById('rec-audio').currentTime, line: document.querySelector('.rec-card[data-rec="salon"] .rec-line').textContent }));
  check('the waveform seeks, and the subtitle follows the audio', rec.t >= 29.5 && rec.t < 33 && !/^Studio Lumi, you're through/.test(rec.line), JSON.stringify(rec));
  await page.click('.rec-card[data-rec="salon"] .rec-play');
  check('recording pauses', await page.evaluate(() => document.getElementById('rec-audio').paused));
  await page.locator('#features').scrollIntoViewIfNeeded();
  await page.click('[data-play-rec="plumber"]');
  await page.waitForTimeout(1500);
  rec = await page.evaluate(() => { const a = document.getElementById('rec-audio'); return { src: a.getAttribute('src'), playing: !a.paused }; });
  check('"Hear it happen" plays the plumber call', rec.src === 'audio/call-plumber.mp3' && rec.playing, JSON.stringify(rec));
  await page.evaluate(() => document.getElementById('rec-audio').pause());
  await page.click('.rec-card[data-rec="dentist"] summary');
  check('each call has a readable transcript', await page.locator('.rec-card[data-rec="dentist"] .transcript li').first().isVisible());

  // FAQ
  const fh = (n) => page.evaluate((i) => document.getElementById(`faq-a-${i}`).getBoundingClientRect().height, n);
  let faqOk = (await page.locator('.faq-item').count()) === 5;
  for (let n = 1; n <= 5; n += 1) {
    const closed = await fh(n);
    await page.click(`#faq-q-${n}`);
    await page.waitForTimeout(420);
    if (!(closed < 2 && (await fh(n)) > 30)) faqOk = false;
  }
  await page.click('#faq-q-1');
  await page.waitForTimeout(420);
  check('5 FAQ questions open and close', faqOk && (await fh(1)) < 2);

  // Pricing button carries the plan into the trial form
  await page.click('#pricing [data-plan="Front Desk"]');
  await page.waitForTimeout(1300);
  check('pricing button goes to the trial form and remembers the plan', await inView(page, '#start') && (await page.inputValue('#start-form input[name="plan"]')) === 'Front Desk');

  // Trial form
  await page.click('#start-form button[type="submit"]');
  let errs = await page.$$eval('#start-form .field-error', (els) => els.filter((e) => !e.hidden).map((e) => e.id));
  check('empty form shows 4 errors (email is optional) and does not submit', errs.join(',') === 'error-name,error-business,error-type,error-phone' && (await page.evaluate(() => window.__opened.length)) === 0, errs.join(','));
  await page.fill('#start-name', 'Naledi Dube');
  await page.fill('#start-business', 'Studio Lumi');
  await page.selectOption('#start-type', '3');
  await page.fill('#start-phone', '123');
  await page.fill('#start-email', 'naledi@lumi');
  await page.click('#start-form button[type="submit"]');
  errs = await page.$$eval('#start-form .field-error', (els) => els.filter((e) => !e.hidden).map((e) => e.id));
  check('bad phone and email are rejected', errs.join(',') === 'error-phone,error-email', errs.join(','));
  await page.fill('#start-phone', '082 123 4567');
  await page.fill('#start-email', '');
  await page.click('label.radio:has(input[value="all"])');
  await page.click('#start-form button[type="submit"]');
  const sent = await page.evaluate(() => ({ ok: !document.getElementById('start-success').hidden, url: window.__opened[0] || '' }));
  const msg = decodeURIComponent(sent.url.split('?text=')[1] || '');
  check('valid form confirms and opens WhatsApp with the details', sent.ok && sent.url.startsWith('https://wa.me/27000000000?text=') && ['Your name: Naledi Dube', 'Business name: Studio Lumi', 'Type of business: Hair or beauty salon, spa', 'Cell number: 082 123 4567', 'When should it answer? Every call', 'Plan: Front Desk'].every((l) => msg.includes(l)), msg);
  await page.click('#start-edit');
  check('"Change my details" goes back with the details kept', await page.evaluate(() => !document.getElementById('start-form').hidden && document.getElementById('start-name').value === 'Naledi Dube'));

  // Contact details
  const contact = await page.evaluate(() => ({ mail: document.querySelector('footer a[data-mailto]').getAttribute('href'), tel: document.querySelector('footer a[data-tel]').getAttribute('href'), wa: document.querySelector('footer a[data-wa-link]').getAttribute('href'), tags: document.querySelectorAll('footer .ph-tag:not([hidden])').length }));
  check('footer contact links work and are marked PLACEHOLDER', contact.mail === 'mailto:hello@example.com' && contact.tel === 'tel:+27000000000' && contact.wa.startsWith('https://wa.me/27000000000?text=') && contact.tags === 3, JSON.stringify(contact));

  // Live demo (mock voice provider)
  await page.locator('#try').scrollIntoViewIfNeeded();
  await page.waitForSelector('#demo-box[data-state="live"]', { timeout: 8000 });
  await page.click('[data-biz="salon"]');
  check('business picker selects one business', await page.evaluate(() => [...document.querySelectorAll('[data-biz]')].filter((b) => b.getAttribute('aria-pressed') === 'true').map((b) => b.dataset.biz).join() === 'salon'));
  await page.click('#mic-button');
  await page.waitForSelector('#mic-button[data-state="live"]', { timeout: 10000 });
  await page.waitForFunction(() => document.querySelectorAll('#transcript li').length >= 4, null, { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(500);
  const live = await page.evaluate(() => ({ lines: Array.from(document.querySelectorAll('#transcript li')).filter((li) => !li.hidden).map((li) => li.innerText.replace(/\n+/g, ': ')), timer: document.getElementById('mic-timer').textContent, label: document.getElementById('mic-caption').textContent }));
  check('the chosen business answers (salon)', /Studio Lumi/.test(A.mock.state.sessionUpdates.at(-1).instructions));
  check('live call shows greeting, caller words and the diary check', live.lines.length >= 4 && live.lines.some((l) => /^YOU: Can I book/i.test(l)) && live.lines.some((l) => /Checking the diary/.test(l)), live.lines.join(' || '));
  check('timer counts down and the button becomes "End call"', /^2:5\d$/.test(live.timer) && live.label === 'End call', JSON.stringify(live));
  check('only the short-lived secret reached the voice provider', A.mock.state.connections.at(-1).via === 'client-secret');
  await page.click('#mic-button');
  await page.waitForSelector('#mic-button[data-state="idle"]');
  check('after the call, the owner\'s WhatsApp summary is shown', await page.isVisible('#live-summary') && (await page.textContent('#live-summary-text')).length > 10, await page.textContent('#live-summary-text'));
  const health = await (await page.request.get(`${A.url}api/health`)).json();
  check('ending the call frees the session', health.demo.activeSessions === 0);
  check('native voice mode connects the browser straight to the voice provider', health.voice.speech === 'native');

  // Phone test (mock Twilio)
  check('phone test shows with the demo number', await page.isVisible('#phone-test') && (await page.textContent('#dial-number')) === '021 555 0100');
  await page.fill('#call-phone', '123');
  await page.click('#call-form button[type="submit"]');
  check('call-me rejects a bad number', /Enter a South African number/.test(await page.textContent('#call-status')) && A.mock.state.twilioCalls.length === 0);
  await page.fill('#call-phone', '082 555 0142');
  await page.click('#call-form button[type="submit"]');
  await page.waitForFunction(() => /Calling you now/.test(document.getElementById('call-status').textContent), null, { timeout: 5000 }).catch(() => {});
  check('call-me places the call for the chosen business', /Calling you now/.test(await page.textContent('#call-status')) && A.mock.state.twilioCalls[0]?.form.To === '+27825550142' && /business=salon$/.test(A.mock.state.twilioCalls[0]?.form.Url), JSON.stringify(A.mock.state.twilioCalls[0]?.form));
  await page.click('#call-form button[type="submit"]');
  await page.waitForFunction(() => /already had a test call/.test(document.getElementById('call-status').textContent), null, { timeout: 5000 }).catch(() => {});
  check('a second call to the same number this hour is refused', A.mock.state.twilioCalls.length === 1);

  for (let y = 0; y < 15000; y += 500) { await page.evaluate((v) => window.scrollTo(0, v), y); await page.waitForTimeout(40); }
  await page.waitForTimeout(800);
  check('every fade-in element becomes visible', (await page.evaluate(() => Array.from(document.querySelectorAll('[data-reveal]')).filter((e) => !e.closest('[hidden]') && !e.classList.contains('is-visible')).length)) === 0);
  check('no JavaScript errors (desktop)', errors.length === 0, errors.join(' | '));
  await ctx.close();
}

/* ============================== natural voice: browser talks to our relay ============================== */
{
  const R = await boot({ ELEVENLABS_API_KEY: 'test-el-key' });
  const { ctx, page, errors } = await open(browser, R.url, { permissions: ['microphone'] });
  const sockets = [];
  page.on('websocket', (ws) => sockets.push(ws.url()));
  await page.locator('#try').scrollIntoViewIfNeeded();
  await page.waitForSelector('#demo-box[data-state="live"]', { timeout: 8000 });
  await page.click('#mic-button');
  await page.waitForSelector('#mic-button[data-state="live"]', { timeout: 10000 });
  await page.waitForFunction(() => document.querySelectorAll('#transcript li').length >= 4, null, { timeout: 15000 }).catch(() => {});
  const lines = await page.evaluate(() => Array.from(document.querySelectorAll('#transcript li')).filter((li) => !li.hidden).map((li) => li.innerText.replace(/\n+/g, ': ')));
  check('ElevenLabs voice: the browser talks only to our server', sockets.length === 1 && /\/api\/demo\/stream\?session=/.test(sockets[0]) && R.mock.state.tokens.length === 0, sockets.join(','));
  check('ElevenLabs voice: greeting, caller words and the diary check show', lines.some((l) => /Milkwood Dental/.test(l)) && lines.some((l) => /^YOU: Can I book/i.test(l)) && lines.some((l) => /Checking the diary/.test(l)) && R.mock.state.ttsRequests.length >= 2, lines.join(' || '));
  await page.click('#mic-button');
  await page.waitForSelector('#mic-button[data-state="idle"]');
  await page.waitForTimeout(300);
  const h = await (await page.request.get(`${R.url}api/health`)).json();
  check('ElevenLabs voice: ending the call frees the session', h.demo.activeSessions === 0 && h.voice.speech === 'elevenlabs');
  check('no JavaScript errors (relay)', errors.length === 0, errors.join(' | '));
  await ctx.close();
  await R.stop();
}

/* ============================== reduced motion ============================== */
{
  const { ctx, page } = await open(browser, A.url, { reducedMotion: 'reduce' });
  await page.waitForTimeout(1500);
  const s = await stageState(page);
  const shown = await page.evaluate(() => ({ hidden: document.querySelectorAll('#stage .bubble-text .w.is-hidden').length, diary: document.getElementById('stage').dataset.diary, wa: document.querySelectorAll('#stage [data-wa].is-shown').length, tl: document.querySelectorAll('.tl-node.is-on').length }));
  check('reduced motion: the finished call and timeline are shown, nothing moves by itself', !s.playing && s.pos >= 39 && shown.hidden === 0 && shown.diary === 'booked' && shown.wa === 1 && shown.tl === 5, JSON.stringify({ s, shown }));
  await ctx.close();
}

/* ============================== time cap and failure states ============================== */
{
  const C = await boot({ DEMO_MAX_SECONDS: '4' });
  const { ctx, page } = await open(browser, C.url, { permissions: ['microphone'] });
  await page.locator('#try').scrollIntoViewIfNeeded();
  await page.waitForSelector('#demo-box[data-state="live"]');
  check('no demo number: the header link is hidden', !(await page.$('#header-demo')));
  await page.click('#mic-button');
  await page.waitForSelector('#mic-button[data-state="live"]', { timeout: 10000 });
  await page.waitForSelector('#mic-button[data-state="idle"]', { timeout: 9000 }).catch(() => {});
  await page.waitForTimeout(300);
  const health = await (await page.request.get(`${C.url}api/health`)).json();
  check('the session ends by itself at the time cap', /Time's up/.test(await page.textContent('#mic-status')) && health.demo.activeSessions === 0, await page.textContent('#mic-status'));
  await ctx.close();
  await C.stop();
}
{
  const before = A.mock.state.tokens.length;
  const { ctx, page } = await open(strictBrowser, A.url);
  await ctx.clearPermissions();
  await page.locator('#try').scrollIntoViewIfNeeded();
  await page.waitForSelector('#demo-box[data-state="live"]');
  await page.click('#mic-button');
  await page.waitForFunction(() => document.getElementById('mic-button').dataset.state === 'idle' && /microphone/i.test(document.getElementById('mic-status').textContent), null, { timeout: 8000 }).catch(() => {});
  check('refused microphone: clear message, no session used', /microphone/i.test(await page.textContent('#mic-status')) && A.mock.state.tokens.length === before, await page.textContent('#mic-status'));
  await ctx.close();
}
{
  const D = await boot({ DEMO_MAX_CONCURRENT: '1' });
  const hold = await fetch(`${D.url}api/demo/session`, { method: 'POST' });
  const { ctx, page } = await open(browser, D.url, { permissions: ['microphone'] });
  await page.locator('#try').scrollIntoViewIfNeeded();
  await page.waitForSelector('#demo-box[data-state="live"]');
  await page.click('#mic-button');
  await page.waitForFunction(() => /busy/i.test(document.getElementById('mic-status').textContent), null, { timeout: 8000 }).catch(() => {});
  check('session limit reached: "all demo lines are busy"', hold.ok && /All demo lines are busy/.test(await page.textContent('#mic-status')));
  await ctx.close();
  await D.stop();
}
{
  const E = await boot();
  const { ctx, page } = await open(browser, E.url, { permissions: ['microphone'] });
  await page.locator('#try').scrollIntoViewIfNeeded();
  await page.waitForSelector('#demo-box[data-state="live"]');
  await page.click('#mic-button');
  await page.waitForSelector('#mic-button[data-state="live"]', { timeout: 10000 });
  await E.mock.close();
  await page.waitForSelector('#mic-button[data-state="idle"]', { timeout: 8000 }).catch(() => {});
  check('a dropped connection ends the call with a clear message', /connection dropped/i.test(await page.textContent('#mic-status')));
  await ctx.close();
  await E.app.close();
}
{
  const B = await boot({ XAI_API_KEY: '' });
  const { ctx, page, errors } = await open(browser, B.url);
  await page.locator('#try').scrollIntoViewIfNeeded();
  await page.waitForSelector('#demo-box[data-state="off"]', { timeout: 8000 });
  check('no API key: notice shown, microphone and phone test hidden', /isn't switched on yet/.test(await page.innerText('#demo-box')) && !(await page.isVisible('#mic-button')) && !(await page.isVisible('#phone-test')));
  await page.click('.rec-card[data-rec="dentist"] .rec-play');
  await page.waitForTimeout(1500);
  check('the recorded calls still play', await page.evaluate(() => !document.getElementById('rec-audio').paused && document.getElementById('rec-audio').currentTime > 0.5));
  check('no JavaScript errors (no key)', errors.length === 0, errors.join(' | '));
  await ctx.close();
  await B.stop();
}
{
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.mp3': 'audio/mpeg', '.png': 'image/png' };
  const plain = http.createServer((req, res) => {
    const file = path.join(dist, req.url === '/' ? 'index.html' : decodeURIComponent(req.url.split('?')[0]));
    if (!file.startsWith(dist) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  await new Promise((resolve) => plain.listen(0, '127.0.0.1', resolve));
  const { ctx, page } = await open(browser, `http://127.0.0.1:${plain.address().port}/`);
  await page.locator('#try').scrollIntoViewIfNeeded();
  await page.waitForSelector('#demo-box[data-state="off"]', { timeout: 9000 }).catch(() => {});
  check('static host with no backend: falls back to the recorded calls', (await page.getAttribute('#demo-box', 'data-state')) === 'off' && (await page.locator('.rec-card').count()) === 3);
  await ctx.close();
  plain.close();
  plain.closeAllConnections?.();
}
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto(A.url);
  const ok = await page.evaluate(() => document.querySelectorAll('.rec-details .cap').length >= 20 && getComputedStyle(document.querySelector('#stage [data-wa]')).display !== 'none' && document.querySelector('#stage .bubble-text').textContent.length > 20);
  check('without JavaScript the calls, the scene and every section are still readable', ok && await page.locator('#faq-a-5 p').isVisible() && await page.locator('#pricing .plan').first().isVisible());
  await ctx.close();
}

/* ============================== system dark, phone, widths ============================== */
{
  const { ctx, page } = await open(browser, A.url, { colorScheme: 'dark' });
  check('first visit follows the system dark setting', await page.evaluate(() => document.documentElement.classList.contains('dark')));
  await ctx.close();
}
{
  const { ctx, page, errors } = await open(browser, A.url, { viewport: { width: 375, height: 740 }, hasTouch: true, isMobile: true });
  check('phone: menu closed, desktop links hidden', !(await page.isVisible('#mobile-menu')) && !(await page.isVisible('header nav[aria-label="Main"]')));
  await page.tap('#menu-toggle');
  check('phone: menu opens', await page.isVisible('#mobile-menu'));
  await page.tap('#lang-mobile [data-lang="af"]');
  check('phone: language switcher in the menu works', await page.evaluate(() => document.documentElement.lang === 'af'));
  await page.tap('#lang-mobile [data-lang="en"]');
  await page.tap('#mobile-menu >> text="Pricing"');
  await page.waitForTimeout(1300);
  check('phone: menu link closes the menu and scrolls', !(await page.isVisible('#mobile-menu')) && await inView(page, '#pricing'));
  await page.tap('#menu-toggle');
  await page.keyboard.press('Escape');
  check('phone: Escape closes the menu', !(await page.isVisible('#mobile-menu')));
  const small = await page.evaluate(() => Array.from(document.querySelectorAll('a.btn, button, [role="tab"]')).filter((e) => e.offsetParent !== null).map((e) => ({ t: (e.textContent || e.getAttribute('aria-label') || '').trim().slice(0, 20), h: Math.round(e.getBoundingClientRect().height), w: Math.round(e.getBoundingClientRect().width) })).filter((x) => x.h < 36 || x.w < 36));
  check('phone: buttons are big enough to tap', small.length === 0, JSON.stringify(small));
  check('no JavaScript errors (phone)', errors.length === 0, errors.join(' | '));
  await ctx.close();
}
for (const width of [320, 360, 375, 414, 768, 1024, 1280, 1440, 1920]) {
  const { ctx, page } = await open(browser, A.url, { viewport: { width, height: 900 } });
  await page.waitForTimeout(300);
  const o = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  check(`no sideways scroll at ${width}px`, o.sw <= o.cw, `${o.sw} > ${o.cw}`);
  await ctx.close();
}

/* ============================== accessibility ============================== */
const axeSource = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
for (const [name, options] of [['light desktop', { colorScheme: 'light' }], ['dark desktop', { colorScheme: 'dark' }], ['light phone', { colorScheme: 'light', viewport: { width: 375, height: 800 } }], ['dark phone', { colorScheme: 'dark', viewport: { width: 375, height: 800 } }]]) {
  const { ctx, page } = await open(browser, A.url, { reducedMotion: 'reduce', ...options });
  await page.waitForTimeout(1200);
  await page.addScriptTag({ content: axeSource });
  const result = await page.evaluate(async () => { const r = await window.axe.run(document, { runOnly: ['wcag2a', 'wcag2aa'] }); return r.violations.map((v) => `${v.id} (${v.nodes.length}): ${v.nodes.slice(0, 3).map((n) => `${n.target.join(' ')} ${(n.any[0] || n.all[0] || {}).message || ''}`).join(' ; ')}`); });
  check(`accessibility scan, ${name}: 0 violations`, result.length === 0, result.join(' || '));
  await ctx.close();
}
{
  const { ctx, page } = await open(browser, A.url);
  await page.keyboard.press('Tab');
  const first = await page.evaluate(() => document.activeElement.textContent);
  await page.keyboard.press('Tab');
  const second = await page.evaluate(() => ({ tag: document.activeElement.tagName, outline: getComputedStyle(document.activeElement).outlineWidth }));
  check('keyboard: skip link first, then visible focus rings', first === 'Skip to content' && second.tag === 'A' && second.outline !== '0px', JSON.stringify({ first, second }));
  await ctx.close();
}

await A.stop();
await browser.close();
await strictBrowser.close();
console.log(failures ? `\n${failures} FAILED` : '\nALL PASSED');
process.exit(failures ? 1 : 0);
