#!/usr/bin/env python3
"""Retime an external Somali narration (e.g. Edge/Azure so-SO-MuuseNeural) that has
no word timestamps, and estimate word timings for captions and beats.

usage: align_external.py <in.mp3> <script-somali.json> <out.mp3> <timing.json>
                         [scene_gap] [inner_gap] [lead] [tempo]

1. Long pauses (>=0.6s) split the audio into chunks: one per sentence, where each
   script line is split again after internal . ! ? (the narrator pauses there too).
2. Chunks are re-joined with `scene_gap` between script lines (= scene cuts) and
   `inner_gap` between sentences of the same line, then tempo + loudnorm.
3. Inside a chunk, short breath pauses anchor the , : phrase breaks; words inside a
   phrase are spread by a syllable weight (vowel nuclei, long vowels count more).
"""
import json
import re
import subprocess
import sys

src, script_path, out_mp3, out_json = sys.argv[1:5]
SCENE_GAP, INNER_GAP, LEAD, TEMPO = (float(x) for x in (sys.argv[5:9] + ["0.75", "0.45", "0.3", "1.0"][len(sys.argv[5:9]):]))
SR = 44100


def silences(path, db, dur, ss=None, to=None):
    cmd = ["ffmpeg", "-hide_banner"]
    if ss is not None:
        cmd += ["-ss", str(ss), "-to", str(to)]
    cmd += ["-i", path, "-af", f"silencedetect=n={db}dB:d={dur}", "-f", "null", "-"]
    err = subprocess.run(cmd, capture_output=True, text=True).stderr
    st = [float(x) for x in re.findall(r"silence_start: (-?[\d.]+)", err)]
    en = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", err)]
    off = ss or 0.0
    return [(max(0.0, a) + off, b + off) for a, b in zip(st, en)]


def duration(path):
    return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path], capture_output=True, text=True).stdout)


lines = json.load(open(script_path))
chunks = []  # (line_idx, text)
for li, ln in enumerate(lines):
    for part in re.split(r"(?<=[.!?])\s+", ln["text"].strip()):
        chunks.append((li, part))

total = duration(src)
# sentence pauses: take the longest pauses (>=0.3s) that match the sentence count,
# kept in time order; short ?/! pauses from the TTS still count this way
cands = [s for s in silences(src, -35, 0.3) if s[0] > 0.05 and s[1] < total - 0.05]
if len(cands) < len(chunks) - 1:
    sys.exit(f"expected {len(chunks) - 1} sentence pauses, found {len(cands)}: {cands}")
long_sil = sorted(sorted(cands, key=lambda p: p[1] - p[0])[-(len(chunks) - 1):])

# speech bounds per chunk
bounds = []
for k in range(len(chunks)):
    a = 0.0 if k == 0 else long_sil[k - 1][1]
    b = total if k == len(chunks) - 1 else long_sil[k][0]
    edge = silences(src, -40, 0.05, a, b)
    if edge and edge[0][0] <= a + 0.01:
        a = edge[0][1]
    if edge and edge[-1][1] >= b - 0.01:
        b = edge[-1][0]
    bounds.append((a, b))


def weight(word):
    """Rough spoken length: vowel nuclei (long vowels count more); acronyms like
    SPF / UV are spelled out, so each capital letter counts as a syllable."""
    caps = re.match(r"[A-Z]{2,}", word)
    rest = word[caps.end():] if caps else word
    w = rest.lower().strip(".,:;!?-")
    nuclei = re.findall(r"[aeiou]+", w)
    return 0.35 + (1.1 * len(caps.group()) if caps else 0) + sum(1.0 if len(n) == 1 else 1.5 for n in nuclei)


def align_chunk(text, a, b):
    words = text.split()
    # phrase breaks after words ending in , : or ;
    brk = [i for i, w in enumerate(words[:-1]) if w[-1] in ",:;"]
    pauses = [p for p in silences(src, -32, 0.1, a, b) if p[0] > a + 0.05 and p[1] < b - 0.05]
    if len(pauses) > len(brk) and brk:
        # keep, for each break, the unused pause nearest where the syllable weights put it
        tot = sum(weight(w) for w in words)
        picked = []
        for i in brk:
            expect = a + (b - a) * sum(weight(w) for w in words[: i + 1]) / tot
            best = min((p for p in pauses if p not in picked), key=lambda p: abs((p[0] + p[1]) / 2 - expect))
            picked.append(best)
        pauses = sorted(picked)
    phrases, spans = [], []
    if brk and len(pauses) == len(brk):
        starts = [0] + [i + 1 for i in brk]
        ends = brk + [len(words) - 1]
        t0 = [a] + [p[1] for p in pauses]
        t1 = [p[0] for p in pauses] + [b]
        for s, e, x, y in zip(starts, ends, t0, t1):
            phrases.append(words[s : e + 1])
            spans.append((x, y))
    else:
        phrases, spans = [words], [(a, b)]
    out = []
    for ph, (x, y) in zip(phrases, spans):
        ws = [weight(w) for w in ph]
        tot, acc = sum(ws), 0.0
        for w, wt in zip(ph, ws):
            s = x + (y - x) * acc / tot
            acc += wt
            out.append({"w": w, "s": s, "e": x + (y - x) * acc / tot})
    return out


# rebuild the narration with controlled gaps
subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "lavfi", "-i", f"anullsrc=r={SR}:cl=mono", "-t", str(LEAD), "/tmp/_lead.wav"])
parts, t, new_start = ["/tmp/_lead.wav"], LEAD, []
for k, (a, b) in enumerate(bounds):
    seg = f"/tmp/_seg{k}.wav"
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", src, "-ss", str(max(0, a - 0.03)), "-to", str(b + 0.06), "-ar", str(SR), "-ac", "1", seg])
    new_start.append(t - 0.03 if a >= 0.03 else t)
    t += duration(seg)
    parts.append(seg)
    if k < len(bounds) - 1:
        gap = SCENE_GAP if chunks[k + 1][0] != chunks[k][0] else INNER_GAP
        gp = f"/tmp/_gap{k}.wav"
        subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "lavfi", "-i", f"anullsrc=r={SR}:cl=mono", "-t", str(gap), gp])
        parts.append(gp)
        t += gap
open("/tmp/_list.txt", "w").write("".join(f"file '{p}'\n" for p in parts))
subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", "/tmp/_list.txt", "-af", f"atempo={TEMPO},loudnorm=I=-15:TP=-1.5:LRA=9", "-ar", str(SR), "-ac", "2", "-b:a", "192k", out_mp3])


def remap(x, k):
    return round((x - (bounds[k][0] - 0.03 if bounds[k][0] >= 0.03 else bounds[k][0]) + new_start[k]) / TEMPO, 3)


words, scenes = [], {}
for k, (li, text) in enumerate(chunks):
    sid = lines[li]["id"]
    for w in align_chunk(text, *bounds[k]):
        words.append({"scene": sid, "w": w["w"], "s": remap(w["s"], k), "e": remap(w["e"], k)})
    sc = scenes.setdefault(sid, {"id": sid, "text": lines[li]["text"], "s": remap(bounds[k][0], k)})
    sc["e"] = remap(bounds[k][1], k)
json.dump({"scenes": list(scenes.values()), "words": words}, open(out_json, "w"), ensure_ascii=False, indent=1)
for sc in scenes.values():
    print(f"{sc['id']:8} {sc['s']:6.2f} {sc['e']:6.2f}")
print("vo length", round(duration(out_mp3), 2))
