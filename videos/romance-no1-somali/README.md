# Romance N°1: Somali product ad for Falarosa Luxury

- Script: `src/somali-vo.txt`, one sentence per line. Audio: `assets/audio/muuse.mp3` (so-SO-MuuseNeural).
- Photos: official product photos in `assets/photos/` (sources in `SOURCES.md`); `*-cut.png` / `*-crop.png` are background-removed cutouts and detail crops made from them.
- **Final video:** `renders/romance-no1-somali.mp4`. It is 43s, 1080×1920, in the Falarosa Luxury style (black marble, gold serif type, original Falarosa emblem) with word-by-word Somali captions. Scenes: the Romance collection, N°1 as a bright floral for women, its top, heart and base notes, ingredients, the gold Taif plate, Romance N°3 as the strongest, Falarosa Luxury in Surrey BC, contact, and a HADDA DALBO end card.
- Rebuild: `python3 src/align_external.py assets/audio/muuse.mp3 src/script-somali.json assets/audio/vo.mp3 src/timing.json 0.55 0.45 0.3 1.0`, then `python3 src/build.py`, then `npx hyperframes render`. `src/adgen.py` generated `src/template.html.tmpl` and the beats in `src/build.py` for all five perfume ads.
