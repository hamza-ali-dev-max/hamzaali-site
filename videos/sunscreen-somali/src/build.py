#!/usr/bin/env python3
"""Generate index.html for the Somali sunscreen explainer from timing.json.

timing.json holds the ElevenLabs voiceover alignment (scene + word times, already
remapped to the tightened vo_tight.mp3). Scene cuts, SFX placement and captions
are all derived from it so picture stays locked to the Somali dub.
"""
import json
from pathlib import Path

SRC = Path(__file__).parent
ROOT = SRC.parent
T = json.loads((SRC / "timing.json").read_text())
TOTAL = 45.0

scenes = T["scenes"]
cuts = [0.0] + [round(s["s"] - 0.1, 3) for s in scenes[1:]] + [TOTAL]
for i, s in enumerate(scenes):
    s["start"], s["dur"] = cuts[i], round(cuts[i + 1] - cuts[i], 3)

# clamp word starts into their scene (alignment can lead the cut by a frame or two)
by_id = {s["id"]: s for s in scenes}
for w in T["words"]:
    w["s"] = max(w["s"], by_id[w["scene"]]["s"])


def word_time(scene_id, prefix, nth=0, exact=False):
    def match(w):
        word = w["w"].lower().strip(".,:!")
        return word == prefix.lower() if exact else word.startswith(prefix.lower())

    hits = [w for w in T["words"] if w["scene"] == scene_id and match(w)]
    return hits[nth]["s"]


# reveal beats (absolute seconds) keyed to the spoken Somali words
beats = {
    "cloud": word_time("hook", "xitaa"),
    "burn": word_time("uv", "gubasho"),
    "age": word_time("uv", "gabow"),
    "cancer": word_time("uv", "kansarka"),
    "spf": word_time("spf", "SPF"),
    "more": word_time("spf", "ama"),
    "fingers": word_time("amount", "laba", exact=True),
    "face": word_time("amount", "wejiga"),
    "fifteen": word_time("time", "shan"),
    "outside": word_time("time", "bannaanka"),
    "ears": word_time("spots", "dhegaha"),
    "neck": word_time("spots", "qoorta"),
    "hands": word_time("spots", "gacmaha"),
    "feet": word_time("spots", "cagaha"),
    "two": word_time("reapply", "labadii"),
    "swim": word_time("reapply", "dabaalato"),
    "sweat": word_time("reapply", "dhididdo"),
    "everyone": word_time("myth", "Qof"),
    "protect": word_time("cta", "maqaarkaaga"),
    "share": word_time("cta", "U"),
}

# ---- audio: VO + music bed + SFX on every cut and reveal ----
audio = [
    '<audio id="vo" src="assets/audio/vo_muuse.mp3" data-start="0" data-duration="44.09" data-track-index="10" data-volume="1"></audio>',
    '<audio id="bgm" src="assets/audio/bgm.mp3" data-start="0" data-duration="45" data-track-index="11" data-volume="0.22" data-fade-out="1.2"></audio>',
]
for i, c in enumerate(cuts[1:-1], 1):
    audio.append(
        f'<audio id="sfx-whoosh-{i}" src="assets/audio/whoosh.mp3" data-start="{max(0, c - 0.2):.3f}" '
        f'data-duration="0.45" data-track-index="12" data-volume="0.55"></audio>'
    )
pops = ["burn", "age", "cancer", "fingers", "face", "ears", "neck", "hands", "feet", "swim", "sweat"]
for i, k in enumerate(pops):
    audio.append(
        f'<audio id="sfx-pop-{i}" src="assets/audio/pop.mp3" data-start="{beats[k]:.3f}" '
        f'data-duration="0.12" data-track-index="13" data-volume="0.7"></audio>'
    )
for i, k in enumerate(["spf", "outside", "everyone", "protect"]):
    audio.append(
        f'<audio id="sfx-ding-{i}" src="assets/audio/ding.mp3" data-start="{beats[k]:.3f}" '
        f'data-duration="0.9" data-track-index="14" data-volume="0.4"></audio>'
    )

# ---- captions: groups of <=3 words, never across a sentence ----
groups = []
for sc in scenes:
    ws = [w for w in T["words"] if w["scene"] == sc["id"]]
    cur = []
    for w in ws:
        cur.append(w)
        if len(cur) == 3 or w["w"][-1] in ".,:!":
            groups.append(cur)
            cur = []
    if cur:
        groups.append(cur)
cap_data = []
for gi, g in enumerate(groups):
    end = groups[gi + 1][0]["s"] if gi + 1 < len(groups) else TOTAL - 0.4
    end = min(end, g[-1]["e"] + 0.5)
    cap_data.append({"s": g[0]["s"], "e": round(end, 3), "w": [{"t": w["w"].rstrip(".,:!"), "s": w["s"]} for w in g]})
cap_html = []
for gi, g in enumerate(cap_data):
    spans = "".join(f'<span class="cw" id="cw-{gi}-{wi}">{w["t"]}</span>' for wi, w in enumerate(g["w"]))
    cap_html.append(f'<div class="cap-line" id="cap-{gi}"><span class="cap-pill">{spans}</span></div>')

html = (SRC / "template.html.tmpl").read_text()
for s in scenes:
    html = html.replace(f"%{s['id']}.start%", f"{s['start']:.3f}").replace(f"%{s['id']}.dur%", f"{s['dur']:.3f}")
html = html.replace("%AUDIO%", "\n    ".join(audio))
html = html.replace("%CAPTIONS%", "\n        ".join(cap_html))
html = html.replace("%DATA%", json.dumps({"scenes": [{k: s[k] for k in ("id", "start", "dur")} for s in scenes], "beats": beats, "caps": cap_data}))
(ROOT / "index.html").write_text(html)
print("cuts", cuts)
print("beats", beats)
