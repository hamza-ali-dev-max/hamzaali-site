// Makes the share image (web/public/og-image.png, 1200 x 630) shown when the site is
// posted on WhatsApp, Facebook, LinkedIn or X. Run with: node scripts/og-image.mjs
// Needs Playwright with Chromium available. The finished PNG is committed, so this only
// has to be run again if the headline or look changes.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const { chromium } = createRequire(import.meta.url)('playwright');
const web = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'web');
const data = (file, type) => `data:${type};base64,${fs.readFileSync(path.join(web, 'public', file)).toString('base64')}`;

const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
@font-face { font-family: Poppins; font-weight: 800; src: url(${data('fonts/poppins-latin-800-normal.woff2', 'font/woff2')}); }
@font-face { font-family: Poppins; font-weight: 700; src: url(${data('fonts/poppins-latin-700-normal.woff2', 'font/woff2')}); }
* { box-sizing: border-box; margin: 0; }
body { width: 1200px; height: 630px; font-family: Poppins, sans-serif; color: #fff; background: #1570EF url(${data('img/og-sky.jpg', 'image/jpeg')}) center bottom / cover; position: relative; overflow: hidden; }
.shade { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(10,92,232,.9) 0%, rgba(16,108,240,.72) 50%, rgba(30,136,255,.15) 100%); }
.inner { position: absolute; inset: 0; padding: 56px 64px; display: flex; flex-direction: column; }
.logo { display: flex; align-items: center; gap: 16px; background: #fff; color: #081226; border-radius: 999px; padding: 12px 28px 12px 12px; align-self: flex-start; font-weight: 700; font-size: 28px; box-shadow: 0 14px 34px -14px rgba(8,18,38,.5); }
.mark { width: 52px; height: 52px; border-radius: 50%; background: #1570EF; display: flex; align-items: center; justify-content: center; }
h1 { margin-top: 44px; font-weight: 800; font-size: 74px; line-height: 1.04; letter-spacing: -0.03em; max-width: 1040px; }
.row { margin-top: auto; display: flex; gap: 18px; }
.card { background: #fff; color: #081226; border-radius: 28px; padding: 18px 26px; font-weight: 700; font-size: 26px; box-shadow: 0 24px 48px -16px rgba(8,18,38,.45); }
.card:nth-child(1) { rotate: -2deg; } .card:nth-child(2) { rotate: 1.5deg; } .card:nth-child(3) { rotate: -1deg; }
</style></head><body><div class="shade"></div><div class="inner">
<div class="logo"><span class="mark"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"><path d="M3 20a1 1 0 0 1-1-1v-1a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v1a1 1 0 0 1-1 1Z"/><path d="M20 16a8 8 0 1 0-16 0"/><path d="M12 4v4"/><path d="M10 4h4"/></svg></span>Front Desk AI</div>
<h1>The AI receptionist that answers your phone and books your appointments.</h1>
<div class="row"><div class="card">Answers 24/7</div><div class="card">English, Afrikaans, isiXhosa</div><div class="card">R1,999 per month</div></div>
</div></body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.setContent(html, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: path.join(web, 'public', 'og-image.png') });
await browser.close();
console.log('wrote web/public/og-image.png');
