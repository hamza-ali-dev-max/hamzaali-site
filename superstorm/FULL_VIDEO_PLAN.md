# "I Simulated a Hyper Realistic Solar Superstorm, Day by Day" — full video plan (~62 min)

Built on the scene-1 pipeline: one world map + one look (navy oceans, blue-grey land, gold
lights, cyan coasts, grid + CRT overlay, top HUD). Every chapter reuses the same machinery:
map moves, zooms into sharp regional layers, Blender 3D cities, picture-in-picture (PiP)
clip boxes with arrows, radio panels, news-headline cards, HUD counters.

## Premise (kept physically plausible)

- **Setting:** mid-March (equinox season, when big storms cluster — the 1989 Quebec blackout
  was 13 March). Montreal nights around −10 °C, so losing power is dangerous.
- **T+0 = 06:12 EST:** a Carrington-class flare (off the X-scale) and a fast CME (~2,900 km/s).
  X-rays arrive in 8 minutes: HF radio blackout on the sunlit side of Earth.
- **T+17:00 = 23:12 EST:** CME impact. Night in the Americas, pre-dawn in Europe, afternoon
  in Japan. Kp 9, G5+, Dst below −1,100 nT. Auroras down to the tropics.
- Failures follow real mechanisms: geomagnetically induced currents saturate transformers on
  long lines over resistive rock (Quebec, Scandinavia, UK, NE US first), satellites and GPS
  degrade, undersea-cable repeaters fail, then the slow cascade: water pumps, fuel, telecom
  batteries, hospitals on generators, food, heating, security.
- All brands, networks, agencies and utilities are fictional (GNN, Grid Control, …).
  Real cities and countries are used; no real people.

## Chapters

| # | Time | Chapter | What's on screen | Voices / audio |
|---|------|---------|------------------|----------------|
| 0 | 0:00–1:30 | **Bonjour Montréal** | Dawn over the world map → zoom into Montreal → 3D city at dawn (lights still on). HUD clock T−00:10. | French morning-radio host, English subtitles ("Bonjour Montréal! Il est six heures…"): weather −9 °C, traffic, "aurores boréales possibles ce soir". |
| — | 1:30–1:45 | Title card | "I SIMULATED A HYPER REALISTIC SOLAR SUPERSTORM — DAY BY DAY" in the HUD style. | Low drone hit. |
| 1 | 1:45–6:00 | **T+0 — The Flare** | Split view: world map + PiP "solar imager" box (AI sun clip, no text). Sunlit hemisphere turns red for the HF radio blackout. HUD: X-RAY FLUX off-scale, CME SPEED, ETA 17:00:00 countdown. | Narrator. PiP: a forecaster at a (fictional) space-weather centre: "Are you seeing this? …That's not an X10. That's off the scale." Radio: pilots losing HF contact over the Pacific. |
| 2 | 6:00–14:00 | **The Warning** | News spreads city by city: PiP boxes with arrows pinned to cities. ~5:00 **Tokyo** (Japanese reporter, subtitles). Airlines reroute polar flights (animated flight arcs slide south). Satellite icons go "SAFE MODE". Headline cards (fictional outlets). | GNN anchor (EN), Montreal reporter (FR), Tokyo reporter (JA), London (EN). Grid Control briefing on the radio panel. |
| 3 | 14:00–20:00 | **The Waiting** | Montreal street PiPs: queues for generators, empty battery shelves, skeptics, aurora-party posts. Hospitals test generators. Evening falls across the map (terminator sweep). HUD countdown under 1 h turns red. | Vox-pops (FR/EN), forecaster update ("Bz just turned south…"), narrator. |
| 4 | 20:00–26:00 | **T+17 — Impact** (scene 1, extended) | Auroras flare worldwide → zoom to Quebec → 3D Montreal blackout in 9 s → Grid Control radio → GNN reporter live → pull-back: the cascade spreads (NE US, UK, Scandinavia). HUD: PEOPLE WITHOUT POWER starts climbing. | Narrator, radio dispatcher, GNN reporter. |
| 5 | 26:00–33:00 | **The First Night** | Montreal −12 °C: metro stops, traffic lights dark (crash PiP), elevators, phone networks die as tower batteries run out (network map fades). Undersea-cable repeaters fail: cable lines on the map go red, the internet fragments. Japan (afternoon) keeps power — Japanese reporter watching the West go dark. | Radio chatter (911 overload), reporters, narrator. |
| 6 | 33:00–42:00 | **Day 2–3 — The Long Dark** | Water pressure fails, fuel pumps can't pump, cash-only, food spoils. First looting PiPs. CO poisoning from indoor generators; fires from candles. Hospitals: fuel for 48 h. **ESTIMATED DEATHS** counter appears. Europe PiPs (London, Stockholm). | Hospital radio ("we have 18 hours of diesel"), reporters, narrator. |
| 7 | 42:00–52:00 | **Week 1–2 — Breakdown** | Fuel convoys under guard, generator thefts, fights at depots, curfews, troops deployed. Global scramble for large power transformers (1–2-year lead times): export bans, a naval standoff over a transformer shipment — "the war over materials". Map: resource-flow arrows, contested routes, dark regions spreading. Deaths climb. | Narrator, news cards, military/civil radio. |
| 8 | 52:00–60:00 | **Month 1–6 — Aftermath** | Lights come back region by region (the satisfying reverse of chapter 4). Final tallies (people affected, deaths, trillions in damage). Last shot: the Sun, still active. | Narrator close: "The last one hit in 1859. The next one isn't a question of if." |
| — | 60:00–62:00 | Outro | Sources/method card, synthetic-content note, credits (© OpenStreetMap contributors, GeoNames, GSHHG). | |

Pacing rule: switch location or format every 45–90 s; a counter, arrow, PiP or headline in
every map shot; each chapter ends on a hook.

## Visual system (same look everywhere)

- **World map** (the cleaned AI maps) → **regional layers** (real coastlines, rivers, borders,
  towns as gold lights; same palette) → **Blender 3D cities** (OSM buildings, same gold/dark
  tones). Zooms are one continuous move with no style change.
- **PiP boxes:** 480×270 video box with a thin cyan frame, a label bar ("GNN · LIVE · TOKYO"),
  and an animated arrow/leader line to the map location. The map keeps moving behind it.
- **Radio panel:** bottom-left, channel name, animated waveform, subtitles.
- **Headline cards:** fictional news sites/papers rendered by us (no text in AI images).
- **HUD** (top): mission clock, storm stats, PEOPLE WITHOUT POWER, ESTIMATED DEATHS,
  GRID/INTERNET status. Cyan labels, amber numbers, red when critical.

## Asset list and budget

| Item | Count / size | Cost estimate |
|------|--------------|---------------|
| Narration + dialogue (ElevenLabs, FR/EN/JA) | ~45,000 characters | Owner's Creator plan: 131,000 credits available — covered. |
| Seedance 2.5 PiP clips (480p is plenty for a small box) | ~36 × 5 s = 180 s | $0.206/s → ~$37 |
| Seedance 2.5 full-screen clips (720p), incl. the zoom hand-offs into aerial city shots | ~9 × 8 s = 72 s | $0.462/s → ~$33 |
| Retries / tests (~30%) | | ~$21 |
| **AI video total** | | **~$90** vs $21 available. Options: top up; 4 s PiPs and reuse; 480p for some full-screen shots; Seedance 2.0 Mini for crowd/B-roll PiPs |
| Close-up city footage | Seedance image-to-video from the zoom's last frame (owner's call) — Blender city is optional/backup | in the clip budget above |
| Map/HUD/regional shots | ~50 min of the runtime | ~1–2 h CPU total |

## Script status

Draft v1 in `script/` (3 parts, all 9 chapters, every beat with visuals, lines, FR/JA with
English subtitles). Measured: ~15,500 spoken characters (~17 min of speech), 36 PiP clips,
9 full-screen clips. For a 62-minute cut the narration needs ~2.5x more density
(target ~45,000 characters): expand each chapter with more locations and systems
(NYC/Chicago/Toronto, nursing homes, farms and food chains, water treatment, nuclear
plants on backup cooling, stranded flights, Antarctic stations, the orbital station).

## Production order

1. Finish the scene-1 pilot (pipeline test) — in progress.
2. Lock this outline → full script with timings (narration word counts per chapter).
3. Voices (ElevenLabs) for all chapters → gives exact timing.
4. PiP/hero clip list + Higgsfield spend approval → generate.
5. Map/regional/HUD chapters (automated from the script timings).
6. Blender cities (OSM) → renders.
7. Sound design, mix, assembly per chapter → full cut → review → export.

## Needed to continue (environment settings, one time)

- Allowed domains: `api.elevenlabs.io`, `api.higgsfield.ai`, `overpass-api.de`
- Environment variables: `ELEVENLABS_API_KEY` (a **new** key — revoke the one pasted in chat),
  `HF_KEY` (Higgsfield `KEY_ID:KEY_SECRET`)
- Then start a new session on this branch; everything is picked up from `superstorm/`.
