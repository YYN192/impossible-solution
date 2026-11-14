# AI usage log

Required in the Space Apps submission. One line per use: when, who, tool, what for, what we kept.

| When (Sofia) | Who | Tool | What for | Output used |
|---|---|---|---|---|
| Sat 14 Nov 10:00 | Yavor | Claude Code (Claude Opus 5.5) | Scaffold the Vite + React + TS project, licence/credits/log files | Project skeleton |
| Sat 14 Nov 10:30 | Yavor | Claude Code (Claude Opus 5.5) + judge/kid-playtester subagents | Score concept options, simulated kid feedback, draft concept doc | Concept decisions in docs/concept.md (team reviewed) |
| Sat 14 Nov 10:25–11:15 | Yavor | Claude Code + judge, kid-playtester, science-checker agents + llm-council skill (5 advisors, 5 peer reviews, chairman) | Weak points of concept v1, add/cut decisions | concept.md v2, plan.md, src/sim/types.ts draft; transcript in docs/council/ |
| Sat 14 Nov 11:00 | Yavor | Claude Code (Claude Opus 5.5) | Data layer: snapshot script, resilient fetch, DONKI Mars filter, mission setup, Data Sources screen, tests | Code on branch data/layer, reviewed by Yavor |
| Sat 14 Nov 11:30 | Yavor | Claude Code + science-checker agent | Verify every claim on the Data Sources screen; apply 6 wording fixes test-first | sources.ts, mission.ts, concept.md, team brief |
| Sat 14 Nov 11:00 | Danislav | Claude Code (Claude Opus 5.5) | #12 app shell: i18next setup + en.json, screen navigation store, title/morning/end-of-sol/final screens, tests | src/i18n/, src/state/, src/screens/, App.tsx (reviewed by Danislav) |
| Sat 14 Nov 11:20 | Danislav | Claude Code (Claude Opus 5.5) | #13 morning report: pickMorning logic, DominoCard, DataChip, fake 3-sol demo data, draft domino/event/Earth texts, tests | src/screens/ morning files, en.json keys (text to be reviewed by Nikolay P.) |
| Sat 14 Nov 12:00 | Yavor | Claude Code (Claude Opus 5.5) | Wire data layer into the app shell (mission store, badge, Data Sources in nav, notice), tests first; browser check offline | src/state/mission.ts, App.tsx, en.json keys |
| Sat 14 Nov 12:15 | Yavor | Claude Code (Claude Opus 5.5) | Engine spec tests for #1/#2 written before the engine (red) | src/sim/engine.test.ts, engine.chain.test.ts |
| Sat 14 Nov 11:15–12:11 | Aleksandar | Claude Code (Claude Opus 5.5) | #1/#2/#3 engine: failing tests first, then `step()`, initial state, stars, storm-cloud dose; align with the shared spec | src/sim/engine.ts, engine.rules.test.ts (from commit co-author lines) |
| Sat 14 Nov 12:17–12:38 | Danislav | Claude Code (Claude Opus 5.5) | #14 final screen (domino chain, stars + Best, Try a different plan); game store on the real engine | PR #29: src/screens/FinalScreen.tsx, src/state/game.ts (from commit co-author lines) |
| Sat 14 Nov 13:00 | Nikolay P. | Claude Code (Claude Opus 5.5) | #15/#16/#17: kid text in en.json (job effects, crew, bars, plan help, tooltips, teacher card draft), copy-rule tests, "What's this?" tooltip component, credits/assets, test fix for Node 25+ localStorage | en.json, src/components/WhatsThis.*, src/i18n/en.copy.test.ts, CREDITS.md (text to be science-checked before merge) |
| Sat 14 Nov 13:30 | Nikolay P. | Claude Code (Claude Opus 5.5) | Pitch slide deck for the Sunday pitch; full project documentation | docs/documentation.md (playtest slide left with placeholders until the real playtest) |
