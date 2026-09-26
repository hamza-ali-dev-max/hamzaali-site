"""Stand-in city for testing the Blender pipeline before Overpass is reachable.
Same JSON shape as osm_fetch.py (Overpass 'out geom'), built from real water (GSHHG full
resolution) and a procedural Montreal-like city: street grid rotated ~35 deg from true
north, towers downtown, low-rise elsewhere, Mount Royal as an unlit park, 4 hospitals.
Output: build/osm/synthetic.json  (NOT real OSM data - timing/pipeline tests only)"""
import json
import math

import numpy as np
from shapely.geometry import LineString, Polygon, box, mapping
from shapely.ops import unary_union
from shapely import affinity

from geo import MONTREAL, ROOT, boundaries
from osm_fetch import BBOX, KX, KY

OUT = ROOT / "build" / "osm" / "synthetic.json"
LAT0, LON0 = MONTREAL
rng = np.random.default_rng(42)
DOWNTOWN = (0.0, 150.0)            # metres from the origin (roughly Ville-Marie core)
MOUNT_ROYAL = (-1500.0, 600.0)


def to_m(lon, lat):
    return (lon - LON0) * KX * 1000.0, (lat - LAT0) * KY * 1000.0


def to_ll(x, y):
    return LON0 + x / (KX * 1000.0), LAT0 + y / (KY * 1000.0)


def ring_geom(coords):
    return [{"lat": to_ll(x, y)[1], "lon": to_ll(x, y)[0]} for x, y in coords]


def water_polygon():
    s, w, n, e = BBOX
    frame = box(*to_m(w, s), *to_m(e, n))
    water = []
    for typ, arr in boundaries("gshhs", "f", bbox=(w - 0.2, s - 0.2, e + 0.2, n + 0.2)):
        x, y = to_m(arr[:, 0], arr[:, 1])
        poly = Polygon(np.stack([x, y], 1)).buffer(0)
        if typ in (2, 4):
            water.append(("add", poly))
        else:
            water.append(("sub", poly))
    wet = unary_union([p for k, p in water if k == "add"])
    dry = unary_union([p for k, p in water if k == "sub"])
    return wet.difference(dry).intersection(frame), frame


def main():
    water, frame = water_polygon()
    land = frame.difference(water)
    park = Polygon([(MOUNT_ROYAL[0] + 1100 * math.cos(a) * (1 + 0.15 * math.sin(3 * a)),
                     MOUNT_ROYAL[1] + 800 * math.sin(a)) for a in np.linspace(0, 2 * math.pi, 48)])
    els = []

    # water as a multipolygon relation (outer + inner rings)
    geoms = getattr(water, "geoms", [water])
    for gi, g in enumerate(geoms):
        members = [{"type": "way", "role": "outer", "geometry": ring_geom(g.exterior.coords)}]
        members += [{"type": "way", "role": "inner", "geometry": ring_geom(r.coords)} for r in g.interiors]
        els.append({"type": "relation", "id": 1_000_000 + gi, "tags": {"natural": "water"}, "members": members})
    els.append({"type": "way", "id": 900001, "tags": {"leisure": "park", "name": "Mount Royal (stand-in)"},
                "geometry": ring_geom(park.exterior.coords)})

    # street grid rotated 35 deg (Montreal's "north" is ~55 deg west of true north)
    ang = math.radians(35)
    half = 9000
    streets, wid = [], 0
    for kind, spacing, hw in (("avenue", 420, "primary"), ("street", 95, "residential"), ("cross", 210, "secondary")):
        axis = 0 if kind != "cross" else 1
        for off in np.arange(-half, half, spacing):
            if axis == 0:
                line = LineString([(off, -half), (off, half)])
            else:
                line = LineString([(-half, off), (half, off)])
            line = affinity.rotate(line, 35, origin=(0, 0))
            clipped = line.intersection(land.difference(park))
            for seg in getattr(clipped, "geoms", [clipped]):
                if seg.is_empty or seg.length < 60 or seg.geom_type != "LineString":
                    continue
                streets.append((hw, seg))
    for hw, seg in streets:
        wid += 1
        els.append({"type": "way", "id": wid, "tags": {"highway": hw}, "geometry": ring_geom(seg.coords)})

    # buildings: fill blocks along the grid
    nb = 0
    rot = lambda p: affinity.rotate(p, 35, origin=(0, 0))
    for bx in np.arange(-half, half, 95):
        for by in np.arange(-half, half, 210):
            cx, cy = bx + 47.5, by + 105
            px, py = cx * math.cos(ang) - cy * math.sin(ang), cx * math.sin(ang) + cy * math.cos(ang)
            if not frame.contains(Polygon([(px - 1, py - 1), (px + 1, py - 1), (px + 1, py + 1)])):
                continue
            d_core = math.hypot(px - DOWNTOWN[0], py - DOWNTOWN[1])
            tower = d_core < 1300
            n = 2 if tower else int(rng.integers(5, 10))
            for k in range(n):
                if tower:
                    w_, h_ = rng.uniform(30, 60), rng.uniform(35, 80)
                    ox, oy = rng.uniform(-18, 18), (k - 0.5) * 95
                    height = float(np.clip(rng.lognormal(math.log(60), 0.6), 20, 230) * (1.2 - d_core / 1300 * 0.6))
                else:
                    w_, h_ = rng.uniform(9, 16), rng.uniform(12, 22)
                    ox, oy = rng.uniform(-25, 25), -90 + k * 190 / n
                    height = float(rng.choice([7, 9, 10, 12, 14]) * (1.6 if d_core < 3000 else 1.0))
                b = box(cx + ox - w_ / 2, cy + oy - h_ / 2, cx + ox + w_ / 2, cy + oy + h_ / 2)
                b = rot(b)
                if not land.contains(b) or park.intersects(b):
                    continue
                nb += 1
                els.append({"type": "way", "id": 2_000_000 + nb,
                            "tags": {"building": "yes", "height": f"{height:.1f}"},
                            "geometry": ring_geom(b.exterior.coords)})
    # hospitals: four big lit blocks
    for i, (hx, hy) in enumerate(((600, 1500), (-2600, -400), (2400, 2600), (-900, -2300))):
        b = rot(box(hx - 70, hy - 50, hx + 70, hy + 50))
        els.append({"type": "way", "id": 3_000_000 + i,
                    "tags": {"building": "hospital", "amenity": "hospital", "height": "38"},
                    "geometry": ring_geom(b.exterior.coords)})
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({"elements": els, "note": "synthetic stand-in, not OSM data"}))
    print(OUT, "buildings:", nb, "streets:", len(streets))


if __name__ == "__main__":
    main()
