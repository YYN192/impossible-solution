import type { GameState, Plan } from "../sim/types";

/** Fixed saved-scenario start: low reserves and panels already dusty after the Mars weather. */
export const DEMO_START = {
  food: 0,
  panelEfficiency: 0.5,
} as const satisfies Pick<GameState, "food" | "panelEfficiency">;

/**
 * Recording path for `?demo=1`.
 *
 * The URL still leaves the game interactive; this exported plan is the stable path that video
 * tooling and integration tests can follow. It demonstrates the mission's central causal chain:
 * skipped panels (sol 1) -> low power (sol 2) -> greenhouse cannot be sustained -> tired crew
 * member (sol 3). Keep this free of clocks, randomness, and network data.
 */
export const DEMO_PLANS = [
  { a1: "greenhouse", a2: "shelter", a3: "askEarth" },
  { a1: "greenhouse", a2: "shelter", a3: "askEarth" },
  { a2: "panels", a3: "greenhouse" },
] as const satisfies readonly Plan[];

/** Cause-first IDs for the story the recording path must produce. */
export const DEMO_CHAIN_IDS = [
  "sol1-panels-skipped",
  "sol2-power-low",
  "sol2-greenhouse-skipped",
  "sol2-food-empty",
  "sol3-crew-tired",
] as const;

/** Stable boundary for any current or future plan screen that wants the recording path. */
export function demoPlanForSol(sol: number): Plan {
  return DEMO_PLANS[sol - 1] ?? {};
}
