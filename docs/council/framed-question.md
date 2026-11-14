# Council question (Sat 14 Nov 2026, 10:40 Sofia)

**Decision:** For our NASA Space Apps 2026 entry "The Impossible SOLution" (challenge: *Build a Junior Astronaut Mission Trainer*), what exactly should we ADD to the concept, what should we CUT, and what should the final build plan for the next ~27 hours be?

## Context
- Team: 5 Bulgarian high-schoolers (2 good with APIs/C#, 2 UI/UX, 1 beginner) + a teacher who observes. Browser-only Vite + React + TypeScript, static deploy on GitHub Pages (already live, hello-world). Kids 7–12 are the audience. No faces/voices of minors in the demo.
- Deadlines (Sofia): playable loop Sat 14:00; MVP Sat 19:00; feature freeze Sat 23:00; **local demo video (≤30 s) Sun 14:00**; live 3-min pitch + Q&A Sun 16:00; global submission Sun 23:59.
- Judging: Impact, Creativity, Validity (science + works + usable), Relevance (NASA data as a core mechanic), Presentation — 1–5 each.
- Competition: 35+ public repos already do "Mars/Moon base + resource bars + DONKI solar storm". That is table stakes.

## Current concept (full text: app/docs/concept.md)
Kid runs a Mars base for 3 Mars days. Each morning: a 2-sentence report. Plan: 3 astronauts, 4 job cards (clean solar panels, greenhouse, stay inside/reinforce shelter, Ask Earth, outside science), tap astronaut → tap job; one shift per day. Bars: Power, Air & water, Space-ray meter (radiation). Every choice costs something. At the end a "domino chain" traces each problem back to the choice that caused it, with "Real data: source" chips; then retry with the same start. Stretch: Engineer mode (real units), Bulgarian, read-aloud, 5-day mission, Moon mission, DSN live delay.

## Review findings (judge 15/25, kid playtest, science check)
1. Hero video line credits panel dust loss to Curiosity — wrong, Curiosity is nuclear-powered. Use **InSight**: ~5,000 → ~500 Wh/sol from dust; 2022 storm 425 → 275 Wh/sol.
2. Storm: **20 May 2024** far-side flare (est. X12); Curiosity RAD measured **8.1 mGy** absorbed (≈30 chest X-rays, >1 month of normal Mars dose in ~a day). DONKI has only **CME 2024-05-20T05:36:00-CME-001** (halo, 1927 km/s), no FLR/SEP record. Baseline: **0.64 mSv/day / 0.21 mGy/day** (Hassler 2014). Particles arrived in tens of minutes → "The Sun just blasted a storm!", not "a storm is coming". Per-job dose costs are invented and must be labelled so.
3. Live DONKI is only a decorative banner → Relevance 3. Proposal: today's DONKI (or snapshot) decides the storm day/strength in the default mission.
4. Comms delay has no consequence and no time to play out with one shift/day. Proposal: Ask Earth costs a worker; the answer (storm timing/strength or tomorrow's dust) arrives next morning; choose waiting vs. acting blind.
5. Creativity still generic. Proposal: before ending the day the kid taps which domino they think will fall (prediction), then sees prediction vs. reality; compare run 1 vs run 2 chains.
6. Domino payoff only at the end → kids quit. Proposal: each morning report opens with the link that just fell ("Because you skipped the panels, power is low today").
7. Free choices remain (stay inside on a calm day, vague "idle" cost). Every job needs a cost both ways.
8. No win state / replay reason. Proposal: 1–3 stars (crew healthy, dose low, base running), runs seeded by different real events, "Best: 2★".
9. Too much reading for a 7-year-old → icons/arrows for dominoes (⚡↓ tomorrow).
10. Demo not reproducible → seeded `?demo=1`.
11. Judge says CUT: Moon mission, DSN live clock, Web Speech read-aloud (device voice risk), OSDR fact cards out of the "drives decisions" table, 5-day mission. Keep the BG toggle (Local Impact).
12. Teacher: no teacher card / discussion questions; 3 runs in 40 min leaves no discussion time.
