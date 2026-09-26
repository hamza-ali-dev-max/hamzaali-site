"""Two-way radio treatment with ffmpeg only (no downloads, everything procedural):
band-pass 300-3400 Hz, soft clipping, heavy compression, a low static bed from ffmpeg's
noise source, a squelch beep at the start and a static burst that cuts the last word.

Usage: python3 radio_fx.py in.wav out.wav --cut 7.85 [--max-gap 0.25]
  --cut      seconds into the input (after tightening) where the static burst chops the voice;
             negative = that many seconds before the end of the speech
  --max-gap  shorten every pause longer than this (s) first, so a take fits its radio slot
"""
import argparse
import re
import subprocess
import tempfile

import numpy as np
from scipy.io import wavfile


def duration(path):
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path],
                       capture_output=True, text=True, check=True)
    return float(r.stdout.strip())


def pauses(path, noise="-38dB", d=0.18):
    out = subprocess.run(["ffmpeg", "-hide_banner", "-i", path, "-af", f"silencedetect=noise={noise}:d={d}", "-f", "null",
                          "-"], capture_output=True, text=True).stderr
    st = [float(x) for x in re.findall(r"silence_start: ([0-9.]+)", out)]
    en = [float(x) for x in re.findall(r"silence_end: ([0-9.]+)", out)]
    return list(zip(st, en))


def tighten(src, max_gap):
    """Copy of src with every inner pause cut down to max_gap (short crossfades at the joins)."""
    sr, x = wavfile.read(src)
    x = x.astype(np.float32)
    dur = len(x) / sr
    keep, t = [], 0.0
    for a, b in pauses(src):
        if b >= dur - 0.01 or a <= 0.01:          # leading/trailing silence stays as it is
            continue
        if b - a > max_gap:
            keep.append((t, a + max_gap / 2))
            t = b - max_gap / 2
    keep.append((t, dur))
    fade = int(0.01 * sr)
    parts = []
    for a, b in keep:
        seg = x[int(a * sr):int(b * sr)].copy()
        ramp = np.linspace(0, 1, fade)
        seg[:fade] *= ramp if seg.ndim == 1 else ramp[:, None]
        seg[-fade:] *= ramp[::-1] if seg.ndim == 1 else ramp[::-1, None]
        parts.append(seg)
    y = np.concatenate(parts)
    out = tempfile.NamedTemporaryFile(suffix=".wav", delete=False).name
    wavfile.write(out, sr, y if x.dtype == np.float32 else y)
    return out


def speech_end(path):
    p = pauses(path)
    dur = duration(path)
    return p[-1][0] if p and p[-1][1] >= dur - 0.01 else dur


def radio(src, dst, cut=None, lead=0.32, burst=0.85, max_gap=None):
    if max_gap:
        src = tighten(src, max_gap)
    if cut is not None and cut < 0:
        cut = speech_end(src) + cut
    dur = duration(src)
    cut = min(cut or dur, dur)
    total = lead + cut + burst
    ms = int(lead * 1000)
    cut_ms = int((lead + cut) * 1000)
    fc = (
        # voice: telephone band, compression, soft clip, chopped at the cut point
        f"[0:a]aresample=48000,pan=mono|c0=c0,atrim=0:{cut:.3f},adelay={ms},"
        "highpass=f=300:poles=2,highpass=f=300:poles=2,lowpass=f=3400:poles=2,lowpass=f=3400:poles=2,"
        "acompressor=threshold=0.06:ratio=12:attack=3:release=90:makeup=5,"
        "asoftclip=type=atan:threshold=0.55,volume=0.85[v];"
        # static bed under the whole transmission
        f"anoisesrc=d={total:.3f}:c=pink:r=48000:a=0.35,highpass=f=400,lowpass=f=3200,volume=0.10,"
        f"afade=t=in:d=0.05,afade=t=out:st={total - 0.05:.3f}:d=0.05[bed];"
        # squelch: two-tone beep + a short noise 'chk'
        "sine=f=1320:d=0.085:r=48000,volume=0.30[b1];"
        "sine=f=1760:d=0.06:r=48000,volume=0.22,adelay=95[b2];"
        "anoisesrc=d=0.07:c=white:r=48000:a=0.5,highpass=f=800,lowpass=f=4000,adelay=170,volume=0.6[chk];"
        # the burst that cuts the last word
        f"anoisesrc=d={burst:.3f}:c=white:r=48000:a=0.9,highpass=f=500,lowpass=f=4200,volume=0.32,"
        f"afade=t=in:d=0.012,afade=t=out:st={burst - 0.25:.3f}:d=0.25,adelay={cut_ms - 20}[burst];"
        "[v][bed][b1][b2][chk][burst]amix=inputs=6:normalize=0:duration=longest,"
        f"atrim=0:{total:.3f},volume=0.8,alimiter=limit=0.7:attack=1:release=40:level=disabled,"
        "asoftclip=type=tanh:threshold=0.95,pan=stereo|c0=c0|c1=c0[out]"
    )
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", src, "-filter_complex", fc, "-map", "[out]",
                    "-c:a", "pcm_s24le", "-ar", "48000", dst], check=True)
    return total


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("src")
    ap.add_argument("dst")
    ap.add_argument("--cut", type=float, default=None)
    ap.add_argument("--max-gap", type=float, default=None)
    a = ap.parse_args()
    print(f"{a.dst}: {radio(a.src, a.dst, a.cut, max_gap=a.max_gap):.2f} s")
