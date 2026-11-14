/**
 * The simulation engine: one sol = one call to `step`. Pure and deterministic.
 * Rules come from the JOBS / NIGHT / DOSE tables in ./types.ts; extra game numbers live in ENGINE below.
 *
 * Order inside one sol:
 *   1. Morning power = what the panels make today (bars.power, set at the end of the previous sol).
 *   2. Jobs run in JOBS order; a job that needs more power than is left does not run.
 *   3. Night: the air machine needs NIGHT.airMachinePower from what is left, or air drops.
 *   4. Dust, food, shelter, dose, science and Earth's answer are settled for the next morning.
 */
import type { CrewId, DataRef, Domino, EarthAnswer, GameState, JobId, Plan, StepResult, StormEvent } from "./types";
import { DOSE, JOBS, MISSION_SOLS, NIGHT } from "./types";

/** Engine game numbers (invented, tuned for play). Change only with the balance tests green. */
export const ENGINE = {
  startAir: 6,
  startFood: 1,
  /** Skipped panels: efficiency × this (InSight: 425 → 275 Wh/sol ≈ −35%). */
  dustFactor: 0.65,
  /** Shelter protects today and tomorrow. */
  shelterSols: 2,
  /** Air at or below this after a drop → air warning next morning. */
  airLow: 3,
  /** Storm cloud (CME) dose: a smaller burst. Game numbers; the real CME is never mapped to a Mars dose. */
  cloudInside: 1,
  cloudOutside: 4,
  /** Crew-safe star: final dose must stay below this. */
  doseLimit: 5,
  /** Science star. */
  scienceGoal: 2,
};

const CREW: CrewId[] = ["a1", "a2", "a3"];
const JOB_IDS = Object.keys(JOBS) as JobId[];
const EPS = 1e-9;

const EARTH_REF: DataRef = {
  label: "Mission Control on Earth",
  url: "https://kauai.ccmc.gsfc.nasa.gov/DONKI/",
  mode: "constant",
};

const SKIP_ICON: Record<JobId, string> = {
  panels: "🧽✗",
  greenhouse: "🥬✗",
  shelter: "🛡️✗",
  askEarth: "📡✗",
  science: "🔬✗",
};

const clamp = (v: number) => Math.min(10, Math.max(0, v));

export function initialState(): GameState {
  return {
    sol: 1,
    bars: { power: NIGHT.solarPowerAtFullEfficiency, air: ENGINE.startAir, dose: 0 },
    food: ENGINE.startFood,
    science: 0,
    panelEfficiency: 1,
    shelterSols: 0,
    tired: [],
    dominoes: [],
    over: false,
  };
}

export function step(
  state: GameState,
  plan: Plan,
  events: StormEvent[],
  /** Earth's answer per sol (MissionSetup.forecasts). Without it, Earth answers from `events`. */
  forecasts?: Record<number, EarthAnswer>,
): StepResult {
  if (state.over) return { state, fell: [] };

  const sol = state.sol;
  const next = sol + 1;
  const last = sol >= MISSION_SOLS;
  const fell: Domino[] = [];
  const fallen = (id: string) => state.dominoes.some((d) => d.id === id) || fell.some((d) => d.id === id);
  const add = (d: Domino) => fell.push(d);
  const p = (s: number, what: string) => `sol${s}-${what}`;

  // Who works today.
  const assigned = new Set<JobId>();
  for (const c of CREW) {
    const job = plan[c];
    if (job && !state.tired.includes(c)) assigned.add(job);
  }

  // Outside events.
  const burst = events.find((e) => e.sol === sol && e.kind === "particleBurst");
  if (burst) add({ id: p(sol, "burst"), sol, icon: "☀️💥", textKey: "domino.burst", causeIds: [], source: burst.source });
  const cloud = events.find((e) => e.sol === sol && e.kind === "stormCloud");
  if (cloud) add({ id: p(sol, "storm-cloud"), sol, icon: "☁️", textKey: "domino.stormCloud", causeIds: [], source: cloud.source });

  // Day: jobs spend today's power.
  let power = state.bars.power;
  const powerLowToday = fallen(p(sol, "power-low")) ? [p(sol, "power-low")] : [];
  const done = new Set<JobId>();
  for (const job of JOB_IDS) {
    if (!assigned.has(job)) {
      add({ id: p(sol, `${job}-skipped`), sol, icon: SKIP_ICON[job], textKey: `domino.skipped.${job}`, causeIds: [] });
      continue;
    }
    const cost = JOBS[job].powerCost;
    if (cost > power + EPS) {
      add({ id: p(sol, `${job}-nopower`), sol, icon: "⚡✗", textKey: `domino.nopower.${job}`, causeIds: powerLowToday });
      continue;
    }
    power -= cost;
    done.add(job);
  }
  const undoneId = (job: JobId) => (fallen(p(sol, `${job}-nopower`)) ? p(sol, `${job}-nopower`) : p(sol, `${job}-skipped`));

  // Night: the air machine.
  let air = state.bars.air;
  let airDropped = false;
  if (power + EPS < NIGHT.airMachinePower) {
    air = clamp(air - NIGHT.airLossWithoutPower);
    airDropped = true;
    add({ id: p(sol, "air-drop"), sol, icon: "🫧↓", textKey: "domino.airDrop", causeIds: powerLowToday });
  }

  // Shelter and dose.
  const shelterSols = done.has("shelter") ? ENGINE.shelterSols : state.shelterSols;
  const sheltered = shelterSols > 0;
  const outside = [...done].some((j) => JOBS[j].outside);
  let doseToday = burst
    ? outside
      ? DOSE.burstOutside
      : DOSE.burstInside
    : cloud
      ? outside
        ? ENGINE.cloudOutside
        : ENGINE.cloudInside
      : DOSE.normalDay + (outside ? DOSE.outsideExtra : 0);
  if (sheltered) doseToday *= DOSE.shelterFactor;
  if ((burst || cloud) && outside) {
    const causes = burst ? [p(sol, "burst")] : [p(sol, "storm-cloud")];
    if (!sheltered) for (const s of [sol - 1, sol]) if (fallen(p(s, "shelter-skipped"))) causes.push(p(s, "shelter-skipped"));
    add({ id: p(sol, "dose-big"), sol, icon: "☢️↑", textKey: "domino.doseBig", causeIds: causes });
  }

  // Food.
  let food = state.food;
  if (done.has("greenhouse")) food += 1;
  else {
    food = Math.max(0, food - 1);
    if (food === 0) add({ id: p(sol, "food-empty"), sol, icon: "🥬0", textKey: "domino.foodEmpty", causeIds: [undoneId("greenhouse")] });
  }
  const tired: CrewId[] = food === 0 ? ["a1"] : [];

  // Dust.
  const panelEfficiency = done.has("panels") ? 1 : state.panelEfficiency * ENGINE.dustFactor;

  const over = last || air <= 0;

  // Next morning's dominoes.
  if (!over) {
    if (!done.has("panels"))
      add({ id: p(next, "power-low"), sol: next, icon: "⚡↓", textKey: "domino.powerLow", causeIds: [undoneId("panels")] });
    if (airDropped && air <= ENGINE.airLow)
      add({ id: p(next, "air-low"), sol: next, icon: "🫧!", textKey: "domino.airLow", causeIds: [p(sol, "air-drop")] });
    if (tired.length) add({ id: p(next, "tired"), sol: next, icon: "😴", textKey: "domino.tired", causeIds: [p(sol, "food-empty")] });
  }

  // Earth's answer.
  let earthAnswer: EarthAnswer | undefined;
  if (done.has("askEarth")) {
    earthAnswer = forecasts?.[sol];
    if (!earthAnswer) {
      const coming = events.filter((e) => e.kind === "stormCloud" && e.sol > sol).sort((a, b) => a.sol - b.sol)[0];
      earthAnswer = {
        dustTomorrow: panelEfficiency < 1 ? "dusty" : "clear",
        ...(coming ? { stormCloudInSols: coming.sol - next } : {}),
        source: coming?.source ?? EARTH_REF,
      };
    }
  }

  const newState: GameState = {
    sol: over ? sol : next,
    bars: {
      power: clamp(NIGHT.solarPowerAtFullEfficiency * panelEfficiency),
      air,
      dose: clamp(state.bars.dose + doseToday),
    },
    food,
    science: state.science + (done.has("science") ? 1 : 0),
    panelEfficiency,
    shelterSols: Math.max(0, shelterSols - 1),
    tired,
    ...(earthAnswer ? { earthAnswer } : {}),
    dominoes: [...state.dominoes, ...fell],
    over,
  };
  return { state: newState, fell };
}

export interface Stars {
  /** Dose stayed under the limit. */
  crewSafe: boolean;
  /** No bar hit 0. */
  baseRunning: boolean;
  /** Science goal reached. */
  science: boolean;
  count: 0 | 1 | 2 | 3;
}

export function stars(state: GameState): Stars {
  const crewSafe = state.bars.dose < ENGINE.doseLimit;
  const baseRunning = state.bars.air > 0 && state.bars.power > 0;
  const science = state.science >= ENGINE.scienceGoal;
  return { crewSafe, baseRunning, science, count: ((crewSafe ? 1 : 0) + (baseRunning ? 1 : 0) + (science ? 1 : 0)) as Stars["count"] };
}
