"""Scene-1 compositor: plates -> grid, labels, HUD, glow/scanlines/vignette/grain -> MP4.

Each output frame looks up the plate for its time on the scene timeline, draws the
map-space grid with that plate's camera (so grid and labels move with the map), then the
screen-space graphics. Segments without footage yet (Blender city, radio, reporter) are
skipped by the preview ranges.

Run: python3 compose.py preview        -> build/preview/scene1_open.mp4, scene1_pullback.mp4
"""
import json
import math
import subprocess
import sys
from multiprocessing import Pool

import numpy as np
from PIL import Image

import look
import mapcam
import panels
import timeline
from geo import ROOT
from look import AMBER, CYAN, RED, HUD, Overlay, W, H, fmt_int

PLATES = ROOT / "build" / "plates"
CITY = ROOT / "build" / "blender" / "frames"
PREVIEW = ROOT / "build" / "preview"
FPS = 30
IMPACT, BLACKOUT_START, BLACKOUT_END = 4.0, 31.0, 40.0
G = {}


def init():
    G["world"] = mapcam.World()
    G["ov"] = Overlay()
    G["hud"] = HUD()
    G["cams"] = {}
    for s in ("A", "B", "F"):
        p = PLATES / s / "cams.json"
        if p.exists():
            G["cams"][s] = json.loads(p.read_text())


# ---- HUD timeline ------------------------------------------------------------------

def ramp(t, t0, t1, a, b):
    u = min(1.0, max(0.0, (t - t0) / (t1 - t0)))
    u = u * u * (3 - 2 * u)
    return a + (b - a) * u


def hud_columns(t, cam=None):
    blink = int(t * 2.2) % 2 == 0
    view = ("VIEW CENTER", "", AMBER, 26, 380)
    if cam is not None:
        lon, lat = G["world"].view_center_lonlat(cam)
        view = ("VIEW CENTER", f"{abs(lat):.2f}°{'N' if lat >= 0 else 'S'} {abs(lon):.2f}°{'W' if lon < 0 else 'E'}", AMBER, 26, 380)
    if t < IMPACT:
        sec = 56 + int(t)
        return [("MISSION CLOCK", f"T+16:59:{sec:02d}", AMBER, 34, 540),
                ("GEOMAGNETIC STORM", "CME INBOUND", AMBER, 34, 430),
                ("KP INDEX", "5.7", AMBER, 34, 190),
                ("DST", "-58 nT", AMBER, 34, 280), view]
    kp = ramp(t, IMPACT, IMPACT + 3, 5.7, 9.0)
    dst = ramp(t, IMPACT, IMPACT + 6, -58, -1180) + (8 * math.sin(t * 3.1) if t > IMPACT + 6 else 0)
    clock = ("MISSION CLOCK", "T+17:00 — IMPACT " + ("●" if blink else " "), RED, 34, 540)
    storm = ("GEOMAGNETIC STORM", "G5+ EXTREME", RED, 34, 430)
    if BLACKOUT_START - 0.3 <= t < 60:
        n = timeline.people_without_power(t)
        return [clock, storm, ("PEOPLE WITHOUT POWER", fmt_int(n), RED if n > 0 else AMBER, 34, 470), view]
    if t < 60:
        return [clock, storm,
                ("KP INDEX", f"{kp:.1f}", RED if kp >= 8 else AMBER, 34, 190),
                ("DST", f"{fmt_int(dst)} nT", RED if dst < -500 else AMBER, 34, 280), view]
    # pull-back
    return [("MISSION CLOCK", "T+17:02 — GRID COLLAPSE", RED, 30, 540), storm,
            ("PEOPLE WITHOUT POWER", "9,000,000", RED, 34, 470), view]


# ---- per-frame composition -----------------------------------------------------------

def overlays(t, cam):
    w = G["world"]
    layers = []
    # "QUÉBEC" on the beat
    if 14.6 < t < 17.4:
        a = min(1.0, (t - 14.6) / 0.4, (17.4 - t) / 0.5)
        x, y = w.lonlat_to_screen(np.array([-75.5]), np.array([53.6]), cam)
        layers.append(panels.map_label((W, H), (float(x[0]), float(y[0])), "QUÉBEC", "POP. 9.0 M · 36,000 MW GRID", a))
    # lock onto Montreal
    if 18.2 < t < 21.5:
        x, y = w.lonlat_to_screen(np.array([mapcam.LON0]), np.array([mapcam.LAT0]), cam)
        a = min(1.0, (21.5 - t) / 0.5)
        layers.append(panels.reticle((W, H), (float(x[0]), float(y[0])), t - 18.2, "MONTRÉAL", "45.50°N  73.57°W", a))
    return layers


def compose_frame(args):
    shot, i, t = args
    plate = np.asarray(Image.open(PLATES / shot / f"{i:05d}.png")).astype(np.float32) / 255
    c = G["cams"][shot]["cams"][i]
    cam = (np.array(c[:2]), c[2], c[3])
    w, ov = G["world"], G["ov"]
    img = ov.glow(plate)
    img, labels = look.draw_grid(img, mapcam.grid_projector(w, cam), mapcam.view_lonlat_box(w, cam),
                                 mapcam.px_per_degree_lat(w, cam))
    look.over(img, labels)
    for lay in overlays(t, cam):
        look.over(img, np.asarray(lay))
    flash = max(0.0, 1 - (t - IMPACT) / 0.6) if IMPACT <= t < IMPACT + 0.6 else 0.0
    img[:HUD.HEIGHT] = look.over(img[:HUD.HEIGHT], G["hud"].render(hud_columns(t, cam), flash=flash))
    if flash:                                   # the storm hits: brief global flash
        img = img * (1 + 0.35 * flash)
    return look.to_u8(G["ov"].finish(img, i))


# ---- Blender city segment (0:19.5-0:50) --------------------------------------------------

RADIO_SUBS = [(42.5, "Grid Control to all stations..."), (44.3, "we've lost the northern lines."),
              (45.95, "Multiple transformer trips... Montreal is down."),
              (48.75, "I repeat, we are losing the network..."), (51.1, "we are losing the—")]


def radio_bars(t, n=40):
    """Waveform bars from the radio take if it exists, else a placeholder envelope."""
    wav = ROOT / "build" / "audio" / "grid_radio.wav"
    if wav.exists():
        if "radio" not in G:
            from scipy.io import wavfile
            sr, x = wavfile.read(wav)
            x = x.astype(np.float32)
            x = (x.mean(1) if x.ndim > 1 else x) / (np.abs(x).max() + 1e-9)
            G["radio"] = (sr, x)
        sr, x = G["radio"]
        k = int((t - timeline.RADIO[0]) * sr)
        seg = np.abs(x[max(0, k):k + int(0.3 * sr)])
        step = max(1, len(seg) // n)
        return [float(np.clip(seg[j * step:(j + 1) * step].max() if len(seg) >= (j + 1) * step else 0.03, 0.03, 1))
                for j in range(n)]
    rng = np.random.default_rng(int(t * 30))
    speak = 0.6 + 0.4 * math.sin(t * 7.3) * math.sin(t * 2.1)
    return list(np.clip(rng.random(n) * speak, 0.03, 1))


def compose_city_frame(args):
    import blender_city as BC
    f, t = args
    img = np.asarray(Image.open(CITY / f"{f:05d}.png").convert("RGB")).astype(np.float32) / 255
    if t < timeline.HANDOFF[1]:                     # crossfade from the 2D zoom plate
        a = float(mapcam.smoothstep(timeline.HANDOFF[0], timeline.HANDOFF[1], t))
        bi = f - int(round(G_start("B") * FPS))
        plate = np.asarray(Image.open(PLATES / "B" / f"{bi:05d}.png")).astype(np.float32) / 255
        img = plate * (1 - a) + img * a
    w, ov = G["world"], G["ov"]
    img = ov.glow(img)
    tgt, D, pitch, heading, hfov = BC.cam_state(t)
    cam2d = (np.asarray(tgt) / 1000.0, BC.view_width_km(t), 1.0)   # equals the Blender view while top-down
    gfade = 1.0 - float(mapcam.smoothstep(0.0, 5.0, pitch))
    if gfade > 0.01:
        img, labels = look.draw_grid(img, mapcam.grid_projector(w, cam2d), mapcam.view_lonlat_box(w, cam2d),
                                     mapcam.px_per_degree_lat(w, cam2d), opacity=0.2 * gfade, label_opacity=0.5 * gfade)
        look.over(img, labels)
        for lay in overlays(t, cam2d):
            look.over(img, np.asarray(lay))
    if timeline.RADIO[0] <= t < timeline.RADIO[1]:
        sub = [txt for t0, txt in RADIO_SUBS if t >= t0][-1]
        k = min(1.0, (timeline.RADIO[1] - t) / 0.3)
        rp = panels.radio_panel((W, H), t - timeline.RADIO[0], "GRID CONTROL — CH 4", radio_bars(t), sub, alpha=k)
        look.over(img, np.asarray(rp))
    img[:HUD.HEIGHT] = look.over(img[:HUD.HEIGHT], G["hud"].render(hud_columns(t, cam2d)))
    return look.to_u8(ov.finish(img, f))


def run_city(t0, t1, out, workers=4):
    jobs = [(f, f / FPS) for f in range(int(round(t0 * FPS)), int(round(t1 * FPS)))]
    with Pool(workers, initializer=init) as p:
        encode(p.imap(compose_city_frame, jobs, chunksize=2), out, len(jobs))


def encode(frames_iter, out, n):
    out.parent.mkdir(parents=True, exist_ok=True)
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
           "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-preset", "medium", "-crf", "16",
           "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(out)]
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    for k, fr in enumerate(frames_iter):
        p.stdin.write(fr.tobytes())
    p.stdin.close()
    p.wait()
    print(out, n, "frames")


def jobs_for(ranges):
    jobs = []
    for shot, t0, t1 in ranges:
        start = G_start(shot)
        for i in range(int(round((t0 - start) * FPS)), int(round((t1 - start) * FPS))):
            jobs.append((shot, i, start + i / FPS))
    return jobs


def G_start(shot):
    return json.loads((PLATES / shot / "cams.json").read_text())["start_s"]


def run(ranges, out, workers=4):
    jobs = jobs_for(ranges)
    with Pool(workers, initializer=init) as p:
        encode(p.imap(compose_frame, jobs, chunksize=2), out, len(jobs))


if __name__ == "__main__":
    what = sys.argv[1] if len(sys.argv) > 1 else "preview"
    if what == "preview":
        run([("A", 0, 12), ("B", 12, 20.5)], PREVIEW / "scene1_open.mp4")
        run([("F", 65, 75)], PREVIEW / "scene1_pullback.mp4")
    elif what == "city":                          # python3 compose.py city [t0 t1]
        t0, t1 = (float(sys.argv[2]), float(sys.argv[3])) if len(sys.argv) > 3 else (timeline.HANDOFF[0], timeline.RADIO[1])
        run_city(t0, t1, PREVIEW / f"scene1_city_{t0:g}-{t1:g}.mp4")
