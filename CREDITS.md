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
| Curiosity RAD dose rates 15–25 May 2024 (MSL-RAD-Surface, absorbed dose rate in silicon, µGy/h) — NASA OSDR RadLab | https://visualization.osdr.nasa.gov/radlab/ | Storm curve on Data Sources (peak vs normal); trimmed to hourly averages | 2026-11-14 (snapshot) |
| OSDR studies OSD-267, OSD-772, OSD-766, OSD-658 + search "Veggie" | https://osdr.nasa.gov/bio/repo/ | "Real plants grown in space" cards (titles + links only) | 2026-11-14 (snapshot) |
| NASA Image and Video Library: PIA25287 (InSight dusty selfie), PIA26302 (Curiosity camera, May 2024 storm), PIA16058 (Gale Crater) — NASA/JPL-Caltech | https://images.nasa.gov/ | Pictures next to the dust, storm and base-site facts; small copies in public/data/img/ | 2026-11-14 (snapshot) |
| NASA Mars Trek, Viking MDIM 2.1 colour mosaic (NASA/JPL-Caltech, USGS), 4 tiles around Gale Crater | https://trek.nasa.gov/mars/ | "Where is our base?" map; copies in public/data/trek/ | 2026-11-14 (snapshot) |
| DONKI FLR, SEP, CME, GST, notifications, last 30 days | https://api.nasa.gov/DONKI/ | "What the Sun did this month" (context only; most never reach Mars) | 2026-11-14 (snapshot), refreshed every 3 h by the deploy workflow |
| Astronomy Picture of the Day (science.nasa.gov) — each picture has its own credit/copyright | https://science.nasa.gov/wp-json/wp/v2/apod-basic | Link + credit only; the picture is never copied | 2026-11-14 (snapshot), refreshed every 3 h |
| DONKI CME 2017-09-10T16:09:00-CME-001 and 2021-10-28T15:53:00-CME-001 with their WSA-Enlil Mars forecasts | https://ccmc.gsfc.nasa.gov/DONKI/view/CME/13107/-1 · https://ccmc.gsfc.nasa.gov/DONKI/view/CME/18106/-1 | Storm pool: the Sep 2017 and Oct 2021 storms, storm cloud of 13 Sep 2017 | 2026-11-14 (snapshot `storm-pool.json`, through our /api proxy) |
| Curiosity RAD dose rates 8–14 Sep 2017 and 26 Oct–1 Nov 2021 (MSL-RAD-Surface) — NASA OSDR RadLab | https://visualization.osdr.nasa.gov/radlab/gui/ | Size of the two small storms (worst hour ÷ quiet level, about 3 times each) | 2026-11-14 (read by us; values in `src/data/storms.ts`) |
| LRO CRaTER dose rates, May 2024 (CRaTER-D1D2) — NASA OSDR RadLab | https://visualization.osdr.nasa.gov/radlab/gui/ | South Pole Outpost: the storm seen from the Moon's orbit (about 1.3 times) | 2026-11-14 (read by us) |
| NASA Deep Space Network Now (round-trip light time of Mars links) | https://eyes.nasa.gov/dsn/dsn.html | Today's radio delay in Ask Earth and the radio beat | live through /api/dsn/mars + 2026-11-14 snapshot `dsn-mars.json` |
| InSight power after landing and in spring 2022 (NASA Photojournal) | https://science.nasa.gov/photojournal/insights-power-generation-after-landing-and-spring-2022 | Dust Season briefing and Elysium Planitia site | 2026-11-14 (constant) |
| InSight sand-trickle power boost, May 2021 (NASA/JPL news) | https://www.nasa.gov/feature/jpl/nasa-s-insight-mars-lander-gets-a-power-boost | Dust Season: wipe beat, ending card | 2026-11-14 (constant) |
| Opportunity's last message, 10 June 2018 (NASA/JPL) | https://www.jpl.nasa.gov/images/opportunitys-last-message | Dust Season: the 2018 global dust storm | 2026-11-14 (constant) |
| Spirit and Opportunity wind cleaning events (The Planetary Society, from JPL mission updates) | https://www.planetary.org/articles/08-31-mer-update-1 | Dust Season: Meridiani site, dust-devil choice | 2026-11-14 (constant) |
| Curiosity REMS weather feed, sol 4995 (25 Aug 2026), min −71 °C — NASA/JPL-Caltech/CAB (CSIC-INTA) | https://mars.nasa.gov/rss/api/?feed=weather&category=msl&feedtype=json | Dust Season: Gale Crater site, cold-night choice (labelled "reading from 25 Aug 2026", never live) | 2026-11-14 (constant) |
| NASA Artemis candidate landing regions (news release, 19 Aug 2022) | https://www.nasa.gov/news-release/nasa-identifies-candidate-regions-for-landing-next-americans-on-moon/ | South Pole Outpost: site names and what they were chosen for | 2026-11-14 (constant) |
| Earth–Moon distance (NASA Moon fact sheet) | https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html | Moon radio delay, about 1.3 s | 2026-11-14 (constant) |

## Partner agency resources

| Resource | Link | Used for | Terms |
|---|---|---|---|
| Canadian Space Agency — Food production on the Moon and in remote areas (toolkit) | https://www.asc-csa.gc.ca/eng/youth-educators/toolkits/food-production/ | "For teachers and families" links (snapshot 2026-11-14) | Linked only, not reproduced; CSA terms https://www.asc-csa.gc.ca/eng/terms.asp#copyright |
| Canadian Space Agency — Space resources for STEM and youth organizations | https://www.asc-csa.gc.ca/eng/youth-educators/resources-stem-and-youth-organizations.asp | "For teachers and families" links (snapshot 2026-11-14) | as above |

## Libraries (licence)

Licences read from each package's `license` field in `node_modules`.

| Library | Where | Licence |
|---|---|---|
| playwright-core | QA harness only (`scripts/qa`, dev dependency) | Apache-2.0 |
| @fontsource/pixelify-sans, @fontsource/nunito | Self-hosted fonts (see Fonts) | OFL-1.1 |
| react, react-dom | runtime | MIT |
| i18next, react-i18next | runtime | MIT |
| zod | runtime | MIT |
| zustand | runtime | MIT |
| vite, @vitejs/plugin-react | build | MIT |
| typescript | build | Apache-2.0 |
| @types/node, @types/react, @types/react-dom | types, dev only | MIT |
| vitest, jsdom, msw | tests, dev only | MIT |
| @testing-library/react, @testing-library/jest-dom | tests, dev only | MIT |
| prettier, oxlint | formatting and lint, dev only | MIT |
| playwright-core | dev-only browser QA script (scripts/qa) | Apache-2.0 |

## Assets (author, licence, link)

| Asset | Author/source | Licence | Notes |
|---|---|---|---|
| Original procedural Mars pixel-art sprites (`src/assets/pixel/`) | SoftUniors project, generated by `scripts/generate-pixel-assets.mjs` | Apache-2.0 (project) | Title-screen vignette and reusable prototype sprite library |
| Hub pixel art: floors, walls, player, crew, drone, console, crate (49 PNGs in `src/assets/pixel/`, source `art-src/pixel/hub.px.js`) | Team SoftUniors, drawn as code by Claude Code with pxl | Apache-2.0 (this repo) | Original art, no NASA marks, cartoon faces of nobody real |
| Campaign sprites: rover, map markers, solar panels, skill icons, mission cards, Pip frames, briefing planets (24 PNGs in `src/assets/pixel/campaign/`, source `art-src/pixel/campaign.px.js`) | Team SoftUniors, drawn as code by Claude Code with pxl (MIT) | Apache-2.0 (this repo) | Original art, no NASA marks, cartoon drone, no real people |
| Job mini-game sprites: panels, plants, drops, blocks, dish, Earth, holes, check (17 PNGs in `src/assets/pixel/minigame/`, source `scripts/generate-minigame-assets.mjs`) | Team SoftUniors (Alex D.), generated by code written with Claude Code, in the shared palette | Apache-2.0 (this repo) | Procedural, original, no NASA marks |
| pxl pixel-art DSL (build tool only, not shipped) — https://github.com/crsolver/claude-pxl @ 21fee41 | crsolver | MIT | Used locally from `tools/claude-pxl` to render the hub sprites |
| Original 8-bit sound effects and ambience loops (`public/audio/`, 63 WAV files + AAC `.m4a` copies of the 3 ambience loops, encoded with FFmpeg's built-in AAC encoder) | SoftUniors project, synthesised by `scripts/generate-audio.mjs` (oscillators, noise, envelopes; no samples) | Apache-2.0 (project) | Game sound cues, not NASA recordings. The menu loop `space-menu-ambience` also plays in the Moon base hub as `moon-base-ambience` (#76). See docs/audio.md |
| Game icons: 51 icons (power, air, food, space rays, jobs, weather, places, interface) + 4 badges (✗, up, down, zero), 16×16 (55 PNGs in `src/assets/pixel/icons/`, source `art-src/pixel/icons.px.js`) | Team SoftUniors, drawn as code by Claude Code with pxl (MIT) | Apache-2.0 (this repo) | Original art, replaces every emoji in the game (#50). No NASA marks, no downloaded icon packs, cartoon faces of nobody real |
| `public/favicon.svg` (Mars + Sun icon) | Team SoftUniors (SVG code written with Claude Code, see AI log) | Apache-2.0 (this repo) | Original, no NASA marks |
| Teacher card print style | Team SoftUniors | Apache-2.0 (this repo) | Plain CSS |
| "What's this?" tooltip style | Team SoftUniors | Apache-2.0 (this repo) | Plain CSS, no icon font |

## Fonts

The game self-hosts two fonts through npm (latin + cyrillic, weights 400 and 700, served from our own origin; nothing is fetched from Google):

| Font | Where | Licence | Link |
|---|---|---|---|
| Pixelify Sans (Stefie Justprince) via `@fontsource/pixelify-sans` | Headings, buttons, labels | SIL OFL 1.1 | https://fontsource.org/fonts/pixelify-sans |
| Nunito (Vernon Adams, Jacques Le Bailly, Manvel Shmavonyan, Alexei Vanyashin) via `@fontsource/nunito` | Paragraphs and kid text | SIL OFL 1.1 | https://fontsource.org/fonts/nunito |

 The pitch deck (`docs/pitch/pitch.html`, not part of the game) loads Fredoka and Nunito Sans from Google Fonts (SIL Open Font License 1.1).

No NASA logos, the NASA "meatball" or the NASA "worm" are used anywhere.

## Reference code

- Generic API resilience patterns adapted from the team's prep notes (Apache-2.0).

## AI tools — see docs/ai-usage-log.md

Uses NASA open data and Canadian Space Agency resources. Not affiliated with or endorsed by NASA or the Canadian Space Agency.
