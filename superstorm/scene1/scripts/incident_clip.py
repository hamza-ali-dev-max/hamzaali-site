"""Put a Seedance clip into the house look and join it to its zoom (incident preview).

  python3 incident_clip.py london_incident --zoom ../build/zooms/london/zoom.mp4 --clip ../build/clips/X1.mp4 \
      --place "LONDON, UK" --when "04:21 GMT · T+17:09" --caption "UK: 61 % WITHOUT POWER" \
      --clock "T+17:09 — CASCADE" --people 31400000
  python3 incident_clip.py montreal_reporter --clip ../build/clips/M1.mp4 --clip ../build/clips/M2.mp4 \
      --lower "GNN|LIVE|MONTRÉAL" --place "MONTRÉAL, CANADA" --when "23:14 EST · T+17:02" ...

Clips are brought to 1920x1080 / 30 fps, get the same glow, HUD, CRT scanlines, vignette and
grain as the map shots, a location tag (and optional GNN lower third), keep their own audio,
and are appended after the zoom (if given). Output: build/preview/<name>.mp4
"""
import argparse
import subprocess
import tempfile
from pathlib import Path

import numpy as np

import look
import panels
from geo import ROOT
from look import AMBER, RED, HUD, Overlay, W, H, fmt_int

FPS = 30
PREVIEW = ROOT / "build" / "preview"


def frames(path):
    """Decode a clip to 1920x1080 RGB frames at 30 fps (Lanczos upscale)."""
    cmd = ["ffmpeg", "-loglevel", "error", "-i", str(path), "-vf", f"fps={FPS},scale={W}:{H}:flags=lanczos",
           "-f", "rawvideo", "-pix_fmt", "rgb24", "-"]
    p = subprocess.Popen(cmd, stdout=subprocess.PIPE)
    n = W * H * 3
    while True:
        buf = p.stdout.read(n)
        if len(buf) < n:
            break
        yield np.frombuffer(buf, np.uint8).reshape(H, W, 3)
    p.wait()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("name")
    ap.add_argument("--zoom")
    ap.add_argument("--clip", action="append", required=True)
    ap.add_argument("--place", required=True)
    ap.add_argument("--when", required=True)
    ap.add_argument("--caption")
    ap.add_argument("--lower", help="NETWORK|TAG|PLACE lower third, e.g. GNN|LIVE|MONTRÉAL")
    ap.add_argument("--clock", default="T+17:00")
    ap.add_argument("--people", type=int, default=0)
    ap.add_argument("--view", help="VIEW CENTER value to match the zoom's HUD, e.g. '51.51°N 0.13°W'")
    a = ap.parse_args()
    PREVIEW.mkdir(parents=True, exist_ok=True)
    ov, hud = Overlay(), HUD()
    tmp = Path(tempfile.mkdtemp())
    body = tmp / "body.mp4"
    enc = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
                            "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-preset", "medium", "-crf", "17",
                            "-pix_fmt", "yuv420p", str(tmp / "body_v.mp4")], stdin=subprocess.PIPE)
    i = 0
    for clip in a.clip:
        for fr in frames(clip):
            t = i / FPS
            img = ov.glow(fr.astype(np.float32) / 255, strength=0.35, thresh=0.7)
            blink = int(t * 2.2) % 2 == 0
            cols = [("MISSION CLOCK", a.clock + (" ●" if blink else "  "), RED, 30, 540),
                    ("GEOMAGNETIC STORM", "G5+ EXTREME", RED, 34, 430),
                    ("PEOPLE WITHOUT POWER", fmt_int(a.people), RED if a.people else AMBER, 34, 470)]
            if a.view:
                cols.append(("VIEW CENTER", a.view, AMBER, 26, 380))
            img[:HUD.HEIGHT] = look.over(img[:HUD.HEIGHT], hud.render(cols))
            if a.lower:
                net, tag, place = a.lower.split("|")
                look.over(img, np.asarray(panels.lower_third((W, H), t - 0.3, net, tag, place)))
            else:
                look.over(img, np.asarray(panels.location_tag((W, H), t - 0.4, a.place, a.when, a.caption)))
            enc.stdin.write(look.to_u8(ov.finish(img, i)).tobytes())
            i += 1
    enc.stdin.close()
    enc.wait()
    # audio: each clip's own track (silence where a clip has none), laid end to end
    parts = []
    for k, clip in enumerate(a.clip):
        dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", clip],
                                   capture_output=True, text=True).stdout)
        out = tmp / f"a{k}.wav"
        has_a = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "a", "-show_entries", "stream=index",
                                "-of", "csv=p=0", clip], capture_output=True, text=True).stdout.strip()
        src = ["-i", clip, "-vn"] if has_a else ["-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo"]
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", *src, "-t", f"{dur:.3f}", "-ar", "48000", "-ac", "2", str(out)], check=True)
        parts.append(out)
    lst = tmp / "a.txt"
    lst.write_text("".join(f"file '{p}'\n" for p in parts))
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", str(lst), str(tmp / "a.wav")], check=True)
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(tmp / "body_v.mp4"), "-i", str(tmp / "a.wav"),
                    "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", str(body)], check=True)
    out = PREVIEW / f"{a.name}.mp4"
    if a.zoom:
        z = tmp / "zoom_a.mp4"                     # give the zoom a silent track so the two parts concat
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", a.zoom, "-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo",
                        "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", str(z)], check=True)
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(z), "-i", str(body), "-filter_complex",
                        "[0:v][0:a][1:v][1:a]concat=n=2:v=1:a=1[v][a]", "-map", "[v]", "-map", "[a]", "-c:v", "libx264",
                        "-preset", "medium", "-crf", "17", "-pix_fmt", "yuv420p", "-c:a", "aac", "-movflags", "+faststart",
                        str(out)], check=True)
    else:
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(body), "-c", "copy", "-movflags", "+faststart", str(out)], check=True)
    print(out, f"{i} clip frames")


if __name__ == "__main__":
    main()
