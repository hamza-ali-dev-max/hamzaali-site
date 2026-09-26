"""Calibrate Montreal's pixel position on the cropped-equirectangular world maps.

1. Global fit: register the map's land/ocean edges against GSHHG coastlines
   (x = a*lon + b, y = c*lat + d), chamfer distance, multi-start + Nelder-Mead.
2. Local fit: same, restricted to north-eastern North America.
3. Three coastal landmarks around Montreal (Cape Cod, Cap Gaspe, south tip of James Bay),
   read on a 10x pixel grid of this map (the AI map is locally warped, so automatic
   shape matching was ambiguous for two of them). The exact affine through the three
   points gives Montreal's pixel position; it is cross-checked against the coastline
   registration and against the visible Montreal light cluster (the zoom target).
Writes assets/maps/calibration.json and review/cp_calibration.png.
"""
import json

import cv2
import numpy as np
from PIL import Image
from scipy.ndimage import map_coordinates
from scipy.optimize import minimize

from geo import CALIBRATION, MONTREAL, ROOT, boundaries

MAP = ROOT / "assets" / "maps" / "base_night.png"
LOCAL_BBOX = (-95.0, 35.0, -50.0, 62.0)
# name: (lat, lon, x_px, y_px measured on base_night.png)
LANDMARKS = {
    "Cape Cod (Race Point)": (42.062, -70.243, 352.3, 250.8),
    "Cap Gaspe": (48.751, -64.159, 383.2, 209.7),
    "James Bay south tip": (51.20, -80.05, 318.5, 193.5),
}


def image_edges(img):
    lum = cv2.GaussianBlur(cv2.cvtColor(img, cv2.COLOR_RGB2GRAY).astype(np.float32), (0, 0), 1.2)
    land = (lum > 40).astype(np.uint8)
    land = cv2.morphologyEx(land, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    edge = cv2.morphologyEx(land, cv2.MORPH_GRADIENT, np.ones((3, 3), np.uint8)) > 0
    dist = cv2.distanceTransform((~edge).astype(np.uint8), cv2.DIST_L2, 5)
    return land, edge, dist


def coast_points(res, bbox=None, step_deg=0.15, lat_min=-58):
    pts = []
    for typ, arr in boundaries("gshhs", res, bbox=bbox, types=(1, 2)):
        if len(arr) < 12:
            continue
        seg = np.diff(arr, axis=0)
        n = np.maximum(1, (np.hypot(seg[:, 0], seg[:, 1]) / step_deg).astype(int))
        for (p, s, k) in zip(arr[:-1], seg, n):
            t = np.arange(k)[:, None] / k
            pts.append(p + t * s)
    pts = np.concatenate(pts)
    pts = pts[pts[:, 1] > lat_min]
    if bbox is not None:
        m = (pts[:, 0] >= bbox[0]) & (pts[:, 0] <= bbox[2]) & (pts[:, 1] >= bbox[1]) & (pts[:, 1] <= bbox[3])
        pts = pts[m]
    return pts


def chamfer(p, pts, dist, trunc=8.0):
    a, b, c, d = p
    x, y = a * pts[:, 0] + b, c * pts[:, 1] + d
    h, w = dist.shape
    ok = (x > 1) & (x < w - 2) & (y > 1) & (y < h - 2)
    if ok.mean() < 0.5:
        return 1e3
    v = map_coordinates(dist, [y[ok], x[ok]], order=1)
    return float(np.minimum(v, trunc).mean())


def fit(pts, dist, start, spans, samples=400, seed=0):
    rng = np.random.default_rng(seed)
    cands = [np.array(start)] + [np.array(start) + rng.uniform(-1, 1, 4) * spans for _ in range(samples)]
    scores = [chamfer(p, pts[::4], dist) for p in cands]
    best = sorted(zip(scores, range(len(cands))))[:8]
    results = [minimize(chamfer, cands[i], args=(pts, dist), method="Nelder-Mead",
                        options={"xatol": 1e-3, "fatol": 1e-4, "maxiter": 4000}) for _, i in best]
    r = min(results, key=lambda r: r.fun)
    return r.x, r.fun


def main():
    img = np.asarray(Image.open(MAP).convert("RGB"))
    land, edge, dist = image_edges(img)

    # rough start from two eyeballed landmarks (Gibraltar ~(693,300), Cape Agulhas ~(820,690))
    start = (4.96, 720.0, -5.5, 498.0)
    world = coast_points("l")
    g, gscore = fit(world, dist, start, spans=np.array([0.35, 40.0, 0.5, 40.0]))
    local_pts = coast_points("i", bbox=LOCAL_BBOX, step_deg=0.08)
    l, lscore = fit(local_pts, dist, g, spans=np.array([0.15, 12.0, 0.15, 12.0]), samples=200, seed=1)

    measured = {name: {"lat": la, "lon": lo, "x": x, "y": y}
                for name, (la, lo, x, y) in LANDMARKS.items()}
    L = np.array([[m["lon"], m["lat"], m["x"], m["y"]] for m in measured.values()])
    A = np.c_[L[:, :2], np.ones(3)]
    coef_x, coef_y = np.linalg.solve(A, L[:, 2]), np.linalg.solve(A, L[:, 3])

    lat0, lon0 = MONTREAL
    mtl_affine = (float(coef_x @ [lon0, lat0, 1]), float(coef_y @ [lon0, lat0, 1]))
    mtl_local = (l[0] * lon0 + l[1], l[2] * lat0 + l[3])
    mtl_global = (g[0] * lon0 + g[1], g[2] * lat0 + g[3])
    cluster = light_cluster(img, *mtl_affine)

    cal = {
        "image_size": [img.shape[1], img.shape[0]],
        "model": "x = a*lon + b, y = c*lat + d (cropped equirectangular)",
        "global": {"a": g[0], "b": g[1], "c": g[2], "d": g[3], "chamfer_px": gscore,
                   "lon_range": [(0 - g[1]) / g[0], (img.shape[1] - g[1]) / g[0]],
                   "lat_range": [(0 - g[3]) / g[2], (img.shape[0] - g[3]) / g[2]]},
        "local": {"affine_x": coef_x.tolist(), "affine_y": coef_y.tolist(), "bbox": list(LOCAL_BBOX),
                  "model": "x,y = coef @ [lon, lat, 1]; exact through the three landmarks"},
        "local_registration": {"a": l[0], "b": l[1], "c": l[2], "d": l[3], "chamfer_px": lscore},
        "landmarks": measured,
        "montreal": {"lat": lat0, "lon": lon0,
                     "px_from_landmarks": [round(v, 2) for v in mtl_affine],
                     "px_from_local_registration": [round(v, 2) for v in mtl_local],
                     "px_from_global_fit": [round(v, 2) for v in mtl_global],
                     "light_cluster_px": [round(v, 2) for v in cluster],
                     "zoom_target_px": [round(v, 2) for v in cluster],
                     "note": "zoom target = centre of the visible Montreal light cluster"},
    }
    CALIBRATION.write_text(json.dumps(cal, indent=2))
    print(json.dumps(cal, indent=2))
    review(img, cal, g, l)


def light_cluster(img, x, y, r=6):
    """Sub-pixel centre of the brightest light blob within r px of (x, y)."""
    lum = cv2.GaussianBlur(cv2.cvtColor(img, cv2.COLOR_RGB2GRAY).astype(np.float32), (0, 0), 1.5)
    x0, y0 = int(round(x)) - r, int(round(y)) - r
    win = lum[y0:y0 + 2 * r + 1, x0:x0 + 2 * r + 1]
    py, px = np.unravel_index(np.argmax(win), win.shape)
    px, py = x0 + px, y0 + py
    yy, xx = np.mgrid[py - 3:py + 4, px - 3:px + 4]
    w = np.maximum(lum[yy, xx] - np.median(win), 0)
    return float((w * xx).sum() / w.sum()), float((w * yy).sum() / w.sum())


def review(img, cal, g, l):
    """GSHHG coastlines through the 3-point fit (magenta), landmarks (green),
    Montreal from the landmarks (red) and the visible light cluster (yellow), 6x crop."""
    x0, y0, x1, y1, s = 270, 165, 410, 265, 6
    crop = cv2.resize(img[y0:y1, x0:x1], ((x1 - x0) * s, (y1 - y0) * s), interpolation=cv2.INTER_LANCZOS4)
    crop = (crop * 0.85).astype(np.uint8)
    cx, cy = np.array(cal["local"]["affine_x"]), np.array(cal["local"]["affine_y"])
    for typ, arr in boundaries("gshhs", "i", bbox=(-92, 36, -52, 60), types=(1,)):
        if len(arr) < 40:
            continue
        h = np.c_[arr, np.ones(len(arr))]
        pts = np.stack([(h @ cx - x0) * s, (h @ cy - y0) * s], 1).astype(np.int32)
        cv2.polylines(crop, [pts], False, (255, 70, 200), 1, cv2.LINE_AA)
    for name, m in cal["landmarks"].items():
        p = (int((m["x"] - x0) * s), int((m["y"] - y0) * s))
        cv2.drawMarker(crop, p, (90, 255, 90), cv2.MARKER_CROSS, 26, 2, cv2.LINE_AA)
        cv2.putText(crop, name, (p[0] + 12, p[1] - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (90, 255, 90), 1, cv2.LINE_AA)
    for key, col in (("px_from_landmarks", (255, 80, 80)), ("light_cluster_px", (255, 220, 60))):
        mx, my = cal["montreal"][key]
        cv2.circle(crop, (int((mx - x0) * s), int((my - y0) * s)), 14, col, 2, cv2.LINE_AA)
    cv2.putText(crop, "Montreal: from landmarks (red) / light cluster = zoom target (yellow)",
                (10, crop.shape[0] - 14), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1, cv2.LINE_AA)
    cv2.putText(crop, "magenta = real GSHHG coastline through the 3-point fit",
                (10, crop.shape[0] - 36), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 120, 220), 1, cv2.LINE_AA)
    Image.fromarray(crop).save(ROOT / "review" / "cp_calibration.png")


if __name__ == "__main__":
    main()
