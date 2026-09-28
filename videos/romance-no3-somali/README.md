# Taif Al Emarat, Romance No. 3: product ad: Somali script

- Script: `src/somali-vo.txt`, the latest user-supplied Falarosa Luxury sales version.
- To generate the audio: `edge-tts --voice so-SO-MuuseNeural -f src/somali-vo.txt --write-media assets/audio/muuse.mp3`.
- **Previous render (old narration; rebuild needed):** `renders/romance-no3-somali.mp4`. It is 37.5s, in the Somali heritage style, and uses the official product photos (see `assets/photos/SOURCES.md`). Scenes: brand hook, the red bottle with its gold plate and cap, made in the UAE (75 ml), the ingredients from the box, how to spray it, fire and heat warning, storage and children, and a HADDA RAADSO end card. `src/romgen.py` generates the template for all three Romance ads.
- Rebuild with `python3 src/align_external.py assets/audio/muuse.mp3 src/script-somali.json assets/audio/vo.mp3 src/timing.json 0.55 0.45 0.3 1.0`, then `python3 src/build.py`, then `npx hyperframes render`.

- **Current audio:** `assets/audio/muuse.mp3`, Microsoft `so-SO-MuuseNeural`, 48.576 seconds at natural synthesis pace. Recorded 2026-09-28 from the exact supplied sales script, including Falarosa Luxury, Surrey, BC, Kanada and the contact call to action.
- Retiming, captions and video rendering must use this updated script and audio. Any existing rendered video uses the previous narration.
