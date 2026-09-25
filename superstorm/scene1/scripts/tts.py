"""Scene-1 voices with ElevenLabs (checkpoint 2). Every call is logged to production_log.csv.

  python3 tts.py check                 -> free: subscription/credits + models (verifies the key)
  python3 tts.py voices                -> free: the account's voices with labels, to pick from
  python3 tts.py lines                 -> the scene-1 lines and character count (no network)
  python3 tts.py say NARR1 GRID ...    -> synthesize (spends characters) -> build/audio/vo/*.wav
      [--voice ROLE=VOICE_ID ...] [--model eleven_v3]

The GRID take then goes through radio_fx.py (band-pass, squelch, static burst that cuts the
last word): python3 radio_fx.py ../build/audio/vo/GRID.wav ../build/audio/grid_radio.wav --cut <s>

Auth: in the cloud VM the proxy injects xi-api-key; locally ELEVENLABS_API_KEY is used if set.
Keys are never printed or logged.
"""
import argparse
import csv
import json
import os
import subprocess
import sys
from datetime import datetime, timezone

import requests

from geo import ROOT

API = "https://api.elevenlabs.io"
LOG = ROOT / "production_log.csv"
OUT = ROOT / "build" / "audio" / "vo"

# role -> (default voice search words, voice settings); the voice id is chosen with `voices`
ROLES = {
    "NARR": ("deep calm male documentary narrator", dict(stability=0.55, similarity_boost=0.8, style=0.25)),
    "GRID": ("tense male dispatcher radio", dict(stability=0.35, similarity_boost=0.75, style=0.55)),
    "GNN": ("female news reporter", dict(stability=0.45, similarity_boost=0.8, style=0.4)),
}

LINES = {  # id: (role, scene time s, text) - Eleven v3 audio tags in [brackets]
    "NARR1": ("NARR", 4.6, "Hour seventeen. Right on schedule, the storm arrives. Across the northern sky, "
                           "auroras flare brighter than anyone alive has ever seen."),
    "NARR2": ("NARR", 13.4, "And the first place to feel it... [pause] is Quebec."),
    "NARR3": ("NARR", 20.5, "Its power grid runs across ancient bedrock that can't absorb the surge. In 1989, a storm "
                            "a fraction of this size took this grid down in ninety seconds. [pause] Tonight... it takes nine."),
    "GRID": ("GRID", 42.2, "[urgent] Grid Control to all stations... we've lost the northern lines. Multiple transformer "
                           "trips... Montreal is down. I repeat, we are losing the network... we are losing the"),
    "GNN": ("GNN", 50.0, "I'm in downtown Montreal, where just a minute ago every light in the city went out at once. "
                         "People are pouring into the streets... and above us, you can see it, the whole sky is green. "
                         "We're hearing the entire province may be without power."),
    "NARR4": ("NARR", 65.6, "Nine million people. [pause] In the dark. [pause] And the storm is only getting started."),
}


def session():
    s = requests.Session()
    key = os.environ.get("ELEVENLABS_API_KEY")
    if key:                                    # local runs; in the cloud VM the proxy injects it
        s.headers["xi-api-key"] = key
    return s


def get(s, path):
    r = s.get(API + path, timeout=60)
    if r.status_code >= 400:
        sys.exit(f"{path}: HTTP {r.status_code} {r.text[:300]}")
    return r.json()


def check():
    s = session()
    sub = get(s, "/v1/user/subscription")
    print(f"tier {sub.get('tier')}: {sub.get('character_count')} / {sub.get('character_limit')} characters used")
    for m in get(s, "/v1/models"):
        if m.get("can_do_text_to_speech"):
            print(f"  {m['model_id']:32} {m.get('name')}")


def voices():
    for v in get(session(), "/v1/voices").get("voices", []):
        lab = ", ".join(f"{k}={w}" for k, w in (v.get("labels") or {}).items())
        print(f"{v['voice_id']}  {v['name']:24} {v.get('category', ''):10} {lab}")


def log_row(**kw):
    new = not LOG.exists() or LOG.stat().st_size == 0
    cols = ["timestamp_utc", "service", "model", "request_id", "asset", "prompt_or_text", "voice", "duration_s",
            "resolution", "generate_audio", "credit_cost", "status", "notes"]
    with LOG.open("a", newline="") as f:
        w = csv.DictWriter(f, cols)
        if new:
            w.writeheader()
        w.writerow({c: kw.get(c, "") for c in cols})


def say(ids, voice_map, model):
    s = session()
    OUT.mkdir(parents=True, exist_ok=True)
    for lid in ids:
        role, t0, text = LINES[lid]
        vid = voice_map.get(role)
        if not vid:
            sys.exit(f"no voice for {role}: pass --voice {role}=VOICE_ID (see `tts.py voices`)")
        body = {"text": text, "model_id": model, "voice_settings": ROLES[role][1]}
        r = s.post(f"{API}/v1/text-to-speech/{vid}?output_format=pcm_44100", json=body, timeout=300)
        now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        rid = r.headers.get("request-id", "")
        chars = r.headers.get("x-character-count", str(len(text)))
        if r.status_code >= 400:
            log_row(timestamp_utc=now, service="elevenlabs", model=model, request_id=rid, asset=lid, prompt_or_text=text,
                    voice=vid, credit_cost=0, status=f"error {r.status_code}", notes=r.text[:300])
            print(lid, "error", r.status_code, r.text[:300])
            continue
        raw = OUT / f"{lid}.pcm"
        raw.write_bytes(r.content)
        wav = OUT / f"{lid}.wav"
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "s16le", "-ar", "44100", "-ac", "1", "-i", str(raw),
                        "-ar", "48000", "-c:a", "pcm_s24le", str(wav)], check=True)
        raw.unlink()
        dur = len(r.content) / 2 / 44100
        log_row(timestamp_utc=now, service="elevenlabs", model=model, request_id=rid, asset=lid, prompt_or_text=text,
                voice=vid, duration_s=f"{dur:.2f}", credit_cost=f"{chars} chars", status="ok",
                notes=f"build/audio/vo/{lid}.wav, scene time {t0} s")
        print(f"{lid}: {dur:.2f} s, {chars} characters -> {wav}")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("cmd", choices=["check", "voices", "lines", "say"])
    ap.add_argument("ids", nargs="*")
    ap.add_argument("--voice", action="append", default=[], help="ROLE=VOICE_ID")
    ap.add_argument("--model", default="eleven_v3")
    a = ap.parse_args()
    if a.cmd == "check":
        check()
    elif a.cmd == "voices":
        voices()
    elif a.cmd == "lines":
        n = 0
        for k, (role, t0, text) in LINES.items():
            n += len(text)
            print(f"{k:6} {role:5} @{t0:5.1f}s  {len(text):4} ch  {text}")
        print(f"total {n} characters")
    else:
        vm = dict(v.split("=", 1) for v in a.voice)
        say(a.ids or list(LINES), vm, a.model)
