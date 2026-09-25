"""The shared "emergency operations centre monitor" look: map-space lat/long grid,
glow, CRT scanlines, vignette, grain, and the HUD pinned to the top edge.

Colours are sampled from base_night.png so every shot (map, regional layers, Blender
city) sits in one palette. All frame maths is float32 RGB in 0..1.
"""
from functools import lru_cache

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H, FPS = 1920, 1080, 30

# palette (sRGB 0..255), sampled from base_night.png
OCEAN = (1, 12, 22)
LAND = (53, 57, 60)
COAST = (77, 141, 160)
GOLD = (240, 197, 119)
GOLD_HOT = (253, 234, 167)
# HUD
CYAN = (110, 222, 255)
AMBER = (255, 178, 46)
RED = (255, 58, 48)
GRID = (95, 190, 225)

FONT_DIR = "/usr/share/fonts/truetype/jetbrains-mono/"


@lru_cache(maxsize=None)
def font(size, weight="Regular"):
    return ImageFont.truetype(f"{FONT_DIR}JetBrainsMono-{weight}.ttf", size)


# ------------------------------------------------------------------ screen effects

class Overlay:
    def __init__(self, w=W, h=H, seed=7, grain_frames=8):
        yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
        r = np.hypot((xx - w / 2) / (w / 2), (yy - h / 2) / (h / 2)) / np.sqrt(2)
        vignette = 1.0 - 0.34 * np.clip(r, 0, 1) ** 2.2
        # soft 4 px CRT scanlines (sinusoidal, ~7% depth) - gentle enough to survive YouTube
        scan = 1.0 - 0.07 * (0.5 + 0.5 * np.cos(2 * np.pi * yy / 4.0))
        self.sv = cv2.merge([vignette * scan] * 3).astype(np.float32)
        rng = np.random.default_rng(seed)
        self.grains = []
        for _ in range(grain_frames):
            n = rng.standard_normal((h // 2, w // 2)).astype(np.float32)
            n = cv2.resize(n, (w, h), interpolation=cv2.INTER_LINEAR)
            self.grains.append(cv2.merge([n, n, n]))
        self.w, self.h = w, h

    def glow(self, img, strength=0.55, thresh=0.55):
        small = cv2.resize(img, (self.w // 4, self.h // 4), interpolation=cv2.INTER_AREA)
        hi = cv2.max(cv2.subtract(small, (thresh, thresh, thresh, 0)), 0)
        g = cv2.addWeighted(cv2.GaussianBlur(hi, (0, 0), 2.5), 0.6, cv2.GaussianBlur(hi, (0, 0), 9.0), 0.4, 0)
        g = cv2.resize(g, (self.w, self.h), interpolation=cv2.INTER_LINEAR)
        return cv2.scaleAdd(g, strength, img)

    def finish(self, img, frame=0, grain=0.006):
        out = cv2.multiply(img, self.sv)
        if grain:
            out = cv2.scaleAdd(self.grains[frame % len(self.grains)], grain, out)
        return out


def to_u8(img):
    return (np.clip(img, 0, 1) * 255 + 0.5).astype(np.uint8)


def over(dst, rgba_u8, box=None):
    """Alpha-composite an RGBA uint8 layer over a float frame (in place, optional
    box = x0, y0, x1, y1 limits the work to where the layer has content)."""
    if box is None:
        a = rgba_u8[..., 3]
        rows, cols = np.flatnonzero(a.any(1)), np.flatnonzero(a.any(0))
        if not len(rows):
            return dst
        box = (cols[0], rows[0], cols[-1] + 1, rows[-1] + 1)
    x0, y0, x1, y1 = box
    lay = rgba_u8[y0:y1, x0:x1]
    a = lay[..., 3:4].astype(np.float32) * (1 / 255.0)
    d = dst[y0:y1, x0:x1]
    dst[y0:y1, x0:x1] = d + (lay[..., :3].astype(np.float32) * (1 / 255.0) - d) * a
    return dst


# ------------------------------------------------------------------ lat/long grid

GRID_LEVELS = [30, 15, 10, 5, 2, 1, 0.5, 0.25, 0.1, 0.05, 0.02, 0.01, 0.005, 0.002, 0.001]


def grid_levels(px_per_degree):
    """Pick the grid spacing whose on-screen gap is ~120-420 px; returns [(deg, alpha)]."""
    out = []
    for deg in GRID_LEVELS:
        gap = deg * px_per_degree
        if 60 <= gap <= 900:
            # fade in from 60->140 px, fade out from 420->900 px
            a = np.clip((gap - 60) / 80, 0, 1) * np.clip((900 - gap) / 480, 0, 1)
            if a > 0.02:
                out.append((deg, float(a)))
    return out


def fmt_lat(v, deg):
    d = max(0, int(np.ceil(-np.log10(deg))) if deg < 1 else 0)
    return f"{abs(v):.{d}f}°{'N' if v >= 0 else 'S'}"


def fmt_lon(v, deg):
    d = max(0, int(np.ceil(-np.log10(deg))) if deg < 1 else 0)
    v = (v + 180) % 360 - 180
    return f"{abs(v):.{d}f}°{'E' if v >= 0 else 'W'}"


def draw_grid(img, project, view_lonlat_box, px_per_degree, opacity=0.2, label_opacity=0.5,
              top_margin=118):
    """Additive faint grid. project(lon, lat) -> (x, y) screen arrays (any projection:
    lines are sampled densely so they may curve). view_lonlat_box = lon0, lat0, lon1, lat1."""
    lon0, lat0, lon1, lat1 = view_lonlat_box
    layer = np.zeros(img.shape, np.float32)
    col = tuple(c / 255.0 for c in GRID)
    labels = []
    for deg, a in grid_levels(px_per_degree):
        for kind in ("lon", "lat"):
            lo, hi = (lon0, lon1) if kind == "lon" else (lat0, lat1)
            vals = np.arange(np.floor(lo / deg) * deg, hi + deg, deg)
            if len(vals) > 120:
                continue
            for v in vals:
                if kind == "lon":
                    t = np.linspace(lat0, lat1, 64)
                    x, y = project(np.full_like(t, v), t)
                else:
                    t = np.linspace(lon0, lon1, 96)
                    x, y = project(t, np.full_like(t, v))
                pts = np.stack([x, y], 1)
                if not np.isfinite(pts).all():
                    continue
                cv2.polylines(layer, [np.round(pts * 16).astype(np.int32)], False,
                              tuple(a * c for c in col), 1, cv2.LINE_AA, shift=4)
                if deg * px_per_degree >= 150:        # label only well-spaced lines
                    labels.append((kind, v, deg, a, pts))
    img = cv2.scaleAdd(layer, opacity, img)
    return img, grid_labels(labels, img.shape, label_opacity, top_margin)


def grid_labels(labels, shape, label_opacity, top_margin):
    """Small degree labels where lines meet the left edge / the top (below the HUD)."""
    h, w = shape[:2]
    lay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    f = font(15)
    for kind, v, deg, a, pts in labels:
        if kind == "lat":
            # where the parallel crosses x = 14
            i = np.argmin(np.abs(pts[:, 0] - 14))
            x, y = 14, pts[i, 1]
            if not (top_margin + 10 < y < h - 20):
                continue
            txt = fmt_lat(v, deg)
            d.text((x, y - 20), txt, font=f, fill=GRID + (int(255 * label_opacity * a),))
        else:
            i = np.argmin(np.abs(pts[:, 1] - (top_margin + 8)))
            x, y = pts[i, 0], top_margin + 8
            if not (20 < x < w - 90):
                continue
            txt = fmt_lon(v, deg)
            d.text((x + 5, y), txt, font=f, fill=GRID + (int(255 * label_opacity * a),))
    return np.asarray(lay)


# ------------------------------------------------------------------ HUD

class HUD:
    """Top-edge readout. state = list of columns: (label, value, colour, value_size)."""

    TOP = 22
    BAND = 104

    HEIGHT = 160          # the HUD layer only covers the top band

    def __init__(self, w=W, h=HEIGHT):
        self.w, self.h = w, h
        grad = np.zeros((h, w, 4), np.uint8)
        a = np.clip(1 - np.arange(h) / 150.0, 0, 1) ** 1.6 * 0.78
        grad[..., 2] = 14
        grad[..., 1] = 8
        grad[..., 3] = (a * 255).astype(np.uint8)[:, None]
        self.band = grad
        self._cache = {}

    def render(self, columns, flash=0.0, blink_on=True):
        key = (tuple(columns), round(flash, 2), blink_on)
        if key in self._cache:
            return self._cache[key]
        lay = Image.fromarray(self.band.copy(), "RGBA")
        txt = Image.new("RGBA", (self.w, self.h), (0, 0, 0, 0))
        d = ImageDraw.Draw(txt)
        # divider line + ticks
        y_line = self.BAND
        d.line([(40, y_line), (self.w - 40, y_line)], fill=CYAN + (70,), width=1)
        for x in range(40, self.w - 39, 48):
            d.line([(x, y_line), (x, y_line + (7 if (x - 40) % 240 == 0 else 3))], fill=CYAN + (80,), width=1)
        x = 56
        for i, (label, value, colour, vsize, width) in enumerate(columns):
            d.text((x, self.TOP), label, font=font(16, "Medium"), fill=CYAN + (230,))
            if value:
                show = value if (blink_on or colour != RED or not value.endswith("●")) else value[:-1]
                d.text((x, self.TOP + 24), show, font=font(vsize, "Bold"), fill=colour + (255,))
            if i < len(columns) - 1:
                d.line([(x + width - 26, self.TOP + 2), (x + width - 26, self.BAND - 16)], fill=CYAN + (55,), width=1)
            x += width
        glow = txt.filter(ImageFilter.GaussianBlur(6))
        lay = Image.alpha_composite(lay, Image.eval(glow, lambda v: v).convert("RGBA"))
        lay = Image.alpha_composite(lay, txt)
        out = np.asarray(lay).copy()
        if flash > 0:          # brief red wash on critical events
            out[..., 0] = np.maximum(out[..., 0], (255 * flash * 0.6)).astype(np.uint8)
            out[..., 3] = np.maximum(out[..., 3], (70 * flash)).astype(np.uint8)
        if len(self._cache) > 64:
            self._cache.clear()
        self._cache[key] = out
        return out


def fmt_int(n):
    return f"{int(round(n)):,}"
