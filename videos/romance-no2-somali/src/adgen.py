#!/usr/bin/env python3
"""Generate the HyperFrames template + beats for the Falarosa Luxury perfume ads.

usage: adgen.py <key>   key = rom3 | rom1 | rom2 | kash | mad
Writes /tmp/claude-0/hf/<key>/src/template.html.tmpl and patches src/build.py (beats, SFX).
Every scene is built from a small library (hero, notes, card, facts, shop, contact, cta ...)
and keyed to spoken Somali words, so picture follows the narration.
"""
import re
import sys

KEY = sys.argv[1]
ROOT = f"/tmp/claude-0/hf/{KEY}"
BASE = open("/tmp/claude-0/hf/oud/src/template.html.tmpl").read()

beats = {}  # key -> (scene, word, nth, exact)
js = []
secs = []


def beat(key, scene, word, nth=0, exact=False):
    beats[key] = (scene, word, nth, exact)
    return f"B.{key}"


def at(kind, sel, t):
    js.append((kind, sel, t))


# ---------- element builders ----------
def cut(i, src, x, y, w, h):
    return f'<div class="cut" id="{i}" style="left:{x}px;top:{y}px;width:{w}px;height:{h}px"><img src="assets/photos/{src}" alt="" /></div>'


def rphoto(i, src, x, y, d):
    return f'<div class="photo round" id="{i}" style="left:{x}px;top:{y}px;width:{d}px;height:{d}px"><img src="assets/photos/{src}" alt="" /></div>'


def lab(i, text, color, x, y, fs=None):
    st = f"left:{x}px;top:{y}px" + (f";font-size:{fs}px" if fs else "")
    return f'<div class="lab tag" id="{i}" style="{st}"><i style="background:{color}"></i>{text}</div>'


def disc(i, inner, x, y, d, ban=False, bg=None):
    b = f'<svg class="banx" id="{i}-ban" viewBox="0 0 200 200"><g fill="none" stroke="#b8452f" stroke-width="14"><circle cx="100" cy="100" r="86" /><path d="M40 40 L160 160" /></g></svg>' if ban else ""
    st = f"left:{x}px;top:{y}px;width:{d}px;height:{d}px" + (f";background:{bg}" if bg else "")
    return f'<div class="disc2" id="{i}" style="{st}">{inner}{b}</div>'


def bigtext(text, size, color="#4a2e1a", font="Cinzel"):
    return f'<span style="font-family:{font};font-weight:900;font-size:{size}px;color:{color};line-height:1;text-align:center">{text}</span>'


GOLD = "linear-gradient(135deg,#ecd08c,#c9a24b)"


def hl(words, y=False):
    return " ".join(f'<span class="hw{" y" if y else ""}">{w}</span>' for w in words.split())


def section(sid, chip, big, small, body, alt=False):
    inner = "\n            ".join(body)
    secs.append(f'''      <section id="s-{sid}" class="clip" data-start="%{sid}.start%" data-duration="%{sid}.dur%" data-track-index="1">
        <div class="stage">
          <div class="chip{' alt' if alt else ''}"><i></i>{chip}<i></i></div>
          <div class="headline"><span class="hl">{hl(big, True)}</span><span class="hl sm">{hl(small)}</span></div>
          <div class="visual">
            {inner}
          </div>
        </div>
      </section>
''')


# ---------- icons ----------
def flower(c1, c2="#ffd166", petals=5, r=34):
    ps = "".join(f'<ellipse cx="60" cy="{60 - r}" rx="{r * 0.62:.0f}" ry="{r:.0f}" fill="{c1}" transform="rotate({i * 360 / petals:.0f} 60 60)" />' for i in range(petals))
    return f'<svg width="120" height="120" viewBox="0 0 120 120">{ps}<circle cx="60" cy="60" r="14" fill="{c2}" /></svg>'


ROSE = lambda c="#c8284a": f'<svg width="120" height="120" viewBox="0 0 120 120"><path d="M60 100 V116" stroke="#3f8f4a" stroke-width="6" /><circle cx="60" cy="58" r="42" fill="{c}" /><g fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="5" stroke-linecap="round"><path d="M60 58 m-10 0 a10 10 0 1 1 20 0 a18 18 0 1 1 -32 4 a26 26 0 1 1 46 -8" /></g></svg>'
SLICE = lambda c="#ffb020", rind="#f08a00": f'<svg width="120" height="120" viewBox="0 0 120 120"><circle cx="60" cy="60" r="48" fill="{c}" stroke="{rind}" stroke-width="8" /><g stroke="#fff4c0" stroke-width="5"><path d="M60 16 V104 M16 60 H104 M29 29 L91 91 M29 91 L91 29" /></g><circle cx="60" cy="60" r="8" fill="#fff4c0" /></svg>'
SPRIG = lambda c="#4f8a4a": f'<svg width="120" height="120" viewBox="0 0 120 120"><path d="M30 108 Q60 60 92 14" stroke="#6b4a2a" stroke-width="5" fill="none" /><g fill="{c}">' + "".join(f'<ellipse cx="{30 + i * 11}" cy="{100 - i * 15}" rx="6" ry="16" transform="rotate({-50 + (i % 2) * 90} {30 + i * 11} {100 - i * 15})" />' for i in range(6)) + "</g></svg>"
WOOD = '<svg width="130" height="110" viewBox="0 0 130 110"><rect x="12" y="30" width="96" height="56" rx="10" fill="#9a6444" /><ellipse cx="108" cy="58" rx="16" ry="28" fill="#c99470" /><g fill="none" stroke="#7a4a2f" stroke-width="3"><ellipse cx="108" cy="58" rx="9" ry="17" /><path d="M20 46 H96 M20 62 H96 M20 76 H96" /></g></svg>'
GEM = '<svg width="120" height="120" viewBox="0 0 120 120"><path d="M30 40 L60 14 L90 40 L60 108Z" fill="#e3902a" /><path d="M30 40 H90 L60 108Z" fill="#c96f10" /><path d="M44 40 L60 14 L76 40Z" fill="#ffc46b" /></svg>'
CLOUD = '<svg width="130" height="110" viewBox="0 0 130 110"><path d="M34 88 Q10 88 10 66 Q10 46 32 44 Q38 18 66 18 Q92 18 100 42 Q122 44 122 66 Q122 88 98 88Z" fill="#fff" stroke="#d9cfe8" stroke-width="5" /><g fill="#c9a24b"><circle cx="46" cy="64" r="5" /><circle cx="66" cy="54" r="5" /><circle cx="86" cy="66" r="5" /></g></svg>'
PEAR = '<svg width="110" height="120" viewBox="0 0 110 120"><path d="M55 20 Q70 22 70 44 Q96 66 90 90 Q84 114 55 114 Q26 114 20 90 Q14 66 40 44 Q40 22 55 20Z" fill="#c8d65a" /><path d="M55 20 L58 6" stroke="#6b4a2a" stroke-width="5" /><ellipse cx="68" cy="10" rx="12" ry="5" fill="#4f8a4a" /></svg>'
PEPPER = '<svg width="120" height="120" viewBox="0 0 120 120"><g fill="#e0607a">' + "".join(f'<circle cx="{x}" cy="{y}" r="13" />' for x, y in [(40, 40), (74, 34), (58, 64), (30, 76), (84, 72), (56, 94)]) + '</g><g fill="#fff" opacity=".5">' + "".join(f'<circle cx="{x - 4}" cy="{y - 4}" r="4" />' for x, y in [(40, 40), (74, 34), (58, 64), (30, 76), (84, 72), (56, 94)]) + "</g></svg>"
PEACH = '<svg width="120" height="120" viewBox="0 0 120 120"><circle cx="60" cy="66" r="44" fill="#ffab76" /><path d="M60 26 Q52 66 60 108" stroke="#f08a5a" stroke-width="4" fill="none" /><ellipse cx="74" cy="20" rx="16" ry="7" fill="#4f8a4a" transform="rotate(-20 74 20)" /></svg>'
PINE = '<svg width="110" height="130" viewBox="0 0 110 130"><g fill="#3f8f4a"><path d="M55 4 L62 34 L48 34Z" /><path d="M36 10 L56 38 L44 40Z" /><path d="M74 10 L66 40 L54 38Z" /></g><ellipse cx="55" cy="82" rx="34" ry="44" fill="#e3b33a" /><g stroke="#b8860b" stroke-width="3"><path d="M30 60 L80 110 M24 84 L66 124 M40 44 L86 88 M80 60 L30 110 M86 84 L44 124 M70 44 L24 88" /></g></svg>'
MAN = '<svg width="140" height="150" viewBox="0 0 140 150"><circle cx="70" cy="46" r="30" fill="#9d6646" /><path d="M20 150 V112 Q20 84 70 84 Q120 84 120 112 V150Z" fill="#1c3f86" /><path d="M40 40 Q70 6 100 40 Q96 22 70 18 Q44 22 40 40Z" fill="#2a1a10" /></svg>'
WOMAN = '<svg width="140" height="150" viewBox="0 0 140 150"><path d="M70 10 C104 10 118 36 116 70 C114 96 104 110 96 118 L124 150 H16 L44 118 C36 110 26 96 24 70 C22 36 36 10 70 10Z" fill="#b8452f" /><ellipse cx="70" cy="66" rx="30" ry="36" fill="#c08a68" /></svg>'
CLOCK = '<svg width="130" height="130" viewBox="0 0 130 130"><circle cx="65" cy="65" r="54" fill="#fff" stroke="#c9a24b" stroke-width="10" /><g stroke="#4a2e1a" stroke-width="8" stroke-linecap="round"><path id="hand-h" d="M65 65 V34" /><path d="M65 65 L90 78" /></g><circle cx="65" cy="65" r="7" fill="#b8452f" /></svg>'
SHIRT = '<svg width="140" height="140" viewBox="0 0 150 150"><path d="M40 20 L60 10 Q75 26 90 10 L110 20 L135 50 L115 66 L108 58 V140 H42 V58 L35 66 L15 50Z" fill="#2f6fd0" /><g fill="none" stroke="#c9a24b" stroke-width="5" stroke-linecap="round"><path d="M60 80 q10 -12 20 0 t20 0" /><path d="M56 104 q10 -12 20 0 t20 0" /></g></svg>'
STORE = '''<svg viewBox="0 0 400 380" style="width:100%;height:100%"><rect x="30" y="120" width="340" height="240" rx="14" fill="#fffdf6" stroke="#c9a24b" stroke-width="6" />
<g>''' + "".join(f'<path d="M{30 + i * 68} 70 H{98 + i * 68} V130 Q{64 + i * 68} 160 {30 + i * 68} 130Z" fill="{"#1c3f86" if i % 2 == 0 else "#c9a24b"}" />' for i in range(5)) + '''</g>
<rect x="20" y="40" width="360" height="36" rx="10" fill="#4a2e1a" /><text x="200" y="66" text-anchor="middle" font-family="Cinzel" font-weight="900" font-size="22" fill="#e3c173" letter-spacing="3">FALAROSA LUXURY</text>
<rect x="70" y="190" width="120" height="170" rx="8" fill="#e8dcc6" stroke="#c9a24b" stroke-width="4" /><circle cx="170" cy="280" r="6" fill="#c9a24b" />
<rect x="220" y="190" width="120" height="100" rx="8" fill="#cfe3fb" stroke="#c9a24b" stroke-width="4" />
<g><rect x="236" y="236" width="18" height="44" rx="4" fill="#b8243a" /><rect x="262" y="226" width="18" height="54" rx="4" fill="#e0b21c" /><rect x="288" y="232" width="18" height="48" rx="4" fill="#1d2f55" /><rect x="313" y="240" width="14" height="40" rx="4" fill="#fff" stroke="#c9a24b" stroke-width="2" /></g></svg>'''
PIN = '<svg width="120" height="140" viewBox="0 0 120 140"><path d="M60 132 C30 92 16 72 16 50 A44 44 0 0 1 104 50 C104 72 90 92 60 132Z" fill="#b8452f" /><circle cx="60" cy="50" r="18" fill="#fff" /></svg>'
MAPLE = '<svg width="120" height="120" viewBox="0 0 120 120"><path d="M60 8 L68 30 L82 22 L78 48 L100 38 L94 54 L112 60 L84 76 L90 88 L64 82 L64 112 L56 112 L56 82 L30 88 L36 76 L8 60 L26 54 L20 38 L42 48 L38 22 L52 30Z" fill="#d52b1e" /></svg>'
PHONE = '<svg width="150" height="150" viewBox="0 0 150 150"><rect x="44" y="14" width="62" height="122" rx="12" fill="#1c3f86" /><rect x="50" y="28" width="50" height="86" rx="4" fill="#cfe3fb" /><circle cx="75" cy="124" r="5" fill="#fff" /><g id="rings" fill="none" stroke="#c9a24b" stroke-width="6" stroke-linecap="round"><path d="M116 50 q12 25 0 50" /><path d="M128 38 q20 37 0 74" /><path d="M34 50 q-12 25 0 50" /><path d="M22 38 q-20 37 0 74" /></g></svg>'
ARROW = '<svg id="arrowdn" viewBox="0 0 90 120" style="position:absolute;left:%dpx;top:%dpx;width:90px;height:120px"><path d="M45 8 V96 M14 66 L45 100 L76 66" fill="none" stroke="#2f6fd0" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" /></svg>'
HEART = '<svg width="130" height="120" viewBox="0 0 130 120"><path d="M65 110 C20 80 8 58 8 38 C8 18 24 6 42 6 C54 6 62 14 65 24 C68 14 76 6 88 6 C106 6 122 18 122 38 C122 58 110 80 65 110Z" fill="#b8243a" /></svg>'
COMPASS = '<svg width="130" height="130" viewBox="0 0 130 130"><circle cx="65" cy="65" r="56" fill="#fff" stroke="#c9a24b" stroke-width="8" /><path d="M65 14 L76 65 L65 116 L54 65Z" fill="#1c3f86" /><path d="M14 65 L65 54 L116 65 L65 76Z" fill="#c9a24b" /><circle cx="65" cy="65" r="8" fill="#b8452f" /></svg>'
FLAG_UAE = '<svg width="150" height="100" viewBox="0 0 150 100"><rect width="150" height="100" rx="8" fill="#fff" stroke="#ddd" stroke-width="3" /><rect x="40" width="110" height="33" fill="#00843d" /><rect x="40" y="67" width="110" height="33" fill="#000" /><rect width="40" height="100" fill="#c8102e" /></svg>'
FLAG_SA = '<svg width="150" height="100" viewBox="0 0 150 100"><rect width="150" height="100" rx="8" fill="#006c35" /><path d="M40 40 H110" stroke="#fff" stroke-width="5" /><path d="M42 66 H104 L110 60" stroke="#fff" stroke-width="5" fill="none" /></svg>'
SPARK = '<svg id="h-spark" viewBox="0 0 880 640" style="position:absolute;left:0;top:0;width:880px;height:640px"><g fill="#c9a24b"><path class="hs" d="M110 120 l12 28 28 12 -28 12 -12 28 -12 -28 -28 -12 28 -12z" /><path class="hs" d="M770 80 l10 22 22 10 -22 10 -10 22 -10 -22 -22 -10 22 -10z" /><path class="hs" d="M790 440 l12 28 28 12 -28 12 -12 28 -12 -28 -28 -12 28 -12z" /><path class="hs" d="M80 460 l8 18 18 8 -18 8 -8 18 -8 -18 -18 -8 18 -8z" /></g></svg>'

NOTE = {
    "ward Taif": ROSE("#d6456b"), "Geranium": flower("#f28bb0", "#ffe08a", 5), "Misk": CLOUD, "Misk jilicsan": CLOUD,
    "Ubaxa liinta": flower("#fffbe8", "#ffd84a", 5), "Jasmine": flower("#ffffff", "#ffe08a", 5, 32), "Tuberose": flower("#fff6ec", "#f2c4a0", 6, 30),
    "Amber": GEM, "Ward Moroccan": ROSE("#e05a86"), "Rosemary": SPRIG(), "Citrus": SLICE(), "Qori cedar": WOOD,
    "Ubaxa pear": PEAR, "Filfil casaan": PEPPER, "Bergamot": SLICE("#b5d64a", "#6f9f2a"), "Patchouli": SPRIG("#2f5a2a"),
    "Peach": PEACH, "Ubaxa tufaaxa": flower("#fbd3e0", "#ffe08a", 5), "Ubaxa cananaaska": PINE, "Ward duurjoog": ROSE("#e86f8e"),
}


# ---------- scene library ----------
def s_hook_collection(sid, active):
    # the three Romance bottles, the one this ad is about in front
    order = [n for n in ("1", "2", "3") if n != active]
    body = [cut(f"{sid}-b{order[0]}", f"bottle-no{order[0]}.png", 30, 110, 300, 431),
            cut(f"{sid}-b{order[1]}", f"bottle-no{order[1]}.png", 550, 110, 300, 431),
            cut(f"{sid}-b{active}", f"bottle-no{active}.png", 250, 0, 390, 560), SPARK]
    section(sid, "TAIF AL EMARAT", "Romance", "ururka Taif Al Emarat", body)
    at("rise", f"#{sid}-b{order[0]}", f"S.{sid}.start+0.1")
    at("rise", f"#{sid}-b{order[1]}", f"S.{sid}.start+0.25")
    at("rise", f"#{sid}-b{active}", beat("brand", sid, "taif") + "-0.3")
    at("sparks", ".hs", "B.brand+0.2")


def s_hook_single(sid, chip, big, small, brandword, photo, w, h):
    section(sid, chip, big, small, [cut(f"{sid}-bottle", photo, (880 - w) // 2, 0, w, h), SPARK])
    at("rise", f"#{sid}-bottle", f"S.{sid}.start+0.1")
    at("sparks", ".hs", beat("brand", sid, brandword) + "-0.1")


def s_hero(sid, chip, big, small, photo, tags, extra=None, alt=False, bw=380, bh=546):
    """photo left, up to 3 tags on the right, optional disc (inner, beatkey-word)"""
    body = [cut(f"{sid}-p", photo, 40, 20, bw, bh)]
    ys = [30, 140, 250] if extra else [60, 190, 320]
    for k, (text, color, word) in enumerate(tags):
        body.append(lab(f"{sid}-t{k}", text, color, 450, ys[k]))
    if extra:
        body.append(disc(f"{sid}-x", extra[0], 580, 370, 230, bg=extra[2] if len(extra) > 2 else None))
    section(sid, chip, big, small, body, alt)
    at("pop", f"#{sid}-p", f"S.{sid}.start+0.1")
    for k, (text, color, word) in enumerate(tags):
        at("pop", f"#{sid}-t{k}", beat(f"{sid}t{k}", sid, *word) if isinstance(word, tuple) else beat(f"{sid}t{k}", sid, word))
    if extra:
        at("pop", f"#{sid}-x", beat(f"{sid}x", sid, *extra[1]) if isinstance(extra[1], tuple) else beat(f"{sid}x", sid, extra[1]))


def s_notes(sid, chip, big, small, notes, photo, pw=240, ph=345):
    """notes = [(name, tier, word)] -> rows of icon disc + label"""
    body = []
    n = len(notes)
    step = 200 if n == 3 else 250
    y0 = 10 if n == 3 else 60
    for k, (name, tier, word) in enumerate(notes):
        y = y0 + k * step
        body.append(disc(f"{sid}-n{k}", NOTE[name], 20, y, 170))
        body.append(f'<div class="note" id="{sid}-l{k}" style="left:210px;top:{y + 30}px"><div class="tier">{tier}</div><div class="nm">{name}</div></div>')
    body.append(cut(f"{sid}-p", photo, 880 - pw, 40, pw, ph))
    section(sid, chip, big, small, body)
    at("pop", f"#{sid}-p", f"S.{sid}.start+0.1")
    for k, (name, tier, word) in enumerate(notes):
        t = beat(f"{sid}n{k}", sid, *word) if isinstance(word, tuple) else beat(f"{sid}n{k}", sid, word)
        at("pop", f"#{sid}-n{k}", t + "-0.1")
        at("slidein", f"#{sid}-l{k}", t)


def s_card(sid, chip, big, small, title, rows, photo, pw=280, ph=402):
    """ingredient card: rows = [(text, word)]"""
    h = 150 + 110 * len(rows)
    rr = "".join(f'<g id="{sid}-r{k}"><rect class="hi" x="30" y="{140 + k * 110}" width="440" height="84" rx="16" fill="#f6e3b0" /><text x="64" y="{194 + k * 110}">{t}</text></g>' for k, (t, w) in enumerate(rows))
    card = f'''<svg id="{sid}-card" class="stk" viewBox="0 0 500 {h}" style="position:absolute;left:10px;top:10px;width:500px;height:{h}px"><rect x="8" y="8" width="484" height="{h - 16}" rx="28" fill="#fffdf6" /><text x="250" y="86" text-anchor="middle" font-family="Cinzel" font-weight="900" font-size="36" fill="#8a5a36">{title}</text><path d="M60 112 H440" stroke="#c9a24b" stroke-width="4" /><g font-family="Lora" font-weight="700" font-size="34" fill="#4a2e1a">{rr}</g></svg>'''
    section(sid, chip, big, small, [card, cut(f"{sid}-p", photo, 880 - pw + 20, 60, pw, ph)])
    at("pop", f"#{sid}-card", f"S.{sid}.start+0.1")
    at("pop", f"#{sid}-p", f"S.{sid}.start+0.35")
    for k, (t, w) in enumerate(rows):
        at("row", f"#{sid}-r{k}", beat(f"{sid}r{k}", sid, *w) if isinstance(w, tuple) else beat(f"{sid}r{k}", sid, w))


def s_twodisc(sid, chip, big, small, a, b, photo=None, pw=230, ph=330, alt=False):
    """two icon discs with labels: a/b = (inner, label, color, word, bg)"""
    body = []
    for k, (inner, text, color, word, bg) in enumerate((a, b)):
        x = 30 + k * 300
        body.append(disc(f"{sid}-d{k}", inner, x, 20, 250, bg=bg))
        body.append(lab(f"{sid}-t{k}", text, color, x, 300))
    if photo:
        body.append(cut(f"{sid}-p", photo, 880 - pw, 40, pw, ph))
    section(sid, chip, big, small, body, alt)
    if photo:
        at("pop", f"#{sid}-p", f"S.{sid}.start+0.1")
    for k, (inner, text, color, word, bg) in enumerate((a, b)):
        t = beat(f"{sid}d{k}", sid, *word) if isinstance(word, tuple) else beat(f"{sid}d{k}", sid, word)
        at("pop", f"#{sid}-d{k}", t + "-0.15")
        at("pop", f"#{sid}-t{k}", t + "+0.1")


def s_lasting(sid, photo, pw=240, ph=345):
    body = [disc(f"{sid}-clock", CLOCK, 20, 20, 200), lab(f"{sid}-t0", "Muddo dheer", "#c9a24b", 10, 240, 30),
            disc(f"{sid}-shirt", SHIRT, 290, 20, 200), lab(f"{sid}-t1", "Dharka", "#2f6fd0", 300, 330, 30),
            lab(f"{sid}-t2", "Jirka", "#c08a68", 40, 330, 30),
            cut(f"{sid}-p", photo, 880 - pw, 20, pw, ph),
            f'<svg id="{sid}-waves" viewBox="0 0 300 200" style="position:absolute;left:{880 - pw - 120}px;top:380px;width:300px;height:200px"><g fill="none" stroke="#c9a24b" stroke-width="8" stroke-linecap="round"><path class="wv" d="M20 60 q30 -30 60 0 t60 0 t60 0 t60 0" /><path class="wv" d="M20 110 q30 -30 60 0 t60 0 t60 0 t60 0" /><path class="wv" d="M20 160 q30 -30 60 0 t60 0 t60 0 t60 0" /></g></svg>',
            lab(f"{sid}-t3", "Wuu sii uraa", "#b8243a", 20, 500)]
    section(sid, "MUDDO DHEER", "Muddo dheer", "dharka iyo jirka", body)
    at("pop", f"#{sid}-p", f"S.{sid}.start+0.1")
    t = beat("last", sid, "muddo")
    at("pop", f"#{sid}-clock", t + "-0.2"); at("spin", f"#{sid}-clock svg", t); at("pop", f"#{sid}-t0", t + "+0.1")
    t = beat("clothes", sid, "dharkaaga")
    at("pop", f"#{sid}-shirt", t + "-0.2"); at("pop", f"#{sid}-t1", t + "+0.1")
    at("pop", f"#{sid}-t2", beat("body", sid, "jirkaaga"))
    t = beat("smell", sid, "uraa")
    at("waves", f"#{sid}-waves .wv", f"B.clothes"); at("pop", f"#{sid}-t3", t + "-0.2")


def s_made(sid, photo, pw=300, ph=578):
    body = [cut(f"{sid}-p", photo, 60, 10, pw, ph), disc(f"{sid}-flag", FLAG_UAE, 480, 20, 220),
            lab(f"{sid}-t0", "Imaaraadka", "#00843d", 430, 270),
            disc(f"{sid}-ml", bigtext("75", 76) + bigtext("ML", 38), 560, 380, 210, bg=GOLD)]
    body[-1] = body[-1].replace('class="disc2"', 'class="disc2 col"')
    section(sid, "SAMAYSKA", "75 ML", "Imaaraadka Carabta", body)
    at("pop", f"#{sid}-p", f"S.{sid}.start+0.1")
    at("pop", f"#{sid}-ml", beat("ml", sid, "toddobaatan"))
    at("pop", f"#{sid}-flag", beat("uae", sid, "imaaraadka") + "-0.2"); at("pop", f"#{sid}-t0", "B.uae+0.1")


def s_facts(sid, chip, big, small, facts, photo=None, pw=230, ph=330):
    """facts = [(big text, label, color, word, inner-or-None)]"""
    body = []
    for k, (bt, text, color, word, inner) in enumerate(facts):
        x = 30 + k * 290
        content = inner if inner else bigtext(bt, 70 if len(bt) < 5 else 56)
        body.append(disc(f"{sid}-d{k}", content, x, 20, 250, bg=None if inner else GOLD))
        body.append(lab(f"{sid}-t{k}", text, color, x, 300 + k * 95, 32))
    if photo:
        body.append(cut(f"{sid}-p", photo, 880 - pw, 60 if len(facts) < 3 else 330, pw, ph))
    section(sid, chip, big, small, body)
    if photo:
        at("pop", f"#{sid}-p", f"S.{sid}.start+0.1")
    for k, (bt, text, color, word, inner) in enumerate(facts):
        t = beat(f"{sid}f{k}", sid, *word) if isinstance(word, tuple) else beat(f"{sid}f{k}", sid, word)
        at("pop", f"#{sid}-d{k}", t + "-0.15")
        at("pop", f"#{sid}-t{k}", t + "+0.1")


def s_shop(sid):
    body = [f'<div class="cut" id="{sid}-store" style="left:20px;top:20px;width:420px;height:400px">{STORE}</div>',
            f'<div id="{sid}-name" class="shopname">Falarosa<br />Luxury</div>',
            disc(f"{sid}-pin", PIN, 470, 330, 150), lab(f"{sid}-t0", "Surrey, BC", "#b8452f", 630, 360, 34),
            disc(f"{sid}-leaf", MAPLE, 470, 490, 130), lab(f"{sid}-t1", "Kanada", "#d52b1e", 620, 520, 34)]
    section(sid, "MEESHA", "Falarosa", "Surrey · BC · Kanada", body)
    t = beat("shop", sid, "falarosa")
    at("pop", f"#{sid}-store", f"S.{sid}.start+0.1"); at("pop6", f"#{sid}-name", t)
    t = beat("surrey", sid, "surrey"); at("pop", f"#{sid}-pin", t + "-0.1"); at("pop", f"#{sid}-t0", t + "+0.05")
    t = beat("canada", sid, "kanada"); at("pop", f"#{sid}-leaf", t + "-0.1"); at("pop", f"#{sid}-t1", t + "+0.05")


def s_contact(sid, photo, pw=230, ph=330):
    body = [disc(f"{sid}-phone", PHONE, 40, 20, 300), lab(f"{sid}-t0", "Nala soo xiriir", "#2f6fd0", 390, 60),
            lab(f"{sid}-t1", "Lambarka bogga", "#c9a24b", 390, 180), ARROW % (180, 380),
            cut(f"{sid}-p", photo, 880 - pw, 290, pw, ph)]
    section(sid, "LA XIRIIR", "Nala soo xiriir", "lambarka bogga", body)
    t = beat("call", sid, "xiriir")
    at("pop", f"#{sid}-phone", f"S.{sid}.start+0.1"); at("ring", "#rings", f"S.{sid}.start+0.3"); at("pop", f"#{sid}-t0", t)
    t = beat("num", sid, "lambarka"); at("pop", f"#{sid}-t1", t); at("bounce", "#arrowdn", t + "+0.1")
    at("pop", f"#{sid}-p", f"S.{sid}.start+0.4")


def s_cta(sid, name_html, ar, en, photo, word, bw=400, bh=575):
    body = [cut(f"{sid}-p", photo, 40, 0, bw, bh), f'<div id="g-name">{name_html}</div>',
            f'<div id="g-ar">{ar}</div><div id="g-en">{en}</div>', '<div id="g-buy" class="center stk">HADDA DALBO</div>']
    section(sid, "HADDA", "Hadda dalbo", "Falarosa Luxury", body)
    at("slide", f"#{sid}-p", f"S.{sid}.start+0.1")
    t = beat("cname", sid, word); at("pop6", "#g-name", t)
    at("pop6", "#g-ar", t + "+0.4"); at("pop6", "#g-en", t + "+0.6")
    at("buy", "#g-buy", beat("buy", sid, "hadda"))


# ---------- products ----------
TAIF_AR = "طيف الإمارات"
if KEY == "rom3":
    s_hook_collection("l1", "3")
    s_hero("l2", "UGU XOOGGAN", "Romance N°3", "ugu udgoonka xooggan", "bottle-cut.png",
           [("Ugu xooggan", "#b8243a", "xooggan"), ("Romance N°3", "#c9a24b", "romance")],
           extra=(bigtext("2025", 64), "labo", GOLD))
    s_notes("l3", "UDGOONKA", "Ward Taif", "bilow · wadne · sal",
            [("ward Taif", "Bilowga", "ward"), ("Geranium", "Wadnaha", "geranium"), ("Misk jilicsan", "Salka", "misk")], "bottle-cut.png")
    s_card("l4", "WALXAHA", "Walxaha", "dabiici", "WALXAHA",
           [("Aalkolo dabiici", "aalkolo"), ("Saliid udgoon", "saliid"), ("Citrus", "citrus")], "bottle-cut.png")
    s_made("l5", "box-cut.png")
    s_twodisc("l6", "QOF KASTA", "Ragga + dumarka", "labadaba", (MAN, "Ragga", "#1c3f86", "ragga", None),
              (WOMAN, "Dumarka", "#b8452f", "dumarkaba", None), "bottle-cut.png")
    s_lasting("l7", "bottle-cut.png")
    s_shop("l8"); s_contact("l9", "bottle-cut.png")
    s_cta("l10", "Romance<br />N°3", TAIF_AR, "TAIF AL EMARAT", "bottle-cut.png", "romance")
    BRAND = "TAIF AL EMARAT · ROMANCE N°3"
elif KEY in ("rom1", "rom2"):
    n = KEY[-1]
    s_hook_collection("l1", n)
    if n == "1":
        s_hero("l2", "ROMANCE N°1", "Ubax iftiin leh", "dumarka", "bottle-cut.png",
               [("Ubax", "#e0b21c", "ubax"), ("Iftiin", "#ffd166", "iftiin")], extra=(WOMAN, "dumarka"))
        s_notes("l3", "UDGOONKA", "Bilowga", "iyo wadnaha",
                [("Ubaxa liinta", "Bilowga", "liinta"), ("Jasmine", "Bilowga", "jasmine"), ("Tuberose", "Wadnaha", "tuberose")], "bottle-cut.png")
        s_notes("l4", "SALKA", "Amber", "diiran oo jilicsan", [("Amber", "Salka", "amber")], "bottle-cut.png", 300, 431)
        metal, mword = "Dahab", "dahabka"
    else:
        s_hero("l2", "ROMANCE N°2", "Ubax + xawaash", "ragga iyo dumarka", "bottle-cut.png",
               [("Ubax", "#e05a86", "ubax"), ("Xawaash", "#b8452f", "xawaash"), ("Ragga + dumarka", "#1c3f86", "ragga")])
        s_notes("l3", "UDGOONKA", "Bilowga", "iyo wadnaha",
                [("Ward Moroccan", "Bilowga", "moroccan"), ("Rosemary", "Bilowga", "rosemary"), ("Citrus", "Wadnaha", "citrus")], "bottle-cut.png")
        s_notes("l4", "SALKA", "Qori cedar", "qallalan", [("Qori cedar", "Salka", "cedar")], "bottle-cut.png", 300, 431)
        metal, mword = "Lacag", "lacagta"
    s_card("l5", "WALXAHA", "Walxaha", "dabiici", "WALXAHA", [("Aalkolo dabiici", "aalkolo"), ("Saliid udgoon", "saliid")], "bottle-cut.png")
    s_facts("l6", "SAXANKA", f"Saxan {metal.lower()}", "magaca Taif", [
        ("", f"Saxan {metal.lower()}", "#c9a24b", mword, f'<div class="photo round" style="position:static;width:230px;height:230px;border-width:0;box-shadow:none"><img src="assets/photos/plate-crop.png" alt="" /></div>'),
        ("", "Far Carabi", "#8a5a36", "carabi", f'<span style="font-family:serif;font-weight:700;font-size:48px;color:#4a2e1a">{TAIF_AR}</span>')], "bottle-cut.png", 220, 316)
    s_hero("l7", "UGU XOOGGAN", "Romance N°3", "udgoonka ugu xooggan", "bottle-no3.png",
           [("Ugu xooggan", "#b8243a", "xooggan"), ("Romance N°3", "#c9a24b", ("romance",))])
    s_shop("l8"); s_contact("l9", "bottle-cut.png")
    s_cta("l10", f"Romance<br />N°{n}", TAIF_AR, "TAIF AL EMARAT", "bottle-cut.png", "romance")
    BRAND = f"TAIF AL EMARAT · ROMANCE N°{n}"
elif KEY == "kash":
    s_hook_single("l1", "ARABIAN OUD", "Kashmir Musk", "Arabian Oud", "kashmir", "bottle-cut.png", 250, 590)
    s_hero("l2", "KASHMIR MUSK", "Misk jilicsan", "sida dhar kashmir", "set-cut.png",
           [("Misk jilicsan", "#e3c173", "misk"), ("Kashmir", "#aab4c0", ("kashmir",)), ("Ragga + dumarka", "#1c3f86", "ragga")], bw=400, bh=430)
    s_notes("l3", "BILOWGA", "Bilowga", "pear · filfil · bergamot",
            [("Ubaxa pear", "Bilowga", "pear"), ("Filfil casaan", "Bilowga", "filfil"), ("Bergamot", "Bilowga", "bergamot")], "bottle-cut.png", 150, 413)
    s_notes("l4", "WADNAHA", "Wadnaha", "jasmine iyo tuberose",
            [("Jasmine", "Wadnaha", "jasmine"), ("Tuberose", "Wadnaha", "tuberose")], "bottle-cut.png", 170, 469)
    s_notes("l5", "SALKA", "Salka", "misk iyo patchouli",
            [("Misk", "Salka", "misk"), ("Patchouli", "Salka", "patchouli")], "bottle-cut.png", 170, 469)
    s_facts("l6", "ARABIAN OUD", "Riyaad", "laga bilaabo 1982", [
        ("1982", "Sannadka", "#c9a24b", "kun", None), ("", "Riyaad", "#006c35", "riyaad", FLAG_SA)], "box-cut.png", 230, 379)
    s_facts("l7", "MAANTA", "1200+ dukaan", "37 waddan", [
        ("1200+", "Dukaan", "#c9a24b", "dukaan", None), ("37", "Waddan", "#1c3f86", "soddon", None)], "bottle-cut.png", 150, 413)
    s_shop("l8"); s_contact("l9", "bottle-cut.png", 150, 413)
    s_cta("l10", "Kashmir<br />Musk", "العربية للعود", "ARABIAN OUD", "bottle-cut.png", "kashmir", 200, 551)
    BRAND = "ARABIAN OUD · KASHMIR MUSK"
elif KEY == "mad":
    s_hook_single("l1", "ARABIAN OUD", "Madawi", "Arabian Oud", "madawi", "bottle-cut.png", 210, 602)
    s_hero("l2", "SHEEKADA", "Hooyo", "xushmadda hooyada", "set-cut.png",
           [("Xushmad", "#c9a24b", "xushmadda"), ("Hooyada", "#b8243a", "hooyada")], extra=(HEART, "aasaasihii"), bw=400, bh=451)
    s_facts("l3", "SAMEEYAYAASHA", "Laba khabiir", "cadar", [
        ("CL", "Claire Liégent", "#c9a24b", "claire", None), ("DR", "Dominique Ropion", "#1c3f86", "dominique", None)])
    s_notes("l4", "UDGOONKA", "Bilowga", "iyo wadnaha",
            [("Peach", "Bilowga", "peach"), ("Ubaxa tufaaxa", "Bilowga", "tufaaxa"), ("Ubaxa cananaaska", "Wadnaha", "cananaaska")], "bottle-cut.png", 140, 401)
    s_notes("l5", "SALKA", "Salka", "misk · ward · patchouli",
            [("Misk", "Salka", "misk"), ("Ward duurjoog", "Salka", "ward"), ("Patchouli", "Salka", "patchouli")], "bottle-cut.png", 140, 401)
    s_twodisc("l6", "BARI + GALBEED", "Bari + Galbeed", "isku dar", (COMPASS, "Bariga", "#c9a24b", "bariga", None),
              (flower("#fbd3e0", "#ffe08a", 6), "Galbeedka", "#1c3f86", "galbeedka", None), "bottle-cut.png", 140, 401)
    s_shop("l7"); s_contact("l8", "bottle-cut.png", 140, 401)
    s_cta("l9", "Madawi", "مضاوي", "ARABIAN OUD", "bottle-cut.png", "madawi", 200, 573)
    BRAND = "ARABIAN OUD · MADAWI"

css = '''      .photo { position: absolute; overflow: hidden; background: #fff; border: 10px solid #fff; box-shadow: 0 0 0 5px var(--gold), 0 18px 28px rgba(74, 46, 26, 0.28); }
      .photo img { display: block; width: 100%; height: 100%; object-fit: cover; }
      .round { border-radius: 50%; }
      .cut { position: absolute; filter: drop-shadow(0 18px 18px rgba(74, 46, 26, 0.3)); }
      .cut img { display: block; width: 100%; height: 100%; object-fit: contain; }
      .disc2 { position: absolute; border-radius: 50%; background: #fff; box-shadow: 0 14px 20px rgba(74, 46, 26, 0.16); display: flex; align-items: center; justify-content: center; overflow: hidden; }
      .disc2.col { flex-direction: column; }
      .banx { position: absolute; inset: 0; width: 100%; height: 100%; }
      .note { position: absolute; }
      .note .tier { font-family: "Cinzel"; font-weight: 900; font-size: 26px; letter-spacing: 0.14em; color: var(--brown2); text-transform: uppercase; }
      .note .nm { font-family: "Dancing Script"; font-weight: 700; font-size: 74px; line-height: 1.05; color: var(--blue); white-space: nowrap; }
      .shopname { position: absolute; left: 460px; top: 30px; width: 420px; text-align: center; font-family: "Dancing Script"; font-weight: 700; font-size: 110px; line-height: 1; color: var(--blue); }
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
    "slidein": 'tl.fromTo("{s}", {{ x: 120, opacity: 0 }}, {{ x: 0, opacity: 1, duration: 0.4, ease: "power3.out" }}, {t});',
    "sparks": 'tl.fromTo("{s}", {{ scale: 0, opacity: 0, transformOrigin: "50% 50%" }}, {{ scale: 1, opacity: 1, duration: 0.3, stagger: 0.12, ease: "back.out(3)" }}, {t});',
    "row": 'tl.fromTo("{s} .hi", {{ opacity: 0 }}, {{ opacity: 1, duration: 0.2 }}, {t}); tl.fromTo("{s} text", {{ x: -20, opacity: 0 }}, {{ x: 0, opacity: 1, duration: 0.3, ease: "back.out(3)" }}, {t});',
    "spin": 'tl.fromTo("{s}", {{ rotation: -20 }}, {{ rotation: 0, duration: 0.5, ease: "elastic.out(1, 0.4)" }}, {t});',
    "waves": 'tl.fromTo("{s}", {{ opacity: 0, x: -30 }}, {{ opacity: 1, x: 0, duration: 0.4, stagger: 0.15, ease: "power2.out" }}, {t});',
    "ring": 'tl.fromTo("{s}", {{ opacity: 0 }}, {{ opacity: 1, duration: 0.12, yoyo: true, repeat: 7 }}, {t});',
    "bounce": 'tl.fromTo("{s}", {{ y: -30, opacity: 0 }}, {{ y: 0, opacity: 1, duration: 0.3, ease: "power2.out" }}, {t}); tl.to("{s}", {{ y: 22, duration: 0.3, yoyo: true, repeat: 5, ease: "sine.inOut" }}, {t}+0.35);',
    "buy": 'tl.fromTo("{s}", {{ y: 240, opacity: 0 }}, {{ y: 0, opacity: 1, duration: 0.35, ease: "back.out(2)" }}, {t}-0.1); tl.fromTo("{s}", {{ scale: 1 }}, {{ scale: 1.06, duration: 0.3, yoyo: true, repeat: 3, ease: "sine.inOut" }}, {t}+0.4);',
}
jstext = "      // product scenes (generated by adgen.py)\n" + "\n".join("      " + JS[k].format(s=s, t=t) for k, s, t in js) + "\n\n"

head = BASE[: BASE.index("      /* 1 hook */")]
head = re.sub(r"<title>.*?</title>", f"<title>{BRAND.split(' · ')[-1].title()}</title>", head)
head = re.sub(r"      /\* real product photos in heritage frames \*/.*\Z", "", head, flags=re.S)
caps = BASE[BASE.index("      /* captions:") : BASE.index("    </style>")]
body_open = BASE[BASE.index("    </style>") : BASE.index('      <svg width="0"')]
chrome = BASE[BASE.index("      <!-- persistent chrome") : BASE.index("      // 1 hook:")].replace("AL MAJED OUD · CUUD", BRAND)
tail = BASE[BASE.index("      // captions: word-by-word") :]
out = head + css + caps + body_open + "".join(secs) + "\n" + chrome + jstext + tail
open(f"{ROOT}/src/template.html.tmpl", "w").write(out)
ids = re.findall(r'id="([^"]+)"', out)
dup = [i for i in set(ids) if ids.count(i) > 1]
assert not dup, dup

bp = open(f"{ROOT}/src/build.py").read()
bp = re.sub(r'"""Generate index.html for the Somali .*? from', f'"""Generate index.html for the Somali {BRAND.split(" · ")[-1].title()} ad from', bp, flags=re.S)
a = bp.index("beats = {"); b = bp.index("}\n", a) + 2
lines = []
for k, (sc, w, nth, ex) in beats.items():
    extra = (f", {nth}" if nth else "") + (", exact=True" if ex else "")
    lines.append(f'    "{k}": word_time("{sc}", "{w}"{extra}),\n')
bp = bp[:a] + "beats = {\n" + "".join(lines) + "}\n" + bp[b:]
dings = [k for k in ("brand", "shop", "buy") if k in beats]
pops = [k for k in beats if k not in dings + ["cname", "num"]]
bp = re.sub(r"pops = \[.*?\]", "pops = " + repr(pops).replace("'", '"'), bp)
bp = re.sub(r"for i, k in enumerate\(\[.*?\]\)", "for i, k in enumerate(" + repr(dings).replace("'", '"') + ")", bp)
open(f"{ROOT}/src/build.py", "w").write(bp)
print(KEY, "ok", len(js), "anims,", len(beats), "beats")
