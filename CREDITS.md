# Credits

## NASA data

| Dataset | Link | Used for | Fetched |
|---|---|---|---|
| DONKI CME 2024-05-20T05:36:00-CME-001 | https://ccmc.gsfc.nasa.gov/DONKI/view/CME/31034/-1 | Storm on sol 2 of the main mission | 2026-11-14 (snapshot) |
| DONKI WSA-Enlil runs 19–24 May 2024 (Mars arrival 28 May) | https://api.nasa.gov/DONKI/WSAEnlilSimulations?startDate=2024-05-19&endDate=2024-05-24 | Ask Earth forecast, storm cloud on sol 3 | 2026-11-14 (snapshot) |
| DONKI WSA-Enlil runs, last 30 days (Mars-only) | https://api.nasa.gov/DONKI/WSAEnlilSimulations | Optional "Today's Sun" mission (live, falls back to snapshot) | live + 2026-11-14 snapshot |
| Curiosity RAD, 20 May 2024 storm (8.1 mGy) | https://www.jpl.nasa.gov/news/nasa-watches-mars-light-up-during-epic-solar-storm/ | Size of the particle burst | constant |
| Curiosity RAD surface baseline (Hassler et al., Science 2014) | https://doi.org/10.1126/science.1244797 | Normal daily dose | constant |
| InSight dust and solar power | https://www.jpl.nasa.gov/news/nasas-insight-waits-out-dust-storm/ | Panel-dust penalty | constant |
| NSSDC Mars fact sheet (light delay) | https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html | Ask Earth delay wording | constant |

## Libraries (licence)

| Library | Licence |
|---|---|
| React, React DOM | MIT |
| Vite, @vitejs/plugin-react | MIT |
| TypeScript | Apache-2.0 |
| Zustand | MIT |
| Zod | MIT |
| i18next, react-i18next | MIT |
| Vitest, jsdom, MSW, Testing Library, Prettier, oxlint (dev only) | MIT |

## Assets (author, licence, link)

| Asset | Author | Licence | Notes |
|---|---|---|---|
| Icons in the game (🧽 🥬 🛡️ 📡 🔬 ⚡ 🫧 ☢️ 😴 🛰️ ⭐) | Unicode emoji, drawn by each device's own emoji font | No image files shipped | We use emoji characters only, no downloaded icon packs |
| `public/favicon.svg` | Vite project template (the Vite logo) | MIT (Vite) | Placeholder from the scaffold. TODO: replace with our own Mars icon before submission |
| "What's this?" tooltip style | Team SoftUniors | Apache-2.0 (this repo) | Plain CSS, no icon font |

No NASA logos, the NASA "meatball" or the NASA "worm" are used anywhere, and no fonts are downloaded (system fonts only).

## Reference code

- Generic API resilience patterns adapted from the team's prep notes (Apache-2.0).

## AI tools — see docs/ai-usage-log.md

Uses NASA open data. Not affiliated with or endorsed by NASA.
