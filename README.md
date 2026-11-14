# The Impossible SOLution

**Play it:** https://yyn192.github.io/impossible-solution/ · **Team brief (PDF):** [`docs/team-brief.pdf`](docs/team-brief.pdf) · **Your tasks:** [Issues](https://github.com/YYN192/impossible-solution/issues)

A browser game for kids aged 7–12. You run a Mars base for 3 sols (a sol is one day on Mars). There is never enough power or people for every job, so every choice costs something. At the end, a domino chain shows which of your choices caused each problem. The game uses real NASA data: InSight's dusty solar panels, the 20 May 2024 solar storm that Curiosity measured on Mars, and DONKI space-weather forecasts.

Built for the NASA Space Apps Challenge 2026 ("Build a Junior Astronaut Mission Trainer") by team **SoftUniors**, Sofia.

## What is in the game

- A pure, deterministic three-sol simulation with power, air, food and radiation trade-offs.
- A causal domino report that traces each outcome back to the player's choices.
- A fixed `?demo=1` recording path that uses bundled data and replays the same five-link story every time.
- An offline-first NASA data layer with honest **LIVE** and **SAVED DATA** labels.
- A Data Sources screen that separates real measurements from explicitly labelled game numbers and simplifications.

---

## 1. Set up your computer (once, ~10 min)

You need **Git** and **Node.js 22 LTS** (20.19+ also works).

**Windows** (PowerShell):

```powershell
winget install --id Git.Git -e
winget install OpenJS.NodeJS.LTS
```

Close PowerShell and open a new one, then check: `git --version` and `node -v`.

**macOS**:

```bash
brew install git node@22    # or download Node LTS from https://nodejs.org
```

First time with Git on this computer:

```bash
git config --global user.name "Your Name"
git config --global user.email "the email of your GitHub account"
```

Accept the repo invite on GitHub first (email, or https://github.com/YYN192/impossible-solution/invitations).

## 2. Get the project and run it

```bash
git clone https://github.com/YYN192/impossible-solution.git
cd impossible-solution
npm install
npm run dev
```

Open http://localhost:5173/impossible-solution/. The page reloads by itself when you save a file. Stop it with `Ctrl+C`.

The first `git push` opens a browser window to log in to GitHub. Allow it.

## 3. Work on your branch

Each person has their own branch:

| Person     | Branch       | Works in                                                                 |
| ---------- | ------------ | ------------------------------------------------------------------------ |
| Aleksandar | `sim/engine` | `src/sim/`                                                               |
| Yavor      | `data/layer` | `src/data/`, `scripts/ingest/`, `public/data/`                           |
| Viktor     | `ui/planner` | `src/screens/Plan*`                                                      |
| Danislav   | `ui/reports` | `src/App.tsx`, `src/screens/` (title, morning, final), `src/i18n/` setup |
| Nikolay P. | `copy/text`  | `src/i18n/en.json`, `CREDITS.md`, `docs/`                                |

**Start of a work session** (do this every time, so you have everyone's newest work):

```bash
git switch <your-branch>      # e.g. git switch ui/planner
git pull                      # get your branch's latest
git fetch                     # download everyone else's work
git merge origin/main         # add the newest main into your branch
npm install                   # install any new libraries someone added
npm run dev
```

Always run `npm install` after pulling or merging. If you skip it and someone added a library, you get errors like `Cannot find module` or `Failed to resolve import`.

**Just want to play the newest version** (not working on a branch):

```bash
cd impossible-solution
git switch main
git pull
npm install
npm run dev
```

**Git says "your local changes would be overwritten"?** You have unsaved work. Either commit it first (`git add -A && git commit -m "WIP"`), or put it aside, update, and bring it back:

```bash
git stash                     # put your changes aside
git pull                      # (or the merge commands above)
git stash pop                 # bring your changes back
```

**Still broken after updating?** Reinstall the libraries from scratch:

```bash
# macOS
rm -rf node_modules && npm install
# Windows (PowerShell)
Remove-Item -Recurse -Force node_modules; npm install
```

**Save and share your work** (every 30–60 min, small steps):

```bash
npm run build && npm test     # must pass before every push
git add -A
git commit -m "Plan screen: tap astronaut then job"
git push
```

**Get it into the game:** on GitHub, open a **Pull Request** from your branch into `main` (GitHub shows a "Compare & pull request" button after you push). The PR check builds and tests it automatically. When it's green, merge it. Every merge to `main` updates the live site in about 1 minute.

**If Git says there is a conflict:** don't panic and don't delete anything. Open the file, keep the right lines, remove the `<<<<<<<`, `=======`, `>>>>>>>` markers, then `git add -A && git commit`. Ask in the team chat if unsure.

## 4. Commands

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
| `?sun=today` | Uses current Mars-bound DONKI forecasts when available, otherwise shows the saved mission |

`?demo=1&offline=1` is the regression-tested recording URL. It always uses the same May 2024 storm data, starting state and three-sol plan.

**NASA key (for data refreshes):** copy `.env.example` to `.env` and put your free key from https://api.nasa.gov after `NASA_API_KEY=`. Never commit `.env`, and never put the key in a `VITE_*` variable. The canonical pipeline is `npm run ingest`; `npm run snapshot` remains as a compatibility alias for the team's existing workflow. See [`docs/data-pipeline.md`](docs/data-pipeline.md) for source-specific commands and safeguards.

## 5. Project map

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
src/i18n/en.json       every kid-facing sentence (bg.json later)
scripts/ingest/        canonical data download, validation and normalization pipeline
public/data/           tracked images and Mars map tiles served beside the app
docs/                  project documentation; see docs/README.md for its status map
```

## 6. Team rules

- Short kid sentences; explain any science word. Text lives in `src/i18n/en.json`, never hard-coded.
- Buttons ≥ 44 px, everything works with keyboard and touch, respect reduced motion.
- Every number has a source or is labelled "game number". Never call saved data "live".
- New library, icon, font or AI use → a row in `CREDITS.md` / `docs/ai-usage-log.md` the same day. No NASA logos.
- No photos, faces or voices of team members (we're under 18) in the video or project page.

## Credits & licence

Apache-2.0. Data sources, libraries and AI use: `CREDITS.md` and `docs/ai-usage-log.md`.
Uses NASA open data. Not affiliated with or endorsed by NASA.
