// Smoke test of a deployed copy of the website. Usage: node tests/live-site.mjs https://your-site/
// Checks the things a visitor would touch, at desktop and phone size. It expects whatever
// demo state the site is in (live microphone, or the sample-call fallback) to be working.
import { createRequire } from 'node:module';

const { chromium, devices } = createRequire(import.meta.url)('playwright');
const url = process.argv[2];
if (!url) { console.error('usage: node tests/live-site.mjs <url>'); process.exit(2); }

let failures = 0;
const check = (name, ok, detail = '') => { if (!ok) failures += 1; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail && !ok ? `  [${String(detail).slice(0, 240)}]` : ''}`); };
const browser = await chromium.launch({ proxy: process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY, bypass: 'localhost,127.0.0.1' } : undefined, args: ['--autoplay-policy=no-user-gesture-required'] });

for (const [label, options] of [['desktop', { viewport: { width: 1366, height: 850 } }], ['phone', { ...devices['iPhone 13'] }]]) {
  const ctx = await browser.newContext(options);
  await ctx.addInitScript(() => { window.__opened = []; window.open = (u) => { window.__opened.push(u); return null; }; });
  const page = await ctx.newPage();
  const errors = [];
  const failed = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('response', (r) => { if (r.status() >= 400 && !/\/api\/health/.test(r.url())) failed.push(`${r.status()} ${r.url()}`); });
  const started = Date.now();
  const response = await page.goto(url, { waitUntil: 'load' });
  check(`${label}: page loads over HTTPS`, response.ok() && page.url().startsWith('https://'), `${response.status()} ${page.url()}`);
  console.log(`      load time ${Date.now() - started} ms`);
  check(`${label}: headline is visible and styled`, await page.isVisible('h1') && (await page.evaluate(() => getComputedStyle(document.querySelector('h1')).fontFamily)).includes('Poppins'));
  check(`${label}: no sideways scroll`, await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth));

  if (label === 'phone') {
    await page.tap('#menu-toggle');
    check('phone: menu opens', await page.isVisible('#mobile-menu'));
    await page.tap('#lang-mobile [data-lang="af"]');
    check('phone: Afrikaans switch works', (await page.textContent('h1')).startsWith('Die KI-ontvangsdame'));
    await page.tap('#lang-mobile [data-lang="xh"]');
    check('phone: isiXhosa switch works', (await page.textContent('h1')).startsWith('Umamkeli we-AI'));
    await page.tap('#lang-mobile [data-lang="en"]');
    await page.tap('#mobile-menu >> text="FAQ"');
    await page.waitForTimeout(1500);
    check('phone: menu link scrolls to the FAQ', await page.evaluate(() => { const r = document.querySelector('#faq').getBoundingClientRect(); return r.top > -5 && r.top < window.innerHeight * 0.7; }));
  } else {
    await page.click('#lang-desktop [data-lang="af"]');
    check('desktop: Afrikaans switch works', (await page.textContent('h1')).startsWith('Die KI-ontvangsdame'));
    await page.click('#lang-desktop [data-lang="en"]');
    await page.click('header nav >> text="Pricing"');
    await page.waitForTimeout(1500);
    check('desktop: nav link scrolls to pricing', await page.evaluate(() => { const r = document.querySelector('#pricing').getBoundingClientRect(); return r.top > -5 && r.top < window.innerHeight * 0.7; }));
  }

  await page.click('[data-theme-toggle]');
  check(`${label}: dark mode toggles`, await page.evaluate(() => document.documentElement.classList.contains('dark') && getComputedStyle(document.body).backgroundColor === 'rgb(8, 18, 38)'));
  await page.click('[data-theme-toggle]');

  await page.click('#ind-tab-vets');
  check(`${label}: industry tabs switch`, await page.evaluate(() => !document.querySelector('#ind-panel-vets').hidden && document.querySelector('#ind-panel-dentists').hidden));
  await page.click('#faq-q-3');
  await page.waitForTimeout(450);
  check(`${label}: FAQ opens`, (await page.evaluate(() => document.getElementById('faq-a-3').getBoundingClientRect().height)) > 30);

  await page.locator('#try').scrollIntoViewIfNeeded();
  await page.waitForFunction(() => document.getElementById('demo-box').dataset.state !== 'checking', null, { timeout: 12000 }).catch(() => {});
  const state = await page.getAttribute('#demo-box', 'data-state');
  if (state === 'off') {
    await page.click('.sample >> nth=0 >> .sample-play');
    await page.waitForTimeout(2500);
    const t = await page.evaluate(() => document.getElementById('sample-audio').currentTime);
    check(`${label}: demo fallback shows and a sample call plays`, t > 0.8, `currentTime ${t}`);
    await page.click('.sample >> nth=0 >> .sample-play');
  } else {
    check(`${label}: live microphone demo is offered`, state === 'live' && await page.isVisible('#mic-button'), state);
  }

  await page.locator('#contact').scrollIntoViewIfNeeded();
  await page.waitForFunction(() => document.querySelectorAll('#map .map-pin').length === 6, null, { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(2000);
  const map = await page.evaluate(() => ({ pins: document.querySelectorAll('#map .map-pin').length, tiles: Array.from(document.querySelectorAll('#map img.leaflet-tile')).filter((i) => i.complete && i.naturalWidth > 0).length }));
  check(`${label}: map shows 6 markers on real map tiles`, map.pins === 6 && map.tiles > 0, JSON.stringify(map));
  await page.evaluate(() => window.__frontDeskMap.openCity('Durban'));
  await page.waitForTimeout(300);
  check(`${label}: a marker popup opens`, /Durban/.test(await page.locator('.leaflet-popup-content').innerText()));

  await page.locator('#demo').scrollIntoViewIfNeeded();
  await page.click('#demo-form button[type="submit"]');
  check(`${label}: form refuses empty details`, (await page.$$eval('#demo-form .field-error', (els) => els.filter((e) => !e.hidden).length)) === 5);
  await page.fill('#demo-name', 'Live Test');
  await page.fill('#demo-business', 'Test Salon');
  await page.selectOption('#demo-type', { index: 3 });
  await page.fill('#demo-phone', '082 123 4567');
  await page.fill('#demo-email', 'test@example.co.za');
  await page.click('#demo-form button[type="submit"]');
  const opened = await page.evaluate(() => window.__opened[0] || '');
  check(`${label}: form confirms and opens WhatsApp with the details`, await page.isVisible('#demo-success') && opened.startsWith('https://wa.me/') && decodeURIComponent(opened).includes('Test Salon'), opened.slice(0, 80));

  check(`${label}: no failed files and no script errors`, failed.length === 0 && errors.length === 0, [...failed, ...errors].join(' | '));
  await page.screenshot({ path: `tests/artifacts/live-${label}.png` });
  await ctx.close();
}
await browser.close();
console.log(failures ? `\n${failures} FAILED` : '\nALL PASSED');
process.exit(failures ? 1 : 0);
