/**
 * Shared contract for the simulation. Everyone builds against this file.
 * Changes to names/shapes: agree in the team chat first (owner: Aleksandar).
 *
 * All numbers in JOBS are GAME NUMBERS (invented, tuned for play) unless `source` says otherwise.
 * Real anchors live in docs/concept.md → "NASA data that drives decisions".
 */

export type JobId =
  "panels" | "greenhouse" | "shelter" | "askEarth" | "science";
export type CrewId = "a1" | "a2" | "a3";

/** One sol's plan: which astronaut does which job. Unassigned astronauts are idle. */
export type Plan = Partial<Record<CrewId, JobId>>;

export interface Bars {
  /** 0–10 */
  power: number;
  /** 0–10 */
  air: number;
  /** Crew dose in game units, 0–10 (lower is better). Normal Mars day ≈ 1 unit. */
  dose: number;
}

export interface GameState {
  sol: number; // 1..MISSION_SOLS
  bars: Bars;
  food: number;
  science: number;
  /** 1 = clean panels, lower = dusty. Multiplies daily solar power. */
  panelEfficiency: number;
  /** Shelter protection still active (sols left). */
  shelterSols: number;
  /** Astronauts too tired to work this sol. */
  tired: CrewId[];
  /** Earth's answer to show in this morning's report, if any. */
  earthAnswer?: EarthAnswer;
  /** Every effect that happened so far, for the domino chain. */
  dominoes: Domino[];
  over: boolean;
}

/** A storm or other outside event on a given sol. Comes from the data layer (snapshot or live). */
export interface StormEvent {
  sol: number;
  kind: "particleBurst" | "stormCloud";
  /** Text key for the kid-facing caption, e.g. 'event.burst.may2024' */
  captionKey: string;
  /** Data provenance shown in Data Sources and on the chip. */
  source: DataRef;
}

export interface EarthAnswer {
  dustTomorrow: "clear" | "dusty";
  /** Sols until a storm cloud (CME) reaches Mars, if one is forecast. */
  stormCloudInSols?: number;
  source: DataRef;
}

export interface DataRef {
  label: string; // human words: "A Mars rover measured this storm on 20 May 2024"
  url: string;
  mode: "live" | "snapshot" | "constant";
  fetched?: string; // ISO date for snapshots/live
}

/** One link in the cause → effect chain. `causeIds` must point to real earlier dominoes. */
export interface Domino {
  id: string; // e.g. 'sol1-panels-skipped'
  sol: number;
  icon: string; // e.g. '🧽✗', '⚡↓'
  textKey: string; // i18n key
  causeIds: string[];
  source?: DataRef;
}

export interface StepResult {
  state: GameState;
  /** Dominoes created by this step (also appended to state.dominoes). */
  fell: Domino[];
}

/** The engine contract. Must be pure and deterministic: same input → same output. */
export type Step = (
  state: GameState,
  plan: Plan,
  events: StormEvent[],
) => StepResult;

export const MISSION_SOLS = 3;

/**
 * Causal table — THE game. Cost today / if done / if skipped.
 * Game numbers; tune them only with the brute-force tests green
 * (3-link chain exists, several 2–3★ plans exist, no plan is free).
 */
export const JOBS: Record<
  JobId,
  {
    outside: boolean;
    powerCost: number;
    ifDone: string;
    ifSkipped: string;
    source?: string;
  }
> = {
  panels: {
    outside: true,
    powerCost: 0,
    ifDone: "panelEfficiency back to 1",
    ifSkipped: "panelEfficiency × 0.65 tomorrow (≈ −35%)",
    source: "InSight 2022 dust storm: 425 → 275 Wh/sol (JPL)",
  },
  greenhouse: {
    outside: false,
    powerCost: 2,
    ifDone: "food +1",
    ifSkipped: "food −1; food 0 → one astronaut tired next sol",
  },
  shelter: {
    outside: false,
    powerCost: 1,
    ifDone: "dose halved today and tomorrow",
    ifSkipped: "no protection if a burst hits",
  },
  askEarth: {
    outside: false,
    powerCost: 1,
    ifDone: "tomorrow morning: dust forecast + storm-cloud forecast",
    ifSkipped: "plan blind",
    source: "DONKI WSA-Enlil Mars impact forecasts; light delay 3–22 min",
  },
  science: {
    outside: true,
    powerCost: 0,
    ifDone: "science +1",
    ifSkipped: "no science",
  },
};

/** Nightly needs (game numbers). The air machine runs on power; no power → air drops. */
export const NIGHT = {
  airMachinePower: 2,
  airLossWithoutPower: 3,
  solarPowerAtFullEfficiency: 6,
};

/** Dose per sol in game units. burstOutside = 39 × normalDay (8.1 mGy vs 0.21 mGy/day, Curiosity RAD, real ratio). burstInside and shelterFactor are game numbers. */
export const DOSE = {
  normalDay: 0.2,
  outsideExtra: 0.3,
  burstOutside: 7.8,
  burstInside: 2,
  shelterFactor: 0.5,
};
