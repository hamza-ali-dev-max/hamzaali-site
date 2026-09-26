# Kareemka Qorraxda: sunscreen explainer (Somali)

A 45-second vertical (1080×1920) TikTok explainer on how to use sunscreen, built with [HyperFrames](https://hyperframes.heygen.com). The voiceover and all on-screen text are in Somali.

**Final video:** `renders/sunscreen-somali.mp4`

## Scenes (cut on the voiceover)

| # | Time | On screen | Voiceover (Somali) |
|---|------|-----------|--------------------|
| 1 | 0.0–4.3 | Qorraxdu – xitaa daruur! | Qorraxdu waxay dhaawacdaa maqaarkaaga, xitaa maalmaha daruurta leh! |
| 2 | 4.3–9.5 | Shucaaca UV: gubasho / gabow hore / kansarka maqaarka | Shucaaca UV-ga wuxuu keenaa gubasho, gabow hore, iyo kansarka maqaarka. |
| 3 | 9.5–14.7 | Tallaabo 1: SPF 30+ | Tallaabada koowaad: dooro kareemka qorraxda oo SPF soddon ama ka badan ah. |
| 4 | 14.7–19.9 | Tallaabo 2: 2 farood | Tallaabada labaad: mari qadar ku filan, qiyaastii laba farood wejiga iyo qoorta. |
| 5 | 19.9–25.3 | Tallaabo 3: 15 daqiiqo ka hor | Tallaabada saddexaad: mari shan iyo toban daqiiqo ka hor intaadan bannaanka u bixin. |
| 6 | 25.3–29.9 | Tallaabo 4: Ha illoobin | Ha illoobin dhegaha, qoorta, gacmaha dushooda, iyo cagaha. |
| 7 | 29.9–35.0 | Tallaabo 5: Dib u mari (2 saacadood) | Dib u mari labadii saacadoodba mar, iyo mar kasta oo aad dabaalato ama dhididdo. |
| 8 | 35.0–39.7 | Xaqiiq: maqaarka madow sidoo kale wuu gubtaa | Maqaarka madow sidoo kale wuu gubtaa. Qof kasta wuxuu u baahan yahay ilaalin. |
| 9 | 39.7–45.0 | Maanta bilow! U dir qof aad jeceshahay | Maanta bilow, maqaarkaaga ilaali! U dir qof aad jeceshahay. |

## How it's built

- `src/script-somali.json` holds the narration script.
- `src/gen.py <voice_id>` generates the voiceover with ElevenLabs `eleven_v3` (`language_code: so`) and saves character timestamps. The video uses "Ali - Saudi Arabic" (`Hvlnv5DwiIO2CQ6oYMZ3`). ElevenLabs has no native Somali voices, so an Arabic native voice was picked because it pronounces Somali x (ħ), c (ʕ) and q correctly, where English voices flatten them.
- `src/tighten.py <gap> <lead> <tempo>` splits the voiceover into sentences, sets the pause between them, applies the tempo, loudness-normalises it, and remaps the word timings into `src/timing.json`. The video uses `0.5 0.3 0.97`.
- `renders/voice-comparison.mp4` plays the same two lines in six candidate voices, numbered, so a native speaker can pick the most natural one.
- `src/synth.py` makes the music bed and the whoosh, pop and ding sounds procedurally with numpy and scipy.
- `src/build.py` fills in `src/template.html.tmpl` from `src/timing.json` to produce `index.html`. It sets the scene cuts, the SFX placement, and the word-by-word Somali captions.

Rebuild and render:

```bash
python3 src/build.py
npx hyperframes render --quality high --output renders/sunscreen-somali.mp4
```
