# Somali UGC perfume ads: prompt pack

Hyper-realistic "Somali woman talks to her phone" ads for the five Falarosa Luxury perfumes. Every prompt here is copy-ready.

> **Using Seedance 2.5?** See [SEEDANCE.md](SEEDANCE.md): one generation per ad with a real ElevenLabs Somali voice, no stills or separate lip-sync step needed.

## How it works (5 steps)

1. **Make the woman once** (Step 0). Keep that one image and reuse it as the face reference in every later prompt, so all five ads show the same person. In Higgsfield you can train her as a Soul ID instead.
2. **Make one still per ad**: the woman holding the real bottle. Use an image model with reference images, for example Nano Banana Pro. Upload two images: her picture, then the product photo from this repo. This keeps the bottle, cap and plate correct. Text-to-video alone redraws the label.
3. **Animate the still**: image-to-video, 5–8 s per shot, one action per shot. Use Kling 3.0 for hand/spray motion or Veo 3.1 for prompt adherence. Make 2–3 takes of each shot and keep the best.
4. **Somali voice + lip-sync.** No video model speaks Somali reliably; Veo 3.1's lip-sync languages don't include it.
   - Record each line with the **female** Somali voice (`so-SO-UbaxNeural`). Muuse is male.
   - Lip-sync it with an image + audio model: Kling AI Avatar, InfiniteTalk or Speak (all in Higgsfield's Lip-Sync Studio). These accept any language.
5. **Edit**: hook → spray/B-roll with voiceover → call to action, plus the real product close-ups and our Falarosa end card. Upload the clips to `videos/<ad>/assets/ugc/` and I'll cut them in HyperFrames with Somali captions.

### Realism rules (from the research)

- **Start video prompts with "A selfie video of…"** and say her arm is visible at the edge of the frame.
- **Use phone-camera words**: "iPhone front camera", "24mm phone lens", "deep depth of field", "slightly grainy", "subtle handheld shake", "natural window light".
- **Use skin words**: "natural visible pores", "slightly uneven skin tone", "a few flyaway strands at the hijab edge", "unretouched".
- **Never use** "cinematic", "8k", "masterpiece", "flawless", "perfect skin", "studio lighting" or "airbrushed". They make her look AI-generated.
- **Keep each prompt 40–100 words.** Give one action per shot. Keep spoken lines under 8 seconds, which is about 15 Somali words at Ubax's pace.
- **Add "no subtitles, no text"** to every video prompt so the model doesn't burn in captions. We add real Somali captions in the edit.
- **Keep the product still.** Have her hold the bottle steady with the plate to camera. Don't spin it or cover the label, and use one relaxed grip.
- **Sell the feeling**: you can't smell through a screen. Show the notes (roses, citrus, pear) as short inserts with no bottle in them. We then overlay the real bottle cutout in the edit.

### Before posting on TikTok

- **AI label:** TikTok requires the "AI-generated" label on realistic AI people and voices. For paid ads, turn on "AI Disclosure" in Ads Manager.
- **Presenter, not customer:** keep her a presenter for Falarosa, not a customer. Don't script lines like "I bought this last month" or "I've worn it for years". A fake customer testimonial counts as deceptive marketing under Canada's Competition Act. The lines below are written that way.

---

## Step 0: the woman (make once, reuse everywhere)

Image model, portrait 9:16. No references needed.

```
Photorealistic iPhone front-camera selfie of a Somali woman in her late 20s living in Canada. Warm deep-brown skin with natural visible pores and slightly uneven tone, soft dark-brown eyes, full natural brows, light everyday makeup with a brown-toned lip. She wears a soft beige chiffon hijab wrapped neatly under the chin and a cream long dress. Arm's-length selfie, slightly off-centre, relaxed friendly half-smile, looking into the lens. Bright bedroom, natural window light from the left. Shot on a 24mm phone lens, deep depth of field, slightly grainy, unretouched. Not a studio photo, not airbrushed, no text, no watermark.
```

Generate 4–8 of these and pick one face. That image is **reference 1** in everything below.

### Negative prompt (paste into every video tool that has a negative field)

```
text, subtitles, captions, watermark, logo, changing label, redesigned bottle, warped bottle, melting glass, extra fingers, deformed hands, plastic skin, airbrushed, cinematic colour grading, studio lighting, jump cuts
```

### Lip-sync motion prompt (all talking shots, every ad)

Image = the ad's still. Audio = the Ubax line.

```
She talks to the camera like she's telling a close friend, small natural head movements, eyebrows lift on the first words, glances down at the bottle and back to the lens, raises the bottle slightly toward the camera at the end. Handheld phone framing with subtle natural shake, natural blinking. Keep the bottle, cap and plate exactly unchanged.
```

---

## 1. Romance N°3 (Taif Al Emarat): the strongest scent

Product reference (image 2): `videos/romance-no3-somali/assets/photos/bottle-cut.png`
Look: deep burgundy hijab (matches the bottle), bedroom vanity at golden hour.

**Still (image model, 9:16, references 1 + 2):**
```
Use image 1 for the woman's face and image 2 for the perfume bottle. Keep the bottle's shape, rose-gold cap, red glass and oval engraved plate exactly as in image 2; do not redesign it or add text. Realistic iPhone front-camera selfie, vertical 9:16: the same woman, now in a deep burgundy chiffon hijab and cream blouse, sits at her bedroom vanity holding the bottle at chest height with a relaxed natural grip, plate facing the camera. Warm golden-hour window light, a mirror and a few makeup items softly behind her. Natural skin texture, slightly grainy, unretouched phone photo, no text, no watermark.
```

**Shot 1: hook (lip-sync, about 4 s)**
```
edge-tts --voice so-SO-UbaxNeural --rate=+8% --text "Gabdhahow, cadar muddo dheer idin raaca ma rabtaan? Kan eega!" --write-media n3-hook.mp3
```

**Shot 2: spray (image-to-video from the still, 6–8 s, no speech)**
```
A selfie video of the woman at her vanity, her arm visible at the edge of the frame. She lifts the perfume bottle and sprays once on her inner wrist — a fine visible mist in the light — brings the wrist to her nose, closes her eyes for a second, then smiles at the camera. Subtle handheld shake, soft golden window light, slightly grainy phone footage. The bottle, cap and plate stay exactly as in the first frame. Audio: quiet room tone and one soft spray. No music, no speech, no subtitles.
```
Voiceover over this shot:
```
edge-tts --voice so-SO-UbaxNeural --rate=+5% --text "Romance No. 3 oo ka socda Taif Al Emarat. Ward Taif, geranium iyo misk jilicsan." --write-media n3-vo.mp3
```

**Shot 3: call to action (lip-sync, about 5 s)**
```
edge-tts --voice so-SO-UbaxNeural --rate=+8% --text "Kani waa midka ugu udgoonka xooggan. Ka hela Falarosa Luxury, Surrey!" --write-media n3-cta.mp3
```

**Scent insert (optional, text-to-video, no bottle):**
```
Handheld phone macro video of fresh pink Taif roses and rose-geranium leaves on a vanity in warm golden light, slow push-in, one petal falls. No people, no bottle, no text, no subtitles.
```

---

## 2. Romance N°1 (Taif Al Emarat): bright floral

Product reference: `videos/romance-no1-somali/assets/photos/bottle-cut.png`
Look: soft mustard-gold hijab, white dress, sunny kitchen or balcony in the morning.

**Still:**
```
Use image 1 for the woman's face and image 2 for the perfume bottle. Keep the bottle's shape, rose-gold cap, amber-yellow glass and oval engraved plate exactly as in image 2; do not redesign it or add text. Realistic iPhone front-camera selfie, vertical 9:16: the same woman, now in a soft mustard-gold chiffon hijab and a white dress, stands by a sunny kitchen window holding the bottle at chest height with a relaxed natural grip, plate facing the camera. Bright morning light, a plant and a kettle softly behind her. Natural skin texture, slightly grainy, unretouched phone photo, no text, no watermark.
```

**Hook:**
```
edge-tts --voice so-SO-UbaxNeural --rate=+8% --text "Gabdhahow, cadar ubax ah oo iftiin leh ma raadinaysaan? Kan eega!" --write-media n1-hook.mp3
```

**Spray (image-to-video):**
```
A selfie video of the woman by the sunny kitchen window, her arm visible at the edge of the frame. She sprays the perfume once into the air in front of her and steps into the mist, then turns back to the camera with a bright smile. Subtle handheld shake, bright morning light, slightly grainy phone footage. The bottle, cap and plate stay exactly as in the first frame. Audio: quiet room tone and one soft spray. No music, no speech, no subtitles.
```
Voiceover:
```
edge-tts --voice so-SO-UbaxNeural --rate=+5% --text "Romance No. 1: ubaxa liinta, jasmine, tuberose iyo amber diiran." --write-media n1-vo.mp3
```

**Call to action:**
```
edge-tts --voice so-SO-UbaxNeural --rate=+8% --text "Waxaad ka heli kartaan Falarosa Luxury, Surrey. Nala soo xiriira!" --write-media n1-cta.mp3
```

**Scent insert:**
```
Handheld phone macro video of white jasmine and tuberose flowers beside a sliced lemon on a sunny kitchen counter, slow push-in, soft morning light. No people, no bottle, no text, no subtitles.
```

---

## 3. Romance N°2 (Taif Al Emarat): for men and women

Product reference: `videos/romance-no2-somali/assets/photos/bottle-cut.png`
Look: navy hijab, black abaya, sitting in the driver's seat of a parked car. Car selfies are a classic UGC format.

**Still:**
```
Use image 1 for the woman's face and image 2 for the perfume bottle. Keep the bottle's shape, silver cap, deep navy glass and oval engraved silver plate exactly as in image 2; do not redesign it or add text. Realistic iPhone front-camera selfie, vertical 9:16: the same woman, now in a navy chiffon hijab and a black abaya, sits in the driver's seat of a parked car holding the bottle at chest height with a relaxed natural grip, plate facing the camera. Daylight through the windshield, seatbelt and headrest visible. Natural skin texture, slightly grainy, unretouched phone photo, no text, no watermark.
```

**Hook:**
```
edge-tts --voice so-SO-UbaxNeural --rate=+8% --text "Cadar ragga iyo dumarkaba ku habboon? Waa kan!" --write-media n2-hook.mp3
```

**Spray (image-to-video):**
```
A selfie video of the woman in the driver's seat of a parked car, her arm visible at the edge of the frame. She sprays the perfume once on the side of her neck over the hijab edge, breathes in, and gives the camera a confident nod. Subtle handheld shake, daylight through the windshield, slightly grainy phone footage. The bottle, cap and plate stay exactly as in the first frame. Audio: quiet car interior and one soft spray. No music, no speech, no subtitles.
```
Voiceover:
```
edge-tts --voice so-SO-UbaxNeural --rate=+5% --text "Romance No. 2: ward Moroccan, rosemary, citrus iyo qori cedar." --write-media n2-vo.mp3
```

**Call to action:**
```
edge-tts --voice so-SO-UbaxNeural --rate=+8% --text "Waxaad ka heli kartaan Falarosa Luxury, Surrey. Nala soo xiriira!" --write-media n2-cta.mp3
```

**Scent insert:**
```
Handheld phone macro video of pink roses, a rosemary sprig, an orange slice and a piece of cedar wood on a wooden table, slow push-in, soft daylight. No people, no bottle, no text, no subtitles.
```

---

## 4. Kashmir Musk (Arabian Oud): soft musk

Product reference: `videos/kashmir-musk-somali/assets/photos/bottle-cut.png`
Look: light grey hijab, soft knit cardigan (the "cashmere" feel), cozy living room at night with an incense burner (dabqaad).

**Still:**
```
Use image 1 for the woman's face and image 2 for the perfume bottle. Keep the bottle's tall clear-glass shape, white cap and the Arabic calligraphy label exactly as in image 2; do not redesign it or add text. Realistic iPhone front-camera selfie, vertical 9:16: the same woman, now in a light grey chiffon hijab and a soft knit cardigan, sits on a sofa in a cozy living room at night holding the bottle at chest height with a relaxed natural grip, label facing the camera. Warm lamp light, a small gold incense burner with a thin line of smoke on the side table. Natural skin texture, slightly grainy, unretouched phone photo, no text, no watermark.
```

**Hook:**
```
edge-tts --voice so-SO-UbaxNeural --rate=+8% --text "Haddii aad jeceshihiin misk jilicsan, kan waa inaad aragtaan!" --write-media km-hook.mp3
```

**Spray (image-to-video):**
```
A selfie video of the woman on the sofa, her arm visible at the edge of the frame. She sprays the perfume once on her cardigan sleeve, brings the soft knit to her face, breathes in slowly and smiles at the camera. Thin incense smoke drifts behind her. Subtle handheld shake, warm lamp light, slightly grainy phone footage. The bottle, cap and label stay exactly as in the first frame. Audio: quiet room tone and one soft spray. No music, no speech, no subtitles.
```
Voiceover:
```
edge-tts --voice so-SO-UbaxNeural --rate=+5% --text "Kashmir Musk oo ka socda Arabian Oud: pear, jasmine, misk iyo patchouli." --write-media km-vo.mp3
```

**Call to action:**
```
edge-tts --voice so-SO-UbaxNeural --rate=+8% --text "Waxaad ka heli kartaan Falarosa Luxury, Surrey. Nala soo xiriira!" --write-media km-cta.mp3
```

**Scent insert:**
```
Handheld phone macro video of a ripe pear, pink peppercorns and a soft grey cashmere scarf on a side table in warm lamp light, slow push-in. No people, no bottle, no text, no subtitles.
```

---

## 5. Madawi (Arabian Oud): made in honour of a mother

Product reference: `videos/madawi-somali/assets/photos/bottle-cut.png` (the official photo is the Madawi White edition)
Look: ivory hijab with gold embroidery and henna on her hands, getting ready for an aroos (wedding) in front of a mirror.

**Still:**
```
Use image 1 for the woman's face and image 2 for the perfume bottle. Keep the bottle's white base, ornate rose-gold engraved top and round Madawi medallion exactly as in image 2; do not redesign it or add text. Realistic iPhone front-camera selfie, vertical 9:16: the same woman, now in an ivory chiffon hijab with fine gold embroidery and fresh dark henna patterns on her hands, sits in front of a mirror getting ready for a wedding, holding the bottle at chest height with a relaxed natural grip, medallion facing the camera. Soft warm light, a jewellery box on the table. Natural skin texture, slightly grainy, unretouched phone photo, no text, no watermark.
```

**Hook:**
```
edge-tts --voice so-SO-UbaxNeural --rate=+8% --text "Kani waa Madawi, cadar loo sameeyay xushmadda hooyo!" --write-media md-hook.mp3
```

**Spray (image-to-video):**
```
A selfie video of the woman getting ready in front of the mirror, her hennaed arm visible at the edge of the frame. She sprays the perfume once on both inner wrists, touches the wrists together, then looks up at the camera with a warm smile. Subtle handheld shake, soft warm light, slightly grainy phone footage. The bottle and medallion stay exactly as in the first frame. Audio: quiet room tone and one soft spray. No music, no speech, no subtitles.
```
Voiceover:
```
edge-tts --voice so-SO-UbaxNeural --rate=+5% --text "Peach, ubaxa tufaaxa, cananaas iyo ward duurjoog. Madawi, Arabian Oud." --write-media md-vo.mp3
```

**Call to action:**
```
edge-tts --voice so-SO-UbaxNeural --rate=+8% --text "Waxaad ka heli kartaan Falarosa Luxury, Surrey. Nala soo xiriira!" --write-media md-cta.mp3
```

**Scent insert:**
```
Handheld phone macro video of a ripe peach, pale pink apple blossoms and a slice of pineapple on a mirrored tray in soft warm light, slow push-in. No people, no bottle, no text, no subtitles.
```

---

## What to upload for the edit

For each ad, put the clips in `videos/<ad>-somali/assets/ugc/`:
- `hook.mp4`
- `spray.mp4`
- `cta.mp4`
- optional: `insert.mp4`
- the `*-vo.mp3` voiceover

I'll assemble them at 1080×1920: hook → spray + voiceover → scent insert with the real bottle cutout → real product close-up → call to action → Falarosa end card. I'll add Somali word-by-word captions, and the phone number on the end card once you send it. Each ad comes out at about 20–25 s.

## Sources

- [Google Cloud: Ultimate prompting guide for Veo 3.1](https://cloud.google.com/blog/products/ai-machine-learning/ultimate-prompting-guide-for-veo-3-1)
- [Google: Veo 3.1 Ingredients to Video](https://blog.google/innovation-and-ai/technology/ai/veo-3-1-ingredients-to-video/)
- [Sabrina Ramonov: AI selfie videos with Veo 3](https://www.sabrina.dev/p/ai-selfie-videos-with-veo3)
- [Replicate: How to prompt Veo 3](https://replicate.com/blog/using-and-prompting-veo-3)
- [Veo 3 dialogue and audio guide](https://eastondev.com/blog/en/posts/ai/20251207-veo3-audio-generation-guide/)
- [Atlas Cloud: Veo 3.1 vs Kling 3.0 native audio and languages](https://www.atlascloud.ai/blog/guides/ai-video-models-native-audio-compared)
- [fal: Kling 3.0 prompting guide](https://blog.fal.ai/kling-3-0-prompting-guide/)
- [Krea: best AI video models for UGC shorts in 2026](https://www.krea.ai/blog/the-5-best-ai-video-models-for-ugc-shorts-in-2026)
- [Higgsfield: Kling AI Avatar (image + audio lip-sync)](https://higgsfield.ai/blog/2x1QJG6uo5MC5SgAzlkl0M)
- [Higgsfield: Soul ID character consistency](https://higgsfield.ai/blog/sould-id-best-character-consistency)
- [getimg: why AI skin looks fake](https://getimg.ai/blog/why-ai-skin-looks-fake-how-to-make-it-real)
- [Azure Somali voices (Ubax, female)](https://json2video.com/ai-voices/azure/languages/somali/)
- [TikTok AI-content labels for advertisers, 2026](https://www.cinerads.com/blog/tiktok-ai-content-policy)
- [Competition Bureau Canada: influencer marketing and the Competition Act](https://competition-bureau.canada.ca/en/deceptive-marketing-practices/types-deceptive-marketing-practices/influencer-marketing-and-competition-act)
