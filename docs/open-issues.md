# Open issues: sorted by importance, then difficulty

_Generated on Sun 15 Nov 2026, 14:40 (Sofia) from https://github.com/YYN192/impossible-solution/issues. The sub-tasks are the checklists in each issue and in its comments; none of these issues uses GitHub's sub-issue feature. Items fixed and verified today are ticked even where GitHub has not been updated yet._

**Importance:** Critical = needed for tonight's submission · High = judges or kids will hit it · Medium = clearly worth it · Low = nice to have.  
**Difficulty:** S = under 1 hour · M = 1–3 hours · L = more than 3 hours.

## Overview

| # | Issue | Importance | Difficulty | Sub-tasks open/total | Next step |
|---|---|---|---|---|---|
| #71 | Release v0.2.0 for the submission build | Critical | S | 7/7 | Team task for tonight: CHANGELOG 0.2.0, version bump, tag, GitHub release. |
| #22 | Global submission + pitch prep | Critical | S | 3/3 | Team task: submission form, pitch, judge pass. Hard deadline 23:59. |
| #11 | Record the ≤30 s demo video from ?demo=1 | Critical | S | 0/0 | Probably done: the team already has the video (docs/media/launch-video.mp4, 30.0 s). Close it after checking. |
| #70 | Launch video 15–18 s: Earth-forecast highlight drifts off its line, then the scene dims out too early | High | S | 0/0 | Video edit: 15–18 s highlight drifts and the dim comes too early. Needs the video tool, not code. |
| #67 | Text audit: remove or replace text that does not add anything | High | S | 9/9 | Quick copy wins: Tap → Choose; one word per resource; failure wording. The BG dust-alarm source line is already done. |
| #75 | Readability: dust overlay contrast, text under 16 px, small targets, phone layout hides the main action | High | M | 2/6 | Dust veil, text sizes, contrast and buttons are done. Left: phone layout (Start, End sol and preview below the fold) and a contrast check under the dust. |
| #63 | Mini games: arrow keys / WASD do not move the rover | High | M | 5/5 | P0. Keyboard-only players can only skip mini-games. Add arrow/WASD/Space with gameKey() (same fix as #53). |
| #64 | Show, don't tell: review every screen and guide the first mission | High | L | 11/11 | Biggest teaching win: goal line, meter safe zones, storm warning before the plan, a result line after each choice. |
| #59 | Mission 1 needs more hands-on interaction for 8-year-olds | High | L | 9/9 | P0 label, but a design job: new hands-on moments for 8-year-olds, rover screen overload, mini-game clock. |
| #68 | Rover out of power: play a sound, shake the screen and say "No power" | Medium | S | 6/6 | Rover out of power: sound, short shake, "No power!". Small and self-contained. |
| #66 | Rover mission: check the rover really drove far and the crew is not overworked | Medium | S | 3/9 | Main fixes done (live cost, no-sample result, tests). Left: a team decision on whether samples should tire the crew. |
| #76 | South Pole Outpost still says Mars and sol (text, hub art, ambience) | Medium | M | 2/5 | Moon wording done (Artemis Outpost, no Mars/sol, test). Left: Moon hub art (Earth in the window) and a Moon ambience loop. |
| #65 | End-of-day wrap-up: pop-ups and animation for the important data | Medium | M | 10/10 | Celebrate by result, chain one link at a time, "Next time" tip, count-up pop-ups. |
| #62 | Soundtrack: different music for each part of the game | Medium | M | 10/10 | Quick part (S): duck music under text, pause in hidden tabs, fades. Full part (L): one track per game state. |
| #77 | Comfort settings: calm mode, high contrast, text size, in-game settings, mini-game pause | Medium | L | 7/7 | Calm mode, high contrast, text size, settings on every screen, mini-game pause. |
| #58 | For teachers: unlock all missions with a teacher key | Low | S | 5/5 | Teacher key. ?teacher=1 already unlocks everything; this is a friendlier UI for it. |
| #55 | Mission console: pulsing glow on the raised edge around it | Low | S | 4/4 | Pulsing glow on the console edge. The owner called glows tacky today, so consider closing this. |
| #52 | Base walk: dust puffs while walking and a bouncy idle animation | Low | S | 6/6 | Walking dust puffs and an idle bounce (cosmetic). |
| #61 | Click or drag the mouse to make the astronaut walk there | Low | M | 6/6 | Tap/click-to-walk already exists; this adds press-and-drag follow. |
| #60 | Engineering console: live space weather ticker from DONKI, 8-bit style | Low | M | 6/6 | Live DONKI ticker on the engineering console (data layer and snapshots already exist). |
| #57 | NPCs explain themselves with typed-out subtitles (lore + mission) | Low | M | 6/6 | Typed-out NPC subtitles with lore and mission hints. |
| #54 | Station airlock should do something useful (e.g. a map of Mars) | Low | M | 5/5 | Airlock now opens the dust-storm panel task. Decide whether it also needs a map when there is no storm. |
| #78 | Kid-design research and audit of every mission (15 Nov): tracking | — | — | 0/0 | Tracking issue for the kid-design research and audits. Links #73–#77 and the comments. |

## Closed today (for reference)

- #53 Bulgarian keyboard: WASD and E use the physical key.
- #56 Help bubble no longer covers the footer.
- #73 Data honesty: a game event is no longer shown as real, and the report storm matches its card.
- #74 Storm sound plays again; warning sounds have a visible line.
- #8 Today's Sun card (PR #69).

## Critical

### #71 Release v0.2.0 for the submission build

**Importance:** Critical · **Difficulty:** S · **Labels:** team · https://github.com/YYN192/impossible-solution/issues/71

Team task for tonight: CHANGELOG 0.2.0, version bump, tag, GitHub release.

**Sub-tasks:**

- [ ] Pick which of #52–#68 go in before the release; the rest stay open for later.
- [ ] `CHANGELOG.md` has a `[0.2.0]` section (Keep a Changelog format) listing everything since v0.1.0, with issue/PR numbers.
- [ ] `package.json` version is `0.2.0`.
- [ ] `npm run build && npm test` and `node scripts/qa/campaigns.mjs` pass on the release commit.
- [ ] The Vercel deploy of that commit works at https://impossible-solution.vercel.app in EN and BG.
- [ ] Tag `v0.2.0` on main and a GitHub release with the changelog notes, the play link and the launch video link.
- [ ] Done before the Sun 20:00 (Sofia) submission.

### #22 Global submission + pitch prep

**Importance:** Critical · **Difficulty:** S · **Labels:** team · https://github.com/YYN192/impossible-solution/issues/22

Team task: submission form, pitch, judge pass. Hard deadline 23:59.

**Sub-tasks:**

- [ ] `/space-apps-judge` pass #2 (Sun 09:00) and rules-auditor
- [ ] `/pitch-prep` Sun 14–16 (3-min pitch + Q&A; defend game numbers vs real data)
- [ ] `/submission-pack` → submit by 20:00 (hard deadline 23:59)

### #11 Record the ≤30 s demo video from ?demo=1

**Importance:** Critical · **Difficulty:** S · **Labels:** team · https://github.com/YYN192/impossible-solution/issues/11

Probably done: the team already has the video (docs/media/launch-video.mp4, 30.0 s). Close it after checking.

_No checklist in the issue._

## High

### #70 Launch video 15–18 s: Earth-forecast highlight drifts off its line, then the scene dims out too early

**Importance:** High · **Difficulty:** S · **Labels:** none · https://github.com/YYN192/impossible-solution/issues/70

Video edit: 15–18 s highlight drifts and the dim comes too early. Needs the video tool, not code.

_No checklist in the issue._

### #67 Text audit: remove or replace text that does not add anything

**Importance:** High · **Difficulty:** S · **Labels:** copy · https://github.com/YYN192/impossible-solution/issues/67

Quick copy wins: Tap → Choose; one word per resource; failure wording. The BG dust-alarm source line is already done.

**Sub-tasks:**

- [ ] A report in `docs/` lists every screen, each text block, and the decision with a reason.
- [ ] All "remove" and "replace" decisions are applied in EN and BG together.
- [ ] Copy tests (`en.copy.test.ts`, `bg.copy.test.ts`) still pass; BG keeps the same keys as EN.
- [ ] Before/after screenshots for each changed screen are attached to the PR.
- [ ] **"Tap" appears in 5 strings** (`en.json` lines 27, 29, 277, 864, 897, plus BG), but keyboard and mouse players don't tap (A6). Use "Choose an astronaut. Then choose a job." and "Press to decode it". ([shared](https://github.com/YYN192/impossible-solution/blob/main/docs/kid-design-research/audit-shared.md) 8)
- [ ] **One word per resource:** "dose" vs "Space-ray meter" (Pip says "Lower dose is better", `dialogue.drone.advice`), and in BG "ток" vs "Енергия". ([shared](https://github.com/YYN192/impossible-solution/blob/main/docs/kid-design-research/audit-shared.md) 4, [moon](https://github.com/YYN192/impossible-solution/blob/main/docs/kid-design-research/audit-moon.md))
- [ ] **Bulgarian gaps:**
  - The dust-alarm source line is still English ("Източник: NASA's Opportunity rover…"); translate it through `sourceText.ts`.
  - "сол" is used as masculine ("този сол").
  - "Wh" and the raw event ID are not explained.
  - "На всяко нещо липсва" reads awkwardly.
- [ ] **The dust-alarm real-storm text is dense** (20 words, "watt-hours"). Try: "In 2022, dust hit NASA's InSight lander. It made one third less power."
- [ ] **The failure wording teaches nothing.** "Mission over / 1 star / (missed)" becomes "Mission complete! 1 of 3 stars", plus one "Next time: …" tip. ([storm](https://github.com/YYN192/impossible-solution/blob/main/docs/kid-design-research/audit-storm.md) 8)

### #75 Readability: dust overlay contrast, text under 16 px, small targets, phone layout hides the main action

**Importance:** High · **Difficulty:** M · **Labels:** accessibility, ui, P0 · https://github.com/YYN192/impossible-solution/issues/75

Dust veil, text sizes, contrast and buttons are done. Left: phone layout (Start, End sol and preview below the fold) and a contrast check under the dust.

**Sub-tasks:**

- [x] Put the dust veil under the UI: confine it to `.world-screen`, cap its opacity, and fade it in over 0.6 s. Every text stays at 4.5:1 or more (re-measure).
- [x] Minimum 1rem for sentences and 0.875rem for labels only; `max-width: 62ch` on `.lead`.
- [x] Raise the low-contrast greys to 4.5:1 or more.
- [x] "?" buttons at least 44 px; primary buttons `min-height: 56px`.
- [ ] Phones:
  - Start above the fold.
  - A sticky plan bar with End sol and the preview.
  - Meters as one compact strip above the beat options.
  - A collapsed header menu in the hub.
- [ ] Re-run `npm run qa` (labels, layout) and add a contrast check under the dust overlay.

### #63 Mini games: arrow keys / WASD do not move the rover

**Importance:** High · **Difficulty:** M · **Labels:** bug, P0 · https://github.com/YYN192/impossible-solution/issues/63

P0. Keyboard-only players can only skip mini-games. Add arrow/WASD/Space with gameKey() (same fix as #53).

**Sub-tasks:**

- [ ] In every mini game that has a rover or a moving piece, arrows and WASD move it, using `KeyboardEvent.code` so it also works with the Bulgarian layout (see the BG interact key issue).
- [ ] Space / Enter does the main action (drop, send, catch) where one exists.
- [ ] Keys are released properly when the window loses focus.
- [ ] Key hints on screen show which keys to use.
- [ ] Tests first: a keydown in `JobMiniGame` moves the piece.

### #64 Show, don't tell: review every screen and guide the first mission

**Importance:** High · **Difficulty:** L · **Labels:** ui, copy · https://github.com/YYN192/impossible-solution/issues/64

Biggest teaching win: goal line, meter safe zones, storm warning before the plan, a result line after each choice.

**Sub-tasks:**

- [ ] A checklist in `docs/` lists every screen, what it explains in text, and what will show it instead.
- [ ] Mission 1 has a step-by-step guide that points at the next thing to do, and it never blocks with a wall of text.
- [ ] The guide only appears on the first play (and can be replayed from the help ?).
- [ ] A new player can finish mission 1 without reading more than one sentence per step.
- [ ] Tests first for the guide's step logic.
- [ ] **No goal before the first action** (A1). The star rules first appear on the final screen. Add a sol-1 line of 12 words or fewer: "Keep the crew safe and the lights on for 6 sols. Earn 3 stars." Show the 3 star goals as icons. ([dust](https://github.com/YYN192/impossible-solution/blob/main/docs/kid-design-research/audit-dust.md) 3, [moon](https://github.com/YYN192/impossible-solution/blob/main/docs/kid-design-research/audit-moon.md) 7)
- [ ] **Meters have no safe zone** (A2, A12). They only say "Higher is better".
  - Add a tick or green band at the game's own thresholds (`ENGINE.lowPowerToday`, the dose limit).
  - Read the dose as "3 of 15".
  - Show inflow and outflow, e.g. "+2 sun, −1 jobs = +1".
- [ ] **The solar storm is never announced before the player acts** (A16, A17). The brief says a storm "is on its way", but the first card appears on the night screen, after the plan is locked, so it feels like a punishment. On storm-eve mornings show a "Space watch" strip: "Pip: The Sun looks busy. A storm may come soon." ([storm](https://github.com/YYN192/impossible-solution/blob/main/docs/kid-design-research/audit-storm.md) 2)
- [ ] **Choices end with "You chose X" and no consequence** (A13, A17). Add a result line for each option, e.g. "You drove to the rim. The rover scooped ice: +1 air, −1 power." ([moon](https://github.com/YYN192/impossible-solution/blob/main/docs/kid-design-research/audit-moon.md) 6)
- [ ] **The plan screen shows too much at once** (A9, A31, B20, B21). It has about 25 controls, 5 jobs every sol, and the same "how to" line every sol.
  - On sols 1–2 show 3 jobs, and reveal Ask Earth and Science with a "New!" note.
  - Fade the "how to" line after sol 2.
  - Fold "What happens to skipped jobs?" into a `<details>` that is open on sol 1 only.
- [ ] **A no-win choice when power is 0:** on the Moon sky-watch day only "No" works. Show what "No" risks, and warn on the plan screen the day before. ([moon](https://github.com/YYN192/impossible-solution/blob/main/docs/kid-design-research/audit-moon.md) 5)

### #59 Mission 1 needs more hands-on interaction for 8-year-olds

**Importance:** High · **Difficulty:** L · **Labels:** enhancement, P0 · https://github.com/YYN192/impossible-solution/issues/59

P0 label, but a design job: new hands-on moments for 8-year-olds, rover screen overload, mini-game clock.

**Sub-tasks:**

- [ ] Mission 1 has at least 2 new hands-on interactions, each under 30 s.
- [ ] No screen in mission 1 is text only with a single Next button.
- [ ] A new player finishes mission 1 in 3–6 minutes without help (check with a kid or a teammate who never saw it).
- [ ] Works with mouse, touch and keyboard, EN and BG.
- [ ] Tests written first for any new logic.
- [ ] **The rover screen shows about 7 numbers at once:** 3 meters, food, science, battery, samples, terrain cost rules, a 23-word data card, the map and the d-pad (A9, B20). Show Battery, Samples and the map first. Collapse the base meters into one thin row, and turn the terrain cost into an icon legend behind a "?". ([storm](https://github.com/YYN192/impossible-solution/blob/main/docs/kid-design-research/audit-storm.md) 3)
- [ ] **Mini-games run on a clock with no pause:** `miniGames.ts:21` ticks every 300 ms, and they open 3 times a sol. The clock should start on the first tap, with Pause and a slow mode (A24). Details are in #77.
- [ ] **Replay variety on the Moon is thin:** seeds 3 and 8 give the same five beat types (A36). Swap the day 2/4 order or add one more rover or radio variant. ([moon](https://github.com/YYN192/impossible-solution/blob/main/docs/kid-design-research/audit-moon.md))
- [ ] **Dust Season's rover day is plain choice cards** (`campaigns.ts:210-217`); only the Storm Season has the real-map drive. Consider reusing the map drive here. ([dust](https://github.com/YYN192/impossible-solution/blob/main/docs/kid-design-research/audit-dust.md))

## Medium

### #68 Rover out of power: play a sound, shake the screen and say "No power"

**Importance:** Medium · **Difficulty:** S · **Labels:** enhancement, ui · https://github.com/YYN192/impossible-solution/issues/68

Rover out of power: sound, short shake, "No power!". Small and self-contained.

**Sub-tasks:**

- [ ] When the rover battery reaches 0, a "power down" sound plays once (respects the sound toggle).
- [ ] The screen shakes briefly (about 0.3–0.5 s); no shake with `prefers-reduced-motion`.
- [ ] A big "No power!" / "Няма ток!" message appears over the rover, in EN and BG.
- [ ] It fires once per power-out, not every frame.
- [ ] The sound is listed in `public/audio/audio-manifest.json` and `CREDITS.md`.
- [ ] Tests written first: battery at 0 triggers the event exactly once.

### #66 Rover mission: check the rover really drove far and the crew is not overworked

**Importance:** Medium · **Difficulty:** S · **Labels:** bug, sim · https://github.com/YYN192/impossible-solution/issues/66

Main fixes done (live cost, no-sample result, tests). Left: a team decision on whether samples should tire the crew.

**Sub-tasks:**

- [x] A run where the rover never leaves the base area cannot score a sample.
- [x] Driving back without a sample ends the mission as "no sample" with a kid-friendly explanation.
- [ ] Each extra sample shows its energy cost up front; a tired astronaut is the clear result of the player's choice.
- [ ] Engine tests in `src/sim/` written first for distance, no-sample and tiredness cases.
- [x] `node scripts/qa/campaigns.mjs` still passes.
- [x] **A rover that never leaves the base cannot score.** Samples are only placed at least 3 battery steps from the base and only count when the rover drives onto them. A test checks 29 seeds.
- [x] **Driving back without a sample is a no-sample result** with a kid sentence: "The rover drove out but came home with no samples." (`domino.roverEmpty`, EN and BG). Staying at the base still says "stayed at the base".
- [x] **Cost up front.** The rover screen shows "This drive costs N power so far.", live, and it is the same number the engine charges (tested). After 2 samples it says "The lab can test 2 samples. More give no extra science."
- [ ] **Tired astronaut.** The drive itself never makes anyone tired: it costs power, and if the rover is stranded, extra dose. Tiredness comes from the plan jobs. If we want each extra sample to cost crew energy, that is a design change to `driveAction` and the balance tests. Leaving this open for the team to decide.

### #76 South Pole Outpost still says Mars and sol (text, hub art, ambience)

**Importance:** Medium · **Difficulty:** M · **Labels:** ui, copy · https://github.com/YYN192/impossible-solution/issues/76

Moon wording done (Artemis Outpost, no Mars/sol, test). Left: Moon hub art (Earth in the window) and a Moon ambience loop.

**Sub-tasks:**

- [x] `_moon` variants through `tRun(..., place)`:
  - "Explore your Moon base."
  - "First morning on the Moon."
  - "Dark skies tomorrow. The Sun hides behind a ridge for 1 more day."
  - "Day 3"
- [x] Name the Moon station "Artemis Outpost" (EN and BG).
- [ ] Moon hub art: Earth in the window, no Mars globe (pxl swap).
- [ ] A quiet Moon ambience loop, or a neutral one.
- [x] Test: no visible "Mars" or "sol" on any screen of a moon run, EN and BG.

### #65 End-of-day wrap-up: pop-ups and animation for the important data

**Importance:** Medium · **Difficulty:** M · **Labels:** enhancement, ui · https://github.com/YYN192/impossible-solution/issues/65

Celebrate by result, chain one link at a time, "Next time" tip, count-up pop-ups.

**Sub-tasks:**

- [ ] Each important change on the wrap-up appears one after another with a pop-up and a count-up.
- [ ] Bad results flash or shake in the warning color; good ones get a sparkle; the meaning is also clear without color.
- [ ] A Skip/Next press shows everything at once.
- [ ] `prefers-reduced-motion` turns off flashing and shaking.
- [ ] No flashing faster than 3 times per second (photosensitivity).
- [ ] Tests first for the order in which changes are revealed.
- [ ] **Celebrate by result.** The heading is "Mission over" at both 1 and 3 stars. Use "Your crew made it!" or "Let's see what went wrong", depending on the stars (A13, A28).
- [ ] **Teach the chain step by step.** Chains show every link at once with a 250 ms stagger and no length cap (`buildRows.ts`; 9–12 links, then "Show 3 more"). Show at most 3 links, a "Show the next link" button and "Replay the chain" (A14, A34).
- [ ] Replace "(missed)" with one concrete "Next time: clean the panels on sol 1. Clean panels make power." (A27).
- [ ] When a warning sound plays at the end of a sol, show it as a short pop-up line (see #74).

### #62 Soundtrack: different music for each part of the game

**Importance:** Medium · **Difficulty:** M · **Labels:** enhancement · https://github.com/YYN192/impossible-solution/issues/62

Quick part (S): duck music under text, pause in hidden tabs, fades. Full part (L): one track per game state.

**Sub-tasks:**

- [ ] Each of the listed parts has its own loop, and tracks cross-fade (no hard cuts).
- [ ] The sound toggle mutes music too, and the choice is remembered.
- [ ] Music starts only after the first user interaction (browser autoplay rules).
- [ ] All tracks listed in `public/audio/audio-manifest.json` and `CREDITS.md` with their license.
- [ ] Total added audio under ~3 MB; tests for which track plays on which screen.
- [ ] **Ducking:** lower the music to about 30 % over 300 ms while a `<dialog>`, beat or report text is open (C8).
- [ ] **Pause when the tab is hidden:** `document.addEventListener("visibilitychange", () => ctx.suspend()/resume())`. Today music keeps looping in a background tab (C30).
- [ ] **Fades:** 400 ms gain ramps. Music is hard-stopped at lines 178 and 217 and restarts from zero on every screen change (C7).
- [ ] **One music mood per state:** calm base, focused planning, a tense but quiet storm loop, and victory (C9, C23). There is no Moon track, so the Moon hub plays Mars ambience (`musicFor`).
- [ ] **First-start sound prompt:** "Sound? On / Off. Headphones help." It doubles as the audio unlock (C12). Volume controls also belong in the game screens, not only the menu.

### #77 Comfort settings: calm mode, high contrast, text size, in-game settings, mini-game pause

**Importance:** Medium · **Difficulty:** L · **Labels:** accessibility, enhancement · https://github.com/YYN192/impossible-solution/issues/77

Calm mode, high contrast, text size, settings on every screen, mini-game pause.

**Sub-tasks:**

- [ ] A Settings button in every screen header (not only the menu).
- [ ] **Calm mode** (`html[data-calm]`): no dust-blow, no storm-pulse, no shake, softer alarm.
- [ ] **High contrast**: lift muted text, no dust veil.
- [ ] **Text size**: 100 / 125 / 150 %.
- [ ] **Quiet class**: all sound off in one tap. Plus a first-start line: "Sound? On / Off. Headphones help."
- [ ] Mini-games:
  - The clock starts on the first tap.
  - A Pause button.
  - "Skip mini-games" in Settings.
  - A slow mode (`TICK_MS` × 2).
  - "Great job!" becomes a 1 s toast.
- [ ] Save every setting in localStorage (wrapped in try/catch).

## Low

### #58 For teachers: unlock all missions with a teacher key

**Importance:** Low · **Difficulty:** S · **Labels:** enhancement · https://github.com/YYN192/impossible-solution/issues/58

Teacher key. ?teacher=1 already unlocks everything; this is a friendlier UI for it.

**Sub-tasks:**

- [ ] "For teachers" opens a screen with a key field, an Unlock button and a short note on what it does (EN + BG).
- [ ] A correct key unlocks all missions and shows a confirmation; a wrong key shows a friendly error.
- [ ] The unlock is saved locally and can be undone ("Lock again").
- [ ] The key is not shown in the UI; document where teachers get it in `docs/`.
- [ ] Tests first for key checking and the unlock state.

### #55 Mission console: pulsing glow on the raised edge around it

**Importance:** Low · **Difficulty:** S · **Labels:** enhancement, ui · https://github.com/YYN192/impossible-solution/issues/55

Pulsing glow on the console edge. The owner called glows tacky today, so consider closing this.

**Sub-tasks:**

- [ ] The raised edge around the mission console pulses on the base screen.
- [ ] The pulse stops (or turns static) while a mission is already running, and with `prefers-reduced-motion`.
- [ ] The glow color comes from the palette and passes contrast with the floor.
- [ ] Looks right at 390 px, 1440 px and 1920 px wide.

### #52 Base walk: dust puffs while walking and a bouncy idle animation

**Importance:** Low · **Difficulty:** S · **Labels:** enhancement, ui · https://github.com/YYN192/impossible-solution/issues/52

Walking dust puffs and an idle bounce (cosmetic).

**Sub-tasks:**

- [ ] Walking in any direction leaves short-lived dust puffs behind the astronaut; standing still makes none.
- [ ] After ~0.5 s without input the idle bounce plays; it stops instantly when the player moves.
- [ ] Both effects use the pixel palette (`src/assets/pixel/palette.json`), no emoji.
- [ ] No frame-rate drop or movement stutter on a mid laptop (keep the existing stutter fix).
- [ ] Effects are skipped when `prefers-reduced-motion` is set.
- [ ] Unit tests for the puff/idle state logic written first.

### #61 Click or drag the mouse to make the astronaut walk there

**Importance:** Low · **Difficulty:** M · **Labels:** accessibility, enhancement · https://github.com/YYN192/impossible-solution/issues/61

Tap/click-to-walk already exists; this adds press-and-drag follow.

**Sub-tasks:**

- [ ] Press-and-drag on the base: the astronaut follows the pointer at normal walking speed, stopping at walls and objects.
- [ ] A single click/tap walks to that spot and stops.
- [ ] Keyboard movement still works and takes over at once when a key is pressed.
- [ ] Clicking a button or an object you can use does not also move the astronaut.
- [ ] Works with touch on a phone.
- [ ] Tests first for the follow/target logic.

### #60 Engineering console: live space weather ticker from DONKI, 8-bit style

**Importance:** Low · **Difficulty:** M · **Labels:** enhancement, data · https://github.com/YYN192/impossible-solution/issues/60

Live DONKI ticker on the engineering console (data layer and snapshots already exist).

**Sub-tasks:**

- [ ] Interacting with the engineering console opens the space weather strip.
- [ ] Data comes from the DONKI API for the last 7 days through the existing cached HTTP layer (`src/data/http.ts`), within the rate limit.
- [ ] Each row shows the event type with a pixel icon and a count; hovering or tapping a mark shows date and size in kid words (EN + BG).
- [ ] When offline or the API fails, a saved snapshot is shown and labelled "saved data".
- [ ] Never claims a live event hit Mars unless DONKI says so (same rule as #8).
- [ ] Tests first for parsing DONKI responses into rows.

### #57 NPCs explain themselves with typed-out subtitles (lore + mission)

**Importance:** Low · **Difficulty:** M · **Labels:** enhancement, copy · https://github.com/YYN192/impossible-solution/issues/57

Typed-out NPC subtitles with lore and mission hints.

**Sub-tasks:**

- [ ] Interacting with an NPC opens a subtitle box with a typewriter effect; pressing interact once finishes the line, again goes to the next.
- [ ] Every NPC has at least 2 lore lines and 1 mission hint, in EN and BG, inside the kid copy limits (12 words EN / 14 words BG per sentence).
- [ ] The hint changes with the current mission.
- [ ] Text is readable at 390 px wide and does not cover the player.
- [ ] `prefers-reduced-motion` shows the full line at once.
- [ ] Tests first for the line sequencing and the copy tests.

### #54 Station airlock should do something useful (e.g. a map of Mars)

**Importance:** Low · **Difficulty:** M · **Labels:** enhancement, ui · https://github.com/YYN192/impossible-solution/issues/54

Airlock now opens the dust-storm panel task. Decide whether it also needs a map when there is no storm.

**Sub-tasks:**

- [ ] Interacting at the airlock opens a screen or panel; it closes with Esc, the X button and the interact key.
- [ ] The chosen feature is agreed in this issue before building.
- [ ] If it is the map: each mission site shows its state, and its names come from i18n in EN and BG.
- [ ] Works with mouse, touch and keyboard.
- [ ] Tests written first for the open/close logic and site states.

## Tracking

### #78 Kid-design research and audit of every mission (15 Nov): tracking

**Importance:** — · **Difficulty:** — · **Labels:** accessibility, ui · https://github.com/YYN192/impossible-solution/issues/78

Tracking issue for the kid-design research and audits. Links #73–#77 and the comments.

_No checklist in the issue._

