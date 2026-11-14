"""Paints the two backdrops used on the page: a cloud sky (pricing) and rolling grass hills (calls).
Original, procedural images (no stock photos). Run: python3 scripts/backdrops.py
Writes web/public/img/sky.webp and web/public/img/hills.webp. Needs numpy and Pillow."""
import os
import numpy as np
from PIL import Image, ImageFilter

OUT = os.path.join(os.path.dirname(__file__), '..', 'web', 'public', 'img')
os.makedirs(OUT, exist_ok=True)
W, H = 2400, 1350
rng = np.random.default_rng(7)


def fbm(w, h, octaves=6, base=3, persistence=0.5, seed=0):
    """Fractal value noise in 0..1, by summing smoothly upscaled random grids."""
    r = np.random.default_rng(seed)
    out = np.zeros((h, w), np.float32)
    amp, total = 1.0, 0.0
    for o in range(octaves):
        gw, gh = base * 2 ** o + 1, max(2, int(base * 2 ** o * h / w) + 1)
        grid = (r.random((gh, gw)) * 255).astype(np.uint8)
        layer = np.asarray(Image.fromarray(grid).resize((w, h), Image.BICUBIC), np.float32) / 255
        out += layer * amp
        total += amp
        amp *= persistence
    return out / total


def lerp(a, b, t):
    return a + (b - a) * t[..., None]


def save(arr, name, blur=0):
    img = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))
    if blur:
        img = img.filter(ImageFilter.GaussianBlur(blur))
    img.save(os.path.join(OUT, name), 'WEBP', quality=80, method=6)
    print('wrote', name, os.path.getsize(os.path.join(OUT, name)) // 1024, 'KB')


y = np.linspace(0, 1, H, dtype=np.float32)[:, None] * np.ones((1, W), np.float32)
x = np.linspace(0, 1, W, dtype=np.float32)[None, :] * np.ones((H, 1), np.float32)

# ---------------------------------------------------------------- Sky with clouds
top = np.array([22, 104, 224], np.float32)
bottom = np.array([116, 178, 248], np.float32)
sky = lerp(top, bottom, y ** 0.9)
n = fbm(W, H, octaves=7, base=4, seed=3)
# More cloud at the sides and the bottom, an open space in the middle for the cards
edge = np.clip(np.abs(x - 0.5) * 2.2, 0, 1) ** 1.3
mask = np.clip((n - 0.47 + 0.30 * edge + 0.22 * y ** 2) * 3.2, 0, 1) ** 1.5
shade = fbm(W, H, octaves=5, base=6, seed=11)
cloud = lerp(np.array([196, 220, 250], np.float32), np.array([255, 255, 255], np.float32), np.clip(shade * 1.3 - 0.1 + (1 - y) * 0.15, 0, 1))
sky = sky * (1 - mask[..., None] * 0.92) + cloud * mask[..., None] * 0.92
save(sky, 'sky.webp', blur=2)

# ---------------------------------------------------------------- Grass hills under a pale sky
sky2 = lerp(np.array([118, 160, 210], np.float32), np.array([205, 222, 236], np.float32), np.clip(y / 0.55, 0, 1) ** 0.8)
img = sky2.copy()
haze = fbm(W, H, octaves=5, base=3, seed=21)
img += (haze[..., None] - 0.5) * 18
t = x * np.pi * 2
hills = [  # (base height, waves (amplitude, frequency, phase), lit colour, shadow colour)
    (0.52, [(0.035, 1.1, 0.3), (0.018, 2.7, 1.7)], (176, 192, 132), (140, 162, 104)),
    (0.61, [(0.05, 0.8, 2.1), (0.022, 2.2, 0.4)], (160, 186, 92), (104, 136, 58)),
    (0.72, [(0.065, 0.6, 4.0), (0.028, 1.9, 2.6)], (150, 182, 74), (82, 118, 40)),
    (0.87, [(0.075, 0.5, 1.2), (0.03, 1.6, 5.1)], (144, 178, 66), (62, 98, 30)),
]
for i, (base, waves, light, dark) in enumerate(hills):
    ridge = base + sum(a * np.sin(t * f + p) for a, f, p in waves)
    slope = sum(a * f * np.cos(t * f + p) for a, f, p in waves)  # ridge rising to the right: lit from the left
    depth = np.clip((y - ridge) / (0.16 + 0.05 * i), 0, 1)
    light, dark = np.array(light, np.float32), np.array(dark, np.float32)
    sun = np.clip(0.55 - slope * 2.2, 0, 1)
    col = lerp(light, dark, np.clip(depth ** 0.6 * (1.15 - 0.5 * sun), 0, 1))
    fine = fbm(W, H, octaves=6, base=120 + 60 * i, persistence=0.55, seed=31 + i)
    streak = fbm(W, H, octaves=4, base=8, persistence=0.5, seed=41 + i)
    tex = (fine - 0.5) * (10 + 14 * i) + (streak - 0.5) * 18
    col = col + tex[..., None] * np.array([0.9, 1.0, 0.5], np.float32)
    soft = np.clip((y - ridge) * H / 2.5, 0, 1)
    fog = (1 - i / len(hills)) * 0.22  # far hills fade into the sky
    col = col * (1 - fog) + np.array([200, 216, 228], np.float32) * fog
    img = img * (1 - soft[..., None]) + col * soft[..., None]
save(img, 'hills.webp', blur=0.5)


# ---------------------------------------------------------------- Night versions (dark mode): true dark, stars
def stars(w, h, count, seed, max_y=1.0):
    r = np.random.default_rng(seed)
    layer = np.zeros((h, w), np.float32)
    xs = r.integers(0, w, count)
    ys = (r.random(count) ** 1.4 * max_y * h).astype(int).clip(0, h - 1)
    b = r.random(count) ** 3  # mostly faint, a few bright
    for sx, sy, sb in zip(xs, ys, b):
        layer[sy, sx] = max(layer[sy, sx], 0.35 + 0.65 * sb)
        if sb > 0.75:  # bright stars get a small cross glow
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                if 0 <= sy + dy < h and 0 <= sx + dx < w:
                    layer[sy + dy, sx + dx] = max(layer[sy + dy, sx + dx], 0.45 * sb)
    glow = np.asarray(Image.fromarray((layer * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2)), np.float32) / 255
    return np.clip(layer + glow * 1.6, 0, 1)


# Night sky: black at the top, deep blue near the horizon, faint dark clouds, stars
night = lerp(np.array([0, 0, 0], np.float32), np.array([8, 16, 40], np.float32), y ** 1.6)
night = night * (1 - mask[..., None] * 0.55) + lerp(np.array([10, 14, 26], np.float32), np.array([30, 40, 66], np.float32), shade) * mask[..., None] * 0.55
st = np.clip(stars(W, H, 3600, 5) * 1.25, 0, 1) * (1 - mask * 0.6)
night = night + st[..., None] * np.array([235, 240, 255], np.float32)
save(night, 'sky-night.webp')

# Night hills: moonlit ridges under a starry black sky
img = lerp(np.array([0, 0, 0], np.float32), np.array([12, 22, 44], np.float32), np.clip(y / 0.6, 0, 1) ** 1.3)
img = img + stars(W, H, 2200, 9, max_y=0.62)[..., None] * np.array([230, 236, 255], np.float32)
moon = np.exp(-(((x - 0.78) * W / H) ** 2 + (y - 0.18) ** 2) / 0.0009)
moon_glow = np.exp(-(((x - 0.78) * W / H) ** 2 + (y - 0.18) ** 2) / 0.02) * 0.25
img = img + (np.clip(moon * 1.4, 0, 1) + moon_glow)[..., None] * np.array([240, 240, 228], np.float32)
night_hills = [
    (0.52, (34, 52, 62), (20, 32, 40)),
    (0.61, (28, 48, 46), (14, 26, 26)),
    (0.72, (24, 44, 34), (10, 22, 16)),
    (0.87, (22, 40, 28), (6, 16, 10)),
]
for i, ((base, waves, _, _), (_, light, dark)) in enumerate(zip(hills, night_hills)):
    ridge = base + sum(a * np.sin(t * f + p) for a, f, p in waves)
    slope = sum(a * f * np.cos(t * f + p) for a, f, p in waves)
    depth = np.clip((y - ridge) / (0.16 + 0.05 * i), 0, 1)
    moonlit = np.clip(0.5 + slope * 2.0, 0, 1)  # moon on the right: slopes facing right catch light
    col = lerp(np.array(light, np.float32), np.array(dark, np.float32), np.clip(depth ** 0.6 * (1.15 - 0.5 * moonlit), 0, 1))
    fine = fbm(W, H, octaves=6, base=120 + 60 * i, persistence=0.55, seed=31 + i)
    col = col + ((fine - 0.5) * (4 + 6 * i))[..., None]
    rim = np.clip(1 - (y - ridge) * H / 6, 0, 1) * (y > ridge) * moonlit * 26  # thin moonlit rim on each ridge
    col = col + rim[..., None] * np.array([0.7, 0.85, 1.0], np.float32)
    soft = np.clip((y - ridge) * H / 2.5, 0, 1)
    img = img * (1 - soft[..., None]) + col * soft[..., None]
save(img, 'hills-night.webp', blur=0.4)
