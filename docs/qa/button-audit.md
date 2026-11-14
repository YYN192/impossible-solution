# Button and control audit

Verdicts: keep, fix (done in this PR unless noted), replace, remove. "Useless or illogical" means: does nothing visible, duplicates another control, or cannot work in a browser tab.

## Every screen (status bar)

| Label key | What it does | Verdict | Reason |
|---|---|---|---|
| `lang.en` / `lang.bg` | Switches language, sets `<html lang>` | keep | Needed for the BG toggle; pressed state is shown. |
| `sound.toggle` | Mutes or unmutes everything | keep | Quick mute. Overlaps the Settings mute button on purpose: one is always one tap away. |
| `dataSources.open` | Opens Data Sources | keep | Required by the challenge (datasets listed in the tool). Hidden on the menu, which has its own copy. |
| `teacher.open` | Opens the teacher card | keep | Classroom use. |

## Main menu

| Label key | What it does | Verdict | Reason |
|---|---|---|---|
| `menu.sunMay` / `menu.sunToday` | Picks which Sun mission to play | keep | Real choice, pressed state shown. The lead is rebuilding this into a mission picker. |
| `title.start` / `menu.resume` | Starts or resumes | keep | Main action. |
| `menu.settings` | Opens volume settings | keep | Sliders and mute. |
| `dataSources.open` | Opens Data Sources | keep | Status bar hides it on the menu, so this is not a duplicate. |
| `teacher.open` | Opens the teacher card | keep | Same. |
| `menu.quit` | Called `window.close()` | **remove (done)** | A script cannot close a tab the user opened, so it did nothing. Key `menu.quit`, `menu.closeTab` and the status line are deleted; a test guards it. |
| `help.whatsThis` (sol) | Explains "sol" | keep | Kid text rule: explain every term. |
| Settings: `menu.master/music/sfx`, `menu.mute`, `dataSources.back` | Volume, mute, back | keep | Work. |

## Station (hub)

| Label key | What it does | Verdict | Reason |
|---|---|---|---|
| `world.menu` | Back to the menu | keep | Escape hatch. |
| Canvas | Walk with WASD/arrows/tap | keep | Now has a text description (`world.description`). |
| `world.up/down/left/right` | Held d-pad | keep | Touch movement; held keys clear on blur/resize/rotate. |
| `world.interact` / `world.openConsole` | Talk to a crew member or open the console | keep | Disabled with a hint line when nothing is near. |
| `world.goConsole` | Skips the walk | keep | Needed for kids who do not want to walk, and for tests. Not a duplicate of Interact: it works from anywhere. |
| Dialogue `common.next`, `help.close` | Next page, close | keep | Close now returns focus to the canvas (it was lost to `<body>`). |

## Console: morning, plan, night, final

| Label key | What it does | Verdict | Reason |
|---|---|---|---|
| `world.return` | Back to the station | keep | Needed to leave the console. |
| `common.solOf` tag | "Sol 1 of 3" | **fix (done)** | Was shown three times on the console (tag, step bar, heading). The extra tag is removed; the step bar and heading stay. |
| `morning.goPlan` | Moves to planning | keep | Main action. |
| `crew.name` x3 | Selects an astronaut | keep | Disabled when tired, text explains why. |
| `play.clearCrew` x3 ("x") | Clears that astronaut's job | keep | The only undo. |
| `jobs.*` x5 | Gives the selected astronaut that job | **fix (done)** | Used to be disabled and silent before an astronaut was picked, so it looked broken. Now it answers "Pick an astronaut first." (`play.pickCrewFirst`). |
| `plan.endSol` / `play.confirmEnd` | Ends the sol (asks if crew are idle) | keep | Good guard against wasted workers. |
| `play.scienceBehind` (details) | Shows extra science | keep | Progressive detail. |
| `help.whatsThis` (power, air, dose, askEarth) | Tooltip | keep | Esc and "Got it" return focus to the "?". |
| `endSol.nextMorning` / `endSol.seeResults` | Next screen | keep | Main action. |
| `final.tryAgain`, `final.home` | Replay, back to start | keep | FinalScreen is being rebuilt by another agent; markup untouched, CSS only. |
| Source links (`chip.source`) | Open the NASA source | keep | Required attribution. Now 44 px tall and inside the chip. |

## Overlays

| Label key | What it does | Verdict | Reason |
|---|---|---|---|
| `dataSources.back`, `teacher.back` | Close the overlay | keep | Work. |
| Source links in Data Sources | Open NASA pages | keep | Long titles wrap; they are citations, so the "3 lines" rule skips them. |

## Not changed, worth a later look

- The menu's Data Sources and Teacher buttons and the status-bar copies show the same overlays by design (menu hides the status bar copies).
- `go-console` and the Interact button both can open the console. Different jobs (anywhere versus near it), so both stay.
