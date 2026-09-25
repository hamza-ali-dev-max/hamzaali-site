"""Checkpoint 1: build the working map copies from the source images.

Source -> working copy (identified visually, see README.md):
  src_01_16_12_PM.png -> base_night.png        (cleaned)
  src_01_16_27_PM.png -> aurora_impact.png     (same cleanup, so the 0:04 crossfade stays seamless)
  src_01_16_32_PM.png -> blackout.png          (same cleanup; this one has no star)
  src_01_16_16_PM.png -> aurora_thumbnail.png  (untouched, not used in scene 1)

Cleanup:
  1. The stray star in the southern Indian Ocean (~x1027, y791), plus its glow.
  2. The white arc in the Arctic above Russia (~x965-1037, y56-97). Note: this is the
     position and shape of Novaya Zemlya (a real island); removed as requested.

Fill method: low frequencies come from inpainting the surrounding *ocean only*
(all land in the neighbourhood is masked while inpainting), high-frequency texture
comes from a clean donor (the same spot in blackout.png for the star, open ocean
40 px higher up for the island). Everything outside the feathered masks is
bit-identical to the source.
"""
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
MAPS = ROOT / "assets" / "maps"
SRC = MAPS / "originals"
REVIEW = ROOT / "review"

SOURCES = {
    "base_night": "src_01_16_12_PM.png",
    "aurora_impact": "src_01_16_27_PM.png",
    "blackout": "src_01_16_32_PM.png",
    "aurora_thumbnail": "src_01_16_16_PM.png",
}

# Region-of-interest polygons (full-res pixel coords of the 1672x941 maps).
# The island polygon hugs the crescent and stays west of x=991 near its south tip,
# where the mainland coast (Vaygach / Yugorsky) starts at x~993.
ISLAND_POLY = np.array([
    (1040, 52), (1040, 62), (1012, 67), (997, 70), (990, 75), (986, 81), (987, 87),
    (991, 91), (991, 96), (985, 98), (975, 96), (964, 93), (960, 87), (961, 81),
    (966, 73), (974, 66), (984, 61), (1000, 57), (1020, 52),
], np.int32)
ISLAND_NEIGHBOURHOOD = (930, 35, 1075, 125)       # x0, y0, x1, y1 used for ocean-only inpainting
STAR_BOX = (1012, 779, 1044, 803)                 # excludes the tiny dot at (1049, 808)
ISLAND_DONOR_OFFSET = (0, -40)                    # (dx, dy): texture from 40 px further north


def load(name):
    return np.asarray(Image.open(SRC / name).convert("RGB"))


def luminance(img):
    return 0.299 * img[..., 0] + 0.587 * img[..., 1] + 0.114 * img[..., 2]


def polygon_mask(shape, poly):
    m = np.zeros(shape[:2], np.uint8)
    cv2.fillPoly(m, [poly], 1)
    return m.astype(bool)


def bright_mask(img, roi, margin):
    """Pixels noticeably brighter than the local ocean inside the ROI."""
    lum = luminance(img.astype(np.float32))
    ocean_level = np.median(lum[roi & (lum < 35)])
    return roi & (lum > ocean_level + margin)


def island_mask(images):
    roi = polygon_mask(images[0].shape, ISLAND_POLY)
    m = np.zeros(roi.shape, bool)
    for img in images:                     # union -> identical footprint in every map
        m |= bright_mask(img, roi, margin=12)
    m = cv2.morphologyEx(m.astype(np.uint8), cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
    m = cv2.dilate(m, np.ones((5, 5), np.uint8))          # +2 px for the rim glow

    # The island also casts a dark drop-shadow (3-5 px) onto the ocean, mostly on its
    # inner, concave side. Take pixels darker than the open ocean within 6 px of the island.
    lum = luminance(images[0].astype(np.float32))          # base_night: no aurora tint
    ocean_level = np.median(lum[roi & ~m.astype(bool) & (lum < 35)])
    near = cv2.dilate(m, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (13, 13))).astype(bool)
    shadow = near & (lum < ocean_level - 3)

    # Never touch the mainland / other islands: everything bright outside the island ROI, +3 px.
    x0, y0, x1, y1 = ISLAND_NEIGHBOURHOOD
    box = np.zeros(roi.shape, bool)
    box[y0:y1, x0:x1] = True
    other_land = bright_mask(images[0], box & ~roi, margin=12)
    protect = cv2.dilate(other_land.astype(np.uint8), np.ones((7, 7), np.uint8)).astype(bool)

    m = m.astype(bool) | shadow
    m = cv2.morphologyEx(m.astype(np.uint8), cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
    m = cv2.dilate(m, np.ones((3, 3), np.uint8)).astype(bool)
    return m & ~protect


def star_mask(images):
    x0, y0, x1, y1 = STAR_BOX
    roi = np.zeros(images[0].shape[:2], bool)
    roi[y0:y1, x0:x1] = True
    m = np.zeros(roi.shape, bool)
    for img in images:
        m |= bright_mask(img, roi, margin=10)
    m = cv2.dilate(m.astype(np.uint8), np.ones((7, 7), np.uint8))  # +3 px for the glow
    return m.astype(bool)


def land_mask(img, box):
    """All bright (land / coastline) pixels in a neighbourhood, dilated."""
    x0, y0, x1, y1 = box
    roi = np.zeros(img.shape[:2], bool)
    roi[y0:y1, x0:x1] = True
    m = bright_mask(img, roi, margin=12)
    return cv2.dilate(m.astype(np.uint8), np.ones((7, 7), np.uint8)).astype(bool)


def texture_fill(img, mask, donor, inpaint_mask, lp_sigma=3.0, feather=1.2):
    """Low-pass from ocean-only inpainting + high-pass texture from the donor image."""
    f = img.astype(np.float32)
    base = cv2.inpaint(img, (inpaint_mask | mask).astype(np.uint8) * 255, 9, cv2.INPAINT_TELEA)
    base_lp = cv2.GaussianBlur(base.astype(np.float32), (0, 0), lp_sigma)
    d = donor.astype(np.float32)
    detail = d - cv2.GaussianBlur(d, (0, 0), lp_sigma)
    fill = base_lp + detail
    alpha = cv2.GaussianBlur(mask.astype(np.float32), (0, 0), feather)
    alpha = np.maximum(alpha, mask.astype(np.float32))[..., None]
    out = f * (1 - alpha) + fill * alpha
    out = np.where(alpha > 0.004, out, f)            # guarantee untouched pixels stay identical
    return np.clip(np.round(out), 0, 255).astype(np.uint8)


def shifted(img, dx, dy):
    """donor[y, x] = img[y + dy, x + dx]"""
    return np.roll(img, shift=(-dy, -dx), axis=(0, 1))


def vertical_interp(layer, mask, pad=3):
    """Fill masked runs in each column by linear interpolation between the (pad-px mean)
    values just above and below the run. Aurora curtains are vertical, so this keeps
    the streaks continuous where plain inpainting smears them sideways."""
    out = layer.copy()
    h = mask.shape[0]
    for x in np.nonzero(mask.any(axis=0))[0]:
        col = mask[:, x]
        y = 0
        while y < h:
            if not col[y]:
                y += 1
                continue
            y0 = y
            while y < h and col[y]:
                y += 1
            top = layer[max(0, y0 - pad):y0, x].mean(axis=0) if y0 > 0 else None
            bot = layer[y:min(h, y + pad), x].mean(axis=0) if y < h else None
            top = bot if top is None else top
            bot = top if bot is None else bot
            t = (np.arange(y - y0) + 1.0) / (y - y0 + 1.0)
            out[y0:y, x] = top[None, :] * (1 - t[:, None]) + bot[None, :] * t[:, None]
    return out


def aurora_fill(aurora_src, base_src, base_clean, mask, feather=1.2):
    """aurora = base + aurora layer. Rebuild the masked area as cleaned base + the aurora
    layer interpolated vertically across the mask (slightly smoothed across columns)."""
    layer = aurora_src.astype(np.float32) - base_src.astype(np.float32)
    layer = cv2.GaussianBlur(layer, (0, 0), sigmaX=1.5, sigmaY=0.1)
    fill = base_clean.astype(np.float32) + vertical_interp(layer, mask)
    f = aurora_src.astype(np.float32)
    alpha = cv2.GaussianBlur(mask.astype(np.float32), (0, 0), feather)
    alpha = np.maximum(alpha, mask.astype(np.float32))[..., None]
    out = f * (1 - alpha) + fill * alpha
    out = np.where(alpha > 0.004, out, f)
    return np.clip(np.round(out), 0, 255).astype(np.uint8)


def main():
    src = {k: load(v) for k, v in SOURCES.items()}
    work = {k: src[k] for k in ("base_night", "aurora_impact", "blackout")}

    m_island = island_mask(list(work.values()))
    m_star = star_mask([work["base_night"], work["aurora_impact"]])

    # Donor area must be open ocean. Geography is identical in all maps, so check the
    # aurora-free base map (in aurora_impact the donor also carries the vertical aurora
    # streaks, which is exactly the texture we want there).
    dx, dy = ISLAND_DONOR_OFFSET
    lum = luminance(shifted(work["base_night"], dx, dy).astype(np.float32))[m_island]
    assert lum.max() < 60, f"island donor not clean: max lum {lum.max():.0f}"

    out = {}
    for k in ("base_night", "blackout"):
        img = work[k]
        land = land_mask(img, ISLAND_NEIGHBOURHOOD)
        out[k] = texture_fill(img, m_island, shifted(img, dx, dy), land)
    # aurora_impact: same footprint, but rebuilt as cleaned base + vertically continuous aurora
    out["aurora_impact"] = aurora_fill(work["aurora_impact"], work["base_night"], out["base_night"], m_island)
    for k in ("base_night", "aurora_impact"):          # blackout.png has no star
        out[k] = texture_fill(out[k], m_star, src["blackout"], np.zeros_like(m_star))

    for k, img in out.items():
        Image.fromarray(img).save(MAPS / f"{k}.png", optimize=True)
    Image.fromarray(src["aurora_thumbnail"]).save(MAPS / "aurora_thumbnail.png", optimize=True)

    # Report exactly what changed.
    for k in out:
        changed = np.any(out[k] != src[k], axis=2)
        ys, xs = np.nonzero(changed)
        boxes = []
        for region in (m_island, m_star):
            sel = region[ys, xs] if len(ys) else np.array([], bool)
            if sel.any():
                boxes.append((int(xs[sel].min()), int(ys[sel].min()), int(xs[sel].max()), int(ys[sel].max())))
        outside = changed & ~cv2.dilate((m_island | m_star).astype(np.uint8), np.ones((9, 9), np.uint8)).astype(bool)
        print(f"{k}.png: {changed.sum()} px changed ({100 * changed.mean():.3f}% of image), "
              f"boxes {boxes}, changed outside masks: {outside.sum()}")

    make_review(src, out)


def make_review(src, out):
    """Labelled before/after crops at 4x for the checkpoint."""
    from PIL import ImageDraw, ImageFont
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 15)
    except OSError:
        font = ImageFont.load_default()
    boxes = {"Arctic arc (Novaya Zemlya)": (950, 45, 1050, 105), "Ocean star": (1005, 775, 1055, 812)}
    rows, head = [], 24
    for k in ("base_night", "aurora_impact", "blackout"):
        tiles = []
        for label, (x0, y0, x1, y1) in boxes.items():
            for tag, img in (("BEFORE", src[k]), ("AFTER", out[k])):
                c = Image.fromarray(img[y0:y1, x0:x1]).resize(((x1 - x0) * 4, (y1 - y0) * 4), Image.LANCZOS)
                t = Image.new("RGB", (c.width, c.height + head), (35, 35, 35))
                t.paste(c, (0, head))
                ImageDraw.Draw(t).text((6, 4), f"{k}.png | {label} | {tag}", fill=(255, 210, 90), font=font)
                tiles.append(t)
        rows.append(tiles)
    w = sum(t.width for t in rows[0]) + 30
    h = sum(r[0].height for r in rows) + 12 * len(rows)
    sheet = Image.new("RGB", (w, h), (20, 20, 20))
    y = 0
    for tiles in rows:
        x = 0
        for i, t in enumerate(tiles):
            sheet.paste(t, (x, y))
            x += t.width + (10 if i % 2 == 1 else 2)
        y += tiles[0].height + 12
    sheet.save(REVIEW / "cp1_cleanup_before_after.png")


if __name__ == "__main__":
    main()
