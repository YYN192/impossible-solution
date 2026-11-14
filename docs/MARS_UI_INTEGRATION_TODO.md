# Mars UI prototype: follow-up work

This checklist tracks the remaining work after landing the visual prototype. The menu, walkable hub, and planning-console screen are currently a UI experiment; the console still uses mock mission data. The existing NASA data layer and simulation engine on `main` remain the source of truth for integration.

## Connect the UI to the mission

- [ ] Replace the prototype planner's mock resources, crew state, job effects, and domino preview with the real mission state and simulation engine.
- [ ] Route the menu's Play action through the existing mission setup/loading flow, including `?demo=1`, `?offline=1`, and `?sun=today` behavior.
- [ ] Show the real NASA data status, notices, source chips, and source details in the relevant UI screens.
- [ ] Make the morning report use `pickMorning`; reveal Earth forecast details only after the crew completes Ask Earth.
- [ ] Run the engine at end of each sol and display its actual results across all three sols.
- [ ] Build the final domino chain from engine cause records so every displayed cause points to an actual earlier effect.
- [ ] Preserve the existing Data Sources page and its factual explanations in the new navigation.

## Finish the game flow

- [ ] Decide whether to keep the prototype's three HTML entry pages or bring the menu, hub, and console into the existing single-app navigation.
- [ ] Add a reliable return path from the console to the hub without losing mission or player state.
- [ ] Replace temporary hub geometry and the placeholder drone interaction with the approved pixel-art room, collision map, NPC dialogue, and sprite animation assets.
- [ ] Make settings meaningful: connect volume to audio when audio is added, and keep settings persistence intentional.
- [ ] Add touch controls and verify keyboard controls, focus order, reduced-motion behavior, and small-screen layouts.

## Verify before calling integration complete

- [ ] Add or update tests for menu-to-mission navigation, NASA data presentation, Ask Earth gating, sol resolution, and final domino causality.
- [ ] Run `npm run build`, `npm run lint`, and `npm test` on the integrated `main` tree.
- [ ] Check live, snapshot/offline, demo, and today's-Sun flows, plus browser refresh and direct links to each UI entry page.
- [ ] Review all game copy and game-number values with the team; keep real NASA facts distinct from invented balancing values.
- [ ] Update `docs/ui-prototype.md`, `CREDITS.md`, and `docs/ai-usage-log.md` when the prototype is integrated or materially changed.

## Known prototype limits

- The planner starts from static mock values and does not advance a real sol.
- Its domino illustration is decorative and its current highlight logic is reversed for the displayed cause chain.
- Storm/morning report values are placeholders; there is no NASA request or provenance in the planner itself.
- Crew tiredness, multi-sol progression, final results, and save/resume are not implemented in this UI flow.
- The hub uses a temporary hand-coded layout and generated astronaut placeholder; its interactions are not connected to mission state.
- The settings slider persists a value but has no audio playback to control.
