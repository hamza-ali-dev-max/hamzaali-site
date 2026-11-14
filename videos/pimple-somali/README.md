# Ha Tuujin Finanka: why popping pimples is bad (Somali)

A 45-second vertical (1080×1920) TikTok explainer on why you shouldn't pop pimples, built with [HyperFrames](https://hyperframes.heygen.com). It uses the same Somali heritage sticker style as `../sunscreen-somali`. The voiceover and all on-screen text are in Somali.

## Scenes

| # | On screen | Voiceover (Somali) |
|---|-----------|--------------------|
| 1 | Ma tuujisaa finankaaga? – JOOJI! – nabar joogto ah! | Ma tuujisaa finankaaga? Jooji! Waxay kaa reebi kartaa nabar joogto ah. |
| 2 | Gudaha finka: saliid / unugyo dhintay / bakteeriya | Finku waa dalool maqaar oo xiran, oo ay ku jiraan saliid, unugyo dhintay, iyo bakteeriya. |
| 3 | Gudaha ayay u sii gashaa – bakteeriya, barar | Markaad tuujiso, bakteeriyadu gudaha ayay u sii gashaa, bararkuna wuu sii weynaadaa. |
| 4 | Caabuqa – finan cusub (+5) | Waxa kale oo aad faafin kartaa caabuqa, finan cusubna way soo baxaan. |
| 5 | Nabar ama bar madow | Maqaarku wuu dhaawacmaa, wuxuuna kaa reebaa nabar ama bar madow. |
| 6 | Tallaabo 1: Si tartiib ah u dhaq – 2× maalintii (subax, habeen) | Taa beddelkeed: wejiga si tartiib ah u dhaq, laba jeer maalintii. |
| 7 | Tallaabo 2: Ha taaban! – kareem finan | Ha taaban wejigaaga, isticmaalna kareem finanka loogu talagalay. |
| 8 | Tallaabo 3: La tasho dhakhtarka maqaarka | Haddii ay xanuun badan yihiin ama aysan tegin, la tasho dhakhtarka maqaarka. |
| 9 | Ha tuujin! Maqaarkaaga u naxariiso + TikTok share | Maqaarkaaga u naxariiso, ha tuujin! U dir qof aad jeceshahay. |

## Build

1. Generate the voice from `src/somali-vo.txt` (one sentence per line) with `edge-tts --voice so-SO-MuuseNeural -f somali-vo.txt --write-media muuse.mp3`, then save it as `assets/audio/muuse.mp3`.
2. Run `python3 src/align_external.py assets/audio/muuse.mp3 src/script-somali.json assets/audio/vo.mp3 src/timing.json 0.7 0.45 0.3 1.0`. This retimes the voice (0.7s pause at each scene cut, ending at 43.5s) and estimates word timings.
3. Run `python3 src/build.py`, then `npx hyperframes render --quality high --output renders/pimple-somali.mp4`.

**Final video:** `renders/pimple-somali.mp4`.
