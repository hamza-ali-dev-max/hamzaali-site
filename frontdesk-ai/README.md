# Front Desk AI

The website for Front Desk AI, an AI receptionist for small businesses in South Africa. Version 2, rebuilt from the research in `RESEARCH.md`.

It has two parts:

1. **The website** (`web/`): a landing page in English and Afrikaans that shows one real call from ring to WhatsApp, with dark mode, recorded sample calls, a live demo, a calculator, pricing and a free-trial form.
2. **The backend** (`server/`): a small Node server that runs the live voice demo. It talks to the xAI Grok voice API and to Twilio. The xAI key lives only here.

## What changed in v2, and why

| v1 | v2 | Why (see RESEARCH.md) |
|---|---|---|
| "AI receptionist" that replaces a salary | "When you can't pick up, we answer": after hours and overflow, alongside your people | In live SA call data about half of calls still needed a person |
| Three static hero cards on a sky photo | One real recorded call that plays itself: captions, the diary slot filling, WhatsApp to the client and to the owner | The owner's complaint; Goodcall shows the pattern works |
| Scripted text-to-speech samples | Real recordings of the demo receptionist (Grok voice), captions timed to the audio | Proof beats claims; no SA competitor shows real calls |
| English, Afrikaans, isiXhosa | English. Afrikaans "in testing". isiXhosa and isiZulu: take a message or transfer | No voice system tested supports them well; see Languages below |
| One plan, R1,999 plus R2,500 setup | After Hours R999, Front Desk R1,999, multi-branch from R3,999. No setup fee. 14-day free trial | Self-serve rivals charge no setup fee and offer trials |
| "One recovered booking a month pays for it" | "R67 a day. One extra booking a week pays for it." | The old line was false for salons, physios and dentists |
| WhatsApp to the owner | WhatsApp to the owner and the client | SA runs on WhatsApp; it beats the "unknown number" problem |
| "POPIA compliant" badge | An honest FAQ answer: where calls are processed, the operator agreement, deletion on request | Calls go through providers outside SA |
| Map, stock photos, icon cards, sky blue | Warm paper palette, real artefacts (transcript, diary, WhatsApp), handwritten notes | Template tells; sky and blue are taken by others |
| One demo receptionist (dentist) | Four: dentist, hair salon, physio, plumber, with message and transfer tools | Visitors test their own kind of business |

## What is in the box

```
frontdesk-ai/
  RESEARCH.md           The research report and the plan this version follows.
  web/
    page.mjs            The page layout. Words come from src/i18n.js, calls from src/calls.json.
    src/i18n.js         EVERY word on the page, in English and Afrikaans. Edit copy here.
    src/calls.json      The three recorded calls: who said what, when, and what was booked.
    src/stage.js        The hero "call stage" that plays a recorded call step by step.
    src/recordings.js   The recorded-calls player with captions that follow the audio.
    src/whatsapp.js     Turns a call into the WhatsApp messages the owner and client get.
    src/voice.js        The live voice client (microphone in, speech out, transcript).
    src/main.js         Language, dark mode, menu, tabs, FAQ, calculator, forms, demo states.
    src/styles.css      Colours, type, the stage, artefacts. Light and dark themes.
    public/audio/       call-dentist.mp3, call-salon.mp3, call-plumber.mp3 (the recordings).
    public/site-config.js   Contact details, VAT line, Google Analytics ID. PLACEHOLDERS live here.
  server/
    index.js            Routes: health check, demo sessions, tools, Twilio webhooks, static files.
    agent.js            The four demo receptionists: persona, facts, rules, tools.
    calendar.js         The in-memory demo diary, messages and transfers. Nothing is saved.
    config.js           Reads all settings from environment variables.
    limits.js           Rate limiting and logging.
    phone.js            Twilio: call-me, call-in, media stream bridge, signature checks.
    providers/          Voice providers. xai.js today; index.js is where others plug in.
  scripts/build.mjs     Builds the website into web/dist.
  scripts/og-image.mjs  Makes the share image.
  tests/                Backend tests, browser tests, live tests, and mock xAI and Twilio servers.
  Dockerfile, docker-compose.yml, Caddyfile, railway.json, netlify.toml, vercel.json
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

Open http://localhost:8787. Without a key the site still works: the live demo says it isn't switched on yet, and the recorded calls still play.

## The recorded calls

The hero and the "Real calls, recorded" player use three real calls to the demo receptionist (Grok Voice 3.0, voice "eve"), recorded on 13 November 2026:

- **Dentist**: a cracked tooth at 19:02 on a Tuesday. It checks the diary and books 08:00 the next morning.
- **Salon**: a price question and a Saturday booking while both stylists are busy.
- **Plumber**: a burst geyser on a Sunday night. It takes the name and number, then puts the caller through to the owner.

The caller voices are generated (ElevenLabs, South African voices). The receptionist's side is exactly what Grok said, including one real slip: it heard "Mokoena" as "Mokwena". The page says the businesses and callers are made up.

To replace them with real calls from a pilot client, save the new MP3 over the file in `web/public/audio/` and update the matching entry in `web/src/calls.json`: each line has `who`, `text` and `t` (the second it starts), and each event has its type and time. The hero stage and the captions follow those times.

## How the live demo works

1. The page asks the backend `GET /api/health` what is set up.
2. The visitor picks a business (dentist, salon, physio, plumber) and presses the microphone button. The browser asks for the microphone first.
3. The backend (`POST /api/demo/session`) asks xAI for a short-lived client secret and sends it to the browser with that business's session settings. The real key never leaves the server.
4. The browser connects straight to `wss://api.x.ai/v1/realtime?model=grok-voice-3.0`, sends `session.update`, and streams PCM16 audio at 24 kHz. The transcript shows on screen.
5. Tool calls (check the diary, book, take a message, transfer) go to the backend (`POST /api/demo/tool`), which runs them on that session's demo diary and returns what the owner would get on WhatsApp.
6. When the call ends, the page shows that WhatsApp summary. Calls end after 3 minutes. The backend logs duration and cost.

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

The page promises English only, and says Afrikaans is in testing. That is deliberate.

- **English** works well. Grok Voice 3.0 tops the independent Artificial Analysis speech ranking (RESEARCH.md, thread 4).
- **Afrikaans**: xAI does not list it as supported. In our test on 13 November 2026 (a generated Afrikaans caller booking a cleaning), Grok understood the caller and booked correctly in Afrikaans, but drifted into Dutch ("Goeiemorgen", "Donderdagochtend"), first said the wrong date, and heard "Botha" as "Boota". Test it with real Afrikaans callers before promising it.
- **isiXhosa and isiZulu**: no mainstream voice system handles them well yet (best recognition gets 20 to 34% of isiXhosa words wrong). The receptionist is told to offer a message or a transfer instead.

Before any language goes on the page, make 20 or more real calls with native speakers on Vodacom and MTN, including names, places, numbers, rand amounts and mid-sentence switching.

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

A later option from the research: xAI now accepts phone calls directly over SIP, which would let a Twilio SIP trunk replace the media-stream bridge in `server/phone.js` and lower the per-minute cost. Not built yet, because it cannot be tested without a Twilio account.

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
| WhatsApp number (trial requests go here) | `web/public/site-config.js` | `+27 00 000 0000` |
| VAT line under the prices | `web/public/site-config.js` (`vatNote`) | empty (nothing shown) |
| Google Analytics ID | `web/public/site-config.js` | `G-XXXXXXXXXX` |
| Domain | `SITE_URL` build setting | `https://frontdeskai.co.za` |
| Search Console code | `GOOGLE_SITE_VERIFICATION` build setting | `PLACEHOLDER_GOOGLE_SITE_VERIFICATION` |
| Demo phone number | comes from `TWILIO_PHONE_NUMBER` | hidden until set |
| Phone and email in the structured data | `web/page.mjs` (the `ld` block) | same placeholders |

The red PLACEHOLDER tags on the page disappear by themselves once a value in `site-config.js` is replaced.

## Being found on Google

Already in place: title and description, one H1, semantic sections, `sitemap.xml`, `robots.txt`, JSON-LD for LocalBusiness and the FAQ, Open Graph and Twitter cards with a share image, self-hosted fonts, no heavy images.

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

16 backend tests: health check, key handling, ephemeral secrets, the four businesses, message and transfer tools, rate limits, concurrency, the demo diary, Twilio signatures, the phone bridge and the time cap.

```bash
npm run build && npm run test:e2e
```

About 100 browser checks: the copy in both languages, the hero stage (autoplay, pause, sound, sync), recordings, every link, tab, accordion and form, the calculator, the live demo and each failure state, reduced motion, no JavaScript, nine screen widths, and an accessibility scan in light and dark. Both suites use mock xAI and Twilio servers (`tests/mocks.mjs`), so they need no keys and cost nothing.

`tests/live-demo.mjs` runs the microphone demo against the real xAI API with a recorded caller. `tests/live-site.mjs` smoke-tests a deployed copy.

## Credits

- Fonts: Bricolage Grotesque, Inter and Caveat (SIL Open Font Licence), served from this site.
- Icons: Lucide (ISC) and Simple Icons (CC0) for the WhatsApp and Gmail marks.
- Caller voices in the recordings: ElevenLabs. Receptionist voice: xAI Grok Voice 3.0.
- CSS: Tailwind CSS (MIT).
