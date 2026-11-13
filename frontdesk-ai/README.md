# Front Desk AI

The website for Front Desk AI, an AI receptionist for small businesses in South Africa.

It has two parts:

1. **The website** (`web/`): a landing page in English, Afrikaans and isiXhosa, with dark mode, a map, a demo request form and SEO set up.
2. **The backend** (`server/`): a small Node server that runs the live voice demo. It talks to the xAI Grok voice API and to Twilio. The xAI key lives only here.

## What is in the box

```
frontdesk-ai/
  web/
    page.mjs            The page layout (all 13 sections). Words come from src/i18n.js.
    src/i18n.js         EVERY word on the page, in English, Afrikaans and isiXhosa. Edit copy here.
    src/main.js         Language switcher, dark mode, menu, tabs, FAQ, forms, demo screen.
    src/voice.js        The live voice client (microphone in, speech out, transcript).
    src/map.js          The Leaflet map (loads only when you scroll to it).
    src/styles.css      Colours, cards, buttons. Light and dark themes.
    public/             Photos, fonts, sample recordings, share image, site-config.js.
    public/site-config.js   Contact details and Google Analytics ID. PLACEHOLDERS live here.
    dist/               The built website (made by "npm run build", not committed).
  server/
    index.js            Routes: health check, demo sessions, tools, Twilio webhooks, static files.
    config.js           Reads all settings from environment variables.
    agent.js            The demo receptionist: persona, facts, tools.
    calendar.js         The in-memory demo calendar. Sample data only, nothing is saved.
    limits.js           Rate limiting and logging.
    phone.js            Twilio: call-me, call-in, media stream bridge, signature checks.
    providers/xai.js    The xAI Grok voice provider.
    providers/index.js  Where a new voice provider (Retell, Bland, Vapi) plugs in.
  scripts/build.mjs     Builds the website.
  scripts/og-image.mjs  Makes the share image.
  tests/                Backend tests, browser tests, and mock xAI and Twilio servers.
  Dockerfile, docker-compose.yml, Caddyfile     One-container hosting.
  railway.json, netlify.toml, vercel.json       Hosted deploys.
  .env.example          Every setting, explained.
```

## Run it on your computer

You need Node 20.12 or newer.

```bash
cd frontdesk-ai
```

```bash
npm install
```

```bash
cp .env.example .env
```

Open `.env` and paste your xAI key after `XAI_API_KEY=`. Then:

```bash
npm run dev
```

Open http://localhost:8787. That one command builds the website and starts the backend, which serves both.

Without a key the site still works. The demo section shows "live demo unavailable" and plays the sample calls.

## How the live demo works

1. The page asks the backend `GET /api/health` what is set up.
2. The visitor presses the microphone button. The browser asks for the microphone first.
3. The backend (`POST /api/demo/session`) asks xAI for a short-lived client secret and sends it to the browser with the session settings. The real key never leaves the server.
4. The browser connects straight to `wss://api.x.ai/v1/realtime?model=grok-voice-latest` with that secret, sends `session.update`, and streams PCM16 audio at 24 kHz. The transcript shows on screen.
5. When the receptionist wants to check or book, the browser passes the tool call to the backend (`POST /api/demo/tool`), which runs it on the demo calendar.
6. The call ends when the visitor ends it or after 3 minutes. The backend logs the duration and the cost.

Checked against the xAI docs on 13 November 2026. Two things differ from older write-ups: audio is set under `session.audio.input.format` and `session.audio.output.format` (for example `{ "type": "audio/pcm", "rate": 24000 }`), and phone audio can use `audio/pcmu` directly, so Twilio audio needs no conversion.

### Guardrails that keep the bill small

| Guard | Default | Setting |
|---|---|---|
| Longest call | 3 minutes | `DEMO_MAX_SECONDS` |
| Calls at the same time | 3 | `DEMO_MAX_CONCURRENT` |
| Browser calls per visitor per hour | 5 | `DEMO_SESSIONS_PER_IP_PER_HOUR` |
| Browser calls per day, all visitors | 200 | `DEMO_SESSIONS_PER_DAY` |
| Phone test calls per number per hour | 1 | `PHONE_CALLS_PER_NUMBER_PER_HOUR` |

Grok voice costs about $0.08 per minute, so a full 3 minute demo is about $0.24. Every session writes one log line, for example:

```
{"event":"demo_session_end","sessionId":"...","reason":"user","seconds":49,"voiceUsd":0.0653,"bookings":1}
```

One honest limit: in the browser demo the audio goes straight from the visitor to xAI, so the 3 minute cap is enforced by the page and by the token lifetime (4 minutes), not by cutting a wire. The per-visitor, per-day and concurrency limits are what protect the bill. Phone calls are cut off by the server itself.

The limits are kept in memory, which is right for one server. If you ever run several copies, move them to Redis.

### Languages: read this

The page promises English, Afrikaans and isiXhosa. The xAI docs list 20 officially supported languages and **Afrikaans and isiXhosa are not on that list**. The docs say the model "is also capable of conversing in additional languages, with varying degrees of accuracy". In my live test it answered correctly in Afrikaans. isiXhosa is untested. Test both with native speakers before you sell on that promise.

### Changing the voice provider later

The backend never mentions xAI outside `server/providers/xai.js`. To add Retell, Bland or Vapi:

1. Copy `server/providers/xai.js` to a new file and make it return the same three things (`configured`, `createBrowserSession`, `connectServerSession`).
2. Register it in `server/providers/index.js`.
3. Set `VOICE_PROVIDER` to its name.

The page chooses its connection code by the `protocol` field the backend returns. A provider that speaks the OpenAI Realtime protocol needs no website change. A provider with its own browser SDK needs one small adapter in `web/src/voice.js`. Buttons, timer, transcript and translations stay as they are.

## Phone call testing (Twilio)

Two ways for a visitor to test with a real phone:

- **Call-me**: they type their number, the backend asks Twilio to ring them.
- **Call-in**: they dial the Twilio number shown on the page.

Either way Twilio opens a Media Stream to `wss://YOUR-BACKEND/api/twilio/stream`, and the backend bridges it to the same receptionist, tools and demo calendar. The backend checks Twilio's signature on every webhook, allows one test call per number per hour, cuts every call at 3 minutes, and logs duration and cost.

Set it up:

1. In `.env` (or Railway variables) fill in `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` and `PUBLIC_URL` (the backend's https address).
2. In the Twilio console open your number, and under "A call comes in" set Webhook, `POST`, `https://YOUR-BACKEND/api/twilio/voice`.
3. Under "Call status changes" set `https://YOUR-BACKEND/api/twilio/status`.

If any of those four settings is missing, the phone test hides itself and the microphone demo carries on.

**Trial accounts**: a Twilio trial account can only call numbers you have verified in the Twilio console, and it plays a trial message first. Upgrade the account before strangers test with their own numbers. Until then the call-me form tells them to use the microphone or dial in.

A South African Twilio number needs a local business address and documents, and approval takes time. Start that early.

## Going live

### Option A: Netlify (or Vercel) for the website, Railway for the backend

**1. Backend on Railway** (about $5 a month)

1. Go to https://railway.com, sign in with GitHub, New Project, Deploy from GitHub repo, pick this repo.
2. In the service Settings set **Root Directory** to `frontdesk-ai`. Railway reads `railway.json` and builds the `Dockerfile`.
3. In Variables paste: `XAI_API_KEY`, `ALLOWED_ORIGINS` (your website address, for example `https://frontdeskai.co.za,https://www.frontdeskai.co.za`), and later the Twilio values.
4. In Settings, Networking, press Generate Domain. Copy the address, for example `https://frontdesk-api.up.railway.app`.
5. Add the variable `PUBLIC_URL` with that address.
6. Open `https://YOUR-RAILWAY-ADDRESS/api/health`. You should see `"voice":{"provider":"xai","configured":true}`.

**2. Website on Netlify** (free)

1. Go to https://app.netlify.com, Add new site, Import an existing project, pick this repo.
2. Set **Base directory** to `frontdesk-ai`. The build command and publish folder come from `netlify.toml`.
3. In Site configuration, Environment variables, add `PUBLIC_API_BASE` with your Railway address, `SITE_URL` with your domain, and later `GOOGLE_SITE_VERIFICATION`.
4. Deploy. Netlify gives you an address like `https://your-site.netlify.app`.

Vercel works the same way: import the repo, set Root Directory to `frontdesk-ai`, add the same variables. `vercel.json` holds the rest.

**3. Connect the .co.za domain** (`frontdeskai.co.za` is a PLACEHOLDER until you register it)

1. Register the domain at a .co.za registrar (for example domains.co.za, Afrihost or xneelo).
2. In Netlify: Domain management, Add a domain, type `frontdeskai.co.za`.
3. At your registrar, add these DNS records:

| Type | Name | Value |
|---|---|---|
| A | `@` | `75.2.60.5` (Netlify's load balancer, confirm the value Netlify shows you) |
| CNAME | `www` | `your-site.netlify.app` |

4. Wait for DNS to spread (minutes to a few hours). Netlify then issues the HTTPS certificate by itself. Press "Verify DNS configuration" if it does not.
5. Optional: give the backend a nice name too. In Railway, Settings, Networking, Custom Domain, add `api.frontdeskai.co.za`, then add the CNAME record Railway shows you. Update `PUBLIC_URL`, `PUBLIC_API_BASE` and the Twilio webhooks to match.

For Vercel the records are `A @ 76.76.21.21` and `CNAME www cname.vercel-dns.com` (confirm in the Vercel dashboard).

### Option B: everything in one Docker container on a VPS (for example Hetzner)

1. Create a small VPS (2 GB is plenty), install Docker.
2. Point DNS at it: `A @ YOUR-SERVER-IP` and `A www YOUR-SERVER-IP`.
3. Copy this folder to the server, then:

```bash
cp .env.example .env
```

4. Fill in `.env` (at least `XAI_API_KEY`, and `PUBLIC_URL=https://frontdeskai.co.za` if you use Twilio). Add `SITE_DOMAIN=frontdeskai.co.za` to it.

```bash
docker compose up -d --build
```

Caddy gets the HTTPS certificate automatically. The container serves the website and the backend together, so `PUBLIC_API_BASE` and `ALLOWED_ORIGINS` stay empty.

To use Nginx instead of Caddy, proxy everything to port 8787 and pass WebSocket upgrades for `/api/twilio/stream`.

### Option C: one command on your own computer

```bash
npm run dev
```

To let Twilio reach your computer for phone tests, run a tunnel such as `ngrok http 8787` and use its address as `PUBLIC_URL`.

## Placeholders to replace

| What | Where | Now |
|---|---|---|
| Contact email | `web/public/site-config.js` | `hello@example.com` |
| Contact phone | `web/public/site-config.js` | `+27 00 000 0000` |
| WhatsApp number (demo requests go here) | `web/public/site-config.js` | `+27 00 000 0000` |
| Google Maps link | `web/public/site-config.js` | Cape Town search link |
| Google Analytics ID | `web/public/site-config.js` | `G-XXXXXXXXXX` |
| Domain | `SITE_URL` build setting | `https://frontdeskai.co.za` |
| Search Console code | `GOOGLE_SITE_VERIFICATION` build setting | `PLACEHOLDER_GOOGLE_SITE_VERIFICATION` |
| Demo phone number | comes from `TWILIO_PHONE_NUMBER` | hidden until set |
| Sample recordings | `web/public/audio/*.mp3` | scripted placeholder calls |
| Phone and email in the structured data | `web/page.mjs` (the `ld` block) | same placeholders |

The red PLACEHOLDER tags on the page disappear by themselves once a value in `site-config.js` is replaced.

## Being found on Google

Already in place: title and description, one H1, semantic sections, `sitemap.xml`, `robots.txt`, JSON-LD for LocalBusiness and the FAQ, Open Graph and Twitter cards with a share image, self-hosted fonts, lazy-loaded WebP photos with alt text.

What you need to finish once the site is on its own domain:

1. Go to https://search.google.com/search-console and add a property, type "URL prefix", `https://frontdeskai.co.za`.
2. Choose the "HTML tag" method. Copy only the code inside `content="..."`.
3. Set it as `GOOGLE_SITE_VERIFICATION` on Netlify or Vercel and redeploy. Press Verify in Search Console.
4. In Search Console open Sitemaps and submit `https://frontdeskai.co.za/sitemap.xml`.
5. Open URL inspection, paste the home page address, and press Request indexing.
6. For Analytics: create a GA4 property at https://analytics.google.com, copy the Measurement ID (looks like `G-AB12CD34EF`) into `googleAnalyticsId` in `site-config.js`. Analytics does not load at all until that ID is real.
7. Create a free Google Business Profile for Front Desk AI in Cape Town. For local searches this matters as much as the website.

## Tests

```bash
npm test
```

14 backend tests: health check, key handling, ephemeral secrets, rate limits, concurrency, the demo calendar, Twilio signatures, the phone bridge and the time cap.

```bash
npm run build && npm run test:e2e
```

91 browser checks: every link, tab, accordion, form and switch, all three languages, dark mode, the map, the live demo and each failure state, nine screen widths, and an accessibility scan in light and dark. Both suites use mock xAI and Twilio servers (`tests/mocks.mjs`), so they need no keys and cost nothing.

`tests/live-demo.mjs` runs the microphone demo against the real xAI API with a recorded caller. It needs a running server with a real key.

## Credits

- Photos: Unsplash (free licence). Photo IDs: sky `1517483000871-1dbf64a6e1c6`, hills `1601134467661-3d775b999c8b`, dental room `1629909615184-74f495363b67`, salon `1521590832167-7bcbfaa6381f`, reception `1519494026892-80bbd2d6fd0d`, bedroom `1631049307264-da0ec9d70304`.
- Icons: Lucide (ISC) and Simple Icons (CC0) for the WhatsApp, Gmail and Google Maps marks.
- Map: Leaflet (BSD) with OpenStreetMap tiles and data, © OpenStreetMap contributors. The public OSM tile server is fine for a small site. If traffic grows, switch to a paid tile host.
- Fonts: Poppins and Nunito Sans (SIL Open Font Licence), served from this site.
- CSS: Tailwind CSS (MIT).
