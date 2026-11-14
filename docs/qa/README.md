# QA harness

Scripted Chrome checks (playwright-core, uses your installed Google Chrome, downloads nothing).

    npm run qa                          # all checks against http://localhost:5191/impossible-solution/
    node scripts/qa/run.mjs layout a11y # some checks
    node scripts/qa/run.mjs --base=https://impossible-solution.vercel.app/   # production
    node scripts/qa/run.mjs layout --shots   # also saves docs/qa/layout-<screen>-<w>x<h>.png (320x568, 844x390, 1366x768)

Start the dev server first: `npx vite --port 5191 --strictPort`. Output is one line per finding, then `PASS <check>` or `FAIL <check> (n findings)`. Exit code 1 if any check fails. `WARN` lines never fail a check.

| Check | What it does |
|---|---|
| `layout` | 10 viewports x 8 screens (menu, hub, hub dialogue, plan, end of sol, final, data sources, teacher card): no horizontal scroll; every interactive element inside the viewport, reachable and not covered; at least 44x44 px (48 on the three phone sizes, which use touch emulation); WARN for text under 12 px. |
| `resize` | Resizes one page live through 1366x768, 390x844, 844x390, 320x568, 1920x1080 on hub, dialogue, plan and final, re-checks overflow and reachability, then checks input still works. Also holds an arrow key, rotates, fires `orientationchange`/`resize`/`blur`, and asserts the player stops. |
| `network` | Plays a full mission with `?offline=1` and `?demo=1` (plus Data Sources). Fails on any `/api/` request or any other origin. |
| `reload` | Reload on the plan screen of sol 2 must stay on sol 2 (`?demo=1` must start fresh). Fails until persistence is implemented. |
| `keyboard` | Whole game with Tab/Shift+Tab/Enter/Space/arrows/E only at 1280x720. Fails when a step needs the mouse, focus falls to `<body>` after a dialogue or tooltip closes, or a Tab stop has no visible focus indicator. |
| `touch` | Whole game with taps only (390x844, touch + mobile emulation). |
| `a11y` | Accessible name on every control, labelled dialogs, `<html lang>` follows the language toggle, canvas name and text alternative, and with reduced motion: no running animation and no transform/opacity transition over 0.01 s. |

## Updating the flow

All player steps live in `scripts/qa/flows.mjs` (`startMission`, `skipToConsole`, `toPlan`, `assignAll`, `endSol`, `playToFinal`, `openDialogue`, `SCREENS`). UI text comes from `src/i18n/en.json`, so only the flow order needs editing when screens change.
