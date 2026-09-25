"""The hour as short incidents around the world (owner's direction, session 3).

Every incident is one small block (~40-80 s):
  map move -> zoom into the real city (2D map pipeline, same look everywhere)
  -> Seedance 2.5 image-to-video from the zoom's last frame: the real city, cars moving
  -> Seedance 2.5 people clip (street level; full screen or a PiP box with an arrow)
  -> on-screen text (location tag, one-line caption, sometimes a headline card / HUD counter)
  -> audio (a line: narrator, reporter, radio, phone; plus ambience)
  -> pull back; a small red marker + label stays on the world map.
Blender is used only for top views (Montreal blackout from above; lights-back in ch. 8).

  python3 incidents.py            -> markdown plan to stdout (FULL_VIDEO_PLAN.md table)
  python3 incidents.py cost       -> Seedance cost by tier + TTS characters

Premise: 13 March (before North American DST), T+0 = 11:12 UTC flare (06:12 in Montreal),
CME impact T+17:00 = 04:12 UTC on 14 March: night in the Americas and Europe, day in Asia
and Australia. All brands/outlets/utilities fictional (GNN, Grid Control, Northern Ledger);
real cities, no real people. No text inside AI clips.
"""
import sys

PRICE = {"480p": 0.206, "720p": 0.462}          # $/s, Seedance 2.5 via the Higgsfield API

# aerial / people = (seconds, resolution) or None. "hero" incidents get 720p people clips.
I = []


def inc(ch, place, country, lat, lon, utc, local, what, aerial, people, text, line, aerial_desc="", people_desc="",
        dur=60):
    I.append(dict(ch=ch, place=place, country=country, lat=lat, lon=lon, utc=utc, local=local, what=what,
                  aerial=aerial, people=people, text=text, line=line, aerial_desc=aerial_desc,
                  people_desc=people_desc, dur=dur))


A5 = (5, "720p")      # aerial hand-off from the zoom frame
P4 = (4, "480p")      # people clip for a PiP box
P5H = (5, "720p")     # people clip full screen (hero)

# ---------------------------------------------------------------- 0 cold open (0:00-1:30)
CHAPTERS = {
    0: ("Cold open", "0:00-1:30"), 1: ("T+0 The Flare", "1:30-7:00"), 2: ("The Warning", "7:00-14:00"),
    3: ("The Waiting", "14:00-19:00"), 4: ("T+17 Impact", "19:00-28:00"), 5: ("The First Night", "28:00-36:00"),
    6: ("Day 2-3 The Long Dark", "36:00-44:00"), 7: ("Week 1-2 Breakdown", "44:00-52:00"),
    8: ("Month 1-6 Aftermath", "52:00-59:00"),
}
# cold open = the world map at T+17:02 with red spreading + 6 two-second flashes reused from
# later incidents (no new clips) + narrator hook, then the title card.

# ---------------------------------------------------------------- 1 the flare (11:12 UTC, day side)
inc(1, "Boulder", "USA", 40.015, -105.270, "11:12", "04:12", "Space-weather forecasters see X-ray flux go off the scale",
    None, P5H, ["SPACE WEATHER CENTER · BOULDER, USA · 04:12", "X-RAY FLUX: OFF SCALE"],
    ("FORECASTER", "Are you seeing this? That's not an X10. That's off the scale."),
    people_desc="night-shift forecasters in a dim operations room, wall of monitors with sun images, one stands up")
inc(1, "North Atlantic", "at sea", 52.0, -30.0, "11:20", "--", "A transatlantic flight loses HF radio (sunlit side)",
    None, P4, ["NORTH ATLANTIC · FLIGHT 212", "HF RADIO: NO CONTACT"],
    ("PILOT", "Gander, Speedbird two-one-two... Gander, do you read? ...Nothing on any frequency."),
    people_desc="airliner cockpit in daylight over the ocean, two pilots, one pressing the radio switch, static")
inc(1, "Lagos", "Nigeria", 6.524, 3.379, "11:25", "12:25", "Shortwave and maritime radio die across West Africa at midday",
    A5, P4, ["LAGOS, NIGERIA · 12:25", "HF RADIO BLACKOUT ACROSS THE DAY SIDE"],
    ("NARR", "Eight minutes after the flare, its X-rays hit the day side of the planet. Every shortwave radio from Lagos to Delhi goes silent."),
    aerial_desc="Lagos lagoon and bridges at midday, dense traffic, harbour with ships",
    people_desc="port radio operator at a desk, turning dials, only static")
inc(1, "Low Earth orbit", "orbit", 0.0, 0.0, "12:40", "--", "Station crew ordered into the shielded module (radiation storm)",
    None, P5H, ["ORBITAL STATION · 410 KM", "PROTON FLUX RISING"],
    ("FLIGHT", "Station, Houston... get everyone into the shielded module. Now, please."),
    people_desc="astronauts in a space station floating quickly through a hatch into a narrow module, emergency lighting")
inc(1, "Boulder", "USA", 40.015, -105.270, "12:30", "05:30", "Coronagraph shows the CME: 2,900 km/s, Earth-directed",
    None, None, ["CME SPEED 2,900 KM/S", "ETA T+17:00"],
    ("NARR", "Then the coronagraph images arrive. A billion-ton cloud, heading straight for us. Seventeen hours."))

# ---------------------------------------------------------------- 2 the warning
inc(2, "Tokyo", "Japan", 35.659, 139.700, "12:00", "21:00", "Giant screens at a crossing carry the warning; crowds stop",
    A5, P5H, ["TOKYO, JAPAN · 21:00 · T+00:48", "SOLAR STORM WARNING ISSUED"],
    ("TOKYO", "巨大な太陽嵐が地球に向かっています。到達は明日の午後の予想です。"),
    aerial_desc="Tokyo at night, a huge scramble crossing with thousands of people, giant video screens (no readable text), trains",
    people_desc="crowd at a Tokyo crossing at night stopping to look up at giant screens, phones out")
inc(2, "London", "United Kingdom", 51.507, -0.128, "13:00", "13:00", "Grid Control emergency briefing; pubs turn up the TV",
    A5, P4, ["LONDON, UK · 13:00 · T+01:48", "GRID CONTROL: 'PREPARE FOR LOSS OF SUPPLY'"],
    ("GRID_UK", "We are preparing for the possibility of widespread loss of supply tonight. Please don't panic-buy."),
    aerial_desc="London at midday, River Thames with bridges, red buses and black cabs moving",
    people_desc="people in a London pub at lunchtime turning to watch a TV news report (no readable text)")
inc(2, "Mumbai", "India", 19.076, 72.878, "12:30", "18:00", "Evening rush hour; phones buzz with the alert",
    A5, P4, ["MUMBAI, INDIA · 18:00", "EMERGENCY ALERT ON 400 M PHONES"],
    ("NARR", "In Mumbai, four hundred million phones buzz at once. Most people swipe it away."),
    aerial_desc="Mumbai sea-link bridge and Marine Drive at dusk, heavy traffic, city lights coming on",
    people_desc="commuters on a crowded Mumbai train platform looking at their phones")
inc(2, "Anchorage", "USA", 61.218, -149.900, "14:00", "05:00", "Polar flights reroute south (flight arcs slide on the map)",
    None, None, ["POLAR ROUTES CLOSED", "312 FLIGHTS REROUTED"],
    ("NARR", "Airlines pull every flight off the polar routes. Radiation up there is now a real dose."))
inc(2, "Orbit", "global", 0.0, 0.0, "15:00", "--", "Satellite operators put fleets into safe mode (icons turn amber)",
    None, None, ["SATELLITES IN SAFE MODE: 1,840"], ("NARR", "Satellite operators turn thousands of spacecraft edge-on to the storm, and wait."))
inc(2, "New York", "USA", 40.758, -73.985, "12:40", "07:40", "Morning commute; hardware stores open early; queues",
    A5, P4, ["NEW YORK, USA · 07:40 · T+01:28", "GENERATORS SOLD OUT BY 10 A.M."],
    ("VOX_NY", "Batteries, flashlights, whatever they got. My building's forty floors, man."),
    aerial_desc="Manhattan in early morning light, avenues full of yellow cabs and traffic, steam from vents",
    people_desc="a long line of New Yorkers outside a hardware store in the morning, people carrying water packs")
inc(2, "Montreal", "Canada", 45.502, -73.567, "14:00", "09:00", "Queues for generators and propane; −9 °C",
    A5, P4, ["MONTRÉAL, CANADA · 09:00 · −9 °C", "PROPANE: SOLD OUT"],
    ("VOX_MTL", "Il reste plus rien. Plus de propane, plus de piles. Rien."),
    aerial_desc="Montreal in winter morning, snow on roofs, cars on snowy streets, Mount Royal",
    people_desc="people in winter coats loading a generator into a pickup truck in a snowy parking lot")

# ---------------------------------------------------------------- 3 the waiting
inc(3, "Stockholm", "Sweden", 59.329, 18.069, "18:00", "19:00", "Families in the snow waiting for the aurora",
    A5, P4, ["STOCKHOLM, SWEDEN · 19:00", "AURORA ALERT: WHOLE COUNTRY"],
    ("VOX_SE", "Vi har väntat hela dagen. Barnen får vara uppe i natt."),
    aerial_desc="Stockholm at night in winter, islands and bridges, city lights, buses",
    people_desc="a family with children bundled up on a snowy hill in the evening, waiting, thermos")
inc(3, "Toronto", "Canada", 43.653, -79.383, "20:00", "15:00", "Hospitals test generators; diesel drums arrive",
    A5, P4, ["TORONTO, CANADA · 15:00", "HOSPITALS: 72 H OF DIESEL"],
    ("FACILITIES", "All three units run. Seventy-two hours of diesel on site."),
    aerial_desc="Toronto skyline in afternoon, lakeshore highway traffic, CN-style tower",
    people_desc="hospital staff wheeling diesel drums past an emergency entrance")
inc(3, "Sydney", "Australia", -33.869, 151.209, "22:00", "09:00 +1", "Morning in Sydney: markets open nervous",
    A5, P4, ["SYDNEY, AUSTRALIA · 09:00", "MARKETS OPEN −4.1 %"],
    ("NARR", "Sydney wakes up to the news first. Its stock market opens four percent down and keeps falling."),
    aerial_desc="Sydney harbour in morning sun, ferries crossing, bridge traffic",
    people_desc="traders in a busy trading room staring at screens (no readable text)")
inc(3, "Boulder", "USA", 40.015, -105.270, "03:30", "20:30", "Bz turns hard south, 40 minutes out",
    None, P4, ["UPSTREAM MONITOR: BZ −48 nT", "T−00:40"],
    ("FORECASTER", "Bz just turned south. Hard south."),
    people_desc="forecaster in a dark operations room, face lit by a monitor, very quiet")

# ---------------------------------------------------------------- 4 impact (04:12 UTC)
inc(4, "Montreal", "Canada", 45.502, -73.567, "04:12", "23:12", "Quebec grid collapses in 9 s (scene 1, Blender top view)",
    None, P5H, ["MONTRÉAL, CANADA · 23:12 · T+17:00", "PEOPLE WITHOUT POWER: 9,000,000"],
    ("GRID", "Grid Control to all stations... we've lost the northern lines... Montreal is down."),
    people_desc="GNN reporter on a dark downtown street, phone flashlights, green and magenta aurora overhead",
    dur=75)
inc(4, "New York", "USA", 40.758, -73.985, "04:16", "23:16", "Manhattan goes dark from the top down",
    A5, P4, ["NEW YORK, USA · 23:16 · T+17:04", "NORTHEAST GRID: COLLAPSE"],
    ("NARR", "Four minutes later, the American Northeast. Protection relays do exactly what they're built to do. They let go."),
    aerial_desc="Manhattan skyline at night with all lights on, avenues full of car headlights, then blocks of lights go out",
    people_desc="people in Times-Square-like plaza as all screens and lights go dark, phone flashlights come on")
inc(4, "London", "United Kingdom", 51.507, -0.128, "04:21", "04:21", "Pre-dawn blackout across Britain",
    A5, P5H, ["LONDON, UK · 04:21 · T+17:09", "UK: 61 % WITHOUT POWER"],
    ("LONDON", "The lights went out at about twenty past four. What you can hear is... nothing. No traffic."),
    aerial_desc="London at night by the Thames, bridges lit, night buses and cabs, then the city goes dark under a red aurora",
    people_desc="British reporter on a dark London street before dawn, a few people in coats looking up at a red sky")
inc(4, "Stockholm", "Sweden", 59.329, 18.069, "04:24", "05:24", "Aurora overhead; trams stop; rail signals go red",
    A5, P4, ["STOCKHOLM, SWEDEN · 05:24", "RAIL SIGNALS: ALL RED"],
    ("VOX_SE", "Det är grönt överallt... och sen släcktes allt."),
    aerial_desc="Stockholm at night under a huge green aurora, trams and cars moving, then the lights go out",
    people_desc="passengers stepping out of a stopped tram at night under a green aurora, snow")
inc(4, "Dunedin", "New Zealand", -45.878, 170.503, "04:30", "17:30", "A transformer fails in the afternoon (like 2001)",
    A5, P4, ["DUNEDIN, NEW ZEALAND · 17:30", "TRANSFORMER FAILURE"],
    ("NARR", "In daylight, in New Zealand, a transformer overheats and dies. It happened here once before, in 2001."),
    aerial_desc="Dunedin harbour city in late afternoon sun, green hills, traffic on waterfront road",
    people_desc="utility workers in hi-vis next to a smoking large electrical transformer at a substation")
inc(4, "Tokyo", "Japan", 35.689, 139.692, "04:12", "13:12", "Office lights flicker; Hokkaido goes dark; Kanto holds",
    A5, P4, ["TOKYO, JAPAN · 13:12", "HOKKAIDO: BLACKOUT · KANTO: HOLDING"],
    ("TOKYO", "北海道と東北の一部で停電が発生しています。関東の電力網は今のところ持ちこたえています。"),
    aerial_desc="Tokyo in afternoon daylight, dense towers, elevated expressways with traffic, trains",
    people_desc="office workers in a Tokyo office as ceiling lights flicker, everyone looks up")
inc(4, "Singapore", "Singapore", 1.264, 103.840, "04:40", "12:40", "GPS off by tens of metres; port cranes pause",
    A5, P4, ["SINGAPORE · 12:40", "GPS ERROR: 60 M"],
    ("NARR", "In Singapore, the world's busiest port, the automated cranes stop and wait for GPS to make sense."),
    aerial_desc="Singapore container port at midday, huge cranes, container ships, trucks moving",
    people_desc="port control room, operators watching frozen crane screens, one on a phone")
inc(4, "Orbit", "global", 0.0, 0.0, "05:00", "--", "Satellites lose contact; 40 drop from orbit (map icons turn red)",
    None, None, ["CONTACT LOST: 214 SATELLITES"], ("NARR", "The upper atmosphere swells with heat. For low satellites it's like driving into a wall of air."))

# ---------------------------------------------------------------- 5 the first night
inc(5, "New York", "USA", 40.752, -73.977, "05:10", "00:10", "Subway trains stuck in tunnels; people walk the tracks",
    None, P5H, ["NEW YORK, USA · 00:10 · T+18:00", "480 TRAINS STOPPED"],
    ("VOX_NY", "Stay together, stay together, watch the third rail— it's dead, it's dead, just walk."),
    people_desc="passengers walking in a line through a dark subway tunnel with phone flashlights")
inc(5, "Chicago", "USA", 41.878, -87.630, "05:30", "23:30", "911 overloaded; traffic lights dark; a crash at a junction",
    A5, P4, ["CHICAGO, USA · 23:30", "911: 6,000 CALLS WAITING"],
    ("DISPATCH", "All units, we are holding six thousand calls. Priority one only. Priority one only."),
    aerial_desc="Chicago at night along the river, elevated trains, traffic, then streets go dark except headlights",
    people_desc="two cars stopped after a minor collision at a dark intersection, hazard lights blinking")
inc(5, "Atlantic Ocean", "undersea", 45.0, -40.0, "06:00", "--", "Undersea cable repeaters fail; the internet splits",
    None, None, ["TRANSATLANTIC CAPACITY: −78 %"],
    ("NARR", "Undersea cables are powered from the shore. The storm pushes current into them too. One by one, the lines across the Atlantic go quiet."))
inc(5, "Paris", "France", 48.857, 2.352, "06:30", "07:30", "Morning with no Métro; a million people walking",
    A5, P4, ["PARIS, FRANCE · 07:30", "MÉTRO: FERMÉ"],
    ("VOX_FR", "Pas de métro, pas de lumière, pas de réseau. On marche."),
    aerial_desc="Paris at dawn, the Seine and bridges, boulevards with a few cars, grey light",
    people_desc="crowds of commuters walking across a Paris bridge at dawn, no traffic lights working")
inc(5, "São Paulo", "Brazil", -23.551, -46.633, "05:00", "02:00", "Partial blackout; helicopters over the dark city",
    A5, P4, ["SÃO PAULO, BRAZIL · 02:00", "PARTIAL BLACKOUT"],
    ("VOX_BR", "Metade da cidade apagou. A outra metade tá rezando."),
    aerial_desc="São Paulo at night, endless towers, avenues of headlights, half the city dark",
    people_desc="residents on a high-rise balcony at night looking at a half-dark city")
inc(5, "Shanghai", "China", 31.230, 121.474, "05:30", "13:30", "Factories stop in the north; Shanghai keeps power",
    A5, P4, ["SHANGHAI, CHINA · 13:30", "NORTHERN GRID: 38 % LOST"],
    ("NARR", "China's grid bends. Long lines in the north trip; the coast holds. Factories go quiet across three provinces."),
    aerial_desc="Shanghai in hazy daylight, river with barges, elevated highways with traffic",
    people_desc="factory floor with machines stopping, workers looking around under skylights")
inc(5, "Montreal", "Canada", 45.502, -73.567, "09:00", "04:00", "−14 °C: the first warming centre fills",
    None, P4, ["MONTRÉAL · 04:00 · −14 °C", "WARMING CENTRES: 40"],
    ("NARR", "Four in the morning in Montreal, minus fourteen. The first warming centres fill up."),
    people_desc="people with blankets on cots in a school gym lit by battery lanterns, breath visible")

# ---------------------------------------------------------------- 6 the long dark (day 2-3)
inc(6, "New York", "USA", 40.730, -73.990, "T+40", "day 2", "Water stops above the 6th floor; lines at hydrants",
    A5, P4, ["NEW YORK · DAY 2", "NO WATER ABOVE FLOOR 6"],
    ("VOX_NY", "Forty floors, no elevator, no water. My mother's on nineteen."),
    aerial_desc="Manhattan in grey daylight, streets with few cars, people walking in the avenues",
    people_desc="people filling buckets and bottles from an open fire hydrant on a city street")
inc(6, "London", "United Kingdom", 51.520, -0.100, "T+44", "day 2", "Hospitals on diesel; fuel resupply late",
    A5, P4, ["LONDON · DAY 2", "HOSPITAL DIESEL: 18 H LEFT"],
    ("FACILITIES_UK", "We have eighteen hours of diesel. The tanker was due this morning. It hasn't come."),
    aerial_desc="London in overcast daylight, a large hospital complex, ambulances, light traffic",
    people_desc="hospital corridor lit by emergency lights, nurses working with head torches")
inc(6, "Lagos", "Nigeria", 6.524, 3.379, "T+46", "day 2", "Generator city: businesses carry on (contrast)",
    A5, P4, ["LAGOS, NIGERIA · DAY 2", "BUSINESS AS USUAL"],
    ("VOX_NG", "Light no dey? We don use generator since. E no be new thing for us."),
    aerial_desc="Lagos in daylight, busy market streets, traffic, rooftops with small generators",
    people_desc="a busy Lagos street market with shops running on small generators, people laughing")
inc(6, "Mumbai", "India", 19.076, 72.878, "T+48", "day 3", "Water pumps fail in the heat; tanker queues",
    A5, P4, ["MUMBAI · DAY 3 · 34 °C", "WATER TANKERS: 9 H WAIT"],
    ("NARR", "The storm didn't hit India hardest. The cables and the markets did. And water needs pumps."),
    aerial_desc="Mumbai in hot daylight, apartment blocks, a line of water tanker trucks",
    people_desc="people with plastic containers queuing at a water tanker truck in the heat")
inc(6, "Toronto", "Canada", 43.653, -79.383, "T+50", "day 3", "Cash only; ATMs dark; grocery shelves spoil",
    A5, P4, ["TORONTO · DAY 3", "CARD PAYMENTS: DOWN"],
    ("VOX_TO", "Cash only. Cash only. If you don't have cash I can't help you, I'm sorry."),
    aerial_desc="Toronto in winter daylight, streets with little traffic, people walking",
    people_desc="a dim grocery store with empty fridges, a cashier taking cash by lantern light")
inc(6, "Montreal", "Canada", 45.502, -73.567, "T+60", "day 3", "Carbon-monoxide poisonings from indoor generators",
    None, P4, ["MONTRÉAL · DAY 3", "CO POISONINGS: 212"],
    ("NARR", "The deadliest thing in Montreal on day three isn't the cold. It's the generator in the garage."),
    people_desc="paramedics carrying a stretcher out of a snowy house at night, flashing lights")

# ---------------------------------------------------------------- 7 breakdown (week 1-2)
inc(7, "Pennsylvania", "USA", 40.27, -76.88, "week 1", "week 1", "Fuel convoys under guard on the interstate",
    A5, P4, ["INTERSTATE 81, USA · WEEK 1", "FUEL CONVOYS: ARMED ESCORT"],
    ("RADIO_CONVOY", "Convoy three, hold at mile one-twelve. Crowd at the exit. Do not stop."),
    aerial_desc="a highway in winter countryside, a long convoy of fuel tanker trucks with escort vehicles",
    people_desc="soldiers standing beside fuel tanker trucks at a highway checkpoint")
inc(7, "Johannesburg", "South Africa", -26.204, 28.047, "week 1", "week 1", "Transformers keep failing days later (like 2003)",
    A5, P4, ["JOHANNESBURG · WEEK 1", "14 TRANSFORMERS FAILED SINCE IMPACT"],
    ("NARR", "Some damage takes days to show. Transformers that survived the storm start dying a week later, like they did here in 2003."),
    aerial_desc="Johannesburg skyline in hazy daylight, highways with traffic, mine dumps",
    people_desc="engineers inspecting a large burnt transformer at a substation")
inc(7, "Rotterdam", "Netherlands", 51.924, 4.477, "week 2", "week 2", "The race for spare transformers; export bans",
    A5, P4, ["ROTTERDAM · WEEK 2", "TRANSFORMER LEAD TIME: 18 MONTHS"],
    ("NARR", "A large transformer weighs as much as a jumbo jet and takes a year and a half to build. Everyone needs hundreds. Now."),
    aerial_desc="Rotterdam port in daylight, a huge crane lifting a massive transformer onto a ship",
    people_desc="port workers watching a giant crane lift an enormous transformer")
inc(7, "Strait of Hormuz", "at sea", 26.57, 56.25, "week 2", "week 2", "A transformer ship escorted by warships (standoff)",
    None, P4, ["STRAIT OF HORMUZ · WEEK 2", "CARGO: 6 TRANSFORMERS"],
    ("NARR", "Six transformers on one ship, and three countries that say they're theirs."),
    people_desc="a cargo ship at sea escorted by two grey naval ships, seen from a helicopter (no flags)")
inc(7, "Lake Ontario", "Canada", 43.81, -79.07, "week 1", "week 1", "Nuclear plant cooling on diesel for 9 days",
    A5, P4, ["NUCLEAR PLANT · WEEK 1", "COOLING ON BACKUP DIESEL: DAY 9"],
    ("OPERATOR", "Backup diesel, day nine. We are fine as long as the trucks come."),
    aerial_desc="a nuclear power plant on a lake shore in winter, steam, a road with tanker trucks",
    people_desc="control room operators in a nuclear plant, calm but tired")
inc(7, "Wisconsin", "USA", 43.07, -89.40, "week 1", "week 1", "Dairy farms dump milk; food chain breaks",
    A5, P4, ["WISCONSIN · WEEK 1", "MILK DUMPED: 30,000 T"],
    ("VOX_FARM", "Cows don't care about solar storms. They need milking twice a day. And the truck isn't coming."),
    aerial_desc="snowy farmland with barns and silos, a dirt road, no vehicles moving",
    people_desc="a farmer pouring milk into a ditch next to a barn in winter")

# ---------------------------------------------------------------- 8 aftermath (month 1-6)
inc(8, "Montreal", "Canada", 45.502, -73.567, "month 1", "day 26", "Lights come back district by district (Blender top view)",
    None, P4, ["MONTRÉAL · DAY 26", "POWER RESTORED: 94 %"],
    ("NARR", "Twenty-six days. The lights come back the way they left: one district at a time."),
    people_desc="people in a street cheering as streetlights come back on at dusk")
inc(8, "London", "United Kingdom", 51.507, -0.128, "month 2", "week 7", "Rolling blackouts become normal",
    A5, P4, ["LONDON · WEEK 7", "ROLLING BLACKOUTS: 4 H ON / 4 H OFF"],
    ("NARR", "In Britain, the power comes back in shifts. Four hours on, four off. People learn the schedule like a train timetable."),
    aerial_desc="London in spring daylight, traffic back on the bridges",
    people_desc="people in a London café charging phones from a shared power strip")
inc(8, "Ulsan", "South Korea", 35.538, 129.311, "month 3", "month 3", "Transformer factories run 24/7",
    A5, P4, ["ULSAN, SOUTH KOREA · MONTH 3", "ORDERS: 1,100 TRANSFORMERS"],
    ("NARR", "The factories that build transformers are booked for four years. They run around the clock."),
    aerial_desc="an industrial harbour city with heavy factories and cranes at night, trucks moving",
    people_desc="workers in a huge factory hall winding copper coils of a giant transformer")
inc(8, "World", "global", 0.0, 0.0, "month 6", "month 6", "Final tally on the world map; the Sun is still active",
    None, None, ["PEOPLE AFFECTED: 1.2 BILLION", "DAMAGE: $4.1 TRILLION"],
    ("NARR", "The last one hit in 1859. The next one isn't a question of if."))


# ---------------------------------------------------------------- the $21 plan (owner: $21 of Seedance, total)
# Only these incidents get Seedance footage; all 480p (PiP boxes are 480x270, so 480p is native
# there; the four hand-offs are upscaled under the CRT look). Everything else is map zoom + text +
# audio + graphics. (ch, place) -> clips. The Boulder forecaster clip is reused for the ch.3 Bz beat.
H5 = (5, "480p")      # zoom -> real city hand-off (image-to-video from the zoom's last frame)
Q4 = (4, "480p")      # people clip
FUNDED = {
    (1, "Boulder"): {"people": Q4}, (1, "North Atlantic"): {"people": Q4}, (1, "Low Earth orbit"): {"people": Q4},
    (2, "Tokyo"): {"aerial": H5, "people": Q4}, (2, "New York"): {"people": Q4},
    (4, "Montreal"): {"people": (5, "480p"), "people2": Q4},        # reporter (lip-sync test, audio on) + crowd
    (4, "New York"): {"aerial": H5}, (4, "London"): {"aerial": H5, "people": Q4}, (4, "Stockholm"): {"aerial": H5},
    (5, "New York"): {"people": Q4}, (5, "Paris"): {"people": Q4},
    (6, "New York"): {"people": Q4}, (6, "London"): {"people": Q4}, (6, "Lagos"): {"people": Q4},
    (7, "Pennsylvania"): {"people": Q4}, (7, "Rotterdam"): {"people": Q4}, (7, "Wisconsin"): {"people": Q4},
    (8, "Montreal"): {"people": Q4},
}
BUDGET = 21.00


def funded(i):
    return FUNDED.get((i["ch"], i["place"]), {})


def funded_cost(i):
    return sum(d * PRICE[r] for d, r in funded(i).values())


def cost(i):
    c = 0.0
    for k in ("aerial", "people"):
        if i[k]:
            c += i[k][0] * PRICE[i[k][1]]
    return c


def main():
    if sys.argv[1:2] == ["cost"]:
        f = sum(funded_cost(i) for i in I)
        clips = sum(len(funded(i)) for i in I)
        secs = sum(d for i in I for d, _ in funded(i).values())
        print(f"$21 plan: {clips} Seedance clips, {secs} s of footage, ${f:.2f} -> reserve ${BUDGET - f:.2f} for retries")
        tot = sum(cost(i) for i in I)
        n_a = sum(1 for i in I if i["aerial"])
        n_p = sum(1 for i in I if i["people"])
        chars = sum(len(i["line"][1]) for i in I)
        print(f"{len(I)} incidents, {len({i['place'] for i in I})} places, {len({i['country'] for i in I})} countries")
        print(f"Seedance: {n_a} aerial hand-offs + {n_p} people clips = ${tot:.2f} (+25% retries = ${tot * 1.25:.2f})")
        lean = sum((i['aerial'][0] * PRICE['480p'] if i['aerial'] else 0) + (i['people'][0] * PRICE['480p'] if i['people'] else 0) for i in I)
        print(f"lean (all 480p): ${lean:.2f} (+25% = ${lean * 1.25:.2f})")
        print(f"incident lines: {chars} characters (full narration target ~45,000)")
        return
    for ch, (name, span) in CHAPTERS.items():
        print(f"\n### {ch} · {name} ({span})\n")
        rows = [i for i in I if i["ch"] == ch]
        if not rows:
            print("World map at T+17:02, red spreading, six 2 s flashes reused from later incidents, narrator hook → title card.")
            continue
        print("| Place | Local time | Incident | Seedance ($21 plan) | On-screen text | Audio |")
        print("|---|---|---|---|---|---|")
        for i in rows:
            names = {"aerial": "zoom hand-off", "people": "people", "people2": "people"}
            clips = " + ".join(f"{names[k]} {v[0]} s" for k, v in funded(i).items()) or "— (map, text, audio)"
            role, line = i["line"]
            print(f"| {i['place']}, {i['country']} | {i['local']} | {i['what']} | {clips} | {' / '.join(i['text'])} | {role}: “{line}” |")


if __name__ == "__main__":
    main()
