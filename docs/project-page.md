# Project page draft (NASA Space Apps Challenge 2026)

> Draft, updated Sun 15 Nov 14:10 with today's dust storm, Today's Sun card, rover map, crew skills and job mini-games. `TODO(team)` items are yours.

Fields follow the Space Apps project page. `TODO(team)` marks what only the humans can fill in.

## Project title

The Impossible SOLution

## Team

SoftUniors, Sofia, Bulgaria. Local event: Space Apps Sofia, Incubator @ Sofia Tech Park. Challenge: Build a Junior Astronaut Mission Trainer.

## One-line summary

Can you keep 3 astronauts safe through a real Mars solar storm?

## High-level summary

The Impossible SOLution is a free browser game for kids aged 7–12 and their classrooms, in English and Bulgarian. Kids walk around a pixel-art Mars base and plan each sol (a sol is one day on Mars). There are 3 astronauts and 5 jobs, so 2 jobs always stay undone and every choice costs something. Real NASA data decides the storms that hit the base: real solar storms measured on Mars, and real dust storms that covered the solar panels of NASA's landers. At the end, a domino chain shows which of the player's choices caused each problem. No login, works on phones, laptops and classroom screens (with a full-screen button), and works offline.

### Three campaigns, one engine

- **The Storm Season (Mars, 5 sols).** Each run replays one of three real solar storms that NASA's Curiosity rover measured on Mars: 20 May 2024 (worst hour about 74 times the usual level), 11 Sep 2017 and 29 Oct 2021 (about 3 times each). The burst lands on a different sol each run, so the winning plan changes. Earth can give the chance of a burst, never the hour.
- **Dust Season (Mars, 6 sols).** Pick a real landing site (Gale Crater, Elysium Planitia, Meridiani Planum), wipe dust off the panels, build one upgrade, radio Earth with today's real light delay from NASA's Deep Space Network, live through a real dust storm, and drive the rover.
- **South Pole Outpost (the Moon, 5 days).** Pick one of NASA's candidate landing regions (sunlight, ice or a view of Earth: never all three), call Earth with a 1.3-second delay, read a real eruption and decide whether to shelter, and drive into a dark crater for ice.

Every day in the long campaigns has a different interaction, and every choice goes through the same simulation engine, so it shows up in the domino chain at the end. Every run has a number; `?seed=<number>` replays it, and `?daily=1` gives a whole class the same run. The quick 3-sol mission stays at `?campaign=classic`.

### New on 15 Nov

- **Dust storm at the base.** On a Mars mission a dust storm can hit (the real June 2018 storm that silenced the Opportunity rover, or the October 2022 storm that cut NASA InSight's power from about 425 to 275 watt-hours a sol). Dust covers the screen and the crew is called back to the base. Before the console opens, the player goes out through the airlock to wipe 6 dusty solar panels and fixes the broken greenhouse in 3 steps. Going outside adds radiation and the repair uses power, and both show up in the domino chain. Dust Season replays its own real storm days; other Mars missions meet one on a sol picked by the run number.
- **Today's real Sun.** One tap checks NASA's live space-weather forecast (DONKI WSA-Enlil) for storm clouds sent toward Mars in the last 30 days and shows the real event: its NASA ID, the forecast arrival at Mars and its speed leaving the Sun. The card is labelled Live or Saved with the download time. A live storm only decides when the storm comes; it never sets a radiation number.
- **Rover drive on a real map.** A rover drive over a map of the Gale Crater area, coloured from NASA Mars Trek tiles.
- **Crew skills.** Nova calls Earth for free, Kai's panel cleaning gives +1 power and Amara's harvest gives +1 food, so who does a job matters, not only which job.
- **Job mini-games.** A short, optional action game for each job. It is just for fun and never changes the result.
- **Kid-first screens.** A centred start screen with three mission cards, and a morning screen where the kid taps "Why?" to see what caused each problem and "decodes" Earth's radio message. The base uses the whole screen, the d-pad and buttons sit beside it, and text grows on big classroom screens.

## Project demo link

Video (30 seconds, English): https://github.com/YYN192/impossible-solution/blob/main/docs/media/launch-video.mp4

TODO(team): if you uploaded the video to YouTube or another host for the submission form, use that link instead. Confirm it has no faces or voices of under-18s.

## Final project link

Play: https://impossible-solution.vercel.app
Code: https://github.com/YYN192/impossible-solution (Apache-2.0)

## Detailed description

### What it does

The player walks around a small Mars station and opens the mission console. Each sol, the player gives each astronaut one job: clean the solar panels, run the greenhouse lights, build up the shelter, ask Earth, or go on a science trip. Each job shows its cost before the player commits. Skipped jobs cost something later: skip the panels and tomorrow's power drops by about a third.

On the way, a real solar storm hits. The storm is the one from 20 May 2024. Kids see two kinds of storm: a particle burst that arrives in tens of minutes (no warning from Earth can beat it) and a storm cloud (CME) that takes days to reach Mars (Earth can warn you, if you spent a worker on Ask Earth).

After sol 3, or earlier if the base fails, the final screen shows the domino chain from each problem back to the first cause, plus 1–3 stars. "Try a different plan" restarts from sol 1 with the same start. A mission takes about 8 minutes.

### How it works

- **Engine:** a pure, deterministic simulation (3 to 6 sols, depending on the campaign) of power, air, food and radiation (`src/sim/`). The same plan always gives the same result, and automated tests check the domino chains.
- **Data layer:** all NASA data goes through one layer: fetch with timeout and retry, then cache, then a saved snapshot. A badge says LIVE or SAVED DATA. Saved data is never called live. `?offline=1` never uses the network.
- **Repeatable demo:** `?demo=1` replays the same story from bundled data.
- **Honesty:** the in-game "Where our numbers come from" screen separates real NASA numbers from labelled game numbers. Job costs, crew size and meter units are game numbers. The ratio of the storm to a normal day is real.
- **Built with:** React 19, TypeScript, Vite, Zustand, Zod, i18next and Vitest.

### Benefits

- Kids learn the trade-offs of a Mars base (power, air, food, radiation, delay) by playing, not by reading.
- It ties a decision to real space weather and shows that Earth cannot always help in time.
- It is classroom-ready: a teacher card with a lesson goal and 3 questions, no login, no data collected, works offline, keyboard and touch, big buttons, reduced motion respected.
- It is replayable: kids try a different plan from the same start and see what changes.

### NASA data used

| Dataset | Link | Used for |
|---|---|---|
| DONKI CME 2024-05-20T05:36:00-CME-001 | https://ccmc.gsfc.nasa.gov/DONKI/view/CME/31034/-1 | The 20 May 2024 storm on sol 2 of the main mission |
| DONKI WSA-Enlil runs, 19–24 May 2024 (Mars arrival 28 May) | https://api.nasa.gov/DONKI/WSAEnlilSimulations?startDate=2024-05-19&endDate=2024-05-24 | Ask Earth storm-cloud forecast |
| DONKI WSA-Enlil runs, last 30 days (Mars only) | https://api.nasa.gov/DONKI/WSAEnlilSimulations | Optional "Today's Sun" mission (live, falls back to saved data) |
| Curiosity RAD, 20 May 2024 storm (8.1 mGy) | https://www.jpl.nasa.gov/news/nasa-watches-mars-light-up-during-epic-solar-storm/ | Size of the particle burst |
| Curiosity RAD surface baseline (Hassler et al., Science 2014): 0.21 mGy per day | https://doi.org/10.1126/science.1244797 | Normal daily dose |
| Curiosity RAD dose rates 15–25 May 2024, NASA OSDR RadLab | https://visualization.osdr.nasa.gov/radlab/ | Storm curve on the Data Sources screen |
| InSight dust and solar power (425 → 275 Wh per sol) | https://www.jpl.nasa.gov/news/nasas-insight-waits-out-dust-storm/ | Panel-dust penalty; the October 2022 dust storm at the base |
| NSSDC Mars fact sheet (light delay 3–22 minutes one way) | https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html | Ask Earth wording |
| NASA OSDR studies (titles and links only) | https://osdr.nasa.gov/bio/repo/ | "Real plants grown in space" cards |
| NASA Image and Video Library (PIA25287, PIA26302, PIA16058) | https://images.nasa.gov/ | Pictures next to the dust, storm and base-site facts |
| NASA Mars Trek, Viking MDIM 2.1 mosaic, tiles around Gale Crater | https://trek.nasa.gov/mars/ | "Where is our base?" map |
| DONKI FLR, SEP, CME, GST, notifications (last 30 days) | https://api.nasa.gov/DONKI/ | "What the Sun did this month" (context only) |
| Astronomy Picture of the Day | https://science.nasa.gov/wp-json/wp/v2/apod-basic | Link and credit only |
| DONKI CMEs 2017-09-10 and 2021-10-28 with their WSA-Enlil Mars forecasts | https://ccmc.gsfc.nasa.gov/DONKI/view/CME/13107/-1 · https://ccmc.gsfc.nasa.gov/DONKI/view/CME/18106/-1 | Storm pool: the Sep 2017 and Oct 2021 storms |
| Curiosity RAD dose rates, Sep 2017 and Oct–Nov 2021 (NASA OSDR RadLab) | https://visualization.osdr.nasa.gov/radlab/gui/ | Size of the two small storms (about 3 times the quiet level) |
| LRO CRaTER dose rates, May 2024 (NASA OSDR RadLab) | https://visualization.osdr.nasa.gov/radlab/gui/ | South Pole Outpost: the storm seen from the Moon's orbit |
| NASA Deep Space Network Now | https://eyes.nasa.gov/dsn/dsn.html | Today's radio delay to Mars (live, falls back to saved data) |
| InSight power after landing and in spring 2022 | https://science.nasa.gov/photojournal/insights-power-generation-after-landing-and-spring-2022 | Dust Season briefing and the Elysium Planitia site |
| InSight sand-trickle power boost, May 2021 | https://www.nasa.gov/feature/jpl/nasa-s-insight-mars-lander-gets-a-power-boost | Dust Season: wipe-the-panels day |
| Opportunity's last message, 10 June 2018 | https://www.jpl.nasa.gov/images/opportunitys-last-message | The 2018 global dust storm (Dust Season and the dust storm at the base) |
| Spirit and Opportunity wind cleaning (The Planetary Society, from JPL updates) | https://www.planetary.org/articles/08-31-mer-update-1 | Meridiani Planum site, dust-devil choice |
| Curiosity REMS weather feed, sol 4995 (25 Aug 2026) | https://mars.nasa.gov/rss/api/?feed=weather&category=msl&feedtype=json | Gale Crater site, cold-night choice (labelled with its date, never live) |
| NASA Artemis candidate landing regions (19 Aug 2022) | https://www.nasa.gov/news-release/nasa-identifies-candidate-regions-for-landing-next-americans-on-moon/ | South Pole Outpost sites |
| NASA Moon fact sheet | https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html | Moon radio delay, about 1.3 s |

Saved copies were fetched on 2026-11-14. Dates and licences for each item are in [`CREDITS.md`](../CREDITS.md). The in-game list is in `src/data/sources.ts` and the Data Sources screen. We also link two Canadian Space Agency teacher resources.

Uses NASA open data. Not affiliated with or endorsed by NASA or the Canadian Space Agency. No NASA logos are used.

## Use of AI

We used Claude Code (Claude Fable 5.2, Claude Opus 5.5 and Claude Sonnet 5.5 subagents) to write code, tests, docs and QA scripts, and pxl (programmatic pixel art written as code) for the sprites. We reviewed the output. We used no generative image, video or voice model for anything in the shipped game. Full list, with where each output lives and how we reviewed it: [`docs/ai-usage-log.md`](ai-usage-log.md).

## References

- NASA DONKI: https://ccmc.gsfc.nasa.gov/DONKI/ and https://api.nasa.gov/
- Hassler et al., "Mars' Surface Radiation Environment Measured with the Mars Science Laboratory's Curiosity Rover", Science 2014: https://doi.org/10.1126/science.1244797
- JPL, Curiosity RAD and the May 2024 storm: https://www.jpl.nasa.gov/news/nasa-watches-mars-light-up-during-epic-solar-storm/
- JPL, InSight and dust: https://www.jpl.nasa.gov/news/nasas-insight-waits-out-dust-storm/
- NSSDC Mars fact sheet: https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html
- NASA OSDR: https://osdr.nasa.gov/bio/repo/
- Canadian Space Agency youth and educator resources: https://www.asc-csa.gc.ca/eng/youth-educators/
- Credits, licences and fonts: [`CREDITS.md`](../CREDITS.md)
