# Idea forge — Sat 14 Nov 2026, 10:00 (30 min timebox)

Team today: Yavor + Aleksandar (APIs/data, C#), Viktor + Danislav (UI/UX, can do anything), Nikolay Petrov (new), Nikolay Palashev (team owner).
Stack locked: browser-only Vite + React + TS, static deploy.

## 1. Diverge — 10 concepts

1. **Crew planner + domino chain** (The Impossible SOLution): kid is the base commander; each sol they assign 3 crew to tasks in 2 shifts; anything they postpone bites later; after the mission a "domino chain" shows the real cause of every problem.
2. **Storm forecaster**: kid predicts from real DONKI flare/CME data whether radiation hits the base in 1–3 days; shields up or not; scored against what really happened.
3. **Crew vs. Houston (classroom co-op)**: half the class is the crew, half is Mission Control; messages arrive with Mars light delay; blackout round.
4. **Train like an astronaut**: exercise breaks (tap/webcam) earn crew health; skipping training costs bone/muscle (OSDR).
5. **Live twin outpost**: outpost on the Moon follows the real current lunar day/night and real recent DONKI events.
6. **Greenhouse keeper**: grow food on Mars; light/water/power trade-offs; OSDR plant studies (Veggie) drive growth rules.
7. **Phone party mode**: each phone runs one subsystem; the team must share one power budget.
8. **Audio-first outpost**: playable by ear; resources as sounds.
9. **Real mission replay**: replay a real event (the May 2024 solar storm) as an outpost; kid decides what they'd have done.
10. **Dust storm survival**: InSight/Curiosity dust data reduces solar power; plan through a real dust storm season.

## 2. Score (1–5)

| # | Impact | Creativity | Validity | Relevance | Presentation | 48h feasible | Total | Note |
|---|---|---|---|---|---|---|---|---|
| 1 | 4 | 4 (schedule + causality lane is open) | 4 | 3 → 4 if a real DONKI event drives one sol | 4 (domino chain animation) | 4 | **23–24** | Team already understands it; must shrink for 7-year-olds |
| 2 | 3 | 3 (listed in another team's repo) | 4 | 5 | 3 | 5 | 23 | Narrow: one mechanic |
| 3 | 4 | 5 | 4 | 3 | 4 | 2 (realtime multiplayer, classroom test needed) | 22 | Risky demo |
| 4 | 4 | 4 | 3 | 2 (data decorative-ish) | 4 | 3 | 20 | |
| 5 | 3 | 4 | 4 | 4 | 3 | 3 | 21 | |
| 6 | 3 | 2 | 4 | 3 | 3 | 4 | 19 | Only food |
| 7 | 3 | 5 | 3 | 2 | 4 | 2 | 19 | Network at venue |
| 8 | 4 | 4 | 3 | 2 | 2 | 3 | 18 | |
| 9 | 3 | 3 | 5 | 4 | 3 | 4 | 22 | Good as a *scenario* inside #1 |
| 10 | 3 | 3 | 4 | 4 | 3 | 4 | 21 | Good as a *scenario* inside #1 |

**Top 2:** #1 (with #9 and #10 folded in as real-data sols) and #2.

## 3. Stress test

### A. The Impossible SOLution (crew planner + domino chain)
Pitch: *You command a Mars base for 3 sols (Mars days). Each morning you get a report, then put your 3 astronauts on jobs. There's never enough power for everything. Skip fixing the solar panels and tomorrow's power drops; work outside during a real solar storm (from NASA's DONKI records) and your crew's radiation dose climbs. At the end, a domino chain shows exactly which of your choices caused each problem — then you try a different plan.*

- 30 s video: (1) morning report "Solar storm detected — real NASA data, 10 May 2024" (2) kid drags astronauts onto jobs, power bar goes red (3) skips panel repair to grow food (4) sol 2: lights flicker, greenhouse dims (5) domino chain animates back to "Sol 1: you skipped the panels" → "Try again".
- Trade-off a kid remembers: "Fixing panels today costs power and people, but skipping it costs power every day after."
- Resources juggled: **Power**, **Air & water** (life support), **Radiation dose** (shield). Food = greenhouse job; comms delay = "ask Earth" jobs whose answer only arrives next sol.
- Pre-mortem: too many jobs/crew for a 7-year-old → max 3 crew, 4 jobs per sol, drag *or* tap; engine bugs → pure-TS engine with tests first; data feels decorative → one sol's events come directly from a real DONKI event and RadLab dose rates, shown with a "Real NASA data" card.
- Cut list: 5 scenarios → 1 mission (+1 if time), shifts → one shift per sol, BG translation last, animations last.

### B. Storm forecaster
- Strong data relevance, but a single mechanic; weak on power/food/comms; idea already public. Better as one sol inside A.

**Decision (pending judge/kid-playtester):** A, with B's "is a storm coming?" moment as the radiation sol.
