# Cleaning makeup brushes: Somali narration

Voice: so-SO-MuuseNeural. Duration: 42.504 seconds.
Script: src/somali-vo.txt, one sentence per line.
Audio: assets/audio/muuse.mp3, natural synthesized pace.
**Final video:** `renders/makeup-brushes-somali.mp4`. It is 40.0s, with 11 scenes in the Somali heritage style, the Somali hijabi tutorial character, realistic brush and shampoo props, and a "Skincare by Ubah" follow card with the TikTok icon at the end. Rebuild with `python3 src/align_external.py assets/audio/muuse.mp3 src/script-somali.json assets/audio/vo.mp3 src/timing.json 0.55 0.45 0.3 1.0`, then `python3 src/build.py`, then `npx hyperframes render`.
Source: https://www.aad.org/public/everyday-care/skin-care-secrets/routine/clean-your-makeup-brushes
