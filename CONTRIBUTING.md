# Contributing

Thanks for helping! This is a NASA Space Apps 2026 hackathon project by team **SoftUniors**. The team works from issues: see the [open issues](https://github.com/YYN192/impossible-solution/issues), or [good first issues](https://github.com/YYN192/impossible-solution/labels/good%20first%20issue) if you are new.

Found a bug or have an idea? [Open an issue](https://github.com/YYN192/impossible-solution/issues/new/choose). Questions go to [Discussions](https://github.com/YYN192/impossible-solution/discussions).

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

## 4. Rules for every change

- Short kid sentences; explain any science word. Text lives in `src/i18n/en.json`, never hard-coded.
- Buttons ≥ 44 px, everything works with keyboard and touch, respect reduced motion.
- Every number has a source or is labelled "game number". Never call saved data "live".
- New library, icon, font or AI use → a row in `CREDITS.md` / `docs/ai-usage-log.md` the same day. No NASA logos.
- No photos, faces or voices of team members (we're under 18) in the video or project page.
