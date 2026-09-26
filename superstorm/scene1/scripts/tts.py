"""Scene-1 voices with ElevenLabs (checkpoint 2). Every call is logged to production_log.csv.

  python3 tts.py check                 -> free: subscription/credits + models (verifies the key)
  python3 tts.py voices                -> free: the account's voices with labels, to pick from
  python3 tts.py lines                 -> the scene-1 lines and character count (no network)
  python3 tts.py say NARR1 GRID ...    -> synthesize (spends characters) -> build/audio/vo/*.wav
      [--voice ROLE=VOICE_ID ...] [--model eleven_v3] [--tag alt]  (--tag saves <ID>_<tag>.wav)
  python3 tts.py sts SRC.wav ROLE NAME -> re-voice a recording into ROLE's voice, same timing
      (speech-to-speech; spends credits by duration) -> build/audio/vo/NAME.wav. Used to give the
      Seedance reporter (M1, lips synced to Seedance's own voice) the GNN voice of the TTS lines.

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

# role -> (voice id, voice name, voice settings). Casting from the account's voices (`tts.py voices`).
# Eleven v3 takes stability 0.0 (creative) / 0.5 (natural) / 1.0 (robust) only, and no style.
ROLES = {
    "NARR": ("nPczCjzI2devNBz1zQrb", "Brian - deep, resonant", dict(stability=0.5, similarity_boost=0.8)),
    "GRID": ("iP95p4xoKVk53GoZ742B", "Chris - down-to-earth", dict(stability=0.0, similarity_boost=0.75)),
    "GNN": ("EXAVITQu4vr4xnSDxMaL", "Sarah - mature, confident", dict(stability=0.5, similarity_boost=0.8)),
}

LINES = {  # id: (role, scene time s (timeline.VO), text) - Eleven v3 audio tags in [brackets]
    "NARR1": ("NARR", 4.4, "Hour seventeen. Right on schedule, the storm arrives. Across the northern sky, "
                           "auroras flare brighter than anyone alive has ever seen."),
    "NARR2": ("NARR", 13.95, "And the first place to feel it... [pause] is Quebec."),
    "NARR3": ("NARR", 17.9, "Its power grid runs across ancient bedrock that can't absorb the surge. In 1989, a storm "
                            "a fraction of this size took this grid down in ninety seconds. [pause] Tonight... it takes nine."),
    "GRID": ("GRID", 42.2, "[urgent] Grid Control to all stations... we've lost the northern lines. Multiple transformer "
                           "trips... Montreal is down. I repeat, we are losing the network... we are losing the"),
    # first two sentences = the words the Seedance reporter (M1) speaks on camera
    "GNN": ("GNN", 53.2, "[urgent] I'm in downtown Montreal. A minute ago, every light in the city went out. "
                         "People are pouring into the streets... and above us, you can see it, the whole sky is green. "
                         "We're hearing the entire province may be without power."),
    "NARR4": ("NARR", 67.4, "Nine million people. [pause] In the dark. [pause] And the storm is only getting started."),
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
    r = s.get(API + "/v1/user/subscription", timeout=60)
    if r.ok:
        sub = r.json()
        print(f"tier {sub.get('tier')}: {sub.get('character_count')} / {sub.get('character_limit')} characters used")
    else:                                      # restricted keys may lack user_read; TTS still works
        print(f"subscription not readable with this key (HTTP {r.status_code})")
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


FORMAT = "mp3_44100_192"                   # best format on the Creator tier (pcm_44100 needs Pro)


def mp3_to_wav(mp3, wav):
    raw = wav.with_suffix(".mp3")
    raw.write_bytes(mp3)
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(raw), "-ac", "1", "-ar", "48000",
                    "-c:a", "pcm_s24le", str(wav)], check=True)
    raw.unlink()
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(wav)],
                       capture_output=True, text=True, check=True)
    return float(r.stdout)


def say(ids, voice_map, model, tag=""):
    s = session()
    OUT.mkdir(parents=True, exist_ok=True)
    for lid in ids:
        role, t0, text = LINES[lid]
        vid = voice_map.get(role, ROLES[role][0])
        body = {"text": text, "model_id": model, "voice_settings": ROLES[role][2]}
        r = s.post(f"{API}/v1/text-to-speech/{vid}?output_format={FORMAT}", json=body, timeout=300)
        now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        rid = r.headers.get("request-id", "")
        chars = r.headers.get("x-character-count", str(len(text)))
        if r.status_code >= 400:
            log_row(timestamp_utc=now, service="elevenlabs", model=model, request_id=rid, asset=lid, prompt_or_text=text,
                    voice=vid, credit_cost=0, status=f"error {r.status_code}", notes=r.text[:300])
            print(lid, "error", r.status_code, r.text[:300])
            continue
        name = f"{lid}_{tag}" if tag else lid
        wav = OUT / f"{name}.wav"
        dur = mp3_to_wav(r.content, wav)
        log_row(timestamp_utc=now, service="elevenlabs", model=model, request_id=rid, asset=name, prompt_or_text=text,
                voice=vid, duration_s=f"{dur:.2f}", credit_cost=f"{chars} chars", status="ok",
                notes=f"build/audio/vo/{name}.wav, scene time {t0} s")
        print(f"{name}: {dur:.2f} s, {chars} characters -> {wav}")


def sts(src, role, name, model="eleven_english_sts_v2"):
    """Speech-to-speech: keeps the source's timing (so on-screen lips still match), swaps the voice."""
    s = session()
    OUT.mkdir(parents=True, exist_ok=True)
    vid = ROLES[role][0]
    with open(src, "rb") as f:
        r = s.post(f"{API}/v1/speech-to-speech/{vid}?output_format={FORMAT}", timeout=300,
                   files={"audio": (os.path.basename(src), f, "audio/wav")},
                   data={"model_id": model, "remove_background_noise": "true",
                         "voice_settings": json.dumps(ROLES[role][2])})
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    rid = r.headers.get("request-id", "")
    if r.status_code >= 400:
        log_row(timestamp_utc=now, service="elevenlabs", model=model, request_id=rid, asset=name,
                prompt_or_text=f"speech-to-speech of {src}", voice=vid, credit_cost=0, status=f"error {r.status_code}",
                notes=r.text[:300])
        sys.exit(f"{name}: error {r.status_code} {r.text[:300]}")
    wav = OUT / f"{name}.wav"
    dur = mp3_to_wav(r.content, wav)
    chars = r.headers.get("x-character-count", "")
    log_row(timestamp_utc=now, service="elevenlabs", model=model, request_id=rid, asset=name,
            prompt_or_text=f"speech-to-speech of {os.path.relpath(src, ROOT)}", voice=vid, duration_s=f"{dur:.2f}",
            credit_cost=f"{chars} chars" if chars else "by duration", status="ok", notes=f"build/audio/vo/{name}.wav")
    print(f"{name}: {dur:.2f} s -> {wav}")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("cmd", choices=["check", "voices", "lines", "say", "sts"])
    ap.add_argument("ids", nargs="*")
    ap.add_argument("--voice", action="append", default=[], help="ROLE=VOICE_ID")
    ap.add_argument("--model", default="eleven_v3")
    ap.add_argument("--tag", default="")
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
    elif a.cmd == "sts":
        sts(*a.ids)
    else:
        vm = dict(v.split("=", 1) for v in a.voice)
        say(a.ids or list(LINES), vm, a.model, a.tag)
