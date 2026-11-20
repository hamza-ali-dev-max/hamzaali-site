"""Cut out the IBRAQ Dose bottle from its official 1000x1000 shot with a mask drawn from the
bottle's measured outline (cap, neck, body), so the soft studio shadow is left behind.
args: src out"""
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

src, out = sys.argv[1], sys.argv[2]
pil = Image.open(src).convert("RGBA")
bg = Image.new("RGBA", pil.size, (255, 255, 255, 255)); bg.alpha_composite(pil)
S = 4
m = Image.new("L", (pil.width * S, pil.height * S), 0)
d = ImageDraw.Draw(m)
for box, r in [((391, 80, 617, 222), 7), ((458, 216, 551, 248), 2), ((390, 243, 619, 893), 15)]:
    d.rounded_rectangle([v * S for v in box], radius=r * S, fill=255)
m = m.resize(pil.size, Image.LANCZOS).filter(ImageFilter.GaussianBlur(0.6))
o = bg.copy(); o.putalpha(m)
o = o.crop(o.getbbox()); o.save(out); print(out, o.size)
