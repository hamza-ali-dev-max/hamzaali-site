# Al Majed Oud: 30–40s product ad (Somali)

The product is Al Majed for Oud (الماجد للعود) perfumed agarwood chips (*oud muattar*). The label lists **agarwood chips and perfume oil**, 30g, made in Riyadh, Saudi Arabia. It comes in a glass jar with a wood-look lid, a gold wax-seal logo and a gold band.

- Script: `src/somali-vo.txt`, one sentence per line.
- To generate the audio: `edge-tts --voice so-SO-MuuseNeural -f src/somali-vo.txt --write-media assets/audio/muuse.mp3`.
- Product images: Oud White studio shots (bottle, box, and set) with backgrounds removed, in `assets/photos/white-*.png`, supplied by the owner.
- **Final video:** `renders/al-majed-oud-somali.mp4`. It is 34.5s and uses the Oud White product cutouts. Rebuild with `python3 src/align_external.py assets/audio/muuse.mp3 src/script-somali.json assets/audio/vo.mp3 src/timing.json 0.55 0.45 0.3 1.0`, then `python3 src/build.py`, then `npx hyperframes render`.
