"""Render the scene-1 map plates (clean: no HUD/grid/overlay) + per-frame camera data.

  A  0:00-0:12  world push-in on base_night, crossfade to aurora_impact at 0:04
  B  0:12-0:20.5 zoom: world -> Quebec (beat on "is Quebec") -> Montreal, handing over to
               Blender mid-motion (the log-zoom schedule continues in the 3D shot)
  F  1:05-1:15  pull-back: dark Montreal -> world (blackout.png), Quebec outline pulsing

Outputs build/plates/<shot>/%05d.png and build/plates/<shot>/cams.json.
Run: python3 shots.py [A B F] [--workers 4]
"""
import json
import math
import sys
from multiprocessing import Pool

import numpy as np
from PIL import Image

import mapcam
from geo import ROOT
from mapcam import ease, log_fade

OUT = ROOT / "build" / "plates"
FPS = 30
WORLD = None

# ---- scene timings (seconds on the scene timeline)
A_START, A_END = 0.0, 12.0
IMPACT = 4.0
B_START, B_END = 12.0, 20.5              # includes 0.5 s overlap for the crossfade into Blender
QUEBEC_BEAT = 16.0                       # "…is Quebec"
DESCENT_END = 23.0                       # the shared log-zoom schedule ends inside Blender
V_QUEBEC, V_CITY = 3000.0, 9.0           # km
F_START, F_END = 65.0, 75.0
QUEBEC_CENTER = (-71.3, 50.6)            # lon, lat (frames the province)


def world():
    global WORLD
    if WORLD is None:
        WORLD = mapcam.World()
    return WORLD


def shape_w(V):
    return log_fade(*mapcam.SHAPE_BLEND, V)


def clamp_to_map(w, qc, V, wt):
    """While the AI map is on screen, keep the frame inside it (no mirrored edges)."""
    if wt > 0.98:
        return qc
    s_ai = mapcam.W / V / math.sqrt(abs(np.linalg.det(w.B)))
    hx, hy = mapcam.W / 2 / s_ai, mapcam.H / 2 / s_ai
    c = w.B @ np.asarray(qc) + w.anchor
    mx, my = w.ai_px_size
    c = np.array([np.clip(c[0], hx, mx - hx) if hx < mx / 2 else mx / 2,
                  np.clip(c[1], hy, my - hy) if hy < my / 2 else my / 2])
    return w.Binv @ (c - w.anchor)


# ---- camera paths ---------------------------------------------------------------

def cam_A(t):
    w = world()
    u = np.clip((t - A_START) / (A_END - A_START), 0, 1)
    e = 0.5 - 0.5 * math.cos(math.pi * u)              # slow sine push-in
    s_ai = mapcam.W / 1672.0 * 1.33 ** e
    c = np.array([836.0, 470.5]) * (1 - e) + np.array([650.0, 395.0]) * e
    qc, V = w.cam_from_ai(c, s_ai)
    return qc, V, 0.0


def cam_B(t):
    """Stage 1: A's end -> Quebec (ends at rest on the beat). Stage 2: shared descent."""
    w = world()
    qc_a, V_a, _ = cam_A(A_END)
    qx, qy = w.lonlat_to_km(*QUEBEC_CENTER)
    qc_q = np.array([qx, qy])
    if t <= QUEBEC_BEAT:
        u = ease((t - B_START) / (QUEBEC_BEAT - B_START))
        V = math.exp(math.log(V_a) * (1 - u) + math.log(V_QUEBEC) * u)
        qc = qc_a * (1 - u) + qc_q * u
    else:
        V = descent_V(t)
        uc = ease((t - QUEBEC_BEAT) / 2.8)                # centre settles on Montreal early
        qc = qc_q * (1 - uc)
    wt = shape_w(V)
    return clamp_to_map(w, qc, V, wt), V, wt


def descent_V(t):
    """Log-zoom Quebec -> city scale, shared with the Blender shot (it continues it)."""
    u = ease((t - QUEBEC_BEAT) / (DESCENT_END - QUEBEC_BEAT))
    return math.exp(math.log(V_QUEBEC) * (1 - u) + math.log(V_CITY) * u)


def cam_F(t):
    """Fast pull-back from dark Montreal (80 km) to the full blackout map, then a slow drift."""
    w = world()
    qc_end, V_end = w.cam_from_ai((760.0, 430.0), mapcam.W / 1672.0 * 1.08)
    qc_hold, V_hold = w.cam_from_ai((740.0, 425.0), mapcam.W / 1672.0 * 1.12)
    V0 = 80.0
    u = (t - F_START) / 3.6
    if u < 1:
        e = ease(u)
        V = math.exp(math.log(V0) * (1 - e) + math.log(V_end) * e)
        uc = ease(np.clip((u - 0.25) / 0.75, 0, 1))
        qc = qc_end * uc
    else:
        d = ease(np.clip((t - F_START - 3.6) / (F_END - F_START - 3.6), 0, 1))
        V = math.exp(math.log(V_end) * (1 - d) + math.log(V_hold) * d)
        qc = qc_end * (1 - d) + qc_hold * d
    wt = shape_w(V)
    return clamp_to_map(w, qc, V, wt), V, wt


SHOTS = {
    "A": (A_START, A_END, cam_A),
    "B": (B_START, B_END, cam_B),
    "F": (F_START, F_END, cam_F),
}


def plate(shot, t, cam):
    w = world()
    if shot == "A":
        x = mapcam.smoothstep(IMPACT, IMPACT + 1.5, t)
        return w.render_map(cam, {"base_night": 1 - x, "aurora_impact": x}, "aurora")
    if shot == "B":
        return w.render_map(cam, {"aurora_impact": 1.0}, "aurora")
    if shot == "F":
        pulse = 0.55 + 0.45 * math.sin(2 * math.pi * (t - F_START) / 1.25)
        return w.render_map(cam, {"blackout": 1.0}, "blackout", outline_pulse=pulse)
    raise ValueError(shot)


def render_one(args):
    shot, i, t = args
    fn = SHOTS[shot][2]
    cam = fn(t)
    img = plate(shot, t, cam)
    Image.fromarray((np.clip(img, 0, 1) * 255 + 0.5).astype(np.uint8)).save(
        OUT / shot / f"{i:05d}.png", compress_level=1)
    return i, [float(cam[0][0]), float(cam[0][1]), float(cam[1]), float(cam[2])]


def render(shot, workers=4):
    t0, t1, _ = SHOTS[shot]
    n = int(round((t1 - t0) * FPS))
    (OUT / shot).mkdir(parents=True, exist_ok=True)
    jobs = [(shot, i, t0 + i / FPS) for i in range(n)]
    with Pool(workers) as p:
        cams = dict(p.imap_unordered(render_one, jobs, chunksize=4))
    meta = {"shot": shot, "start_s": t0, "fps": FPS, "frames": n,
            "cams": [cams[i] for i in range(n)],
            "note": "cams[i] = [qc_x_km, qc_y_km, view_width_km, shape_w]; km frame centred on Montreal"}
    (OUT / shot / "cams.json").write_text(json.dumps(meta))
    print(f"{shot}: {n} frames")


if __name__ == "__main__":
    argv = sys.argv[1:]
    workers = 4
    if "--workers" in argv:
        k = argv.index("--workers")
        workers = int(argv[k + 1])
        del argv[k:k + 2]
    args = [a for a in argv if a in SHOTS]
    for s in args or ["A", "B", "F"]:
        render(s, workers)
