<div align="center">

# The Impossible SOLution

**Run a Mars base on real NASA data. Fix it now, or pay for it later.**

A browser game for kids aged 7–12 where no choice is free.

<a href="https://yyn192.github.io/impossible-solution/"><strong>▶ Play now</strong></a> ·
<a href="#quick-start">🚀 Quick start</a> ·
<a href="#nasa-data">🛰️ NASA data</a> ·
<a href="docs/README.md">📚 Docs</a> ·
<a href="CONTRIBUTING.md">🤝 Contributing</a> ·
<a href="CHANGELOG.md">📝 Changelog</a>

[![CI](https://img.shields.io/github/actions/workflow/status/YYN192/impossible-solution/ci.yml?branch=main&label=CI)](https://github.com/YYN192/impossible-solution/actions/workflows/ci.yml)
[![Deploy](https://img.shields.io/github/actions/workflow/status/YYN192/impossible-solution/deploy.yml?branch=main&label=deploy)](https://github.com/YYN192/impossible-solution/actions/workflows/deploy.yml)
[![Release](https://img.shields.io/github/v/release/YYN192/impossible-solution)](https://github.com/YYN192/impossible-solution/releases)
[![License](https://img.shields.io/github/license/YYN192/impossible-solution)](LICENSE)
[![NASA Space Apps 2026](https://img.shields.io/badge/NASA%20Space%20Apps-2026-0b3d91)](https://www.spaceappschallenge.org/)

<img src="docs/media/demo.gif" alt="Gameplay: walk to the mission console, plan three sols, see the domino chain of what caused what" width="720">

</div>

## What is it?

You run a Mars base for 3 sols (a sol is one day on Mars). There is never enough power or people for every job, so every choice costs something. At the end, a domino chain shows which of your choices caused each problem.

Built for the NASA Space Apps Challenge 2026 ("Build a Junior Astronaut Mission Trainer") by team **SoftUniors**, Sofia.

## Key features

- 🧮 **Real trade-offs.** A pure, deterministic three-sol simulation of power, air, food and radiation.
- 🔗 **Domino chain.** The final report traces each outcome back to the player's choices.
- 🛰️ **Real NASA data, honestly labelled.** An offline-first data layer with **LIVE** and **SAVED DATA** badges.
- 🔎 **Where our numbers come from.** A Data Sources screen separates real measurements from labelled game numbers.
- 🎬 **Repeatable demo.** `?demo=1` replays the same five-link story every time, from bundled data.
- 🌍 **English and Bulgarian**, keyboard and touch, no login, works on phones.

## Quick start

```bash
git clone https://github.com/YYN192/impossible-solution.git && cd impossible-solution && npm install && npm run dev
```

Needs Git and Node.js 22 LTS (20.19+ works). Then open http://localhost:5173/impossible-solution/.

## How to play

1. Walk to the glowing **mission console** (arrow keys / WASD, or tap).
2. Give each astronaut one job for the sol. Watch the bars change before you commit.
3. Sleep, see what happened, repeat for 3 sols, then follow the dominoes.

### URL modes

| Mode         | Behaviour                                                                                 |
| ------------ | ----------------------------------------------------------------------------------------- |
| `?offline=1` | Never uses the network; reads bundled NASA/CSA snapshots only                             |
| `?demo=1`    | Runs the deterministic video scenario and implies offline mode                            |
| `?sun=today` | Uses current Mars-bound DONKI forecasts when available, otherwise shows the saved mission |
| `?lang=bg`   | Starts in Bulgarian                                                                       |

`?demo=1&offline=1` is the regression-tested recording URL. It always uses the same May 2024 storm data, starting state and three-sol plan.

## NASA data

The game uses InSight's dusty solar panels, the 20 May 2024 solar storm that Curiosity measured on Mars, and DONKI space-weather forecasts. Every source is listed in the in-game **Where our numbers come from** screen and in [`CREDITS.md`](CREDITS.md). Saved data is never labelled live.

**Refreshing the data:** copy `.env.example` to `.env` and put your free key from https://api.nasa.gov after `NASA_API_KEY=`, then run `npm run ingest`. Never commit `.env`, and never put the key in a `VITE_*` variable. See [`docs/data-pipeline.md`](docs/data-pipeline.md) for source-specific commands and safeguards.

## Commands

| Command            | What it does                                           |
| ------------------ | ------------------------------------------------------ |
| `npm run dev`      | Run locally with live reload                           |
| `npm test`         | Run the Vitest tests once                              |
| `npm run build`    | Type-check and build into `dist/` (what gets deployed) |
| `npm run preview`  | Serve the built `dist/` locally                        |
| `npm run ingest`   | Refresh NASA/CSA snapshots and media                   |
| `npm run snapshot` | Compatibility alias for `npm run ingest`               |

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

`index.html` opens the Mars menu, `hub.html` the walkable station, `console.html` the planning prototype, and `mission.html` the upstream mission app with its reports and data sources. All four are in the production build.

Start with [`docs/README.md`](docs/README.md) for the documentation map, [`docs/documentation.md`](docs/documentation.md) for the full guide, [`docs/pitch/pitch.html`](docs/pitch/pitch.html) for the pitch deck, and [`docs/audio.md`](docs/audio.md) for the sound library.

## Privacy

No login, no analytics, no cookies. The browser stores only your language, sound settings and a cache of NASA data. The only network calls go to NASA servers, and `?offline=1` turns those off too.

## Contributing

Bug or idea? [Open an issue](https://github.com/YYN192/impossible-solution/issues/new/choose). Questions go to [Discussions](https://github.com/YYN192/impossible-solution/discussions). Team setup and workflow are in [`CONTRIBUTING.md`](CONTRIBUTING.md).

## License

[Apache-2.0](LICENSE). Data sources, libraries and AI use: [`CREDITS.md`](CREDITS.md) and [`docs/ai-usage-log.md`](docs/ai-usage-log.md).
Uses NASA open data. Not affiliated with or endorsed by NASA.
