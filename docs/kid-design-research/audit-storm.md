# Audit: "The Storm Season" (Mars, 5 sols) vs checklists A, B, C

Played end to end with headless Chrome (EN 1440x900 and 390x844 touch, BG at both), seed 1 (dust storm on sol 2, then the 11 Sep 2017 solar storm). Measured: computed font sizes, contrast (own calculator, overlay not included), button boxes, horizontal overflow. Read: `en.json`, `audio.ts`, `audio-manifest.json`, CSS. Not done: listening tests, greyscale/CVD simulation, 200% text zoom, keyboard-only run, contrast under the dust overlay. Scripts and screenshots are in the session scratchpad `audit-storm/`.

## (a) Score summary

| Checklist | Items | PASS | PARTIAL | FAIL | N/A |
|---|---|---|---|---|---|
| A learning and guidance | 40 | 16 | 20 | 2 (A9, A21) | 2 (A29, A30) |
| B visual, colour, type | 32 | 12 | 13 | 6 (B1, B9, B20, B21, B24, B25) | 1 (B23) |
| C sound, music, pacing | 34 | 15 | 12 | 2 (C8, C30) | 5 (C9, C24-C27) |

Strengths: no sound before the first tap, music off by default, one soft 1.25 s storm cue (never loops), reduced-motion guarded, 0 touch targets under 44 px, no horizontal overflow in BG at 390 px, "Why?" and skipped-job previews, a real NASA source card with a Saved badge on every data screen, five different beat types over five sols, replay with a different storm.

## (b) Top 10 fixes (ranked by impact on a 7-12 year old)

1. **Text is too small on the plan screen (A21, B25, B1, A22).** `src/plan.css:51` `.mini-text` is 0.68rem (10.9 px), `:41` `.mini-link small` 0.6rem (9.6 px); "What happens to skipped jobs?" is read by the very kids who skip jobs. Job numbers "01-05" are 2.98-4.4:1 and "Uses 2 power" 4.15:1. Change: min 1rem (16 px) for any sentence, 0.875rem only for labels; colour `#b5c8d5` is fine, lift "Uses N power" and the job numbers to `#c9d8e3` or larger bold. Also raise the 0.9rem body copy in `index.css:16,174` to 1rem. Effort M.
2. **The storm is never announced before the player acts (A17, A16, A19, C23).** The brief says "A real storm from the Sun is on its way. Nobody knows the hour." Then the storm card first appears on the night screen after the plan is locked, and it reads as a punishment. Change: on the morning screen of storm-eve sols show a "Space watch" strip: "Pip: The Sun looks busy. A storm may come soon. Build the shelter?" with a "likely / maybe" icon (never a certain hour). Also change the brief to say it is a 2017 storm replayed in the game: "A real storm from 2017 is coming to your base. In the game, nobody knows the hour." (`campaign.storm.brief`, `campaign.classic.brief`). Effort M.
3. **Too many numbers on the rover screen (A9, A2, B20, B19).** Explore shows 3 meters + Food + Science + Battery + Samples + terrain cost rules + map + d-pad + a 23-word data card at once. Change: first show only Battery, Samples and the map; collapse the 3 base meters to one thin row; move "Light ground costs 1 battery..." into a "?" and show the cost as a legend with icons. Shorten the real-data line to "This map is a real NASA picture of Gale Crater (1 square is 20 km)." Effort M.
4. **Plan screen offers 5 jobs and the same screen repeats every sol with the same guidance (B21, A31, A9).** Change: on sols 1-2 show only the 3 jobs that matter (panels, greenhouse, shelter) and reveal "Ask Earth" and "Science trip" on sol 3 with a one-line "New!" note; fade "Tap an astronaut. Then tap a job." after the first assignment of sol 2. Effort M.
5. **No ducking, no pause on hidden tab (C8, C30).** `audio.ts` has no `visibilitychange` handler (music keeps looping in a background tab) and never lowers music under a dialog. Change: in `audio.ts` add `document.addEventListener("visibilitychange", () => ctx?.[document.hidden ? "suspend" : "resume"]())`; when a `dialog[open]` or beat panel is shown call a `duck(0.4)` that ramps `buses.music.gain` over 300 ms and back on close. Effort S.
6. **Storm sound at end of sol never plays (C2, C18).** `src/screens/EndOfSolScreen.tsx:36` returns the cleanup before line 37 `if (storm) timers.push(...)`, so the cue is dead code on that screen. Change: move line 37 above the `return`. Add an all-clear cue (e.g. `resource-stable`) on the next morning after a storm. Effort S.
7. **Warning yellow and "Power" are not consistent (B9, B7, B8, B24).** Gold `#f5c542` marks the dust-storm dialog, the current-sol tile, the "Why?" button and selected map squares; Power is a blue battery pixel icon on meters but a ⚡ emoji on beat options and morning results; BG says "ток" on crew cards but "Енергия" on meters. Change: reserve `#f5c542` for warnings only (current sol = cyan outline, "Why?" = neutral); use the pixel battery everywhere (replace emoji in `beat.*` effects, domino icons); BG: "енергия" everywhere. Effort M.
8. **Failure screen wording and density (A28, A13, A27).** "Mission over / 1 star out of 3 / (missed)" then 9-12 domino links ("Show 3 more"). Change: title "Mission complete! 1 of 3 stars", keep the first 3 links visible with "Show the rest", replace "(missed)" with "Next time: ..." and one concrete tip, e.g. "Next time: clean the panels on sol 1. Clean panels make power." Effort S.
9. **Bulgarian gaps (A37, B30, A4).** The dust alarm source line is English ("Източник: NASA's Opportunity rover: ..."), "Wh" and the raw event id "2017-09-10T16:09:00-CME-001" are unexplained, and "Планирай сол 1" / "След този сол" reads as the word "salt" (feminine). Change: translate `hubStorm.source` captions (`campaigns.ts:34`), write "Планирай Марсовия ден 1 (сол)" once and use "ден" plus "(сол)"; hide the event id behind "More" in teacher view; add "(Wh = a small amount of electricity)" to the wipe real-number card. Effort M.
10. **Sound setup is hidden (C5, C12, C28, C19).** Volume sliders exist only under Settings on the main menu, and there is no headphones prompt or calm mode. Change: add a one-line first-tap prompt "Sound? [On] [Off]  Headphones help." and a "Calm" toggle in the header menu that sets sfx to 0.3 and disables `storm-flash` and `dust-alarm h2` pulse; give the storm night one tense but quiet loop (`music-mission-storm` slot already exists in `MUSIC_SLOTS`). Effort M.

Notes outside the top 10: mini-games (plan job tap) are interrupting dialogs with a ticking clock (A24); they have Skip, but add "No rush: it waits for you" or pause the tick until the first tap. The animated morning banner briefly overlaps the heading text (screenshot BG 1440, sol 3, `m-tip`), a visual glitch under 1 s.

## (c) Item-by-item table

### A learning and guidance
| # | Verdict | Evidence |
|---|---|---|
| A1 | PARTIAL | Menu hook "Can you keep 3 astronauts safe through a real solar storm?" (12 words) is on the menu; sol 1 morning shows the brief, but the plan screen has no goal line. |
| A2 | PARTIAL | Meters have name, icon, number, "Higher/Lower is better"; no marked safe zone; Food and Science are bare numbers; ray meter is /15 while others are /10. |
| A3 | PASS | Start, skip walk, Plan the day: first choice (Rover drive options) after about 4 taps, 25 s scripted. |
| A4 | PARTIAL | "A sol is one day on Mars" and radiation are explained; "Wh", "DONKI", event id, "X8.2 flare" partly; no icons for terms. |
| A5 | PARTIAL | Sol is defined on the menu first; Wh, "flare" explained after use. |
| A6 | PARTIAL | "Tap an astronaut. Then tap a job." good; world screen says "WASD / ARROWS · E TO INTERACT", "Interact E". |
| A7 | PARTIAL | Most 6-12 words; over 15: insight2022 text (21), map data card (23), InSight sand card (19). |
| A8 | PASS | Longest sentences under 25 words, average about 10. |
| A9 | FAIL | Explore screen: 3 meters, food, science, battery, samples, terrain rules, d-pad, data card. |
| A10 | PASS | Only taps and buttons. |
| A11 | PARTIAL | Upgrade and wipe options list gain and cost; dilemma meal shows only "-1 Food"; radio "Earth answers" is vague. |
| A12 | PARTIAL | Bars plus net change (+1/-1) in plan; no inflow/outflow split; Food/Science are not tanks. |
| A13 | PARTIAL | Final dominoes have captions; chains run 9+ links ("Show 3 more"). |
| A14 | PASS | "Why?" on each morning cause; domino replay on final. |
| A15 | PARTIAL | Ray meter 0.8/15 with decimals; bar plus number; not "x out of 10". |
| A16 | PARTIAL | "Nobody knows the hour"; sol 3 "was forecast to brush past"; no range/likely wording. |
| A17 | PASS | Plan screen "What happens to skipped jobs? TOMORROW"; morning "What happened overnight"; timeline 1-5. |
| A18 | PASS | "SAVED DATA · Nov 14, 2026" badge and "Real NASA data (saved):" with icon. |
| A19 | PARTIAL | Night cards say "A Mars rover measured this on 11 Sep 2017"; but brief says the storm "is on its way". |
| A20 | PASS | Meters carry numbers; panels have different sprites plus "6 dusty panels left"; crew have names. |
| A21 | FAIL | Many texts 14.4 px, plan small text 9.6-10.9 px; sans, left-aligned, no italics. |
| A22 | PARTIAL | 0 targets under 44 px (EN and BG, both sizes); storm tiles 88 px, steps 60 px; 64 px not met; "End sol" at page bottom. |
| A23 | PARTIAL | Touch run complete; keyboard works for explore/world; no full keyboard-only run. |
| A24 | PARTIAL | No timer on plan or rover; mini-games tick, with Skip. |
| A25 | PASS | `expedition.css:13,57`, `plan.css:66,109`, `morning.css:67`, `run.css:37`; flash is about 1 Hz. |
| A26 | PASS | Sfx and meter change on each tap. |
| A27 | PASS | Final shows causes ("Nobody cleaned the solar panels") and "Try a different plan" (1 tap). |
| A28 | PARTIAL | No game-over screen, but "Mission over", "(missed)", "Nobody ..." lines. |
| A29 | N/A | No hint ladder. |
| A30 | N/A | No hint ladder. |
| A31 | PARTIAL | Same instruction every sol; no fading. |
| A32 | PARTIAL | Animated banner, sparkle; music off by default; no animation switch except OS setting. |
| A33 | PASS | Every card has a Next button; no auto-advance. |
| A34 | PASS | Stars mark outcomes; no payment wording. |
| A35 | PASS | Sols 1-5: rover, upgrade, radio, dilemma, wipe, plus the dust storm repair. |
| A36 | PASS | Seeds change the storm; "Play again with a different storm"; run number shown. |
| A37 | PARTIAL | No overflow at 390 BG; English source line in BG dust alarm; "сол" gender; 200% zoom untested. |
| A38 | PARTIAL | Switch is `changeLanguage` in place; mid-mission not tested. |
| A39 | PASS | "Meters and job costs use game numbers." on every screen; real numbers carry sources. |
| A40 | PASS | "For teachers" overlay and `campaign.storm.planners`. |

### B visual, colour, type
| # | Verdict | Evidence |
|---|---|---|
| B1 | FAIL | Plan: job numbers 2.98-4.4:1, "Uses 2 power" 4.15:1 (14.4 px); other text 5.5-10:1. |
| B2 | PARTIAL | Storm dialog text about 13:1 on `#2a1a10`; text behind `.dust-cover` (80% brown) not measured. |
| B3 | PASS | Titles 6:1 and above. |
| B4 | PASS | Storm named with icon and text; states have words/numbers. |
| B5 | PARTIAL | Ray bar sliver at 0.2 is tiny; not measured. |
| B6 | PASS | Cyan focus and selected crew borders visible in screenshots. |
| B7 | PARTIAL | Power amber on bars, blue battery icon; food/science have no colour. |
| B8 | PARTIAL | Pixel battery vs ⚡ emoji; BG "ток" vs "енергия". |
| B9 | FAIL | `#f5c542` also on current-sol tile, "Why?" button, selection squares. |
| B10 | PARTIAL | Not tested. |
| B11 | PARTIAL | Not verified with a simulator. |
| B12 | PARTIAL | Amber bar with green tail; no red/green pair for two meanings confirmed. |
| B13 | PARTIAL | Teal and cyan both present; not compared. |
| B14 | PASS | `storm-flash` 0.9 s x2 steps = about 1 Hz; h2 pulse 1 Hz. |
| B15 | PASS | `expedition.css:57`, `run.css:37`. |
| B16 | PARTIAL | Overlay is a fixed cover with a scrolling background; fade not measured. |
| B17 | PARTIAL | `pointer-events:none` but tints the whole HUD. |
| B18 | PASS | "Dust storm!" plus icon; "about one third less power", "3 times stronger". |
| B19 | PARTIAL | Plan has crew, 5 jobs, meters side by side; no single focus. |
| B20 | FAIL | Explore shows 7 numeric readouts. |
| B21 | FAIL | Plan has 5 jobs; upgrade beat has 4 options. |
| B22 | PASS | Meters and dominoes labelled. |
| B23 | N/A | Pixel art not audited. |
| B24 | FAIL | Battery pixel vs ⚡ emoji for Power. |
| B25 | FAIL | Body 14.4 px; 9.6-10.9 px blocks at 390. |
| B26 | PASS | Nunito; 0 italics; short caps labels. |
| B27 | PASS | Pixelify Sans only on the menu title. |
| B28 | PARTIAL | Not measured. |
| B29 | PASS | Nunito in BG; title stays English by design. |
| B30 | PASS | No overflow or truncation in BG at 390. |
| B31 | PASS | No target under 44 px measured. |
| B32 | PARTIAL | Storm buttons 52-60 px; others not verified at 56 px. |

### C sound, music, pacing
| # | Verdict | Evidence |
|---|---|---|
| C1 | PASS | `audio.ts` creates the context in a gesture listener; "Never autoplays". |
| C2 | PASS | Dust dialog and night "Space-ray storm!" banner show text. |
| C3 | PASS | All info is also text. |
| C4 | PASS | Header sound toggle on all screens, over 44 px, button element. |
| C5 | PARTIAL | Master, music, sfx sliders only in main-menu Settings; no voice. |
| C6 | PASS | `localStorage` "sol:audio" in try/catch. |
| C7 | PASS | Music off by default; mute toggle. |
| C8 | FAIL | No ducking in `audio.ts`. |
| C9 | N/A | No ducking to restore. |
| C10 | PASS | Synthesised ambience loops, no lyrics. |
| C11 | PARTIAL | Master 0.7, sfx 0.7, per-sound 0.2-0.65; not listened. |
| C12 | PARTIAL | "Music is off at first"; no headphones prompt. |
| C13 | PARTIAL | Gains only; not measured in LUFS. |
| C14 | PARTIAL | storm-warning 0.55 (max 0.65); attack unknown. |
| C15 | PASS | One 1.25 s shot, no loop. |
| C16 | PARTIAL | Separate files exist; timbre not listened. |
| C17 | PARTIAL | storm-warning vs particle-burst tiers for solar; dust uses one. |
| C18 | PARTIAL | Dust: "Storm damage fixed!" + job-complete; solar: no explicit all-clear. |
| C19 | PARTIAL | Reduced motion yes; no calm option. |
| C20 | PASS | menu-error 0.24 s at 0.5; mini-game "oops" text. |
| C21 | PASS | 70 ms gap limit; two step variants. |
| C22 | PASS | mission-success only at the end. |
| C23 | PASS | Banner visible with the cue. |
| C24-C27 | N/A | No voice lines. |
| C28 | PARTIAL | Hub and console ambience only; no storm mood. |
| C29 | PARTIAL | Music off by default; not listener-tested. |
| C30 | FAIL | No `visibilitychange` handling in `audio.ts`. |
| C31 | PASS | Mute gates master gain and `audible()`. |
| C32 | PASS | Nothing is sound-only. |
| C33 | PARTIAL | Morning cue waits 1.3 s; final dominoes about 2.5 s; Skip exists in mini-games. |
| C34 | PASS | About 8 min; reload on plan screen keeps the mission. |
