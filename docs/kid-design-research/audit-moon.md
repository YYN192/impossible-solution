# Audit: South Pole Outpost (Moon, 5 days)

Method: played `?campaign=moon` seed 3 and seed 8 in headless Chrome at 1440x900 and 390x844 (touch), EN and BG (1440), measured text, computed contrast, tap sizes and overflow, read source. Scripts: `scratchpad/audit-moon/*.mjs`. Not done: real listening test, CVD/greyscale render, 200% browser zoom (a 720x450 viewport was used as proxy), BG at 390.

## (a) Score summary

| Checklist | PASS | PARTIAL | FAIL | N/A |
|---|---|---|---|---|
| A learning (40) | 13 | 23 | 3 | 1 |
| B visual (39) | 16 | 13 | 4 | 6 |
| C sound (34) | 17 | 9 | 1 | 7 |

Overall the mission is playable and honest about saved data. Choices come from real NASA data and every option shows its cost. The weakest areas are Moon/Mars leaks in the copy, one fake "It's real!" card, small and wide text, and a few sound-system gaps.

## (b) Top 10 fixes, ranked by impact on a 7-12 year old

1. **The Moon says "Mars" and "sol" in many places.** Fixes A5, A39 (trust), A37.
   - Hub: `en.json:486` "Explore your home on Mars." and `en.json:18` "First morning on Mars." Mars windows and a Mars globe sit in the hub art.
   - The Earth answer says "dusty skies tomorrow... The dust storm lasts 1 more sol" (`en.json:78, 93-94`; no `_moon` variant).
   - Final-screen domino rows say "Sol 3" (`en.json:123`; BG "Сол 3").
   - Station name "Ares" (`en.json:474`) and `canvas` alt "Mars station" (`en.json:~479`).
   - Change: add `_moon` variants (`tRun(..., place)`) for all of these. EN: "Explore your Moon base.", "First morning on the Moon. Everything works.", "Dark skies tomorrow. The Sun hides behind a ridge for 1 more day.", "Day 3". Rename the Moon station "Artemis Outpost". Hub art needs Earth in the window and no Mars globe. Effort M (copy S, art M).

2. **A game event is labelled "It's real!" and "NASA event number: shadow-day"** (`EndOfSolScreen.tsx:41-48`, `en.json:814-818`). Seed 8 showed "Dust storm! It's real! ... Real NASA number: NASA named 13 landing regions". The Moon text itself (`en.json:223`) says this is a game event. Fixes A39, A19, B18. Change: for `id==="shadow-day"` show the heading "A dark day" and the label "Game event: not a NASA measurement." and drop the event-id line. Effort S.

3. **Text is too small and too wide.** Fixes A21, B25, B28, A8. Measured: most secondary text is 14.4 px; Food/Science counters 12.4 px; mini-text 11.2 px; "TOMORROW" 9.9 px; the menu has 11.2 px text. `.lead` is 1350 px wide on a laptop, about 160 characters per line (target 45-75). CSS: `html{font-size:112.5%}` or raise small text to `min 1rem` (16 px); `.lead,.beat-real,.job-cost{max-width:62ch}`. Add an A+ text-size toggle. Effort S-M.

4. **At 390 px the choices are far below the first screen.** Fixes B19, A9, A3. On Sky watch, the first option is at y≈900-1036 on an 844 px screen. Three big meter cards come first. Change: on `.beat-options` screens collapse the meters into one compact strip (icon + number, no "?" and "Higher is better") above the options, or put options before the meters on phones. Effort M.

5. **Sky watch is a forced non-choice when power is 0.** Seed 3: power 0, "Yes: get the shelter ready" shows "Not enough power for this." and only "No" works. The result is only "You chose No: keep working." with no hint of what that risks. Fixes A11, A27, A16. Changes:
   - Show the cost of "No" as a chip, e.g. "☢️ rays may rise" (not a number, because the storm points away).
   - After the choice add one line: "Good call. This storm was aimed at Mars, so the Moon base barely felt it."
   - Warn on the plan screen on day 2 when power is 0 ("Charge the panels before the storm day").
   - Effort S-M.

6. **Result text after a choice is only "You chose X".** Rover, site, dilemma and skywatch results show no consequence sentence. Meter deltas do the work, but a 7 year old will not read the "+1" chips. Fixes A13, A17, A26. Change: add `beat.<id>.<option>.result` ("You drove to the rim. The rover scooped ice: +1 air, -1 power."). Effort M (copy for 11 options x 2 languages).

7. **No goal sentence and no safe zone on the meters.** Fixes A1, A2. The three stars (crew safe, base running, science) are first seen on the final screen. Meters show "Higher is better" but no target. Change: day-1 hub or morning card "Goal: keep the crew safe and the base running. Get 2 science trips." (12 words or fewer) and a tick mark or green band on each meter track. Effort S-M.

8. **Emoji and pixel icons mix; warning yellow decorates normal labels.** Fixes B24, B9. Option chips use emoji (⚡🫧🥬) while meters use pixel icons for the same ideas. Yellow (`.eyebrow.beat-type`, mini-game hint) is the warning colour but marks "Day 1 of 5 · Choose a site". Change: use the pixel icons in `effects()` (`BeatScreen.tsx:15-37`); make the eyebrow the normal light blue. Effort S-M.

9. **Sound system gaps.** Fixes C8, C12, C18, C28, C30.
   - There is no ducking, no tab-hidden pause, and no "headphones/classroom" prompt.
   - The Moon plays "mars-base-ambience" in the hub because `music-mission-moon` is missing (`audio.ts` `musicFor`).
   - In `EndOfSolScreen.tsx:36-37` the `return` runs before the storm sound is pushed, so that alarm never plays there (dead code; the morning screen still plays it at `MorningScreen.tsx:86`).
   - Changes: move line 37 above line 36; add a `visibilitychange` handler calling `ctx.suspend()/resume()`; add a first-run line "Sound is on. Use headphones or tap 🔊 to mute."; add a Moon ambience loop or a quiet one with no Mars name. Effort S (bug and visibility), M (new track).

10. **Tap sizes for ages 7-9 and mini-game pressure.** Fixes B32, A22, A24. "Continue to the plan", "End day" and "Go to sleep" are 44 px high on desktop and 48 px on phone (target 56-64). The shelter and rock mini-games tick every 300 ms (`miniGames.ts:21`) with no pause. Change: `.beat-result .primary,.end-sol{min-height:64px}` and add a "Slow" toggle for the ticker (`TICK_MS` x2). Effort S.

Also noted: BG says "ток" in site chips but "Енергия" on the meters (use one word); "На всяко нещо липсва" reads awkwardly (try "На всяко му липсва нещо"); no in-UI high-contrast or reduced-motion setting (B38).

Replay variety is thin (A36): seeds 3 and 8 give the same five beat types on days 1-5. Only the hidden-radio days, the shadow day (day 2-5) and the last-day beat differ. Consider swapping the day 2/4 beat order or adding one more rover/radio variant.

## (c) Item-by-item

### A. Learning and guidance (A1-A40)

| # | Result | Evidence |
|---|---|---|
| 1 | PARTIAL | Menu card "Sunlight, ice or a view of Earth? You cannot have all three." (12 words) is the nearest goal; the 3 star goals appear only on the final screen. |
| 2 | PARTIAL | Meters have name, icon and "Higher is better"; no visible target zone; Food/Science are plain numbers with no icon. |
| 3 | PASS | Menu, Start, Skip walk, Plan the day, then the site choice: 5 taps. |
| 4 | PARTIAL | Terms explained by the "?" button, not on the same screen ("Space-ray meter", "air machine"). |
| 5 | PARTIAL | "sol" is explained only on the menu line; the final screen then shows "Sol 3" on the Moon. |
| 6 | PASS | "Tap an astronaut. Then tap a job."; "Choose a site". |
| 7 | PARTIAL | Guidance is 6-16 words, but real-data chips are 16, 20 and 25 words; hub description 41 words. |
| 8 | PASS | Average sentence 8.6 words over 89 sentences. |
| 9 | PARTIAL | Site screen: 3 meters, 2 counters, NASA chip and 3 sites with 2-3 chips each. |
| 10 | PASS | No typing anywhere. |
| 11 | PARTIAL | Site, radio and rover show gain and cost chips; Sky watch "No" shows "No change" and hides the dose risk. |
| 12 | PARTIAL | Net change per day shown on the plan (+3); no separate inflow/outflow. |
| 13 | PARTIAL | Final chain captions each link, but one chain has 5 links. |
| 14 | PARTIAL | Final "Show 3 more" and "Try a different plan"; no replay of one chain on request. |
| 15 | PASS | Meter "0.3 / 15", "A burst of space rays is not likely today"; no bare percentages. |
| 16 | PARTIAL | "not likely today" but no "can be wrong" statement. |
| 17 | PARTIAL | Morning "What happened overnight" and the final chain; day dots 1-5 but no forecast timeline. |
| 18 | PARTIAL | "SAVED DATA · Nov 14, 2026" badge and "Real NASA data (saved)" text; same 🛰️ icon as live. |
| 19 | PASS | The 20 May 2024 storm is dated on the end-of-sol card. |
| 20 | PASS | Meters, deltas and options all have text and icons. |
| 21 | FAIL | Many labels 14.4 px; no size control (measured). |
| 22 | PARTIAL | 48 px on touch, 44 px on desktop; Continue/End day not 64 px. |
| 23 | PASS | Touch-emulated run plus arrow-key explore; mini-games are buttons. |
| 24 | PARTIAL | No timers on decisions; mini-game ticks every 300 ms with no pause (Skip exists). |
| 25 | PASS | `index.css:124`, `expedition.css:13`, `plan.css:109`. |
| 26 | PASS | Every pick gives a sound and an immediate result panel. |
| 27 | PARTIAL | Final explains causes and has "Try a different plan" (1 tap); in-sol failures such as "Not enough power" give no cause. |
| 28 | PASS | "Mission over ★★☆"; "(missed)"; no blame wording. |
| 29 | FAIL | Only "?" and "Why?" (one level); no ladder. |
| 30 | N/A | No hint ladder to delay. |
| 31 | PARTIAL | The same "Tap an astronaut. Then tap a job." and hub tips appear each day; no turn-off. |
| 32 | PARTIAL | Mini-games and Pip are decoration with Skip, but no global switch. |
| 33 | PASS | Every card has a Continue/Next button; no auto-advance. |
| 34 | PASS | Stars shown only at the end. |
| 35 | PASS | Site, radio, Sky watch, rover, dilemma on days 1-5 (plus the plan). |
| 36 | PARTIAL | Seeds 3 and 8: same beat types; hidden-radio days, shadow-day and last-day beat differ. |
| 37 | PARTIAL | BG no overflow at 1440; 720 px proxy no overflow; BG mixes "ток"/"Енергия". |
| 38 | PARTIAL | Language toggle present on every screen; mid-run switch not tested. |
| 39 | FAIL | "It's real! shadow-day" on a game event (fix 2); other numbers are sourced or marked game numbers ("Meters and job costs use game numbers."). |
| 40 | PASS | "For teachers" card with a Moon paragraph (`en.json:223`). |

### B. Visual, colour, type (B1-B39)

| # | Result | Evidence |
|---|---|---|
| 1 | PARTIAL | All measured text 4.4-15.8:1 except `.job-number` "01" 4.4:1 at 14 px. |
| 2 | N/A | No dust overlay on the Moon. |
| 3 | PASS | Large text 5.5-14:1. |
| 4 | PASS | Meters and options carry icon, number and text. |
| 5 | PARTIAL | Meter segment contrast not measured. |
| 6 | PASS | Focus ring: 3 px white outline plus 6 px blue ring. |
| 7 | PASS | Power orange, air teal, rays purple on beat and plan. |
| 8 | PASS | Same pixel icons and words on beat and plan meters. |
| 9 | FAIL | Yellow on `.eyebrow.beat-type` and the mini-game hint. |
| 10 | PARTIAL | Not rendered in greyscale; icons differ per resource. |
| 11 | PARTIAL | Orange, teal, purple not CVD-simulated. |
| 12 | PASS | No red/green pairing. |
| 13 | N/A | Only one of teal/cyan in use. |
| 14 | PARTIAL | No flashing seen; animations not frame-tested. |
| 15 | PASS | Global reduced-motion rules. |
| 16 | N/A | No storm overlay here. |
| 17 | N/A | No overlay. |
| 18 | PARTIAL | Storm has text and icon, but the effect has no numbers ("Power is low today."). |
| 19 | PARTIAL | Desktop focal point is the options; at 390 px they are below the meters. |
| 20 | PARTIAL | 3 bars plus 2 counters = 5. |
| 21 | PASS | 2-3 choices per decision. |
| 22 | PASS | Meters and "?" have text labels. |
| 23 | PARTIAL | Pixel art consistent; integer scaling not checked. |
| 24 | FAIL | Chips use emoji; meters use pixel icons for the same concepts. |
| 25 | PARTIAL | Lead 16.5 px; secondary 14.4 px, counters 12.4, mini 11.2, labels 9.9. |
| 26 | PASS | Nunito, no italics, uppercase only for short labels. |
| 27 | PASS | Pixelify only on the menu title (`menu.css:31`). |
| 28 | FAIL | `.lead` ~160 characters wide at 1440; line height 1.5 is fine. |
| 29 | PASS | BG renders in Nunito; the title stays Latin by design. |
| 30 | PARTIAL | BG 1440 no overflow; BG 390 not checked. |
| 31 | PASS | 390 px: all 48 px; desktop 44 px; spacing 8 px or more. |
| 32 | PARTIAL | Option cards 118-257 px; Continue 48 px, End day 48 px. |
| 33 | PASS | "×" is 48 px like the rest. |
| 34 | PASS | Overflow 0 at 390, 1440 and 720. |
| 35 | N/A | Board mode not tested. |
| 36 | PASS | Results use text plus icons plus sound. |
| 37 | PARTIAL | Juice timing not measured. |
| 38 | FAIL | No in-UI contrast or motion control. |
| 39 | N/A | No kid test done. |

### C. Sound, music, pacing (C1-C34)

| # | Result | Evidence |
|---|---|---|
| 1 | PASS | Context created in a gesture listener (`audio.ts` "unlock"). |
| 2 | PASS | "Space-ray storm!" banner (`EndOfSolScreen.tsx:41`). |
| 3 | PASS | All text-backed. |
| 4 | PASS | 🔊 button on every screen, 44 px (48 on touch). |
| 5 | PARTIAL | Music/sfx/master sliders only in the Main Menu Settings; no voice. |
| 6 | PASS | `localStorage "sol:audio"` in try/catch (`audio.ts:14-37`). |
| 7 | PASS | Music defaults to 0; mute and slider exist. |
| 8 | FAIL | No ducking code. |
| 9 | N/A | Music is off by default and never ducked. |
| 10 | PASS | Synthesised instrumental loops. |
| 11 | PARTIAL | master 0.7 x sfx 0.7 x clip 0.3-0.65; no documented test. |
| 12 | PARTIAL | Music off by default ("Music is off at first."); no headphones prompt; sfx on. |
| 13 | PARTIAL | Clip volumes 0.3-0.65 (about 6.6 dB range); no loudness measurement. |
| 14 | PARTIAL | `particle-burst` 0.6 is below `mission-success` 0.65; attack not inspected. |
| 15 | PASS | Alarms are 1.25-1.45 s one-shots. |
| 16 | PASS | Separate clips for storm-warning, particle-burst, job-complete, menu-error, select (manifest); not listened. |
| 17 | PASS | storm-warning vs particle-burst vs resource-critical. |
| 18 | PARTIAL | `resource-stable` at night; no dedicated all-clear after an alarm. |
| 19 | PARTIAL | Reduced motion honoured; no softer-alarm option. |
| 20 | PASS | `menu-error` 0.24 s at 0.5; mini-game miss shows "Oops" text. |
| 21 | PASS | 70 ms rate limit; two alternating step clips. |
| 22 | PASS | `mission-success` only on the final screen. |
| 23 | PASS | Banner stays on screen. |
| 24 | N/A | No voice lines. |
| 25 | N/A | No voice. |
| 26 | N/A | No voice. |
| 27 | N/A | No voice. |
| 28 | PARTIAL | Hub falls back to "mars-base-ambience" (no `music-mission-moon`). |
| 29 | N/A | Music off by default. |
| 30 | PARTIAL | `playMusic` guards against duplicates; nothing handles tab hidden. |
| 31 | PASS | All buses route through the master gain, which mute zeroes. |
| 32 | PASS | Every message is text. |
| 33 | PARTIAL | Waits are under 3 s; the final domino animation is skippable only via reduced motion. |
| 34 | PASS | About 9 minutes; the run survives reload (QA script checks). |

Bug found (C): `EndOfSolScreen.tsx:36` returns the cleanup before line 37 pushes the storm sound, so that sound never plays there.
