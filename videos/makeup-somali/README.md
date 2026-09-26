# Remove makeup before bed: 40-second Somali narration

Voice: Microsoft `so-SO-MuuseNeural`, matching the sunscreen narration.

- Script: `src/somali-vo.txt`, one sentence per line.
- Audio: `assets/audio/muuse.mp3`, approximately 40 seconds including MP3 frame padding.
- Speech tempo adjusted without changing pitch to fit 40 seconds; no words cut.
- Script and narration only. Video scenes, captions, and final rendering remain to be created.

Topic: remove face and eye makeup before sleeping, cleanse gently with lukewarm water and fingertips, pat dry, moisturize, and avoid sharing makeup tools.

Sources checked September 25, 2026:

- https://www.aad.org/public/diseases/acne/causes/makeup
- https://www.aad.org/public/everyday-care/skin-care-basics/care/apply-skin-care-certain-order

Initial synthesis:

```sh
edge-tts --voice so-SO-MuuseNeural --file src/somali-vo.txt --write-media muuse-raw.mp3
```
