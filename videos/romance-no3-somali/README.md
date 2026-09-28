# Taif Al Emarat, Romance No. 3: product ad: Somali script

- Script: `src/somali-vo.txt`, one sentence per line (about 35 seconds with so-SO-MuuseNeural).
- To generate the audio: `edge-tts --voice so-SO-MuuseNeural -f src/somali-vo.txt --write-media assets/audio/muuse.mp3`.
- Audio: `assets/audio/muuse.mp3` (so-SO-MuuseNeural, uploaded).
- **Final video:** `renders/romance-no3-somali.mp4`. It is 37.5s, in the Somali heritage style, and uses the official product photos (see `assets/photos/SOURCES.md`). Scenes: brand hook, the red bottle with its gold plate and cap, made in the UAE (75 ml), the ingredients from the box, how to spray it, fire and heat warning, storage and children, and a HADDA RAADSO end card. `src/romgen.py` generates the template for all three Romance ads.
- Rebuild with `python3 src/align_external.py assets/audio/muuse.mp3 src/script-somali.json assets/audio/vo.mp3 src/timing.json 0.55 0.45 0.3 1.0`, then `python3 src/build.py`, then `npx hyperframes render`.
- **New script (sales version):** `src/somali-vo.txt` now points buyers to Falarosa Luxury in Surrey, BC, Canada. The uploaded `assets/audio/muuse.mp3` is the old script and needs re-recording before the video is rebuilt.
