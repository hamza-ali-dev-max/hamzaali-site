#!/usr/bin/env python3
"""Build Seedance 2.5 omni-reference prompts from the voiceover timings (vo/<key>-sagal.json)."""
import json, math

VO = "/home/user/hamzaali-site/videos/ugc-ads/seedance/voice"
P = {
 "rom3": dict(name="Romance N°3 (Taif Al Emarat)",
   bottle="deep red glass, rose-gold cap and an engraved rose-gold oval plate reading \"Romance N°3\"", part="oval plate",
   outfit="a deep burgundy chiffon hijab wrapped under the chin and a cream blouse",
   prop="propped on her bedroom vanity at face height",
   scene="She sits at the vanity in warm golden-hour window light, her tidy bedroom behind her.",
   hook_beat="A quick, excited smile on \"Kan eega!\"",
   spray="She sprays once on her inner wrist, a fine mist catching the light, brings the wrist to her nose, closes her eyes for a second, and a slow, real smile spreads across her face."),
 "rom1": dict(name="Romance N°1 (Taif Al Emarat)",
   bottle="amber-yellow glass, rose-gold cap and an engraved gold oval plate reading \"Romance N°1\"", part="oval plate",
   outfit="a soft mustard-gold chiffon hijab and a white dress",
   prop="leaning on a kitchen shelf at face height",
   scene="She stands in her kitchen in bright morning sun from the window, a plant and a kettle behind her.",
   hook_beat="A quick, bright smile on \"Kan eega!\"",
   spray="She sprays once into the air beside her, leans into the mist, breathes in and turns back to the camera with a bright smile."),
 "rom2": dict(name="Romance N°2 (Taif Al Emarat)",
   bottle="deep navy glass, silver cap and an engraved silver oval plate reading \"Romance N°2\"", part="oval plate",
   outfit="a navy chiffon hijab and a black abaya",
   prop="in a dashboard mount",
   scene="She sits in the driver's seat of a parked car, daylight through the windows, seatbelt and headrest visible.",
   hook_beat="Eyebrows up on the question, then a grin on \"Waa kan!\"",
   spray="She sprays once on her hijab near her neck, breathes in, and gives the camera a confident little nod."),
 "kash": dict(name="Kashmir Musk (Arabian Oud)",
   bottle="a tall clear-glass cylinder of pale golden perfume, a silver-white cap, gold Arabic calligraphy and \"KASHMIR MUSK\" lettering", part="label",
   outfit="a light grey chiffon hijab and a soft knit cardigan",
   prop="on a small tripod on the coffee table",
   scene="She sits on the sofa in her cozy living room at night in warm lamp light; a small gold incense burner sends a thin line of smoke up beside her.",
   hook_beat="She leans in a little on \"kan waa inaad aragtaan!\"",
   spray="She sprays once on her cardigan sleeve, brings the soft knit to her face, breathes in slowly and smiles."),
 "mad": dict(name="Madawi (Arabian Oud)",
   bottle="a white bottle with an engraved rose-gold upper band, a small round medallion and a square white-and-gold cap", part="medallion",
   outfit="an ivory chiffon hijab and fresh henna designs on her hands",
   prop="propped against her dressing-table mirror",
   scene="She sits at the dressing table getting ready for a wedding in soft warm light, gold jewellery and a small dish of henna in front of her.",
   hook_beat="A proud, soft smile on \"xushmadda hooyo\".",
   spray="She sprays once on her hennaed wrist, brings it to her nose, closes her eyes for a second and smiles softly."),
}

def r(x):  # nearest half second
    return f"{math.floor(x * 2 + 0.5) / 2:g}"

def build(key):
    c, m = P[key], json.load(open(f"{VO}/{key}-sagal.json"))
    h, n, a = m["segments"]
    dur = int(round(m["total"]))
    t0, t1 = f"0–{r((h['end'] + n['start']) / 2)}s", f"{r((h['end'] + n['start']) / 2)}–{r(n['end'] + 0.1)}s"
    t2, t3 = f"{r(n['end'] + 0.1)}–{r(a['start'])}s", f"{r(a['start'])}–{dur}s"
    prompt = f"""@Image1 = the exact perfume bottle: {c['bottle']}. @Audio1 = her Somali voice; she speaks these exact lines on its timing and her lips follow it.

Real, unedited iPhone video, filmed on her phone {c['prop']}. A Somali woman in her late 20s living in Canada: warm deep-brown skin with visible pores and slightly uneven tone, soft brown eyes, natural brows, light everyday makeup, {c['outfit']}. {c['scene']}

[{t0}] She lifts the bottle into frame beside her face, eyebrows up, and says in Somali to the camera, like she's telling a close friend: "{h['text']}" {c['hook_beat']}
[{t1}] She turns the {c['part']} toward the lens, glances at it and back to the camera, a small nod on each note: "{n['text']}"
[{t2}] No speech. {c['spray']}
[{t3}] Back to the lens, warm and sure: "{a['text']}" She lifts the bottle slightly toward the camera on "Falarosa Luxury", then a small nod and a smile.

Face: natural blinking, a breath before each line, micro-expressions that follow the words, a real smile with eye crinkles, lips and jaw matching every Somali syllable, tiny head tilts, her other hand gesturing naturally.
Camera: static phone with tiny wobbles, slightly off-centre framing, 24mm phone lens, deep depth of field, slightly grainy, unretouched.
Sound: her voice from @Audio1, quiet room tone, one soft spray. No music.
The bottle, cap, {c['part']} and lettering stay exactly like @Image1, held in one relaxed grip, fingers never covering the {c['part']}. One continuous take, no cuts, no subtitles, no on-screen text, no watermark."""
    return dict(key=key, name=c["name"], duration=dur, prompt=prompt)

if __name__ == "__main__":
    out = [build(k) for k in P]
    json.dump(out, open("/tmp/claude-0/hf/ugc/prompts.json", "w"), indent=1, ensure_ascii=False)
    for o in out:
        print(o["key"], o["duration"], len(o["prompt"].split()), "words", len(o["prompt"]), "chars")
    print(out[0]["prompt"])
