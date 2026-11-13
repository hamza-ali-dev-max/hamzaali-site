// Smoke test of a deployed copy of the website. Usage: node tests/live-site.mjs https://your-site/
// Checks what a visitor would touch, at desktop and phone size, in whatever demo state the
// site is in (live microphone, or the notice with recorded calls).
import { createRequire } from 'node:module';

const { chromium, devices } = createRequire(import.meta.url)('playwright');
const url = process.argv[2];
if (!url) { console.error('usage: node tests/live-site.mjs <url>'); process.exit(2); }

let failures = 0;
const check = (name, ok, detail = '') => { if (!ok) failures += 1; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail && !ok ? `  [${String(detail).slice(0, 240)}]` : ''}`); };
const browser = await chromium.launch({ proxy: process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY, bypass: 'localhost,127.0.0.1' } : undefined, args: ['--autoplay-policy=no-user-gesture-required'] });
const inView = (page, s) => page.evaluate((sel) => { const r = document.querySelector(sel).getBoundingClientRect(); return r.top > -5 && r.top < window.innerHeight * 0.75; }, s);

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
  check(`${label}: headline visible in Inter`, await page.isVisible('h1') && (await page.evaluate(() => getComputedStyle(document.querySelector('h1')).fontFamily)).includes('Inter'));
  check(`${label}: no sideways scroll`, await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth));

  // The hero scene plays by itself, and plays the real recording on request
  await page.locator('#stage').scrollIntoViewIfNeeded();
  await page.waitForTimeout(3500);
  const s = await page.evaluate(() => ({ ...window.__frontDesk.stage().state(), words: document.querySelectorAll('#stage .caption-text .w:not(.is-hidden)').length }));
  check(`${label}: the hero call plays by itself and the caption types out`, s.playing && s.pos > 1 && s.words > 0, JSON.stringify(s));
  await page.click('#stage [data-stage-sound]');
  await page.waitForTimeout(2500);
  const audio = await page.evaluate(() => { const a = document.getElementById('stage-audio'); return { t: a.currentTime, paused: a.paused }; });
  check(`${label}: "Play with sound" plays the real recording`, audio.t > 1 && !audio.paused, JSON.stringify(audio));
  await page.click('[data-stage-toggle]');

  // Language and theme
  if (label === 'phone') {
    await page.tap('#menu-toggle');
    await page.tap('#lang-mobile [data-lang="af"]');
  } else {
    await page.click('#lang-desktop [data-lang="af"]');
  }
  check(`${label}: Afrikaans switch works`, (await page.textContent('h1')).startsWith('Kan jy nie optel nie'));
  if (label === 'phone') { await page.tap('#lang-mobile [data-lang="en"]'); await page.tap('#menu-toggle'); } else await page.click('#lang-desktop [data-lang="en"]');
  await page.click('[data-theme-toggle]');
  check(`${label}: dark mode toggles`, await page.evaluate(() => document.documentElement.classList.contains('dark')));
  await page.click('[data-theme-toggle]');

  // Timeline, recorded calls, FAQ
  await page.locator('[data-timeline]').scrollIntoViewIfNeeded();
  await page.waitForTimeout(6500);
  check(`${label}: the ring-to-booked timeline plays`, (await page.$$eval('.tl-node.is-on', (els) => els.length)) === 5);
  await page.locator('.rec-card[data-rec="plumber"]').scrollIntoViewIfNeeded();
  await page.click('.rec-card[data-rec="plumber"] .rec-play');
  await page.waitForTimeout(2500);
  check(`${label}: a recorded call plays and its waveform fills`, await page.evaluate(() => !document.getElementById('rec-audio').paused && document.getElementById('rec-audio').currentTime > 1 && document.querySelectorAll('.rec-card[data-rec="plumber"] .rec-bars i.is-played').length > 0));
  await page.click('.rec-card[data-rec="plumber"] .rec-play');
  await page.click('#faq-q-4');
  await page.waitForTimeout(450);
  check(`${label}: FAQ opens`, (await page.evaluate(() => document.getElementById('faq-a-4').getBoundingClientRect().height)) > 30);

  // Demo state
  await page.locator('#try').scrollIntoViewIfNeeded();
  await page.waitForFunction(() => document.getElementById('demo-box').dataset.state !== 'checking', null, { timeout: 12000 }).catch(() => {});
  const state = await page.getAttribute('#demo-box', 'data-state');
  check(`${label}: the demo shows a clear state (live or notice)`, state === 'live' || state === 'off', state);

  // Trial form
  await page.click('#pricing [data-plan="After Hours"]');
  await page.waitForTimeout(1300);
  check(`${label}: a pricing button goes to the trial form`, await inView(page, '#start'));
  await page.click('#start-form button[type="submit"]');
  check(`${label}: form refuses empty details`, (await page.$$eval('#start-form .field-error', (els) => els.filter((e) => !e.hidden).length)) === 4);
  await page.fill('#start-name', 'Live Test');
  await page.fill('#start-business', 'Test Salon');
  await page.selectOption('#start-type', '3');
  await page.fill('#start-phone', '082 123 4567');
  await page.click('#start-form button[type="submit"]');
  const opened = await page.evaluate(() => window.__opened[0] || '');
  check(`${label}: form confirms and opens WhatsApp with the details`, await page.isVisible('#start-success') && decodeURIComponent(opened).includes('Test Salon') && decodeURIComponent(opened).includes('Plan: After Hours'), opened.slice(0, 80));

  check(`${label}: no failed files and no script errors`, failed.length === 0 && errors.length === 0, [...failed, ...errors].join(' | '));
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  await page.screenshot({ path: `tests/artifacts/live-${label}.png` });
  await ctx.close();
}
await browser.close();
console.log(failures ? `\n${failures} FAILED` : '\nALL PASSED');
process.exit(failures ? 1 : 0);
