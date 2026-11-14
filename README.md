# The Impossible SOLution

![Gameplay: walk to the mission console, plan three sols, see the domino chain of what caused what](docs/media/demo.gif)

**A browser game where kids aged 7–12 run a Mars base on real NASA data and learn that no choice is free.**

**[▶ Play it now](https://yyn192.github.io/impossible-solution/)** (no login, works on phones) · [Team brief (PDF)](docs/team-brief.pdf) · [Contributing](CONTRIBUTING.md) · [Changelog](CHANGELOG.md)

## Quick start

```bash
git clone https://github.com/YYN192/impossible-solution.git && cd impossible-solution && npm install && npm run dev
```

Needs Git and Node.js 22 LTS (20.19+ works). Then open http://localhost:5173/impossible-solution/.

A browser game for kids aged 7–12. You run a Mars base for 3 sols (a sol is one day on Mars). There is never enough power or people for every job, so every choice costs something. At the end, a domino chain shows which of your choices caused each problem. The game uses real NASA data: InSight's dusty solar panels, the 20 May 2024 solar storm that Curiosity measured on Mars, and DONKI space-weather forecasts.

Built for the NASA Space Apps Challenge 2026 ("Build a Junior Astronaut Mission Trainer") by team **SoftUniors**, Sofia.

## What is in the game

- A pure, deterministic three-sol simulation with power, air, food and radiation trade-offs.
- A causal domino report that traces each outcome back to the player's choices.
- A fixed `?demo=1` recording path that uses bundled data and replays the same five-link story every time.
- An offline-first NASA data layer with honest **LIVE** and **SAVED DATA** labels.
- A Data Sources screen that separates real measurements from explicitly labelled game numbers and simplifications.

## Commands

| Command            | What it does                                           |
| ------------------ | ------------------------------------------------------ |
| `npm run dev`      | Run locally with live reload                           |
| `npm test`         | Run the Vitest tests once                              |
| `npm run build`    | Type-check and build into `dist/` (what gets deployed) |
| `npm run preview`  | Serve the built `dist/` locally                        |
| `npm run ingest`   | Refresh NASA/CSA snapshots and media (see below)       |
| `npm run snapshot` | Compatibility alias for `npm run ingest`               |

### URL modes

| Mode         | Behaviour                                                                                 |
| ------------ | ----------------------------------------------------------------------------------------- |
| `?offline=1` | Never uses the network; reads bundled NASA/CSA snapshots only                             |
| `?demo=1`    | Runs the deterministic video scenario and implies offline mode                            |
| `?sun=today` | Uses current Mars-bound DONKI forecasts when available, otherwise shows the saved mission. Also the main-menu choice "Today's real Sun" |

`?demo=1&offline=1` is the regression-tested recording URL. It always uses the same May 2024 storm data, starting state and three-sol plan.

**NASA key (for data refreshes):** copy `.env.example` to `.env` and put your free key from https://api.nasa.gov after `NASA_API_KEY=`. Never commit `.env`, and never put the key in a `VITE_*` variable. The canonical pipeline is `npm run ingest`; `npm run snapshot` remains as a compatibility alias for the team's existing workflow. See [`docs/data-pipeline.md`](docs/data-pipeline.md) for source-specific commands and safeguards.

## Hosting and backend

Two hosts build the same code:

| Host | URL | Base path | Backend |
| --- | --- | --- | --- |
| Vercel (main) | the Vercel project `impossible-solution` (production URL once the project is imported) | `/` (`BASE_PATH=/`) | yes: `api/` functions, `VITE_API_BASE=/api` |
| GitHub Pages (fallback) | https://yyn192.github.io/impossible-solution/ | `/impossible-solution/` (default) | no: the browser calls DONKI directly with DEMO_KEY, else saved data |

Backend endpoints (`api/`, Vercel Node functions, allowlisted, never an open proxy). Each answers
`{source: "live" | "cached", fetchedAt, upstream, data}` (`stale: true` when it is the last good copy), or a JSON error (400 bad input, 502 NASA error, 504 timeout):

| Endpoint | Upstream | CDN cache |
| --- | --- | --- |
| `GET /api/donki/:type?startDate&endDate` (`CME`, `WSAEnlilSimulations`, `GST`, `FLR`, `SEP`, `notifications&type=`) | CCMC DONKI (no key) first, then `api.nasa.gov/DONKI` with our key; max 60-day window | 1 h + SWR |
| `GET /api/osdr/search?term&size` (size 1–25) | `osdr.nasa.gov/osdr/data/search` | 1 day + SWR |
| `GET /api/dsn/mars` | DSN Now `dsn.xml` → Mars spacecraft + round-trip light time | 60 s |
| `GET /api/status` | which upstreams answer now, and whether a personal key is set | 5 min |

The NASA key lives only in Vercel → Settings → Environment Variables → `NASA_API_KEY` (server-side; DEMO_KEY if unset).
`?offline=1` and `?demo=1` never call `/api`. Code: `api/_lib/nasa.ts` (tests next to it).

## Project map

```
src/sim/types.ts       shared contract + job cause/effect table (read this first)
src/sim/               game engine (pure TypeScript, no React)
src/data/              mission/data boundary, resilient clients and source metadata
src/data/demo.ts       deterministic recording start, plans and expected causal chain
src/data/gameNumbers.ts engine-derived registry of every disclosed game number
src/data/snapshots/    saved NASA/CSA JSON used by the offline game
src/components/        reusable interface components shared by screens
src/screens/           title, reports, planner placeholder, sources and final chain
src/state/             Zustand stores for navigation, mission setup, game state and best score
src/test/fixtures/     shared test fixtures (not production data)
src/demo.test.tsx      full-UI regression test that replays the demo twice
src/i18n/              en.json + bg.json: every kid-facing sentence, same keys in both
scripts/ingest/        canonical data download, validation and normalization pipeline
scripts/generate-audio.mjs  original 8-bit sound library (see docs/audio.md)
public/data/           tracked images and Mars map tiles served beside the app
public/audio/          63 generated sound effects and loops + audio-manifest.json
docs/                  documentation index, full guide, pitch, concept and decision archive
```

Start with [`docs/README.md`](docs/README.md) for the documentation map, [`docs/documentation.md`](docs/documentation.md) for the full project guide, [`docs/pitch/pitch.html`](docs/pitch/pitch.html) for the pitch deck, and [`docs/audio.md`](docs/audio.md) for the sound library.

### UI branch entry points

`index.html` opens the Mars menu, `hub.html` opens the walkable station, and `console.html` opens the planning prototype. `mission.html` opens the upstream mission app with its reports and data sources. All four pages are included in the production build.

## Credits & licence

Apache-2.0. Data sources, libraries and AI use: `CREDITS.md` and `docs/ai-usage-log.md`.
Uses NASA open data. Not affiliated with or endorsed by NASA.
