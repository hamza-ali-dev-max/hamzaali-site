#!/usr/bin/env python3
"""Build template.html.tmpl + beats for a Taif Al Emarat Romance product ad.

usage: romgen.py <n>   (writes /tmp/claude-0/hf/rom<n>/src/template.html.tmpl and patches build.py)
Scenes: hook, s2, s3, s4 (product-specific), how, fire, store, cta (shared).
"""
import re
import sys

N = sys.argv[1]
ROOT = f"/tmp/claude-0/hf/rom{N}"
OUD = open("/tmp/claude-0/hf/oud/src/template.html.tmpl").read()

# ---------- small builders ----------
def cut(i, src, x, y, w, h):
    return f'<div class="cut" id="{i}" style="left:{x}px;top:{y}px;width:{w}px;height:{h}px"><img src="assets/photos/{src}" alt="" /></div>'

def rphoto(i, src, x, y, d):
    return f'<div class="photo round" id="{i}" style="left:{x}px;top:{y}px;width:{d}px;height:{d}px"><img src="assets/photos/{src}" alt="" /></div>'

def lab(i, text, color, x, y, fs=None):
    st = f"left:{x}px;top:{y}px" + (f";font-size:{fs}px" if fs else "")
    return f'<div class="lab tag" id="{i}" style="{st}"><i style="background:{color}"></i>{text}</div>'

def disc(i, svg, x, y, d, ban=False):
    b = f'<svg class="banx" id="{i}-ban" viewBox="0 0 200 200"><g fill="none" stroke="#b8452f" stroke-width="14"><circle cx="100" cy="100" r="86" /><path d="M40 40 L160 160" /></g></svg>' if ban else ""
    return f'<div class="disc2" id="{i}" style="left:{x}px;top:{y}px;width:{d}px;height:{d}px">{svg}{b}</div>'

def hl(words, y=False):
    return " ".join(f'<span class="hw{" y" if y else ""}">{w}</span>' for w in words.split())

def section(sid, chip, big, small, body, alt=False):
    return f'''      <section id="s-{sid}" class="clip" data-start="%{sid}.start%" data-duration="%{sid}.dur%" data-track-index="1">
        <div class="stage">
          <div class="chip{' alt' if alt else ''}"><i></i>{chip}<i></i></div>
          <div class="headline"><span class="hl">{hl(big, True)}</span><span class="hl sm">{hl(small)}</span></div>
          <div class="visual">
            {chr(10).join('            ' + b for b in body).lstrip()}
          </div>
        </div>
      </section>
'''

# icons
FLAG = '<svg width="150" height="100" viewBox="0 0 150 100"><rect width="150" height="100" rx="8" fill="#fff" stroke="#ddd" stroke-width="3" /><rect x="40" y="0" width="110" height="33" fill="#00843d" /><rect x="40" y="67" width="110" height="33" fill="#000" /><rect x="0" y="0" width="40" height="100" fill="#c8102e" /></svg>'
HAND = '<svg width="140" height="150" viewBox="0 0 140 150"><g fill="#c08a68"><rect x="36" y="26" width="16" height="64" rx="8" /><rect x="54" y="14" width="16" height="74" rx="8" /><rect x="72" y="18" width="16" height="70" rx="8" /><rect x="90" y="30" width="15" height="60" rx="7" /><path d="M30 80 Q28 60 20 52 Q14 44 22 40 Q32 38 40 60 L40 80Z" /><path d="M32 78 H106 V110 Q106 128 88 132 H50 Q34 128 32 110Z" /><rect x="46" y="128" width="46" height="22" /></g><path d="M40 138 H100" stroke="#c9a24b" stroke-width="6" /></svg>'
NECK = '<svg width="140" height="150" viewBox="0 0 140 150"><path d="M70 10 C104 10 118 36 116 70 C114 96 104 110 96 118 L124 150 H16 L44 118 C36 110 26 96 24 70 C22 36 36 10 70 10Z" fill="#1c3f86" /><ellipse cx="70" cy="66" rx="30" ry="36" fill="#c08a68" /><path d="M52 110 Q70 128 88 110 V130 H52Z" fill="#c08a68" /></svg>'
FLAME = '<svg width="120" height="140" viewBox="0 0 120 140"><path d="M60 8 C70 40 100 52 100 90 A40 40 0 0 1 20 90 C20 66 36 58 40 36 C50 50 52 60 60 64 C64 46 58 28 60 8Z" fill="#ff8a3c" /><path d="M60 60 C66 78 82 84 80 104 A20 20 0 0 1 40 104 C40 90 52 84 60 60Z" fill="#ffd166" /></svg>'
HEAT = '<svg width="130" height="130" viewBox="0 0 130 130"><circle cx="65" cy="65" r="30" fill="#e3c173" /><g stroke="#c9a24b" stroke-width="10" stroke-linecap="round"><path d="M65 8 v16 M65 106 v16 M8 65 h16 M106 65 h16 M24 24 l11 11 M95 95 l11 11 M24 106 l11 -11 M95 35 l11 -11" /></g></svg>'
SNOW = '<svg width="130" height="130" viewBox="0 0 130 130"><g stroke="#6fa4e8" stroke-width="10" stroke-linecap="round" fill="none"><path d="M65 10 V120 M17 37 L113 93 M17 93 L113 37" /><path d="M50 18 L65 32 L80 18 M50 112 L65 98 L80 112" /></g></svg>'
DRY = '<svg width="120" height="130" viewBox="0 0 120 130"><rect x="14" y="30" width="92" height="90" rx="16" fill="#efe4d2" /><path d="M14 56 H106" stroke="#c9a24b" stroke-width="6" /><rect x="34" y="10" width="52" height="26" rx="8" fill="#c9a24b" /><path d="M60 70 Q72 88 72 96 A12 12 0 0 1 48 96 Q48 88 60 70Z" fill="#6fa4e8" /></svg>'
KID = '<svg width="130" height="140" viewBox="0 0 130 140"><circle cx="65" cy="40" r="26" fill="#c08a68" /><path d="M25 136 V96 Q25 72 65 72 Q105 72 105 96 V136Z" fill="#c9a24b" /></svg>'
MIST = '<svg id="mist" viewBox="0 0 240 200" style="position:absolute;left:%dpx;top:%dpx;width:240px;height:200px"><g fill="#bfe0ff" opacity=".85">%s</g></svg>' % (0, 0, "".join(f'<circle class="md" cx="{cx}" cy="{cy}" r="{r}" />' for cx, cy, r in [(30, 100, 10), (70, 80, 14), (70, 124, 12), (110, 60, 16), (112, 104, 18), (112, 148, 14), (160, 50, 18), (164, 100, 22), (160, 152, 18), (210, 70, 16), (214, 128, 20)]))

# ---------- per-product config ----------
P = {
    "3": dict(name="Romance N°3", metal="Dahab", mcol="#c9a24b", body="#b8243a",
              beats={"quraarad": ("s2", "quraarad"), "saxan": ("s2", "saxan"), "dabool": ("s2", "dabool"),
                     "made": ("s3", "imaaraadka"), "ml": ("s3", "toddobaatan"),
                     "alc": ("s4", "aalkolo"), "oil": ("s4", "saliid"), "cit": ("s4", "citrus")}),
    "1": dict(name="Romance N°1", metal="Dahab", mcol="#c9a24b", body="#e0b21c",
              beats={"box": ("s2", "sanduuqa"), "mark": ("s2", "calaamad"), "taif": ("s2", "taif"), "num": ("s2", "lambarka"),
                     "goobo": ("s3", "goobo"), "dcol": ("s3", "dahab-midab"), "saxan": ("s3", "saxan"),
                     "cap": ("s4", "dabooluna"), "shine": ("s4", "dhalaalaya"), "lux": ("s4", "qaali")}),
    "2": dict(name="Romance N°2", metal="Lacag", mcol="#aab4c0", body="#1d2f55",
              beats={"quraarad": ("s2", "quraarad"), "madow": ("s2", "madow"), "saxan": ("s2", "saxan"), "naqshad": ("s2", "naqshad"),
                     "plate": ("s3", "saxanka"), "taif": ("s3", "taif"), "flow": ("s3", "ubaxyada"),
                     "cap": ("s4", "dabooluna"), "shine": ("s4", "dhalaalaysa"), "modern": ("s4", "casri")}),
}[N]
num = N
B = dict(P["beats"])
B.update({"brand": ("hook", "taif"), "coll": ("hook", "ururka"),
          "spray": ("how", "rusheey"), "hand": ("how", "gacmaha"), "neck": ("how", "qoorta"), "ext": ("how", "dibaddiisa"),
          "flam": ("fire", "shidmi"), "dry": ("fire", "qalasho"), "fire": ("fire", "dabka"), "heat": ("fire", "kulaylka"),
          "cool": ("store", "qabow"), "dryst": ("store", "qalalan"), "kids": ("store", "carruurtana"),
          "cname": ("cta", "romance"), "emi": ("cta", "imaaraati"), "buy": ("cta", "hadda")})
M, MC, BC = P["metal"], P["mcol"], P["body"]
js = []  # (kind, selector, time-expr)
def at(kind, sel, t):
    js.append((kind, sel, t))

scenes = []
# 1 hook
scenes.append(section("hook", "TAIF AL EMARAT", f"Romance N°{num}", "ururka Romance", [
    cut("h-bottle", "bottle-cut.png", 250, 0, 400, 575),
    '<svg id="h-spark" viewBox="0 0 880 640" style="position:absolute;left:0;top:0;width:880px;height:640px"><g fill="#c9a24b"><path class="hs" d="M150 120 l12 28 28 12 -28 12 -12 28 -12 -28 -28 -12 28 -12z" /><path class="hs" d="M740 80 l10 22 22 10 -22 10 -10 22 -10 -22 -22 -10 22 -10z" /><path class="hs" d="M760 420 l12 28 28 12 -28 12 -12 28 -12 -28 -28 -12 28 -12z" /><path class="hs" d="M110 440 l8 18 18 8 -18 8 -8 18 -8 -18 -18 -8 18 -8z" /></g></svg>',
]))
at("rise", "#h-bottle", "S.hook.start+0.1")
at("sparks", ".hs", "B.brand-0.2")

# 2-4 product-specific
if N == "3":
    scenes.append(section("s2", "QURAARADDA", "Guduud", "saxan iyo dabool dahab", [
        cut("a-bottle", "bottle-cut.png", 10, 20, 380, 546),
        rphoto("a-plate", "plate-crop.png", 440, 0, 200),
        rphoto("a-cap", "cap-crop.png", 670, 0, 200),
        lab("a-1", "Guduud-buni", BC, 430, 250),
        lab("a-2", "Saxan dahab", MC, 430, 350),
        lab("a-3", "Dabool dahab", MC, 430, 450),
    ]))
    at("pop", "#a-bottle", "S.s2.start+0.1"); at("pop", "#a-1", "B.quraarad+0.3")
    at("pop", "#a-plate", "B.saxan-0.2"); at("pop", "#a-2", "B.saxan+0.1")
    at("pop", "#a-cap", "B.dabool-0.2"); at("pop", "#a-3", "B.dabool+0.1")
    scenes.append(section("s3", "SAMAYSKA", "Imaaraadka", "75 mililitir", [
        cut("b-box", "box-cut.png", 60, 10, 300, 578),
        disc("b-flag", FLAG, 470, 20, 230),
        lab("b-1", "Imaaraadka", "#00843d", 420, 280),
        '<div class="disc2" id="b-ml" style="left:560px;top:380px;width:220px;height:220px;background:linear-gradient(135deg,#ecd08c,#c9a24b);flex-direction:column"><span style="font-family:Cinzel;font-weight:900;font-size:76px;color:#4a2e1a;line-height:1">75</span><span style="font-family:Cinzel;font-weight:900;font-size:40px;color:#4a2e1a">ML</span></div>',
    ]))
    at("pop", "#b-box", "S.s3.start+0.1"); at("pop", "#b-flag", "B.made-0.2"); at("pop", "#b-1", "B.made+0.1"); at("pop", "#b-ml", "B.ml")
    card = '''<svg id="c-card" class="stk" viewBox="0 0 500 560" style="position:absolute;left:10px;top:0;width:500px;height:560px"><rect x="10" y="10" width="480" height="540" rx="28" fill="#fffdf6" /><text x="250" y="90" text-anchor="middle" font-family="Cinzel" font-weight="900" font-size="36" fill="#8a5a36">WALXAHA</text><path d="M60 118 H440" stroke="#c9a24b" stroke-width="4" />
<g font-family="Lora" font-weight="700" font-size="36" fill="#4a2e1a"><g id="c-r1"><rect class="hi" x="36" y="160" width="428" height="80" rx="16" fill="#f6e3b0" /><text x="70" y="212">Aalkolo dabiici</text></g><g id="c-r2"><rect class="hi" x="36" y="270" width="428" height="80" rx="16" fill="#f6e3b0" /><text x="70" y="322">Saliid udgoon</text></g><g id="c-r3"><rect class="hi" x="36" y="380" width="428" height="80" rx="16" fill="#f6e3b0" /><text x="70" y="432">Citrus</text></g></g></svg>'''
    scenes.append(section("s4", "MAXAA KU JIRA?", "Walxaha", "qoraalka gadaal", [
        card, cut("c-bottle", "bottle-cut.png", 560, 60, 300, 431),
        '<svg id="c-lemon" viewBox="0 0 120 120" style="position:absolute;left:470px;top:400px;width:120px;height:120px"><circle cx="60" cy="60" r="50" fill="#ffd84a" stroke="#e8b400" stroke-width="6" /><g stroke="#fff4b0" stroke-width="5"><path d="M60 16 V104 M16 60 H104 M29 29 L91 91 M29 91 L91 29" /></g></svg>',
    ]))
    at("pop", "#c-card", "S.s4.start+0.1"); at("pop", "#c-bottle", "S.s4.start+0.3")
    at("row", "#c-r1", "B.alc"); at("row", "#c-r2", "B.oil"); at("row", "#c-r3", "B.cit"); at("pop", "#c-lemon", "B.cit")
elif N == "1":
    scenes.append(section("s2", "SANDUUQA", "Sanduuq cad", "calaamad dahab", [
        cut("a-box", "box-cut.png", 20, 0, 320, 616),
        rphoto("a-plate", "plate-crop.png", 440, 20, 230),
        lab("a-1", "Sanduuq cad", "#efe4d2", 400, 290),
        lab("a-2", "Calaamad dahab", MC, 400, 390),
        lab("a-3", "Taif Al Emarat", "#8a5a36", 400, 490, 34),
        f'<div class="disc2" id="a-num" style="left:700px;top:100px;width:170px;height:170px;background:linear-gradient(135deg,#ecd08c,#c9a24b)"><span style="font-family:Dancing Script;font-weight:700;font-size:90px;color:#4a2e1a">N°{num}</span></div>',
    ]))
    at("pop", "#a-box", "S.s2.start+0.1"); at("pop", "#a-1", "B.box+0.3"); at("pop", "#a-plate", "B.mark-0.2")
    at("pop", "#a-2", "B.mark+0.1"); at("pop", "#a-3", "B.taif"); at("pop", "#a-num", "B.num")
    scenes.append(section("s3", "QURAARADDA", "Goobo", "dahab-midab", [
        cut("b-bottle", "bottle-cut.png", 10, 20, 380, 546),
        rphoto("b-plate", "plate-crop.png", 520, 10, 250),
        lab("b-1", "Goobo", BC, 450, 300),
        lab("b-2", "Dahab-midab", MC, 450, 400),
        lab("b-3", "Saxan dahab", MC, 450, 500),
    ]))
    at("pop", "#b-bottle", "S.s3.start+0.1"); at("pop", "#b-1", "B.goobo"); at("pop", "#b-2", "B.dcol")
    at("pop", "#b-plate", "B.saxan-0.2"); at("pop", "#b-3", "B.saxan+0.1")
else:  # 2
    scenes.append(section("s2", "QURAARADDA", "Madow", "saxan lacag-midab", [
        cut("a-bottle", "bottle-cut.png", 10, 20, 380, 546),
        rphoto("a-plate", "plate-crop.png", 520, 10, 250),
        lab("a-1", "Madow", BC, 450, 300),
        lab("a-2", "Saxan lacag", MC, 450, 400),
        lab("a-3", "Naqshad", "#8a5a36", 450, 500),
    ]))
    at("pop", "#a-bottle", "S.s2.start+0.1"); at("pop", "#a-1", "B.madow")
    at("pop", "#a-plate", "B.saxan-0.2"); at("pop", "#a-2", "B.saxan+0.1"); at("pop", "#a-3", "B.naqshad")
    scenes.append(section("s3", "SAXANKA", "Taif", "naqshad ubaxyo", [
        rphoto("b-plate", "plate-crop.png", 30, 10, 440),
        lab("b-1", "Magaca Taif", MC, 500, 150),
        lab("b-2", "Ubaxyo", "#b8452f", 500, 270),
        cut("b-bottle", "bottle-cut.png", 580, 350, 200, 287),
    ]))
    at("pop", "#b-plate", "S.s3.start+0.1"); at("pop", "#b-1", "B.taif"); at("pop", "#b-2", "B.flow"); at("pop", "#b-bottle", "B.flow+0.4")
if N in "12":
    word = "Qaali" if N == "1" else "Casri"
    beat2 = "lux" if N == "1" else "modern"
    scenes.append(section("s4", "DABOOLKA", f"Dabool {M.lower()}", "dhalaalaya", [
        rphoto("c-cap", "cap-crop.png", 30, 10, 420),
        lab("c-1", "Dhalaalaya", MC, 490, 150),
        lab("c-2", word, "#8a5a36", 490, 270),
        cut("c-bottle", "bottle-cut.png", 600, 350, 200, 287),
    ]))
    at("pop", "#c-cap", "S.s4.start+0.1"); at("pop", "#c-1", "B.shine"); at("pop", "#c-2", f"B.{beat2}"); at("pop", "#c-bottle", f"B.{beat2}+0.3")

# 5 how
scenes.append(section("how", "SIDEE?", "Ku rusheey", "gacmaha iyo qoorta", [
    cut("d-bottle", "bottle-cut.png", 20, 60, 330, 474),
    MIST.replace("left:0px;top:0px", "left:250px;top:40px"),
    disc("d-hand", HAND, 470, 0, 190), disc("d-neck", NECK, 680, 0, 190),
    lab("d-1", "Gacmaha", "#c08a68", 450, 215, 32), lab("d-2", "Qoorta", "#1c3f86", 670, 305, 32),
    lab("d-3", "Dibadda oo keliya", "#b8452f", 400, 440, 34),
]))
at("pop", "#d-bottle", "S.how.start+0.1"); at("mist", "#mist .md", "B.spray")
at("pop", "#d-hand", "B.hand-0.1"); at("pop", "#d-1", "B.hand+0.1"); at("pop", "#d-neck", "B.neck-0.1"); at("pop", "#d-2", "B.neck+0.1"); at("pop", "#d-3", "B.ext")

# 6 fire
scenes.append(section("fire", "TAXADDAR", "Dabka", "iyo kulaylka", [
    disc("e-fire", FLAME, 40, 20, 250, ban=True), disc("e-heat", HEAT, 330, 20, 250, ban=True),
    cut("e-bottle", "bottle-cut.png", 640, 0, 220, 316),
    lab("e-1", "Way shidmi kartaa", "#ff8a3c", 40, 330), lab("e-2", "Ilaa ay qalasho", "#6fa4e8", 180, 440),
], alt=True))
at("pop", "#e-bottle", "S.fire.start+0.1"); at("pop", "#e-1", "B.flam"); at("pop", "#e-2", "B.dry")
at("pop", "#e-fire", "B.fire-0.3"); at("ban", "#e-fire-ban", "B.fire+0.1"); at("pop", "#e-heat", "B.heat-0.2"); at("ban", "#e-heat-ban", "B.heat+0.2")

# 7 store
scenes.append(section("store", "KAYDI", "Qabow + qalalan", "carruurta ka fogee", [
    disc("f-cool", SNOW, 30, 20, 220), disc("f-dry", DRY, 330, 20, 220), disc("f-kid", KID, 630, 20, 220, ban=True),
    lab("f-1", "Qabow", "#6fa4e8", 50, 270, 28), lab("f-2", "Qalalan", "#c9a24b", 335, 270, 28), lab("f-3", "Carruurta", "#b8452f", 600, 270, 28),
    cut("f-bottle", "box-cut.png", 360, 390, 130, 250),
]))
at("pop", "#f-cool", "B.cool-0.1"); at("pop", "#f-1", "B.cool+0.1"); at("pop", "#f-dry", "B.dryst-0.1"); at("pop", "#f-2", "B.dryst+0.1")
at("pop", "#f-kid", "B.kids-0.1"); at("ban", "#f-kid-ban", "B.kids+0.3"); at("pop", "#f-3", "B.kids+0.1"); at("pop", "#f-bottle", "S.store.start+0.3")

# 8 cta
scenes.append(section("cta", "HADDA", "Udgoon", "Imaaraati ah", [
    cut("g-bottle", "bottle-cut.png", 30, 0, 400, 575),
    f'<div id="g-name">Romance<br />N°{num}</div>',
    '<div id="g-ar">طيف الإمارات</div><div id="g-en">TAIF AL EMARAT</div>',
    '<div id="g-buy" class="center stk">HADDA RAADSO</div>',
]))
at("slide", "#g-bottle", "S.cta.start+0.1"); at("pop6", "#g-name", "B.cname"); at("pop6", "#g-ar", "B.emi-0.1"); at("pop6", "#g-en", "B.emi+0.1")
at("buy", "#g-buy", "B.buy")

css = '''      .photo { position: absolute; overflow: hidden; background: #fff; border: 10px solid #fff; box-shadow: 0 0 0 5px var(--gold), 0 18px 28px rgba(74, 46, 26, 0.28); }
      .photo img { display: block; width: 100%; height: 100%; object-fit: cover; }
      .round { border-radius: 50%; }
      .cut { position: absolute; filter: drop-shadow(0 18px 18px rgba(74, 46, 26, 0.3)); }
      .cut img { display: block; width: 100%; height: 100%; object-fit: contain; }
      .disc2 { position: absolute; border-radius: 50%; background: #fff; box-shadow: 0 14px 20px rgba(74, 46, 26, 0.16); display: flex; align-items: center; justify-content: center; }
      .banx { position: absolute; inset: 0; width: 100%; height: 100%; }
      #g-name { position: absolute; left: 450px; top: 20px; width: 430px; text-align: center; font-family: "Dancing Script"; font-weight: 700; font-size: 110px; line-height: 1; color: var(--blue); }
      #g-ar { position: absolute; left: 450px; top: 260px; width: 430px; text-align: center; font-family: serif; font-weight: 700; font-size: 62px; color: var(--brown); }
      #g-en { position: absolute; left: 450px; top: 350px; width: 430px; text-align: center; font-family: "Cinzel"; font-weight: 900; font-size: 34px; letter-spacing: 0.12em; color: var(--brown2); }
      #g-buy { position: absolute; left: 470px; top: 440px; width: 400px; white-space: nowrap; height: 120px; border-radius: 60px; background: linear-gradient(90deg, var(--gold), var(--gold2)); color: var(--brown); font-family: "Cinzel"; font-weight: 900; font-size: 44px; }
'''

JS = {
    "pop": 'pop("{s}", {t});',
    "pop6": 'pop("{s}", {t}, 0.6);',
    "rise": 'tl.fromTo("{s}", {{ y: 500, opacity: 0 }}, {{ y: 0, opacity: 1, duration: 0.55, ease: "back.out(1.4)" }}, {t});',
    "slide": 'tl.fromTo("{s}", {{ x: -400, opacity: 0 }}, {{ x: 0, opacity: 1, duration: 0.45, ease: "power3.out" }}, {t});',
    "sparks": 'tl.fromTo("{s}", {{ scale: 0, opacity: 0, transformOrigin: "50% 50%" }}, {{ scale: 1, opacity: 1, duration: 0.3, stagger: 0.12, ease: "back.out(3)" }}, {t});',
    "ban": 'tl.fromTo("{s}", {{ opacity: 0, scale: 1.5, transformOrigin: "50% 50%" }}, {{ opacity: 1, scale: 1, duration: 0.25, ease: "power4.in" }}, {t});',
    "row": 'tl.fromTo("{s} .hi", {{ opacity: 0 }}, {{ opacity: 1, duration: 0.2 }}, {t}); tl.fromTo("{s} text", {{ x: -20 }}, {{ x: 0, duration: 0.3, ease: "back.out(3)" }}, {t});',
    "mist": 'tl.fromTo("{s}", {{ scale: 0, opacity: 0, transformOrigin: "50% 50%" }}, {{ scale: 1, opacity: 0.9, duration: 0.35, stagger: 0.03, ease: "power2.out" }}, {t}); tl.to("{s}", {{ x: 40, opacity: 0, duration: 0.9, stagger: 0.03 }}, {t}+0.6);',
    "buy": 'tl.fromTo("{s}", {{ y: 240, opacity: 0 }}, {{ y: 0, opacity: 1, duration: 0.35, ease: "back.out(2)" }}, {t}-0.1); tl.fromTo("{s}", {{ scale: 1 }}, {{ scale: 1.06, duration: 0.3, yoyo: true, repeat: 3, ease: "sine.inOut" }}, {t}+0.4);',
}
jstext = "      // product scenes (generated)\n" + "\n".join("      " + JS[k].format(s=s, t=t) for k, s, t in js) + "\n\n"

head = OUD[: OUD.index("      /* 1 hook */")].replace("<title>Al Majed Oud</title>", f"<title>Romance N°{num}</title>")
head = re.sub(r"      /\* real product photos in heritage frames \*/.*?(?=\Z)", "", head, flags=re.S)
caps = OUD[OUD.index("      /* captions:") : OUD.index("    </style>")]
body_open = OUD[OUD.index("    </style>") : OUD.index("      <svg width=\"0\"")]
chrome = OUD[OUD.index("      <!-- persistent chrome") : OUD.index("      // 1 hook:")]
chrome = chrome.replace("AL MAJED OUD · CUUD", "TAIF AL EMARAT · ROMANCE")
tail = OUD[OUD.index("      // captions: word-by-word") :]
out = head + css + caps + body_open + "".join(scenes) + "\n" + chrome + jstext + tail
open(f"{ROOT}/src/template.html.tmpl", "w").write(out)
ids = re.findall(r'id="([^"]+)"', out)
dup = [i for i in set(ids) if ids.count(i) > 1]
assert not dup, dup

# beats + sfx into build.py
bp = open(f"{ROOT}/src/build.py").read()
a = bp.index("beats = {"); b = bp.index("}\n", a) + 2
bb = "beats = {\n" + "".join(f'    "{k}": word_time("{sc}", "{w}"),\n' for k, (sc, w) in B.items()) + "}\n"
bp = bp[:a] + bb + bp[b:]
pops = [k for k in B if k not in ("brand", "buy", "cname", "emi", "coll", "spray")]
bp = re.sub(r"pops = \[.*?\]", "pops = " + repr(pops).replace("'", '"'), bp)
bp = re.sub(r'for i, k in enumerate\(\[.*?\]\)', 'for i, k in enumerate(["brand", "spray", "buy"])', bp)
bp = bp.replace("Al Majed Oud product ad", f"Romance N°{num} product ad")
open(f"{ROOT}/src/build.py", "w").write(bp)
print("ok", len(js), "anims")
