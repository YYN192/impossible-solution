# The Impossible SOLution — fix it now, or pay for it later

Locked Sat 14 Nov 2026 ~10:30 Sofia time, after `/idea-forge` (see `idea-forge.md`), a judge review (16/25) and a kid playtest. Designed during the hackathon.

**What kids learn (one sentence for teachers):** on a Mars base, every choice costs something, and skipping a fix today usually costs more tomorrow.

## Player / audience
Kids 7–12 (default "Cadet" mode: plain words, picture cards, 2-sentence read-aloud reports). "Engineer" mode for 11–12, parents and teachers: real terms and units (sol, mSv, W). One mission ≈ 10 min; a class can play 3 runs in a 40-min lesson. No login, no data collected.

## The 3 resources the player juggles
1. **Power** (battery bar)
2. **Air & water** (life support bar)
3. **Space-ray meter** (crew radiation dose; Engineer mode: mSv)

## How all five systems appear
- **Life support:** the air & water bar; the CO₂ filter is a job; skipping it lowers air next day.
- **Shielding:** a "stay inside / reinforce shelter" job vs. outside jobs; outside work during a sun storm raises the space-ray meter.
- **Power:** solar panels; dust lowers output; "clean panels" is a job.
- **Food:** the greenhouse job (lights cost power; skipping it lowers food → crew slower next day). Reference: CSA food-production toolkit, NASA Veggie.
- **Comms delay:** "Ask Earth" job: the question goes out now, the answer comes back later in the day (real one-way delay 3–22 min, shown as a live clock in Engineer mode).

## Core loop (one Mars day = one round)
1. **Morning report**: max 2 short sentences, read aloud, one picture ("A sun storm is coming! Where should your crew work?").
2. **Plan**: 3 astronauts, 4 job cards; tap an astronaut, tap a job. One shift per day. Every placement immediately moves the bars and shows a mini-domino ("Panels skipped → less power tomorrow"). Idle astronauts and skipped jobs also cost something, so there's no free choice.
3. **End of day**: bars update with a short animation.
4. After 3 days (stretch: 5): **domino chain**, a visual chain from each problem back to its real cause, each link with a "Real data: source" chip where applicable. Then "Try a different plan" with the same starting conditions.

## NASA data that drives decisions (dataset → mechanic → fallback)
| Dataset | Mechanic | Fallback |
|---|---|---|
| Curiosity RAD normal surface dose, 0.67 mSv/day (Hassler 2014) | Baseline of the space-ray meter | Constant in code, cited |
| DONKI FLR/CME/SEP records (a real event Curiosity measured at Mars — exact event and dose **to verify with science-checker**) | The storm day: timing and strength of the sun storm | Snapshot JSON, labelled "Snapshot, May 2024", never "live" |
| DONKI live (last 30 days) | Optional "today's real sun" banner: "Right now the Sun is calm/active", plus a bonus mission seeded from it | Snapshot + badge LIVE / SAVED DATA |
| Curiosity REMS weather (lags ~2.5 months) | Daily temperature/dust affects panel output | Snapshot, labelled "recent Mars weather" |
| Earth–Mars light delay 3–22 min (+ DSN Now rtlt if CORS allows) | Ask Earth answer timing | Constant range, cited |
| OSDR / RadLab | Science fact cards ("What space did to lettuce/mice") | Snapshot |

In-app **Data Sources** screen + a **"What this game simplifies"** card (3 crew, short days, food rules are invented, Mars dose numbers are real).

## The "wow" moment (first 10 s of video)
The domino chain falling backwards: "Mars day 3: greenhouse dark" ← "Mars day 2: low power" ← "Mars day 1: you skipped cleaning the panels during a dust storm (real Curiosity data)". Then: "Try again".

## Primary award we're aiming at
Best Use of Science / Galactic Impact (education). Secondary: Local Impact (EN + BG).

## MVP (must have by Sat 19:00)
1 Mars mission, 3 days, 4 jobs, 3 bars, storm day from a DONKI snapshot, domino chain (text version ok), Data Sources screen, LIVE/SAVED badge, `?offline=1`.

## Stretch (only after MVP is deployed)
Engineer mode, Bulgarian, read-aloud (Web Speech), 5-day mission, second mission (Moon), animated dominoes, DSN Now live delay.

## Cut list (drop in this order)
Second mission → read-aloud → animations → Engineer mode → BG translation (keep at least the toggle with partial strings).

## Risks + mitigations
- Too complex for 7 → max 4 job cards, tap-tap, costs shown instantly, playtest with a real kid on Sunday morning.
- Science errors → every number goes through `science-checker` before it reaches kid text; "simplifies" card.
- Engine bugs → pure TS engine in `src/sim/` with Vitest tests first (deterministic: same plan → same result).
- API down at venue → snapshots bundled; app works with `?offline=1`.
- Looks like every other "DONKI storm" game → video opens on the domino chain, not the storm.
