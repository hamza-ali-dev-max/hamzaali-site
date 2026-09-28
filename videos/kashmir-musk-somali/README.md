# Kashmir Musk, Arabian Oud: product ad: Somali script

- Script: `src/somali-vo.txt`, one sentence per line (about 35 seconds with so-SO-MuuseNeural).
- To generate the audio: `edge-tts --voice so-SO-MuuseNeural -f src/somali-vo.txt --write-media assets/audio/muuse.mp3`.
- Script only for now. The audio, video and captions still need to be created.

- **Needs a corrected recording:** Kashmir Musk is the perfume and Arabian Oud is the brand. `src/somali-vo.txt` (the text of the uploaded audio) reads "Arabian Oud" as the scent name. `src/somali-vo-corrected.txt` fixes that and adds the fragrance notes; record it and replace the audio before building.
