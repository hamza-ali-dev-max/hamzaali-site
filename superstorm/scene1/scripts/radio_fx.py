"""Two-way radio treatment with ffmpeg only (no downloads, everything procedural):
band-pass 300-3400 Hz, soft clipping, heavy compression, a low static bed from ffmpeg's
noise source, a squelch beep at the start and a static burst that cuts the last word.

Usage: python3 radio_fx.py in.wav out.wav --cut 7.85
  --cut  seconds into the input where the static burst chops the voice
"""
import argparse
import subprocess


def duration(path):
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path],
                       capture_output=True, text=True, check=True)
    return float(r.stdout.strip())


def radio(src, dst, cut=None, lead=0.32, burst=0.85):
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
    a = ap.parse_args()
    print(f"{a.dst}: {radio(a.src, a.dst, a.cut):.2f} s")
