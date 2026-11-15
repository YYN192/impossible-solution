# Show, don't tell: every screen (#64)

Kids aged 7–12 learn by seeing and doing, not by reading. This list goes through every screen in the game, what it still explains in text, and what shows it instead. It follows the team's kid-design research ([A: learning and guidance](kid-design-research/A-learning-and-guidance.md)) and the four mission audits in [`kid-design-research/`](kid-design-research/).

**Status:** ✅ shown, not told · 🟡 partly · ⬜ still mostly text (next step named).

## First-play guide

On the first play, a glowing frame sits on the one thing to touch next, with one sentence beside it (`src/components/GuideLayer.tsx`, rules in `src/game/guide.ts`).

- **It never blocks:** it has no buttons of its own, and every tap goes through it.
- **It hides while a dialog is open:** a mini-game, crew talk, an alarm, Settings or Data Sources.
- **It covers one whole sol:** Start mission → walk to the console → the goal with the 3 stars → drive the rover or choose → astronaut → job → End sol → the report. Then it switches itself off.
- **It runs on the first play only:** it is saved on the device as `sol:guide`, and is off in the recorded demo (`?demo=1`).
- **"? How to play"** in the top bar hides the tips, or replays the guide from the sol the player is on.

## Screens

| Screen | What it explains in text | What shows it instead | Status |
|---|---|---|---|
| **Start screen** (mission cards) | Mission name, place, length, difficulty, a one-line hook; locked missions say what to finish first. | Card art per mission; a lock icon; the selected card is framed; one big **Start mission**; the guide points at it on the first play. | ✅ |
| **Base (hub)** | "Walk to the glowing console to plan your mission." and "Meet your crew." | Cyan = "you can use this": the console bay frame pulses, crew have talk bubbles, a "you" chevron is over the player, Interact lights up only when something is near; the guide points at the game. | ✅ |
| **Crew talk** | Lines typed out one at a time, with an answer menu. | Each crew member's practice is the real mini-game (jobs, power, grow, shelter). | ✅ |
| **Airlock map** (#54) | One lead line. | The planets with site markers; each site's state is an icon (base, flag, sample, rock) and a word. | ✅ |
| **Radar** (#60) and **Engineering bay** | One lead line; size in kid words. | Pixel rows and marks per event; bars for the NASA numbers. | ✅ |
| **Dust storm alarm** | The alarm names the real storm it is like. | Full-screen dust, the "!" marks over the jobs to do, the to-do list with icons; the jobs themselves are hands-on (wipe 6 panels, 3 greenhouse steps). | ✅ |
| **Morning** | What happened overnight, why (behind "Why?"), the Earth radio, the weather. | Meter changes are coloured (+ green, − red) with a change band; a calm night shows a check; the **Space watch** strip warns before a space-ray storm (#64); the guide shows **the goal: 3 stars as icons** before the first action. | ✅ |
| **Beat: rover drive** | Battery, samples, the cost of each step. | Drive it yourself on the real NASA map; the battery is pips, the samples are icons, and the rover shakes when the battery runs out. | 🟡 The cost rules are still a text line (audit storm 3: icon legend behind a "?"). |
| **Beats: upgrade, radio, cold night, dust** (mission 1, #59) | One lead line and one hint. | Drag the part onto the base; hold Send and watch the message fly while the clock counts the real delay; turn the heater dial; rub the dust off. The real cost of what you do updates as you go. | ✅ |
| **Other beats** (dilemmas, the Moon, the Dust Season site) | One line per card. | Cards with icons and cost chips (+/−), the cyan frame on cards you can pick, grey cards you can't afford; every choice ends with a result line that says what changed (#64). | 🟡 Cards, not actions. Next: reuse the hands-on moments where they fit (Dust Season already wipes, #98). |
| **Plan** | "Choose an astronaut. Then choose a job.", the job text and its cost. | The next astronaut is highlighted, jobs stay locked until one is picked, focus moves on by itself; meters show safe zones and the power equation (+sun − jobs − night); sols 1–2 show 3 jobs, and the others come with "New!"; the guide points at astronaut → job → End sol. | ✅ |
| **Job mini-games** | One title line and the key hints. | The job itself, played (wipe, water, stack, aim, catch); it waits for the first press and has Pause and Slow. | ✅ |
| **End of sol** | What changed and why. | The day's changes pop in one by one with coloured +/− (#65); the cause chain is drawn as dominoes. | ✅ |
| **Final** | The stars and the cause chain ("because…"). | 1–3 star icons with the 3 goals ticked or missed; the domino chain from first cause to result; one gold **Try a different plan**. | ✅ |
| **Data Sources** (for grown-ups) | Every real number with its source. | Text on purpose: it is the grown-up page. Pictures and live/saved badges where they help. | ✅ (text on purpose) |
| **For teachers** | How to use it in class; the teacher code. | Text on purpose (grown-ups). | ✅ (text on purpose) |
| **Settings** | Labels for each setting. | Switches and sliders; changes show at once (calm, contrast, text size). | ✅ |

## Still open

- **Rover screen:** turn the cost rules into an icon legend behind a "?" (audit storm 3, #59).
- **Other campaigns' beats:** make them hands-on where it fits (see "Other beats" above).
- **Playtest:** the issue asks for a new player to finish mission 1 without reading more than one sentence per step. This still needs a kid or a teammate who has never played it.
