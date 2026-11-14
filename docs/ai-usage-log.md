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
| Sat 14 Nov 13:10 | Yavor | Claude Code (Claude Opus 5.5) | Ingestion pipeline for all listed sources (DONKI, RadLab, OSDR, Image Library, APOD, Mars Trek, CSA), schemas, data client, "More real data" section, scheduled refresh workflow; tests first | scripts/ingest/, src/data/{datasets,client}.ts, src/screens/MoreRealData.tsx, deploy.yml (to be reviewed by Yavor + science-checker) |
