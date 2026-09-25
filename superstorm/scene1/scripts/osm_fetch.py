"""Montreal OSM data for the Blender city.

  python3 osm_fetch.py fetch             -> Overpass API (needs overpass-api.de allowed)
  python3 osm_fetch.py convert file.osm  -> converts a manual openstreetmap.org export

Both write build/osm/montreal.json in Overpass "out geom" JSON form: a list of elements
with tags and geometry (lat/lon lists), which blender_city.py reads.
Box: ~12 km E-W x 10 km N-S centred on downtown (rotation/tilt headroom around the
6 x 6 km core). Data (c) OpenStreetMap contributors, ODbL - credit it in the video.
"""
import json
import sys
import xml.etree.ElementTree as ET

from geo import MONTREAL, ROOT

OUT = ROOT / "build" / "osm" / "montreal.json"
LAT0, LON0 = MONTREAL
HALF_EW_KM, HALF_NS_KM = 6.0, 5.0
KX, KY = 78.03, 111.19          # km per degree at 45.5 N
BBOX = (LAT0 - HALF_NS_KM / KY, LON0 - HALF_EW_KM / KX, LAT0 + HALF_NS_KM / KY, LON0 + HALF_EW_KM / KX)

QUERY = """[out:json][timeout:300][bbox:{s:.5f},{w:.5f},{n:.5f},{e:.5f}];
(
  way["building"];
  relation["building"];
  way["highway"~"^(motorway|trunk|primary|secondary|tertiary|unclassified|residential|living_street|motorway_link|trunk_link|primary_link|secondary_link|tertiary_link|service)$"];
  way["natural"="water"];
  relation["natural"="water"];
  way["waterway"="riverbank"];
  relation["waterway"="riverbank"];
  nwr["amenity"="hospital"];
  way["leisure"="park"];
  relation["leisure"="park"];
);
out geom;""".format(s=BBOX[0], w=BBOX[1], n=BBOX[2], e=BBOX[3])


def fetch():
    import requests
    r = requests.post("https://overpass-api.de/api/interpreter", data={"data": QUERY}, timeout=600)
    r.raise_for_status()
    data = r.json()
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(data))
    print(OUT, len(data.get("elements", [])), "elements")


def convert(path):
    """openstreetmap.org .osm XML -> the same JSON shape (ways + multipolygon outers/inners)."""
    root = ET.parse(path).getroot()
    nodes = {n.get("id"): (float(n.get("lat")), float(n.get("lon"))) for n in root.iter("node")}
    ways, out = {}, []
    for w in root.iter("way"):
        geom = [{"lat": nodes[nd.get("ref")][0], "lon": nodes[nd.get("ref")][1]}
                for nd in w.iter("nd") if nd.get("ref") in nodes]
        tags = {t.get("k"): t.get("v") for t in w.iter("tag")}
        ways[w.get("id")] = geom
        out.append({"type": "way", "id": int(w.get("id")), "tags": tags, "geometry": geom})
    for r in root.iter("relation"):
        tags = {t.get("k"): t.get("v") for t in r.iter("tag")}
        members = [{"type": "way", "role": m.get("role"), "geometry": ways.get(m.get("ref"), [])}
                   for m in r.iter("member") if m.get("type") == "way"]
        out.append({"type": "relation", "id": int(r.get("id")), "tags": tags, "members": members})
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({"elements": out}))
    print(OUT, len(out), "elements")


if __name__ == "__main__":
    if sys.argv[1:2] == ["fetch"]:
        fetch()
    elif sys.argv[1:2] == ["convert"]:
        convert(sys.argv[2])
    else:
        print(QUERY)
