# Audit: first-time experience and shared screens (kids 7-12, EN + BG)

Audited 15 Nov 2026 against checklists A (learning), B (visual), C (sound). Read-only. Method: headless Chrome at 1440x900, 1920x1080 and 390x844 (touch), EN and BG, keyboard-only run, `prefers-reduced-motion` run, 200% zoom (720x450 viewport), computed styles, pixel-sampled contrast, WAV loudness measured from `public/audio/`. Flows: `?offline=1`, `?demo=1`, `?offline=1&campaign=classic&seed=3`. Scripts are in the session scratchpad `audit-shared/`. Not done: CVD simulator, listening test, real kid playtest, long Dust Season / South Pole runs.

## (a) Score summary

| Checklist | PASS | PARTIAL | FAIL | N/A |
|---|---|---|---|---|
| A learning (40) | 17 | 18 | 3 | 2 |
| B visual (39) | 12 | 15 | 10 | 2 |
| C sound (34) | 14 | 12 | 3 | 5 |

Blockers that fail: **B2, B17** (dust overlay dims text and HUD), **B25** (body text under 16 px), **B8/B9** (resource icon and yellow reuse), **A6** (device words), **C30** (music keeps playing in a hidden tab). Positives: keyboard-only and touch-only runs complete the whole mission, reduced motion removes every animation (0 running), BG fits at 200% zoom and 390 px, EN/BG keys are identical, alarms are short (at most 1.45 s) and soft, no sound before the first tap, music is off by default.

First meaningful choice: Start, Skip the walk, Plan the day, astronaut, job = 5 clicks, 2 s scripted (about 40-90 s for a child who reads the hub and morning text). On a 390x844 phone the Start button sits at y=886, below the fold.

## (b) TOP 12 FIXES (ranked by impact on a 7-12 year old)

1. **Dust overlay washes out the whole game (B2, B16, B17, A25).** At 2 jobs left, text under `.dust-cover` measures 2.8:1 ("Meet your crew"), 2.8:1 (Skip button), 3.5:1 (Menu). It covers the header, language toggle and buttons, and appears instantly at full opacity (`opacity:1` on mount; the 0.8 s transition runs only on decrease). Change: `MarsHub.tsx` (the `dust-cover` div, about line 127) and `expedition.css:44`. Put the dust inside `.world-screen` only (canvas), cap alpha at 0.35, fade in over 1.2 s, keep the HUD text clean. Effort S.
2. **Phone layout hides the main action (A3, A11, B32).** At 390x844: Start y=886 (menu), Plan the day y=985, End sol y=2407, and the "After this sol" preview starts at y=1570, 700 px below the jobs, so a child never sees the effect of a choice. The hub canvas is only 215 px tall under 440 px of header buttons. Change: menu puts Start above the mission cards (or one compact selected card plus "Change mission"); plan gets a sticky bottom bar with the three meter deltas plus End sol (`plan.css`); collapse the 5 header buttons into one "More" menu below 900 px (`ui.css:121`). Effort M.
3. **Raise every small text to 16 px (B25, A21, A4).** Measured: skipped-job list 11.2 px (9.9 px "tomorrow"), "A sol is one day on Mars." 11.5 px (the first term a child meets), Food/Science counters 12.4 px, `.job-cost` and `.job-copy small` (the gain/cost line!) 14.4 px, `.step-label`/eyebrow 14.4 px. Set `min 1rem` in `ui.css:26,93,103`, `plan.css` `.mini-text`, `expedition.css` `.small-counters{font-size:.75rem}`, `.meter-value small`, `menu.css` `.sol-explainer`. Show the sol line as a 16 px chip: "Sol = 1 day on Mars". Effort S.
4. **One colour, one icon, one word per resource (B7, B8, B9, B13, A2).** The Build-the-shelter job reuses the Air meter's oxygen tank (`PlanScreen.tsx:34` vs `ResourceMeters.tsx:8`); the Power bar is amber but its icon is a blue battery; the dose is "Space-ray meter" but Pip says "Lower dose is better" (`en.json` dialogue.drone.advice); teal means Air, real data and "selected"; warning yellow (#E6BD5D, #ffd166, #f5c542) also colours the "Why?" button, the today marker and the radio. Give shelter a roof/shield sprite, make the power sprite amber, use cyan for "selected", reserve yellow for warnings, give Food and Science icons and colours. Effort M.
5. **Show the safe zone and the risk (A2, A12, A15).** Meters say only "Higher is better". Add a tick and a green band at the game's own thresholds (`ENGINE.lowPowerToday`, `ENGINE.doseLimit`, used in `EndOfSolScreen.tsx:33`) and read the dose as "3 of 15" plus 3 pips. Show "+2 sun, -1 jobs = +1" under each bar for inflow and outflow. Effort M.
6. **Audio safety nets (C4, C7, C8, C9, C12, C30).** `audio.ts` has no ducking, no fades (music is hard-stopped at lines 178, 217 and restarts from zero on every screen), no `visibilitychange` pause, no headphone note, and the only in-game control is the master mute (volumes are in the menu Settings). Change: add a `visibilitychange` listener that suspends the context; 400 ms gain ramps on start/stop; duck the music bus to 0.3 while any `dialog[open]`; under the music slider add "Headphones recommended. Use quiet music in class."; add a Music button next to the 🔊 header button. Effort M.
7. **Dead storm sound and silent resource warnings (C2, C3, C16, C23).** `EndOfSolScreen.tsx:36-37`: `return () => ...` comes before `if (storm) timers.push(...)`, so the end-of-sol storm sound never plays. `air-warning` and `resource-critical` play with no text. Move the push above the return and show a one-line banner "Air is low: 3 of 10" whenever those cues play. Effort S.
8. **Replace "Tap" (A6).** `en.json` lines 27, 29, 277, 864, 897 (and BG): "Tap an astronaut. Then tap a job." becomes "Choose an astronaut. Then choose a job." and "Tap to decode it" becomes "Press to decode it". Effort S.
9. **Plan screen carries too much at once (A9, A31, B20, B21).** 25 interactive controls, 3 crew x 5 jobs, 5 numbers, the skipped-job chains and a science drawer. Fade the "how to" line after sol 2 (A31), fold "What happens to skipped jobs?" into a `<details>` that is open only on sol 1, and merge Food and Science into the 3-meter row. Effort M.
10. **Mini-games run a clock with no pause (A24, A32, A34).** `miniGames.ts:21` ticks every 300 ms and the dust blows back immediately; the board is decorative ("just for fun", `JobMiniGame.tsx:15`) yet blocks the flow 3 times a sol. Start ticking on the first tap, add "Skip mini-games" to Settings (and a Pause), make "Great job!" a 1 s toast. Effort S-M.
11. **Final screen does not celebrate or teach step by step (A13, A14, A28, A34).** The heading is "Mission over" at 1 star and at 3; chains show all links at once with a 250 ms stagger and no length cap (`buildRows.ts` has no limit). Use "Your crew made it!" or "Let's see what went wrong" by stars; show 3 links max with a "Show next link" button and a "Replay the chain" button (`FinalScreen.tsx` RowView, about line 156). Effort M.
12. **Comfort settings and target sizes (B31, B32, B38, C19).** Settings has volume only. Add "Calm mode" (`html[data-calm]`: no dust-blow, no storm-pulse, no shake) and "High contrast" (raise `--muted`, `.job-cost`, remove dust). EN|BG buttons touch (gap -3 px); give them 8 px. Desktop End sol is 44 px high (mobile 48): set `min-height:56px` on `.end-sol`, `.morning-go`, `.launch-button`. Effort M.

## (c) Item-by-item table

Verdicts: P = pass, ~ = partial, F = fail, N = not applicable or not tested.

### A. Learning and guidance

| # | V | Evidence |
|---|---|---|
| 1 | ~ | Goal only on the Storm Season card: "Can you keep 3 astronauts safe through a real solar storm?" (11 words). Hub says "Walk to the glowing console"; sol-1 morning says "plan with care"; the plan screen has no goal line. |
| 2 | ~ | Names + icons on 3 meters (plan, night); no safe zone, only "Higher is better". Food/Science counters have no icon (12.4 px). |
| 3 | ~ | 5 clicks, 2 s scripted; est. 40-90 s for a child; Start below the fold on 390x844. |
| 4 | ~ | "?" topics for sol, power, air, dose, food, dust, storms; but "sol" line is 11.5 px with no icon, "watt-hour" needs a 20-word sentence. |
| 5 | ~ | Sol explained on the menu first; Pip says "dose" before the meter ("Space-ray meter") is introduced. |
| 6 | F | "Tap" in en.json lines 27, 29, 277, 864, 897; desktop players click. |
| 7 | P | Longest in-game guidance 20 words (hubStorm.real.insight2022); 2 sentences over 15 (the other is the teacher card); typical 4-7. |
| 8 | P | Mean 4.8 words per sentence over 326 strings in scope. |
| 9 | ~ | Plan: 25 controls, crew skills, costs, outlook, skipped chains. Hub is fine. |
| 10 | P | No text input; only sliders and buttons. |
| 11 | ~ | Job card shows gain line + "Uses 2 power"; the combined outcome is in the side panel (700 px lower on phone). |
| 12 | ~ | Value/10 and "+1" net preview; no inflow/outflow split. |
| 13 | ~ | Morning: 2 links, "Why?" reveal. Final: all links at once, no cap. |
| 14 | F | No replay of the chain. |
| 15 | ~ | "likely / not likely" + icon; dose "0.3 / 15", no out-of-10 pips. |
| 16 | ~ | "likely" wording, but "arrives in 2 sols" is one value and never says it can be wrong. |
| 17 | P | "tomorrow" tags in skipped chains; "What happened overnight"; night results. |
| 18 | ~ | "SAVED DATA - 14 Nov 2026", "Real NASA data (saved)", "This is a saved reading"; badge has no distinct icon. |
| 19 | P | Chains use past tense ("was forecast to brush past Mars on 28 May"). |
| 20 | P | Crew have name + skill icon + text; bars have labels; better/worse delta uses solid vs hatch; goals use star shapes. |
| 21 | ~ | Sans (Nunito), no italics; many sizes under 16 px (see fix 3); caps eyebrows; no text-size control, but 200% zoom is clean. |
| 22 | ~ | Touch: all at least 48 px; desktop 44 px (End sol, header); Start y=886 on phone; hub Interact/Skip 10 px from the bottom. |
| 23 | P | Keyboard run: 6 Tabs to Start, arrows + E, mini-game won with Enter, Esc closes; touch run completed the mission. |
| 24 | ~ | No timer in the main flow; mini-games tick at 300 ms with no pause. |
| 25 | P | 0 running animations under reduce; typewriter instant; fastest loop 1 Hz. |
| 26 | P | Sound, bar and number respond; select/assign cues. |
| 27 | P | Final names causes ("Astronauts were outside during the storm."); "Try a different plan" is the primary button, 1 tap. |
| 28 | ~ | No game-over, no blame; heading "Mission over" at every star count; no strategy praise. |
| 29 | N | No hint ladder exists (only "?" topics). |
| 30 | N | Same. |
| 31 | F | "Tap an astronaut..." shows on every sol; no off switch. |
| 32 | ~ | Mini-games and drifting stars are decoration; Skip each time, no setting. |
| 33 | P | NPC dialogue has Next/Got it; typewriter only after a tap (about 2.5 s). |
| 34 | ~ | "Great job!" after each mini-game rewards an action; stars at the end mark outcomes. |
| 35 | P | 3 jobs picked from 5 each sol, Ask Earth, storm tasks. |
| 36 | P | Seeded; "Run number" and "Play again with a different storm". |
| 37 | P | 720x450 viewport: no overflow in EN or BG; keys identical (0 missing); BG sample reads natural, not native-reviewed. |
| 38 | P | Switched to BG mid-plan: stayed on plan, assignment kept. |
| 39 | P | "Meters and job costs use game numbers." on every console screen; Sources page. |
| 40 | P | For teachers: goal, 8-minute play, 3 questions. |

### B. Visual, colour, type

| # | V | Evidence |
|---|---|---|
| 1 | ~ | All sampled text at least 4.5:1 except `.job-cost` 4.15:1 and `.job-number` 3.0-4.4:1. |
| 2 | F | Overlay on: 2.77 / 2.81 / 3.49 / 4.05:1 (pixel-sampled, 1440 px, 2 jobs left). |
| 3 | P | Titles 16:1. |
| 4 | ~ | Storm has icon + text; the console sol tracker (Sol 1/2/3 squares) shows done vs not-done by colour only. |
| 5 | ~ | Bar fills (amber, teal, lavender) clear on the track; the 0.3/15 dose bar is a 2% sliver. |
| 6 | P | Focus: 3 px white + 6 px blue; selected mission 3 px #5eead4. |
| 7 | ~ | Power amber bar vs blue battery; teal = Air, real-data frames and "selected". |
| 8 | F | Shelter job uses the oxygen-tank (Air) sprite; "dose" vs "Space-ray meter". |
| 9 | F | Yellow on the "Why?" button, today marker, radio, "because". |
| 10 | P | Meters differ by icon, label and position (inferred; no greyscale render). |
| 11 | ~ | Amber/teal/lavender chosen, not Okabe-Ito; no CVD simulation run. |
| 12 | ~ | Better = green, worse = red, saved by solid vs hatched shape. |
| 13 | ~ | Teal (#9de3d8, #5eead4) and cyan (#83d9f4) both used at similar luminance. |
| 14 | P | storm-pulse about 2 changes/s on one heading; storm-flash about 2.2/s on a card; no full-screen flash (borderline, keep under 3). |
| 15 | P | 0 animations under reduce (expedition.css:13). |
| 16 | F | Instant on mount, 0.8 s on decrease (expedition.css:44); no shake. |
| 17 | F | z-index 40 over HUD and buttons (pointer-events none). |
| 18 | ~ | "Dust storm!" + icon + "Storm jobs"; game effect not given as a number. |
| 19 | P | Interact, Plan the day, Start are each the one bright button. |
| 20 | ~ | 3 meters + Food + Science = 5. |
| 21 | ~ | 5 jobs per decision (3 crew x 5 jobs). |
| 22 | ~ | Sound toggle icon-only (has aria-label); "!" markers unlabeled. |
| 23 | F | 16 px sprites drawn at 24 px (1.5x) in `.meter-label>img`. |
| 24 | F | Emoji (☀️ 🌱 🌪️ 📡 🚙) next to pixel sprites for the same ideas. |
| 25 | F | 14.4 px gain/cost text, 11.2 px skipped list, 12.4 px counters; phone 14 px base. |
| 26 | ~ | Nunito, no italics; caps eyebrows and step labels. |
| 27 | P | Pixelify Sans only in the menu title (3 words, EN). |
| 28 | ~ | Morning cards run about 100 characters per line at 1440 px; line height 1.5. |
| 29 | P | Cyrillic in Nunito everywhere; BG title stays Latin by design. |
| 30 | P | BG at 390 px and 200% zoom: no overflow. |
| 31 | ~ | Touch 48 px; desktop 44 px; EN|BG gap -3 px. |
| 32 | F | Desktop End sol 44 px; phone hub Interact/Skip 10 px from the bottom edge; Start off-screen on phone. |
| 33 | P | "Skip" is 48 px; the "x" unassign is 44 px (nearly). |
| 34 | P | No horizontal scroll at 390, 1440, 1920, or 720 (200% zoom). |
| 35 | N | Board mode not tested. |
| 36 | P | Text + icon + sound for success and failure. |
| 37 | ~ | Juice 250-450 ms; skippable under reduce; domino fall 450 ms. |
| 38 | F | Settings has volume only. |
| 39 | N | Needs a playtest. |

### C. Sound, music, pacing

| # | V | Evidence |
|---|---|---|
| 1 | P | AudioContext created only in the gesture listener (`audio.ts:180-190`). |
| 2 | ~ | Storm/morning/final alarms have banners; `air-warning` and `resource-critical` have none. |
| 3 | ~ | Same; all key information is also visible. |
| 4 | ~ | Header 🔊 44x44 on every screen, but inert inside modals (mini-game, storm, dialogue). |
| 5 | ~ | Master, music, sfx sliders (menu only); no voice exists. |
| 6 | P | `localStorage` "sol:audio" with try/catch. |
| 7 | ~ | Music slider exists but only in menu Settings. |
| 8 | F | No ducking code. |
| 9 | F | Hard `stop()`, loop restarts per screen. |
| 10 | P | Synthesised ambience, no lyrics. |
| 11 | ~ | Defaults master 0.7, sfx 0.7, music 0 documented in code; not tested on two devices. |
| 12 | ~ | Music off by default (menu.silent); no headphones prompt. |
| 13 | P | Main SFX RMS -17.4 to -20 dBFS (within 3 dB); ambience -33 to -38 dBFS. |
| 14 | P | storm-warning -18.2 RMS, 19% of peak in the first 10 ms; menu-select is as loud. |
| 15 | P | Alarms 1.25-1.45 s, no loops. |
| 16 | ~ | Different files and durations; not auditioned. |
| 17 | P | storm-warning (cloud) vs particle-burst vs resource-critical. |
| 18 | ~ | resource-stable and "Storm damage fixed!" exist; hub all-clear reuses job-complete. |
| 19 | ~ | OS reduced motion honoured; no in-UI calm option. |
| 20 | P | menu-error 0.24 s at -19 dBFS; "It fell off! Try again." |
| 21 | P | 70 ms rate limit, 2 alternating step samples. |
| 22 | P | Fanfare only on mission-success. |
| 23 | ~ | Visible text for storm alarms; end-of-sol storm cue is dead code (fix 7). |
| 24 | N | No voice. |
| 25 | N | No voice. |
| 26 | N | No voice. |
| 27 | N | No voice. |
| 28 | N | No adult listener test. |
| 29 | P | Ambience about 15 dB under the SFX and music off by default. |
| 30 | F | No hidden-tab pause; enter/leave guarded by id, no duplicates. |
| 31 | P | Master gain 0 plus `audible()` gating; Web Audio only. |
| 32 | P | Information is visible; the sound-off path completes. |
| 33 | ~ | No wait over 3 s; the radio typewriter (about 2.5 s) is not skippable. |
| 34 | P | "about 8 min" quick mission, run saved (`persist.ts`). |

Skipped or unverified: CVD simulation, audition of sound timbre, native BG review, long-campaign screens (Rover drive, Dust Season, South Pole).
