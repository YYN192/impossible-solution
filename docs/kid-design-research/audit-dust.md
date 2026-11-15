# Audit: Dust Season (Mars, 6 sols), against checklists A, B, C

Played headless Chrome, `?teacher=1&offline=1&campaign=dust&seed=7`, 1440x900 and 390x844, EN and BG (`&lang=bg`), full mission (site, wipe, storm jobs, upgrade, radio, dust devil, rover, final). Scripts: scratchpad `audit-dust/`. Contrast measured from screenshots; fonts and tap sizes from computed styles.

**Correction to the brief:** the Dust Season sol-6 "rover drive" has NO Gale Crater map. `src/data/campaigns.ts:210-217` makes it three plain option cards. The map (`ExploreBeat`, `campaigns.ts:99`) belongs to the Storm Season. Explore-map items are scored on what Dust shows. Seed 7 storm: confirmed, the alarm fires at the start of sol 3 and the same storm continues on sol 4.

## (a) Score summary

| Checklist | PASS | PARTIAL | FAIL | N/A |
|---|---|---|---|---|
| A learning (40) | 18 | 19 | 2 | 1 |
| B visual (39) | 14 | 18 | 5 | 2 |
| C sound (34) | 13 | 9 | 6 | 6 |

Seconds to first choice (A3): about 3 s scripted, 3 taps (Start, "Skip the walk", "Plan the day"). Visible EN sentences: average 6.7 words; only 4 over 15.

## (b) Top 10 fixes (ranked by impact on a 7-12 year old)

1. **Dust overlay makes the hub unreadable (B2, B17, B15, B16, A22).** `src/expedition.css:44`: `.dust-cover` is fixed, z-index 40, over the whole page including header, "Interact" and "Skip the walk" buttons. Measured contrast at 2 jobs left: note text 2.72, Interact 2.83, Skip 2.58, header 3.2 (need 4.5). Change: lower to `opacity` max 0.35, or move the veil under the UI (`z-index:1`, UI above it) and draw dust only over `.station canvas`. Also lengthen `transition` to 1.2s. **S**
2. **Wrong event on sol 6 report (A39, A19).** The Pip line and the card show "20 May 2024 ... more than 50 times stronger" but the data card says "29 Oct 2021, about 3 times the usual level" and the Pip line says "a small storm". Two different storms in one report. Fix: make the narrative text come from the same `StormEvent` the card uses (find the key behind the "It's real!" block in the morning/report screen; `campaigns.ts:204-206` picks `sun`). EN rewrite: "29 Oct 2021. A NASA rover on Mars measured this storm. The rays were about 3 times the usual level." **M**
3. **No mission goal before the first action (A1, A31).** Sol-1 report only says "Pick a site and keep the base warm." Add one line to the sol-1 report and the menu card: "Keep the lights on for 6 sols. Earn 3 stars." (10 words) plus the 3 star goals as icons (shield, bulb, rock) under it. Today the star rules appear only on the last screen. **S**
4. **Meters have no target or safe zone; Food/Science have no icon or bar (A2, A12, B5, B20).** `Food 1`/`Science 0` are 12 px, unlabelled by icon. Change: add the existing food and science icons, 16 px text, and a tick mark on each bar at "need 3 to be safe" (power) and a red zone on the dose bar. Show "+x per sol / -y per sol" on the plan card, not only the net. **M**
5. **Text under 16 px and tap targets under 44 px (B25, B31, A21, A22).** 14 px on all option cards, headers, chips (`Real: ...` is 14.4 px); 12 px Food/Science; 11.2 px "A sol is one day on Mars." on the menu; "?" help buttons 39-43 px (report screen, phone and desktop); source link 20 px tall. Change: body `font-size:1rem` min (16 px) on `.beat-option`, `.sol-explainer`, `.meter` labels; `.whats-this{min-width:48px;min-height:48px}`; source links `padding:12px 0; display:inline-block`. **S**
6. **Mini-games tick in real time with no pause (A24, C33, C19).** `src/game/miniGames.ts:21` `TICK_MS=300`; the shelter block, Earth, rock holes move on their own. Skip exists, but there is no "slow" or "calm" option. Change: add "Slow mode" toggle in Settings that sets `TICK_MS=600` and a "Wait" button; default slow for Cadet. **M**
7. **No sound-off or calm settings on game screens; Settings only on the menu (B38, C5, C12, C19).** `MainMenu.tsx:80-85`. The top bar has mute only. Add a Settings gear to every screen header, with: music on/off, effects on/off, "Quiet class" one tap (all off), "Calm mode" (no shake, no overlay animation, softer alarm), text size (100/125/150%). Show "Headphones help" once on first Start (C12). **M-L**
8. **Music: no ducking, no tab-hidden pause (C8, C9, C30).** `src/game/audio.ts` has only `playMusic/stopMusic`. Change: add `duck(on)` that ramps `buses.music.gain` to 0.3 over 300 ms while a `<dialog>`/beat screen is open, and `document.addEventListener("visibilitychange", () => ctx.suspend()/resume())`. Music is off by default (`music:0`), so impact is moderate. **S-M**
9. **Dust-alarm content is English-only in BG and dense (A37, A7, A4).** BG storm modal shows "Източник: NASA's InSight lander lost power when dust covered..." (source label not translated); the EN real-storm text is 20 words with "watt-hours". Change: translate source labels via `sourceText.ts`; EN: "In 2022, dust hit NASA's InSight lander. It made one third less power. A watt-hour is a tiny bit of electricity." (3 short sentences, 8-10 words each). **S**
10. **Plan screen has too many things at once, and a repeating guide (A9, A31, B19, B20).** Plan shows 3 crew, 5 jobs, 3 meters, food, science and 5 "skipped job" explainers (about 15 items). Change: show only skipped-job explainers for jobs the player has not picked, collapse them under "What if I skip?" on sol 1 open, closed from sol 3; fade the "Tap an astronaut. Then tap a job." line after sol 2. **M**

Other findings worth a ticket: phone hub map is about 300 px wide under a 300 px header stack (header buttons wrap to 4 rows); the "?" circle on each meter sits between label and number and wraps "Space-ray meter" to three lines at 390 px; Settings has no text-size or high-contrast control (B38).

## (c) Item-by-item

### A. Learning and guidance

| # | Result | Evidence |
|---|---|---|
| 1 | PARTIAL | Hub: "Walk to the glowing console to plan your mission." (navigation, not goal). Sol-1: "Pick a site and keep the base warm." No stated win condition until final screen. |
| 2 | PARTIAL | Meters: name + icon + "Higher/Lower is better", no target zone. Food/Science: text only, 12 px. |
| 3 | PASS | 3 taps to site choice (~3 s scripted). |
| 4 | PARTIAL | "?" on meters; "radiation (invisible energy from space)" and "watt-hour" defined in text; "Wh" in wipe card unexplained; no icons on definitions. |
| 5 | PARTIAL | "sol" defined on menu first; watt-hour defined after use in the same sentence. |
| 6 | PASS | "Tap an astronaut. Then tap a job."; "Choose"; no "click". Hub says "WASD / ARROWS · E" (keys named, acceptable). |
| 7 | PARTIAL | Avg 6.7 words; 3 visible sentences 18-20 words (hubStorm.real.insight2022, source lines); one 41-word hidden hub description. |
| 8 | PASS | Avg 6.7 words. |
| 9 | PARTIAL | Plan screen ~15 items; beats 3-4; storm modals 1-2. |
| 10 | PASS | No typing anywhere. |
| 11 | PASS | Option chips show gain and cost, e.g. wipe: "+0.3 Space-ray meter / Panels up to 80% clean". |
| 12 | PARTIAL | Bars with net change per sol (-1, +1); no inflow/outflow split. |
| 13 | PASS | Final: chains of 2-3 captioned links with arrows. |
| 14 | PARTIAL | Final lists the chain; replay on request not seen. |
| 15 | PARTIAL | Space-ray as "0.7 / 15"; storm "about 3 times usual"; dust as "50% of power" (percent only). |
| 16 | PARTIAL | Radio Earth gives no dust-length forecast in what I saw; "Earth will answer by the morning" only. Not verified further. |
| 17 | PARTIAL | "What happened overnight", "TOMORROW" tags; no visible timeline of delayed effects. |
| 18 | PARTIAL | "SAVED DATA · Nov 14, 2026" and "(saved)" text; same satellite icon for live and saved. |
| 19 | PASS | Storm shown as past in report ("A dust storm dimmed the Sun"); see 39 for the mismatch. |
| 20 | PASS | Every meter has label + number; panels differ by sprite and count text; crew by name. |
| 21 | PARTIAL | Nunito, left-aligned; 14-14.4 px body, 12 px labels; no text-size control. |
| 22 | PARTIAL | "?" buttons 39-43 px; source link 20 px; main buttons 48+ px; Interact/Skip at the bottom edge on phone. |
| 23 | PASS | All tasks are real buttons, autoFocus in dialogs (code read; not driven by keyboard in this run). |
| 24 | PARTIAL | No timers on core screens; mini-games tick every 300 ms, Skip only. |
| 25 | PASS | Reduced-motion rules at `expedition.css:13,57`, `plan.css:109`; alarm pulse 1 Hz. |
| 26 | PASS | Every tap changes state/sound; storm panels show "6 dusty panels left". |
| 27 | PASS | Early end: "Mission ended early. Here is what caused it." + "Try a different plan" (1 tap). |
| 28 | PASS | "Mission over", "1 star out of 3"; no blame words. |
| 29 | PARTIAL | "?" and "Why?" exist; no stepped hint ladder. |
| 30 | N/A | No hint ladder. |
| 31 | FAIL | Same guide lines every sol; no toggle. |
| 32 | PARTIAL | Hub character and dust drift decorative; no toggle. |
| 33 | PASS | Every card has a Next/Continue button. |
| 34 | PASS | Stars describe outcomes only. |
| 35 | PASS | A different beat each sol: site, wipe, upgrade, radio, dust devil, rover. |
| 36 | PASS | Seed changes storm sol and real storm; three sites differ. |
| 37 | PARTIAL | BG no overflow at 1440 or 390; 200% not tested; EN source label inside BG modal. |
| 38 | PARTIAL | Toggle in header; keeping position not tested. |
| 39 | FAIL | Sol-6 report: "20 May 2024 ... more than 50 times" vs card "29 Oct 2021, about 3 times". |
| 40 | PASS | "For teachers" on menu. |

### B. Visual, colour and type

| # | Result | Evidence |
|---|---|---|
| 1 | PARTIAL | Normal screens pass (8.2-15 : 1; job numbers 4.4). Overlay screens fail (see 2). |
| 2 | FAIL | Overlay on: 2.58-3.4 on all hub text and buttons. |
| 3 | PASS | Overlay title 3.6; headings large. |
| 4 | PARTIAL | Storm named in text + tornado icon; meters have text. Panels dusty vs clean = sprite + count. Ok, but "Power is low" alone relies on arrow icon + text (pass). Hub "!" markers colour+shape. |
| 5 | PARTIAL | Bars about 3:1; dose bar purple on dark ~3:1; no safe zone. |
| 6 | PASS | White 2 px selected borders on cards. |
| 7 | PASS | Power orange, air teal, dose purple on beat, plan and morning. |
| 8 | PARTIAL | Icons consistent; label "Space-ray meter" vs elsewhere "radiation". |
| 9 | PARTIAL | Yellow used for "Sol 1 of 6 · Choose a site" subtitle (not a warning). |
| 10 | PARTIAL | Not rendered in greyscale; power orange vs air teal differ by luminance, unverified. |
| 11 | PARTIAL | No CVD simulation run. |
| 12 | PASS | No red/green pair; overlay orange/brown. |
| 13 | PARTIAL | Teal air vs cyan buttons; different roles. |
| 14 | PASS | Pulse 1 Hz on heading only. |
| 15 | PASS | `expedition.css:13,57` stops animation. |
| 16 | PARTIAL | Fade `.8s` (<1 s); drift animation 2.4 s loop; no shake. |
| 17 | FAIL | Overlay sits above header, Interact and Skip buttons (dims them). |
| 18 | PARTIAL | "Dust storm!" + icon; effect shown as "275 vs 425 Wh", jargon. |
| 19 | PASS | One primary button per screen. |
| 20 | PASS | 3 meters + food/science. |
| 21 | PASS | 3 option cards per beat. |
| 22 | PARTIAL | Meter "?" icon unlabelled; hub "!" markers. |
| 23 | PARTIAL | Pixel art scaled non-integer; not measured. |
| 24 | FAIL | Emoji in chips (🌪️ 🛰️ 🧽) beside pixel icons for the same concepts. |
| 25 | FAIL | 14-14.4 px body, 12 px labels on phone. |
| 26 | PARTIAL | Nunito yes; Pixelify only in title; "SAVED DATA" caps label; fine. |
| 27 | PASS | Pixelify only in title. |
| 28 | PARTIAL | Lines about 80+ chars at 1440; line height ok. |
| 29 | PASS | Cyrillic in Nunito everywhere; title is Latin. |
| 30 | PASS | BG no overflow or clipping. |
| 31 | PARTIAL | "?" 39-43 px; source link 20 px. |
| 32 | PARTIAL | Primary buttons 48+ px, not 56 px; Interact near the bottom edge on phone. |
| 33 | PASS | Close/Skip same size as other buttons. |
| 34 | PARTIAL | No overflow at 390 and 1440; 200% zoom not tested. |
| 35 | N/A | Not tested. |
| 36 | PARTIAL | Alarm: text + icon + sound; success relies on text. |
| 37 | PASS | Mini-games under 300 ms feedback; Skip available. |
| 38 | FAIL | No contrast or reduce-motion setting in the UI. |
| 39 | N/A | Needs a kid. |

### C. Sound, music and pacing

| # | Result | Evidence |
|---|---|---|
| 1 | PASS | `audio.ts` creates context on first gesture. |
| 2 | PASS | Storm-warning sound is paired with the modal "Alarm / Dust storm!". |
| 3 | PASS | No info by sound alone. |
| 4 | PARTIAL | Mute button in every header; target about 44 px (not measured on each screen). |
| 5 | PARTIAL | Master/music/SFX sliders but only on menu; no voice (none exists). |
| 6 | PASS | `localStorage sol:audio` with try/catch. |
| 7 | PASS | Music off by default (`music:0`); slider and mute. |
| 8 | FAIL | No ducking. |
| 9 | FAIL | No ducking, so no return. |
| 10 | PASS | Ambience loops, instrumental, no lyrics. |
| 11 | PARTIAL | master 0.7, sfx 0.7; gain not documented. |
| 12 | FAIL | No classroom mode, no headphones prompt. |
| 13 | PARTIAL | RMS -17 to -24 dBFS (7 dB spread); ambience -33 to -38. |
| 14 | PASS | storm-warning peak -12 dBFS, not loudest; 8 ms attack soft enough. |
| 15 | PASS | storm-warning 1.25 s, plays once. |
| 16 | PARTIAL | Distinct files; not auditioned. |
| 17 | FAIL | One storm-warning sound; no tiering. |
| 18 | PARTIAL | job-complete on repair + "clear" notice; no distinct all-clear. |
| 19 | PARTIAL | Reduced motion yes; no calm/softer-alarm toggle. |
| 20 | PARTIAL | menu-error soft (-16 dBFS); reason text mostly present. |
| 21 | PASS | 70 ms rate limit; step A/B alternate. |
| 22 | PASS | Biggest cue only mission-success. |
| 23 | PARTIAL | Visual cue persists with modal; no caption text for sound. |
| 24 | N/A | No voice. |
| 25 | N/A | No voice. |
| 26 | N/A | No voice. |
| 27 | N/A | No voice. |
| 28 | N/A | Music off by default; not auditioned. |
| 29 | N/A | Same. |
| 30 | FAIL | No visibilitychange handler for audio. |
| 31 | PASS | Single Web Audio graph gated by mute. |
| 32 | PASS | Played muted by design; all info is text. |
| 33 | FAIL | Mini-games tick on their own; skip yes but no pause; some waits unmeasured. |
| 34 | PASS | About 10 minutes scripted 25-30 s; reload on plan keeps state (QA script). |
