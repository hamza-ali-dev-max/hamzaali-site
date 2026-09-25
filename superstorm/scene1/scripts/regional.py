"""Regional detail layers for continuous zooms from the AI world map down to ~100 km.

Four nested layers, each 5400 x 3038 px, in a local equirectangular projection centred
on Montreal (x = east km, y = north km, true proportions at 45.5 N):

    R1  8000 km wide   2.22 km/px   GSHHG 'i'
    R2  2000 km wide   0.56 km/px   GSHHG 'h'
    R3   500 km wide   0.14 km/px   GSHHG 'f'
    R4   125 km wide   0.035 km/px  GSHHG 'f'

Content matches the AI map's palette: textured navy ocean, blue-grey land, cyan coastline
glow, faint borders and rivers, gold town lights (GeoNames, sized by population) with faint
lit-road links, and the aurora glow lifted from aurora_impact.png. A 'blackout' variant
turns off every town whose spot lost its light between base_night.png and blackout.png
(so the regional layers go dark exactly where the AI map does) and draws the red outline
as a separate mask for pulsing.

Outputs: build/regional/{R1..R4}_{normal,aurora,blackout}.png, {R}_outline.png, meta.json
"""
import json
import math

import cv2
import numpy as np
from PIL import Image

import look
from geo import MONTREAL, ROOT, boundaries, load_calibration, towns

OUT = ROOT / "build" / "regional"
MAPS = ROOT / "assets" / "maps"
LAT0, LON0 = MONTREAL
KX = 6371.0 * math.cos(math.radians(LAT0)) * math.pi / 180     # km per degree of longitude
KY = 6371.0 * math.pi / 180                                    # km per degree of latitude
PX_W, PX_H = 5400, 3038
LAYERS = {"R1": (8000.0, "i"), "R2": (2000.0, "h"), "R3": (500.0, "f"), "R4": (125.0, "f")}
AURORA_GAIN = {"R1": 1.0, "R2": 0.55, "R3": 0.35, "R4": 0.25}
MIN_LAKE_PX = 900        # skip lakes smaller than ~30x30 layer px (they appear as you zoom in)


def geometry(name):
    width_km, res_code = LAYERS[name]
    res = width_km / PX_W
    return {"name": name, "width_km": width_km, "height_km": res * PX_H, "res_km": res, "gshhs": res_code}


def to_px(lon, lat, g):
    x = (np.asarray(lon) - LON0) * KX
    y = (np.asarray(lat) - LAT0) * KY
    return (x + g["width_km"] / 2) / g["res_km"], (g["height_km"] / 2 - y) / g["res_km"]


def px_grid_lonlat(g):
    u = np.arange(PX_W, dtype=np.float32)
    v = np.arange(PX_H, dtype=np.float32)
    x = u * g["res_km"] - g["width_km"] / 2
    y = g["height_km"] / 2 - v * g["res_km"]
    return x, y                                    # km axes (separable)


def lonlat_bbox(g, margin=0.08):
    w, h = g["width_km"] * (0.5 + margin), g["height_km"] * (0.5 + margin)
    return (LON0 - w / KX, LAT0 - h / KY, LON0 + w / KX, LAT0 + h / KY)


# ------------------------------------------------------------------ procedural texture

def value_noise(x_km, y_km, cell_km, seed):
    """Smooth value noise on a km-anchored lattice, so every layer shows the same texture."""
    gx, gy = x_km[None, :] / cell_km, y_km[:, None] / cell_km
    ix, iy = np.floor(gx).astype(np.int64), np.floor(gy).astype(np.int64)
    fx, fy = gx - ix, gy - iy
    fx, fy = fx * fx * (3 - 2 * fx), fy * fy * (3 - 2 * fy)

    def h(i, j):
        v = (i * 73856093) ^ (j * 19349663) ^ (seed * 83492791)
        v = (v ^ (v >> 13)) * 1274126177
        return ((v ^ (v >> 16)) & 0xFFFF).astype(np.float32) / 65535.0

    a, b = h(ix, iy), h(ix + 1, iy)
    c, d = h(ix, iy + 1), h(ix + 1, iy + 1)
    return (a + (b - a) * fx) + ((c + (d - c) * fx) - (a + (b - a) * fx)) * fy


def fbm(g, seed, cells=(800, 400, 200, 100, 50, 25, 12, 6, 3, 1.5, 0.75, 0.37, 0.18), ridged=False):
    x_km, y_km = px_grid_lonlat(g)
    out = np.zeros((PX_H, PX_W), np.float32)
    total = 0.0
    for k, c in enumerate(cells):
        if c < 2.5 * g["res_km"] or c > 3 * g["width_km"]:
            continue
        n = value_noise(x_km, y_km, c, seed + k)
        if ridged:
            n = 1 - np.abs(2 * n - 1)
        w = (c / cells[0]) ** 0.35
        out += w * (n - 0.5)
        total += w
    return out / max(total, 1e-6)


# ------------------------------------------------------------------ vector layers

def land_mask(g):
    m = np.zeros((PX_H, PX_W), np.uint8)
    polys = sorted(boundaries("gshhs", g["gshhs"], bbox=lonlat_bbox(g)), key=lambda r: r[0])
    for typ, arr in polys:
        x, y = to_px(arr[:, 0], arr[:, 1], g)
        if typ in (2, 4):
            area = 0.5 * abs(np.dot(x, np.roll(y, 1)) - np.dot(y, np.roll(x, 1)))
            if area < MIN_LAKE_PX:
                continue
        pts = np.round(np.stack([x, y], 1) * 16).astype(np.int32)
        cv2.fillPoly(m, [pts], 1 if typ in (1, 3) else 0, cv2.LINE_AA, shift=4)
    return m


def polylines(name, g, res=None, min_pts=2):
    out = []
    for typ, arr in boundaries(name, res or g["gshhs"], bbox=lonlat_bbox(g)):
        if len(arr) < min_pts:
            continue
        x, y = to_px(arr[:, 0], arr[:, 1], g)
        out.append(np.round(np.stack([x, y], 1) * 16).astype(np.int32))
    return out


def glow_line(mask_f, core_sigma, halo_sigma):
    core = cv2.GaussianBlur(mask_f, (0, 0), core_sigma) if core_sigma > 0 else mask_f
    halo = cv2.GaussianBlur(mask_f, (0, 0), halo_sigma)
    return core, halo


# ------------------------------------------------------------------ lights

def town_lights(g, state, loss_fn=None, rng_seed=3):
    """Gold light field from GeoNames towns (splat per population bin, km-sized glows)."""
    T = towns(500)
    x, y = to_px(T[:, 1], T[:, 0], g)
    ok = (x > -200) & (x < PX_W + 200) & (y > -200) & (y < PX_H + 200)
    T, x, y = T[ok], x[ok], y[ok]
    pop = T[:, 2]
    lum = pop ** 0.72
    keep = np.ones(len(T), np.float32)
    if state == "blackout" and loss_fn is not None:
        retained = loss_fn(T[:, 1], T[:, 0])
        rng = np.random.default_rng(rng_seed)
        dark = retained < 0.45
        keep[dark] = 0.02
        gens = dark & (rng.random(len(T)) < 0.03)          # a few buildings on generators
        keep[gens] = 0.3
    lum = lum * keep

    res = g["res_km"]
    field = np.zeros((PX_H, PX_W), np.float32)
    # peak brightness ~ (pop/5000)^0.6, capped: a metro reads as many overlapping
    # neighbourhood lights (GeoNames has them), not one giant disc
    peak = np.minimum((pop / 5000.0) ** 0.6, 2.2) * keep
    sig_km = np.minimum(0.25 * np.sqrt(pop / 1000.0), 2.5)
    bins = np.geomspace(0.12, 2.5, 10)
    idx = np.clip(np.digitize(sig_km, bins), 0, len(bins) - 1)
    xi = np.clip(np.round(x), 0, PX_W - 1).astype(int)
    yi = np.clip(np.round(y), 0, PX_H - 1).astype(int)
    for b in np.unique(idx):
        sel = idx == b
        true_px = bins[b] / res
        s_px = max(0.75, true_px)
        splat = np.zeros_like(field)
        np.add.at(splat, (yi[sel], xi[sel]), peak[sel])
        k = int(min(8 * s_px, 2001)) | 1
        # unnormalised Gaussian (peak = value); sub-pixel towns keep their energy, not their peak
        field += cv2.GaussianBlur(splat, (k, k), s_px) * (2 * math.pi * true_px ** 2)
    # light-pollution halo (sigma 6 km), computed at 1/8 resolution
    q = 8
    small = np.zeros((PX_H // q + 1, PX_W // q + 1), np.float32)
    np.add.at(small, (yi // q, xi // q), peak * np.clip(pop / 20000.0, 0.05, 1.0))
    h_px = max(0.75, 6.0 / (res * q))
    k = int(min(8 * h_px, 2001)) | 1
    halo = cv2.GaussianBlur(small, (k, k), h_px) * (2 * math.pi * h_px ** 2) * 0.05
    field += cv2.resize(halo, (PX_W, PX_H), interpolation=cv2.INTER_CUBIC)[:PX_H, :PX_W]

    roads = lit_roads(g, x, y, pop, keep) if res > 0.3 else np.zeros_like(field)
    return field, roads


def lit_roads(g, x, y, pop, keep, k_nn=2, max_km=45.0):
    """Faint gold links between neighbouring towns: reads as lit highways at regional scale."""
    lay = np.zeros((PX_H, PX_W), np.float32)
    big = pop >= 1500
    if big.sum() < 3:
        return lay
    xs, ys, ps, ks = x[big], y[big], pop[big], keep[big]
    pts = np.stack([xs, ys], 1) * g["res_km"]
    from scipy.spatial import cKDTree
    tree = cKDTree(pts)
    d, j = tree.query(pts, k=k_nn + 1, distance_upper_bound=max_km)
    thick = 1 if g["res_km"] > 0.3 else 2
    for i in range(len(pts)):
        for dd, jj in zip(d[i, 1:], j[i, 1:]):
            if not np.isfinite(dd) or jj >= len(pts) or jj < i:
                continue
            w = min(ps[i], ps[jj]) ** 0.25 / 40.0 * min(ks[i], ks[jj])
            if w < 0.01:
                continue
            p0 = (int(xs[i] * 16), int(ys[i] * 16))
            p1 = (int(xs[jj] * 16), int(ys[jj] * 16))
            cv2.line(lay, p0, p1, float(w), thick, cv2.LINE_AA, shift=4)
    return cv2.GaussianBlur(lay, (0, 0), 0.8)


# ------------------------------------------------------------------ aurora from the AI map

def ai_sampler(cal):
    """Map (lon, lat) -> AI-map pixel, anchored so Montreal lands on its visible light cluster."""
    ax, ay = np.array(cal["local"]["affine_x"]), np.array(cal["local"]["affine_y"])
    cx, cy = cal["montreal"]["zoom_target_px"]
    ox = cx - (ax[0] * LON0 + ax[1] * LAT0 + ax[2])
    oy = cy - (ay[0] * LON0 + ay[1] * LAT0 + ay[2])

    def f(lon, lat):
        return ax[0] * lon + ax[1] * lat + ax[2] + ox, ay[0] * lon + ay[1] * lat + ay[2] + oy
    return f


def aurora_layer(g, sampler):
    base = np.asarray(Image.open(MAPS / "base_night.png").convert("RGB")).astype(np.float32) / 255
    aur = np.asarray(Image.open(MAPS / "aurora_impact.png").convert("RGB")).astype(np.float32) / 255
    diff = np.clip(aur - base, 0, None)
    # keep aurora-coloured light only (green or magenta dominant), smooth out rendering noise
    r, gch, b = diff[..., 0], diff[..., 1], diff[..., 2]
    auroral = (((gch > r * 1.1) & (gch > b * 1.05)) | ((r > gch * 1.3) & (r > b * 0.9))) & (diff.sum(-1) > 0.04)
    diff = diff * auroral[..., None]
    diff = cv2.GaussianBlur(diff, (0, 0), 1.2)
    x_km, y_km = px_grid_lonlat(g)
    lon = LON0 + x_km[None, :] / KX
    lat = LAT0 + y_km[:, None] / KY
    mx, my = sampler(np.broadcast_to(lon, (PX_H, PX_W)), np.broadcast_to(lat, (PX_H, PX_W)))
    return cv2.remap(diff, mx.astype(np.float32), my.astype(np.float32), cv2.INTER_CUBIC,
                     borderMode=cv2.BORDER_REFLECT)


def light_retention(sampler):
    base = cv2.GaussianBlur(cv2.cvtColor(np.asarray(Image.open(MAPS / "base_night.png").convert("RGB")),
                                         cv2.COLOR_RGB2GRAY).astype(np.float32), (0, 0), 1.5)
    blk = cv2.GaussianBlur(cv2.cvtColor(np.asarray(Image.open(MAPS / "blackout.png").convert("RGB")),
                                        cv2.COLOR_RGB2GRAY).astype(np.float32), (0, 0), 1.5)

    def f(lon, lat):
        x, y = sampler(lon, lat)
        x = np.clip(x, 0, base.shape[1] - 1).astype(np.float32)
        y = np.clip(y, 0, base.shape[0] - 1).astype(np.float32)
        b = cv2.remap(base, x[None, :], y[None, :], cv2.INTER_LINEAR)[0]
        k = cv2.remap(blk, x[None, :], y[None, :], cv2.INTER_LINEAR)[0]
        return (k - 20) / np.maximum(b - 20, 8)
    return f


def red_outline_polylines(sampler):
    """Vectorise the NE-North-America red outline of blackout.png into lon/lat polylines."""
    img = np.asarray(Image.open(MAPS / "blackout.png").convert("RGB")).astype(np.int32)
    R, G, B = img[..., 0], img[..., 1], img[..., 2]
    red = ((R > 120) & (R - np.maximum(G, B) > 60)).astype(np.uint8)
    roi = np.zeros_like(red)
    roi[40:290, 170:430] = 1
    red = cv2.morphologyEx(red * roi, cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8))
    skel = cv2.ximgproc.thinning(red * 255) if hasattr(cv2, "ximgproc") else red * 255
    cnts, _ = cv2.findContours((skel > 0).astype(np.uint8), cv2.RETR_LIST, cv2.CHAIN_APPROX_NONE)
    # invert the AI sampler numerically (affine): solve lon/lat for each outline pixel
    J = np.array([[sampler(LON0 + 1, LAT0)[0] - sampler(LON0, LAT0)[0], sampler(LON0, LAT0 + 1)[0] - sampler(LON0, LAT0)[0]],
                  [sampler(LON0 + 1, LAT0)[1] - sampler(LON0, LAT0)[1], sampler(LON0, LAT0 + 1)[1] - sampler(LON0, LAT0)[1]]])
    p0 = np.array(sampler(LON0, LAT0))
    Jinv = np.linalg.inv(J)
    lines = []
    for c in cnts:
        if len(c) < 12:
            continue
        p = c[:, 0, :].astype(np.float64)
        p = cv2.GaussianBlur(p[None], (1, 0), sigmaX=0, sigmaY=0)[0] if False else p
        # light smoothing along the curve (the source is 15 km/px)
        k = 5
        pad = np.concatenate([p[-k:], p, p[:k]])
        ker = np.ones(2 * k + 1) / (2 * k + 1)
        ps = np.stack([np.convolve(pad[:, 0], ker, "same")[k:-k], np.convolve(pad[:, 1], ker, "same")[k:-k]], 1)
        ll = (Jinv @ (ps - p0).T).T + np.array([LON0, LAT0])
        lines.append(ll)
    return lines


# ------------------------------------------------------------------ build

def build_layer(name, cal, sampler, retention, outline_lines):
    g = geometry(name)
    res = g["res_km"]
    land = land_mask(g).astype(np.float32)
    land = cv2.GaussianBlur(land, (0, 0), 0.6)

    t_land = fbm(g, 11)
    t_ridge = fbm(g, 29, ridged=True)
    ocean = np.array(look.OCEAN, np.float32) / 255
    landc = np.array(look.LAND, np.float32) / 255
    ocean_rgb = ocean[None, None, :] * (1.0 + 1.1 * t_ridge[..., None]) + 0.012 * t_ridge[..., None]
    land_rgb = landc[None, None, :] * (0.92 + 0.55 * t_land[..., None] + 0.25 * t_ridge[..., None])
    img = ocean_rgb * (1 - land[..., None]) + land_rgb * land[..., None]

    # coastline: cyan core + soft halo, widths in px so they read the same on screen
    edge = cv2.morphologyEx((land > 0.5).astype(np.uint8), cv2.MORPH_GRADIENT, np.ones((3, 3), np.uint8)).astype(np.float32)
    core, halo = glow_line(edge, 0.7, 3.0)
    coast = np.array(look.COAST, np.float32) / 255
    img += (0.55 * np.clip(core * 1.6, 0, 1))[..., None] * coast * 1.25 + (0.5 * halo)[..., None] * coast

    # rivers, borders
    riv = np.zeros((PX_H, PX_W), np.float32)
    cv2.polylines(riv, polylines("rivers", g), False, 1.0, 1, cv2.LINE_AA, shift=4)
    img += (0.18 * riv)[..., None] * coast
    bord = np.zeros((PX_H, PX_W), np.float32)
    cv2.polylines(bord, polylines("countries", g), False, 1.0, 1, cv2.LINE_AA, shift=4)
    cv2.polylines(bord, polylines("states", g), False, 0.6, 1, cv2.LINE_AA, shift=4)
    img += (0.16 * bord)[..., None] * np.array([0.75, 0.8, 0.85], np.float32)

    aur = aurora_layer(g, sampler) * AURORA_GAIN[name]
    # fine urban mottling so big lit areas read as street grids, not smooth blobs
    lo = 0.6 if res > 0.1 else 0.3
    mottle = lo + (1.1 - lo) * np.clip(fbm(g, 57, cells=(3, 1.5, 0.75, 0.37, 0.18, 0.09), ridged=True) + 0.5, 0, 1)
    # lights sit on land; open water only catches a little reflected glow
    on_land = (0.28 + 0.72 * cv2.GaussianBlur(land, (0, 0), max(0.8, 0.25 / res)))
    out = {}
    for state in ("normal", "blackout"):
        field, roads = town_lights(g, state, retention)
        gain = 0.9 if res > 0.1 else 0.3               # closest layer: leave room for texture
        lum = (1 - np.exp(-gain * field - 0.9 * roads)) * mottle * on_land
        gold = np.array(look.GOLD, np.float32) / 255
        hot = np.array(look.GOLD_HOT, np.float32) / 255
        mix = np.clip((lum - 0.75) / 0.3, 0, 1)[..., None]
        light = lum[..., None] * (gold * (1 - mix) + hot * mix)
        base = np.clip(img + light, 0, 1)
        if state == "normal":
            out["normal"] = base
            out["aurora"] = np.clip(base + aur, 0, 1)
        else:
            out["blackout"] = np.clip(base + 0.6 * aur, 0, 1)

    outline = np.zeros((PX_H, PX_W), np.float32)
    for ll in outline_lines:
        x, y = to_px(ll[:, 0], ll[:, 1], g)
        cv2.polylines(outline, [np.round(np.stack([x, y], 1) * 16).astype(np.int32)], False, 1.0,
                      2 if res < 1 else 1, cv2.LINE_AA, shift=4)

    OUT.mkdir(parents=True, exist_ok=True)
    for k, v in out.items():
        Image.fromarray(look.to_u8(v)).save(OUT / f"{name}_{k}.png", compress_level=3)
    Image.fromarray(look.to_u8(outline)).save(OUT / f"{name}_outline.png", compress_level=3)
    return g


def main():
    cal = load_calibration()
    sampler = ai_sampler(cal)
    retention = light_retention(sampler)
    outline_lines = red_outline_polylines(sampler)
    meta = {"lat0": LAT0, "lon0": LON0, "km_per_deg_lon": KX, "km_per_deg_lat": KY,
            "px": [PX_W, PX_H], "ai_anchor_px": cal["montreal"]["zoom_target_px"], "layers": {}}
    import time
    import sys
    only = [a for a in sys.argv[1:] if a in LAYERS]
    if only and (OUT / "meta.json").exists():
        meta = json.loads((OUT / "meta.json").read_text())
    for name in (only or LAYERS):
        t = time.time()
        meta["layers"][name] = build_layer(name, cal, sampler, retention, outline_lines)
        print(f"{name}: {time.time() - t:.1f} s")
    (OUT / "meta.json").write_text(json.dumps(meta, indent=2))


if __name__ == "__main__":
    main()
