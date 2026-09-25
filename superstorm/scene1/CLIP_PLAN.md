# Scene 1 — Seedance clip plan (checkpoint 3 draft — nothing generated yet)

Prices from the Higgsfield API doc (token-metered, $0.0214 per 1k video tokens):
**480p = $0.206/s, 720p = $0.462/s.** All clips: 16:9, no text, no logos, fictional people.
Upscale to 1080p in the edit. Every generation is logged to `production_log.csv`.

| # | Clip | Use | Model / res | Dur | Audio | Cost |
|---|------|-----|-------------|-----|-------|------|
| C1 | Map → real city hand-off | 0:19.5–0:27 — continues the zoom from the map into a real aerial of Montreal at night | Seedance 2.5 image-to-video, start image = clean zoom frame at 19.5 s, 720p | 8 s | off | $3.70 |
| C2 | Blackout from above | 0:27–0:40 — city lights die in a wave, flickers, a few hospitals stay lit, green aurora | Seedance 2.5, start image = last frame of C1, 720p | 10 s | off | $4.62 |
| T1 | Reporter lip-sync test (a) | checkpoint 4 — reporter speaks the line herself | Seedance 2.5 t2v, 480p | 12 s | **on** (line in prompt) | $2.47 |
| T2 | Reporter voice-over test (b) | checkpoint 4 — silent, ElevenLabs voice laid over | Seedance 2.5 t2v, 480p | 12 s | off | $2.47 |
| C3 | Reporter final | 0:50–1:05 — the method you pick, at full quality | Seedance 2.5, 720p | 12 s | per test | $5.54 |
| C4 | Crowd insert | cut into C3 | Seedance 2.5 t2v, 720p | 4 s | off | $1.85 |
| | **Total** | | | | | **$20.65** (fits the $21; no room for retries) |

If C1/C2 disappoint, the Blender city (district-exact blackout, already scripted) is the
fallback at $0.

## API check (non-billable, this session)

- Auth works: the environment's proxy injects the key; a free `POST /files/generate-upload-url`
  returned an upload slot for the account. No generation has been submitted.
- Endpoints: `POST /bytedance/seedance-2.5/image-to-video` (needs `image_url`) and
  `.../text-to-video` (needs `prompt`); body `duration`, `resolution` (480p/720p),
  `generate_audio`, `aspect_ratio` (t2v only). Start images upload to S3 (reachable).
- **Blocker for downloading results:** the Higgsfield CDNs (`*.cloudfront.net`, e.g.
  `d8j0ntlcm91z4.cloudfront.net`, and `cdn.higgsfield.ai`) are denied by the network
  policy, so a finished clip could not be pulled into the VM. Add `cloudfront.net` (or those
  hosts) to the allowed domains before "go".
- Script: `scripts/hf_generate.py plan` (prices) / `run C1 C2 ... --go` (spends; logs every
  request to `production_log.csv`). C1's start image is the clean zoom plate at 0:19.5
  (`build/plates/B/00225.png`).

## Prompts

**C1** — Continuous aerial descent from very high altitude straight down toward a large city
on an island in a wide dark river, at night, north up, the map-like view below slowly becomes
a real photographic city: warm gold streetlights in street grids, dark river, bridges with car
headlights moving, faint green aurora glow in the air, smooth steady drone descent, realistic,
cinematic, no text, no labels, no logos.

**C2** — Top-down aerial view of a dense North American city at night in winter, warm gold
streetlights and lit windows, then the lights go out neighbourhood by neighbourhood in a
sweeping wave across the city, each area flickers two or three times before going dark, a few
large hospital buildings stay brightly lit, the dark city is washed in faint green aurora
light from above, cars' headlights still moving on dark streets, realistic, cinematic, no text,
no logos.

**T1** — Night on a downtown street in a large North American city during a total blackout,
the only light comes from phone flashlights and car headlights, crowds spilling onto the
sidewalks looking up at the sky, vivid green and magenta aurora filling the sky above the
buildings, a female TV news reporter in a dark jacket holds a plain microphone and speaks
urgently to the camera: "I'm in downtown Montreal, where just a minute ago every light in the
city went out at once. People are pouring into the streets… and above us, you can see it, the
whole sky is green. We're hearing the entire province may be without power." Handheld news
camera, realistic, cinematic lighting, 16:9, no text, no logos.

**T2** — same as T1 without the spoken line ("…speaks urgently to the camera").

**C4** — Night, crowd of people standing in a dark city street looking up in awe at a vivid
green and magenta aurora above the skyline, phone screens glowing in their hands, no electric
lights anywhere, realistic, handheld, cinematic, no text, no logos.
