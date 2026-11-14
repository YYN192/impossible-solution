# Anonymized responses

## Response A

3.5 h to the 14:00 loop. **First step 10:45–11:00:** one person writes `src/sim/types.ts` (`GameState`, `Job`, `StormEvent`, `Domino`, `seed`). Everyone builds against it.

11:00–13:30: API dev 1 — pure engine `step(state, plan, event) → {state, dominoes[]}`, every job costs both ways, Vitest determinism first. API dev 2 — data layer, bundled 20 May 2024 DONKI CME snapshot as default event; live DONKI only seeds a "Today's Sun" run; LIVE/SAVED badge, `?offline=1`. UI 1 — plan screen (tap astronaut, tap job, instant cost). UI 2 — morning report with fallen domino + end chain. Beginner — numbers fix, Data Sources text, CREDITS, AI log, icons.

**ADD:** DONKI snapshot drives storm day; Ask Earth (one state flag); morning domino; 1–3 stars + Best; `?demo=1`; icons/arrows; static teacher card (Sun, beginner); prediction tap only if MVP green by 19:00.
**CUT:** Moon, DSN clock, read-aloud, 5-day, OSDR cards, Engineer mode, animated dominoes, run comparison screen. Keep BG toggle.

13:30–14 integrate/deploy · 14–16 Ask Earth, morning domino, costs · 16–19 stars, demo seed, Data Sources, badge → MVP + kid-playtester · 19–23 icons, BG, prediction tap; freeze · Sun 08–10 real-kid playtest · 10–12 video from `?demo=1` · 12–13 science-checker + rules-auditor · 13:00 upload · 14–16 pitch drills.

## Response B

The name "The Impossible SOLution" is a pun on "sol" and only lands for people who know the word. Explain it in one line on the title screen ("A sol is one day on Mars") or rename.

"Domino chain" is the best idea and it's hidden at the end. Show the first domino falling in the first 8 seconds of the video and on day 2 of the game. If the video doesn't show "you skipped panels → power dropped → greenhouse died", you're repo #36.

Kill jargon: Space-ray meter, Ask Earth, Engineer mode, DONKI, mGy. Show "Earth is far. Answers take until tomorrow."

"Real data" chips with dataset IDs read as decoration. Say: "This storm really happened on 20 May 2024. A Mars rover measured it."

The prediction tap is the one creative hook a teacher instantly gets. Keep it.

**ADD:** sol explanation or rename; domino link in every morning report with icons; prediction tap → "you guessed / it happened"; plain-English real-event captions; seeded `?demo=1`; 1–3 stars; teacher card with 3 discussion questions.
**CUT:** Moon mission, DSN clock, read-aloud, 5-day mission, Engineer mode; dataset IDs/units on kid screens (keep in Data Sources); decorative DONKI banner; any free job.

## Response C

**#1 "Today's DONKI decides the storm" is bad science.** DONKI CMEs are Earth-perspective; most never reach Mars. Mapping live CME speed to a Mars dose is invented. A calm-sun day = no storm = no trade-off = dull demo. Fix: only use CMEs whose WSA-Enlil analysis lists **Mars** in impacts; if none in 30 days, fall back to the May 2024 snapshot and say so. That filter is a real Mars-relevance mechanic.
**#2 Ask Earth timing contradicts physics.** 3–22 min delay; "answer next morning" teaches the wrong thing. Say "Earth needs time to study your question; the signal itself takes 12 minutes" or drop the claim.
**#3 3 sols can't hold a domino chain.** Day 1 cause → day 3 effect = 2 links. Verify the engine produces 3-link chains before committing the video.
**#4 Is 3 stars reachable?** Brute-force all plans in Vitest (small space) and confirm several 2–3★ paths.
**#5 Scope creep.** Loop due 14:00; reviews add six features. Prediction taps add a screen for 7-year-olds.

**ADD:** Mars-impact filter on DONKI · brute-force solvability test · honest delay wording · "invented number" labels · teacher card · `?demo=1`.
**CUT:** prediction tap (until after MVP) · run-1 vs run-2 comparison · Moon · DSN clock · read-aloud · 5-day · OSDR cards · live-CME-to-dose mapping.

## Response D

Biggest undervalued asset is the **prediction step**, not the storm. Nobody else has a kid betting on which domino falls and seeing if they were right. Build pitch, scoring and replay around that.

1. **Daily Sun Mission** — today's DONKI (or labelled snapshot) seeds the day's mission; every kid in the world gets the same Mars that day, Wordle-style. "Today's real Sun decided your mission." Shareable seed code (`SOL-1114-K7`), no login.
2. **Relive the real day** — 20 May 2024 as a named mission: "Curiosity measured 8.1 mGy that day. Can your crew do better?" Best Use of Science story.
3. **Prediction accuracy as proof of learning** — "1/3 in run 1, 3/3 in run 2". Measurable Impact claim.
4. **Classroom mode for free** — same seed for the class + teacher card with 3 questions ("Who waited for Earth? Worth it?"). One run, compare, discuss.
5. **Ask Earth, answer next morning** — waiting vs acting blind is the hero trade-off of the video.
6. **BG toggle** is a feature for Local Impact.

**ADD:** daily DONKI-seeded mission + seed code; "Relive 20 May 2024"; prediction tap + run accuracy; teacher card; Ask Earth next morning; morning domino recap with icons; 1–3 stars; `?demo=1`.
**CUT:** Moon, DSN clock, read-aloud, 5-day, OSDR cards, full Engineer mode (unit tooltips only), animated dominoes beyond a simple fall.

## Response E

Strip it down. The real problem: **show a 9-year-old one true, surprising fact about Mars that only real NASA data can prove, and make them feel it in a decision.**

The fact is already in the findings: on 20 May 2024 particles reached Mars in **tens of minutes**; Earth–Mars light delay is **3–22 minutes**. So **any warning from Earth arrives about when the storm does, or after**. Mission Control can't save you in time — that's why Mars crews must act on their own. This ties DONKI, comms delay and shielding into one mechanic.

Reframe: every choice = "act now on what you can see, or wait for Earth?" Make Ask Earth the central tension: costs a worker, answer next morning. Sometimes waiting wins (dust is predictable), sometimes it loses (storms come without warning).

Domino chain stays as payoff, but kids predict first, then see reality, then compare. A chain only at the end is a credits screen.

**ADD:** "Earth can't warn you in time" mechanic (CME 2024-05-20 + light delay); Ask Earth = worker cost, answer next morning, wait vs act; prediction tap + morning report opens with the fallen domino; 1–3 stars + Best; seeded `?demo=1`; teacher card; label invented dose costs; InSight dust source.
**CUT:** Engineer mode, Moon, DSN clock, read-aloud, 5-day; OSDR fact cards and live REMS (use InSight snapshot); free jobs; decorative live DONKI (seed bonus run or drop).
