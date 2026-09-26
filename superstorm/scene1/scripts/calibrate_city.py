"""Place any city on the AI world maps (for the incident zooms).

For each city: register the AI map's coastlines against GSHHG in a box around the city
(x = a*lon + b, y = c*lat + d, chamfer fit starting from the global fit), then snap to the
centre of the visible light cluster near the predicted pixel (the zoom target, as for
Montreal). Writes assets/maps/calibration_cities.json and review/cities/<city>.png.

  python3 calibrate_city.py london tokyo ...   (no names = every city in geo.CITIES but Montreal)
"""
import importlib
import json
import sys

import cv2
import numpy as np
from PIL import Image

from geo import CITIES, CITY_CAL, ROOT, boundaries, load_calibration

cal02 = importlib.import_module("02_calibrate_map")
MAP = ROOT / "assets" / "maps" / "base_night.png"


def snap_to_lights(img, px, r=6):
    """Snap to the nearest reasonably bright light peak within r px of the fitted position."""
    from scipy.ndimage import maximum_filter
    lum = cv2.GaussianBlur(cv2.cvtColor(img, cv2.COLOR_RGB2GRAY).astype(np.float32), (0, 0), 1.5)
    x0, y0 = int(px[0]) - r, int(px[1]) - r
    win = lum[y0:y0 + 2 * r + 1, x0:x0 + 2 * r + 1]
    peaks = (win == maximum_filter(win, size=3)) & (win > np.median(win) + 12)
    ys, xs = np.nonzero(peaks)
    if len(xs) == 0:
        return px[0], px[1], 0.0
    vals = win[ys, xs]
    d = np.hypot(xs + x0 - px[0], ys + y0 - px[1])
    ok = (vals >= 0.5 * vals.max()) & (d <= r)
    if not ok.any():
        return px[0], px[1], 0.0
    k = np.flatnonzero(ok)[np.argmin(d[ok])]
    cx, cy = cal02.light_cluster(img, xs[k] + x0, ys[k] + y0, r=3)
    return cx, cy, float(vals[k] - np.median(win))


def lights_shift(img, loc, lat, lon, half=40, max_shift=12):
    """Shift (px) that best aligns real city lights (GeoNames, sqrt-population splats) with the
    AI map's lights around the city, weighted towards the city itself."""
    from geo import towns
    T = towns(50000)
    m = (np.abs(T[:, 0] - lat) < 10) & (np.abs(((T[:, 1] - lon + 180) % 360) - 180) < 14)
    T = T[m]
    px0 = loc[0] * lon + loc[1], loc[2] * lat + loc[3]
    x0, y0 = int(px0[0]) - half, int(px0[1]) - half
    n = 2 * half + 1
    lum = cv2.GaussianBlur(cv2.cvtColor(img, cv2.COLOR_RGB2GRAY).astype(np.float32), (0, 0), 1.2)
    pad = max_shift + 2
    if y0 - pad < 0 or x0 - pad < 0 or y0 + n + pad > lum.shape[0] or x0 + n + pad > lum.shape[1]:
        return 0.0, 0.0                                              # too close to the map edge
    L = lum[y0 - pad:y0 + n + pad, x0 - pad:x0 + n + pad]
    L = L - cv2.GaussianBlur(L, (0, 0), 8)                           # lights, not the land tint
    P = np.zeros((n, n), np.float32)
    xs = loc[0] * T[:, 1] + loc[1] - x0
    ys = loc[2] * T[:, 0] + loc[3] - y0
    for x, y, w in zip(xs, ys, np.sqrt(T[:, 2])):
        if 0 <= x < n and 0 <= y < n:
            P[int(y), int(x)] += w
    P = cv2.GaussianBlur(P, (0, 0), 1.5)
    yy, xx = np.mgrid[0:n, 0:n]
    Wt = np.exp(-(((xx - half) ** 2 + (yy - half) ** 2) / (2 * 14.0 ** 2))).astype(np.float32)
    P = P * Wt
    best = (-1e9, 0.0, 0.0)
    for dy in np.arange(-max_shift, max_shift + 0.01, 0.5):
        for dx in np.arange(-max_shift, max_shift + 0.01, 0.5):
            M = np.float32([[1, 0, -(dx + pad)], [0, 1, -(dy + pad)]])
            win = cv2.warpAffine(L, M, (n, n), flags=cv2.INTER_LINEAR)
            sc = float((win * P).sum() / (np.sqrt((win * win * Wt).sum() * (P * P).sum()) + 1e-6))
            sc -= 0.002 * np.hypot(dx, dy)                         # prefer small shifts on ties
            if sc > best[0]:
                best = (sc, dx, dy)
    return best[1], best[2]


def calibrate(name, img, dist, g):
    lat, lon = CITIES[name]
    for half_lon, half_lat in ((28, 16), (40, 24)):
        bbox = (lon - half_lon, max(-60, lat - half_lat), lon + half_lon, min(80, lat + half_lat))
        pts = cal02.coast_points("i", bbox=bbox, step_deg=0.08)
        if len(pts) > 400:
            break
    loc, score = cal02.fit(pts, dist, g, spans=np.array([0.15, 12.0, 0.15, 12.0]), samples=200, seed=2)
    # tighter second pass: the AI map is warped differently region to region (e.g. Japan)
    # (shift only, scale kept from the wide fit: a free fit on a small box can collapse)
    near = cal02.coast_points("i", bbox=(lon - 8, lat - 6, lon + 8, lat + 6), step_deg=0.05)
    if len(near) > 150:
        best = (cal02.chamfer(loc, near, dist), 0.0, 0.0)
        for dx in np.arange(-8, 8.01, 0.5):
            for dy in np.arange(-8, 8.01, 0.5):
                c = cal02.chamfer((loc[0], loc[1] + dx, loc[2], loc[3] + dy), near, dist)
                if c < best[0] - 1e-6 or (abs(c - best[0]) < 1e-6 and np.hypot(dx, dy) < np.hypot(best[1], best[2])):
                    best = (c, dx, dy)
        loc = (loc[0], loc[1] + best[1], loc[2], loc[3] + best[2])
        score = best[0]
    px = (loc[0] * lon + loc[1], loc[2] * lat + loc[3])
    sx, sy = lights_shift(img, loc, lat, lon)            # the AI map's lights vs its coastlines
    cx, cy, contrast = snap_to_lights(img, (px[0] + sx, px[1] + sy), r=3)
    target = (cx, cy)                                     # shifted fit, snapped to a peak if one is near
    return {"lat": lat, "lon": lon, "affine_x": [loc[0], 0.0, loc[1]], "affine_y": [0.0, loc[2], loc[3]],
            "chamfer_px": score, "px_from_fit": [round(px[0], 2), round(px[1], 2)],
            "light_cluster_px": [round(cx, 2), round(cy, 2)], "cluster_contrast": round(float(contrast), 1),
            "zoom_target_px": [round(float(target[0]), 2), round(float(target[1]), 2)]}


def review(name, img, c):
    x, y = c["zoom_target_px"]
    s, r = 6, 60
    x0, y0 = int(max(0, x - r)), int(max(0, y - r * 0.6))
    x1, y1 = int(min(img.shape[1], x + r)), int(min(img.shape[0], y + r * 0.6))
    crop = cv2.resize(img[y0:y1, x0:x1], ((x1 - x0) * s, (y1 - y0) * s), interpolation=cv2.INTER_LANCZOS4)
    ax, ay = np.array(c["affine_x"]), np.array(c["affine_y"])
    lat, lon = c["lat"], c["lon"]
    for typ, arr in boundaries("gshhs", "i", bbox=(lon - 15, lat - 10, lon + 15, lat + 10), types=(1,)):
        if len(arr) < 30:
            continue
        h = np.c_[arr, np.ones(len(arr))]
        pts = np.stack([(h @ ax - x0) * s, (h @ ay - y0) * s], 1).astype(np.int32)
        cv2.polylines(crop, [pts], False, (255, 70, 200), 1, cv2.LINE_AA)
    for key, col in (("px_from_fit", (255, 80, 80)), ("zoom_target_px", (255, 220, 60))):
        mx, my = c[key]
        cv2.circle(crop, (int((mx - x0) * s), int((my - y0) * s)), 12, col, 2, cv2.LINE_AA)
    cv2.putText(crop, f"{name}: fit (red), zoom target (yellow), GSHHG coast (magenta)", (8, crop.shape[0] - 10),
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1, cv2.LINE_AA)
    out = ROOT / "review" / "cities"
    out.mkdir(parents=True, exist_ok=True)
    Image.fromarray(crop).save(out / f"{name}.png")


def main():
    names = sys.argv[1:] or [k for k in CITIES if k != "montreal"]
    img = np.asarray(Image.open(MAP).convert("RGB"))
    _, _, dist = cal02.image_edges(img)
    gl = load_calibration()["global"]
    g = (gl["a"], gl["b"], gl["c"], gl["d"])
    data = json.loads(CITY_CAL.read_text()) if CITY_CAL.exists() else {}
    for n in names:
        data[n] = calibrate(n, img, dist, g)
        review(n, img, data[n])
        print(n, data[n]["zoom_target_px"], "chamfer", round(data[n]["chamfer_px"], 2), "contrast", data[n]["cluster_contrast"])
        CITY_CAL.write_text(json.dumps(data, indent=2))


if __name__ == "__main__":
    main()
