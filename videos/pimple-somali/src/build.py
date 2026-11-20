#!/usr/bin/env python3
"""Generate index.html for the Somali pimple explainer from timing.json.

timing.json holds scene + word times for the retimed narration (see
align_external.py). Scene cuts, SFX placement and captions are all derived from
it so picture stays locked to the Somali voiceover.
"""
import json
import subprocess
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
        word = w["w"].lower().strip(".,:!?")
        return word == prefix.lower() if exact else word.startswith(prefix.lower())

    hits = [w for w in T["words"] if w["scene"] == scene_id and match(w)]
    return hits[nth]["s"]


# reveal beats (absolute seconds) keyed to the spoken Somali words
beats = {
    "stop": word_time("hook", "jooji"),
    "scar_hook": word_time("hook", "nabar"),
    "oil": word_time("inside", "saliid"),
    "cells": word_time("inside", "unugyo"),
    "bacteria": word_time("inside", "bakteeriya"),
    "push": word_time("deeper", "gudaha"),
    "swell": word_time("deeper", "bararkuna"),
    "infect": word_time("spread", "caabuqa"),
    "new": word_time("spread", "finan"),
    "scar": word_time("scar", "nabar"),
    "dark": word_time("scar", "bar", exact=True),
    "gentle": word_time("wash", "tartiib"),
    "twice": word_time("wash", "laba", exact=True),
    "cream": word_time("notouch", "kareem"),
    "pain": word_time("doctor", "xanuun"),
    "stay": word_time("doctor", "tegin"),
    "derm": word_time("doctor", "dhakhtarka"),
    "dont": word_time("cta", "ha", exact=True),
    "share": word_time("cta", "U", 1, exact=True),
}

# ---- audio: VO + music bed + SFX on every cut and reveal ----
VO = "assets/audio/vo.mp3"
vo_path = ROOT / VO
vo_dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(vo_path)], capture_output=True, text=True).stdout or 0) if vo_path.exists() else 0
audio = [
    f'<audio id="bgm" src="assets/audio/bgm.mp3" data-start="0" data-duration="45" data-track-index="11" data-volume="0.22" data-fade-out="1.2"></audio>',
]
if vo_dur:
    audio.insert(0, f'<audio id="vo" src="{VO}" data-start="0" data-duration="{vo_dur:.2f}" data-track-index="10" data-volume="1"></audio>')
for i, c in enumerate(cuts[1:-1], 1):
    audio.append(
        f'<audio id="sfx-whoosh-{i}" src="assets/audio/whoosh.mp3" data-start="{max(0, c - 0.2):.3f}" '
        f'data-duration="0.45" data-track-index="12" data-volume="0.55"></audio>'
    )
pops = ["oil", "cells", "bacteria", "new", "scar", "dark", "twice", "pain", "stay"]
for i, k in enumerate(pops):
    audio.append(
        f'<audio id="sfx-pop-{i}" src="assets/audio/pop.mp3" data-start="{beats[k]:.3f}" '
        f'data-duration="0.12" data-track-index="13" data-volume="0.7"></audio>'
    )
for i, k in enumerate(["stop", "cream", "derm", "share"]):
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
        if len(cur) == 3 or w["w"][-1] in ".,:!?":
            groups.append(cur)
            cur = []
    if cur:
        groups.append(cur)
cap_data = []
for gi, g in enumerate(groups):
    end = groups[gi + 1][0]["s"] if gi + 1 < len(groups) else TOTAL - 0.4
    end = min(end, g[-1]["e"] + 0.5)
    cap_data.append({"s": g[0]["s"], "e": round(end, 3), "w": [{"t": w["w"].rstrip(".,:!?"), "s": w["s"]} for w in g]})
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
