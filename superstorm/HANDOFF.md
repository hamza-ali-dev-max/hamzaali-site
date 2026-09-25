# Handoff — Solar Superstorm video (read this first in a new session)

**Goal:** "I Simulated a Hyper Realistic Solar Superstorm, Day by Day" — ~62 min YouTube video
(see `FULL_VIDEO_PLAN.md`). Scene 1 "The First City Goes Dark" (75 s, `scene1/`) is the pilot
that tests the whole pipeline. Owner wants Claude to make the creative calls ("you do
everything"), keep one consistent look, and make it engaging.

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
- TTS: **ElevenLabs** (owner's choice; Creator plan, 131k credits). Needs env var
  `ELEVENLABS_API_KEY` and `api.elevenlabs.io` allowed. Look up model IDs via the API
  (`GET /v1/models`); prefer Eleven v3 for expressive lines. Radio FX chain in ffmpeg.
- Video clips: **Seedance 2.5 via the Higgsfield API** (owner has $21 there; the Higgsfield
  connector account has 0 credits). Exact API price (token-metered, $0.0214 per 1k video tokens): $0.206/s at 480p, $0.462/s at 720p. Env var `HF_KEY`,
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
| `compose.py` | plates + grid/labels/HUD/effects → `build/preview/*.mp4` |

`build/` is regenerable and git-ignored (public repo): run `setup_env.sh`, then
`python3 regional.py && python3 shots.py && python3 compose.py preview`.

## Scene-1 status
- Done: maps, calibration, look/HUD, regional layers, zoom + pull-back plates, previews.
- The zoom hands over to Blender mid-motion: the shared log-zoom schedule
  `shots.descent_V(t)` runs from V=3000 km at 16.0 s to V=9 km at 23.0 s, centred on
  Montreal (km origin = 45.5017 N, 73.5673 W). The Blender camera must follow it from
  19.5 s (crossfade 19.5–20.0 s) and use `build/regional/R3/R4_aurora.png` as ground texture.
- Next: sound design + radio chain · Blender city (needs Overpass) · voices (needs
  ElevenLabs) · clips (needs Higgsfield, after owner approval) · full script for the hour.

## Environment needed (owner sets this; Claude cannot)
Allowed domains: `api.elevenlabs.io`, `api.higgsfield.ai`, `overpass-api.de`.
Env vars: `ELEVENLABS_API_KEY`, `HF_KEY`. New session after changing env vars.
