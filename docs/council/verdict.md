# Council verdict (chairman, Sat 14 Nov ~11:00)

## Where the council agrees
- CUT (unanimous): Moon mission, DSN live clock, read-aloud, 5-day mission, OSDR fact cards, full Engineer mode. Keep BG toggle.
- Domino chain is the core and is buried → every morning report opens with the domino that just fell (icons).
- Every job costs both ways. `?demo=1`, 1–3★ + Best, teacher card, labels on invented numbers.
- Default storm = bundled 20 May 2024 snapshot.

## Where the council clashes
- Live DONKI daily mission (Expansionist) vs. bad science (Contrarian) — all 5 reviews sided with the Contrarian.
- Ask Earth "next morning" vs. 3–22 min light delay.
- Prediction tap: core hook (3 advisors) vs. after-MVP (Executor, Contrarian).

## Blind spots caught
No drop order/decider · causal table not written first · real-kid playtest after freeze → Sat 18:00 · 3-sol chain may be only 2 links → prove 3 links and 3★ reachability in Vitest · 8.1 mGy is Curiosity RAD, cite RAD not DONKI · captions-only video · "30 chest X-rays" may scare 7-year-olds · a11y + i18n from commit 1 · losing experience, pitch/Q&A unplanned · explain "sol" on title screen.

## Recommendation
Executor schedule + Contrarian corrections.
- Ask Earth: costs a worker; answer next morning ("the radio signal takes about 12 minutes; Earth's scientists need the night to study it"). First particle blast arrives in tens of minutes — no warning can beat it. Storm-cloud-arrives-later only if verified.
- Live DONKI: default/demo = 20 May 2024 snapshot (badge SNAPSHOT). Live only seeds optional "Today's Sun" run from CMEs whose WSA-Enlil impacts list Mars; none in 30 days → "The Sun is quiet toward Mars this month" + snapshot. Never map a live CME to a Mars dose.
- ADD: causal table first · morning fallen domino · Ask Earth · cost both ways · 1–3★ + Best · `?demo=1`, `?offline=1` · Vitest: 3-link chains, 3★ reachable, determinism · plain-English real-event captions · sol line · invented-number labels · RAD + InSight citations · teacher card · prediction tap (only if MVP green at 19:00) · Mars-filtered "Today's Sun" · BG toggle.
- CUT: unanimous list · run comparison screen · seed codes/Wordle daily · accuracy tracking · animated dominoes · dataset IDs/units on kid screens · "30 chest X-rays" · decorative DONKI banner.
- Drop order if a gate slips (Executor decides): 1 prediction tap → 2 Today's Sun → 3 BG toggle (strings stay in i18n) → 4 stars → pass/fail → 5 teacher card → static PDF. Never drop: morning domino, Ask Earth, snapshot storm, Data Sources, badge, `?demo=1`.

## One thing first
Write the causal table (job → cost today → effect tomorrow → data source or "invented") in `src/sim/types.ts`, then Vitest chain-length and 3★ tests before any UI.

## Post-verdict fact check (DONKI live, see donki-mars-check.md)
The 20 May CME has no Mars impact in WSA-Enlil; the 23 May 2024 CME has a forecast Mars arrival on 28 May 11:30Z. → The two-hazard model IS supportable with a different event: particle burst = minutes, no warning (20 May); CME cloud = days, Earth can forecast it (23 → 28 May). Ask Earth's next-morning answer can therefore honestly include "a storm cloud is heading to Mars, arriving in N days".
