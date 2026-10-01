#!/usr/bin/env python3
"""Generate index.html for the Somali tretinoin explainer from timing.json.

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
# video length follows the narration: last word + a short hold on the call to action
TOTAL = round((max(s["e"] for s in T["scenes"]) + 1.2) * 2) / 2

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
        word = w["w"].lower().strip(".,:;!?")
        return word == prefix.lower() if exact else word.startswith(prefix.lower())

    hits = [w for w in T["words"] if w["scene"] == scene_id and match(w)]
    return hits[nth]["s"]


# reveal beats (absolute seconds) keyed to the spoken Somali words
beats = {
    "name": word_time("q", "tretinoin"),
    "topical": word_time("what", "mariyo"),
    "vitA": word_time("what", "fitamiin"),
    "acne": word_time("acne", "finanka"),
    "unclog": word_time("acne", "furista"),
    "newcells": word_time("cells", "unugyo"),
    "lines": word_time("lines", "laalaabka"),
    "night": word_time("patience", "habeen"),
    "weeks": word_time("patience", "toddobaadyo"),
    "months": word_time("patience", "bilo"),
    "steady": word_time("steady", "joogto"),
    "doctor": word_time("steady", "dhakhtarka"),
    "much": word_time("toomuch", "badan"),
    "notfaster": word_time("toomuch", "dedejiso"),
    "dryness": word_time("toomuch", "qallayl"),
    "itch": word_time("toomuch", "cuncun"),
    "spf": word_time("sun", "qorraxda"),
    "rx": word_time("sun", "tilmaamaha"),
    "preg": word_time("preg", "uur"),
    "plan": word_time("preg", "qorshaynayso"),
    "askdoc": word_time("preg", "dhakhtar"),
    "follow": word_time("cta", "soco"),
    "brand": word_time("cta", "skincare"),
    "care": word_time("cta", "daryeesho"),
}

# ---- audio: VO + music bed + SFX on every cut and reveal ----
VO = "assets/audio/vo.mp3"
vo_path = ROOT / VO
vo_dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(vo_path)], capture_output=True, text=True).stdout or 0) if vo_path.exists() else 0
audio = [
    f'<audio id="bgm" src="assets/audio/bgm.mp3" data-start="0" data-duration="{TOTAL}" data-track-index="11" data-volume="0.22" data-fade-out="1.2"></audio>',
]
if vo_dur:
    audio.insert(0, f'<audio id="vo" src="{VO}" data-start="0" data-duration="{vo_dur:.2f}" data-track-index="10" data-volume="1"></audio>')
for i, c in enumerate(cuts[1:-1], 1):
    audio.append(
        f'<audio id="sfx-whoosh-{i}" src="assets/audio/whoosh.mp3" data-start="{max(0, c - 0.2):.3f}" '
        f'data-duration="0.45" data-track-index="12" data-volume="0.55"></audio>'
    )
pops = ["topical", "vitA", "unclog", "newcells", "lines", "weeks", "months", "notfaster", "dryness", "itch", "rx", "plan"]
for i, k in enumerate(pops):
    audio.append(
        f'<audio id="sfx-pop-{i}" src="assets/audio/pop.mp3" data-start="{beats[k]:.3f}" '
        f'data-duration="0.12" data-track-index="13" data-volume="0.7"></audio>'
    )
for i, k in enumerate(["name", "doctor", "spf", "askdoc", "follow"]):
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
        if len(cur) == 3 or w["w"][-1] in ".,:;!?":
            groups.append(cur)
            cur = []
    if cur:
        groups.append(cur)
cap_data = []
for gi, g in enumerate(groups):
    end = groups[gi + 1][0]["s"] if gi + 1 < len(groups) else TOTAL - 0.4
    end = min(end, g[-1]["e"] + 0.5)
    cap_data.append({"s": g[0]["s"], "e": round(end, 3), "w": [{"t": w["w"].rstrip(".,:;!?"), "s": w["s"]} for w in g]})
cap_html = []
for gi, g in enumerate(cap_data):
    spans = "".join(f'<span class="cw" id="cw-{gi}-{wi}">{w["t"]}</span>' for wi, w in enumerate(g["w"]))
    cap_html.append(f'<div class="cap-line" id="cap-{gi}"><span class="cap-pill">{spans}</span></div>')

html = (SRC / "template.html.tmpl").read_text()
for s in scenes:
    html = html.replace(f"%{s['id']}.start%", f"{s['start']:.3f}").replace(f"%{s['id']}.dur%", f"{s['dur']:.3f}")
html = html.replace("%TOTAL%", f"{TOTAL:g}")
html = html.replace("%AUDIO%", "\n    ".join(audio))
html = html.replace("%CAPTIONS%", "\n        ".join(cap_html))
html = html.replace("%DATA%", json.dumps({"total": TOTAL, "scenes": [{k: s[k] for k in ("id", "start", "dur")} for s in scenes], "beats": beats, "caps": cap_data}))
(ROOT / "index.html").write_text(html)
print("cuts", cuts)
print("beats", beats)
