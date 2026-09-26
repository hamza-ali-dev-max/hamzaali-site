"""Seedance 2.5 clips for scene 1 through the Higgsfield API. Spends credits ONLY with --go.

  python3 hf_generate.py plan                  -> clip list, prices, total (no network)
  python3 hf_generate.py run C1 [C2 ...] --go  -> upload the start image, submit, poll, download,
                                                  log every request to production_log.csv
  python3 hf_generate.py status REQUEST_ID     -> one status check (free)
  python3 hf_generate.py poll X1=REQUEST_ID    -> wait for an already-submitted request, download, log

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

# ---- batch 2: the rest of the $21 plan (owner "go all"); prompts carry the batch-1 lessons:
# no logos on microphones/clothes/vehicles, and blackout scenes are genuinely dark.
PEOPLE_END = ", realistic, handheld, cinematic, 16:9, no logos on clothing, microphones or vehicles, " + NO_TEXT + "."
HANDOFF = ("The glowing night map of city lights seen from high above becomes a real photographic aerial view of {city} "
           "as the camera keeps descending: {what}. Smooth steady descent, realistic, cinematic, " + NO_TEXT + ".")
ZOOMS = ROOT / "build" / "zooms"


def _p(prompt, dur=4, use=""):
    return dict(kind="text-to-video", duration=dur, resolution="480p", audio=False, use=use, prompt=prompt + PEOPLE_END)


def _h(city_dir, city, what, use):
    return dict(kind="image-to-video", duration=5, resolution="480p", audio=False, use=use,
                start=ZOOMS / city_dir / "seedance_start.png", prompt=HANDOFF.format(city=city, what=what))


CLIPS.update({
    "B1": _p("Night shift in a dim space-weather operations room: forecasters at desks facing a wall of monitors that show "
             "glowing orange images of the Sun, one forecaster slowly stands up staring at a screen, the others turn around, tense",
             use="ch1 Boulder: X-ray flux off the scale (reused for the ch3 Bz beat)"),
    "B2": _p("An airliner cockpit in bright daylight over the ocean, two pilots in plain uniforms, the first officer presses "
             "the radio button, listens, frowns and tries again, nothing but static", use="ch1 North Atlantic: HF radio dead"),
    "B3": _p("Inside a space station, astronauts in plain clothes float quickly one after another through a round hatch into "
             "a narrow shielded module, amber emergency lighting, urgent but calm", use="ch1 orbit: crew to the shielded module"),
    "T2": _h("tokyo", "Tokyo at night", "dense towers, elevated expressways with streams of car lights, trains, and a huge "
             "scramble crossing full of people under giant glowing video screens with no readable text",
             use="ch2 Tokyo 21:00: the zoom hands over to the real city"),
    "T3": _p("Night at a huge Tokyo scramble crossing: the crowd stops and looks up at giant video screens with no readable "
             "text, faces lit by the screens, people raising their phones", use="ch2 Tokyo: crowds stop for the warning"),
    "N1": _p("Early morning in New York in winter, a long line of people in coats outside a hardware store, people carrying "
             "packs of bottled water and boxes, steam from street vents, taxis passing", use="ch2 New York: queues"),
    "N2": _h("new_york", "Manhattan at night", "skyscrapers, avenues full of car headlights, a faint green aurora in the "
             "sky, then block after block of the city's lights go dark", use="ch4 New York 23:16: Manhattan goes dark"),
    "L2": _p("Before dawn on a completely dark London street with no streetlights and no lit windows, a British TV reporter "
             "in a dark coat holds a plain black microphone and looks up; behind her people in coats stand in the road "
             "under a deep red aurora, lit only by phone torches", use="ch4 London 04:21: reporter (voice-over)"),
    "N3": _p("Passengers walking in a long line through a dark subway tunnel lit only by phone flashlights, stepping "
             "carefully beside the rails, a stopped train behind them", use="ch5 New York: stuck subway"),
    "P1": _p("Dawn in Paris in winter, crowds of commuters walking across a bridge over the Seine, no cars, the traffic "
             "lights dark, grey light", use="ch5 Paris: no Metro, everyone walks"),
    "N4": _p("Grey daylight on a New York street in winter, people filling buckets and plastic bottles from an open fire "
             "hydrant while neighbours wait in line", use="ch6 New York: no water above floor 6"),
    "L3": _p("A hospital corridor lit only by dim emergency lights, nurses working with head torches, a patient on a "
             "trolley, calm but strained", use="ch6 London: hospital on diesel"),
    "G1": _p("Daytime in a busy Lagos street market, shops and stalls running on small petrol generators, people buying, "
             "talking and laughing in bright sun", use="ch6 Lagos: business as usual"),
    "V1": _p("A snowy highway in winter: a long convoy of fuel tanker trucks escorted by plain military vehicles, soldiers "
             "in winter uniforms at a checkpoint waving them through", use="ch7 USA: guarded fuel convoy"),
    "R1": _p("A huge port crane slowly lifting an enormous electrical power transformer onto a cargo ship, port workers in "
             "hi-vis jackets watching, grey daylight", use="ch7 Rotterdam: the transformer race"),
    "W1": _p("A snowy farm in winter, a farmer pours milk from a large steel container into a ditch next to a red barn, "
             "cows visible inside", use="ch7 Wisconsin: milk dumped"),
    "M3": _p("At dusk on a snowy Montreal street, the streetlights and shop lights flicker back on and people in winter "
             "coats cheer and hug", use="ch8 Montreal: the lights come back"),
    "S1": _h("stockholm", "Stockholm at night in winter", "islands and bridges, snow, trams and cars moving, a huge green "
             "aurora filling the sky, then the city lights go out", use="ch4 Stockholm 05:24: aurora overhead"),
})



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


def poll(s, rid, every=10, limit=1800):
    """Poll through api.higgsfield.ai (the status_url the API returns points at
    platform.higgsfield.ai, which this environment's network policy blocks)."""
    t0 = time.time()
    while True:
        try:
            r = s.get(f"{API}/requests/{rid}/status", timeout=60)
            r.raise_for_status()
            d = r.json()
        except (requests.RequestException, ValueError) as e:
            d = {"status": f"poll error ({type(e).__name__})"}
        st = d.get("status")
        if st in ("completed", "failed", "nsfw", "canceled"):
            return d
        if time.time() - t0 > limit:
            return d
        time.sleep(every)


def finish(s, cid, rid, c):
    """Wait for a submitted request, try to download it, log the outcome; returns $ spent."""
    d = poll(s, rid)
    st = d.get("status")
    url = (d.get("video") or {}).get("url", "")
    note = url or str(d)[:300]
    if st == "completed" and url:
        try:
            v = requests.get(url, timeout=600)
            v.raise_for_status()
            (CLIPS_DIR / f"{cid}.mp4").write_bytes(v.content)
            note = f"saved build/clips/{cid}.mp4 ({url})"
        except requests.RequestException as e:
            note = f"download blocked/failed ({type(e).__name__}); result at {url}"
    spent = cost(c) if st == "completed" else 0.0
    log_row(timestamp_utc=now(), service="higgsfield", model=f"{MODEL}/{c['kind']}", request_id=rid, asset=cid,
            prompt_or_text=c["prompt"], duration_s=c["duration"], resolution=c["resolution"],
            generate_audio=c["audio"], credit_cost=f"${spent:.2f}", status=st, notes=note)
    print(cid, st, note, flush=True)
    return spent


def run(ids, go):
    if not go:
        sys.exit("refusing to spend credits without --go (owner approval at checkpoint 3)")
    s = session()
    CLIPS_DIR.mkdir(parents=True, exist_ok=True)
    submitted = []
    for cid in ids:                                    # submit everything first (they render in parallel)
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
        rid = r.json().get("request_id")
        log_row(timestamp_utc=now(), service="higgsfield", model=f"{MODEL}/{c['kind']}", request_id=rid, asset=cid,
                prompt_or_text=c["prompt"], duration_s=c["duration"], resolution=c["resolution"],
                generate_audio=c["audio"], credit_cost=f"(est ${cost(c):.2f})", status="submitted")
        print(cid, "submitted", rid, flush=True)
        submitted.append((cid, rid))
    total = sum(finish(s, cid, rid, CLIPS[cid]) for cid, rid in submitted)
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
    ap.add_argument("cmd", choices=["plan", "run", "status", "poll"])
    ap.add_argument("ids", nargs="*")
    ap.add_argument("--go", action="store_true", help="owner approved the spend")
    a = ap.parse_args()
    if a.cmd == "plan":
        plan()
    elif a.cmd == "status":
        print(json.dumps(session().get(f"{API}/requests/{a.ids[0]}/status", timeout=60).json(), indent=2))
    elif a.cmd == "poll":                             # poll ASSET=REQUEST_ID ... already submitted, log the outcome
        CLIPS_DIR.mkdir(parents=True, exist_ok=True)
        s = session()
        print(f"spent: ${sum(finish(s, *p.split('='), CLIPS[p.split('=')[0]]) for p in a.ids):.2f}")
    else:
        run(a.ids, a.go)
