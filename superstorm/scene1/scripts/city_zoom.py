"""Incident zoom: world map -> any city, same look as scene 1, ending on the frame that
Seedance 2.5 continues (image-to-video) into the real city.

  SUPERSTORM_CITY=london python3 city_zoom.py --label LONDON --state aurora \\
      --clock "T+17:09 — CASCADE" --people 31400000 --dur 7
    -> build/zooms/<city>/zoom.mp4          (graded preview with grid, reticle, HUD)
       build/zooms/<city>/seedance_start.png (last clean frame: the image-to-video start image)

Needs the city's calibration (calibrate_city.py) and regional layers
(SUPERSTORM_CITY=<city> python3 regional.py, ~6 min).
"""
import argparse
import math
import subprocess
from multiprocessing import Pool

import numpy as np
from PIL import Image

import look
import mapcam
import panels
from geo import CENTER, CITY, ROOT
from look import AMBER, CYAN, RED, HUD, Overlay, W, H, fmt_int
from mapcam import ease, log_fade

FPS = 30
OUT = ROOT / "build" / "zooms" / CITY
G = {}
V0, V1 = 9000.0, 160.0                    # km across: world region -> the Seedance hand-off (the map stays crisp)


def init(args):
    G["w"] = mapcam.World()
    G["ov"] = Overlay()
    G["hud"] = HUD()
    G["a"] = args


def cam(t, dur):
    w = G["w"]
    u = float(ease(t / dur))
    V = math.exp(math.log(V0) * (1 - u) + math.log(V1) * u)
    # start framed on the AI map around the city's light (plain image zoom), end centred on it
    q0 = np.array([V0 * 0.08, V0 * 0.03])                      # a little off-centre at the start
    qc = q0 * (1 - float(ease(t / (dur * 0.7))))
    wt = log_fade(*mapcam.SHAPE_BLEND, V)
    return clamp(w, qc, V, wt), V, wt


def clamp(w, qc, V, wt):
    if wt > 0.98:
        return qc
    s_ai = mapcam.W / V / math.sqrt(abs(np.linalg.det(w.B)))
    hx, hy = mapcam.W / 2 / s_ai, mapcam.H / 2 / s_ai
    c = w.B @ np.asarray(qc) + w.anchor
    mx, my = w.ai_px_size
    c = np.array([np.clip(c[0], hx, mx - hx) if hx < mx / 2 else mx / 2,
                  np.clip(c[1], hy, my - hy) if hy < my / 2 else my / 2])
    return w.Binv @ (c - w.anchor)


def plate(t):
    a = G["a"]
    ai = {"normal": "base_night", "aurora": "aurora_impact", "blackout": "blackout"}[a.state]
    return G["w"].render_map(cam(t, a.dur), {ai: 1.0}, a.state)


def frame(i):
    a = G["a"]
    t = i / FPS
    c = cam(t, a.dur)
    img = plate(t)
    if i == int(round(a.dur * FPS)) - 1:
        Image.fromarray(look.to_u8(img)).save(OUT / "seedance_start.png")
    w, ov = G["w"], G["ov"]
    img = ov.glow(img)
    img, labels = look.draw_grid(img, mapcam.grid_projector(w, c), mapcam.view_lonlat_box(w, c), mapcam.px_per_degree_lat(w, c))
    look.over(img, labels)
    t_on = t - a.dur * 0.55
    if t_on > 0:
        x, y = w.lonlat_to_screen(np.array([CENTER[1]]), np.array([CENTER[0]]), c)
        lat, lon = CENTER
        coords = f"{abs(lat):.2f}°{'N' if lat >= 0 else 'S'}  {abs(lon):.2f}°{'W' if lon < 0 else 'E'}"
        look.over(img, np.asarray(panels.reticle((W, H), (float(x[0]), float(y[0])), t_on, a.label, coords)))
    lon_c, lat_c = w.view_center_lonlat(c)
    blink = int(t * 2.2) % 2 == 0
    cols = [("MISSION CLOCK", a.clock + (" ●" if blink else "  "), RED, 30, 540),
            ("GEOMAGNETIC STORM", "G5+ EXTREME", RED, 34, 430),
            ("PEOPLE WITHOUT POWER", fmt_int(a.people), RED if a.people else AMBER, 34, 470),
            ("VIEW CENTER", f"{abs(lat_c):.2f}°{'N' if lat_c >= 0 else 'S'} {abs(lon_c):.2f}°{'W' if lon_c < 0 else 'E'}", AMBER, 26, 380)]
    img[:HUD.HEIGHT] = look.over(img[:HUD.HEIGHT], G["hud"].render(cols))
    return look.to_u8(ov.finish(img, i))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--label", default=CITY.upper().replace("_", " "))
    ap.add_argument("--state", default="aurora", choices=["normal", "aurora", "blackout"])
    ap.add_argument("--clock", default="T+17:00")
    ap.add_argument("--people", type=int, default=0)
    ap.add_argument("--dur", type=float, default=7.0)
    a = ap.parse_args()
    OUT.mkdir(parents=True, exist_ok=True)
    n = int(round(a.dur * FPS))
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS),
           "-i", "-", "-c:v", "libx264", "-preset", "medium", "-crf", "17", "-pix_fmt", "yuv420p", "-movflags", "+faststart",
           str(OUT / "zoom.mp4")]
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    with Pool(4, initializer=init, initargs=(a,)) as pool:
        for fr in pool.imap(frame, range(n), chunksize=2):
            p.stdin.write(fr.tobytes())
    p.stdin.close()
    p.wait()
    print(OUT / "zoom.mp4", n, "frames;", OUT / "seedance_start.png")


if __name__ == "__main__":
    main()
