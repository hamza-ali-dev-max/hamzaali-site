# Seedance clip plan (v2 — $21 total for the whole hour)

The owner has **$21 of Seedance** (Higgsfield API, token-metered: **480p = $0.206/s**,
720p = $0.462/s). That buys ~100 s of 480p footage for the full hour, so it goes only where
real footage matters; every other incident is map zoom + text + audio + graphics. The full
list (21 clips, $18.33, reserve $2.67) is in `../incidents.py` (`FUNDED`) and
`../FULL_VIDEO_PLAN.md`. All clips: 16:9, no text, no logos, fictional people.

## Scene 1 (Montreal impact) — new split

| Time | Shot | Source | Cost |
|---|---|---|---|
| 0:00–0:19.5 | world → Quebec → Montreal zoom | 2D map pipeline | $0 |
| 0:19.5–0:42 | Montreal from above, the blackout wave, hospitals on generators, traffic | **Blender top view** (real OSM, north-up, map grid continues) | $0 |
| 0:42–0:50 | Grid Control radio over the dark city | Blender top view + radio panel | $0 |
| 0:50–1:05 | GNN reporter on a dark street, aurora overhead | **Seedance M1** 5 s + **M2** crowd 4 s | $1.85 |
| 1:05–1:15 | pull back to the world | 2D map pipeline | $0 |

## First batch to generate after "go" ($2.88) — tests the two techniques before the rest

| # | Clip | Model / res | Dur | Audio | Cost |
|---|------|-------------|-----|-------|------|
| X1 | **London zoom hand-off**: start image = the London zoom's last frame (`build/zooms/london/seedance_start.png`) → the real city at night, cars moving, then the blackout | Seedance 2.5 image-to-video, 480p | 5 s | off | $1.03 |
| M1 | **Montreal reporter, lip-sync test**: she says the first line herself (Seedance audio on); if the lips/voice fail, reporters are shot listening/looking up with the ElevenLabs voice over | Seedance 2.5 text-to-video, 480p | 5 s | **on** | $1.03 |
| M2 | Montreal crowd looking up at the aurora, phone lights | Seedance 2.5 text-to-video, 480p | 4 s | off | $0.82 |

Then chapter by chapter, owner reviewing each batch. `scripts/hf_generate.py plan` prints the
batch; `run X1 M1 M2 --go` spends and logs every request to `production_log.csv`.

## Blocking before "go"

- Higgsfield result downloads come from `*.cloudfront.net` / `cdn.higgsfield.ai`, which the
  network policy denies: add `cloudfront.net` (and `cdn.higgsfield.ai`) to allowed domains.
- API auth itself works (verified with a free upload-URL request).

## API (verified, non-billable)

`POST /bytedance/seedance-2.5/image-to-video` (needs `image_url`) and `.../text-to-video`
(needs `prompt`); body `duration`, `resolution` (480p/720p), `generate_audio`, `aspect_ratio`
(t2v only). Start images upload via `POST /files/generate-upload-url` → PUT to S3 (reachable).
