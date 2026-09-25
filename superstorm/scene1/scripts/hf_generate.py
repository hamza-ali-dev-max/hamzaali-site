"""Seedance 2.5 clips for scene 1 through the Higgsfield API. Spends credits ONLY with --go.

  python3 hf_generate.py plan                  -> clip list, prices, total (no network)
  python3 hf_generate.py run C1 [C2 ...] --go  -> upload the start image, submit, poll, download,
                                                  log every request to production_log.csv
  python3 hf_generate.py status REQUEST_ID     -> poll one request (free)

API (api.higgsfield.ai): POST /bytedance/seedance-2.5/{text-to-video|image-to-video} ->
{request_id, status_url}; poll status_url until completed/failed/nsfw/canceled; result at
video.url. Start images: POST /files/generate-upload-url -> PUT to the returned URL -> the
public_url is the image_url. Auth: the cloud environment's proxy injects the Authorization
header; locally HF_KEY ("KEY_ID:KEY_SECRET") is used if set. Keys are never printed or logged.
Price (token-metered): $0.206/s at 480p, $0.462/s at 720p.
"""
import argparse
import csv
import json
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

import requests

from geo import ROOT

API = "https://api.higgsfield.ai"
MODEL = "bytedance/seedance-2.5"
PRICE = {"480p": 0.206, "720p": 0.462}
LOG = ROOT / "production_log.csv"
CLIPS_DIR = ROOT / "build" / "clips"
NO_TEXT = "no text, no captions, no labels, no logos, no watermarks"

CLIPS = {   # first batch of the $21 plan (see CLIP_PLAN.md); the rest is added chapter by chapter
    "X1": dict(kind="image-to-video", duration=5, resolution="480p", audio=False,
               start=ROOT / "build" / "zooms" / "london" / "seedance_start.png",
               use="London incident: the map zoom hands over to the real city",
               prompt="The glowing night map of city lights seen from high above becomes a real photographic aerial "
                      "view of London at night as the camera keeps descending: the River Thames with its bridges, "
                      "streets of warm orange streetlights, car headlights moving, a faint red aurora glow in the "
                      "sky, then whole neighbourhoods of lights go out one after another. Smooth steady descent, "
                      "realistic, cinematic, " + NO_TEXT + "."),
    "M1": dict(kind="text-to-video", duration=5, resolution="480p", audio=True,
               use="Montreal reporter, lip-sync test (checkpoint 4)",
               prompt="Night on a downtown street in a large North American city during a total blackout, only phone "
                      "flashlights and car headlights, people in winter coats on the sidewalks looking up, vivid green "
                      "and magenta aurora above the buildings. A female TV news reporter in a dark winter jacket holds "
                      "a plain microphone and speaks urgently to the camera: \"I'm in downtown Montreal. A minute ago, "
                      "every light in the city went out.\" Handheld news camera, realistic, 16:9, " + NO_TEXT + "."),
    "M2": dict(kind="text-to-video", duration=4, resolution="480p", audio=False,
               use="Montreal crowd insert",
               prompt="Night, a crowd of people in winter coats standing in a dark city street looking up in awe at a "
                      "vivid green and magenta aurora above the skyline, phone screens glowing in their hands, no "
                      "electric lights anywhere, realistic, handheld, cinematic, " + NO_TEXT + "."),
}


def cost(c):
    return round(PRICE[c["resolution"]] * c["duration"], 2)


def session():
    s = requests.Session()
    s.headers["Content-Type"] = "application/json"
    key = os.environ.get("HF_KEY")
    if key:                                   # local runs; in the cloud VM the proxy injects it
        s.headers["Authorization"] = f"Key {key}"
    return s


def log_row(**kw):
    new = not LOG.exists() or LOG.stat().st_size == 0
    cols = ["timestamp_utc", "service", "model", "request_id", "asset", "prompt_or_text", "voice", "duration_s",
            "resolution", "generate_audio", "credit_cost", "status", "notes"]
    with LOG.open("a", newline="") as f:
        w = csv.DictWriter(f, cols)
        if new:
            w.writeheader()
        w.writerow({c: kw.get(c, "") for c in cols})


def upload(s, path):
    ctype = "image/png" if str(path).endswith(".png") else "image/jpeg"
    r = s.post(f"{API}/files/generate-upload-url", json={"content_type": ctype}, timeout=60)
    r.raise_for_status()
    u = r.json()
    put = requests.put(u["upload_url"], data=Path(path).read_bytes(), headers=u.get("upload_headers", {"Content-Type": ctype}),
                       timeout=300)
    put.raise_for_status()
    return u["public_url"]


def last_frame(mp4, out_png):
    import subprocess
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-sseof", "-0.1", "-i", str(mp4), "-frames:v", "1", str(out_png)],
                   check=True)
    return out_png


def poll(s, status_url, every=10, limit=1800):
    t0 = time.time()
    while True:
        r = s.get(status_url, timeout=60)
        r.raise_for_status()
        d = r.json()
        st = d.get("status")
        if st in ("completed", "failed", "nsfw", "canceled"):
            return d
        if time.time() - t0 > limit:
            return d
        time.sleep(every)


def run(ids, go):
    if not go:
        sys.exit("refusing to spend credits without --go (owner approval at checkpoint 3)")
    s = session()
    CLIPS_DIR.mkdir(parents=True, exist_ok=True)
    total = 0.0
    for cid in ids:
        c = CLIPS[cid]
        body = {"prompt": c["prompt"], "duration": c["duration"], "resolution": c["resolution"],
                "generate_audio": c["audio"]}
        if c["kind"] == "text-to-video":
            body["aspect_ratio"] = "16:9"
        else:
            start = c["start"]
            if isinstance(start, str) and start.startswith("last:"):
                start = last_frame(CLIPS_DIR / f"{start[5:]}.mp4", CLIPS_DIR / f"{start[5:]}_last.png")
            body["image_url"] = upload(s, start)
        r = s.post(f"{API}/{MODEL}/{c['kind']}", json=body, timeout=120)
        if r.status_code >= 400:
            log_row(timestamp_utc=now(), service="higgsfield", model=f"{MODEL}/{c['kind']}", asset=cid,
                    prompt_or_text=c["prompt"], duration_s=c["duration"], resolution=c["resolution"],
                    generate_audio=c["audio"], credit_cost=0, status=f"rejected {r.status_code}", notes=r.text[:300])
            print(cid, "rejected", r.status_code, r.text[:300])
            continue
        sub = r.json()
        rid = sub.get("request_id")
        print(cid, "submitted", rid, flush=True)
        d = poll(s, sub.get("status_url") or f"{API}/requests/{rid}/status")
        st = d.get("status")
        url = (d.get("video") or {}).get("url", "")
        note = url
        if st == "completed" and url:
            try:
                v = requests.get(url, timeout=600)
                v.raise_for_status()
                (CLIPS_DIR / f"{cid}.mp4").write_bytes(v.content)
                note = f"saved build/clips/{cid}.mp4"
            except requests.RequestException as e:
                note = f"download failed ({type(e).__name__}): {url}"
        spent = cost(c) if st == "completed" else 0.0
        total += spent
        log_row(timestamp_utc=now(), service="higgsfield", model=f"{MODEL}/{c['kind']}", request_id=rid, asset=cid,
                prompt_or_text=c["prompt"], duration_s=c["duration"], resolution=c["resolution"],
                generate_audio=c["audio"], credit_cost=f"${spent:.2f}", status=st, notes=note)
        print(cid, st, note, flush=True)
    print(f"spent this run: ${total:.2f}")


def now():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def plan():
    tot = 0.0
    for cid, c in CLIPS.items():
        tot += cost(c)
        print(f"{cid:3} {c['kind']:15} {c['resolution']} {c['duration']:>3} s audio={'on ' if c['audio'] else 'off'} "
              f"${cost(c):5.2f}  {c['use']}")
    print(f"batch total ${tot:.2f} of the $21 budget")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("cmd", choices=["plan", "run", "status"])
    ap.add_argument("ids", nargs="*")
    ap.add_argument("--go", action="store_true", help="owner approved the spend")
    a = ap.parse_args()
    if a.cmd == "plan":
        plan()
    elif a.cmd == "status":
        print(json.dumps(session().get(f"{API}/requests/{a.ids[0]}/status", timeout=60).json(), indent=2))
    else:
        run(a.ids, a.go)
