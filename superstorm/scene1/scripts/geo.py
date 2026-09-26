"""Shared geography helpers: GSHHG/WDBII vector data (from the basemap-data packages),
GeoNames towns (geonamescache) and the calibrated pixel mapping of the world maps."""
import json
import os
from functools import lru_cache
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
CALIBRATION = ROOT / "assets" / "maps" / "calibration.json"

MONTREAL = (45.5017, -73.5673)        # lat, lon (downtown)
CITY_CAL = ROOT / "assets" / "maps" / "calibration_cities.json"

# Zoom targets for the incident blocks (lat, lon). The map pipeline (regional layers, camera)
# centres on the city named by $SUPERSTORM_CITY (default Montreal, the scene-1 pilot).
CITIES = {
    "montreal": MONTREAL, "london": (51.5072, -0.1276), "new_york": (40.7580, -73.9855),
    "tokyo": (35.6812, 139.7671), "stockholm": (59.3293, 18.0686), "paris": (48.8566, 2.3522),
    "toronto": (43.6532, -79.3832), "chicago": (41.8781, -87.6298), "lagos": (6.5244, 3.3792),
    "mumbai": (19.0760, 72.8777), "sydney": (-33.8688, 151.2093), "singapore": (1.2903, 103.8520),
    "shanghai": (31.2304, 121.4737), "sao_paulo": (-23.5505, -46.6333), "dunedin": (-45.8788, 170.5028),
    "johannesburg": (-26.2041, 28.0473), "rotterdam": (51.9244, 4.4777), "ulsan": (35.5384, 129.3114),
    "boulder": (40.0150, -105.2705), "harrisburg": (40.2732, -76.8867), "madison": (43.0731, -89.4012),
}   # (Anchorage is west of the AI map's edge at ~132.6 W: its incident stays a map graphic)
CITY = os.environ.get("SUPERSTORM_CITY", "montreal").lower()
CENTER = CITIES[CITY]


def city_build_dir(name):
    """build/<name> for Montreal (unchanged paths), build/<name>_<city> for every other city."""
    return ROOT / "build" / (name if CITY == "montreal" else f"{name}_{CITY}")


def city_calibration(cal=None):
    """(affine_x, affine_y, zoom_target_px) placing the active city on the AI world maps:
    Montreal = the 3-landmark fit + its light cluster; others = calibrate_city.py."""
    cal = cal or load_calibration()
    if CITY == "montreal":
        return cal["local"]["affine_x"], cal["local"]["affine_y"], cal["montreal"]["zoom_target_px"]
    c = json.loads(CITY_CAL.read_text())[CITY]
    return c["affine_x"], c["affine_y"], c["zoom_target_px"]


def _basemap_dir(res):
    import mpl_toolkits.basemap_data as bd          # namespace package: no __file__
    for d in bd.__path__:
        if os.path.exists(os.path.join(d, f"gshhs_{res}.dat")):
            return d
    raise FileNotFoundError(f"gshhs_{res}.dat not found (pip install basemap-data basemap-data-hires)")


@lru_cache(maxsize=None)
def _read_all(name, res):
    """All records of a basemap boundary file: list of (type, south, north, Nx2 lon/lat array).
    name: gshhs (1 land, 2 lake, 3 island-in-lake, 4 pond), countries, states, rivers."""
    d = _basemap_dir(res)
    out = []
    with open(os.path.join(d, f"{name}_{res}.dat"), "rb") as data, \
            open(os.path.join(d, f"{name}meta_{res}.dat")) as meta:
        for line in meta:
            p = line.split()
            typ, npts, south, north = int(p[0]), int(p[2]), float(p[3]), float(p[4])
            offset, nbytes = int(p[5]), int(p[6])
            data.seek(offset)
            arr = np.frombuffer(data.read(nbytes), dtype="<f4").astype(np.float64).reshape(npts, 2)
            out.append((typ, south, north, arr))
    return out


def boundaries(name, res, bbox=None, types=None):
    """bbox = (lon_min, lat_min, lon_max, lat_max). Returns list of (type, Nx2 lon/lat)."""
    res_list = []
    for typ, south, north, arr in _read_all(name, res):
        if types is not None and typ not in types:
            continue
        if bbox is not None:
            if north < bbox[1] or south > bbox[3]:
                continue
            lo, hi = arr[:, 0].min(), arr[:, 0].max()
            if hi < bbox[0] or lo > bbox[2]:
                continue
        res_list.append((typ, arr))
    return res_list


@lru_cache(maxsize=None)
def towns(min_population=500):
    """GeoNames places (CC BY 4.0) as an (N, 3) array of lat, lon, population."""
    import geonamescache
    d = Path(geonamescache.__file__).parent / "data"
    src = "cities500.json" if min_population < 1000 else "cities1000.json" if min_population < 5000 else "cities5000.json"
    with open(d / src) as f:
        data = json.load(f)
    rows = [(c["latitude"], c["longitude"], c["population"]) for c in data.values()
            if c["population"] >= min_population]
    return np.array(rows, dtype=np.float64)


# --- calibrated equirectangular mapping of the 1672x941 world maps -----------------

def load_calibration():
    with open(CALIBRATION) as f:
        return json.load(f)


def lonlat_to_px(lon, lat, cal=None):
    """Pixel coords in the 1672x941 maps: exact 3-landmark affine inside the local
    (NE North America) box, global cropped-equirectangular fit elsewhere."""
    cal = cal or load_calibration()
    lon = np.asarray(lon, dtype=np.float64)
    lat = np.asarray(lat, dtype=np.float64)
    g, loc = cal["global"], cal["local"]
    bx = loc["bbox"]
    ax, ay = np.array(loc["affine_x"]), np.array(loc["affine_y"])
    inside = (lon >= bx[0]) & (lon <= bx[2]) & (lat >= bx[1]) & (lat <= bx[3])
    x = np.where(inside, ax[0] * lon + ax[1] * lat + ax[2], g["a"] * lon + g["b"])
    y = np.where(inside, ay[0] * lon + ay[1] * lat + ay[2], g["c"] * lat + g["d"])
    return x, y


def px_to_lonlat(x, y, fit):
    return (np.asarray(x) - fit["b"]) / fit["a"], (np.asarray(y) - fit["d"]) / fit["c"]
