"""Blender 3D Montreal for scene 1 (0:19.5-0:50 on the scene clock), used as a TOP VIEW only
(owner's call: Blender = the view from above, Seedance = street level): the camera continues
the 2D zoom straight down onto the real OSM city at night, north up (the map grid and labels
stay valid), and the city dies district by district, hospitals coming back on generators.

  python3 blender_city.py build [--osm montreal|synthetic]  -> build/blender/montreal_city.blend
  python3 blender_city.py render 30.5 33.5 [--scale 100] [--samples 16] [--out DIR]
  python3 blender_city.py cams                               -> build/blender/cams.json

Space: metres, x east, y north, origin = Montreal (45.5017 N, 73.5673 W), the same local
projection as regional.py (its km/deg), so the ground planes carry the R3/R4 map layers
pixel-exactly and the 2D zoom hands over without a jump. Blender frame f = scene time f/30 s.
All animation (clock, district power, fades) lives in one node group, "SceneClock".
Cycles CPU, lit almost only by emission (streets, windows, traffic, map textures, aurora sky),
so low samples + OpenImageDenoise converge. The .blend opens in Blender 5.0+.
Data (c) OpenStreetMap contributors (ODbL) - credit it in the video.
"""
import argparse
import json
import math
import sys
import time
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

import timeline as T
from geo import MONTREAL, ROOT, boundaries
from mapcam import log_fade, ease
from shots import descent_V

REG = ROOT / "build" / "regional"
OSM = ROOT / "build" / "osm"
OUT = ROOT / "build" / "blender"
TEX = OUT / "tex"
BLEND = OUT / "montreal_city.blend"
META = json.loads((REG / "meta.json").read_text())
KX, KY = META["km_per_deg_lon"] * 1000.0, META["km_per_deg_lat"] * 1000.0   # m per degree
LAT0, LON0 = MONTREAL
FPS = T.FPS
F0, F1 = int(round(T.HANDOFF[0] * FPS)), int(round(T.RADIO[1] * FPS))        # frames 585..1500

# city box (the OSM fetch box), metres
from osm_fetch import BBOX                                                    # noqa: E402
BX0, BX1 = (BBOX[1] - LON0) * KX, (BBOX[3] - LON0) * KX
BY0, BY1 = (BBOX[0] - LAT0) * KY, (BBOX[2] - LAT0) * KY
CITY_PX_M = 4.0                                                               # city ground texture m/px

# palette (linear RGB)
def srgb(c):
    c = np.asarray(c, float) / 255.0
    return tuple(np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4))


GOLD = srgb((255, 196, 112))
WARM = srgb((255, 184, 120))
COOL = srgb((200, 222, 255))
HOSP = srgb((225, 240, 255))
LAND_NIGHT = (19, 22, 26)           # sRGB 0-255, darker than the map land: it is lit by the streets
PARK_NIGHT = (12, 17, 16)
WATER_NIGHT = (2, 9, 17)

# camera: a top view throughout (owner's call: Blender = the view from above, Seedance =
# street level). It continues the 2D log zoom straight down, north up, so the map grid and
# labels stay valid, then keeps easing in over downtown while the city goes dark.
HFOV0 = HFOV1 = 40.0                # horizontal field of view (deg)
TILT_START, TILT_END = 21.3, 31.0   # (name kept: the ease from the zoom into the hold)
TARGET1 = np.array([-500.0, 250.0])  # downtown + Mount Royal in frame
V_HOLD = 6.2                         # km across at 0:31
DIST1 = V_HOLD * 1000.0 / (2 * math.tan(math.radians(HFOV0) / 2))
PITCH1 = 0.0
HEADING1 = 0.0
DRIFT = dict(dist=0.86, heading=0.0, pitch=0.0)   # slow push-in over 31..50 s


# ---------------------------------------------------------------- geometry helpers

def ll_to_m(lon, lat):
    return (np.asarray(lon) - LON0) * KX, (np.asarray(lat) - LAT0) * KY


def vnoise(x, y, cell, seed):
    gx, gy = np.asarray(x, float) / cell, np.asarray(y, float) / cell
    i, j = np.floor(gx), np.floor(gy)
    fx, fy = gx - i, gy - j

    def h(a, b):
        v = np.sin(a * 127.1 + b * 311.7 + seed * 74.7) * 43758.5453
        return (v - np.floor(v)) * 2 - 1
    sx, sy = fx * fx * (3 - 2 * fx), fy * fy * (3 - 2 * fy)
    a = h(i, j) + (h(i + 1, j) - h(i, j)) * sx
    b = h(i, j + 1) + (h(i + 1, j + 1) - h(i, j + 1)) * sx
    return a + (b - a) * sy


WAVE_DIR = np.array([math.sin(math.radians(150)), math.cos(math.radians(150))])  # travels SSE


def _wave_raw(x, y):
    s = np.asarray(x) * WAVE_DIR[0] + np.asarray(y) * WAVE_DIR[1]
    return s / 1000.0 + 1.6 * vnoise(x, y, 2600, 11) + 0.6 * vnoise(x, y, 900, 12)


def _wave_norm():
    xs, ys = np.meshgrid(np.linspace(BX0, BX1, 200), np.linspace(BY0, BY1, 170))
    r = _wave_raw(xs, ys)
    return np.percentile(r, 1.5), np.percentile(r, 98.5)


WAVE_LO, WAVE_HI = _wave_norm()


def wave_p(x, y):
    """Blackout order 0..1 (0 = first to go: the north, where the lines come in)."""
    return np.clip((_wave_raw(x, y) - WAVE_LO) / (WAVE_HI - WAVE_LO), 0, 1)


def district_of(x, y):
    return np.minimum(T.N_DISTRICTS - 1, (wave_p(x, y) * T.N_DISTRICTS).astype(int))


SCHED = T.blackout_schedule()
DEATH = np.array([d["death_s"] for d in SCHED])
HOSP_DELAY = np.random.default_rng(8).uniform(1.2, 2.6, T.N_DISTRICTS)   # generator start


def hosp_level(t, k):
    d = SCHED[k]
    if t < d["death_s"]:
        return T.light_level(t, d)
    u = t - d["death_s"] - HOSP_DELAY[k]
    if u < 0:
        return 0.0
    if u < 0.25:                                   # generator catches: two stutters, then on
        return 0.85 * (0.35 if int(u / 0.06) % 2 else 1.0)
    return 0.85


# ---------------------------------------------------------------- OSM parsing

def ring_m(geom):
    lon = np.array([g["lon"] for g in geom])
    lat = np.array([g["lat"] for g in geom])
    x, y = ll_to_m(lon, lat)
    return np.stack([x, y], 1)


def join_rings(parts):
    """Join way pieces (Nx2 arrays) into closed rings by matching endpoints."""
    parts = [p for p in parts if len(p) >= 2]
    rings = []
    while parts:
        cur = parts.pop(0)
        changed = True
        while changed and np.linalg.norm(cur[0] - cur[-1]) > 0.5:
            changed = False
            for i, p in enumerate(parts):
                if np.linalg.norm(cur[-1] - p[0]) < 0.5:
                    cur = np.vstack([cur, p[1:]])
                elif np.linalg.norm(cur[-1] - p[-1]) < 0.5:
                    cur = np.vstack([cur, p[::-1][1:]])
                elif np.linalg.norm(cur[0] - p[-1]) < 0.5:
                    cur = np.vstack([p, cur[1:]])
                elif np.linalg.norm(cur[0] - p[0]) < 0.5:
                    cur = np.vstack([p[::-1], cur[1:]])
                else:
                    continue
                parts.pop(i)
                changed = True
                break
        if len(cur) >= 4 and np.linalg.norm(cur[0] - cur[-1]) <= 0.5:
            rings.append(cur)
    return rings


def area_rings(el):
    """(outer rings, inner rings) of a closed way or multipolygon relation."""
    if el["type"] == "way":
        g = el.get("geometry") or []
        if len(g) >= 4 and g[0]["lat"] == g[-1]["lat"] and g[0]["lon"] == g[-1]["lon"]:
            return [ring_m(g)], []
        return [], []
    if el["type"] == "relation":
        outer = [ring_m(m["geometry"]) for m in el.get("members", []) if m.get("role", "outer") in ("outer", "") and m.get("geometry")]
        inner = [ring_m(m["geometry"]) for m in el.get("members", []) if m.get("role") == "inner" and m.get("geometry")]
        return join_rings(outer), join_rings(inner)
    return [], []


def parse_len(v):
    if v is None:
        return None
    try:
        v = str(v).split(";")[0].strip().lower().replace("m", "").replace(",", ".").strip()
        return float(v)
    except ValueError:
        return None


HOUSE = {"house", "detached", "semidetached_house", "terrace", "garage", "garages", "shed", "hut", "cabin", "bungalow"}


def building_height(tags, area, x, y, rng):
    h = parse_len(tags.get("height"))
    if h is None:
        lv = parse_len(tags.get("building:levels"))
        if lv is not None:
            h = lv * 3.3 + 1.2
    if h is None:
        b = tags.get("building", "yes")
        d_core = math.hypot(x - (-150.0), y - 250.0)                 # distance to the downtown core
        if b in HOUSE:
            h = rng.uniform(6, 9)
        elif b in ("church", "cathedral"):
            h = rng.uniform(16, 26)
        elif b in ("industrial", "warehouse", "retail", "supermarket"):
            h = rng.uniform(7, 12)
        elif area < 120:
            h = rng.uniform(6, 9)
        elif area < 450:
            h = rng.uniform(9, 12.5)                                   # Montreal plexes: 3 floors
        elif area < 2500:
            h = rng.uniform(11, 20)
        else:
            h = rng.uniform(12, 26)
        if d_core < 1400 and area > 300:                               # untagged downtown blocks
            h *= rng.uniform(1.4, 2.6)
    return float(np.clip(h, 3.0, 260.0))


ROAD = {  # class: (width m, streetlight luminance, traffic lanes?)
    "motorway": (24, 1.25, True), "trunk": (20, 1.2, True), "primary": (16, 1.15, True),
    "secondary": (13, 1.0, True), "tertiary": (11, 0.9, True), "unclassified": (8, 0.7, False),
    "residential": (8, 0.7, False), "living_street": (6, 0.55, False), "service": (5, 0.4, False),
    "motorway_link": (9, 1.0, True), "trunk_link": (9, 1.0, True), "primary_link": (9, 0.95, True),
    "secondary_link": (8, 0.9, True), "tertiary_link": (8, 0.85, True),
}
SPEED = {"motorway": 26.0, "trunk": 20.0, "motorway_link": 15.0, "trunk_link": 14.0}


def load_osm(name):
    from shapely.geometry import Point, Polygon
    from shapely.strtree import STRtree
    els = json.loads((OSM / f"{name}.json").read_text())["elements"]
    rng = np.random.default_rng(3)
    buildings, roads, hosp_areas, hosp_pts, parks, waters = [], [], [], [], [], []
    for el in els:
        tags = el.get("tags", {})
        if tags.get("amenity") == "hospital":
            if el["type"] == "node":
                hosp_pts.append(ll_to_m(el["lon"], el["lat"]))
            else:
                o, _ = area_rings(el)
                hosp_areas += o
        if "building" in tags and tags["building"] not in ("no", "roof", "construction", "ruins"):
            outer, _ = area_rings(el)
            for r in outer:
                buildings.append((r, tags))
        elif "highway" in tags and el["type"] == "way" and tags["highway"] in ROAD:
            g = el.get("geometry") or []
            if len(g) >= 2:
                roads.append((ring_m(g), tags))
        if tags.get("leisure") == "park":
            parks += area_rings(el)[0]
        if tags.get("natural") == "water" or tags.get("waterway") == "riverbank":
            o, i = area_rings(el)
            waters.append((o, i))

    hp = [Polygon(r).buffer(0) for r in hosp_areas if len(r) >= 4]
    tree = STRtree(hp) if hp else None
    out_b = []
    for r, tags in buildings:
        if len(r) < 4:
            continue
        r = r[:-1] if np.linalg.norm(r[0] - r[-1]) < 0.01 else r
        if len(r) < 3:
            continue
        a2 = np.sum(r[:, 0] * np.roll(r[:, 1], -1) - np.roll(r[:, 0], -1) * r[:, 1])
        if abs(a2) < 2 * 12.0:                                         # < 12 m2: sheds, noise
            continue
        if a2 < 0:
            r = r[::-1]                                                # counter-clockwise
        c = r.mean(0)
        if not (BX0 - 50 < c[0] < BX1 + 50 and BY0 - 50 < c[1] < BY1 + 50):
            continue
        is_h = tags.get("amenity") == "hospital" or tags.get("building") == "hospital"
        if not is_h and tree is not None:
            is_h = len(tree.query(Point(*c), predicate="within")) > 0
        if not is_h and hosp_pts:
            is_h = min(math.hypot(c[0] - p[0], c[1] - p[1]) for p in hosp_pts) < 45
        h = building_height(tags, abs(a2) / 2, c[0], c[1], rng)
        if is_h:
            h = max(h, 22.0)
        out_b.append({"ring": r, "h": h, "c": c, "hosp": is_h, "rnd": float(rng.random())})
    print(f"osm {name}: {len(out_b)} buildings ({sum(b['hosp'] for b in out_b)} hospital), "
          f"{len(roads)} roads, {len(parks)} parks, {len(waters)} water areas")
    return out_b, roads, parks, waters


# ---------------------------------------------------------------- textures

def city_px(x, y):
    W_ = int(round((BX1 - BX0) / CITY_PX_M))
    H_ = int(round((BY1 - BY0) / CITY_PX_M))
    return (np.asarray(x) - BX0) / CITY_PX_M, (BY1 - np.asarray(y)) / CITY_PX_M, W_, H_


def water_polys(waters):
    from shapely.geometry import Polygon, box
    from shapely.ops import unary_union
    frame = box(BX0 - 500, BY0 - 500, BX1 + 500, BY1 + 500)
    lon0, lat0 = LON0 + (BX0 - 800) / KX, LAT0 + (BY0 - 800) / KY
    lon1, lat1 = LON0 + (BX1 + 800) / KX, LAT0 + (BY1 + 800) / KY
    lvl = {1: [], 2: [], 3: [], 4: []}                   # GSHHG: land, lake, island in lake, pond
    for typ, arr in boundaries("gshhs", "f", bbox=(lon0, lat0, lon1, lat1)):
        x, y = ll_to_m(arr[:, 0], arr[:, 1])
        lvl[typ].append(Polygon(np.stack([x, y], 1)).buffer(0))
    sea = frame.difference(unary_union(lvl[1])) if lvl[1] else frame
    water = unary_union([sea] + lvl[2]).difference(unary_union(lvl[3])).union(unary_union(lvl[4]))
    extra = []
    for outer, inner in waters:
        for r in outer:
            try:
                p = Polygon(r).buffer(0)
                for i in inner:
                    p = p.difference(Polygon(i).buffer(0))
                extra.append(p)
            except Exception:
                pass
    if extra:
        water = unary_union([water] + extra)
    return water.intersection(frame)


def draw_polys(draw, geom, fill, to_px):
    for g in getattr(geom, "geoms", [geom]):
        if g.is_empty or g.geom_type != "Polygon":
            continue
        ext = to_px(np.asarray(g.exterior.coords))
        draw.polygon([tuple(p) for p in ext], fill=fill)
        for r in g.interiors:
            draw.polygon([tuple(p) for p in to_px(np.asarray(r.coords))], fill=0 if isinstance(fill, int) else LAND_NIGHT)


def bake_city(buildings, roads, parks, waters):
    """City ground: land/park/water colour, water mask, street glow, per-pixel death time."""
    from shapely.geometry import Polygon
    from shapely.ops import unary_union
    _, _, W_, H_ = city_px(0, 0)

    def to_px(a):
        px, py, _, _ = city_px(a[:, 0], a[:, 1])
        return np.stack([px, py], 1)
    water = water_polys(waters)
    col = Image.new("RGB", (W_, H_), LAND_NIGHT)
    d = ImageDraw.Draw(col)
    park = unary_union([Polygon(r).buffer(0) for r in parks if len(r) >= 4]) if parks else None
    if park is not None:
        draw_polys(d, park, PARK_NIGHT, to_px)
    draw_polys(d, water, WATER_NIGHT, to_px)
    # faint texture so the land is not a flat colour at low altitude
    xs, ys = np.meshgrid(np.linspace(BX0, BX1, W_), np.linspace(BY1, BY0, H_))
    n = 1.0 + 0.10 * vnoise(xs, ys, 60, 4) + 0.06 * vnoise(xs, ys, 17, 5)
    col = Image.fromarray(np.clip(np.asarray(col, np.float32) * n[..., None], 0, 255).astype(np.uint8))
    col.save(TEX / "city_ground.png")

    wm = Image.new("L", (W_, H_), 0)
    draw_polys(ImageDraw.Draw(wm), water, 255, to_px)
    wm = wm.filter(ImageFilter.GaussianBlur(1.2))
    wm.save(TEX / "city_water.png")

    # street glow: light spill around lit roads (blurred), strongest where streets are dense
    glow = Image.new("L", (W_, H_), 0)
    gd = ImageDraw.Draw(glow)
    for pts, tags in roads:
        w, lum, _ = ROAD[tags["highway"]]
        gd.line([tuple(p) for p in to_px(pts)], fill=int(90 + 120 * lum), width=max(1, int(w * 1.6 / CITY_PX_M)))
    g1 = np.asarray(glow.filter(ImageFilter.GaussianBlur(6)), np.float32)
    g2 = np.asarray(glow.filter(ImageFilter.GaussianBlur(30)), np.float32)
    g = np.clip(0.5 * g1 + 1.1 * g2, 0, 255)
    g *= 1 - np.asarray(wm, np.float32) / 255 * 0.7
    Image.fromarray(g.astype(np.uint8)).save(TEX / "city_glow.png")

    # death time per pixel (quantised to the districts), 16-bit: value = (t - 30) / 12
    k = district_of(xs, ys)
    dt = (DEATH[k] - 30.0) / 12.0
    Image.fromarray((np.clip(dt, 0, 1) * 65535).astype(np.uint16)).save(TEX / "city_death.png")
    print("city textures", W_, H_)


def bake_layer_death(name, px=(1350, 760)):
    g = META["layers"][name]
    xs = np.linspace(-g["width_km"] / 2, g["width_km"] / 2, px[0]) * 1000
    ys = np.linspace(g["height_km"] / 2, -g["height_km"] / 2, px[1]) * 1000
    X, Y = np.meshgrid(xs, ys)
    dt = (T.BLACKOUT_START + (T.BLACKOUT_END - T.BLACKOUT_START) * wave_p(X, Y) - 30.0) / 12.0
    Image.fromarray((np.clip(dt, 0, 1) * 65535).astype(np.uint16)).save(TEX / f"{name}_death.png")


def bake_feather(px=(540, 304)):
    w, h = px
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    d = np.minimum.reduce([xx, yy, w - 1 - xx, h - 1 - yy]) / (0.06 * w)
    Image.fromarray((np.clip(d, 0, 1) ** 1.5 * 255).astype(np.uint8)).save(TEX / "feather.png")


# ---------------------------------------------------------------- mesh building

def build_mesh(bpy, name, V, loops, starts, uv=None, face_attrs=None, collection=None):
    me = bpy.data.meshes.new(name)
    me.vertices.add(len(V))
    me.vertices.foreach_set("co", np.asarray(V, np.float32).ravel())
    me.loops.add(len(loops))
    me.loops.foreach_set("vertex_index", np.asarray(loops, np.int32))
    me.polygons.add(len(starts))
    me.polygons.foreach_set("loop_start", np.asarray(starts, np.int32))
    me.update(calc_edges=True)
    if uv is not None:
        lay = me.uv_layers.new(name="UVMap")
        lay.data.foreach_set("uv", np.asarray(uv, np.float32).ravel())
    for k, arr in (face_attrs or {}).items():
        a = me.attributes.new(k, "FLOAT", "FACE")
        a.data.foreach_set("value", np.asarray(arr, np.float32))
    ob = bpy.data.objects.new(name, me)
    (collection or bpy.context.scene.collection).objects.link(ob)
    return ob


def buildings_arrays(blist, z0=1.0):
    V, L, S, UV, BID = [], [], [], [], []
    nv = nl = 0
    for b in blist:
        r, h = b["ring"], b["h"]
        n = len(r)
        seg = np.linalg.norm(np.roll(r, -1, 0) - r, axis=1)
        u = np.concatenate([[0], np.cumsum(seg)])
        V.append(np.column_stack([r, np.full(n, z0)]))
        V.append(np.column_stack([r, np.full(n, z0 + h)]))
        i = np.arange(n)
        j = (i + 1) % n
        quads = np.stack([i, j, n + j, n + i], 1) + nv
        L.append(quads.ravel())
        S.append(nl + 4 * i)
        uvq = np.stack([np.stack([u[i], np.zeros(n)], 1), np.stack([u[i + 1], np.zeros(n)], 1),
                        np.stack([u[i + 1], np.full(n, h)], 1), np.stack([u[i], np.full(n, h)], 1)], 1)
        UV.append(uvq.reshape(-1, 2))
        nl += 4 * n
        L.append(n + i + nv)                                          # roof n-gon
        S.append(np.array([nl]))
        UV.append(np.column_stack([np.zeros(n), np.full(n, -1.0)]))
        nl += n
        nv += 2 * n
        BID.append(np.full(n + 1, b["rnd"]))
    if not V:
        return None
    return (np.vstack(V), np.concatenate(L), np.concatenate(S), np.vstack(UV), np.concatenate(BID))


def ribbons(polys, z, width_fn, attr_fns):
    """Flat quads along polylines. UV: u = metres along the line, v = 0 (left) .. 1 (right)."""
    V, UV, attrs = [], [], {k: [] for k in attr_fns}
    for pts, tags in polys:
        d = np.diff(pts, axis=0)
        ln = np.linalg.norm(d, axis=1)
        ok = ln > 0.3
        if not ok.any():
            continue
        p0, p1, d, ln = pts[:-1][ok], pts[1:][ok], d[ok], ln[ok]
        nrm = np.stack([-d[:, 1], d[:, 0]], 1) / ln[:, None]
        hw = width_fn(tags) / 2
        u0 = np.concatenate([[0], np.cumsum(ln)[:-1]])
        u1 = u0 + ln
        q = np.stack([p0 - nrm * hw, p1 - nrm * hw, p1 + nrm * hw, p0 + nrm * hw], 1)   # R0 R1 L1 L0
        V.append(np.concatenate([q, np.full(q.shape[:2] + (1,), z)], 2).reshape(-1, 3))
        UV.append(np.stack([np.stack([u0, np.ones_like(u0)], 1), np.stack([u1, np.ones_like(u0)], 1),
                            np.stack([u1, np.zeros_like(u0)], 1), np.stack([u0, np.zeros_like(u0)], 1)], 1).reshape(-1, 2))
        for k, fn in attr_fns.items():
            attrs[k].append(np.full(len(p0), fn(tags)))
    if not V:
        return None
    V = np.vstack(V)
    n = len(V) // 4
    return V, np.arange(4 * n), np.arange(n) * 4, np.vstack(UV), {k: np.concatenate(v) for k, v in attrs.items()}


# ---------------------------------------------------------------- camera

def cam_state(t):
    """(target xy m, distance m, pitch deg, heading deg, hfov deg) at scene time t."""
    V = descent_V(min(t, shots_descent_end())) * 1000.0
    d_desc = V / (2 * math.tan(math.radians(HFOV0) / 2))
    w = float(ease((t - TILT_START) / (TILT_END - TILT_START)))
    logd = (1 - w) * math.log(d_desc) + w * math.log(DIST1)
    tgt = w * TARGET1
    pitch, heading = w * PITCH1, w * HEADING1
    hfov = HFOV0 + (HFOV1 - HFOV0) * w
    if t > TILT_END:
        u = float(ease((t - TILT_END) / (T.RADIO[1] - TILT_END)))
        logd += u * math.log(DRIFT["dist"])
        heading += u * DRIFT["heading"]
        pitch += u * DRIFT["pitch"]
    return tgt, math.exp(logd), pitch, heading, hfov


def shots_descent_end():
    import shots
    return shots.DESCENT_END


def cam_pose(t):
    tgt, D, pitch, heading, hfov = cam_state(t)
    th, ps = math.radians(pitch), math.radians(heading)
    f = np.array([math.sin(th) * math.sin(ps), math.sin(th) * math.cos(ps), -math.cos(th)])
    pos = np.array([tgt[0], tgt[1], 0.0]) - D * f
    return pos, (th, 0.0, -ps), hfov


def view_width_km(t):
    """Ground width seen at the target (km) - the 2D zoom's V while top-down."""
    tgt, D, pitch, heading, hfov = cam_state(t)
    return 2 * D * math.tan(math.radians(hfov) / 2) / 1000.0


def lens_mm(hfov, sensor=36.0):
    return sensor / (2 * math.tan(math.radians(hfov) / 2))


def project(points, t, w=1920, h=1080):
    """World metres (N,3) -> screen px (N,2) and depth, for overlays in compose.py."""
    pos, (rx, ry, rz), hfov = cam_pose(t)
    cx, sx, cz, sz = math.cos(rx), math.sin(rx), math.cos(rz), math.sin(rz)
    Rx = np.array([[1, 0, 0], [0, cx, -sx], [0, sx, cx]])
    Rz = np.array([[cz, -sz, 0], [sz, cz, 0], [0, 0, 1]])
    R = Rz @ Rx                                                 # camera -> world
    pc = (np.asarray(points, float) - pos) @ R                 # world -> camera (rows)
    f = w / 2 / math.tan(math.radians(hfov) / 2)
    z = -pc[:, 2]
    return np.stack([w / 2 + f * pc[:, 0] / z, h / 2 - f * pc[:, 1] / z], 1), z


# ---------------------------------------------------------------- scene

def clock_values(t):
    V = view_width_km(t)
    vals = {
        "time": t,
        "r4_fade": log_fade(120, 95, V),
        "city_fade": log_fade(40, 14, V),
        "haze": float(ease((t - TILT_START - 1.0) / 5.0)),
        "map_dim": 1.0 - 0.8 * float(ease((t - TILT_START) / (TILT_END - TILT_START))),
        "lit": 1.0 - T.people_without_power(t) / T.PEOPLE_WITHOUT_POWER,
    }
    for k in range(T.N_DISTRICTS):
        vals[f"P{k}"] = T.light_level(t, SCHED[k])
        vals[f"H{k}"] = hosp_level(t, k)
    return vals


CLOCK_KEYS = ["time", "r4_fade", "city_fade", "haze", "map_dim", "lit"] + [f"P{k}" for k in range(10)] + [f"H{k}" for k in range(10)]


def set_fcurve(owner, data_path, frames, values, index=0):
    from bpy_extras import anim_utils
    ad = owner.animation_data
    cb = anim_utils.action_get_channelbag_for_slot(ad.action, ad.action_slot)
    fc = cb.fcurves.find(data_path, index=index)
    fc.keyframe_points.clear()
    fc.keyframe_points.add(len(frames))
    fc.keyframe_points.foreach_set("co", np.column_stack([frames, values]).astype(np.float32).ravel())
    for kp in fc.keyframe_points:
        kp.interpolation = "LINEAR"
    fc.update()


class NodeKit:
    """Tiny helper for building shader node trees."""
    def __init__(self, tree):
        self.t, self.n, self.l = tree, tree.nodes, tree.links
        self.x = 0

    def node(self, kind, **inputs):
        nd = self.n.new(kind)
        nd.location = (self.x, 0)
        self.x += 40
        for k, v in inputs.items():
            self.set(nd.inputs[k], v)
        return nd

    def set(self, sock, v):
        if hasattr(v, "is_output") or hasattr(v, "links"):
            self.l.new(v, sock)
        else:
            sock.default_value = v

    def math(self, op, a, b=0.0, clamp=False):
        nd = self.n.new("ShaderNodeMath")
        nd.operation = op
        nd.use_clamp = clamp
        self.set(nd.inputs[0], a)
        self.set(nd.inputs[1], b)
        return nd.outputs[0]

    def vmath(self, op, a, b=(0, 0, 0)):
        nd = self.n.new("ShaderNodeVectorMath")
        nd.operation = op
        self.set(nd.inputs[0], a)
        self.set(nd.inputs[1], b)
        return nd.outputs["Value"] if op in ("DOT_PRODUCT", "LENGTH", "DISTANCE") else nd.outputs["Vector"]

    def mix_rgb(self, fac, a, b, blend="MIX"):
        nd = self.n.new("ShaderNodeMix")
        nd.data_type = "RGBA"
        nd.blend_type = blend
        self.set(nd.inputs["Factor"], fac)
        self.set(nd.inputs[6], a)
        self.set(nd.inputs[7], b)
        return nd.outputs[2]

    def attr(self, name, kind="GEOMETRY"):
        nd = self.n.new("ShaderNodeAttribute")
        nd.attribute_name = name
        nd.attribute_type = kind
        return nd.outputs["Fac"]

    def combine(self, x, y, z=0.0):
        nd = self.n.new("ShaderNodeCombineXYZ")
        self.set(nd.inputs[0], x)
        self.set(nd.inputs[1], y)
        self.set(nd.inputs[2], z)
        return nd.outputs[0]

    def sep(self, v):
        nd = self.n.new("ShaderNodeSeparateXYZ")
        self.set(nd.inputs[0], v)
        return nd.outputs

    def rgb(self, fac_or_val, color):
        """color * scalar -> RGBA."""
        nd = self.n.new("ShaderNodeMix")
        nd.data_type = "RGBA"
        nd.blend_type = "MULTIPLY"
        nd.inputs["Factor"].default_value = 1.0
        self.set(nd.inputs[6], (1, 1, 1, 1))
        self.set(nd.inputs[7], tuple(color) + (1,) if len(color) == 3 else color)
        m = self.n.new("ShaderNodeVectorMath")
        m.operation = "SCALE"
        self.l.new(nd.outputs[2], m.inputs[0])
        self.set(m.inputs["Scale"], fac_or_val)
        return m.outputs["Vector"]

    def hash01(self, vec):
        nd = self.n.new("ShaderNodeTexWhiteNoise")
        nd.noise_dimensions = "3D"
        self.set(nd.inputs["Vector"], vec)
        return nd.outputs["Value"]

    def img(self, image, vec=None, interp="Linear", noncolor=False):
        nd = self.n.new("ShaderNodeTexImage")
        nd.image = image
        nd.interpolation = interp
        nd.extension = "EXTEND"
        if noncolor:
            image.colorspace_settings.name = "Non-Color"
        if vec is not None:
            self.set(nd.inputs["Vector"], vec)
        return nd


def build_scene(osm_name):
    import bpy
    t0 = time.time()
    OUT.mkdir(parents=True, exist_ok=True)
    TEX.mkdir(parents=True, exist_ok=True)
    blist, roads, parks, waters = load_osm(osm_name)
    bake_city(blist, roads, parks, waters)
    for name in ("R3", "R4"):
        bake_layer_death(name)
    bake_feather()
    print(f"data + textures: {time.time() - t0:.1f} s")

    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.name = "Scene1_City"
    sc.render.engine = "CYCLES"
    sc.cycles.device = "CPU"
    sc.render.fps = FPS
    sc.frame_start, sc.frame_end = F0, F1
    sc.render.resolution_x, sc.render.resolution_y = 1920, 1080
    sc.view_settings.view_transform = "Standard"
    sc.view_settings.look = "None"
    c = sc.cycles
    c.samples = 16
    c.use_adaptive_sampling = True
    c.adaptive_threshold = 0.03
    c.use_denoising = True
    c.denoiser = "OPENIMAGEDENOISE"
    c.max_bounces, c.diffuse_bounces, c.glossy_bounces = 4, 1, 2
    c.transmission_bounces, c.volume_bounces, c.transparent_max_bounces = 0, 0, 8
    c.caustics_reflective = c.caustics_refractive = False
    c.use_light_tree = True
    sc.render.use_persistent_data = True
    sc.render.image_settings.file_format = "PNG"
    sc.render.image_settings.color_depth = "8"
    sc.render.film_transparent = False

    img = lambda p: bpy.data.images.load(str(p), check_existing=True)   # noqa: E731

    # ---- SceneClock: every animated value in one node group
    clock = bpy.data.node_groups.new("SceneClock", "ShaderNodeTree")
    g_out = clock.nodes.new("NodeGroupOutput")
    g_out.location = (400, 0)
    for i, k in enumerate(CLOCK_KEYS):
        clock.interface.new_socket(name=k, in_out="OUTPUT", socket_type="NodeSocketFloat")
        v = clock.nodes.new("ShaderNodeValue")
        v.name = v.label = k
        v.location = (0, -i * 90)
        clock.links.new(v.outputs[0], g_out.inputs[k])
    frames = np.arange(F0, F1 + 1)
    table = {k: [] for k in CLOCK_KEYS}
    for f in frames:
        vals = clock_values(f / FPS)
        for k in CLOCK_KEYS:
            table[k].append(vals[k])
    for k in CLOCK_KEYS:
        sock = clock.nodes[k].outputs[0]
        sock.default_value = table[k][0]
        sock.keyframe_insert("default_value", frame=F0)
        set_fcurve(clock, f'nodes["{k}"].outputs[0].default_value', frames, table[k])

    def clock_node(kit):
        nd = kit.n.new("ShaderNodeGroup")
        nd.node_tree = clock
        return nd.outputs

    def haze_mix(kit, clk, color_vec, strength=1.0):
        """Aerial perspective on camera rays: fade to the horizon colour with distance."""
        lp = kit.n.new("ShaderNodeLightPath")
        dist = kit.math("MULTIPLY", lp.outputs["Ray Length"], -1.0 / 9000.0)
        fog = kit.math("SUBTRACT", 1.0, kit.math("EXPONENT", dist))
        fog = kit.math("MULTIPLY", fog, clk["haze"])
        fog = kit.math("MULTIPLY", fog, strength)
        tone = kit.mix_rgb(clk["lit"], srgb((10, 26, 30)) + (1,), srgb((36, 28, 22)) + (1,))   # sodium glow -> aurora dark
        return kit.mix_rgb(fog, color_vec, tone)

    def emission_out(kit, mat, color, alpha=None):
        em = kit.node("ShaderNodeEmission", Color=color, Strength=1.0)
        out = kit.node("ShaderNodeOutputMaterial")
        sh = em.outputs[0]
        if alpha is not None:
            tr = kit.node("ShaderNodeBsdfTransparent")
            mx = kit.node("ShaderNodeMixShader", Fac=alpha)
            kit.l.new(tr.outputs[0], mx.inputs[1])
            kit.l.new(sh, mx.inputs[2])
            sh = mx.outputs[0]
        kit.l.new(sh, out.inputs["Surface"])
        mat.cycles.emission_sampling = "NONE"

    def new_mat(name):
        m = bpy.data.materials.new(name)
        m.use_nodes = True
        m.node_tree.nodes.clear()
        return m, NodeKit(m.node_tree)

    def fade_in(kit, clk, shader):
        """The 3D city is invisible (not just unlit) until it takes over from the map layer."""
        tr = kit.node("ShaderNodeBsdfTransparent")
        mx = kit.node("ShaderNodeMixShader", Fac=clk["city_fade"])
        kit.l.new(tr.outputs[0], mx.inputs[1])
        kit.l.new(shader, mx.inputs[2])
        out = kit.node("ShaderNodeOutputMaterial")
        kit.l.new(mx.outputs[0], out.inputs["Surface"])

    def on_from_death(kit, clk, death_tex_out, fade=0.15):
        death = kit.math("ADD", kit.math("MULTIPLY", death_tex_out, 12.0), 30.0)
        late = kit.math("DIVIDE", kit.math("SUBTRACT", clk["time"], death), fade)
        return kit.math("SUBTRACT", 1.0, kit.math("MAXIMUM", 0.0, late), clamp=True)

    col_ground = bpy.data.collections.new("Ground")
    col_city = bpy.data.collections.new("City")
    for cl in (col_ground, col_city):
        sc.collection.children.link(cl)

    # ---- map-layer ground planes (R3 under R4), lights die following the wave
    def layer_plane(name, z, fade_key):
        g = META["layers"][name]
        w, h = g["width_km"] * 1000, g["height_km"] * 1000
        V = np.array([[-w / 2, -h / 2, z], [w / 2, -h / 2, z], [w / 2, h / 2, z], [-w / 2, h / 2, z]])
        ob = build_mesh(bpy, f"Map_{name}", V, [0, 1, 2, 3], [0], uv=[(0, 0), (1, 0), (1, 1), (0, 1)], collection=col_ground)
        m, kit = new_mat(f"Map_{name}")
        clk = clock_node(kit)
        lit = kit.img(img(REG / f"{name}_aurora.png"), interp="Cubic").outputs["Color"]
        dark = kit.img(img(REG / f"{name}_blackout.png"), interp="Cubic").outputs["Color"]
        dtex = kit.img(img(TEX / f"{name}_death.png"), noncolor=True).outputs["Color"]
        on = on_from_death(kit, clk, kit.sep(dtex)[0], fade=0.4)
        colr = kit.mix_rgb(on, dark, lit)
        colr = kit.vmath("SCALE", colr)
        kit.set(colr.node.inputs["Scale"], clk["map_dim"])          # the map look is too bright for a low aerial
        colr = haze_mix(kit, clk, colr)
        alpha = None
        if fade_key:
            fe = kit.img(img(TEX / "feather.png"), noncolor=True).outputs["Color"]
            alpha = kit.math("MULTIPLY", kit.sep(fe)[0], clk[fade_key])
        emission_out(kit, m, colr, alpha)
        ob.data.materials.append(m)
        return ob

    layer_plane("R3", 0.0, None)
    layer_plane("R4", 0.4, "r4_fade")
    # outer ground: fills the view to the horizon beyond R3
    big = 2.5e6
    ob = build_mesh(bpy, "Map_outer", [[-big, -big, -2], [big, -big, -2], [big, big, -2], [-big, big, -2]],
                    [0, 1, 2, 3], [0], collection=col_ground)
    m, kit = new_mat("Map_outer")
    clk = clock_node(kit)
    emission_out(kit, m, haze_mix(kit, clk, srgb((14, 20, 26)) + (1,)))
    ob.data.materials.append(m)

    # ---- city ground plane (fades in as the 3D city takes over from the map layer)
    V = np.array([[BX0, BY0, 0.8], [BX1, BY0, 0.8], [BX1, BY1, 0.8], [BX0, BY1, 0.8]])
    ob = build_mesh(bpy, "City_ground", V, [0, 1, 2, 3], [0], uv=[(0, 0), (1, 0), (1, 1), (0, 1)], collection=col_ground)
    m, kit = new_mat("City_ground")
    clk = clock_node(kit)
    base = kit.img(img(TEX / "city_ground.png")).outputs["Color"]
    wmask = kit.sep(kit.img(img(TEX / "city_water.png"), noncolor=True).outputs["Color"])[0]
    glow = kit.sep(kit.img(img(TEX / "city_glow.png"), noncolor=True).outputs["Color"])[0]
    dtex = kit.sep(kit.img(img(TEX / "city_death.png"), interp="Closest", noncolor=True).outputs["Color"])[0]
    on = on_from_death(kit, clk, dtex)
    glow_c = kit.rgb(kit.math("MULTIPLY", kit.math("MULTIPLY", glow, on), 0.11), GOLD)
    land = kit.vmath("ADD", base, glow_c)
    land = haze_mix(kit, clk, land)
    em_only = kit.node("ShaderNodeEmission", Color=land, Strength=1.0)
    snowland = kit.node("ShaderNodeBsdfDiffuse", Color=(0.22, 0.24, 0.27, 1))
    em = kit.node("ShaderNodeAddShader")
    kit.l.new(em_only.outputs[0], em.inputs[0])
    kit.l.new(snowland.outputs[0], em.inputs[1])
    water = kit.node("ShaderNodeBsdfPrincipled", **{"Base Color": srgb(WATER_NIGHT) + (1,), "Roughness": 0.12,
                                                     "Specular IOR Level": 0.5})
    wmix = kit.node("ShaderNodeMixShader", Fac=wmask)
    kit.l.new(em.outputs[0], wmix.inputs[1])
    kit.l.new(water.outputs[0], wmix.inputs[2])
    # edge feather (1 km) x city fade
    uv = kit.node("ShaderNodeTexCoord").outputs["UV"]
    uvs = kit.sep(uv)
    ex = kit.math("MINIMUM", uvs[0], kit.math("SUBTRACT", 1.0, uvs[0]))
    ey = kit.math("MINIMUM", uvs[1], kit.math("SUBTRACT", 1.0, uvs[1]))
    edge = kit.math("MINIMUM", kit.math("MULTIPLY", ex, (BX1 - BX0) / 1000.0), kit.math("MULTIPLY", ey, (BY1 - BY0) / 1000.0), clamp=True)
    alpha = kit.math("MULTIPLY", edge, clk["city_fade"])
    tr = kit.node("ShaderNodeBsdfTransparent")
    amix = kit.node("ShaderNodeMixShader", Fac=alpha)
    kit.l.new(tr.outputs[0], amix.inputs[1])
    kit.l.new(wmix.outputs[0], amix.inputs[2])
    out = kit.node("ShaderNodeOutputMaterial")
    kit.l.new(amix.outputs[0], out.inputs["Surface"])
    m.cycles.emission_sampling = "NONE"
    ob.data.materials.append(m)

    # ---- buildings, per district (+ hospitals)
    def building_mat(name, power_key, hospital=False):
        m, kit = new_mat(name)
        clk = clock_node(kit)
        uvn = kit.node("ShaderNodeUVMap")
        uvn.uv_map = "UVMap"
        u, v = kit.sep(uvn.outputs["UV"])[0], kit.sep(uvn.outputs["UV"])[1]
        bid = kit.attr("bid")
        fu = kit.math("DIVIDE", u, 2.9)
        fv = kit.math("DIVIDE", kit.math("SUBTRACT", v, 0.6), 3.3)
        cu, cv = kit.math("FLOOR", fu), kit.math("FLOOR", fv)
        wu = kit.math("FRACT", fu)
        wv = kit.math("FRACT", fv)
        inside = kit.math("MULTIPLY",
                          kit.math("MULTIPLY", kit.math("GREATER_THAN", wu, 0.18), kit.math("LESS_THAN", wu, 0.82)),
                          kit.math("MULTIPLY", kit.math("GREATER_THAN", wv, 0.28), kit.math("LESS_THAN", wv, 0.80)))
        inside = kit.math("MULTIPLY", inside, kit.math("GREATER_THAN", v, 0.5))      # walls only (roof v<0)
        r1 = kit.hash01(kit.combine(cu, cv, kit.math("MULTIPLY", bid, 997.0)))
        r2 = kit.hash01(kit.combine(cv, kit.math("MULTIPLY", bid, 613.0), 7.0))      # whole-floor (offices)
        plit = 0.78 if hospital else kit.math("ADD", 0.16, kit.math("MULTIPLY", bid, 0.30))
        lit = kit.math("MAXIMUM", kit.math("LESS_THAN", r1, plit), kit.math("LESS_THAN", r2, 0.06))
        win = kit.math("MULTIPLY", inside, lit)
        r3 = kit.hash01(kit.combine(cu, cv, kit.math("ADD", kit.math("MULTIPLY", bid, 331.0), 3.0)))
        tint = kit.mix_rgb(kit.math("GREATER_THAN", r3, 0.78), WARM + (1,), COOL + (1,)) if not hospital else HOSP + (1,)
        dim = kit.math("ADD", 0.55, kit.math("MULTIPLY", r3, 0.9))
        # street-level shopfronts: a warm band on the ground floor of some buildings
        shop = kit.math("MULTIPLY", kit.math("LESS_THAN", v, 4.2), kit.math("GREATER_THAN", v, 0.4))
        shop = kit.math("MULTIPLY", shop, kit.math("LESS_THAN", kit.hash01(kit.combine(bid, 1.0, 2.0)), 0.35))
        power = clk[power_key]
        strength = kit.math("MULTIPLY", kit.math("ADD", kit.math("MULTIPLY", win, dim), kit.math("MULTIPLY", shop, 0.8)),
                            kit.math("MULTIPLY", kit.math("MULTIPLY", power, clk["city_fade"]), 2.4 if hospital else 2.4))
        roof = kit.math("LESS_THAN", v, -0.5)
        snow = kit.math("ADD", 0.45, kit.math("MULTIPLY", kit.hash01(kit.combine(bid, 4.0, 9.0)), 0.35))
        albedo = kit.mix_rgb(roof, srgb((30, 33, 38)) + (1,), kit.rgb(snow, (0.62, 0.66, 0.72)))   # March: snow on the roofs
        bsdf = kit.node("ShaderNodeBsdfPrincipled", **{"Roughness": 0.8})
        kit.set(bsdf.inputs["Base Color"], albedo)
        kit.set(bsdf.inputs["Emission Color"], tint)
        kit.set(bsdf.inputs["Emission Strength"], strength)
        fade_in(kit, clk, bsdf.outputs[0])
        m.cycles.emission_sampling = "NONE"
        return m

    dist_b = district_of(np.array([b["c"][0] for b in blist]), np.array([b["c"][1] for b in blist])) if blist else []
    for k in range(T.N_DISTRICTS):
        for hosp in (False, True):
            sel = [b for b, d in zip(blist, dist_b) if d == k and b["hosp"] == hosp]
            arr = buildings_arrays(sel)
            if arr is None:
                continue
            V, L, S, UV, BID = arr
            name = f"{'Hospitals' if hosp else 'Buildings'}_D{k}"
            ob = build_mesh(bpy, name, V, L, S, uv=UV, face_attrs={"bid": BID}, collection=col_city)
            ob.data.materials.append(building_mat(name, f"{'H' if hosp else 'P'}{k}", hosp))

    # ---- streets (per district), streetlight pools along the road
    def street_mat(name, power_key):
        m, kit = new_mat(name)
        clk = clock_node(kit)
        uvn = kit.node("ShaderNodeUVMap")
        uvn.uv_map = "UVMap"
        u = kit.sep(uvn.outputs["UV"])[0]
        ph = kit.math("SUBTRACT", kit.math("FRACT", kit.math("DIVIDE", u, 33.0)), 0.5)
        pool = kit.math("EXPONENT", kit.math("MULTIPLY", kit.math("MULTIPLY", ph, ph), -40.0))
        lum = kit.attr("lum")
        s = kit.math("MULTIPLY", kit.math("MULTIPLY", lum, kit.math("ADD", 0.3, kit.math("MULTIPLY", pool, 1.2))),
                     kit.math("MULTIPLY", kit.math("MULTIPLY", clk[power_key], clk["city_fade"]), 0.95))
        bsdf = kit.node("ShaderNodeBsdfPrincipled", **{"Base Color": srgb((14, 15, 17)) + (1,), "Roughness": 0.9})
        kit.set(bsdf.inputs["Emission Color"], GOLD + (1,))
        kit.set(bsdf.inputs["Emission Strength"], s)
        fade_in(kit, clk, bsdf.outputs[0])
        m.cycles.emission_sampling = "NONE"
        return m

    road_mid = [(pts, tags, district_of(*pts.mean(0))) for pts, tags in roads]
    for k in range(T.N_DISTRICTS):
        sel = [(p, t) for p, t, d in road_mid if d == k]
        rb = ribbons(sel, 1.2, lambda tg: ROAD[tg["highway"]][0], {"lum": lambda tg: ROAD[tg["highway"]][1]})
        if rb is None:
            continue
        V, L, S, UV, A = rb
        ob = build_mesh(bpy, f"Streets_D{k}", V, L, S, uv=UV, face_attrs=A, collection=col_city)
        ob.data.materials.append(street_mat(f"Streets_D{k}", f"P{k}"))

    # ---- traffic: head/tail lights streaming along the main roads (they keep moving in the dark)
    main = [(p, t) for p, t in roads if ROAD[t["highway"]][2]]
    rb = ribbons(main, 1.6, lambda tg: ROAD[tg["highway"]][0] * 0.62,
                 {"speed": lambda tg: SPEED.get(tg["highway"], 13.0),
                  "dens": lambda tg: 0.55 if tg["highway"].startswith(("motorway", "trunk")) else 0.32})
    if rb is not None:
        V, L, S, UV, A = rb
        ob = build_mesh(bpy, "Traffic", V, L, S, uv=UV, face_attrs=A, collection=col_city)
        m, kit = new_mat("Traffic")
        clk = clock_node(kit)
        uvn = kit.node("ShaderNodeUVMap")
        uvn.uv_map = "UVMap"
        u, v = kit.sep(uvn.outputs["UV"])[0], kit.sep(uvn.outputs["UV"])[1]
        right = kit.math("GREATER_THAN", v, 0.5)
        sign = kit.math("SUBTRACT", kit.math("MULTIPLY", right, 2.0), 1.0)
        off = kit.math("MULTIPLY", kit.math("MULTIPLY", clk["time"], kit.attr("speed")), sign)
        cell = kit.math("DIVIDE", kit.math("SUBTRACT", u, off), 9.0)
        lane = kit.math("FLOOR", kit.math("MULTIPLY", v, 4.0))
        car = kit.math("LESS_THAN", kit.hash01(kit.combine(kit.math("FLOOR", cell), lane, 5.0)), kit.attr("dens"))
        car = kit.math("MULTIPLY", car, kit.math("LESS_THAN", kit.math("FRACT", cell), 0.38))
        lanemid = kit.math("ABSOLUTE", kit.math("SUBTRACT", kit.math("FRACT", kit.math("MULTIPLY", v, 4.0)), 0.5))
        car = kit.math("MULTIPLY", car, kit.math("LESS_THAN", lanemid, 0.3))
        colr = kit.mix_rgb(right, srgb((255, 40, 30)) + (1,), srgb((255, 244, 214)) + (1,))
        strength = kit.math("MULTIPLY", car, kit.math("MULTIPLY", clk["city_fade"], 7.0))
        em = kit.node("ShaderNodeEmission", Color=colr, Strength=strength)
        tr = kit.node("ShaderNodeBsdfTransparent")
        mx = kit.node("ShaderNodeMixShader", Fac=car)
        kit.l.new(tr.outputs[0], mx.inputs[1])
        kit.l.new(em.outputs[0], mx.inputs[2])
        out = kit.node("ShaderNodeOutputMaterial")
        kit.l.new(mx.outputs[0], out.inputs["Surface"])
        m.cycles.emission_sampling = "NONE"
        ob.data.materials.append(m)

    # ---- aurora sky (world): green curtains low in the north, magenta crowns, a green wash overhead
    world = bpy.data.worlds.new("AuroraSky")
    sc.world = world
    world.use_nodes = True
    wt = world.node_tree
    wt.nodes.clear()
    kit = NodeKit(wt)
    clk = clock_node(kit)
    d = kit.node("ShaderNodeTexCoord").outputs["Generated"]
    dx, dy, dz = kit.sep(kit.vmath("NORMALIZE", d))
    elev = kit.math("MAXIMUM", dz, 0.0)
    az = kit.math("ARCTAN2", dy, dx)
    tt = kit.math("MULTIPLY", clk["time"], 0.035)
    def noise2(u, v, detail=2.0, rough=0.5):
        nd = kit.node("ShaderNodeTexNoise", Scale=1.0, Detail=detail, Roughness=rough)
        nd.noise_dimensions = "2D"
        kit.set(nd.inputs["Vector"], kit.combine(u, v))
        return nd.outputs["Fac"]

    def smooth01(x, a, b):
        e = kit.math("MULTIPLY", kit.math("SUBTRACT", x, a), 1.0 / (b - a), clamp=True)
        return kit.math("MULTIPLY", kit.math("MULTIPLY", e, e), kit.math("SUBTRACT", 3.0, kit.math("MULTIPLY", e, 2.0)))

    def curtain(seed, fold_k, base0, base_amp, decay, gain):
        """One aurora curtain: folds (where it is), fine rays, a bright wavy lower border, fading up."""
        f = noise2(kit.math("ADD", kit.math("MULTIPLY", az, fold_k), seed), kit.math("MULTIPLY", tt, 0.6))
        env = smooth01(f, 0.40, 0.62)
        ray = kit.math("POWER", noise2(kit.math("ADD", kit.math("MULTIPLY", az, 110.0), seed * 7), kit.math("MULTIPLY", tt, 3.0), 3.0, 0.55), 3.0)
        wig = noise2(kit.math("ADD", kit.math("MULTIPLY", az, 16.0), seed * 3), kit.math("MULTIPLY", tt, 1.7))
        base = kit.math("ADD", kit.math("ADD", base0, kit.math("MULTIPLY", f, base_amp)), kit.math("MULTIPLY", wig, 0.014))
        lower = kit.math("SUBTRACT", elev, base)
        edge = kit.math("MULTIPLY", kit.math("ADD", lower, 0.004), 180.0, clamp=True)          # soft lower border
        prof = kit.math("EXPONENT", kit.math("MULTIPLY", kit.math("MAXIMUM", lower, 0.0), -decay))
        c = kit.math("MULTIPLY", kit.math("MULTIPLY", edge, prof), kit.math("ADD", 0.35, kit.math("MULTIPLY", ray, 2.4)))
        return kit.math("MULTIPLY", kit.math("MULTIPLY", c, env), gain), lower

    c1, low1 = curtain(0.0, 2.4, 0.006, 0.055, 9.0, 1.7)
    c2, _ = curtain(41.0, 1.7, 0.05, 0.08, 4.5, 0.75)
    top = kit.math("MULTIPLY", kit.math("SUBTRACT", low1, 0.09), 3.5, clamp=True)
    green, magenta = srgb((60, 255, 140)), srgb((225, 60, 175))
    ccol = kit.mix_rgb(top, green + (1,), magenta + (1,))
    sky_c = kit.vmath("SCALE", ccol)
    kit.set(sky_c.node.inputs["Scale"], kit.math("ADD", c1, c2))
    wash = kit.rgb(kit.math("ADD", 0.05, kit.math("MULTIPLY", elev, 0.14)), srgb((40, 170, 110)))
    tone = kit.mix_rgb(clk["lit"], srgb((10, 26, 30)) + (1,), srgb((36, 28, 22)) + (1,))       # same as the ground haze
    horizon = kit.vmath("SCALE", tone)
    kit.set(horizon.node.inputs["Scale"], kit.math("EXPONENT", kit.math("MULTIPLY", elev, -18.0)))
    sky = kit.vmath("ADD", kit.vmath("ADD", sky_c, wash), horizon)
    bg = kit.node("ShaderNodeBackground", Color=sky, Strength=1.0)
    wo = kit.node("ShaderNodeOutputWorld")
    kit.l.new(bg.outputs[0], wo.inputs["Surface"])

    # ---- camera, keyed per frame (phase 1 = the 2D zoom's log descent, top-down, north up)
    cam_data = bpy.data.cameras.new("CityCam")
    cam_data.sensor_fit = "HORIZONTAL"
    cam_data.sensor_width = 36.0
    cam_data.clip_start, cam_data.clip_end = 5.0, 3.0e6
    cam = bpy.data.objects.new("CityCam", cam_data)
    sc.collection.objects.link(cam)
    sc.camera = cam
    cam.rotation_mode = "XYZ"
    poses = [cam_pose(f / FPS) for f in frames]
    cam.location = poses[0][0]
    cam.rotation_euler = poses[0][1]
    cam_data.lens = lens_mm(poses[0][2])
    for i in range(3):
        cam.keyframe_insert("location", index=i, frame=F0)
        cam.keyframe_insert("rotation_euler", index=i, frame=F0)
        set_fcurve(cam, "location", frames, [p[0][i] for p in poses], index=i)
        set_fcurve(cam, "rotation_euler", frames, [p[1][i] for p in poses], index=i)
    cam_data.keyframe_insert("lens", frame=F0)
    set_fcurve(cam_data, "lens", frames, [lens_mm(p[2]) for p in poses])

    sc.frame_set(F0)
    bpy.ops.wm.save_as_mainfile(filepath=str(BLEND), compress=True)
    write_cams()
    print(f"saved {BLEND} ({time.time() - t0:.1f} s total)")


def write_cams():
    frames = list(range(F0, F1 + 1))
    out = {"fps": FPS, "frame0": F0, "note": "per frame: location m, rotation_euler XYZ rad, hfov deg, "
           "view_width_km at the target; metres: x east, y north from 45.5017N 73.5673W", "frames": []}
    for f in frames:
        pos, rot, hfov = cam_pose(f / FPS)
        out["frames"].append({"f": f, "loc": [round(float(v), 3) for v in pos], "rot": [round(float(v), 6) for v in rot],
                              "hfov": round(hfov, 4), "view_km": round(view_width_km(f / FPS), 4)})
    (OUT / "cams.json").write_text(json.dumps(out))


def render(t0, t1, scale=100, samples=16, out=None, step=1):
    import bpy
    bpy.ops.wm.open_mainfile(filepath=str(BLEND))
    sc = bpy.context.scene
    sc.render.resolution_percentage = scale
    sc.cycles.samples = samples
    sc.render.threads_mode = "AUTO"
    out = Path(out or OUT / "frames")
    out.mkdir(parents=True, exist_ok=True)
    times = []
    for f in range(int(round(t0 * FPS)), int(round(t1 * FPS)), step):
        if (out / f"{f:05d}.png").exists():            # resumable: skip frames already rendered
            continue
        sc.frame_set(f)
        sc.render.filepath = str(out / f"{f:05d}.png")
        s = time.time()
        bpy.ops.render.render(write_still=True)
        times.append(time.time() - s)
        print(f"frame {f} ({f / FPS:.2f} s): {times[-1]:.1f} s", flush=True)
    if times:
        warm = times[1:] or times
        print(f"frames: {len(times)}  first: {times[0]:.1f} s  mean after first: {np.mean(warm):.1f} s/frame")
    return times


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("cmd", choices=["build", "render", "cams"])
    ap.add_argument("t", nargs="*", type=float)
    ap.add_argument("--osm", default="montreal")
    ap.add_argument("--scale", type=int, default=100)
    ap.add_argument("--samples", type=int, default=16)
    ap.add_argument("--step", type=int, default=1)
    ap.add_argument("--out", default=None)
    a = ap.parse_args()
    if a.cmd == "build":
        build_scene(a.osm)
    elif a.cmd == "cams":
        write_cams()
    else:
        t0, t1 = (a.t + [a.t[0] + 1 / FPS])[:2] if a.t else (30.5, 33.5)
        render(t0, t1, a.scale, a.samples, a.out, a.step)
