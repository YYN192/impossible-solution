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
