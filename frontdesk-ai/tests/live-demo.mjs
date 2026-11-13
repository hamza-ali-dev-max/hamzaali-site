// Live end-to-end check of the microphone demo against the REAL voice provider.
// A recorded caller plays into a fake microphone; the browser talks to xAI with the
// short-lived token from the backend. Needs a server running with XAI_API_KEY set.
// Usage: node tests/live-demo.mjs http://localhost:8787 tests/artifacts/caller.wav 45
import path from 'node:path';
import { createRequire } from 'node:module';

const { chromium } = createRequire(import.meta.url)('playwright');
const [base = 'http://localhost:8787', wav = 'tests/artifacts/caller.wav', seconds = '45'] = process.argv.slice(2);

const browser = await chromium.launch({
  proxy: process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY, bypass: 'localhost,127.0.0.1' } : undefined,
  args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', `--use-file-for-fake-audio-capture=${path.resolve(wav)}%noloop`, '--autoplay-policy=no-user-gesture-required'],
});
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, permissions: ['microphone'] });
const page = await ctx.newPage();
const errors = [];
const sockets = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); });
page.on('websocket', (ws) => {
  const entry = { url: ws.url(), sent: {}, received: {} };
  sockets.push(entry);
  ws.on('framesent', (f) => { try { const t = JSON.parse(f.payload).type; entry.sent[t] = (entry.sent[t] || 0) + 1; } catch { /* binary */ } });
  ws.on('framereceived', (f) => { try { const t = JSON.parse(f.payload).type; entry.received[t] = (entry.received[t] || 0) + 1; } catch { /* binary */ } });
  ws.on('close', () => { entry.closed = true; });
});

await page.goto(base, { waitUntil: 'load' });
await page.locator('#try').scrollIntoViewIfNeeded();
await page.waitForSelector('#demo-box[data-state="live"]', { timeout: 10000 });
const pageSource = await page.content();
console.log('API key in page source:', /xai-[A-Za-z0-9]{20,}/.test(pageSource) ? 'YES (BAD)' : 'no');
await page.click('#mic-button');
await page.waitForSelector('#mic-button[data-state="live"]', { timeout: 20000 });
console.log('connected. status:', await page.textContent('#mic-status'));
await page.waitForTimeout(Number(seconds) * 1000);
console.log('timer:', await page.textContent('#mic-timer'));
await page.screenshot({ path: 'tests/artifacts/live-demo.png' });
const lines = await page.$$eval('#transcript li', (items) => items.filter((li) => !li.hidden).map((li) => li.innerText.replace(/\n+/g, ' | ')));
await page.click('#mic-button');
await page.waitForSelector('#mic-button[data-state="idle"]', { timeout: 5000 });
console.log('after end. status:', await page.textContent('#mic-status'));
console.log('--- transcript ---');
lines.forEach((l) => console.log(l));
console.log('--- websocket ---');
for (const s of sockets) console.log(s.url.replace(/\?.*/, ''), '\n sent', JSON.stringify(s.sent), '\n received', JSON.stringify(s.received), '\n closed', Boolean(s.closed));
console.log('errors:', errors.length ? errors : 'none');
await browser.close();
