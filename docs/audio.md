# Sound library

63 original 8-bit sounds for the game: 60 one-shot effects and 3 ambience loops. They live in `public/audio/<category>/<id>.wav`, and `public/audio/audio-manifest.json` lists every file with its trigger and default volume. Nothing is wired into the game yet: `src/game/audio.ts` stays silent until the files are registered (see Integration).

All sounds are made by our own code in `scripts/generate-audio.mjs` using square, triangle and sine oscillators, a noise channel, envelopes and gentle filters. No samples, recordings or third-party audio are used, and the sounds are not NASA recordings. Licence: Apache-2.0, like the rest of the project.

## Commands

| Command | What it does |
| --- | --- |
| `node scripts/generate-audio.mjs` | Remakes every WAV and the manifest (about 2 s). Output is deterministic: same code, byte-identical files. |
| `node scripts/verify-audio.mjs` | Reads every file back and checks format, duration, peak and average level, clipping, silent edges, seamless loops, and that every file from the brief exists. Exit code 1 on any problem. |
| `npm test` | Includes `scripts/audio-assets.test.ts`: the manifest matches the files, every file is valid 16-bit 44.1 kHz WAV, and the game's existing sound IDs have files. |
| `npm run dev`, then open `/impossible-solution/audio-preview.html` | Development-only preview: every sound by category, play/stop, loop stop, a volume slider. It is not part of the game build. |

## Format and levels

- WAV, PCM 16-bit, 44.1 kHz. Mono, except `space-menu-ambience` (stereo, slowly shimmering pad).
- Effects peak between −4 and −10 dBFS, with average loudness capped at −13 dBFS, so square-wave cues are no louder than the rest. Footsteps are much quieter (about −26 dBFS average).
- Ambience loops peak at −13 to −15 dBFS, well under the effects. They are built from whole wave cycles and repeating noise, so the end joins the start with no click.
- Every one-shot starts and ends at silence. No file clips.

## Integration

Register every file (and its aliases) with the existing audio module once at startup. Paths in the manifest start at the site root, so prefix them with Vite's base URL:

```ts
import manifest from "../../public/audio/audio-manifest.json";
import { audio } from "./audio";

const base = import.meta.env.BASE_URL; // "/impossible-solution/"
for (const s of manifest.sounds) {
  const url = base + s.path.slice(1);
  audio.register(s.id, url);
  for (const alias of s.aliases ?? []) audio.register(alias, url);
}
```

The game already calls `audio.playSfx` with these IDs. They are aliases in the manifest, so they work as soon as the files are registered:

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

Every other sound's intended trigger is in its manifest entry (`trigger`) and on the preview page.

### Things to handle when wiring them in

- **Per-sound volume:** `audio.ts` does not use the manifest's `volume` yet. Multiply it in when playing.
- **Dialogue blips:** play `npc-dialogue` at most once every ~70 ms, never once per letter.
- **Footsteps:** alternate `player-step-metal-1` and `-2`. `MarsHub.tsx` already limits steps to one per 330 ms.
- **Volume slider:** play `volume-change` at most a few times per second while dragging.
- **Ambience:** play the loops through `audio.playMusic` (it loops and uses the Music volume). Never autoplay. Start `space-menu-ambience` only after the player's first click, as browsers require.
- **Mute:** play `mute` just before muting and `unmute` just after unmuting, so both are heard.
