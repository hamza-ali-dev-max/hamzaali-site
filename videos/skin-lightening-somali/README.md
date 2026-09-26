# Skin lightening: Somali narration

Voice: so-SO-MuuseNeural. Duration: 50.688 seconds at natural synthesis pace.
Script: src/somali-vo.txt, user-provided wording preserved, one sentence per line.
Audio: assets/audio/muuse.mp3.
Audio and script only; video and captions remain to be created.
**Final video:** `renders/skin-lightening-somali.mp4`. It is 48.0s, with 11 scenes in the Somali heritage style and the Somali hijabi tutorial character (v2). The scenes cover hidden ingredients, mercury, strong steroids, rebound darkening, reading the label, not buying unlisted creams, "your colour is beautiful", seeing a dermatologist and daily sunscreen. It ends on the "Skincare by Ubah" share and follow card. Rebuild with `python3 src/align_external.py assets/audio/muuse.mp3 src/script-somali.json assets/audio/vo.mp3 src/timing.json 0.55 0.45 0.3 1.0`, then `python3 src/build.py`, then `npx hyperframes render`.
