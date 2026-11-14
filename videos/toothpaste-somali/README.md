# Toothpaste is not an acne treatment: Somali narration

Voice: so-SO-MuuseNeural. Duration: 46.968 seconds, natural synthesis pace.
Script: src/somali-vo.txt, one sentence per line.
Audio: assets/audio/muuse.mp3.
**Final video:** `renders/toothpaste-somali.mp4`. It is 44.0s, with 11 scenes in the Somali heritage style and the Somali hijabi tutorial character (v2: a larger face opening). It ends on a "Skincare by Ubah" follow card with the TikTok icon. Rebuild with `python3 src/align_external.py assets/audio/muuse.mp3 src/script-somali.json assets/audio/vo.mp3 src/timing.json 0.55 0.45 0.3 1.0`, then `python3 src/build.py`, then `npx hyperframes render`.
Sources:
https://health.clevelandclinic.org/toothpaste-on-pimples
https://www.aad.org/public/diseases/acne/skin-care/tips
