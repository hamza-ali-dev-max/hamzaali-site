// Click-through test of the whole site in a real browser. Run with: npm run test:e2e
// It starts its own servers with mock voice and phone providers (tests/mocks.mjs),
// so it needs no keys and makes no real calls. Run "npm run build" first.
import fs from 'node:fs';
import path from 'node:path';
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
const check = (name, ok, detail = '') => { if (!ok) failures += 1; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail && !ok ? `  [${String(detail).slice(0, 260)}]` : ''}`); };
const listen = (app) => new Promise((resolve) => app.server.listen(0, '127.0.0.1', () => resolve(app.server.address().port)));

async function boot(extra = {}) {
  const mock = await startMockXai();
  const env = { STATIC_DIR: dist, XAI_API_KEY: 'test-xai-key', XAI_API_BASE: mock.apiBase, XAI_REALTIME_URL: mock.realtimeUrl, DEMO_SESSIONS_PER_IP_PER_HOUR: '50', DEMO_MAX_CONCURRENT: '10', ...extra };
  if (extra.TWILIO_ACCOUNT_SID) env.TWILIO_API_BASE = mock.twilioBase;
  const app = createApp(loadConfig(env));
  const port = await listen(app);
  return { mock, app, url: `http://127.0.0.1:${port}/`, stop: async () => { await app.close(); await mock.close(); } };
}
const TWILIO = { TWILIO_ACCOUNT_SID: 'ACtest', TWILIO_AUTH_TOKEN: 'twilio-secret', TWILIO_PHONE_NUMBER: '+27215550100', PUBLIC_URL: 'https://demo.example.test' };

const proxy = process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY, bypass: 'localhost,127.0.0.1' } : undefined;
const browser = await chromium.launch({ proxy, args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--autoplay-policy=no-user-gesture-required'] });
const strictBrowser = await chromium.launch({ proxy }); // no fake devices: used for the "microphone refused" case

async function open(b, url, options = {}) {
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, ...options });
  await ctx.addInitScript(() => { window.__opened = []; window.open = (u) => { window.__opened.push(u); return null; }; });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/tile\.openstreetmap|Failed to load resource/.test(m.text())) errors.push(m.text().slice(0, 200)); });
  await page.goto(url, { waitUntil: 'load' });
  return { ctx, page, errors };
}
const inView = (page, selector) => page.evaluate((s) => { const r = document.querySelector(s).getBoundingClientRect(); return r.top >= -4 && r.top < window.innerHeight * 0.7; }, selector);

/* ============================== translations ============================== */
{
  const empty = KEYS.filter((k) => ['en', 'af', 'xh'].some((l) => !String(STRINGS[l][k] || '').trim()));
  check(`all ${KEYS.length} texts exist in English, Afrikaans and isiXhosa`, empty.length === 0, empty.join(','));
  const same = KEYS.filter((k) => STRINGS.af[k] === STRINGS.en[k] && STRINGS.xh[k] === STRINGS.en[k]);
  check('translations are real, not copies of the English', same.length === 0, same.join(','));
  const dashes = KEYS.filter((k) => ['en', 'af', 'xh'].some((l) => /[—–]/.test(STRINGS[l][k])));
  check('no em dashes in any language', dashes.length === 0, dashes.join(','));
}

/* ============================== main run: voice and phone configured ============================== */
const A = await boot(TWILIO);
{
  const { ctx, page, errors } = await open(browser, A.url, { permissions: ['microphone'] });

  // SEO basics
  const seo = await page.evaluate(() => ({
    title: document.title,
    h1: document.querySelectorAll('h1').length,
    h1Text: document.querySelector('h1').textContent,
    description: document.querySelector('meta[name="description"]').content,
    canonical: document.querySelector('link[rel="canonical"]').href,
    og: ['og:title', 'og:description', 'og:image', 'og:url'].every((p) => document.querySelector(`meta[property="${p}"]`)?.content),
    twitter: document.querySelector('meta[name="twitter:card"]').content,
    ld: Array.from(document.querySelectorAll('script[type="application/ld+json"]')).map((s) => JSON.parse(s.textContent)['@type']),
    imagesWithoutAlt: Array.from(document.images).filter((i) => !i.alt).length,
    lazy: Array.from(document.images).filter((i) => i.loading === 'lazy').length,
  }));
  check('title tag', seo.title === 'Front Desk AI | AI Receptionist for South African Businesses', seo.title);
  check('exactly one H1 that says what it is', seo.h1 === 1 && /AI receptionist that answers your phone and books your appointments/.test(seo.h1Text), seo.h1Text);
  check('meta description, canonical, Open Graph and Twitter card', seo.description.length > 80 && seo.canonical === 'https://frontdeskai.co.za/' && seo.og && seo.twitter === 'summary_large_image');
  check('JSON-LD for LocalBusiness and FAQPage', seo.ld.join(',') === 'LocalBusiness,FAQPage', seo.ld.join(','));
  check('every image has alt text, and below-the-fold images are lazy', seo.imagesWithoutAlt === 0 && seo.lazy >= 5, JSON.stringify(seo));
  for (const file of ['robots.txt', 'sitemap.xml', 'og-image.png', 'site-config.js']) {
    const res = await page.request.get(A.url + file);
    check(`${file} is served`, res.ok(), res.status());
  }
  check('search terms appear in the copy', await page.evaluate(() => { const t = document.body.innerText; return /AI receptionist for South Africa/i.test(t) && /AI answering service from Cape Town/i.test(t) && /virtual receptionist for dentists, salons/i.test(t); }));

  // No blur anywhere (hard rule) and no emojis
  const blur = await page.evaluate(() => Array.from(document.querySelectorAll('*')).filter((el) => { const s = getComputedStyle(el); return (s.backdropFilter && s.backdropFilter !== 'none') || /blur/.test(s.filter); }).length);
  check('no blur or frosted glass on any element', blur === 0, blur);
  check('no emojis in the page text', !(await page.evaluate(() => /\p{Extended_Pictographic}/u.test(document.body.innerText.replace(/©/g, '')))));

  // Links
  const links = await page.evaluate(() => Array.from(document.querySelectorAll('a')).map((a) => a.getAttribute('href')));
  const missing = await page.evaluate((list) => list.filter((h) => h.startsWith('#') && (h.length < 2 || !document.querySelector(h))), links);
  check(`all ${links.length} links go somewhere`, missing.length === 0 && links.every((h) => h && h !== '#'), missing.join(','));

  // Navbar links scroll smoothly to their sections
  for (const [label, id] of [['What it does', '#what'], ['Examples', '#examples'], ['Pricing', '#pricing'], ['FAQ', '#faq'], ['Contact', '#contact']]) {
    await page.click(`header nav[aria-label="Main"] >> text="${label}"`);
    await page.waitForTimeout(1300);
    check(`nav "${label}" scrolls to ${id}`, await inView(page, id));
  }
  await page.click('header >> text="Book a free demo"');
  await page.waitForTimeout(1400);
  check('navbar "Book a free demo" scrolls to the form', await inView(page, '#demo'));
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.click('.hero >> text="Try it now"');
  await page.waitForTimeout(1500);
  check('hero "Try it now" scrolls to the demo', await inView(page, '#try'));

  // Language switcher
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.click('#lang-desktop [data-lang="af"]');
  let lang = await page.evaluate(() => ({ html: document.documentElement.lang, h1: document.querySelector('h1').textContent, nav: document.querySelector('header nav a').textContent, faq: document.querySelector('#faq-q-1').textContent.trim(), price: document.querySelector('#pricing-title').textContent, cta: document.querySelector('#demo-title').textContent, pressed: document.querySelector('#lang-desktop [data-lang="af"]').getAttribute('aria-pressed') }));
  check('Afrikaans translates header, hero, pricing, FAQ and call to action', lang.html === 'af' && lang.h1 === STRINGS.af['hero.title'] && lang.nav === 'Wat dit doen' && lang.faq === STRINGS.af['faq.1.q'] && lang.price === 'Een plan. Een prys.' && lang.cta === STRINGS.af['cta.title'] && lang.pressed === 'true', JSON.stringify(lang));
  await page.click('#lang-desktop [data-lang="xh"]');
  lang = await page.evaluate(() => ({ html: document.documentElement.lang, h1: document.querySelector('h1').textContent, what: document.querySelector('#what-title').textContent, ex: document.querySelector('#examples-title').textContent }));
  check('isiXhosa translates the page', lang.html === 'xh' && lang.h1 === STRINGS.xh['hero.title'] && lang.what === 'Ekwenzayo' && lang.ex === STRINGS.xh['ex.title'], JSON.stringify(lang));
  const untranslated = await page.evaluate((en) => Array.from(document.querySelectorAll('[data-i18n]')).filter((el) => el.textContent === en[el.dataset.i18n] && !['ind.does'].includes(el.dataset.i18n)).map((el) => el.dataset.i18n), STRINGS.en);
  check('nothing on the page stays in English after switching', untranslated.filter((k) => STRINGS.xh[k] !== STRINGS.en[k]).length === 0, untranslated.join(','));
  await page.reload({ waitUntil: 'load' });
  check('language choice is remembered', await page.evaluate(() => document.documentElement.lang === 'xh'));
  await page.click('#lang-desktop [data-lang="en"]');
  check('back to English', await page.evaluate((t) => document.querySelector('h1').textContent === t, STRINGS.en['hero.title']));

  // Dark mode
  await page.click('[data-theme-toggle]');
  let dark = await page.evaluate(() => ({ cls: document.documentElement.classList.contains('dark'), bg: getComputedStyle(document.body).backgroundColor, card: getComputedStyle(document.querySelector('#what .card')).backgroundColor, pressed: document.querySelector('[data-theme-toggle]').getAttribute('aria-pressed') }));
  check('dark mode toggle gives a deep navy page with solid dark cards', dark.cls && dark.bg === 'rgb(8, 18, 38)' && dark.card === 'rgb(19, 35, 74)' && dark.pressed === 'true', JSON.stringify(dark));
  await page.reload({ waitUntil: 'load' });
  check('dark mode choice is remembered', await page.evaluate(() => document.documentElement.classList.contains('dark')));
  await page.click('[data-theme-toggle]');
  check('toggle back to light', await page.evaluate(() => !document.documentElement.classList.contains('dark')));

  // Industry tabs
  const tabs = await page.$$eval('#industry-tabs [role="tab"]', (els) => els.map((e) => e.id));
  let tabsOk = tabs.length === 8;
  for (const id of tabs) {
    await page.click(`#${id}`);
    const visible = await page.$$eval('#industries [role="tabpanel"]', (els) => els.filter((e) => !e.hidden).map((e) => e.id));
    if (visible.length !== 1 || visible[0] !== id.replace('tab', 'panel')) tabsOk = false;
  }
  check('8 industry tabs, each shows only its own example', tabsOk, tabs.join(','));
  await page.focus('#ind-tab-auto');
  await page.keyboard.press('ArrowRight');
  check('tabs work with arrow keys', await page.evaluate(() => document.activeElement.id === 'ind-tab-dentists' && !document.querySelector('#ind-panel-dentists').hidden));

  // FAQ accordion
  const h = (n) => page.evaluate((i) => document.getElementById(`faq-a-${i}`).getBoundingClientRect().height, n);
  let faqOk = (await page.locator('.faq-item').count()) === 7 && (await h(1)) > 30;
  for (let n = 2; n <= 7; n += 1) {
    const closed = await h(n);
    await page.click(`#faq-q-${n}`);
    await page.waitForTimeout(420);
    if (!(closed < 2 && (await h(n)) > 30 && (await page.getAttribute(`#faq-q-${n}`, 'aria-expanded')) === 'true')) faqOk = false;
  }
  await page.click('#faq-q-1');
  await page.waitForTimeout(420);
  check('7 FAQ questions open and close', faqOk && (await h(1)) < 2);

  // Map
  await page.locator('#contact').scrollIntoViewIfNeeded();
  await page.waitForFunction(() => window.__frontDeskMap && document.querySelectorAll('#map .map-pin').length === 6, null, { timeout: 15000 }).catch(() => {});
  const pins = await page.locator('#map .map-pin').count();
  check('map loads with 6 city markers', pins === 6, pins);
  await page.waitForTimeout(1500);
  const tiles = await page.evaluate(() => Array.from(document.querySelectorAll('#map img.leaflet-tile')).filter((i) => i.complete && i.naturalWidth > 0).length);
  check('OpenStreetMap tiles load', tiles > 0, `${tiles} tiles (needs internet access to tile.openstreetmap.org)`);
  let popupsOk = true;
  for (const city of ['Johannesburg', 'Pretoria', 'Durban', 'Gqeberha', 'Bloemfontein', 'Cape Town']) {
    await page.evaluate((name) => window.__frontDeskMap.openCity(name), city);
    await page.waitForTimeout(250);
    const text = await page.locator('.leaflet-popup-content').innerText();
    const expected = city === 'Cape Town' ? 'Home base.' : 'Businesses in this area onboard remotely, usually within a week.';
    if (!text.includes(city) || !text.includes(expected)) { popupsOk = false; console.log('      popup', city, text); }
  }
  check('each marker opens a popup with the city name and the onboarding line', popupsOk);
  await page.evaluate(() => window.__frontDeskMap.map.closePopup());
  await page.locator('#map .map-pin').nth(1).click({ force: true });
  await page.waitForTimeout(400);
  check('clicking a marker opens its popup', (await page.locator('.leaflet-popup-content').count()) === 1 && /Johannesburg/.test(await page.locator('.leaflet-popup-content').innerText()));
  const wheel = await page.evaluate(() => window.__frontDeskMap.map.scrollWheelZoom.enabled());
  check('map does not trap page scrolling (wheel zoom off)', wheel === false);
  await page.click('[data-theme-toggle]');
  check('map switches to dark tiles in dark mode', (await page.evaluate(() => getComputedStyle(document.querySelector('#map .leaflet-tile-pane')).filter)).includes('invert'));
  await page.click('[data-theme-toggle]');

  // Contact cards
  const contact = await page.evaluate(() => ({
    mail: document.querySelector('#contact a[data-mailto]').getAttribute('href'),
    tel: document.querySelector('#contact a[data-tel]').getAttribute('href'),
    wa: document.querySelector('#contact a[data-wa]').getAttribute('href'),
    maps: document.querySelector('#contact a[data-maps]').getAttribute('href'),
    tags: document.querySelectorAll('#contact .ph-tag:not([hidden])').length,
    brandIcons: document.querySelectorAll('#contact svg[fill="#EA4335"], #contact svg[fill="#25D366"], #contact svg[fill="#4285F4"]').length,
  }));
  check('contact cards: Gmail, phone, WhatsApp and Google Maps links with brand icons, marked PLACEHOLDER', contact.mail === 'mailto:hello@example.com' && contact.tel === 'tel:+27000000000' && contact.wa.startsWith('https://wa.me/27000000000?text=') && /google\.com\/maps/.test(contact.maps) && contact.tags === 3 && contact.brandIcons === 3, JSON.stringify(contact));

  // Demo request form
  await page.locator('#demo').scrollIntoViewIfNeeded();
  await page.click('#demo-form button[type="submit"]');
  let errs = await page.$$eval('#demo-form .field-error', (els) => els.filter((e) => !e.hidden).map((e) => e.textContent));
  check('empty form shows 5 errors and does not submit', errs.length === 5 && (await page.evaluate(() => window.__opened.length)) === 0 && (await page.evaluate(() => document.activeElement.id)) === 'demo-name', errs.join(' / '));
  await page.fill('#demo-name', 'Thandi Mokoena');
  await page.fill('#demo-business', 'Mokoena Dental');
  await page.selectOption('#demo-type', { index: 1 });
  await page.fill('#demo-phone', '12345');
  await page.fill('#demo-email', 'thandi@practice');
  await page.click('#demo-form button[type="submit"]');
  errs = await page.$$eval('#demo-form .field-error', (els) => els.filter((e) => !e.hidden).map((e) => e.id));
  check('bad phone and email are rejected', errs.join(',') === 'error-phone,error-email', errs.join(','));
  await page.fill('#demo-phone', '082 123 4567');
  await page.fill('#demo-email', 'thandi@practice.co.za');
  await page.click('#demo-form button[type="submit"]');
  const sent = await page.evaluate(() => ({ form: document.getElementById('demo-form').hidden, ok: !document.getElementById('demo-success').hidden, url: window.__opened[0] || '', focus: document.activeElement.id }));
  const message = decodeURIComponent((sent.url.split('?text=')[1] || ''));
  check('valid form shows the success message and opens WhatsApp with the details', sent.form && sent.ok && sent.focus === 'demo-success' && sent.url.startsWith('https://wa.me/27000000000?text=') && ['Your name: Thandi Mokoena', 'Business name: Mokoena Dental', 'Business type: Dental practice', 'Phone number: 082 123 4567', 'Email: thandi@practice.co.za'].every((line) => message.includes(line)), message);
  await page.click('#success-edit');
  check('"Change my details" returns to the form', await page.evaluate(() => !document.getElementById('demo-form').hidden && document.getElementById('demo-name').value === 'Thandi Mokoena'));

  // Live voice demo (mock provider)
  await page.locator('#try').scrollIntoViewIfNeeded();
  await page.waitForSelector('#demo-box[data-state="live"]', { timeout: 8000 });
  check('demo shows the microphone when the backend is configured', await page.isVisible('#mic-button') && !(await page.isVisible('#samples')));
  check('page says no real booking is made and shows the 3 minute timer', /No real booking is made/.test(await page.innerText('#demo-box')) && (await page.textContent('#mic-timer')) === '3:00');
  await page.click('#mic-button');
  await page.waitForSelector('#mic-button[data-state="live"]', { timeout: 10000 });
  await page.waitForFunction(() => document.querySelectorAll('#transcript li').length >= 5, null, { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(600);
  const live = await page.evaluate(() => ({ lines: Array.from(document.querySelectorAll('#transcript li')).filter((li) => !li.hidden).map((li) => li.innerText.replace(/\n+/g, ': ')), timer: document.getElementById('mic-timer').textContent, status: document.getElementById('mic-status').textContent, label: document.getElementById('mic-caption').textContent }));
  check('live call: greeting, caller transcript, calendar check and reply all show on screen', live.lines.length >= 5 && /Milkwood Dental/.test(live.lines[0]) && live.lines.some((l) => /^YOU: Can I book a cleaning/i.test(l)) && live.lines.some((l) => /Checking the demo calendar/.test(l)) && live.lines.some((l) => /half past eight/.test(l)), live.lines.join(' || '));
  check('timer counts down and the button becomes "End call"', /^2:5\d$/.test(live.timer) && live.label === 'End call' && /on a call/.test(live.status), JSON.stringify(live));
  check('caller audio reached the provider with the short-lived secret only', A.mock.state.connections.at(-1).via === 'client-secret' && A.mock.state.connections.at(-1).heardAudio >= 12);
  check('the demo calendar tool ran on the server', A.mock.state.toolOutputs.at(-1)?.ok === true && Array.isArray(A.mock.state.toolOutputs.at(-1).slots));
  await page.click('#mic-button');
  await page.waitForSelector('#mic-button[data-state="idle"]');
  await page.waitForTimeout(400);
  const health = await (await page.request.get(`${A.url}api/health`)).json();
  check('ending the call frees the session on the server', /Call ended/.test(await page.textContent('#mic-status')) && health.demo.activeSessions === 0, JSON.stringify(health.demo));

  // Phone test (mock Twilio)
  check('phone test is shown with the demo number when Twilio is configured', await page.isVisible('#phone-test') && (await page.textContent('#dial-number')) === '+27 21 555 0100' && (await page.getAttribute('#dial-link', 'href')) === 'tel:+27215550100');
  await page.fill('#call-phone', '123');
  await page.click('#call-form button[type="submit"]');
  check('call-me rejects a bad number', /Enter a South African number/.test(await page.textContent('#call-status')) && A.mock.state.twilioCalls.length === 0);
  await page.fill('#call-phone', '082 555 0142');
  await page.click('#call-form button[type="submit"]');
  await page.waitForFunction(() => /Calling you now/.test(document.getElementById('call-status').textContent), null, { timeout: 5000 }).catch(() => {});
  check('call-me places the call', /Calling you now/.test(await page.textContent('#call-status')) && A.mock.state.twilioCalls[0]?.form.To === '+27825550142', await page.textContent('#call-status'));
  await page.click('#call-form button[type="submit"]');
  await page.waitForFunction(() => /already had a test call/.test(document.getElementById('call-status').textContent), null, { timeout: 5000 }).catch(() => {});
  check('a second call to the same number within the hour is refused', /already had a test call/.test(await page.textContent('#call-status')) && A.mock.state.twilioCalls.length === 1);

  // Scroll animation finishes for everything
  for (let y = 0; y < 14000; y += 500) { await page.evaluate((v) => window.scrollTo(0, v), y); await page.waitForTimeout(50); }
  await page.waitForTimeout(900);
  check('every fade-in element becomes visible', (await page.evaluate(() => Array.from(document.querySelectorAll('[data-reveal]')).filter((e) => !e.closest('[hidden]') && !e.classList.contains('is-visible')).length)) === 0);
  check('no JavaScript errors (desktop)', errors.length === 0, errors.join(' | '));
  await ctx.close();
}

/* ============================== 3 minute cap (shortened to 4 seconds here) ============================== */
{
  const C = await boot({ DEMO_MAX_SECONDS: '4' });
  const { ctx, page } = await open(browser, C.url, { permissions: ['microphone'] });
  await page.locator('#try').scrollIntoViewIfNeeded();
  await page.waitForSelector('#demo-box[data-state="live"]');
  await page.click('#mic-button');
  await page.waitForSelector('#mic-button[data-state="live"]', { timeout: 10000 });
  await page.waitForSelector('#mic-button[data-state="idle"]', { timeout: 9000 }).catch(() => {});
  await page.waitForTimeout(300);
  const health = await (await page.request.get(`${C.url}api/health`)).json();
  check('the session ends by itself at the time cap', /Time is up/.test(await page.textContent('#mic-status')) && (await page.textContent('#mic-timer')) === '0:00' && health.demo.activeSessions === 0, await page.textContent('#mic-status'));
  await ctx.close();
  await C.stop();
}

/* ============================== failure states ============================== */
{
  // Microphone permission refused: clear message, and no demo session is used up.
  const before = A.mock.state.tokens.length;
  const { ctx, page } = await open(strictBrowser, A.url);
  await ctx.clearPermissions();
  await page.locator('#try').scrollIntoViewIfNeeded();
  await page.waitForSelector('#demo-box[data-state="live"]');
  await page.click('#mic-button');
  await page.waitForFunction(() => document.getElementById('mic-button').dataset.state === 'idle' && /microphone/i.test(document.getElementById('mic-status').textContent), null, { timeout: 8000 }).catch(() => {});
  check('refused or missing microphone shows a clear message and uses no session', /microphone/i.test(await page.textContent('#mic-status')) && A.mock.state.tokens.length === before, await page.textContent('#mic-status'));
  await ctx.close();
}
{
  // Session limit reached
  const D = await boot({ DEMO_MAX_CONCURRENT: '1' });
  const hold = await fetch(`${D.url}api/demo/session`, { method: 'POST' });
  const { ctx, page } = await open(browser, D.url, { permissions: ['microphone'] });
  await page.locator('#try').scrollIntoViewIfNeeded();
  await page.waitForSelector('#demo-box[data-state="live"]');
  await page.click('#mic-button');
  await page.waitForFunction(() => /busy/i.test(document.getElementById('mic-status').textContent), null, { timeout: 8000 }).catch(() => {});
  check('session limit reached shows "all demo lines are busy"', hold.ok && /All demo lines are busy/.test(await page.textContent('#mic-status')), await page.textContent('#mic-status'));
  await ctx.close();
  await D.stop();
}
{
  // Network drop in the middle of a call
  const E = await boot();
  const { ctx, page } = await open(browser, E.url, { permissions: ['microphone'] });
  await page.locator('#try').scrollIntoViewIfNeeded();
  await page.waitForSelector('#demo-box[data-state="live"]');
  await page.click('#mic-button');
  await page.waitForSelector('#mic-button[data-state="live"]', { timeout: 10000 });
  await E.mock.close();
  await page.waitForSelector('#mic-button[data-state="idle"]', { timeout: 8000 }).catch(() => {});
  check('a dropped connection ends the call with a clear message', /connection dropped/i.test(await page.textContent('#mic-status')), await page.textContent('#mic-status'));
  await ctx.close();
  await E.app.close();
}
{
  // No API key: "unavailable" notice plus playable sample calls; phone test hidden
  const B = await boot({ XAI_API_KEY: '' });
  const { ctx, page, errors } = await open(browser, B.url);
  await page.locator('#try').scrollIntoViewIfNeeded();
  await page.waitForSelector('#demo-box[data-state="off"]', { timeout: 8000 });
  check('no API key: "live demo unavailable" notice, sample calls shown, phone test hidden', /live demo is unavailable/i.test(await page.innerText('#demo-box')) && (await page.locator('.sample').count()) === 3 && !(await page.isVisible('#mic-button')) && !(await page.isVisible('#phone-test')));
  await page.click('.sample >> nth=1 >> .sample-play');
  await page.waitForTimeout(1800);
  let audio = await page.evaluate(() => { const a = document.getElementById('sample-audio'); return { src: a.getAttribute('src'), t: a.currentTime, paused: a.paused, pressed: document.querySelectorAll('.sample-play')[1].getAttribute('aria-pressed') }; });
  check('sample call plays', audio.src === 'audio/sample-call-salon.mp3' && audio.t > 0.8 && !audio.paused && audio.pressed === 'true', JSON.stringify(audio));
  await page.click('.sample >> nth=1 >> .sample-play');
  await page.waitForTimeout(200);
  audio = await page.evaluate(() => document.getElementById('sample-audio').paused);
  check('sample call pauses', audio === true);
  check('no JavaScript errors (fallback state)', errors.length === 0, errors.join(' | '));
  await ctx.close();
  await B.stop();
}
{
  // No backend at all (for example the static files on their own): same graceful fallback
  const http = await import('node:http');
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.woff2': 'font/woff2', '.mp3': 'audio/mpeg', '.png': 'image/png' };
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
  check('on a static host with no backend the demo falls back to sample calls', (await page.getAttribute('#demo-box', 'data-state')) === 'off' && (await page.locator('.sample').count()) === 3 && !(await page.isVisible('#phone-test')));
  await ctx.close();
  plain.close();
  plain.closeAllConnections?.();
}

/* ============================== system dark preference, phone and tablet ============================== */
{
  const { ctx, page } = await open(browser, A.url, { colorScheme: 'dark' });
  check('first visit follows the system dark setting', await page.evaluate(() => document.documentElement.classList.contains('dark')));
  await ctx.close();
}
{
  const { ctx, page, errors } = await open(browser, A.url, { viewport: { width: 375, height: 740 }, hasTouch: true, isMobile: true });
  check('phone: menu is closed, desktop links hidden', !(await page.isVisible('#mobile-menu')) && !(await page.isVisible('header nav[aria-label="Main"]')));
  await page.tap('#menu-toggle');
  check('phone: menu opens', await page.isVisible('#mobile-menu') && (await page.getAttribute('#menu-toggle', 'aria-expanded')) === 'true');
  await page.tap('#lang-mobile [data-lang="af"]');
  check('phone: language switcher in the menu works', await page.evaluate(() => document.documentElement.lang === 'af'));
  await page.tap('#lang-mobile [data-lang="en"]');
  await page.tap('#mobile-menu >> text="Pricing"');
  await page.waitForTimeout(1300);
  check('phone: menu link closes the menu and scrolls', !(await page.isVisible('#mobile-menu')) && await inView(page, '#pricing'));
  await page.tap('#menu-toggle');
  await page.keyboard.press('Escape');
  check('phone: Escape closes the menu', !(await page.isVisible('#mobile-menu')));
  await page.tap('[data-theme-toggle]');
  check('phone: dark mode toggle works', await page.evaluate(() => document.documentElement.classList.contains('dark')));
  await page.tap('[data-theme-toggle]');
  const small = await page.evaluate(() => Array.from(document.querySelectorAll('a.btn, button, [role="tab"]')).filter((e) => e.offsetParent !== null).map((e) => ({ t: (e.textContent || e.getAttribute('aria-label') || '').trim().slice(0, 20), h: Math.round(e.getBoundingClientRect().height), w: Math.round(e.getBoundingClientRect().width) })).filter((x) => x.h < 36 || x.w < 36));
  check('phone: buttons are big enough to tap', small.length === 0, JSON.stringify(small));
  await page.locator('#contact').scrollIntoViewIfNeeded();
  await page.waitForFunction(() => window.__frontDeskMap, null, { timeout: 15000 }).catch(() => {});
  const touchMap = await page.evaluate(() => ({ drag: window.__frontDeskMap.map.dragging.enabled(), action: getComputedStyle(document.getElementById('map')).touchAction }));
  check('phone: one finger scrolls the page past the map', touchMap.drag === false && !/none/.test(touchMap.action), JSON.stringify(touchMap));
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

/* ============================== accessibility (axe-core, WCAG 2 A and AA) ============================== */
const axeSource = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
for (const [name, options] of [['light desktop', { colorScheme: 'light' }], ['dark desktop', { colorScheme: 'dark' }], ['light phone', { colorScheme: 'light', viewport: { width: 375, height: 800 } }], ['dark phone', { colorScheme: 'dark', viewport: { width: 375, height: 800 } }]]) {
  const { ctx, page } = await open(browser, A.url, { reducedMotion: 'reduce', ...options });
  await page.locator('#contact').scrollIntoViewIfNeeded();
  await page.waitForTimeout(1200);
  await page.addScriptTag({ content: axeSource });
  const result = await page.evaluate(async () => { const r = await window.axe.run(document, { runOnly: ['wcag2a', 'wcag2aa'] }); return r.violations.map((v) => `${v.id} (${v.nodes.length}): ${v.nodes.slice(0, 2).map((n) => `${n.target.join(' ')} ${(n.any[0] || n.all[0] || {}).message || ''}`).join(' ; ')}`); });
  check(`accessibility scan, ${name}: 0 violations`, result.length === 0, result.join(' || '));
  await ctx.close();
}
{
  const { ctx, page } = await open(browser, A.url);
  await page.keyboard.press('Tab');
  const first = await page.evaluate(() => ({ text: document.activeElement.textContent, outline: getComputedStyle(document.activeElement).outlineStyle }));
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  const third = await page.evaluate(() => ({ tag: document.activeElement.tagName, outline: getComputedStyle(document.activeElement).outlineWidth }));
  check('keyboard: skip link first, then visible focus rings', first.text === 'Skip to content' && third.tag === 'A' && third.outline !== '0px', JSON.stringify({ first, third }));
  await ctx.close();
}

await A.stop();
await browser.close();
await strictBrowser.close();
console.log(failures ? `\n${failures} FAILED` : '\nALL PASSED');
process.exit(failures ? 1 : 0);
