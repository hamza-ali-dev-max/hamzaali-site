"""Continuous 2D map camera: AI world map -> regional layers R1..R4, one move, one look.

World space is the Montreal-centred local projection in km (x east, y north), shared with
regional.py and the Blender scene. The AI world map is placed into it with the calibrated
affine (anchored so Montreal = its visible light cluster).

A camera is (qc, V, w):  qc = km point at screen centre, V = view width in km,
w = shape blend: 0 = the AI map's own proportions (plain image zoom), 1 = true metric
north-up (what the regional layers and Blender use). The zoom eases w from 0 to 1 while
the AI map hands over to R1, so nothing visibly warps.
"""
import json
import math
from functools import lru_cache

import cv2
import numpy as np
from PIL import Image

import look
from geo import CENTER, CITY, ROOT, city_build_dir, city_calibration, load_calibration

MAPS = ROOT / "assets" / "maps"
REG = city_build_dir("regional")
W, H = look.W, look.H
C = np.array([W / 2, H / 2])
LAT0, LON0 = CENTER

# layer crossfades by view width V (km): (start fading in, fully in)
LAYER_IN = {"R1": (7000, 5000), "R2": (1900, 1400), "R3": (480, 360), "R4": (120, 95)}
SHAPE_BLEND = (9000, 4200)          # w goes 0 -> 1 across this V range


def smoothstep(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def ease(t):                         # smootherstep 0..1
    t = np.clip(t, 0, 1)
    return t * t * t * (t * (6 * t - 15) + 10)


def log_fade(v_out, v_in, V):
    """0 when V >= v_out, 1 when V <= v_in (interpolated in log V)."""
    return float(smoothstep(math.log(v_out), math.log(v_in), math.log(V)))


class World:
    def __init__(self):
        cal = load_calibration()
        meta = json.loads((REG / "meta.json").read_text())
        self.kx, self.ky = meta["km_per_deg_lon"], meta["km_per_deg_lat"]
        cax, cay, anchor = city_calibration(cal)
        ax, ay = np.array(cax), np.array(cay)
        # km -> AI px linear part (lon = LON0 + x/KX, lat = LAT0 + y/KY)
        self.B = np.array([[ax[0] / self.kx, ax[1] / self.ky], [ay[0] / self.kx, ay[1] / self.ky]])
        self.Binv = np.linalg.inv(self.B)
        self.anchor = np.array(anchor, dtype=np.float64)
        self.g = cal["global"]
        self.sh0 = self.B / math.sqrt(abs(np.linalg.det(self.B)))
        self.sh1 = np.array([[1.0, 0.0], [0.0, -1.0]])
        self.layers = meta["layers"]
        self.ai = {}
        self.ai2 = {}
        for k in ("base_night", "aurora_impact", "blackout"):
            self.ai[k] = np.asarray(Image.open(MAPS / f"{k}.png").convert("RGB"))
            self.ai2[k] = sharpen_2x(self.ai[k])
        self.ai_px_size = self.ai["base_night"].shape[1::-1]
        self.layer_px = tuple(meta["px"])
        self._pyr = {}
        self.ne_outline = self._ne_outline_mask()

    # ---- geometry
    def L(self, V, w):
        sh = (1 - w) * self.sh0 + w * self.sh1
        sh = sh / math.sqrt(abs(np.linalg.det(sh)))
        s = W / V                                        # screen px per km (geometric mean)
        return s * sh

    def cam_from_ai(self, c_ai, s_ai):
        """Camera equivalent to a plain image zoom of the AI map: centre px, screen px per AI px."""
        qc = self.Binv @ (np.asarray(c_ai, float) - self.anchor)
        V = W / (s_ai * math.sqrt(abs(np.linalg.det(self.B))))
        return qc, V

    def km_to_screen(self, q, cam):
        qc, V, w = cam
        return (self.L(V, w) @ (np.asarray(q, float).T - np.asarray(qc)[:, None])).T + C

    def lonlat_to_km(self, lon, lat):
        return (np.asarray(lon) - LON0) * self.kx, (np.asarray(lat) - LAT0) * self.ky

    def km_to_lonlat(self, x, y):
        return LON0 + np.asarray(x) / self.kx, LAT0 + np.asarray(y) / self.ky

    def lonlat_to_screen(self, lon, lat, cam):
        """World-phase points follow the AI map's global fit, regional ones true geography."""
        qc, V, w = cam
        x, y = self.lonlat_to_km(lon, lat)
        reg = self.km_to_screen(np.stack([x, y], 1), cam)
        if w >= 0.999:
            return reg[:, 0], reg[:, 1]
        gx = self.g["a"] * np.asarray(lon) + self.g["b"]
        gy = self.g["c"] * np.asarray(lat) + self.g["d"]
        q_ai = (self.Binv @ (np.stack([gx, gy], 0) - self.anchor[:, None])).T
        wor = self.km_to_screen(q_ai, cam)
        out = (1 - w) * wor + w * reg
        return out[:, 0], out[:, 1]

    def view_center_lonlat(self, cam):
        qc, V, w = cam
        lon_r, lat_r = self.km_to_lonlat(*qc)
        p = self.B @ np.asarray(qc) + self.anchor
        lon_w = (p[0] - self.g["b"]) / self.g["a"]
        lat_w = (p[1] - self.g["d"]) / self.g["c"]
        return (1 - w) * lon_w + w * lon_r, (1 - w) * lat_w + w * lat_r

    # ---- drawing
    def M_ai(self, cam):
        qc, V, w = cam
        L = self.L(V, w)
        A = L @ self.Binv
        t = -A @ self.anchor - L @ np.asarray(qc) + C
        return np.hstack([A, t[:, None]])

    def pyramid(self, name, state):
        key = (name, state)
        if key not in self._pyr:
            img = np.asarray(Image.open(REG / f"{name}_{state}.png").convert("RGB"))
            levels = [img]
            while levels[-1].shape[1] > 500:
                levels.append(cv2.pyrDown(levels[-1]))
            self._pyr[key] = levels
        return self._pyr[key]

    def M_layer(self, name, level, cam):
        qc, V, w = cam
        g = self.layers[name]
        f = 2 ** level
        D = np.array([[g["res_km"] * f, 0.0], [0.0, -g["res_km"] * f]])
        e = np.array([-g["width_km"] / 2, g["height_km"] / 2])
        L = self.L(V, w)
        return np.hstack([L @ D, (L @ (e - np.asarray(qc)) + C)[:, None]])

    def draw_layer(self, name, state, cam):
        """Warp one regional layer (trilinear between pyramid levels) + its feathered alpha."""
        qc, V, w = cam
        g = self.layers[name]
        mag = W / V * g["res_km"]                     # screen px per layer texel
        lv = max(0.0, -math.log2(max(mag, 1e-6)))
        pyr = self.pyramid(name, state)
        l0 = min(int(lv), len(pyr) - 1)
        l1 = min(l0 + 1, len(pyr) - 1)
        fr = lv - int(lv) if l1 != l0 else 0.0
        out = None
        for lvl, wt in ((l0, 1 - fr), (l1, fr)):
            if wt <= 0.001:
                continue
            im = cv2.warpAffine(pyr[lvl], self.M_layer(name, lvl, cam), (W, H), flags=cv2.INTER_CUBIC,
                                borderMode=cv2.BORDER_REPLICATE).astype(np.float32) * (wt / 255.0)
            out = im if out is None else out + im
        # feathered alpha: 1 inside, fading over the outer 6% of the layer
        a = self.alpha_template()
        Ma = self.M_layer(name, 0, cam).copy()
        Ma[:, :2] *= PX_SCALE
        alpha = cv2.warpAffine(a, Ma, (W, H), flags=cv2.INTER_LINEAR, borderValue=0)
        return out, alpha

    @lru_cache(maxsize=1)
    def alpha_template(self):
        w, h = self.layer_px[0] // PX_SCALE, self.layer_px[1] // PX_SCALE
        yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
        d = np.minimum.reduce([xx, yy, w - 1 - xx, h - 1 - yy]) / (0.06 * w)
        return np.clip(d, 0, 1) ** 1.5

    def draw_outline(self, name, cam):
        key = (name, "outline")
        if key not in self._pyr:
            self._pyr[key] = [np.asarray(Image.open(REG / f"{name}_outline.png").convert("L"))]
        return cv2.warpAffine(self._pyr[key][0], self.M_layer(name, 0, cam), (W, H), flags=cv2.INTER_LINEAR).astype(np.float32) / 255

    def _ne_outline_mask(self):
        """Red NE-North-America outline pixels of blackout.png (for the pulse)."""
        img = self.ai["blackout"].astype(np.int32)
        R, G, B = img[..., 0], img[..., 1], img[..., 2]
        red = ((R > 110) & (R - np.maximum(G, B) > 50)).astype(np.float32)
        roi = np.zeros_like(red)
        roi[40:290, 170:430] = 1
        return cv2.dilate(red * roi, np.ones((2, 2), np.uint8))

    def render_map(self, cam, ai_mix, layer_state, outline_pulse=0.0):
        """ai_mix: dict of AI map name -> weight. layer_state: 'aurora' / 'blackout' / 'normal'."""
        qc, V, w = cam
        M = self.M_ai(cam)
        frame = None
        M2 = M.copy()
        M2[:, :2] *= 0.5                       # sample the sharpened 2x copy
        for k, wt in ai_mix.items():
            if wt <= 0:
                continue
            src = self.ai2[k]
            im = cv2.warpAffine(src, M2, (W, H), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_CONSTANT, borderValue=look.OCEAN).astype(np.float32) * (wt / 255.0)
            frame = im if frame is None else frame + im
        if outline_pulse and ai_mix.get("blackout", 0) > 0:
            m = cv2.warpAffine(self.ne_outline, M, (W, H), flags=cv2.INTER_LINEAR)
            glow = cv2.GaussianBlur(m, (0, 0), 4.0)
            red = np.array(look.RED, np.float32) / 255
            frame += (outline_pulse * ai_mix["blackout"] * (0.9 * m + 1.4 * glow))[..., None] * red
        for name, (v_out, v_in) in LAYER_IN.items():
            a = log_fade(v_out, v_in, V)
            if a <= 0.002:
                continue
            g = self.layers[name]
            if V > g["width_km"] * 1.6:
                continue
            lay, alpha = self.draw_layer(name, layer_state, cam)
            if layer_state == "blackout" and outline_pulse:
                o = self.draw_outline(name, cam)
                red = np.array(look.RED, np.float32) / 255
                lay += (outline_pulse * (o + 1.2 * cv2.GaussianBlur(o, (0, 0), 3.0)))[..., None] * red
            aa = (a * alpha)[..., None]
            frame = frame * (1 - aa) + lay * aa
        return frame


PX_SCALE = 10            # alpha template is 1/10 of the layer resolution


def sharpen_2x(img):
    """2x Lanczos upscale + gentle unsharp mask: crisper coastlines and lights when zoomed."""
    up = cv2.resize(img, None, fx=2, fy=2, interpolation=cv2.INTER_LANCZOS4).astype(np.float32)
    blur = cv2.GaussianBlur(up, (0, 0), 1.6)
    return np.clip(up + 0.75 * (up - blur), 0, 255).astype(np.uint8)


def grid_projector(world, cam):
    def proj(lon, lat):
        return world.lonlat_to_screen(lon, lat, cam)
    return proj


def view_lonlat_box(world, cam, margin=0.15):
    qc, V, w = cam
    lon_c, lat_c = world.view_center_lonlat(cam)
    half_w = V / 2 * (1 + margin)
    half_h = V * H / W / 2 * (1 + margin)
    # generous box in degrees (the grid clips itself on screen)
    dlon = half_w / world.kx * (1.6 if w < 1 else 1.1)
    dlat = half_h / world.ky * (1.8 if w < 1 else 1.1)
    return (lon_c - dlon, max(-85, lat_c - dlat), lon_c + dlon, min(88, lat_c + dlat))


def px_per_degree_lat(world, cam):
    qc, V, w = cam
    reg = W / V * world.ky
    wor = W / V * abs(world.g["c"]) / math.sqrt(abs(np.linalg.det(world.B)))
    return (1 - w) * wor + w * reg
