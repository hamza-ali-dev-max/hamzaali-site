"""10 s demo of the full-video graphics on the world map: PiP clip box with a leader arrow
to Tokyo, a fictional headline card, and the radio panel with waveform + subtitles.
The PiP shows a 'clip pending' feed until the Seedance clips exist.
Output: build/preview/graphics_demo.mp4"""
import math
import subprocess

import numpy as np
from PIL import Image, ImageDraw

import look
import mapcam
import panels
from geo import ROOT
from look import AMBER, CYAN, RED, HUD, Overlay, W, H

FPS, DUR = 30, 10.0
OUT = ROOT / "build" / "preview" / "graphics_demo.mp4"


def pending_feed(t, w=854, h=480, seed=0):
    rng = np.random.default_rng(int(t * FPS) + seed)
    n = rng.integers(0, 60, (h // 4, w // 4), dtype=np.uint8)
    img = Image.fromarray(np.kron(n, np.ones((4, 4), np.uint8))).convert("RGB")
    d = ImageDraw.Draw(img)
    d.text((w // 2 - 190, h // 2 - 30), "LIVE FEED · CLIP PENDING", font=look.font(30, "Bold"), fill=CYAN)
    d.text((w // 2 - 120, h // 2 + 16), "SEEDANCE 2.5 / 480p", font=look.font(20, "Medium"), fill=AMBER)
    return np.asarray(img)


def main():
    world = mapcam.World()
    ov, hud = Overlay(), HUD()
    qc, V = world.cam_from_ai((836, 470.5), W / 1672 * 1.02)
    g = world.g
    tokyo = (139.69, 35.69)
    # waveform envelope from the radio-chain test file (placeholder voice)
    wave = None
    try:
        r = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", str(ROOT / "build/test/placeholder_radio_fx.wav"),
                            "-f", "f32le", "-ac", "1", "-ar", "8000", "-"], capture_output=True, check=True)
        raw = np.frombuffer(r.stdout, np.float32)
        wave = np.sqrt(np.convolve(raw ** 2, np.ones(60) / 60, "same"))
        wave = wave / (np.percentile(wave, 97) + 1e-9)
    except Exception:
        pass
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS),
           "-i", "-", "-c:v", "libx264", "-preset", "medium", "-crf", "21", "-pix_fmt", "yuv420p", str(OUT)]
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    for i in range(int(DUR * FPS)):
        t = i / FPS
        s = 1 + 0.02 * t / DUR
        qc_t, V_t = world.cam_from_ai((836 + 30 * t / DUR, 470.5), W / 1672 * 1.02 * s)
        cam = (qc_t, V_t, 0.0)
        img = world.render_map(cam, {"aurora_impact": 1.0}, "aurora")
        img = ov.glow(img)
        img, labels = look.draw_grid(img, mapcam.grid_projector(world, cam), mapcam.view_lonlat_box(world, cam),
                                     mapcam.px_per_degree_lat(world, cam))
        look.over(img, labels)
        ax, ay = world.lonlat_to_screen(np.array([tokyo[0]]), np.array([tokyo[1]]), cam)
        if t > 0.6:
            box = panels.pip_box((W, H), pending_feed(t), (1380, 560, 480, 270), (float(ax[0]), float(ay[0])),
                                 "GNN · LIVE · TOKYO", t - 0.6)
            look.over(img, np.asarray(box))
        if t > 3.0:
            card = panels.headline_card((W, H), t - 3.0, "THE NORTHERN LEDGER", "Solar storm knocks out Quebec grid in seconds",
                                        "Millions without power as auroras light up skies as far south as Texas.", "23:14 EST",
                                        side="left", y=150)
            look.over(img, np.asarray(card))
        if t > 5.0 and wave is not None:
            k = int((t - 5.0) * 8000)
            seg = wave[k:k + 2400]
            bars = [float(np.clip(seg[j * 60:(j + 1) * 60].max(), 0.03, 1)) if len(seg) > (j + 1) * 60 else 0.03 for j in range(40)]
            subs = ["Grid Control to all stations...", "we've lost the northern lines.", "Multiple transformer trips..."]
            sub = subs[min(2, int((t - 5.0) / 1.6))]
            rp = panels.radio_panel((W, H), t - 5.0, "GRID CONTROL — CH 4", bars, sub)
            look.over(img, np.asarray(rp))
        blink = int(t * 2.2) % 2 == 0
        cols = [("MISSION CLOCK", "T+17:04 — CASCADE " + ("●" if blink else " "), RED, 30, 540),
                ("PEOPLE WITHOUT POWER", "31,400,000", RED, 34, 470),
                ("ESTIMATED DEATHS", "0", AMBER, 34, 330), ("KP INDEX", "9.0", RED, 34, 190)]
        img[:HUD.HEIGHT] = look.over(img[:HUD.HEIGHT], hud.render(cols))
        p.stdin.write(look.to_u8(ov.finish(img, i)).tobytes())
    p.stdin.close()
    p.wait()
    print(OUT)


if __name__ == "__main__":
    main()
