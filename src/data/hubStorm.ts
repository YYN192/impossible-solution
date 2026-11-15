/**
 * The dust storm that can hit the base. It is always one of two REAL Mars dust storms, and the
 * kid has to go out and wipe the solar panels and fix the greenhouse before the console opens.
 *
 * - Dust Season: on the first sol of each of its real dust storms (the campaign's own events).
 * - Other Mars missions: maybe one storm, on a sol picked by the run's seed (same run number =
 *   same storm). Never on the Moon (no air, so no dust storms) and never in the ?demo=1 recording.
 * Pure. The repairs go through the engine's act(), so their costs show up as dominoes.
 */
import { rng, pick } from "../sim/rng";
import { DOSE, type Action, type GameState } from "../sim/types";
import type { MissionSetup } from "./mission";
import { OPPORTUNITY_2018 } from "./campaigns";
import { INSIGHT_DUST } from "./sources";

export interface HubStorm {
  /** Which real storm it is like: the i18n key under hubStorm.real.* */
  real: "opportunity2018" | "insight2022";
  source: Action["source"];
}

const REAL: Record<HubStorm["real"], HubStorm> = {
  opportunity2018: { real: "opportunity2018", source: OPPORTUNITY_2018 },
  insight2022: { real: "insight2022", source: INSIGHT_DUST },
};
/** Game number: about 2 runs in 3 meet a dust storm. */
export const STORM_CHANCE = 0.65;

export function hubStormFor(setup: Pick<MissionSetup, "place" | "seed" | "events" | "rules" | "campaignId"> | undefined, sol: number, demo = false): HubStorm | undefined {
  if (!setup || demo || setup.place === "moon") return undefined;
  const dust = setup.events.filter((e) => e.kind === "dustStorm");
  if (dust.length) {
    const first = dust.find((e) => e.sol === sol && !dust.some((d) => d.id === e.id && d.sol === sol - 1));
    return first ? (first.id?.startsWith("Opportunity") ? REAL.opportunity2018 : REAL.insight2022) : undefined;
  }
  const sols = setup.rules.sols ?? 3;
  if (sols < 2) return undefined;
  const next = rng(setup.seed ^ 0x5d0c7);
  if (next() >= STORM_CHANCE) return undefined;
  const day = 2 + Math.floor(next() * (sols - 1));
  return day === sol ? pick(next, [REAL.opportunity2018, REAL.insight2022]) : undefined;
}

/** Going outside in the storm: clean panels, but the crew gets a little extra radiation. */
export const panelsAction = (storm: HubStorm): Action => ({
  id: "storm-panels", icon: "🧽☀️", textKey: "domino.stormPanels", source: storm.source,
  effect: { panelEfficiency: 1, dose: DOSE.outsideExtra },
});
/** Fixing the greenhouse uses 1 power when there is any (a repair must never get stuck at 0). */
export const greenhouseAction = (state: GameState): Action => ({
  id: "storm-greenhouse", icon: "🌱🔧", textKey: "domino.stormGreenhouse",
  effect: state.bars.power >= 1 ? { power: -1 } : {},
});
/** Done = the engine already holds the domino of that repair for this sol (survives a reload). */
export const repaired = (state: GameState, action: "storm-panels" | "storm-greenhouse") =>
  state.dominoes.some((d) => d.id === `sol${state.sol}-${action}`);
