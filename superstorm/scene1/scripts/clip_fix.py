"""Fixes to Seedance clips before they enter the edit.

  python3 clip_fix.py mic_flag ../build/clips/M1.mp4 ../build/clips/M1_clean.mp4 [--debug DIR]

mic_flag: Seedance drew a news-mic flag with a logo-like mark on M1 (frames 0-34 of 24 fps,
the push-in carries it off the bottom edge). The flag is found each frame as the saturated-blue
box nearest a hand-keyed path, then covered with a fictional GNN flag (navy, cyan stripe,
white "GNN"), softened and grained to sit in the footage. Audio is copied untouched.
"""
import argparse
import subprocess
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

# hand-keyed flag centre (frame, x, y) on the 854x480 source, read off a 100 px grid
KEYS = [(0, 430, 272), (6, 426, 283), (12, 415, 300), (18, 391, 350), (24, 382, 420), (30, 396, 470), (36, 400, 540)]
FONT = "/usr/share/fonts/truetype/jetbrains-mono/JetBrainsMono-Bold.ttf"


def key_centre(i):
    f = [k[0] for k in KEYS]
    return float(np.interp(i, f, [k[1] for k in KEYS])), float(np.interp(i, f, [k[2] for k in KEYS]))


def find_flag(bgr, i, prev):
    """Blue box near the keyed path; falls back to the previous box moved along the path."""
    cx, cy = key_centre(i)
    h, w = bgr.shape[:2]
    r = 70
    x0, y0, x1, y1 = int(max(0, cx - r)), int(max(0, cy - r)), int(min(w, cx + r)), int(min(h, cy + r))
    if x1 - x0 < 4 or y1 - y0 < 4:
        return None
    hsv = cv2.cvtColor(bgr[y0:y1, x0:x1], cv2.COLOR_BGR2HSV)
    m = ((hsv[..., 0] >= 95) & (hsv[..., 0] <= 130) & (hsv[..., 1] > 90) & (hsv[..., 2] > 45)).astype(np.uint8)
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((7, 7), np.uint8))
    n, lab, st, cen = cv2.connectedComponentsWithStats(m)
    best = None
    for k in range(1, n):
        bx, by, bw, bh, a = st[k]
        if a < 40:
            continue
        d = np.hypot(x0 + cen[k][0] - cx, y0 + cen[k][1] - cy)
        if best is None or d < best[0]:
            best = (d, (x0 + bx, y0 + by, bw, bh))
    if best and best[0] < 55:
        box = best[1]
        if prev is not None:   # the flag keeps its size smoothly; don't let the mask shrink it frame to frame
            box = (box[0], box[1], max(box[2], int(prev[2] * 0.9)), max(box[3], int(prev[3] * 0.9)))
        return box
    if prev is not None:
        px, py = key_centre(i - 1)
        return (int(prev[0] + cx - px), int(prev[1] + cy - py), prev[2], prev[3])
    return None


def gnn_flag(w, h):
    """RGBA fictional flag: navy block, cyan top stripe, white GNN."""
    s = 4                                       # draw big, downsample = clean edges
    im = Image.new("RGBA", (w * s, h * s), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rectangle([0, 0, w * s - 1, h * s - 1], fill=(14, 28, 52, 255))
    d.rectangle([0, 0, w * s - 1, int(h * s * 0.16)], fill=(64, 200, 230, 255))
    fs = int(h * s * 0.46)
    font = ImageFont.truetype(FONT, fs)
    tw = d.textlength("GNN", font=font)
    d.text(((w * s - tw) / 2, h * s * 0.3), "GNN", font=font, fill=(236, 240, 245, 255))
    return im.resize((w, h), Image.LANCZOS)


def mic_flag(src, dst, debug=None):
    cap = cv2.VideoCapture(str(src))
    fps = cap.get(cv2.CAP_PROP_FPS)
    tmp = Path(dst).with_suffix(".video.mp4")
    enc = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "bgr24",
                            "-s", f"{int(cap.get(3))}x{int(cap.get(4))}", "-r", f"{fps}", "-i", "-",
                            "-c:v", "libx264", "-crf", "12", "-preset", "slow", "-pix_fmt", "yuv420p", str(tmp)],
                           stdin=subprocess.PIPE)
    rng = np.random.default_rng(3)
    prev, i = None, 0
    while True:
        ok, f = cap.read()
        if not ok:
            break
        box = find_flag(f, i, prev) if i <= KEYS[-1][0] else None
        if box is not None:
            x, y, bw, bh = box
            pad = 0.18
            x, y = int(x - bw * pad), int(y - bh * pad)
            bw, bh = int(bw * (1 + 2 * pad)), int(bh * (1 + 2 * pad))
            flag = np.asarray(gnn_flag(bw, bh)).astype(np.float32) / 255
            # match the footage: same darkness as the scene around it, slight blur, grain
            around = f[max(0, y - bh):y + 2 * bh, max(0, x - bw):x + 2 * bw].astype(np.float32).mean() / 255
            gain = float(np.clip(0.55 + around * 1.6, 0.5, 0.95))
            rgb = cv2.GaussianBlur(flag[..., :3][..., ::-1] * gain, (0, 0), 0.7)
            rgb += rng.normal(0, 0.015, rgb.shape)
            a = cv2.GaussianBlur(flag[..., 3], (0, 0), 0.8)[..., None]
            H, W = f.shape[:2]
            fx0, fy0, fx1, fy1 = max(0, x), max(0, y), min(W, x + bw), min(H, y + bh)
            if fx1 > fx0 and fy1 > fy0:
                sub = f[fy0:fy1, fx0:fx1].astype(np.float32) / 255
                r_ = rgb[fy0 - y:fy1 - y, fx0 - x:fx1 - x]
                a_ = a[fy0 - y:fy1 - y, fx0 - x:fx1 - x]
                f[fy0:fy1, fx0:fx1] = np.clip((sub * (1 - a_) + r_ * a_) * 255, 0, 255).astype(np.uint8)
            prev = box
        if debug and i <= KEYS[-1][0] + 2:
            Path(debug).mkdir(parents=True, exist_ok=True)
            cv2.imwrite(str(Path(debug) / f"flag_{i:03d}.png"), f)
        enc.stdin.write(f.tobytes())
        i += 1
    enc.stdin.close()
    enc.wait()
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(tmp), "-i", str(src), "-map", "0:v", "-map", "1:a?",
                    "-c", "copy", str(dst)], check=True)
    tmp.unlink()
    print(dst, i, "frames")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("fix", choices=["mic_flag"])
    ap.add_argument("src")
    ap.add_argument("dst")
    ap.add_argument("--debug")
    a = ap.parse_args()
    mic_flag(a.src, a.dst, a.debug)
