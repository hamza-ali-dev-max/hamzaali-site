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
