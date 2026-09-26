# Handoff — Solar Superstorm video (read this first in a new session)

**Goal:** "I Simulated a Hyper Realistic Solar Superstorm, Day by Day" — ~60 min YouTube video.
**Direction (owner, session 3):** the hour is **many short incidents all over the world**
(map zoom → real city → people, each with text + audio), not a Montreal-only build; don't
over-invest in 3D. **Seedance 2.5** shows the real cities (zoom hand-offs: cars moving) and
people; **Blender only for top views**. **Seedance budget: $21 total for the hour.**
Plan: `FULL_VIDEO_PLAN.md`, generated from `incidents.py` (47 incidents, 29 places, 20
countries; `FUNDED` = the 22 clips the $21 buys). Scene 1 (Montreal impact, `scene1/`) is the
pilot of the incident format. Owner wants Claude to make the creative calls and keep one look.

## Owner's rules (from the brief)
- 1920x1080, 30 fps, MP4. Map look: navy oceans, blue-grey land, gold lights, cyan coasts,
  faint lat/long grid + CRT scanlines + vignette + glow; HUD top edge, monospace, cyan labels,
  amber numbers, red when critical. Gold = normal life, green/magenta/red = aurora, red = failure.
- All brands fictional (GNN, Grid Control). No real networks, logos, anchors, politicians,
  utility names. No text inside AI images/clips (all text added in the edit).
- Never print, log, save or commit API keys. Log every Higgsfield generation (request_id,
  prompt, duration, credit cost) and every TTS call to `scene1/production_log.csv`.
- **Checkpoints (stop and show the owner):** 2 voices (incl. radio FX) · 3 Higgsfield clip
  plan + cost — **no credits spent before "go"** · 4 reporter lip-sync test vs voice-over ·
  5 Blender 3 s test + time/frame · 6 final `scene1_v1.mp4`. Deliver all assets in one folder
  for DaVinci Resolve, total credits used, and time per part (`scene1/timing_log.csv`).

## Decisions made
- TTS: **ElevenLabs** (owner's choice; Creator plan, 131k credits). Key injected by the
  proxy (see Environment). Look up model IDs via the API
  (`GET /v1/models`); prefer Eleven v3 for expressive lines. Radio FX chain in ffmpeg.
- Video clips: **Seedance 2.5 via the Higgsfield API** (owner has $21 there; the Higgsfield
  connector account has 0 credits). Exact API price (token-metered, $0.0214 per 1k video tokens): $0.206/s at 480p, $0.462/s at 720p. Key injected by the proxy,
  host `api.higgsfield.ai`. PiP boxes can use 480p.
- Close-up city footage: owner wants **Seedance image-to-video** starting from the zoom's last frame (aerials of famous places, cars, people). Blender is the backup.
- 3D (optional): Blender via `bpy==5.0.1` (Python 3.11 here), OSM from Overpass (`overpass-api.de`).
  Cycles CPU, low samples + denoise. Save the .blend for the owner.
- Novaya Zemlya (the "white arc") was removed from the maps as the owner asked.
- The owner's "use 3.8" is still unexplained — best guess: a $3.80 Higgsfield budget for
  the pilot. Ask when presenting checkpoint 3.

## Pipeline (all in `scene1/scripts/`)
| Script | What |
|---|---|
| `setup_env.sh` | apt ffmpeg/fonts + pip deps incl. bpy and geo data packages (~1.5 min) |
| `01_prepare_maps.py` | working maps from the owner's images + artifact cleanup |
| `02_calibrate_map.py` | Montreal pixel position from 3 landmarks → `assets/maps/calibration.json` |
| `geo.py` | GSHHG/borders/rivers (basemap-data) + GeoNames towns (geonamescache) |
| `look.py` | grid, glow, scanlines, vignette, grain, HUD |
| `regional.py` | 4 regional layers R1–R4 (8000→125 km) → `build/regional/` (~2 min) |
| `mapcam.py` | continuous camera AI map → regional layers (km space centred on Montreal) |
| `shots.py` | scene-1 plates A (push-in), B (zoom), F (pull-back) → `build/plates/` |
| `panels.py` | labels, reticle, PiP box + leader arrow, radio panel, lower third, headline card |
| `compose.py` | plates + grid/labels/HUD/effects → `build/preview/*.mp4`; `compose.py city [t0 t1]` = the Blender segment |
| `osm_fetch.py` | Overpass → `build/osm/montreal.json` (tiled, retried) |
| `blender_city.py` | 3D Montreal: `build` → `build/blender/montreal_city.blend`, `render t0 t1`, `cams` |
| `hf_generate.py` | Seedance 2.5 clips: `plan` (free) / `run C1 … --go` (spends, logs) |
| `sound.py`, `radio_fx.py` | procedural sound design stems; ffmpeg radio chain |

`build/` is regenerable and git-ignored (public repo): run `setup_env.sh`, then
`python3 regional.py && python3 shots.py && python3 compose.py preview`.

## Scene-1 status
- Done: maps, calibration, look/HUD, regional layers, zoom + pull-back plates, previews.
- The zoom hands over to Blender mid-motion: the shared log-zoom schedule
  `shots.descent_V(t)` runs from V=3000 km at 16.0 s to V=9 km at 23.0 s, centred on
  Montreal (km origin = 45.5017 N, 73.5673 W). The Blender camera must follow it from
  19.5 s (crossfade 19.5–20.0 s) and use `build/regional/R3/R4_aurora.png` as ground texture.
- **Blender city (session 3):** `blender_city.py build` makes Montreal from real OSM
  (94,006 buildings, 27,362 roads; 52 s). Now a **top view only**: continues the 2D zoom
  straight down, north up (matches the plate at 0:19.5, mean diff 0.9/255), eases to 6.2 km
  across by 0:31 then pushes in; 10 districts die north→south 31–40 s with flickers,
  hospitals back on generators, traffic keeps moving, snow catches the aurora. `compose.py
  city` keeps the map grid, adds PEOPLE WITHOUT POWER and the radio panel. ~28 s/frame at
  720p/12 spp (0:19.5–0:50 ≈ 7 h here). The oblique/skyline version was dropped (owner).
- **Any-city zooms (session 3):** `geo.CITIES` + `$SUPERSTORM_CITY`; `calibrate_city.py`
  places each city on the AI map (coast fit + city-lights pattern match; review sheets in
  `review/cities/`; Chicago worth a manual check); `SUPERSTORM_CITY=x python3 regional.py`
  (~6 min/city → `build/regional_x/`); `city_zoom.py` renders the zoom (9,000 → 160 km) and
  saves `build/zooms/x/seedance_start.png`, the image-to-video start frame. London done.
- Next: owner "go" on the first batch (X1 London hand-off, M1 reporter lip-sync, M2 crowd,
  $2.88) once `cloudfront.net` is allowed → then chapter by chapter; voices via `tts.py`
  once the ElevenLabs key is fixed; incident text/graphics templates; chapter assembly.

## Environment (as of session 3)
- Allowed: `api.elevenlabs.io`, `api.higgsfield.ai`, `overpass-api.de` + package managers.
- Keys are **not** env vars: they are saved as API credentials and the agent proxy injects
  them (`xi-api-key` for ElevenLabs, `Authorization: Key …` for Higgsfield). Scripts must not
  require `ELEVENLABS_API_KEY`/`HF_KEY`; `hf_generate.py` uses `HF_KEY` only if present.
- Verified (non-billable): Higgsfield auth works (free `POST /files/generate-upload-url`).
- **Blocked 1 — ElevenLabs:** the stored credential is the key *ID*; the API answers
  `api_key_id_used_as_api_key`. The owner must store the secret key (starts with `sk_`).
  Non-billable check: `curl https://api.elevenlabs.io/v1/user/subscription`.
- **Blocked 2 — Higgsfield downloads:** results are served from `*.cloudfront.net`
  (e.g. `d8j0ntlcm91z4.cloudfront.net`) and `cdn.higgsfield.ai`, both denied. Allow
  `cloudfront.net` before generating, or finished clips can't be pulled into the VM.
- Overpass works but resets ~2 of 3 connections: `osm_fetch.py` fetches 16 tiles with
  retries into `build/osm/tiles/` (cached), ~25 min.

## Session 3 wrap-up (owner: "you do everything, in budget")
- Seedance: 21-clip $21 plan approved ("go all"). Done: X1 M1 M2 B2 (in `scene1/build/clips/`,
  git-ignored). Submitted and rendering: B3 T2 T3 N1 N2 L2 N3 P1 N4 L3 G1 V1 R1 W1 M3 S1 —
  request IDs in `scene1/production_log.csv`; finish/download with
  `python3 hf_generate.py poll ID=REQUEST_ID ...`. B1 came back "nsfw" (false positive, $0):
  reword and resubmit. M1 (reporter) has a flagged mic in the first second and lit
  streetlights: trim, or redo from the reserve. Remaining after batch 2: ~$2.67.
- CloudFront download host now works; ElevenLabs key is still the key ID (voices blocked).
- Background jobs at wrap-up (restart if the container was recycled; both resume/skip done
  work): Blender top view `blender_city.py render 19.5 50 --scale 67 --samples 12` (~7 h),
  city layers loop for paris … madison (`SUPERSTORM_CITY=x python3 regional.py`).
- New: `incident_clip.py` (clip → house look + location tag, joined to its zoom),
  previews `build/preview/london_incident.mp4`, `montreal_reporter.mp4`; zooms for London,
  Tokyo, New York, Stockholm.
- Narration v2: `script/v2_part1.md` (ch 0–2), `script/v2_part2.md` (ch 3–5); ch 6–8 still to
  write (lines per incident are in `incidents.py`).
- Next: collect batch 2, retry B1, incident previews, scene1_v1 assembly after the render,
  narration part 3, voices once the key is fixed.

## Session 4 (parallel to session 3's wrap-up; merged)
- **ElevenLabs works now** (restricted key: TTS + voices/models only; no user_read,
  speech_to_text or speech_to_speech; `pcm_44100` needs Pro, so `tts.py` uses `mp3_44100_192`).
  Scene-1 lines generated, 866 chars + 134 for an alternate, all logged: casting in `tts.py`
  ROLES — Brian (NARR), Chris (GRID), Sarah (GNN); `NARR1_george.wav` = alternate narrator
  for the owner to compare. Checkpoint 2 is ready to show once rebuilt (`build/audio/vo/`).
- `radio_fx.py --max-gap 0.22 --cut -0.12` → `grid_radio.wav` 10.94 s. Scene re-timed to the
  real takes (`timeline.VO`): radio 42.2–53.2, reporter 53.2–65 (M1 5.04 s, then M2 at 0.6×
  under the rest of her report, voice running into the pull-back), NARR4 at 67.4.
  Blender: the top view now needs frames to 1596 (`render 19.5 53.2 ...`); the camera drift
  is pinned to end at 50 s (`DRIFT_END`) so frames already rendered stay valid.
- `clip_fix.py mic_flag M1.mp4 M1_clean.mp4` paints a fictional GNN flag over M1's logo flag
  (checked frame by frame) — M1 no longer needs trimming or a redo.
- `reporter.py` (untested; stopped before its first run): reporter picture + checkpoint-4
  variants A (Seedance voice on camera) / C (ElevenLabs voice phrase-fitted to her lips) →
  `build/preview/cp4_lipsync.mp4`. Variant B (speech-to-speech re-voice) needs the key's
  speech_to_speech permission.
