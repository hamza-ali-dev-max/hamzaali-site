#!/usr/bin/env python3
"""UGC finish: Seedance clip + exact Somali VO + gold karaoke captions + Falarosa end card."""
import json, sys
C = json.load(open("caps.json"))
CLIP = float(sys.argv[1]) if len(sys.argv) > 1 else 20.0   # clip length (s)
AUDIO = sys.argv[2] if len(sys.argv) > 2 else "vo.mp3"  # vo.mp3 = exact ElevenLabs Somali voice; seedance-audio.mp3 = the clip's own voice
END = 2.8
TOTAL = round(CLIP + END, 2)
for c in C["caps"]:
    for w in c["w"]:
        if w["t"] == "3": w["t"] = "N°3"
emblem = open("emblem.svgpart").read()
caps_html = "\n".join(f'<div class="cap-line" id="cap-{i}"><span class="cap-pill">' + "".join(f'<span class="cw" id="cw-{i}-{j}">{w["t"]}</span>' for j, w in enumerate(c["w"])) + "</span></div>" for i, c in enumerate(C["caps"]))
html = f"""<!doctype html>
<html><head><meta charset="utf-8" />
<script src="assets/js/gsap.min.js"></script>
<style>
@font-face {{ font-family: "Lora"; src: url("assets/fonts/lora-700.woff2") format("woff2"); font-weight: 700; }}
@font-face {{ font-family: "Lora"; src: url("assets/fonts/lora-600i.woff2") format("woff2"); font-weight: 600; font-style: italic; }}
@font-face {{ font-family: "Cinzel"; src: url("assets/fonts/cinzel-700.woff2") format("woff2"); font-weight: 700; }}
@font-face {{ font-family: "Cinzel"; src: url("assets/fonts/cinzel-900.woff2") format("woff2"); font-weight: 900; }}
html, body {{ margin: 0; background: #0b0a09; }}
#main {{ position: relative; width: 1080px; height: 1920px; overflow: hidden; background: #0b0a09; font-family: "Lora"; }}
#clip {{ position: absolute; left: 0; top: 0; width: 1080px; height: 1920px; object-fit: cover; }}
#caps {{ position: absolute; left: 60px; top: 1330px; width: 840px; height: 190px; }}
.cap-line {{ position: absolute; left: -60px; top: 0; width: 960px; text-align: center; opacity: 0; }}
.cap-pill {{ display: inline-block; white-space: nowrap; padding: 14px 30px 18px; border-radius: 30px; background: rgba(10, 9, 8, 0.78);
  border: 2px solid rgba(212, 174, 92, 0.85); box-shadow: 0 12px 26px rgba(0, 0, 0, 0.45); font-weight: 700; font-size: 60px; line-height: 1.15; }}
.cw {{ display: inline-block; margin: 0 8px; color: #f3ead8; }}
#end {{ position: absolute; inset: 0; opacity: 0; background: #0b0a09 url("assets/lux/marble.jpg") center / cover; }}
#end .frame {{ position: absolute; inset: 26px; border: 2px solid rgba(212, 174, 92, 0.6); border-radius: 6px; }}
#end .logo {{ position: absolute; left: 180px; top: 120px; width: 720px; height: 420px; }}
#end .brand {{ position: absolute; left: 0; width: 1080px; top: 350px; text-align: center; font-family: "Cinzel"; font-weight: 900; font-size: 62px; letter-spacing: .2em; color: #e8c874; }}
#end .sub {{ position: absolute; left: 0; width: 1080px; top: 560px; text-align: center; font-family: "Cinzel"; font-weight: 700; font-size: 30px; letter-spacing: .32em; color: #f3ead8; }}
#end .bottle {{ position: absolute; left: 370px; top: 650px; width: 340px; -webkit-box-reflect: below 6px linear-gradient(transparent 70%, rgba(255,255,255,.18)); }}
#end .name {{ position: absolute; left: 0; width: 1080px; top: 1250px; text-align: center; font-style: italic; font-weight: 600; font-size: 96px;
  color: transparent; background: linear-gradient(180deg, #f7e7b4, #c9a24b 60%, #a07a28); -webkit-background-clip: text; background-clip: text; }}
#end .buy {{ position: absolute; left: 340px; top: 1400px; width: 400px; height: 110px; border-radius: 55px; background: linear-gradient(90deg, #d4ae5c, #f1d98f);
  color: #1a1206; font-family: "Cinzel"; font-weight: 900; font-size: 44px; display: flex; align-items: center; justify-content: center; letter-spacing: .06em; }}
#end .tel {{ position: absolute; left: 0; width: 1080px; top: 1545px; text-align: center; font-weight: 700; font-size: 56px; color: #f3ead8; letter-spacing: .02em; }}
</style></head>
<body>
<div id="main" data-composition-id="main" data-width="1080" data-height="1920" data-duration="{TOTAL}">
  <video id="clip" class="clip" src="assets/clip.mp4" data-start="0" data-duration="{CLIP}" muted playsinline></video>
  <audio id="vo" class="clip" src="assets/{AUDIO}" data-start="0" data-duration="{CLIP}"></audio>
  <div id="caps">
{caps_html}
  </div>
  <div id="end">
    <div class="frame"></div>
    <svg width="0" height="0" style="position:absolute"><defs><linearGradient id="lxgold" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stop-color="#f7e6b0" /><stop offset=".45" stop-color="#d4ae5c" /><stop offset="1" stop-color="#96701f" /></linearGradient>{emblem}</defs></svg>
    <img class="logo" src="assets/logo.png" />
    <div class="sub">SURREY · BC · KANADA</div>
    <img class="bottle" src="assets/bottle.png" />
    <div class="name">Romance N°3</div>
    <div class="buy">HADDA DALBO</div>
    <div class="tel">+1 (604) 396-6638</div>
  </div>
</div>
<script>
  window.__timelines = window.__timelines || {{}};
  const D = {json.dumps({"caps": C["caps"], "clip": CLIP, "total": TOTAL}, ensure_ascii=False)};
  const tl = gsap.timeline({{ paused: true }});
  document.querySelectorAll(".cap-pill").forEach((p) => {{ const n = p.textContent.length; if (n > 20) p.style.fontSize = Math.round(60 * 20 / n) + "px"; }});
  D.caps.forEach((g, gi) => {{
    const line = "#cap-" + gi;
    tl.fromTo(line, {{ opacity: 0, y: 24 }}, {{ opacity: 1, y: 0, duration: 0.16, ease: "power2.out" }}, g.s);
    g.w.forEach((w, wi) => {{ tl.set("#cw-" + gi + "-" + wi, {{ color: "#e8c874" }}, w.s); if (wi > 0) tl.set("#cw-" + gi + "-" + (wi - 1), {{ color: "#f3ead8" }}, w.s); }});
    tl.to(line, {{ opacity: 0, duration: 0.12 }}, Math.min(g.e, D.clip - 0.05));
  }});
  tl.to("#end", {{ opacity: 1, duration: 0.5, ease: "power1.out" }}, D.clip - 0.3);
  tl.fromTo("#end .logo", {{ scale: 0.85, opacity: 0 }}, {{ scale: 1, opacity: 1, duration: 0.6, ease: "power2.out" }}, D.clip);
  tl.fromTo("#end .bottle", {{ y: 80, opacity: 0 }}, {{ y: 0, opacity: 1, duration: 0.6, ease: "power3.out" }}, D.clip + 0.1);
  tl.fromTo(["#end .sub", "#end .name"], {{ y: 30, opacity: 0 }}, {{ y: 0, opacity: 1, duration: 0.45, stagger: 0.12, ease: "power2.out" }}, D.clip + 0.2);
  tl.fromTo("#end .buy", {{ scale: 0.5, opacity: 0 }}, {{ scale: 1, opacity: 1, duration: 0.4, ease: "back.out(2.5)" }}, D.clip + 0.7);
  tl.fromTo("#end .tel", {{ y: 20, opacity: 0 }}, {{ y: 0, opacity: 1, duration: 0.4 }}, D.clip + 0.9);
  tl.set({{}}, {{}}, D.total);
  window.__timelines["main"] = tl;
</script>
</body></html>
"""
open("index.html", "w").write(html)
print("total", TOTAL)
