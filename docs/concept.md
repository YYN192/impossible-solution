# The Impossible SOLution — fix it now, or pay for it later

**v2, locked Sat 14 Nov 2026 ~11:00 Sofia.** Designed during the hackathon. v1 → judge review, kid playtest, science check, then an LLM council (5 advisors + peer review + chairman). Full record: `docs/council/`.

Title screen line: **"A sol is one day on Mars."**
Teacher sentence: **On Mars, every choice costs something, and help from Earth can't always arrive in time.**

## Player / audience

Kids 7–12. One mission = 3 sols ≈ 8 min. A class can do: 1 run → discuss (teacher card) → 1 run. No login, no data collected. EN first, BG toggle. Real terms (sol, mSv) appear only as small "What's this?" tooltips, never as required reading.

## The 3 bars

1. **Power** ⚡ — solar panels make it; dust lowers it.
2. **Air** 🫧 — the air machine uses power every night; no power → air drops.
3. **Space-ray meter** ☢️ — crew radiation dose (lower is better).
   Plus **Food** 🥬 as a small counter (greenhouse), not a bar.

## Jobs (3 astronauts, 5 job cards → 2 jobs are always left undone)

Every job costs something today, and every skipped job costs something later. Numbers are **invented game units** unless a source is named; they are labelled "game number" in the Data Sources screen.

| Job                             | Cost today                                          | If done                                                           | If skipped                                                       | Real anchor                                                                      |
| ------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| 🧽 Clean solar panels (outside) | 1 worker, small space-ray dose (big during a burst) | Panels back to full → normal power tomorrow                       | Dust builds: tomorrow's power about a third lower                | InSight: 2022 dust storm cut 425 → 275 Wh/sol (≈ −35%)                           |
| 🥬 Run greenhouse lights        | 1 worker, 2 power                                   | +1 food                                                           | −1 food; food at 0 → one astronaut is too tired to work tomorrow | CSA food toolkit, NASA Veggie (context only)                                     |
| 🛡️ Build up the shelter         | 1 worker, 1 power                                   | Everyone's space-ray dose halved today and tomorrow               | No protection if a burst hits                                    | Shielding lowers dose (direction only; the factor is a game number)              |
| 📡 Ask Earth                    | 1 worker, 1 power                                   | Next morning: dust forecast + "is a storm cloud heading to Mars?" | You plan blind tomorrow                                          | Light delay 3–22 min one way; DONKI WSA-Enlil forecasts Mars arrivals days ahead |
| 🔬 Science trip (outside)       | 1 worker, space-ray dose                            | +1 science ⭐ (mission goal)                                      | No science                                                       | —                                                                                |
| (idle astronaut)                | —                                                   | —                                                                 | Counts as a wasted worker; mission goal gets harder              | —                                                                                |

### Built-in domino chain (must be provable in Vitest)

Skip panels (sol 1) → power −⅓ (sol 2) → not enough power for both the greenhouse and the air machine → food 0 or air drops (sol 2 night) → one astronaut too tired / air warning (sol 3). That is 3+ links inside 3 sols.

## Storms: two kinds, both real

1. **Particle burst** — arrives in **tens of minutes**, so no warning from Earth can beat it. Data: **20 May 2024**; Curiosity's radiation detector (RAD) measured **8.1 mGy** from that one storm, as much as **more than a month of normal Mars radiation** (normal: 0.21 mGy/day, 0.64 mSv/day, Hassler et al. 2014). The DONKI record for that event is **CME 2024-05-20T05:36:00-CME-001**. Kid text: "The Sun just blasted a storm! A real Mars rover measured one like this on 20 May 2024." Do **not** say "30 chest X-rays".
2. **Storm cloud (CME)** — takes **days**, so Earth _can_ warn you. Data: DONKI WSA-Enlil forecast that the **23 May 2024 CME would brush past Mars on 28 May ~11:30 UTC** (glancing blow). Earth's dust forecast is a game number. This is what Ask Earth reveals.

**Ask Earth wording:** "Your message takes about 12 minutes to reach Earth. Scientists study it overnight. Their answer is waiting for you in the morning."

## Loop (one sol = one round)

1. **Morning report:** first line = **the domino that just fell**, with icons ("⚡↓ because you skipped the panels"). Then at most 1 more sentence (event or Earth's answer).
2. **Plan:** tap an astronaut → tap a job. Each placement immediately previews its cost on the bars, plus a small icon domino for the skipped jobs ("🧽✗ → ⚡↓ tomorrow").
3. _(Stretch, only if MVP is green at 19:00)_ **Prediction tap:** "Which bar will drop tomorrow?"
4. **End of sol:** bars animate (respecting reduced motion).
5. After sol 3: **domino chain** (problem ← cause ← cause), **1–3 stars** (⭐ crew safe: dose under limit · ⭐ base running: no bar hit 0 · ⭐ science goal reached), "Best: 2★", **Try a different plan** (same start).

Losing never feels punitive: "Mission ended early. Here's what caused it", then the domino chain and Try again.

## NASA data that drives decisions

| Data                                                           | Mechanic                                                                                                              | Fallback                                                               |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Curiosity RAD (JPL 20 May 2024 release; Hassler 2014 baseline) | Size of the burst vs. a normal day on the space-ray meter                                                             | Constants in code, cited                                               |
| DONKI CME 2024-05-20-CME-001                                   | Storm sol in the default/demo mission                                                                                 | Bundled snapshot, badge SNAPSHOT                                       |
| DONKI WSA-Enlil (impactList contains "Mars")                   | Ask Earth "storm cloud coming" forecast; optional **"Today's Sun"** run seeded only by live CMEs forecast to hit Mars | None in 30 days → "The Sun is quiet toward Mars this month" + snapshot |
| InSight power vs. dust                                         | Panel-dust penalty (≈ −⅓)                                                                                             | Constant, cited                                                        |
| Earth–Mars light delay 3–22 min                                | Ask Earth wording                                                                                                     | Constant, cited                                                        |

Never map a live CME to a Mars dose. Data Sources screen + a **"What this game simplifies"** card (3 crew, short sols, job numbers are game numbers; the storm, normal dose, dust effect and delay are real).

## Video "wow" (first 8 s)

The domino chain falling backwards: "Sol 3: astronaut too tired" ← "Sol 2: power low" ← "Sol 1: you skipped cleaning the panels". Then the caption: "Based on real NASA data: InSight's dusty panels and the 20 May 2024 solar storm Curiosity measured." Shot from `?demo=1`, captions only (no minor voices).

## Award target

Best Use of Science / Galactic Impact (education); Local Impact (BG).

## Cut (council)

Moon mission, DSN live clock, read-aloud, 5-day mission, OSDR fact cards, Engineer mode, run-1 vs run-2 comparison, seed codes / Wordle daily, accuracy tracking, animated dominoes beyond a simple fall, dataset IDs/units on kid screens, decorative DONKI banner.
