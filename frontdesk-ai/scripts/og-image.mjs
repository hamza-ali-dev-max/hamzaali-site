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
const bars = Array.from({ length: 30 }, (_, i) => `<i style="height:${Math.round(18 + 30 * Math.abs(Math.sin(i * 1.7)) + 10 * Math.abs(Math.cos(i * 0.6)))}%"></i>`).join('');

const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
@font-face { font-family: I; font-weight: 100 900; src: url(${font('inter-latin-wght-normal.woff2')}); }
* { box-sizing: border-box; margin: 0; }
body { width: 1200px; height: 630px; font-family: I, sans-serif; color: #F5F7FA; overflow: hidden; position: relative;
  background: radial-gradient(900px 480px at 90% -10%, rgba(45,212,191,.22), transparent 60%), radial-gradient(rgba(255,255,255,.07) 1px, transparent 1px) 0 0 / 22px 22px, #0A0F1C; }
.left { position: absolute; left: 64px; top: 60px; width: 560px; }
.logo { display: flex; align-items: center; gap: 14px; font-weight: 700; font-size: 28px; letter-spacing: -.02em; }
.mark { width: 46px; height: 46px; border-radius: 13px; background: #0F766E; display: flex; align-items: center; justify-content: center; }
.kicker { margin-top: 54px; display: inline-flex; gap: 10px; align-items: center; font-size: 19px; color: #A9B4C7; border: 1px solid #22304A; border-radius: 99px; padding: 8px 16px; }
.kicker b { width: 8px; height: 8px; border-radius: 99px; background: #2DD4BF; }
h1 { margin-top: 22px; font-weight: 700; font-size: 74px; line-height: 1.02; letter-spacing: -.045em; color: #fff; }
.sub { margin-top: 22px; font-size: 24px; line-height: 1.4; color: #A9B4C7; }
.card { position: absolute; right: 64px; top: 72px; width: 450px; border-radius: 28px; background: #111A2C; border: 1px solid #22304A; padding: 26px; box-shadow: 0 30px 60px -20px rgba(0,0,0,.7); }
.head { display: flex; align-items: center; gap: 14px; }
.av { width: 50px; height: 50px; border-radius: 99px; background: #2DD4BF; display: flex; align-items: center; justify-content: center; }
.k { font-size: 14px; font-weight: 600; letter-spacing: .08em; color: #A9B4C7; }
.n { font-size: 22px; font-weight: 600; color: #fff; }
.wave { margin-top: 22px; height: 52px; display: flex; align-items: center; gap: 4px; }
.wave i { flex: 1; border-radius: 9px; background: #2DD4BF; }
.who { margin-top: 20px; font-size: 14px; font-weight: 600; letter-spacing: .08em; color: #2DD4BF; }
.cap { margin-top: 6px; font-size: 23px; line-height: 1.3; font-weight: 500; color: #fff; }
.toast { position: absolute; right: 40px; bottom: 44px; width: 380px; background: #fff; color: #0A0F1C; border-radius: 20px; padding: 16px; display: flex; gap: 12px; box-shadow: 0 24px 48px -16px rgba(0,0,0,.6); }
.toast span { font-size: 13px; font-weight: 600; letter-spacing: .08em; color: #5B6679; }
.toast p { margin-top: 6px; background: #D9FDD3; color: #0B2A1A; border-radius: 14px; padding: 10px 12px; font-size: 17px; line-height: 1.35; }
.wa { width: 36px; height: 36px; flex: none; border-radius: 99px; background: #E7F9EE; display: flex; align-items: center; justify-content: center; }
</style></head><body>
<div class="left">
  <div class="logo"><span class="mark"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2a9 9 0 0 1 9 9"/><path d="M13 6a5 5 0 0 1 5 5"/><path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"/></svg></span>Front Desk AI</div>
  <p class="kicker"><b></b>AI receptionist for South African businesses</p>
  <h1>When you can't pick up, we answer.</h1>
  <p class="sub">It books the client and WhatsApps you every call.</p>
</div>
<div class="card">
  <div class="head"><span class="av"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#04201D" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"/></svg></span><div><p class="k">BOOKED · TUESDAY 19:02</p><p class="n">Milkwood Dental</p></div></div>
  <div class="wave">${bars}</div>
  <p class="who">FRONT DESK AI</p>
  <p class="cap">You're all set, Aisha. Wednesday at eight with Dr Naidoo.</p>
</div>
<div class="toast"><span class="wa"><svg width="18" height="18" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg></span><div><span>TO YOU</span><p>New booking: Aisha Jacobs, cracked tooth. Wed 18 Nov at 08:00.</p></div></div>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.setContent(html, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: path.join(web, 'public', 'og-image.png') });
await browser.close();
console.log('wrote web/public/og-image.png');
