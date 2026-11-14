# Build plan v2 — Sat 14 Nov 11:00 → Sun 23:59 (Sofia)

Source: `docs/concept.md` v2 and `docs/council/verdict.md`. **Gate decider: Aleksandar** (engine owner; Yavor is backup).

## Rules from commit 1

- All kid text in `src/i18n/en.json` (BG later from the same keys). No hard-coded strings.
- Tap targets ≥ 44 px, everything works with keyboard and touch, `prefers-reduced-motion` respected.
- `main` always builds: `npm run build && npm test` before every push. Small PRs/branches per person.
- Every number has a source or is labelled "game number". New library or asset → `CREDITS.md` the same minute. AI use → `docs/ai-usage-log.md`.

## Roles

| Who                          | Owns                                                                                                                    | First task (11:00)                                                                                         |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| **Aleksandar**               | `src/sim/`: types, causal table, `step(state, plan, event)`, Vitest                                                     | Review/finish `src/sim/types.ts` + job table; tests: determinism, 3-link chain, 3★ reachable (brute force) |
| **Yavor**                    | `src/data/`: DONKI snapshots, WSA-Enlil Mars filter, LIVE/SNAPSHOT badge, `?offline=1`, `?demo=1`, Data Sources screen  | `scripts/snapshot.mjs` + `public/snapshots/*.json` for 20 May (CME) and 23→28 May (WSA-Enlil Mars)         |
| **Viktor**                   | Plan screen: crew + 5 job cards, tap-tap, instant bar preview                                                           | Static screen against the types, fake state                                                                |
| **Danislav**                 | Morning report (fallen domino first), end-of-sol, final domino chain + stars                                            | Static screens against the types, fake chain                                                               |
| **Nikolay P.**               | `en.json` copy, "What's this?" tooltips, "What this game simplifies" card, CREDITS, AI log, icons (emoji/SVG, licensed) | Draft all kid text in `en.json` from concept.md                                                            |
| **Nikolai Palashev** (guide) | Real-kid playtest contact for Sat 18:00, review of the teacher card                                                     | —                                                                                                          |

## Gates

| When          | Gate                                                                                                          | Check               |
| ------------- | ------------------------------------------------------------------------------------------------------------- | ------------------- |
| **Sat 14:00** | Playable loop: plan → end sol → next morning ×3 → end screen. Ugly OK. Deployed.                              | Aleksandar          |
| 14–16         | Costs both ways, morning domino, Ask Earth answer, burst on sol 2                                             |                     |
| 16:00         | science-checker on all kid text and numbers                                                                   |                     |
| **Sat 18:00** | **Real-kid playtest** (a younger sibling/cousin, 7–12; guardian present, no recording of the child)           | Nikolai             |
| **Sat 19:00** | **MVP**: stars + Best, final chain, Data Sources, badge, `?offline=1`, `?demo=1`. `/space-apps-judge` pass #1 | Aleksandar          |
| 19–23         | Fixes from playtest; then the prediction tap, "Today's Sun", BG strings, teacher card                         |                     |
| **Sat 23:00** | **Feature + copy freeze** (BG translation only from frozen EN)                                                |                     |
| Sun 08–10     | Fixes only; `/space-apps-judge` pass #2; rules-auditor                                                        |                     |
| Sun 10–12     | Record ≤ 30 s video from `?demo=1`, captions, no minor voices/faces                                           | Viktor + Nikolay P. |
| **Sun 13:00** | Upload local demo video (1 h buffer before 14:00)                                                             | Yavor               |
| Sun 14–16     | `/pitch-prep`: 3-min pitch + Q&A drill (defend game numbers vs. real data)                                    | all                 |
| Sun 16:00     | Live finals                                                                                                   |                     |
| **Sun 20:00** | Global submission (`/submission-pack`), hard deadline 23:59                                                   | Yavor               |

## Drop order if a gate slips (decider: Aleksandar)

1. Prediction tap
2. "Today's Sun" live run (snapshot only)
3. BG toggle (strings stay in i18n)
4. Stars → simple pass/fail
5. Teacher card → static page/PDF

**Never drop:** morning domino · Ask Earth · snapshot storm · Data Sources screen · LIVE/SNAPSHOT badge · `?demo=1` / `?offline=1`.

## Pitch spine (draft for Sun)

1. Problem: kids see Mars outcomes, never the decisions.
2. Demo: the domino chain (8 s).
3. Real data: InSight dust, Curiosity's 20 May 2024 storm, DONKI's Mars forecast; "help from Earth can't beat a particle blast".
4. Proof it teaches: playtest quote and observation from Saturday.
5. Honest: "What this game simplifies" card.
