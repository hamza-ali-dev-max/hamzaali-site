#!/usr/bin/env python3
"""Somali UGC voiceovers via ElevenLabs (proxy-injected key): hook, notes, (spray gap), CTA."""
import json, subprocess, sys, os, urllib.request

VOICES = {"sagal": "AeS32E4Itgqp9n7MqbGl", "ifrah": "jidIgMpfzv7AizCIICKC", "hodan": "NbbZ74oILALxhroI37d2"}
CTA = "Waxaad ka heli kartaan Falarosa Luxury, Surrey. Nala soo xiriira!"
LINES = {
    "rom3": ["Gabdhahow, cadar muddo dheer idin raaca ma rabtaan? Kan eega!",
             "Romance 3, Taif Al Emarat. Ward Taif, geranium iyo misk jilicsan.",
             "Kani waa midka ugu udgoonka xooggan. Ka hela Falarosa Luxury, Surrey!"],
    "rom1": ["Gabdhahow, cadar ubax ah oo iftiin leh ma raadinaysaan? Kan eega!",
             "Romance 1: ubaxa liinta, jasmine, tuberose iyo amber diiran.", CTA],
    "rom2": ["Cadar ragga iyo dumarkaba ku habboon? Waa kan!",
             "Romance 2: ward Moroccan, rosemary, citrus iyo qori cedar.", CTA],
    "kash": ["Haddii aad jeceshihiin misk jilicsan, kan waa inaad aragtaan!",
             "Kashmir Musk oo ka socda Arabian Oud: pear, jasmine, misk iyo patchouli.", CTA],
    "mad":  ["Kani waa Madawi, cadar loo sameeyay xushmadda hooyo!",
             "Peach, ubaxa tufaaxa, cananaas iyo ward duurjoog. Madawi, Arabian Oud.", CTA],
}
LEAD, GAP1, SPRAY, TAIL = 0.35, 0.45, 1.9, 0.5
MODEL = "eleven_v4"

def tts(text, voice, out):
    body = json.dumps({"text": text, "model_id": MODEL, "language_code": "so"}).encode()
    req = urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{VOICES[voice]}?output_format=mp3_44100_192",
                                 data=body, headers={"Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(req, timeout=120) as r:
        open(out, "wb").write(r.read())

def trimmed(src, dst):
    # strip leading/trailing silence, keep 40 ms of air
    f = ("silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.04,"
         "areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.06,areverse")
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", src, "-af", f, "-ar", "44100", "-ac", "1", dst], check=True)
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", dst]))

def build(key, voice, outdir):
    os.makedirs(outdir, exist_ok=True)
    segs, t = [], LEAD
    for i, line in enumerate(LINES[key]):
        raw, cut = f"{outdir}/{key}-{voice}-{i}.raw.mp3", f"{outdir}/{key}-{voice}-{i}.wav"
        tts(line, voice, raw)
        d = trimmed(raw, cut)
        segs.append({"name": ["hook", "notes", "cta"][i], "text": line, "start": round(t, 2), "end": round(t + d, 2), "file": cut})
        t += d + (GAP1 if i == 0 else SPRAY if i == 1 else TAIL)
    total = t
    # assemble with exact gaps
    inputs, filt = [], []
    for i, s in enumerate(segs):
        inputs += ["-i", s["file"]]
        filt.append(f"[{i}]adelay={int(s['start']*1000)}|{int(s['start']*1000)}[a{i}]")
    filt.append("".join(f"[a{i}]" for i in range(len(segs))) + f"amix=inputs={len(segs)}:normalize=0,apad=whole_dur={total:.2f},atrim=0:{total:.2f}[out]")
    out = f"{outdir}/{key}-{voice}.mp3"
    subprocess.run(["ffmpeg", "-y", "-v", "error", *inputs, "-filter_complex", ";".join(filt), "-map", "[out]",
                    "-ar", "44100", "-ac", "1", "-c:a", "libmp3lame", "-b:a", "192k", out], check=True)
    meta = {"key": key, "voice": voice, "model": MODEL, "total": round(total, 2),
            "segments": [{k: v for k, v in s.items() if k != "file"} for s in segs]}
    json.dump(meta, open(f"{outdir}/{key}-{voice}.json", "w"), indent=1, ensure_ascii=False)
    return meta

if __name__ == "__main__":
    voice = sys.argv[1]
    for key in sys.argv[2:]:
        m = build(key, voice, "/tmp/claude-0/hf/ugc/vo")
        print(key, voice, m["total"], [(s["name"], s["start"], s["end"]) for s in m["segments"]])
