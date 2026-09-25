"""On-screen graphics shared by every chapter (all text is added in the edit, never in AI
images): map labels, target reticle, picture-in-picture clip boxes with leader arrows,
radio panel with waveform + subtitles, lower third, fictional headline cards.
Everything returns / draws RGBA layers in the HUD palette (look.py)."""
import math

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

import look
from look import AMBER, CYAN, RED, font


def _glowed(layer, radius=5, strength=1.0):
    g = layer.filter(ImageFilter.GaussianBlur(radius))
    if strength != 1.0:
        a = np.asarray(g).copy()
        a[..., 3] = np.clip(a[..., 3] * strength, 0, 255).astype(np.uint8)
        g = Image.fromarray(a)
    return Image.alpha_composite(g, layer)


def text_spaced(d, xy, txt, fnt, fill, spacing=0):
    x, y = xy
    for ch in txt:
        d.text((x, y), ch, font=fnt, fill=fill)
        x += d.textlength(ch, font=fnt) + spacing
    return x


def map_label(size, xy, title, sub=None, alpha=1.0, colour=CYAN):
    """Region label: letter-spaced title with a thin rule and optional amber sub-line."""
    lay = Image.new("RGBA", size, (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    a = int(255 * alpha)
    x, y = xy
    end = text_spaced(d, (x, y), title, font(44, "Bold"), colour + (a,), spacing=10)
    d.line([(x, y + 58), (end, y + 58)], fill=colour + (int(a * 0.6),), width=1)
    if sub:
        d.text((x, y + 66), sub, font=font(20, "Medium"), fill=AMBER + (a,))
    return _glowed(lay, 6)


def reticle(size, center, t_on, name, coords, alpha=1.0):
    """Target lock: ring shrinks onto the point, ticks, label to the right."""
    lay = Image.new("RGBA", size, (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    k = min(1.0, max(0.0, t_on / 0.6))
    e = 1 - (1 - k) ** 3
    r = 150 - 88 * e
    a = int(255 * alpha * min(1.0, t_on / 0.25))
    cx, cy = center
    d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=CYAN + (a,), width=2)
    for ang in (0, 90, 180, 270):
        dx, dy = math.cos(math.radians(ang)), math.sin(math.radians(ang))
        d.line([(cx + dx * (r - 14), cy + dy * (r - 14)), (cx + dx * (r + 16), cy + dy * (r + 16))], fill=CYAN + (a,), width=2)
    d.ellipse([cx - 3, cy - 3, cx + 3, cy + 3], fill=AMBER + (a,))
    if k > 0.5:
        la = int(a * min(1.0, (k - 0.5) / 0.3))
        tx = cx + r + 26
        d.line([(cx + r * 0.72, cy - r * 0.72), (tx - 6, cy - r * 0.72 - 24), (tx + 300, cy - r * 0.72 - 24)], fill=CYAN + (int(la * 0.7),), width=1)
        text_spaced(d, (tx, cy - r * 0.72 - 64), name, font(32, "Bold"), CYAN + (la,), spacing=6)
        d.text((tx, cy - r * 0.72 - 18), coords, font=font(20, "Medium"), fill=AMBER + (la,))
    return _glowed(lay, 5)


def pip_box(size, video_rgb, box, anchor, label, t_on, live=True):
    """Picture-in-picture clip box with a cyan frame, label bar and a leader arrow that
    draws itself from the box to the map location. box = (x, y, w, h), anchor = (x, y)."""
    lay = Image.new("RGBA", size, (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    x, y, w, h = box
    k = min(1.0, max(0.0, t_on / 0.5))
    e = 1 - (1 - k) ** 3
    # leader: from the nearest box corner to the anchor, drawn on
    corners = [(x, y), (x + w, y), (x, y + h), (x + w, y + h)]
    c0 = min(corners, key=lambda c: (c[0] - anchor[0]) ** 2 + (c[1] - anchor[1]) ** 2)
    ex = c0[0] + (anchor[0] - c0[0]) * e
    ey = c0[1] + (anchor[1] - c0[1]) * e
    d.line([c0, (ex, ey)], fill=CYAN + (220,), width=2)
    if e > 0.95:
        ang = math.atan2(anchor[1] - c0[1], anchor[0] - c0[0])
        for s in (-1, 1):
            d.line([(ex, ey), (ex - 16 * math.cos(ang + s * 0.45), ey - 16 * math.sin(ang + s * 0.45))], fill=CYAN + (230,), width=2)
        rr = 7 + 3 * math.sin(t_on * 6)
        d.ellipse([anchor[0] - rr, anchor[1] - rr, anchor[0] + rr, anchor[1] + rr], outline=AMBER + (230,), width=2)
    # box grows open after the leader lands
    g = min(1.0, max(0.0, (t_on - 0.35) / 0.35))
    if g > 0:
        gh = max(2, int(h * (1 - (1 - g) ** 3)))
        yy = y + (h - gh) // 2
        if video_rgb is not None:
            v = Image.fromarray(video_rgb).resize((w, h), Image.LANCZOS).crop((0, (h - gh) // 2, w, (h - gh) // 2 + gh))
            lay.paste(v, (x, yy))
        d.rectangle([x - 1, yy - 1, x + w, yy + gh], outline=CYAN + (235,), width=2)
        if g >= 1:
            d.rectangle([x - 1, y + h, x + w, y + h + 30], fill=(4, 14, 24, 225))
            tx = x + 10
            if live:
                d.ellipse([tx, y + h + 10, tx + 10, y + h + 20], fill=RED + (255,))
                tx += 18
            d.text((tx, y + h + 5), label, font=font(17, "Bold"), fill=CYAN + (255,))
    return _glowed(lay, 4, 0.8)


def radio_panel(size, t_on, channel, waveform, subtitle, alpha=1.0):
    """Bottom-left radio: channel header, live waveform bars, subtitle line."""
    lay = Image.new("RGBA", size, (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    W_, H_ = size
    k = min(1.0, max(0.0, t_on / 0.4)) * alpha
    x, y, w, h = 48, H_ - 250, 620, 196
    a = int(255 * k)
    d.rectangle([x, y, x + w, y + h], fill=(3, 12, 20, int(205 * k)), outline=CYAN + (int(170 * k),), width=2)
    d.rectangle([x, y, x + w, y + 34], fill=(8, 30, 44, int(230 * k)))
    d.ellipse([x + 12, y + 12, x + 22, y + 22], fill=RED + (a,) if int(t_on * 2) % 2 == 0 else AMBER + (a,))
    d.text((x + 32, y + 6), channel, font=font(18, "Bold"), fill=CYAN + (a,))
    d.text((x + w - 118, y + 7), "RX", font=font(16, "Medium"), fill=AMBER + (a,))
    for j in range(4):                                  # signal-strength bars
        bh = 6 + 4 * j
        on = j < 3 or int(t_on * 3) % 2 == 0
        d.rectangle([x + w - 88 + j * 12, y + 25 - bh, x + w - 81 + j * 12, y + 25],
                    fill=(AMBER + (a,)) if on else (AMBER + (int(a * 0.25),)))
    # waveform bars
    n = len(waveform)
    bw = (w - 40) / n
    mid = y + 34 + 46
    for i, v in enumerate(waveform):
        bh = max(2, v * 38)
        bx = x + 20 + i * bw
        d.rectangle([bx, mid - bh, bx + bw * 0.6, mid + bh], fill=AMBER + (int(a * 0.9),))
    if subtitle:
        d.text((x + 20, y + h - 58), subtitle, font=font(21, "Medium"), fill=(235, 240, 245, a))
    return _glowed(lay, 3, 0.7)


def lower_third(size, t_on, network, tag, place, alpha=1.0):
    """'GNN · LIVE · MONTREAL' style strap (fictional network)."""
    lay = Image.new("RGBA", size, (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    W_, H_ = size
    k = 1 - (1 - min(1.0, max(0.0, t_on / 0.45))) ** 3
    a = int(255 * alpha)
    x0, y0 = 90, H_ - 190
    wbar = int(760 * k)
    d.rectangle([x0, y0, x0 + wbar, y0 + 64], fill=(4, 14, 24, int(230 * alpha)))
    d.rectangle([x0, y0, x0 + min(wbar, 150), y0 + 64], fill=RED + (a,))
    if k > 0.6:
        d.text((x0 + 22, y0 + 10), network, font=font(38, "ExtraBold"), fill=(255, 255, 255, a))
        text_spaced(d, (x0 + 170, y0 + 14), f"{tag} · {place}", font(32, "Bold"), CYAN + (a,), spacing=3)
    return lay


def headline_card(size, t_on, outlet, headline, dek, stamp, alpha=1.0, side="right", y=170):
    """Fictional news headline card that slides in from the screen edge on `side`."""
    lay = Image.new("RGBA", size, (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    W_, H_ = size
    k = 1 - (1 - min(1.0, max(0.0, t_on / 0.5))) ** 3
    w, h = 620, 250
    x = W_ - 60 - int(w * k) if side == "right" else 60 - w + int(w * k)
    a = int(255 * alpha)
    d.rectangle([x, y, x + w, y + h], fill=(236, 238, 240, int(245 * alpha)))
    d.rectangle([x, y, x + w, y + 44], fill=(20, 22, 26, a))
    d.text((x + 16, y + 9), outlet, font=font(22, "ExtraBold"), fill=(255, 255, 255, a))
    d.text((x + w - 200, y + 12), stamp, font=font(16, "Medium"), fill=(190, 195, 200, a))
    yy = y + 58
    for line in _wrap(d, headline, font(30, "ExtraBold"), w - 32):
        d.text((x + 16, yy), line, font=font(30, "ExtraBold"), fill=(18, 18, 20, a))
        yy += 36
    for line in _wrap(d, dek, font(18, "Regular"), w - 32)[:2]:
        d.text((x + 16, yy + 6), line, font=font(18, "Regular"), fill=(70, 72, 78, a))
        yy += 24
    return lay


def _wrap(d, text, fnt, width):
    words, lines, cur = text.split(), [], ""
    for wd in words:
        test = (cur + " " + wd).strip()
        if d.textlength(test, font=fnt) <= width:
            cur = test
        else:
            lines.append(cur)
            cur = wd
    if cur:
        lines.append(cur)
    return lines


def np_rgba(img):
    return np.asarray(img)
