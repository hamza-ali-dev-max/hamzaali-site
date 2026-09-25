# "I Simulated a Hyper Realistic Solar Superstorm, Day by Day" — full video plan (~60 min)

**v2 (session 3, owner's direction):** the hour is built from **many short incidents all
over the world** (47 incidents, 29 places, 20 countries), each with its own text and audio,
not one long Montreal build. Zooms into the key cities hand over to **Seedance 2.5** (real
city, cars moving); **Seedance** also does the people at street level — within a **$21 total**
Seedance budget, so most incidents are map + text + audio. **Blender** is kept only for
**top views** (Montreal's blackout from above, and the lights coming back in chapter 8).
Source of truth: `incidents.py` (this file's tables are generated from it).

## Premise (kept physically plausible)

- 13 March (before North American daylight saving): mid-March storms cluster near the
  equinox (the 1989 Quebec blackout was 13 March).
- **T+0 = 11:12 UTC:** a Carrington-class flare (off the X-scale), a CME at ~2,900 km/s.
  X-rays arrive in 8 minutes and black out HF radio on the day side (Europe, Africa, India).
- **T+17:00 = 04:12 UTC, 14 March:** impact. Night in the Americas and Europe, afternoon in
  Asia and Australia. Kp 9, G5+, Dst below −1,100 nT, auroras to the tropics.
- Failures follow real mechanisms: induced currents saturate transformers on long lines over
  resistive rock (Quebec, NE US, UK, Scandinavia first), GPS/satellites degrade, undersea-cable
  repeaters fail, then the slow cascade (water pumps, fuel, telecom batteries, hospitals on
  diesel, food, heating), delayed transformer deaths (South Africa 2003, New Zealand 2001), and
  a global scramble for large power transformers (18-month lead times).
- All brands, outlets, agencies and utilities are fictional (GNN, Grid Control, Northern
  Ledger). Real cities and countries; no real people.

## One incident = one small block (~40–80 s)

1. **Map move** to the region on the world map; HUD counters update (2–4 s).
2. **Zoom** into the real city with the 2D map pipeline (regional layers built per city,
   same look everywhere) (4–6 s).
3. **Seedance 2.5 image-to-video from the zoom's last frame:** the map becomes the real city
   at the right time of day, cars moving, the incident starting (5 s, 720p).
4. **Seedance 2.5 people clip:** street level, full screen for heroes or a PiP box with an
   arrow pinned to the map (4 s 480p, heroes 5 s 720p).
5. **Text:** location tag (CITY, COUNTRY · local time · T+), one caption line, sometimes a
   fictional headline card or a HUD counter.
6. **Audio:** one line (narrator, reporter, radio, phone, vox pop; local language with
   subtitles), ambience, a sting.
7. **Pull back:** a small red marker with a two-word label stays on the world map, so the
   map fills up with incidents as the hour goes on.

Pacing: a new place every 40–80 s; the narrator links blocks; each chapter ends on a hook.

## Incidents by chapter

### 0 · Cold open (0:00-1:30)

World map at T+17:02, red spreading, six 2 s flashes reused from later incidents, narrator hook → title card.

### 1 · T+0 The Flare (1:30-7:00)

| Place | Local time | Incident | Seedance ($21 plan) | On-screen text | Audio |
|---|---|---|---|---|---|
| Boulder, USA | 04:12 | Space-weather forecasters see X-ray flux go off the scale | people 4 s | SPACE WEATHER CENTER · BOULDER, USA · 04:12 / X-RAY FLUX: OFF SCALE | FORECASTER: “Are you seeing this? That's not an X10. That's off the scale.” |
| North Atlantic, at sea | -- | A transatlantic flight loses HF radio (sunlit side) | people 4 s | NORTH ATLANTIC · FLIGHT 212 / HF RADIO: NO CONTACT | PILOT: “Gander, Speedbird two-one-two... Gander, do you read? ...Nothing on any frequency.” |
| Lagos, Nigeria | 12:25 | Shortwave and maritime radio die across West Africa at midday | — (map, text, audio) | LAGOS, NIGERIA · 12:25 / HF RADIO BLACKOUT ACROSS THE DAY SIDE | NARR: “Eight minutes after the flare, its X-rays hit the day side of the planet. Every shortwave radio from Lagos to Delhi goes silent.” |
| Low Earth orbit, orbit | -- | Station crew ordered into the shielded module (radiation storm) | people 4 s | ORBITAL STATION · 410 KM / PROTON FLUX RISING | FLIGHT: “Station, Houston... get everyone into the shielded module. Now, please.” |
| Boulder, USA | 05:30 | Coronagraph shows the CME: 2,900 km/s, Earth-directed | people 4 s | CME SPEED 2,900 KM/S / ETA T+17:00 | NARR: “Then the coronagraph images arrive. A billion-ton cloud, heading straight for us. Seventeen hours.” |

### 2 · The Warning (7:00-14:00)

| Place | Local time | Incident | Seedance ($21 plan) | On-screen text | Audio |
|---|---|---|---|---|---|
| Tokyo, Japan | 21:00 | Giant screens at a crossing carry the warning; crowds stop | zoom hand-off 5 s + people 4 s | TOKYO, JAPAN · 21:00 · T+00:48 / SOLAR STORM WARNING ISSUED | TOKYO: “巨大な太陽嵐が地球に向かっています。到達は明日の午後の予想です。” |
| London, United Kingdom | 13:00 | Grid Control emergency briefing; pubs turn up the TV | — (map, text, audio) | LONDON, UK · 13:00 · T+01:48 / GRID CONTROL: 'PREPARE FOR LOSS OF SUPPLY' | GRID_UK: “We are preparing for the possibility of widespread loss of supply tonight. Please don't panic-buy.” |
| Mumbai, India | 18:00 | Evening rush hour; phones buzz with the alert | — (map, text, audio) | MUMBAI, INDIA · 18:00 / EMERGENCY ALERT ON 400 M PHONES | NARR: “In Mumbai, four hundred million phones buzz at once. Most people swipe it away.” |
| Anchorage, USA | 05:00 | Polar flights reroute south (flight arcs slide on the map) | — (map, text, audio) | POLAR ROUTES CLOSED / 312 FLIGHTS REROUTED | NARR: “Airlines pull every flight off the polar routes. Radiation up there is now a real dose.” |
| Orbit, global | -- | Satellite operators put fleets into safe mode (icons turn amber) | — (map, text, audio) | SATELLITES IN SAFE MODE: 1,840 | NARR: “Satellite operators turn thousands of spacecraft edge-on to the storm, and wait.” |
| New York, USA | 07:40 | Morning commute; hardware stores open early; queues | people 4 s | NEW YORK, USA · 07:40 · T+01:28 / GENERATORS SOLD OUT BY 10 A.M. | VOX_NY: “Batteries, flashlights, whatever they got. My building's forty floors, man.” |
| Montreal, Canada | 09:00 | Queues for generators and propane; −9 °C | — (map, text, audio) | MONTRÉAL, CANADA · 09:00 · −9 °C / PROPANE: SOLD OUT | VOX_MTL: “Il reste plus rien. Plus de propane, plus de piles. Rien.” |

### 3 · The Waiting (14:00-19:00)

| Place | Local time | Incident | Seedance ($21 plan) | On-screen text | Audio |
|---|---|---|---|---|---|
| Stockholm, Sweden | 19:00 | Families in the snow waiting for the aurora | — (map, text, audio) | STOCKHOLM, SWEDEN · 19:00 / AURORA ALERT: WHOLE COUNTRY | VOX_SE: “Vi har väntat hela dagen. Barnen får vara uppe i natt.” |
| Toronto, Canada | 15:00 | Hospitals test generators; diesel drums arrive | — (map, text, audio) | TORONTO, CANADA · 15:00 / HOSPITALS: 72 H OF DIESEL | FACILITIES: “All three units run. Seventy-two hours of diesel on site.” |
| Sydney, Australia | 09:00 +1 | Morning in Sydney: markets open nervous | — (map, text, audio) | SYDNEY, AUSTRALIA · 09:00 / MARKETS OPEN −4.1 % | NARR: “Sydney wakes up to the news first. Its stock market opens four percent down and keeps falling.” |
| Boulder, USA | 20:30 | Bz turns hard south, 40 minutes out | — (map, text, audio) | UPSTREAM MONITOR: BZ −48 nT / T−00:40 | FORECASTER: “Bz just turned south. Hard south.” |

### 4 · T+17 Impact (19:00-28:00)

| Place | Local time | Incident | Seedance ($21 plan) | On-screen text | Audio |
|---|---|---|---|---|---|
| Montreal, Canada | 23:12 | Quebec grid collapses in 9 s (scene 1, Blender top view) | people 5 s + people 4 s | MONTRÉAL, CANADA · 23:12 · T+17:00 / PEOPLE WITHOUT POWER: 9,000,000 | GRID: “Grid Control to all stations... we've lost the northern lines... Montreal is down.” |
| New York, USA | 23:16 | Manhattan goes dark from the top down | zoom hand-off 5 s | NEW YORK, USA · 23:16 · T+17:04 / NORTHEAST GRID: COLLAPSE | NARR: “Four minutes later, the American Northeast. Protection relays do exactly what they're built to do. They let go.” |
| London, United Kingdom | 04:21 | Pre-dawn blackout across Britain | zoom hand-off 5 s + people 4 s | LONDON, UK · 04:21 · T+17:09 / UK: 61 % WITHOUT POWER | LONDON: “The lights went out at about twenty past four. What you can hear is... nothing. No traffic.” |
| Stockholm, Sweden | 05:24 | Aurora overhead; trams stop; rail signals go red | zoom hand-off 5 s | STOCKHOLM, SWEDEN · 05:24 / RAIL SIGNALS: ALL RED | VOX_SE: “Det är grönt överallt... och sen släcktes allt.” |
| Dunedin, New Zealand | 17:30 | A transformer fails in the afternoon (like 2001) | — (map, text, audio) | DUNEDIN, NEW ZEALAND · 17:30 / TRANSFORMER FAILURE | NARR: “In daylight, in New Zealand, a transformer overheats and dies. It happened here once before, in 2001.” |
| Tokyo, Japan | 13:12 | Office lights flicker; Hokkaido goes dark; Kanto holds | — (map, text, audio) | TOKYO, JAPAN · 13:12 / HOKKAIDO: BLACKOUT · KANTO: HOLDING | TOKYO: “北海道と東北の一部で停電が発生しています。関東の電力網は今のところ持ちこたえています。” |
| Singapore, Singapore | 12:40 | GPS off by tens of metres; port cranes pause | — (map, text, audio) | SINGAPORE · 12:40 / GPS ERROR: 60 M | NARR: “In Singapore, the world's busiest port, the automated cranes stop and wait for GPS to make sense.” |
| Orbit, global | -- | Satellites lose contact; 40 drop from orbit (map icons turn red) | — (map, text, audio) | CONTACT LOST: 214 SATELLITES | NARR: “The upper atmosphere swells with heat. For low satellites it's like driving into a wall of air.” |

### 5 · The First Night (28:00-36:00)

| Place | Local time | Incident | Seedance ($21 plan) | On-screen text | Audio |
|---|---|---|---|---|---|
| New York, USA | 00:10 | Subway trains stuck in tunnels; people walk the tracks | people 4 s | NEW YORK, USA · 00:10 · T+18:00 / 480 TRAINS STOPPED | VOX_NY: “Stay together, stay together, watch the third rail— it's dead, it's dead, just walk.” |
| Chicago, USA | 23:30 | 911 overloaded; traffic lights dark; a crash at a junction | — (map, text, audio) | CHICAGO, USA · 23:30 / 911: 6,000 CALLS WAITING | DISPATCH: “All units, we are holding six thousand calls. Priority one only. Priority one only.” |
| Atlantic Ocean, undersea | -- | Undersea cable repeaters fail; the internet splits | — (map, text, audio) | TRANSATLANTIC CAPACITY: −78 % | NARR: “Undersea cables are powered from the shore. The storm pushes current into them too. One by one, the lines across the Atlantic go quiet.” |
| Paris, France | 07:30 | Morning with no Métro; a million people walking | people 4 s | PARIS, FRANCE · 07:30 / MÉTRO: FERMÉ | VOX_FR: “Pas de métro, pas de lumière, pas de réseau. On marche.” |
| São Paulo, Brazil | 02:00 | Partial blackout; helicopters over the dark city | — (map, text, audio) | SÃO PAULO, BRAZIL · 02:00 / PARTIAL BLACKOUT | VOX_BR: “Metade da cidade apagou. A outra metade tá rezando.” |
| Shanghai, China | 13:30 | Factories stop in the north; Shanghai keeps power | — (map, text, audio) | SHANGHAI, CHINA · 13:30 / NORTHERN GRID: 38 % LOST | NARR: “China's grid bends. Long lines in the north trip; the coast holds. Factories go quiet across three provinces.” |
| Montreal, Canada | 04:00 | −14 °C: the first warming centre fills | — (map, text, audio) | MONTRÉAL · 04:00 · −14 °C / WARMING CENTRES: 40 | NARR: “Four in the morning in Montreal, minus fourteen. The first warming centres fill up.” |

### 6 · Day 2-3 The Long Dark (36:00-44:00)

| Place | Local time | Incident | Seedance ($21 plan) | On-screen text | Audio |
|---|---|---|---|---|---|
| New York, USA | day 2 | Water stops above the 6th floor; lines at hydrants | people 4 s | NEW YORK · DAY 2 / NO WATER ABOVE FLOOR 6 | VOX_NY: “Forty floors, no elevator, no water. My mother's on nineteen.” |
| London, United Kingdom | day 2 | Hospitals on diesel; fuel resupply late | people 4 s | LONDON · DAY 2 / HOSPITAL DIESEL: 18 H LEFT | FACILITIES_UK: “We have eighteen hours of diesel. The tanker was due this morning. It hasn't come.” |
| Lagos, Nigeria | day 2 | Generator city: businesses carry on (contrast) | people 4 s | LAGOS, NIGERIA · DAY 2 / BUSINESS AS USUAL | VOX_NG: “Light no dey? We don use generator since. E no be new thing for us.” |
| Mumbai, India | day 3 | Water pumps fail in the heat; tanker queues | — (map, text, audio) | MUMBAI · DAY 3 · 34 °C / WATER TANKERS: 9 H WAIT | NARR: “The storm didn't hit India hardest. The cables and the markets did. And water needs pumps.” |
| Toronto, Canada | day 3 | Cash only; ATMs dark; grocery shelves spoil | — (map, text, audio) | TORONTO · DAY 3 / CARD PAYMENTS: DOWN | VOX_TO: “Cash only. Cash only. If you don't have cash I can't help you, I'm sorry.” |
| Montreal, Canada | day 3 | Carbon-monoxide poisonings from indoor generators | — (map, text, audio) | MONTRÉAL · DAY 3 / CO POISONINGS: 212 | NARR: “The deadliest thing in Montreal on day three isn't the cold. It's the generator in the garage.” |

### 7 · Week 1-2 Breakdown (44:00-52:00)

| Place | Local time | Incident | Seedance ($21 plan) | On-screen text | Audio |
|---|---|---|---|---|---|
| Pennsylvania, USA | week 1 | Fuel convoys under guard on the interstate | people 4 s | INTERSTATE 81, USA · WEEK 1 / FUEL CONVOYS: ARMED ESCORT | RADIO_CONVOY: “Convoy three, hold at mile one-twelve. Crowd at the exit. Do not stop.” |
| Johannesburg, South Africa | week 1 | Transformers keep failing days later (like 2003) | — (map, text, audio) | JOHANNESBURG · WEEK 1 / 14 TRANSFORMERS FAILED SINCE IMPACT | NARR: “Some damage takes days to show. Transformers that survived the storm start dying a week later, like they did here in 2003.” |
| Rotterdam, Netherlands | week 2 | The race for spare transformers; export bans | people 4 s | ROTTERDAM · WEEK 2 / TRANSFORMER LEAD TIME: 18 MONTHS | NARR: “A large transformer weighs as much as a jumbo jet and takes a year and a half to build. Everyone needs hundreds. Now.” |
| Strait of Hormuz, at sea | week 2 | A transformer ship escorted by warships (standoff) | — (map, text, audio) | STRAIT OF HORMUZ · WEEK 2 / CARGO: 6 TRANSFORMERS | NARR: “Six transformers on one ship, and three countries that say they're theirs.” |
| Lake Ontario, Canada | week 1 | Nuclear plant cooling on diesel for 9 days | — (map, text, audio) | NUCLEAR PLANT · WEEK 1 / COOLING ON BACKUP DIESEL: DAY 9 | OPERATOR: “Backup diesel, day nine. We are fine as long as the trucks come.” |
| Wisconsin, USA | week 1 | Dairy farms dump milk; food chain breaks | people 4 s | WISCONSIN · WEEK 1 / MILK DUMPED: 30,000 T | VOX_FARM: “Cows don't care about solar storms. They need milking twice a day. And the truck isn't coming.” |

### 8 · Month 1-6 Aftermath (52:00-59:00)

| Place | Local time | Incident | Seedance ($21 plan) | On-screen text | Audio |
|---|---|---|---|---|---|
| Montreal, Canada | day 26 | Lights come back district by district (Blender top view) | people 4 s | MONTRÉAL · DAY 26 / POWER RESTORED: 94 % | NARR: “Twenty-six days. The lights come back the way they left: one district at a time.” |
| London, United Kingdom | week 7 | Rolling blackouts become normal | — (map, text, audio) | LONDON · WEEK 7 / ROLLING BLACKOUTS: 4 H ON / 4 H OFF | NARR: “In Britain, the power comes back in shifts. Four hours on, four off. People learn the schedule like a train timetable.” |
| Ulsan, South Korea | month 3 | Transformer factories run 24/7 | — (map, text, audio) | ULSAN, SOUTH KOREA · MONTH 3 / ORDERS: 1,100 TRANSFORMERS | NARR: “The factories that build transformers are booked for four years. They run around the clock.” |
| World, global | month 6 | Final tally on the world map; the Sun is still active | — (map, text, audio) | PEOPLE AFFECTED: 1.2 BILLION / DAMAGE: $4.1 TRILLION | NARR: “The last one hit in 1859. The next one isn't a question of if.” |

## Visual system (same look everywhere)

- **World map** (the cleaned AI maps) → **regional layers per city** (real coastlines,
  rivers, borders, towns as gold lights; same palette) → **Seedance aerial** (image-to-video
  from the zoom's last frame). Blender top views only for Montreal (ch. 4 and 8).
- **PiP boxes:** 480×270 video box with a thin cyan frame, a label bar ("GNN · LIVE · TOKYO"),
  and an animated arrow/leader line to the map location. The map keeps moving behind it.
- **Radio panel:** bottom-left, channel name, animated waveform, subtitles.
- **Headline cards:** fictional news sites/papers rendered by us (no text in AI images).
- **HUD** (top): mission clock, storm stats, PEOPLE WITHOUT POWER, ESTIMATED DEATHS,
  GRID/INTERNET status. Cyan labels, amber numbers, red when critical.

## Budget: $21 of Seedance for the whole hour (`python3 incidents.py cost`)

| Item | Count | Cost |
|------|-------|------|
| Zoom → real-city hand-offs (image-to-video from the zoom's last frame, 5 s, 480p) | 4 (Tokyo, New York, London, Stockholm) | $4.12 |
| People clips (4 s 480p; the Montreal reporter 5 s with audio = the lip-sync test) | 18 | $15.04 |
| **Total** | **22 clips, ~93 s of footage** | **$19.16** (reserve $1.84 ≈ 2 retries) |
| Every other incident | map zoom + text + audio + graphics (headline cards, radio panels, HUD counters) | $0 |
| Blender top views (Montreal blackout ch. 4, lights back ch. 8) | ~25 s | CPU only (~28 s/frame at 720p) |
| Voices (ElevenLabs, FR/EN/JA/SV/PT/pidgin…) | ~45,000 characters | Creator plan (131k) |
| Map zooms (layers per city) | 29 places | CPU only, ~6 min per city |

480p is native for the 480×270 PiP boxes; the four full-screen hand-offs are upscaled under
the CRT/grain look. With more money later, the wish list (every incident with footage, 720p
hand-offs) costs ~$143; it stays in `incidents.py` (`aerial`/`people` fields).
Nothing is generated before the owner's "go".

## Production order

1. Scene 1 (Montreal impact) as the pilot of the incident format — in progress.
2. Generic city zoom (any lat/lon) + the Seedance hand-off from the zoom's last frame.
3. Owner approves the clip list/budget per chapter → generate chapter by chapter.
4. Voices (ElevenLabs) per chapter → exact timings.
5. Assemble each chapter (map, zooms, clips, text, audio) → full cut → review → export.
