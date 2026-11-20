# Remove makeup before bed: 40-second Somali narration

Voice: Microsoft `so-SO-MuuseNeural`, matching the sunscreen narration.

- Script: `src/somali-vo.txt`, one sentence per line.
- Audio: `assets/audio/muuse.mp3`, approximately 40 seconds including MP3 frame padding.
- Speech tempo adjusted without changing pitch to fit 40 seconds; no words cut.
- **Final video:** `renders/makeup-somali.mp4`. It is 40.5s, vertical 1080×1920, with 10 scenes in the same Somali heritage sticker style as the other videos, Somali captions, and the TikTok share button at the end. The last two script lines share the closing scene.
- To rebuild: run `python3 src/align_external.py assets/audio/muuse.mp3 src/script-somali.json assets/audio/vo.mp3 src/timing.json 0.7 0.45 0.3 1.0`, then `python3 src/build.py`, then `npx hyperframes render --quality high --output renders/makeup-somali.mp4`.

Topic: remove face and eye makeup before sleeping, cleanse gently with lukewarm water and fingertips, pat dry, moisturize, and avoid sharing makeup tools.

Sources checked September 25, 2026:

- https://www.aad.org/public/diseases/acne/causes/makeup
- https://www.aad.org/public/everyday-care/skin-care-basics/care/apply-skin-care-certain-order

Initial synthesis:

```sh
edge-tts --voice so-SO-MuuseNeural --file src/somali-vo.txt --write-media muuse-raw.mp3
```
