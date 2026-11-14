# Mars UI prototype

**Status:** visual and navigation prototype; mission integration is pending. This flow currently uses a mock planner and is not the completed game loop.

## What the prototype includes

- A title menu with Play, Settings, and Quit actions. The settings slider remembers its value in local storage.
- A walkable, top-down Mars station hub with keyboard movement, simple collision, a mission console interaction, and session-only player-position retention.
- A console frame around a crew-planning screen with three crew members, five job choices, resource previews, and a plan lock/edit state.
- Responsive styles, keyboard focus indicators, and reduced-motion handling.
- A pixel-art astronaut placeholder and a reusable asset catalogue for the project's pixel-art sprites.

The menu, hub, and console are separate Vite HTML entry pages. The menu is the default `index.html` entry. The prototype does not remove the existing NASA data and simulation source files on `main`, but the menu-to-console flow does not yet call them.

## Current limits

- Planner resources, storm and morning details, crew state, job effects, and domino illustration are mock values. The screen does not run the simulation engine.
- Locking the plan changes only the UI state; there is no end-of-sol screen or three-sol progression in this flow.
- Ask Earth is not gated by the actual crew plan and does not display a live or snapshot forecast.
- The hub map and collisions are hand-coded placeholders; dialogue, animation, touch controls, and game audio are not implemented.
- The volume setting is stored but cannot change audio yet.
- The planner keeps its dashboard styling inside a pixel-art console frame.

See [MARS_UI_INTEGRATION_TODO.md](MARS_UI_INTEGRATION_TODO.md) for the remaining integration and verification work.

## Verification

- `npm run build` passed for this prototype checkout.
- `npm run lint` passed.
- `npm test` exited successfully with no test files found in this checkout. The current `main` branch has its own test suite; rerun it after applying this UI to that branch.
- The menu → hub → walk to console → planner → return to hub flow was checked in a browser earlier; player position was preserved on return.
