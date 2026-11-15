# Sound library

63 original 8-bit sounds for the game: 60 one-shot effects and 3 ambience loops. They live in `public/audio/<category>/<id>.wav`, and `public/audio/audio-manifest.json` lists every file with its trigger and default volume. The 3 ambience loops also ship as AAC `.m4a` (manifest field `web`, 5.1 MB → 0.54 MB), which the game plays instead of the WAV. `src/game/audio.ts` plays them (see Integration).

All sounds are made by our own code in `scripts/generate-audio.mjs` using square, triangle and sine oscillators, a noise channel, envelopes and gentle filters. No samples, recordings or third-party audio are used, and the sounds are not NASA recordings. Licence: Apache-2.0, like the rest of the project.

## Commands

| Command | What it does |
| --- | --- |
| `node scripts/generate-audio.mjs` | Remakes every WAV, the ambience `.m4a` copies (needs `ffmpeg` on PATH; without it the manifest has no `web` field and the game falls back to WAV) and the manifest (about 3 s). Output is deterministic: same code, byte-identical files. |
| `node scripts/verify-audio.mjs` | Reads every file back and checks format, duration, peak and average level, clipping, silent edges, seamless loops, and that every file from the brief exists. Exit code 1 on any problem. |
| `npm test` | Includes `scripts/audio-assets.test.ts`: the manifest matches the files, every file is valid 16-bit 44.1 kHz WAV, and the game's existing sound IDs have files. |
| `npm run dev`, then open `/impossible-solution/scripts/audio-preview.html` | Development-only preview: every sound by category, play/stop, loop stop, a volume slider. It lives in `scripts/` and is not part of the game build. |

## Format and levels

- WAV, PCM 16-bit, 44.1 kHz. Mono, except `space-menu-ambience` (stereo, slowly shimmering pad).
- Effects peak between −4 and −10 dBFS, with average loudness capped at −13 dBFS, so square-wave cues are no louder than the rest. Footsteps are much quieter (about −26 dBFS average).
- Ambience loops peak at −13 to −15 dBFS, well under the effects. They are built from whole wave cycles and repeating noise, so the end joins the start with no click.
- Every one-shot starts and ends at silence. No file clips.

## Integration

`src/game/audio.ts` imports the manifest and maps every id and alias to its file (`BASE_URL` + path; `web` copy when present). Playback uses the Web Audio API:

- One `AudioContext`, created on the player's first tap or key press (never before, so nothing autoplays). The same gesture preloads a small UI set (menu, steps, console, crew select/assign; about 150 KB). Every other sound is fetched the first time it plays and its decoded `AudioBuffer` is cached, so rapid sounds such as footsteps reuse one buffer instead of creating audio elements.
- Gain chain: per-sound manifest `volume` → Sound effects / Music bus → Master → speakers. The Settings sliders and the Sound on/off button (status bar, `aria-pressed`) set these gains; preferences persist in `localStorage` (`sol:audio`).
- **Music is off by default** (Music slider 0%). The hub and console ambience loops are only downloaded once a player raises it.
- The same id is never stacked: at most one play per 70 ms (150 ms for `volume-change`). A one-shot that arrives more than 400 ms late on a slow network is skipped.
- jsdom has no Web Audio, so in tests every call is a no-op. `scripts/audio-assets.test.ts` checks that every quoted id inside `audio.playSfx`/`playMusic` in `src/` exists in the manifest.

Existing game IDs (aliases in the manifest):

| Game ID (in code) | Sound | Called from |
| --- | --- | --- |
| `menu` | `menu-select` | `MainMenu.tsx`, Start mission |
| `step` | `player-step-metal-1` | `MarsHub.tsx`, walking |
| `console` | `console-activate` | `MarsHub.tsx`, interacting with the console |
| `door` | `door-open` | `MarsHub.tsx`, interacting with a door |
| `npc` | `npc-confirm` | `MarsHub.tsx`, talking to a crew member |
| `dialogue` | `npc-dialogue` | `MarsHub.tsx`, next dialogue page |
| `select` | `astronaut-select` | `PlanScreen.tsx`, choosing a crew member |
| `assign` | `job-assign` | `PlanScreen.tsx`, giving a job |
| `resolve` | `plan-confirm` | `PlanScreen.tsx`, ending the sol |

Sounds called by their manifest id:

| Moment | Sound | Where |
| --- | --- | --- |
| Pointer moves onto a menu button | `menu-hover` | `MainMenu.tsx` |
| Settings / Data Sources / For teachers open | `menu-open` | `MainMenu.tsx`, `App.tsx` |
| Back, close, Quit, ← Menu, close dialogue, Home | `menu-back` | `MainMenu.tsx`, `App.tsx`, `MarsHub.tsx`, `FinalScreen.tsx` |
| Volume slider moves | `volume-change` | `MainMenu.tsx` |
| Sound off / on | `mute` / `unmute` | `audio.mute` (status-bar toggle, Settings) |
| EN / BG toggle | `console-button` | `LanguageToggle.tsx` |
| Walking (alternating) | `player-step-metal-1` / `-2` | `step` in `audio.ts` |
| Hub ambience (only if Music > 0) | `mars-base-ambience`; on the Moon `moon-base-ambience` (an alias of `space-menu-ambience`) | `MarsHub.tsx` |
| Console opens | `console-boot` + `mission-console-ambience` | `ConsolePage.tsx` |
| Return to base | `console-close` | `ConsolePage.tsx` |
| Unassign a crew member | `job-remove` | `PlanScreen.tsx` |
| Ask Earth chosen | `earth-message-send` | `PlanScreen.tsx` |
| End-of-sol screen | `sol-end`, then the worst bar: `resource-critical` / `air-warning` / `power-decrease` / `radiation-increase`, or `resource-stable` | `EndOfSolScreen.tsx` |
| Next morning | `next-sol` | `EndOfSolScreen.tsx` |
| Morning report (sol 2+) | `morning-report` | `MorningScreen.tsx` |
| Storm / particle burst / Earth's answer in the report | `storm-warning` / `particle-burst` / `earth-message-receive` | `MorningScreen.tsx` |
| Each step of the final domino fall (synced with the CSS fall; none with reduced motion) | `domino-fall` | `FinalScreen.tsx` |
| Outcome after the chain | `mission-success` (2–3 stars, full mission) / `mission-failure` | `FinalScreen.tsx` |
| Try a different plan | `replay-start` | `FinalScreen.tsx` |

Every other sound's intended trigger is in its manifest entry (`trigger`) and on the preview page.

## Soundtrack slots (add your own music here)

The game asks for music by slot. Each slot tries the ids below in order and plays the first one that is in `public/audio/audio-manifest.json`, so a new track needs no code change: put the file in `public/audio/music/`, add a manifest entry with that id (`"loop": true`, a `web` `.m4a` copy for size), and it plays.

| Slot | Where it plays | Ids tried, in order |
| --- | --- | --- |
| Lobby | main menu | `music-lobby`, then `space-menu-ambience` |
| Station | the walkable base | `music-hub`, then `mars-base-ambience`; Moon: `music-hub-moon`, then `moon-base-ambience` |
| Console | mission screens | `music-mission-storm` / `music-mission-dust` / `music-mission-moon` (the mission being played), then `music-console`, then `mission-console-ambience` |

Music volume is 0 until the player raises it in Settings, and nothing plays before the first tap. Credit every new track in `CREDITS.md` (author, licence) and log any AI tool in `docs/ai-usage-log.md`.

