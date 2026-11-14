// Screenshots of each section at several widths, plus overflow and console-error checks.
// Usage: node tests/shoot.mjs http://localhost:8787 375,768,1280 [light|dark]
import { createRequire } from 'node:module';

const { chromium } = createRequire(import.meta.url)('playwright');
const [base = 'http://localhost:8787', widthsArg = '375,768,1280', mode = 'light'] = process.argv.slice(2);
const browser = await chromium.launch({ proxy: process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY, bypass: 'localhost,127.0.0.1' } : undefined });

for (const width of widthsArg.split(',').map(Number)) {
  const ctx = await browser.newContext({ viewport: { width, height: width < 700 ? 800 : 900 }, reducedMotion: 'reduce', colorScheme: mode === 'dark' ? 'dark' : 'light' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(`pageerror ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`console ${m.text().slice(0, 140)}`); });
  await page.goto(base, { waitUntil: 'load' });
  await page.waitForTimeout(1200);
  const o = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, h: document.documentElement.scrollHeight }));
  console.log(`w=${width} ${mode} height=${o.h} ${o.sw > o.cw ? `HORIZONTAL OVERFLOW ${o.sw}` : 'no overflow'} ${errors.join(' | ')}`);
  await page.addStyleTag({ content: '#site-header{position:absolute!important}' });
  await page.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 80)); }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(1500);
  const sections = await page.$$('main > section, footer');
  let i = 0;
  for (const s of sections) {
    i += 1;
    const id = (await s.getAttribute('id')) || (i === 1 ? 'hero' : 'footer');
    await s.screenshot({ path: `tests/artifacts/${mode}-${width}-${String(i).padStart(2, '0')}-${id}.png` });
  }
  await ctx.close();
}
await browser.close();
