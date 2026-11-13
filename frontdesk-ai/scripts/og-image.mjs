// Makes the share image (web/public/og-image.png, 1200 x 630) shown when the site is
// posted on WhatsApp, Facebook, LinkedIn or X. Run with: node scripts/og-image.mjs
// The finished PNG is committed, so this only needs running again if the look changes.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const { chromium } = createRequire(import.meta.url)('playwright');
const web = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'web');
const font = (file) => `data:font/woff2;base64,${fs.readFileSync(path.join(web, 'public', 'fonts', file)).toString('base64')}`;

const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
@font-face { font-family: B; font-weight: 200 800; src: url(${font('bricolage-grotesque-latin-opsz-normal.woff2')}); }
@font-face { font-family: I; font-weight: 100 900; src: url(${font('inter-latin-wght-normal.woff2')}); }
@font-face { font-family: H; font-weight: 600; src: url(${font('caveat-latin-600-normal.woff2')}); }
* { box-sizing: border-box; margin: 0; }
body { width: 1200px; height: 630px; background: #F5EFE3; color: #1C1814; font-family: I, sans-serif; position: relative; overflow: hidden; }
.left { position: absolute; left: 64px; top: 58px; width: 560px; }
.logo { display: flex; align-items: center; gap: 14px; font: 800 30px B; }
.mark { width: 48px; height: 48px; border-radius: 12px; background: #B8431B; display: flex; align-items: center; justify-content: center; }
.kicker { margin-top: 46px; font: 700 18px I; letter-spacing: .12em; text-transform: uppercase; color: #0F5552; }
h1 { margin-top: 14px; font: 800 82px/0.96 B; letter-spacing: -0.035em; }
.sub { margin-top: 24px; font: 500 24px/1.4 I; color: #3E362D; }
.card { position: absolute; right: 64px; top: 70px; width: 470px; border: 3px solid #1C1814; border-radius: 26px; background: #FFFCF6; box-shadow: 10px 10px 0 #1C1814; padding: 22px; }
.top { display: flex; justify-content: space-between; font: 600 17px I; color: #5F564B; }
.top b { color: #1C1814; }
.pill { background: #ECE3D2; color: #1C1814; border-radius: 99px; padding: 4px 12px; font-weight: 700; }
.b { margin-top: 14px; padding: 12px 16px; border-radius: 18px; font: 500 19px/1.35 I; max-width: 88%; }
.ai { background: #ECE3D2; border-top-left-radius: 6px; }
.you { background: #1C1814; color: #F5EFE3; margin-left: auto; border-top-right-radius: 6px; }
.slot { margin-top: 16px; display: flex; gap: 12px; align-items: center; font: 600 18px I; color: #5F564B; }
.slot span { flex: 1; background: #0F5552; color: #fff; border-radius: 10px; padding: 8px 12px; font-weight: 700; }
.wa { margin-top: 14px; background: #EFE7DD; border-radius: 16px; padding: 10px; }
.wa p { background: #D9FDD3; color: #10261A; border-radius: 12px; padding: 10px 12px; font: 500 17px/1.35 I; }
.note { position: absolute; right: 120px; bottom: 26px; font: 600 34px H; color: #B8431B; transform: rotate(-3deg); }
</style></head><body>
<div class="left">
  <div class="logo"><span class="mark"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2a9 9 0 0 1 9 9"/><path d="M13 6a5 5 0 0 1 5 5"/><path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"/></svg></span>Front Desk AI</div>
  <p class="kicker">AI receptionist for South African businesses</p>
  <h1>When you can't pick up, we answer.</h1>
  <p class="sub">It books the client and sends you every call on WhatsApp.</p>
</div>
<div class="card">
  <div class="top"><span><b>Tuesday 19:02</b> · Milkwood Dental</span><span class="pill">Booked</span></div>
  <p class="b ai">Good evening, Milkwood Dental. I'm the practice's AI assistant.</p>
  <p class="b you">Can someone see me tomorrow morning?</p>
  <div class="slot">08:00<span>Aisha Jacobs · cracked tooth</span></div>
  <div class="wa"><p>New booking: Aisha Jacobs. Wed 18 Nov at 08:00 with Dr Naidoo.</p></div>
</div>
<p class="note">from a real call</p>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.setContent(html, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: path.join(web, 'public', 'og-image.png') });
await browser.close();
console.log('wrote web/public/og-image.png');
