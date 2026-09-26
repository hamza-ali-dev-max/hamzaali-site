"""Scene-1 reporter block (0:53.2-1:05) and the checkpoint-4 lip-sync test.

  python3 reporter.py     -> build/preview/reporter_picture.mp4  M1 (flag fixed) + M2 at 0.6x, house look
                             build/audio/reporter_A.wav / _C.wav  the block's audio, 53.2-67.2 s on the scene clock
                             build/preview/cp4_lipsync.mp4        A and C back to back, with cards

The reporter speaks the first two sentences on camera (M1, Seedance lip-synced to its own voice).
  A  Seedance's own voice on camera, then the ElevenLabs GNN voice for the rest (voice changes at the cut).
  C  ElevenLabs GNN voice throughout; its two on-camera phrases are time-fitted (atempo) onto the
     phrases her lips speak (M1 speech 0.60-1.94 s and 2.34-4.90 s).
  (B, re-voicing M1's audio with ElevenLabs speech-to-speech, needs the key's speech_to_speech
   permission: `tts.py sts ../build/audio/M1_native.wav GNN M1_revoiced`, then use it as A's first part.)
Needs: build/clips/M1_clean.mp4 (clip_fix.py mic_flag), M2.mp4, build/audio/vo/GNN.wav (tts.py say GNN).
"""
import subprocess
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy import signal
from scipy.io import wavfile

import timeline as T
from geo import ROOT

SR = 48000
CLIPS = ROOT / "build" / "clips"
AUD = ROOT / "build" / "audio"
PREVIEW = ROOT / "build" / "preview"
M1_PHRASES = [(0.60, 1.94), (2.34, 4.90)]      # where her lips speak in M1 (from its own audio envelope)
GNN_PHRASES = [(0.00, 1.55), (1.99, 4.67)]     # the same two sentences in GNN.wav
BLOCK = T.REPORTER[1] - T.REPORTER[0]          # picture: 11.8 s
TAIL = 2.2                                     # the voice runs on into the pull-back
FONT = "/usr/share/fonts/truetype/jetbrains-mono/JetBrainsMono-Bold.ttf"


def ff(*args):
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", *map(str, args)], check=True)


def dur(p):
    return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(p)],
                                capture_output=True, text=True, check=True).stdout)


def read(p):
    """Mono float at 48 kHz."""
    tmp = Path(tempfile.mkdtemp()) / "a.wav"
    ff("-i", p, "-vn", "-ac", "1", "-ar", SR, "-c:a", "pcm_f32le", tmp)
    return wavfile.read(tmp)[1].astype(np.float32)


def fit(x, target_s):
    """Time-stretch x (mono float) to target_s without changing pitch (ffmpeg atempo)."""
    tmp = Path(tempfile.mkdtemp())
    wavfile.write(tmp / "i.wav", SR, x)
    ff("-i", tmp / "i.wav", "-af", f"atempo={len(x) / SR / target_s:.5f}", "-c:a", "pcm_f32le", tmp / "o.wav")
    return wavfile.read(tmp / "o.wav")[1].astype(np.float32)


def place(buf, x, at, gain=1.0):
    i = int(at * SR)
    n = min(len(x), len(buf) - i)
    buf[i:i + n] += gain * x[:n]


def rms(x):
    return float(np.sqrt(np.mean(x[np.abs(x) > 1e-3] ** 2)))


def street_bed(n, seed=11):
    """Crowd murmur + cold wind: band-passed noise with a slow, uneven swell (procedural, no samples)."""
    rng = np.random.default_rng(seed)
    t = np.arange(n) / SR
    murmur = signal.sosfilt(signal.butter(4, [180, 1400], "bandpass", fs=SR, output="sos"), rng.normal(0, 1, n))
    am = 0.6 + 0.25 * np.sin(2 * np.pi * 0.37 * t) + 0.15 * np.sin(2 * np.pi * 1.9 * t + 1.3)
    wind = signal.sosfilt(signal.butter(2, 350, fs=SR, output="sos"), np.cumsum(rng.normal(0, 1, n)) * 0.02)
    wind = wind - signal.sosfilt(signal.butter(1, 30, fs=SR, output="sos"), wind)
    bed = murmur * am / np.abs(murmur).max() + 0.6 * wind / (np.abs(wind).max() + 1e-9)
    return (bed / np.abs(bed).max()).astype(np.float32)


def build_audio():
    n = int((BLOCK + TAIL) * SR)
    gnn = read(AUD / "vo" / "GNN.wav")
    native = read(CLIPS / "M1.mp4")
    ref = rms(gnn)
    rest = gnn[int(T.GNN_SPLIT * SR):]
    rest_at = T.VO["GNN_REST"] - T.REPORTER[0]
    bed = street_bed(n)
    fade = np.clip(np.minimum(np.arange(n) / (0.3 * SR), (n - np.arange(n)) / (1.5 * SR)), 0, 1)
    out = {}
    # A: Seedance's own voice (and its street sound) on camera, then the GNN voice
    a = np.zeros(n, np.float32)
    place(a, native, 0.0, ref / rms(native))
    place(a, rest, rest_at)
    place(a, bed * fade, 0.0, 0.035)
    out["A"] = a
    # C: GNN voice throughout, phrase-fitted to her lips
    c = np.zeros(n, np.float32)
    for (g0, g1), (m0, m1) in zip(GNN_PHRASES, M1_PHRASES):
        seg = gnn[int(g0 * SR):int((g1 + 0.04) * SR)]
        place(c, fit(seg, m1 - m0 + 0.04), m0)
    place(c, rest, rest_at)
    place(c, bed * fade, 0.0, 0.06)
    out["C"] = c
    for k, x in out.items():
        x = x / max(1.0, np.abs(x).max() / 0.89)
        wavfile.write(AUD / f"reporter_{k}.wav", SR, np.stack([x, x], 1))
    return out


def picture():
    m2 = CLIPS / "M2_slow.mp4"
    ff("-i", CLIPS / "M2.mp4", "-vf", f"setpts=PTS/{dur(CLIPS / 'M2.mp4') / (T.REPORTER[1] - T.CROWD_INSERT[0]):.5f},"
       "minterpolate=fps=30:mi_mode=mci:mc_mode=aobmc:vsbmc=1", "-an", m2)
    subprocess.run(["python3", str(Path(__file__).parent / "incident_clip.py"), "reporter_picture",
                    "--clip", str(CLIPS / "M1_clean.mp4"), "--clip", str(m2), "--lower", "GNN|LIVE|MONTRÉAL",
                    "--place", "MONTRÉAL, CANADA", "--when", "23:14 EST · T+17:02", "--clock", "T+17:02",
                    "--people", str(T.PEOPLE_WITHOUT_POWER), "--view", "45.50°N 73.57°W"], check=True)
    return PREVIEW / "reporter_picture.mp4"


def card(path, title, sub, secs=2.5):
    im = Image.new("RGB", (1920, 1080), (6, 14, 30))
    d = ImageDraw.Draw(im)
    d.text((160, 440), title, font=ImageFont.truetype(FONT, 64), fill=(90, 220, 240))
    d.text((160, 540), sub, font=ImageFont.truetype(FONT, 34), fill=(235, 190, 90))
    png = path.with_suffix(".png")
    im.save(png)
    ff("-loop", 1, "-i", png, "-f", "lavfi", "-i", f"anullsrc=r={SR}:cl=stereo", "-t", secs, "-r", 30,
       "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-shortest", path)
    png.unlink()
    return path


def reel(pic):
    tmp = Path(tempfile.mkdtemp())
    parts = []
    for k, title, sub in [("A", "A · SEEDANCE'S OWN VOICE ON CAMERA", "lips match; the voice changes to ElevenLabs at the crowd cut"),
                          ("C", "C · ELEVENLABS VOICE THROUGHOUT", "one voice; its two phrases time-fitted onto her lip movement")]:
        parts.append(card(tmp / f"card{k}.mp4", title, sub))
        v = tmp / f"{k}.mp4"
        ff("-i", pic, "-i", AUD / f"reporter_{k}.wav", "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac",
           "-b:a", "192k", "-af", f"afade=t=out:st={BLOCK - 0.6:.2f}:d=0.6", "-t", f"{BLOCK:.3f}", v)
        parts.append(v)
    lst = tmp / "l.txt"
    lst.write_text("".join(f"file '{p}'\n" for p in parts))
    out = PREVIEW / "cp4_lipsync.mp4"
    ff("-f", "concat", "-safe", 0, "-i", lst, "-c:v", "libx264", "-crf", 18, "-pix_fmt", "yuv420p", "-c:a", "aac",
       "-b:a", "192k", "-movflags", "+faststart", out)
    print(out)


if __name__ == "__main__":
    build_audio()
    reel(picture())
