"""Join section screenshots into contact sheets for review.
Usage: python3 tests/sheet.py <prefix e.g. light-1280> <scale> <columns>
"""
import glob
import sys

from PIL import Image

prefix, scale, cols = sys.argv[1], float(sys.argv[2]), int(sys.argv[3])
files = sorted(glob.glob(f'tests/artifacts/{prefix}-*.png'))
images = []
for f in files:
    im = Image.open(f).convert('RGB')
    images.append(im.resize((max(1, int(im.width * scale)), max(1, int(im.height * scale))), Image.LANCZOS))
# pack sections top to bottom into columns of similar height
total = sum(im.height for im in images)
target = total / cols
columns, current, height = [], [], 0
for im in images:
    if current and height + im.height / 2 > target and len(columns) < cols - 1:
        columns.append(current)
        current, height = [], 0
    current.append(im)
    height += im.height
columns.append(current)
width = images[0].width
sheet_h = max(sum(im.height for im in col) for col in columns)
for index, col in enumerate(columns):
    sheet = Image.new('RGB', (width, sum(im.height for im in col)), '#ff00ff')
    y = 0
    for im in col:
        sheet.paste(im, (0, y))
        y += im.height
    out = f'tests/artifacts/sheet-{prefix}-{index + 1}.png'
    sheet.save(out)
    print(out, sheet.size)
