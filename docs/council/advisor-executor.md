# The Executor

3.5 h to the 14:00 loop. **First step 10:45–11:00:** one person writes `src/sim/types.ts` (`GameState`, `Job`, `StormEvent`, `Domino`, `seed`). Everyone builds against it.

11:00–13:30: API dev 1 — pure engine `step(state, plan, event) → {state, dominoes[]}`, every job costs both ways, Vitest determinism first. API dev 2 — data layer, bundled 20 May 2024 DONKI CME snapshot as default event; live DONKI only seeds a "Today's Sun" run; LIVE/SAVED badge, `?offline=1`. UI 1 — plan screen (tap astronaut, tap job, instant cost). UI 2 — morning report with fallen domino + end chain. Beginner — numbers fix, Data Sources text, CREDITS, AI log, icons.

**ADD:** DONKI snapshot drives storm day; Ask Earth (one state flag); morning domino; 1–3 stars + Best; `?demo=1`; icons/arrows; static teacher card (Sun, beginner); prediction tap only if MVP green by 19:00.
**CUT:** Moon, DSN clock, read-aloud, 5-day, OSDR cards, Engineer mode, animated dominoes, run comparison screen. Keep BG toggle.

13:30–14 integrate/deploy · 14–16 Ask Earth, morning domino, costs · 16–19 stars, demo seed, Data Sources, badge → MVP + kid-playtester · 19–23 icons, BG, prediction tap; freeze · Sun 08–10 real-kid playtest · 10–12 video from `?demo=1` · 12–13 science-checker + rules-auditor · 13:00 upload · 14–16 pitch drills.
