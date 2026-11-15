# Campaign design

Written Sat 14 Nov 2026, 22:00, for the overnight build. Status of every data claim: **candidate until the science-checker marks it verified** (see the table at the end).

## The idea in one paragraph

The game has one engine and several **campaigns**. A campaign is data: a place, a length, engine rules, a pool of real dated events, and a list of **beats**. A beat is one interaction on one day. Every beat ends in one engine action (`act(state, action)`), so nothing is decoration. A seed picks which real events and which beats a run gets. Real data is never changed; only the selection and the order change.

## Shared rules

- Jobs stay the same five everywhere: clean panels, greenhouse, shelter, ask Earth, science trip.
- Three meters: power, air, space rays (dose). Two counters: food, science.
- Stars: crew safe (dose under the limit) · base ready for tomorrow (power, air and food left) · science goal.
- A full space-ray meter ends the mission early.
- Every game number is listed in `src/data/gameNumbers.ts` and shown on Data Sources.

## Interaction types (beats)

| Type | What the kid does | Engine action |
| --- | --- | --- |
| `site` | Taps a real site on a NASA Trek map, reads its real values, chooses | sets the campaign rules (sunlight → solar power, cold → heater cost, dust, Earth in view) |
| `dilemma` | Reads a real event card, picks 1 of 2–3 options, each with a visible cost | changes power / air / food / dose / shelter |
| `wipe` | Taps dusty panel tiles to wipe them; each wipe is time outside | sets panel efficiency, adds a little dose |
| `radio` | Picks one question for Earth and watches the signal travel at the real light time | costs power; Earth's answer (storm cloud, burst risk, dust) arrives next morning (Mars) or at once (Moon) |
| `upgrade` | Spends saved resources on one lasting upgrade | changes a rule for the rest of the mission |
| `rover` | Picks how far to drive on the real map for a sample | costs power and time outside, gives science (or ice) |
| `skywatch` | Reads a real DONKI event card and predicts "Will it reach us?" | "Yes" prepares the shelter (costs power); the real record decides who was right |

## Campaign 1 — Mars: The Storm Season (3 sols, about 5 min)

- **Hook:** Can you keep 3 astronauts safe through a real Mars solar storm?
- **Real data → decision:** the Curiosity RAD storm dose → how much the space-ray meter jumps; the DONKI WSA-Enlil Mars forecast → what Earth can warn about; InSight dust power loss → cost of skipping the panels; DSN light time → Ask Earth's delay.
- **Beats:** plan every sol (the classic, deterministic `?demo=1` path has no extra beats).
- **Trade-off:** power vs shelter vs science, with a burst that Earth cannot time.
- **Runs vary:** the seed picks one real storm from the pool and the real calendar day the mission starts, so the burst lands on sol 1, 2 or 3.
- **Storm pool (candidates):** 20 May 2024 · 10 Sep 2017 · 28 Oct 2021.
- **Live variant, "Today's real Sun" (5 sols):** the newest DONKI CME with a Mars impact forecast (activity ID, speed, arrival, glancing or direct) sets the storm cloud. Beats: skywatch on the real CME, radio, one dilemma, one upgrade. If nothing is heading for Mars: "The Sun is quiet toward Mars right now" and a historical storm is offered.

## Campaign 2 — Mars: Dust Season (6 sols, about 10 min)

- **Hook:** Dust killed a real Mars lander. Can your base keep its lights on?
- **Real data → decision:** InSight's power record → how fast dust costs power; a real dust storm from the pool → the midpoint twist (solar power cut for 2 sols); Curiosity REMS latest night temperature (labelled "latest reading", never live) → heater cost; the site's real record → dust and cold; DSN light time → radio.
- **Beat sheet:**
  1. `site` — pick a real landing site: Gale Crater (Curiosity), Elysium Planitia (InSight), Meridiani Planum (Opportunity).
  2. `wipe` — dust on the panels (InSight's team really knocked dust off with sand in 2021).
  3. `dilemma` — one from the pool (cold night; dust devil; a crew member needs help).
  4. `radio` — a real dust storm arrives; ask Earth how long it lasts (answer after the real delay, next sol).
  5. `upgrade` — battery, panel brush or heater blanket.
  6. `rover` — drive for a sample with the power that is left.
- **Trade-off:** power vs warmth vs food.
- **Runs vary:** which real dust storm, which dilemmas and in what order, which crew member needs help, the night temperature inside the real REMS range.
- **What real teams do:** Curiosity and Perseverance carry a nuclear power source so dust cannot stop them; InSight's team rationed power and shook dust off with sand.

## Campaign 3 — Moon: South Pole Outpost (5 days, about 9 min)

- **Hook:** Sunlight or ice? At the Moon's south pole you cannot have both.
- **Real data → decision:** Moon Trek south-pole layers (% of time sunlit, how often Earth is visible, ice) at real Artemis candidate regions → solar power, water (cheaper air and more food), days when Earth is hidden; LRO CRaTER reading of the May 2024 storm (×1.3 against its own normal) and other real Moon events → the storm twist; Earth–Moon light time 1.3 s → radio answers at once.
- **Beat sheet:**
  1. `site` — pick a real region: a sunlit ridge, a crater rim near ice, a mountain that sees Earth.
  2. `radio` — 1.3 s each way: the answer arrives today. If Earth is hidden at your site: no signal.
  3. `skywatch` — a real solar event card; predict and prepare.
  4. `rover` — drive into the shadow for ice (power and time outside → water).
  5. `upgrade` or `dilemma` — greenhouse shelf (CSA food-production material on the card) or thicker shelter.
- **Trade-off:** sunlight (power) vs ice (water) vs talking to Earth.
- **Runs vary:** which real event, which day Earth dips out of view, the dilemma order.
- **What real teams do:** NASA picked Artemis landing regions near ridges that are sunlit most of the time and close to permanently shadowed craters that may hold ice.
- On the Moon the game says "day" (Earth days), not "sol".

## Seeds

- Every run has a seed (shown on the final screen). `?seed=<n>` replays it. `?demo=1` is fixed.
- "Daily mission": the seed is today's date, so a class plays the same run.
- From the seed: the real event for each slot, the mission's start day, the dilemmas and their order, the crew member who needs help, and weather inside the real range.

## Data claims to verify (science-checker)

| # | Claim (candidate) | Used for | Status |
| --- | --- | --- | --- |
| S1 | 20 May 2024: Curiosity RAD measured 8.1 mGy from one solar storm, the largest since landing; flare estimated X12 (far side, Solar Orbiter); DONKI CME 2024-05-20T05:36Z | Storm pool | to verify |
| S2 | 10 Sep 2017: X8.2 flare (AR 12673); Curiosity RAD saw surface radiation more than double any earlier reading; MAVEN saw a global aurora 25× brighter | Storm pool | to verify |
| S3 | 28 Oct 2021: X1.0 flare; first ground-level event seen on Earth, the Moon and Mars at once (Guo et al. 2023); Mars surface dose far lower than in Mars orbit | Storm pool, Moon pool | to verify |
| S4 | Peak only: RadLab hourly peak 304 vs about 4 µGy/h ≈ ×74. The older "N normal days" framing is dropped (it mixed a 2024 total with a 2012 baseline) | One kid sentence: "more than 50 times stronger than usual" | verified 15 Nov |
| S5 | A big, active sunspot group facing a planet raises the chance of a burst; nobody can give the exact hour | Earth's "burst risk" answer | to verify |
| D1 | InSight Oct 2022 dust storm: 425 → 275 Wh per sol | Dust pool | verified earlier (14 Nov) |
| D2 | InSight made about 5,000 Wh per sol at landing (2018) and about 500 Wh by mid-2022; mission ended Dec 2022 | Dust Season briefing | to verify |
| D3 | Opportunity, June 2018 global dust storm: 645 Wh → 22 Wh in about a week; tau 10.8; last contact 10 June 2018 | Dust pool | to verify |
| D4 | 2007 global dust storm: Opportunity's power fell to about 128 Wh per sol | Dust pool | to verify |
| D5 | InSight, 2021: trickling sand next to a panel knocked dust off and gained about 30 Wh per sol | Wipe beat | to verify |
| D6 | Curiosity REMS latest reading (sol 4995, 25 Aug 2026): min −71 °C, max −5 °C | Heater cost | to verify (feed) |
| D7 | Curiosity and Perseverance use a nuclear power source (MMRTG), so dust does not cut their power | Ending card | to verify |
| D8 | Wind "cleaning events" blew dust off Spirit and Opportunity's panels; InSight never got a strong one | Dilemma | to verify |
| M1 | Earth–Moon light time about 1.3 s one way | Radio | to verify |
| M2 | Some south-pole ridges are sunlit more than 80–90% of the time; floors of shadowed craters never see the Sun and are below −200 °C | Site | to verify |
| M3 | LCROSS (2009) found water ice in a permanently shadowed crater (Cabeus) | Site, rover | to verify |
| M4 | From the south pole Earth stays near the horizon; at many sites it is hidden for about half of each month; Malapert Massif sees Earth almost always | Site | to verify |
| M5 | LRO CRaTER, May 2024 storm: 12.3 → 15.7 µGy/h (×1.3 against its own normal) | Moon pool | measured by us from RadLab on 14 Nov; to re-verify |
| M6 | August 1972: a very large solar particle storm fell between Apollo 16 and Apollo 17; no crew was on the Moon | Moon pool | to verify |
| M7 | Artemis III candidate regions include Malapert Massif, the rim of de Gerlache, Nobile Rim 1, Haworth, Mons Mouton (9 regions, Oct 2024 list) | Site names | to verify |
| M8 | Chang'e-4 measured about 1,369 µSv per day on the lunar surface | Moon dose baseline | to verify |
| C1 | CSA "Food production on the Moon and in remote areas" toolkit exists at asc-csa.gc.ca; lettuce was grown and eaten on the ISS in 2015 (Veggie) | Food card | to verify |
