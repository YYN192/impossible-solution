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

## The `labels` check

Every button, link, summary and input on menu, hub, morning, plan, night, final, data sources and teacher card, at 360x640, 390x844, 844x390, 768x1024, 1366x768, in English and Bulgarian (language toggle). It asserts: label not clipped, no ellipsis, label inside its box, at most 3 lines (long source titles in Data Sources are citations and skip this), font at least 14 px, target at least 44 px (48 px on phones), line-height at least 1.15, siblings in one row share height and padding. `--shots-prefix=before|after` saves `docs/qa/labels-<prefix>-<screen>-<lang>-<390|1366>.png`.

The dev server ignores files inside `.claude/worktrees/`, so restart `vite` after editing CSS when working in a worktree.

## Rules applied (one shared button system in `src/ui.css`)

1. Targets at least 44 px, 48 px on touch (`pointer: coarse`): WCAG 2.2 SC 2.5.8 (24 px minimum) and the 44 pt Apple HIG / 48 dp Material guidance. https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html, https://developer.apple.com/design/human-interface-guidelines/accessibility, https://m3.material.io/foundations/designing/structure
2. No horizontal scroll at 320 CSS px, no clipped content: SC 1.4.10 Reflow. `overflow-wrap: anywhere`, `min-height` never a fixed `height` on text. https://www.w3.org/WAI/WCAG22/Understanding/reflow.html
3. Text uses rem and follows the OS text size, body text at least 1rem: SC 1.4.4 Resize Text. https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html
4. `text-wrap: balance` on short headings and labels, `hyphens: auto` (works because `<html lang>` follows the language). https://web.dev/articles/css-text-wrap
5. Fluid sizes with `clamp()` / `min()` and `dvh`, safe-area insets on the page edge. https://web.dev/learn/design
6. Size controls for the input method; pad edge UI with `env(safe-area-inset-*)` (modern-web-guidance `form-factor-adaptation`).
7. Contrast at least WCAG AA (SC 1.4.3) on every button state, visible focus ring (SC 2.4.7). https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
8. Reduced motion: no animation or transition (`prefers-reduced-motion`), the 8-bit look uses stepped shadows and a 2 px press, no new motion. Pixelify Sans is for short labels only; Bulgarian uses bold Nunito because the Cyrillic pixel glyphs were misread by kids.
