"""Scene-1 timeline: the single source of truth for timings shared by the plates, the
Blender city, the sound design and the compositor (seconds on the 75 s scene clock)."""
import json

import numpy as np

from geo import ROOT

FPS = 30
DURATION = 75.0

IMPACT = 4.0                 # storm hits: base -> aurora crossfade, HUD flips to IMPACT
ZOOM_START = 12.0
QUEBEC_BEAT = 16.0
HANDOFF = (19.5, 20.0)       # 2D zoom -> Blender crossfade
CITY_START = 19.5
BLACKOUT_START = 31.0
N_DISTRICTS = 10
BLACKOUT_END = 40.0          # last district dies -> power-down thunk
SILENCE = (40.15, 42.15)     # 2 s of true silence
RADIO = (42.2, 50.0)
REPORTER = (50.0, 65.0)
CROWD_INSERT = (57.0, 61.0)  # 4 s crowd shot cut into the reporter clip
PULLBACK = (65.0, 75.0)

PEOPLE_WITHOUT_POWER = 9_000_000


def blackout_schedule(seed=17):
    """District k dies at BLACKOUT_START + k*step, after 2-3 flickers in the 0.7 s before.
    Flicker = (start_s, duration_s, level) where level is the light level during the dip."""
    rng = np.random.default_rng(seed)
    step = (BLACKOUT_END - BLACKOUT_START) / (N_DISTRICTS - 1)
    out = []
    for k in range(N_DISTRICTS):
        death = BLACKOUT_START + k * step
        n = int(rng.integers(2, 4))
        starts = np.sort(death - rng.uniform(0.12, 0.75, n))
        flick = [(float(s), float(rng.uniform(0.04, 0.11)), float(rng.uniform(0.0, 0.35))) for s in starts]
        out.append({"district": k, "death_s": round(death, 3), "flickers": flick})
    return out


def light_level(t, district):
    """Light multiplier for a district at time t (1 = on, 0 = dead)."""
    if t >= district["death_s"]:
        # the dying frames: fast decay with a last brief surge
        d = t - district["death_s"]
        return float(max(0.0, 1.0 - d / 0.12)) if d < 0.12 else 0.0
    for s, dur, lvl in district["flickers"]:
        if s <= t < s + dur:
            return lvl
    return 1.0


def people_without_power(t):
    """HUD counter: follows the districts going dark, eased, reaches the full 9 M."""
    if t < BLACKOUT_START:
        return 0
    u = min(1.0, (t - BLACKOUT_START) / (BLACKOUT_END - BLACKOUT_START + 0.4))
    u = u * u * (3 - 2 * u)
    return int(PEOPLE_WITHOUT_POWER * u)


def write_json():
    p = ROOT / "assets" / "blackout_schedule.json"
    p.write_text(json.dumps({"fps": FPS, "blackout_start": BLACKOUT_START, "blackout_end": BLACKOUT_END,
                             "districts": blackout_schedule()}, indent=2))
    return p


if __name__ == "__main__":
    print(write_json())
