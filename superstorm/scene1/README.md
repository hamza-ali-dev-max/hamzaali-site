# Solar Superstorm — Scene 1 "The First City Goes Dark" (pilot)

Working folder for the 75 s pilot scene (1920x1080, 30 fps). Everything here is
reproducible from `scripts/`; heavy renders are not committed (see `.gitignore`).

> Heads-up: this repository is **public**. Anything pushed to this branch is visible
> on GitHub. Final video, voice and clip deliverables are handed over directly, not
> committed.

## Checkpoint status

| # | Checkpoint | Status |
|---|------------|--------|
| 1 | Setup: image ID, cleaned base map, network check | done — waiting on environment changes (below) |
| 2 | Voice lines (+ radio FX) | blocked: needs a TTS decision + network access |
| 3 | Higgsfield clip plan + credit estimate | not started (no credits spent) |
| 4 | Reporter lip-sync vs voice-over tests | not started |
| 5 | Blender 3 s test + render-time estimate | blocked: Overpass (OSM data) |
| 6 | scene1_v1.mp4 | not started |

## Map sources (identified visually)

| Source file (`Codex Image Sep 25, 2026, …`) | Working copy | Notes |
|---|---|---|
| `01_16_12 PM.png` | `assets/maps/base_night.png` | Cleaned. Chosen over 01_06_02: every aurora/blackout image was derived from this one (phase-correlation 0.92–0.97 vs 0.83–0.93), so crossfades stay pixel-aligned. |
| `01_16_27 PM.png` | `assets/maps/aurora_impact.png` | Semi-transparent aurora, city lights visible. Same cleanup applied. |
| `01_16_32 PM.png` | `assets/maps/blackout.png` | Red outlines: NE North America, UK + Ireland, Scandinavia + Finland; rest of the world still lit. Island cleanup applied (no star in this one). |
| `01_16_16 PM.png` | `assets/maps/aurora_thumbnail.png` | Heavy opaque aurora. Untouched, not used in scene 1. |
| `01_06_02 PM.png`, `01_16_03 PM.png` | — | Unused. Byte-identical pair; an earlier night map that does not align with the others. |
| `01_16_20 PM.png`, `01_16_23 PM.png` | — | Unused. Alternate blackout maps with the whole world dimmed (could suit a later day in the full video). |

Originals of the four used images are in `assets/maps/originals/`.

## Cleanup (`scripts/01_prepare_maps.py`)

- **Stray star** in the southern Indian Ocean (~x1027, y791): removed with its glow.
  The tiny dot ~20 px to its south-east was left alone.
- **White arc above Russia** (~x957–1043, y50–97): removed together with its dark drop-shadow.
  This arc is the real island of **Novaya Zemlya** (glaciated, drawn with a white rim).
  Removed as requested; revert by deleting the island step if you want it back.
- Same pixel footprint in all three working maps, so nothing pops in or out during the
  0:04 crossfade or the pull-back. The aurora map's fill keeps the aurora curtains
  continuous (vertical interpolation of the aurora layer).
- Only ~0.15 % of pixels changed; zero changes outside the two regions (script verifies).
- Before/after: `review/cp1_cleanup_before_after.png`; identification sheet:
  `review/cp1_image_identification.png`.

Run: `python3 scripts/01_prepare_maps.py` (needs `pillow numpy opencv-python-headless`).

## Environment check (2026-09-25)

| Host / item | Result |
|---|---|
| generativelanguage.googleapis.com | reachable (Google answered 403 "no API key") |
| api.higgsfield.ai | **blocked** by network policy |
| overpass-api.de | **blocked** by network policy |
| pypi.org / files.pythonhosted.org | reachable |
| ai.google.dev (Gemini docs) | **blocked** (also for web fetch) |
| huggingface.co, cas-bridge.xethub.hf.co, cdn-lfs.huggingface.co | **blocked** (open-source TTS model weights) |
| download.pytorch.org | blocked (not required: torch installs from PyPI) |
| archive.ubuntu.com | reachable → `apt-get install ffmpeg` will work (ffmpeg is not preinstalled) |
| `GEMINI_API_KEY`, `HF_KEY`, `HF_CREDENTIALS` | **not set** in this session |
| Higgsfield connector | connected; account shows **0 credits** (free plan). Seedance 2.5 is listed (`seedance_2_5`, t2v, 4–30 s, 480p/720p/1080p). |
| Python / bpy | Python 3.11 → use `bpy==5.0.1` (newest wheel for 3.11; 5.2 needs Python 3.13). The .blend opens in Blender 5.0+. |
| Machine | 4 CPU cores, 15 GB RAM, ~30 GB free disk, no GPU |

## Logs

- `production_log.csv` — every Higgsfield generation and every TTS call.
- `timing_log.csv` — wall-clock time per part (for planning the 40-minute video).
