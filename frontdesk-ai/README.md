# Front Desk AI

The website for Front Desk AI, an AI receptionist for small businesses in South Africa. Version 5: a calm, modern look (one big headline, three cards that show a real booking, pill buttons, sky and hills backdrops), a natural South African voice, and a true-black night mode with stars.

It has two parts:

1. **The website** (`web/`): a landing page in English and Afrikaans. The hero plays a real call as it happens: the caption types out as each line is spoken, the waveform moves, the steps tick off, the diary slot fills and the WhatsApps slide in. Then an animated ring-to-booked timeline, four moving feature tiles, three real calls with waveforms, the live demo, pricing, five FAQs and a free-trial form. Dark mode throughout.
2. **The backend** (`server/`): a small Node server that runs the live voice demo. Grok (xAI) listens, thinks and books; ElevenLabs speaks with a South African voice. It also bridges Twilio phone calls. Every key lives only here.

## What changed in v5

The owner's note on v4 was "too much happening", so v5 keeps the v4 look and removes most of the movement and pieces:

- **Hero:** one centred headline and three cards (the call, the diary, the WhatsApp to you) instead of twelve floating chips. One thing moves at a time: the caption types, then the diary card turns lime with "08:00 Booked", then the WhatsApp arrives.
- **One accent colour** (lime). The blue, mint and coral chips are gone; coral is only the live dot and the end-call button.
- **No looping animations.** The scrolling strip of business types, the pulsing rings and the four animated tiles were removed. The timeline lights up once when scrolled to.
- **Fewer pieces per section:** four plain feature cards with one icon each, a single "works for" line, three call cards on the hills, straight pricing cards.

## What changed in v4 (superseded in part by v5)

| v3 | v4 | Why |
|---|---|---|
| Navy hero with one call card | Black hero where the call is told by floating chips: caller and receptionist speech bubbles that type as they speak, a waveform pill, a "08:00 booked" card, a "2 WhatsApps sent" pill, a ringing call button | Matches the reference designs (floating message-app widgets) |
| Teal and navy, Inter only | Lime, mint, sky blue and coral chips with black text; pill buttons and a floating pill nav; Outfit for headlines, Anton for the giant "RING TO BOOKED IN 36 SECONDS" | Reference designs |
| Plain sections | Call cards as white widgets on rolling grass hills, pricing cards floating in a cloud sky, a running strip of business types | Reference designs |
| Dark mode in navy | True black, with a moonlit starry night over the hills and a starry night sky behind pricing | Owner request |

The sky and hills are original images painted by `scripts/backdrops.py` (day and night versions, about 30 to 45 KB each). No stock photos.

## What changed in v3, and why

| v2 | v3 | Why |
|---|---|---|
| Grok's own voice ("eve") | Grok listens, decides and books; an ElevenLabs South African voice ("Claire", model `eleven_v4_turbo`) says the words | ElevenLabs v4 and v4 Turbo are #1 and #2 for naturalness on the Artificial Analysis TTS leaderboard (Nov 2026); Google's best (Gemini 3.8 Flash TTS) is #6. Turbo starts speaking in 0.2 to 0.5 seconds |
| Captions appear line by line | Captions type out word by word as they are spoken, with a moving waveform, four step chips, a diary slot that slides in and WhatsApp messages that pop up | "More moving animation to show how it books real time" |
| Long sections: lost-twice lanes, handover cards, industry tabs, calculator, 8 FAQs | Animated ring-to-booked timeline (real timings), four moving tiles, a "works for" row, 5 FAQs | "Too much text". About a third of the words |
| Warm paper palette, three fonts, handwritten notes | White and soft grey, navy ink, one teal, coral only for tiny highlights, Inter only, a deep navy hero | "Better colours, more modern, professional" |
| Recordings in tabs | Three cards with real waveforms you can scrub, and a live subtitle line | More show, less reading |

The v2 decisions (after-hours positioning, no setup fee, honest languages and POPIA answers) still stand. They came from `RESEARCH.md`.

## What is in the box

```
frontdesk-ai/
  RESEARCH.md           The research report and the plan this version follows.
  web/
    page.mjs            The page layout. Words come from src/i18n.js, calls from src/calls.json.
    src/i18n.js         EVERY word on the page, in English and Afrikaans. Edit copy here.
    src/calls.json      The three recorded calls: who said what, when, and what was booked.
    src/stage.js        The hero scene: plays a recorded call as it happened (typing caption, waveform, steps, diary, WhatsApps).
    src/recordings.js   The recorded-call cards: waveform that fills and seeks, subtitle that follows the audio.
    src/whatsapp.js     Turns a call into the WhatsApp messages the owner and client get.
    src/voice.js        The live voice client (microphone in, speech out, transcript). Two adapters: our relay, or straight to xAI.
    src/main.js         Language, dark mode, menu, timeline, FAQ, forms, demo states.
    src/styles.css      Colours, type, the scene, every animation. Light and dark themes.
    public/audio/       call-dentist.mp3, call-salon.mp3, call-plumber.mp3 (the recordings).
    public/site-config.js   Contact details, VAT line, Google Analytics ID. PLACEHOLDERS live here.
  server/
    index.js            Routes: health check, demo sessions, tools, Twilio webhooks, static files.
    agent.js            The four demo receptionists: persona, facts, rules, tools.
    calendar.js         The in-memory demo diary, messages and transfers. Nothing is saved.
    config.js           Reads all settings from environment variables.
    limits.js           Rate limiting and logging.
    phone.js            Twilio: call-me, call-in, media stream bridge, signature checks.
    relay.js            Grok's words cut into sentences and spoken by ElevenLabs, in order, cancelled when the caller talks.
    tts/elevenlabs.js   ElevenLabs streaming text to speech (PCM 24 kHz for browsers, mu-law 8 kHz for phones).
    providers/          Voice providers. xai.js today; index.js is where others plug in.
  scripts/build.mjs     Builds the website into web/dist.
  scripts/og-image.mjs  Makes the share image.
  scripts/backdrops.py  Paints the sky and hills backdrops, day and night (web/public/img).
  scripts/record-calls.mjs  Re-records the three sample calls from the real receptionist.
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

Open `.env` and paste your xAI key after `XAI_API_KEY=` and your ElevenLabs key after `ELEVENLABS_API_KEY=`. Without the ElevenLabs key the demo uses Grok's own voice. Then:

```bash
npm run dev
```

Open http://localhost:8787. Without a key the site still works: the live demo says it isn't switched on yet, and the recorded calls still play.

## The recorded calls

The hero and the "Hear real calls" cards use three real calls to the demo receptionist, recorded on 13 November 2026 with `scripts/record-calls.mjs`. Grok Voice 3.0 heard each caller and made every decision and diary booking for real; the receptionist's words are spoken by the same ElevenLabs voice the live demo uses.

- **Dentist**: a cracked tooth at 19:02 on a Tuesday. It checks the diary, offers the two earliest times and books 08:00 the next morning.
- **Salon**: a price question and a Saturday booking while both stylists are busy.
- **Plumber**: a burst geyser on a Sunday night. It asks for the name and number first, then puts the caller through to the owner.

The caller voices are generated (ElevenLabs South African voices Thandi, Nicole and Martin). The page says the businesses and callers are made up.

To re-record (after changing the voice or the instructions): `node scripts/record-calls.mjs` (needs `XAI_API_KEY`, `ELEVENLABS_API_KEY` and ffmpeg; a few US cents per call). To use real calls from a pilot client instead, save the MP3 over the file in `web/public/audio/` and update the matching entry in `web/src/calls.json`: each line has `who`, `text`, `t` (the second it starts) and `d` (how long it lasts), and each event has its type and time. The hero scene follows those times.

## How the live demo works

1. The page asks the backend `GET /api/health` what is set up.
2. The visitor picks a business (dentist, salon, physio, plumber) and presses the microphone button. The browser asks for the microphone first.
3. `POST /api/demo/session` starts a session for that business. What happens next depends on the voice:

**With an ElevenLabs key (the default once it is set): natural voice through our server**

4. The browser opens a WebSocket to our own server (`/api/demo/stream`, with a one-time token) and streams microphone audio (PCM16, 24 kHz).
5. The server holds the Grok session (`wss://api.x.ai/v1/realtime?model=grok-voice-3.0`). Grok listens, detects when the caller stops, decides what to say and calls the diary tools, which run on the server.
6. Grok's words arrive as text. The server cuts them into sentences and streams each one to ElevenLabs (`eleven_v4_turbo`, voice Claire). Sentences are fetched in parallel and played in order. When the caller talks over the receptionist, everything queued is cancelled at once.
7. The voice streams back to the browser, with the transcript and the WhatsApp events. Measured on 13 November 2026: the receptionist starts speaking about 1.3 to 1.9 seconds after the caller stops.

**Without it: Grok's own voice, straight from the browser**

4. The backend asks xAI for a short-lived client secret and sends it to the browser. The browser connects straight to xAI. Tool calls go to `POST /api/demo/tool`. Set `VOICE_TTS=native` to force this mode.

Either way, the real keys never leave the server. When the call ends, the page shows the owner's WhatsApp summary. Calls end after 3 minutes. The backend logs duration and cost.

### Guardrails that keep the bill small

| Guard | Default | Setting |
|---|---|---|
| Longest call | 3 minutes | `DEMO_MAX_SECONDS` |
| Calls at the same time | 3 | `DEMO_MAX_CONCURRENT` |
| Browser calls per visitor per hour | 5 | `DEMO_SESSIONS_PER_IP_PER_HOUR` |
| Browser calls per day, all visitors | 200 | `DEMO_SESSIONS_PER_DAY` |
| Phone test calls per number per hour | 1 | `PHONE_CALLS_PER_NUMBER_PER_HOUR` |

Grok voice costs about $0.08 per minute, so a full 3 minute demo is about $0.24. The ElevenLabs voice adds about $0.02 for a typical call (it is charged per character spoken, about 400 to 500 characters a call). Every session writes one log line, for example:

```
{"event":"demo_session_end","reason":"user","seconds":51,"voiceUsd":0.068,"ttsCharacters":514,"ttsUsd":0.0206,"firstAudioMs":[592,263,103],"bookings":1}
```

With the ElevenLabs voice the audio passes through the server, so the 3 minute cap cuts the session off for real. In native mode the audio goes straight from the visitor to xAI, so the cap is enforced by the page and by the token lifetime (4 minutes); the per-visitor, per-day and concurrency limits protect the bill. Phone calls are always cut off by the server.

The limits are kept in memory, which is right for one server. If you ever run several copies, move them to Redis.

### Languages: read this

The page promises English only, and says Afrikaans is in testing. That is deliberate.

- **English** works well. Grok Voice 3.0 tops the independent Artificial Analysis speech ranking (RESEARCH.md, thread 4), and ElevenLabs v4 Turbo speaks it with a South African accent.
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

With the ElevenLabs key set, phone calls use the same voice: ElevenLabs returns mu-law at 8 kHz, which goes to Twilio unchanged.

A South African Twilio number needs a local business address and documents, and approval takes time. Start that early.

A later option from the research: xAI now accepts phone calls directly over SIP, which would let a Twilio SIP trunk replace the media-stream bridge in `server/phone.js` and lower the per-minute cost. Not built yet, because it cannot be tested without a Twilio account.

## Going live

### Option A: Netlify (or Vercel) for the website, Railway for the backend

**1. Backend on Railway** (about $5 a month)

1. Go to https://railway.com, sign in with GitHub, New Project, Deploy from GitHub repo, pick this repo.
2. In the service Settings set **Root Directory** to `frontdesk-ai`. Railway reads `railway.json` and builds the `Dockerfile`.
3. In Variables paste: `XAI_API_KEY`, `ELEVENLABS_API_KEY`, `ALLOWED_ORIGINS` (your website address, for example `https://frontdeskai.co.za,https://www.frontdeskai.co.za`), and later the Twilio values.
4. In Settings, Networking, press Generate Domain. Copy the address, for example `https://frontdesk-api.up.railway.app`.
5. Add the variable `PUBLIC_URL` with that address.
6. Open `https://YOUR-RAILWAY-ADDRESS/api/health`. You should see `"configured":true` and `"speech":"elevenlabs"`.

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

4. Fill in `.env` (at least `XAI_API_KEY` and `ELEVENLABS_API_KEY`, and `PUBLIC_URL=https://frontdeskai.co.za` if you use Twilio). Add `SITE_DOMAIN=frontdeskai.co.za` to it.

```bash
docker compose up -d --build
```

Caddy gets the HTTPS certificate automatically. The container serves the website and the backend together, so `PUBLIC_API_BASE` and `ALLOWED_ORIGINS` stay empty.

To use Nginx instead of Caddy, proxy everything to port 8787 and pass WebSocket upgrades for `/api/demo/stream` and `/api/twilio/stream`.

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

20 backend tests: health check, key handling, ephemeral secrets, the four businesses, message and transfer tools (a transfer needs a name and number first), rate limits, concurrency, the demo diary, Twilio signatures, the phone bridge, the time cap, and the ElevenLabs relay (sentence cutting, whole-sample audio, barge-in, phone mu-law).

```bash
npm run build && npm run test:e2e
```

About 100 browser checks: the copy in both languages, the hero scene (autoplay, typing caption, steps, pause, sound, sync), the timeline, the call cards (play, waveform, seek, subtitle, transcript), every link, accordion and form, the live demo in both voice modes and each failure state, reduced motion, no JavaScript, nine screen widths, and an accessibility scan in light and dark. Both suites use mock xAI, ElevenLabs and Twilio servers (`tests/mocks.mjs`), so they need no keys and cost nothing.

`tests/live-demo.mjs` runs the microphone demo against the real APIs with a recorded caller. `tests/live-site.mjs` smoke-tests a deployed copy.

## Credits

- Fonts: Outfit, Anton and Inter (SIL Open Font Licence), served from this site.
- Backdrops: painted by `scripts/backdrops.py` (numpy and Pillow).
- Voices: ElevenLabs voice library (Claire for the receptionist; Thandi, Nicole and Martin Louw for the sample callers).
- Icons: Lucide (ISC) and Simple Icons (CC0) for the WhatsApp and Gmail marks.
- Caller voices in the recordings: ElevenLabs. Receptionist voice: xAI Grok Voice 3.0.
- CSS: Tailwind CSS (MIT).
