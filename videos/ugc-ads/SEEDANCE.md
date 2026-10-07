# Somali UGC perfume ads: Seedance 2.5 video pack

Realistic "Somali woman talks to her phone" videos for the five Falarosa Luxury perfumes. Each ad is one Seedance 2.5 generation on Higgsfield with a real Somali voice. Every prompt here is copy-ready.

## How it works

1. **Voice first.** Each ad's Somali lines are already recorded with the ElevenLabs voice "Sagal", a Somali female voice (model Eleven v4). The order is hook, scent notes, a 1.9 s pause for the spray, then the call to action.
   - Files: `seedance/voice/<ad>-sagal.mp3`, with the timings in the matching `.json`.
   - To hear the other voices, play `seedance/voice/voice-compare-rom3-sagal-ifrah-hodan.mp3` (Sagal, then Ifrah, then Hodan).
2. **One Seedance 2.5 shot per ad.**
   - Settings: omni-reference mode, 9:16, 1080p, sound on, length = the voiceover.
   - References: @Image1 = the real bottle photo (`seedance/refs/<ad>-bottle.jpg`), @Audio1 = the voiceover.
   - The voice drives her lips and the photo keeps the bottle and label exact.
   - The timestamps in each prompt come from the voiceover, so her actions land on the right words.
3. **Finish in our edit.**
   - If Seedance's own voice drifts from the Somali, I put the exact ElevenLabs track back (it's already timed to her lips) and add the spray sound.
   - Then I add word-by-word Somali captions and the Falarosa Luxury end card, the same format as our other ads.
4. **Same woman in all five (optional).** The first ad creates her. For the other four, I take a clean frame of her from that video and add it as @Image2 with "@Image2 = the woman; keep her face exactly". No extra image generation is needed.

## Cost (Higgsfield credits)

| Ad | Length | 1080p | 720p | 480p draft |
|---|---|---|---|---|
| Romance N°3 | 20 s | 240 | 140 | 60 |
| Romance N°1 | 19 s | 228 | 133 | 57 |
| Romance N°2 | 18 s | 216 | 126 | 54 |
| Kashmir Musk | 19 s | 228 | 133 | 57 |
| Madawi | 19 s | 228 | 133 | 57 |
| **All five** | | **1,140** | **665** | **285** |

Start with a 480p draft of Romance N°3 (60 credits) to check her lip-sync and look. If it's right, finalize that draft to 1080p and run the other four.

## Realism rules for Seedance 2.5

- **One continuous take with the phone propped up**, like a real "get ready with me" video: on the vanity, in a dashboard mount or on a tripod. Her hands stay free to hold the bottle and spray. A woman holding the phone, the bottle *and* spraying needs a third hand, which is an instant AI giveaway.
- **Use phone-camera words**: "real, unedited iPhone video", "24mm phone lens", "deep depth of field", "slightly grainy", "tiny wobbles", "slightly off-centre framing".
- **Direct her face**: natural blinking, a breath before each line, micro-expressions that follow the words, a real smile with eye crinkles, lips and jaw matching every syllable, tiny head tilts.
- **Never use** "cinematic", "8k", "flawless", "studio lighting" or "airbrushed".
- **Label every reference by role** (@Image1 = bottle, @Audio1 = voice) and put the spoken lines in quotes, so her lips match the Somali.
- **No subtitles or on-screen text** in the generation. We add real captions in the edit.
- **Keep the product still**: one relaxed grip, label to camera, fingers never covering the plate.

## 1. Romance N°3 (Taif Al Emarat): 20 s

References: `seedance/refs/rom3-bottle.jpg` as @Image1, `seedance/voice/rom3-sagal.mp3` as @Audio1.

```
@Image1 = the exact perfume bottle: deep red glass, rose-gold cap and an engraved rose-gold oval plate reading "Romance N°3". @Audio1 = her Somali voice; she speaks these exact lines on its timing and her lips follow it.

Real, unedited iPhone video, filmed on her phone propped on her bedroom vanity at face height. A Somali woman in her late 20s living in Canada: warm deep-brown skin with visible pores and slightly uneven tone, soft brown eyes, natural brows, light everyday makeup, a deep burgundy chiffon hijab wrapped under the chin and a cream blouse. She sits at the vanity in warm golden-hour window light, her tidy bedroom behind her.

[0–5s] She lifts the bottle into frame beside her face, eyebrows up, and says in Somali to the camera, like she's telling a close friend: "Gabdhahow, cadar muddo dheer idin raaca ma rabtaan? Kan eega!" A quick, excited smile on "Kan eega!"
[5–12s] She turns the oval plate toward the lens, glances at it and back to the camera, a small nod on each note: "Romance 3, Taif Al Emarat. Ward Taif, geranium iyo misk jilicsan."
[12–14s] No speech. She sprays once on her inner wrist, a fine mist catching the light, brings the wrist to her nose, closes her eyes for a second, and a slow, real smile spreads across her face.
[14–20s] Back to the lens, warm and sure: "Kani waa midka ugu udgoonka xooggan. Ka hela Falarosa Luxury, Surrey!" She lifts the bottle slightly toward the camera on "Falarosa Luxury", then a small nod and a smile.

Face: natural blinking, a breath before each line, micro-expressions that follow the words, a real smile with eye crinkles, lips and jaw matching every Somali syllable, tiny head tilts, her other hand gesturing naturally.
Camera: static phone with tiny wobbles, slightly off-centre framing, 24mm phone lens, deep depth of field, slightly grainy, unretouched.
Sound: her voice from @Audio1, quiet room tone, one soft spray. No music.
The bottle, cap, oval plate and lettering stay exactly like @Image1, held in one relaxed grip, fingers never covering the oval plate. One continuous take, no cuts, no subtitles, no on-screen text, no watermark.
```

## 2. Romance N°1 (Taif Al Emarat): 19 s

References: `seedance/refs/rom1-bottle.jpg` as @Image1, `seedance/voice/rom1-sagal.mp3` as @Audio1.

```
@Image1 = the exact perfume bottle: amber-yellow glass, rose-gold cap and an engraved gold oval plate reading "Romance N°1". @Audio1 = her Somali voice; she speaks these exact lines on its timing and her lips follow it.

Real, unedited iPhone video, filmed on her phone leaning on a kitchen shelf at face height. A Somali woman in her late 20s living in Canada: warm deep-brown skin with visible pores and slightly uneven tone, soft brown eyes, natural brows, light everyday makeup, a soft mustard-gold chiffon hijab and a white dress. She stands in her kitchen in bright morning sun from the window, a plant and a kettle behind her.

[0–5.5s] She lifts the bottle into frame beside her face, eyebrows up, and says in Somali to the camera, like she's telling a close friend: "Gabdhahow, cadar ubax ah oo iftiin leh ma raadinaysaan? Kan eega!" A quick, bright smile on "Kan eega!"
[5.5–12s] She turns the oval plate toward the lens, glances at it and back to the camera, a small nod on each note: "Romance 1: ubaxa liinta, jasmine, tuberose iyo amber diiran."
[12–13.5s] No speech. She sprays once into the air beside her, leans into the mist, breathes in and turns back to the camera with a bright smile.
[13.5–19s] Back to the lens, warm and sure: "Waxaad ka heli kartaan Falarosa Luxury, Surrey. Nala soo xiriira!" She lifts the bottle slightly toward the camera on "Falarosa Luxury", then a small nod and a smile.

Face: natural blinking, a breath before each line, micro-expressions that follow the words, a real smile with eye crinkles, lips and jaw matching every Somali syllable, tiny head tilts, her other hand gesturing naturally.
Camera: static phone with tiny wobbles, slightly off-centre framing, 24mm phone lens, deep depth of field, slightly grainy, unretouched.
Sound: her voice from @Audio1, quiet room tone, one soft spray. No music.
The bottle, cap, oval plate and lettering stay exactly like @Image1, held in one relaxed grip, fingers never covering the oval plate. One continuous take, no cuts, no subtitles, no on-screen text, no watermark.
```

## 3. Romance N°2 (Taif Al Emarat): 18 s

References: `seedance/refs/rom2-bottle.jpg` as @Image1, `seedance/voice/rom2-sagal.mp3` as @Audio1.

```
@Image1 = the exact perfume bottle: deep navy glass, silver cap and an engraved silver oval plate reading "Romance N°2". @Audio1 = her Somali voice; she speaks these exact lines on its timing and her lips follow it.

Real, unedited iPhone video, filmed on her phone in a dashboard mount. A Somali woman in her late 20s living in Canada: warm deep-brown skin with visible pores and slightly uneven tone, soft brown eyes, natural brows, light everyday makeup, a navy chiffon hijab and a black abaya. She sits in the driver's seat of a parked car, daylight through the windows, seatbelt and headrest visible.

[0–4s] She lifts the bottle into frame beside her face, eyebrows up, and says in Somali to the camera, like she's telling a close friend: "Cadar ragga iyo dumarkaba ku habboon? Waa kan!" Eyebrows up on the question, then a grin on "Waa kan!"
[4–10.5s] She turns the oval plate toward the lens, glances at it and back to the camera, a small nod on each note: "Romance 2: ward Moroccan, rosemary, citrus iyo qori cedar."
[10.5–12s] No speech. She sprays once on her hijab near her neck, breathes in, and gives the camera a confident little nod.
[12–18s] Back to the lens, warm and sure: "Waxaad ka heli kartaan Falarosa Luxury, Surrey. Nala soo xiriira!" She lifts the bottle slightly toward the camera on "Falarosa Luxury", then a small nod and a smile.

Face: natural blinking, a breath before each line, micro-expressions that follow the words, a real smile with eye crinkles, lips and jaw matching every Somali syllable, tiny head tilts, her other hand gesturing naturally.
Camera: static phone with tiny wobbles, slightly off-centre framing, 24mm phone lens, deep depth of field, slightly grainy, unretouched.
Sound: her voice from @Audio1, quiet room tone, one soft spray. No music.
The bottle, cap, oval plate and lettering stay exactly like @Image1, held in one relaxed grip, fingers never covering the oval plate. One continuous take, no cuts, no subtitles, no on-screen text, no watermark.
```

## 4. Kashmir Musk (Arabian Oud): 19 s

References: `seedance/refs/kash-bottle.jpg` as @Image1, `seedance/voice/kash-sagal.mp3` as @Audio1.

```
@Image1 = the exact perfume bottle: a tall clear-glass cylinder of pale golden perfume, a silver-white cap, gold Arabic calligraphy and "KASHMIR MUSK" lettering. @Audio1 = her Somali voice; she speaks these exact lines on its timing and her lips follow it.

Real, unedited iPhone video, filmed on her phone on a small tripod on the coffee table. A Somali woman in her late 20s living in Canada: warm deep-brown skin with visible pores and slightly uneven tone, soft brown eyes, natural brows, light everyday makeup, a light grey chiffon hijab and a soft knit cardigan. She sits on the sofa in her cozy living room at night in warm lamp light; a small gold incense burner sends a thin line of smoke up beside her.

[0–4.5s] She lifts the bottle into frame beside her face, eyebrows up, and says in Somali to the camera, like she's telling a close friend: "Haddii aad jeceshihiin misk jilicsan, kan waa inaad aragtaan!" She leans in a little on "kan waa inaad aragtaan!"
[4.5–11.5s] She turns the label toward the lens, glances at it and back to the camera, a small nod on each note: "Kashmir Musk oo ka socda Arabian Oud: pear, jasmine, misk iyo patchouli."
[11.5–13.5s] No speech. She sprays once on her cardigan sleeve, brings the soft knit to her face, breathes in slowly and smiles.
[13.5–19s] Back to the lens, warm and sure: "Waxaad ka heli kartaan Falarosa Luxury, Surrey. Nala soo xiriira!" She lifts the bottle slightly toward the camera on "Falarosa Luxury", then a small nod and a smile.

Face: natural blinking, a breath before each line, micro-expressions that follow the words, a real smile with eye crinkles, lips and jaw matching every Somali syllable, tiny head tilts, her other hand gesturing naturally.
Camera: static phone with tiny wobbles, slightly off-centre framing, 24mm phone lens, deep depth of field, slightly grainy, unretouched.
Sound: her voice from @Audio1, quiet room tone, one soft spray. No music.
The bottle, cap, label and lettering stay exactly like @Image1, held in one relaxed grip, fingers never covering the label. One continuous take, no cuts, no subtitles, no on-screen text, no watermark.
```

## 5. Madawi (Arabian Oud): 19 s

References: `seedance/refs/mad-bottle.jpg` as @Image1, `seedance/voice/mad-sagal.mp3` as @Audio1.

```
@Image1 = the exact perfume bottle: a white bottle with an engraved rose-gold upper band, a small round medallion and a square white-and-gold cap. @Audio1 = her Somali voice; she speaks these exact lines on its timing and her lips follow it.

Real, unedited iPhone video, filmed on her phone propped against her dressing-table mirror. A Somali woman in her late 20s living in Canada: warm deep-brown skin with visible pores and slightly uneven tone, soft brown eyes, natural brows, light everyday makeup, an ivory chiffon hijab and fresh henna designs on her hands. She sits at the dressing table getting ready for a wedding in soft warm light, gold jewellery and a small dish of henna in front of her.

[0–4.5s] She lifts the bottle into frame beside her face, eyebrows up, and says in Somali to the camera, like she's telling a close friend: "Kani waa Madawi, cadar loo sameeyay xushmadda hooyo!" A proud, soft smile on "xushmadda hooyo".
[4.5–11.5s] She turns the medallion toward the lens, glances at it and back to the camera, a small nod on each note: "Peach, ubaxa tufaaxa, cananaas iyo ward duurjoog. Madawi, Arabian Oud."
[11.5–13s] No speech. She sprays once on her hennaed wrist, brings it to her nose, closes her eyes for a second and smiles softly.
[13–19s] Back to the lens, warm and sure: "Waxaad ka heli kartaan Falarosa Luxury, Surrey. Nala soo xiriira!" She lifts the bottle slightly toward the camera on "Falarosa Luxury", then a small nod and a smile.

Face: natural blinking, a breath before each line, micro-expressions that follow the words, a real smile with eye crinkles, lips and jaw matching every Somali syllable, tiny head tilts, her other hand gesturing naturally.
Camera: static phone with tiny wobbles, slightly off-centre framing, 24mm phone lens, deep depth of field, slightly grainy, unretouched.
Sound: her voice from @Audio1, quiet room tone, one soft spray. No music.
The bottle, cap, medallion and lettering stay exactly like @Image1, held in one relaxed grip, fingers never covering the medallion. One continuous take, no cuts, no subtitles, no on-screen text, no watermark.
```

## Before posting on TikTok

- **AI label:** TikTok requires the "AI-generated" label on realistic AI people and voices. For paid ads, turn on "AI Disclosure" in Ads Manager.
- **Presenter, not customer:** she presents Falarosa's perfumes and never claims she bought or wore them. A fake customer testimonial counts as deceptive marketing under Canada's Competition Act. The lines above are written that way.
