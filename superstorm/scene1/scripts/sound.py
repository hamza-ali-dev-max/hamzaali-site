"""Procedural sound design for scene 1 (no downloads, no music). 48 kHz stereo stems:

  drone.wav    very quiet low bed under the whole scene (silent during the 2 s blackout gap)
  city_hum.wav 60 Hz mains hum + harmonics + distant traffic; steps down district by district
               following timeline.light_level, crackles on every flicker
  sfx.wav      storm impact boom + aurora shimmer (0:04), zoom whoosh, district clunks,
               the heavy power-down thunk + transformer spin-down (0:40), pull-back wind
Then 2 s of true digital silence after the thunk. Output: build/audio/*.wav (24-bit).
"""
import subprocess

import numpy as np
from scipy import signal
from scipy.io import wavfile

import timeline as T
from geo import ROOT

SR = 48000
N = int(T.DURATION * SR)
OUT = ROOT / "build" / "audio"
rng = np.random.default_rng(5)
t = np.arange(N) / SR


def db(x):
    return 10 ** (x / 20)


def env(t0, a, s, r, peak=1.0, length=None):
    """ADSR-ish envelope array over the full timeline (attack a, hold s, release r)."""
    e = np.zeros(N)
    i0 = int(t0 * SR)
    seg = np.concatenate([np.linspace(0, 1, max(1, int(a * SR))), np.ones(int(s * SR)),
                          np.linspace(1, 0, max(1, int(r * SR))) ** 2])
    i1 = min(N, i0 + len(seg))
    if i0 < N:
        e[i0:i1] = seg[: i1 - i0] * peak
    return e


def lowpass(x, fc, order=4):
    sos = signal.butter(order, fc, "low", fs=SR, output="sos")
    return signal.sosfiltfilt(sos, x)


def bandpass(x, lo, hi, order=4):
    sos = signal.butter(order, [lo, hi], "band", fs=SR, output="sos")
    return signal.sosfiltfilt(sos, x)


def brown(n):
    w = rng.standard_normal(n)
    b = np.cumsum(w)
    b = signal.sosfiltfilt(signal.butter(1, 15, "high", fs=SR, output="sos"), b)
    return b / (np.abs(b).max() + 1e-9)


def stereo(mono, width=0.0):
    if width <= 0:
        return np.stack([mono, mono], 1)
    d = int(width * SR / 1000)                     # small Haas offset in ms
    return np.stack([mono, np.concatenate([np.zeros(d), mono[:-d or None]])], 1)


def silence_gate():
    g = np.ones(N)
    a, b = T.SILENCE
    g[int(a * SR):int(b * SR)] = 0.0
    g[int(T.DURATION * SR) - 1:] = 0.0
    return g


# ---------------------------------------------------------------- stems

def drone():
    lfo = 0.5 + 0.5 * np.sin(2 * np.pi * 0.05 * t)
    x = (np.sin(2 * np.pi * 36.7 * t) * 0.5 + np.sin(2 * np.pi * 55.0 * t + 0.4 * np.sin(2 * np.pi * 0.07 * t)) * 0.35
         + np.sin(2 * np.pi * 73.4 * t) * 0.18 * lfo)
    x += 0.45 * lowpass(brown(N), 140)
    shape = 0.6 + 0.4 * np.clip((t - T.IMPACT) / 2.0, 0, 1)            # opens up when the storm hits
    shape *= 1 + 0.35 * np.exp(-((t - 18.0) / 2.5) ** 2)              # swells through the zoom
    shape *= np.where(t > T.SILENCE[1], 0.8, 1.0)
    x = x * shape
    x = x / np.abs(x).max() * db(-26)
    return stereo(x, 7) * silence_gate()[:, None]


def city_hum():
    sched = T.blackout_schedule()
    fps = 100
    ts = np.arange(int(T.DURATION * fps)) / fps
    lvl = np.array([np.mean([T.light_level(tt, d) for d in sched]) for tt in ts])
    lvl = np.interp(t, ts, lvl)
    fade_in = np.clip((t - T.CITY_START) / 1.5, 0, 1)
    mains = np.sin(2 * np.pi * 60 * t) + 0.5 * np.sin(2 * np.pi * 120 * t) + 0.3 * np.sin(2 * np.pi * 180 * t)
    mains = np.tanh(1.8 * mains)                                   # a little transformer buzz
    traffic = bandpass(rng.standard_normal(N), 90, 900) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.11 * t) ** 2)
    air = bandpass(rng.standard_normal(N), 900, 5000) * 0.25
    x = 0.55 * mains * lvl + 0.9 * traffic * (0.35 + 0.65 * lvl) + air * (0.4 + 0.6 * lvl)
    x *= fade_in
    x[t >= T.BLACKOUT_END + 0.05] = 0.0
    x = x / (np.abs(x).max() + 1e-9) * db(-20)
    return stereo(x, 11)


def crackle(dur):
    n = int(dur * SR)
    pops = (rng.random(n) < 0.004).astype(float) * rng.uniform(-1, 1, n)
    buzz = np.sign(np.sin(2 * np.pi * 120 * np.arange(n) / SR)) * 0.4
    x = bandpass(rng.standard_normal(n), 1500, 7000) * 0.6 + pops * 2.5 + buzz
    return x * np.hanning(n) ** 0.3


def thud(freq0, freq1, dur, click=0.3):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    f = freq1 + (freq0 - freq1) * np.exp(-tt / (dur * 0.25))
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) * np.exp(-tt / (dur * 0.3))
    x[: int(0.004 * SR)] += click * rng.uniform(-1, 1, int(0.004 * SR))
    return x


def place(buf, x, at, gain):
    i = int(at * SR)
    j = min(N, i + len(x))
    if i < N:
        buf[i:j] += x[: j - i] * gain


def sfx():
    buf = np.zeros(N)
    # storm impact: sub boom + aurora shimmer
    place(buf, thud(62, 34, 3.2, click=0.0), T.IMPACT, db(-8))
    shimmer = bandpass(rng.standard_normal(int(4 * SR)), 3000, 9000)
    shimmer *= np.linspace(0, 1, len(shimmer)) ** 2 * np.linspace(1, 0, len(shimmer)) ** 0.5
    place(buf, shimmer, T.IMPACT, db(-30))
    # zoom whoosh: filtered noise following the zoom speed (peaks in the dive)
    n = int((T.HANDOFF[1] + 1.0 - T.ZOOM_START) * SR)
    tt = np.arange(n) / SR + T.ZOOM_START
    speed = np.exp(-((tt - 14.2) / 1.2) ** 2) * 0.6 + np.exp(-((tt - 19.0) / 1.1) ** 2)
    wh = bandpass(rng.standard_normal(n), 250, 3500) * speed
    place(buf, wh, T.ZOOM_START, db(-24))
    # blackout: crackle on each flicker, clunk on each death, big thunk at the end
    for d in T.blackout_schedule():
        for s, dur, lvl in d["flickers"]:
            place(buf, crackle(dur + 0.05), s, db(-26))
        if d["death_s"] < T.BLACKOUT_END - 0.01:
            place(buf, thud(95 + 10 * d["district"] % 30, 45, 0.45, click=0.5), d["death_s"], db(-17))
    place(buf, thud(58, 26, 1.1, click=0.8), T.BLACKOUT_END, db(-3))                   # the thunk
    spin = np.sin(2 * np.pi * np.cumsum(np.geomspace(120, 18, int(1.1 * SR))) / SR)
    spin *= np.linspace(1, 0, len(spin)) ** 1.5
    place(buf, np.tanh(2 * spin), T.BLACKOUT_END, db(-16))                            # spin-down
    buf[int(T.SILENCE[0] * SR):int(T.SILENCE[1] * SR)] = 0.0                          # true silence
    # pull-back: rising wind, hard cut at the end
    n = int((T.PULLBACK[1] - T.PULLBACK[0]) * SR)
    tt = np.arange(n) / SR
    wind = bandpass(rng.standard_normal(n), 150, 2500) * (np.exp(-((tt - 2.2) / 1.4) ** 2) + 0.25 * np.clip(tt / 10, 0, 1))
    place(buf, wind, T.PULLBACK[0], db(-20))
    buf[-1:] = 0
    return stereo(buf, 3)


def write(name, x):
    OUT.mkdir(parents=True, exist_ok=True)
    tmp = OUT / f"_{name}.wav"
    wavfile.write(tmp, SR, x.astype(np.float32))
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(tmp), "-c:a", "pcm_s24le", str(OUT / f"{name}.wav")], check=True)
    tmp.unlink()


def main():
    stems = {"drone": drone(), "city_hum": city_hum(), "sfx": sfx()}
    for k, v in stems.items():
        write(k, v)
    mix = sum(stems.values())
    peak = np.abs(mix).max()
    if peak > db(-1):
        mix *= db(-1) / peak
    write("sound_design_mix", mix)
    print("stems:", ", ".join(stems), "| mix peak dBFS:", round(20 * np.log10(np.abs(mix).max()), 1))


if __name__ == "__main__":
    main()
