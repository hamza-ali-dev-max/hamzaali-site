# Hijab and acne: underscarf, breathable fabric, hairline: Somali script

- Script: `src/somali-vo.txt`, one sentence per line (about 45 seconds with so-SO-MuuseNeural).
- To generate the audio: `edge-tts --voice so-SO-MuuseNeural -f src/somali-vo.txt --write-media assets/audio/muuse.mp3`.
- Audio: `assets/audio/muuse.mp3` (so-SO-MuuseNeural, uploaded).
- **Final video:** `renders/hijab-acne-somali.mp4`. It is 42.5s, with 11 scenes in the Somali heritage style and the Somali hijabi tutorial character (v2). The scenes cover breakouts along the hijab line, sweat, oil and rubbing, friction and pressure acne, washing the underscarf, breathable cotton, not tying it over wet hair, gentle cleansing of the hairline at night, fragrance-free laundry soap, not tying it too tight, and "your hijab is beautiful". It ends on the "Skincare by Ubah" share and follow card.
- Rebuild with `python3 src/align_external.py assets/audio/muuse.mp3 src/script-somali.json assets/audio/vo.mp3 src/timing.json 0.55 0.45 0.3 1.0`, then `python3 src/build.py`, then `npx hyperframes render`.
