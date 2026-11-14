# Project page draft (NASA Space Apps Challenge 2026)

> Draft — the lead agent updates the game description at the end of the overnight run.

Fields follow the Space Apps project page. `TODO(team)` marks what only the humans can fill in.

## Project title

The Impossible SOLution

## Team

SoftUniors, Sofia, Bulgaria. Local event: Space Apps Sofia, Incubator @ Sofia Tech Park. Challenge: Build a Junior Astronaut Mission Trainer.

## One-line summary

Can you keep 3 astronauts safe through a real Mars solar storm?

## High-level summary

The Impossible SOLution is a free browser game for kids aged 7–12 and their classrooms, in English and Bulgarian. Kids run a Mars base for 3 sols (a sol is one day on Mars). There are 3 astronauts and 5 jobs, so 2 jobs always stay undone and every choice costs something. Real NASA data decides the storm that hits the base. At the end, a domino chain shows which of the player's choices caused each problem. No login, works on phones, and works offline.

## Project demo link

TODO(team): link to the demo video (30 seconds, English, no faces or voices of under-18s).

## Final project link

Play: https://impossible-solution.vercel.app
Mirror (GitHub Pages): https://yyn192.github.io/impossible-solution/
Code: https://github.com/YYN192/impossible-solution (Apache-2.0)

## Detailed description

### What it does

The player walks around a small Mars station and opens the mission console. Each sol, the player gives each astronaut one job: clean the solar panels, run the greenhouse lights, build up the shelter, ask Earth, or go on a science trip. Each job shows its cost before the player commits. Skipped jobs cost something later: skip the panels and tomorrow's power drops by about a third.

On the way, a real solar storm hits. The storm is the one from 20 May 2024. Kids see two kinds of storm: a particle burst that arrives in tens of minutes (no warning from Earth can beat it) and a storm cloud (CME) that takes days to reach Mars (Earth can warn you, if you spent a worker on Ask Earth).

After sol 3, or earlier if the base fails, the final screen shows the domino chain from each problem back to the first cause, plus 1–3 stars. "Try a different plan" restarts from sol 1 with the same start. A mission takes about 8 minutes.

### How it works

- **Engine:** a pure, deterministic three-sol simulation of power, air, food and radiation (`src/sim/`). The same plan always gives the same result, and automated tests check the domino chains.
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
| InSight dust and solar power (425 → 275 Wh per sol) | https://www.jpl.nasa.gov/news/nasas-insight-waits-out-dust-storm/ | Panel-dust penalty |
| NSSDC Mars fact sheet (light delay 3–22 minutes one way) | https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html | Ask Earth wording |
| NASA OSDR studies (titles and links only) | https://osdr.nasa.gov/bio/repo/ | "Real plants grown in space" cards |
| NASA Image and Video Library (PIA25287, PIA26302, PIA16058) | https://images.nasa.gov/ | Pictures next to the dust, storm and base-site facts |
| NASA Mars Trek, Viking MDIM 2.1 mosaic, tiles around Gale Crater | https://trek.nasa.gov/mars/ | "Where is our base?" map |
| DONKI FLR, SEP, CME, GST, notifications (last 30 days) | https://api.nasa.gov/DONKI/ | "What the Sun did this month" (context only) |
| Astronomy Picture of the Day | https://science.nasa.gov/wp-json/wp/v2/apod-basic | Link and credit only |

Saved copies were fetched on 2026-11-14. Dates and licences for each item are in [`CREDITS.md`](../CREDITS.md). The in-game list is in `src/data/sources.ts` and the Data Sources screen. We also link two Canadian Space Agency teacher resources.

Uses NASA open data. Not affiliated with or endorsed by NASA or the Canadian Space Agency. No NASA logos are used.

## Use of AI

We used Claude Code (Claude Fable 5.2 and Claude Sonnet 5.5 subagents) to write code, tests, docs and QA scripts, and pxl (programmatic pixel art written as code) for the sprites. We reviewed the output. We used no generative image, video or voice model for anything in the shipped game. Full list, with where each output lives and how we reviewed it: [`docs/ai-usage-log.md`](ai-usage-log.md).

## References

- NASA DONKI: https://ccmc.gsfc.nasa.gov/DONKI/ and https://api.nasa.gov/
- Hassler et al., "Mars' Surface Radiation Environment Measured with the Mars Science Laboratory's Curiosity Rover", Science 2014: https://doi.org/10.1126/science.1244797
- JPL, Curiosity RAD and the May 2024 storm: https://www.jpl.nasa.gov/news/nasa-watches-mars-light-up-during-epic-solar-storm/
- JPL, InSight and dust: https://www.jpl.nasa.gov/news/nasas-insight-waits-out-dust-storm/
- NSSDC Mars fact sheet: https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html
- NASA OSDR: https://osdr.nasa.gov/bio/repo/
- Canadian Space Agency youth and educator resources: https://www.asc-csa.gc.ca/eng/youth-educators/
- Credits, licences and fonts: [`CREDITS.md`](../CREDITS.md)
