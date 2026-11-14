/**
 * The simulation engine: one sol = one call to `step`. Pure and deterministic.
 * Rules come from the JOBS / NIGHT / DOSE tables in ./types.ts; extra game numbers live in ENGINE below.
 *
 * Order inside one sol:
 *   1. Morning: bars.power is what is stored for today. If it is low, a powerLow domino falls.
 *   2. Jobs run in JOBS order; a job that needs more power than is left does not run.
 *   3. Night: the air machine needs NIGHT.airMachinePower from what is left, or the air drops.
 *   4. The panels charge for tomorrow: leftover + solar × panel efficiency (dusty if nobody cleaned them).
 *   5. Food, shelter, space-ray dose, science and Earth's answer are settled for the next morning.
 *
 * Domino ids are `sol{N}-{name}` and text keys are `domino.{key}` from src/i18n/en.json.
 */
import type { CrewId, DataRef, Domino, EarthAnswer, GameState, JobId, Plan, StepResult, StormEvent } from "./types";
import { DOSE, JOBS, MISSION_SOLS, NIGHT } from "./types";

/** Engine game numbers (invented, tuned for play). Change only with the balance tests green. */
export const ENGINE = {
  startAir: 6,
  startFood: 1,
  /** Skipped panels: efficiency × this (InSight: 425 → 275 Wh/sol ≈ −35%). */
  dustFactor: 0.65,
  /** Morning power below this is "low today": not enough for the greenhouse plus the air machine. */
  lowPowerToday: JOBS.greenhouse.powerCost + NIGHT.airMachinePower,
  /** Shelter protects today and tomorrow. */
  shelterSols: 2,
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

/** Jobs whose skipping drops a domino of its own (the screens have text for these). */
const SKIP_DOMINO: Partial<Record<JobId, { icon: string; key: string }>> = {
  panels: { icon: "🧽✗", key: "panelsSkipped" },
  greenhouse: { icon: "🥬✗", key: "greenhouseSkipped" },
  shelter: { icon: "🛡️✗", key: "shelterSkipped" },
};

const clamp = (v: number) => Math.min(10, Math.max(0, v));

export function createGame(): GameState {
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

/** Same as createGame. */
export const initialState = createGame;

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

  // Morning: is power low today? (Usually it already fell last night, caused by dusty panels.)
  let power = state.bars.power;
  if (!fallen(p(sol, "power-low")) && power + EPS < ENGINE.lowPowerToday)
    add({ id: p(sol, "power-low"), sol, icon: "⚡↓", textKey: "domino.powerLow", causeIds: [] });
  const powerLowToday = fallen(p(sol, "power-low")) ? [p(sol, "power-low")] : [];

  // Day: jobs spend today's power.
  const done = new Set<JobId>();
  for (const job of JOB_IDS) {
    const assignedJob = assigned.has(job);
    const affordable = JOBS[job].powerCost <= power + EPS;
    if (assignedJob && affordable) {
      power -= JOBS[job].powerCost;
      done.add(job);
      continue;
    }
    const skip = SKIP_DOMINO[job];
    if (!skip) continue;
    // Low power is a cause when it stopped the job, and for the greenhouse (the big power user) on a low-power sol.
    const causeIds = assignedJob || job === "greenhouse" ? powerLowToday : [];
    add({ id: p(sol, `${job}-skipped`), sol, icon: skip.icon, textKey: `domino.${skip.key}`, causeIds });
  }

  // Night: the air machine.
  let air = state.bars.air;
  if (power + EPS < NIGHT.airMachinePower) {
    air = clamp(air - NIGHT.airLossWithoutPower);
    add({ id: p(sol, "air-low"), sol, icon: "🫧↓", textKey: "domino.airLow", causeIds: powerLowToday });
  } else {
    power -= NIGHT.airMachinePower;
  }

  // Space rays: shelter, storms, and every astronaut outside.
  const shelterSols = done.has("shelter") ? ENGINE.shelterSols : state.shelterSols;
  const sheltered = shelterSols > 0;
  const outsideCount = [...done].filter((j) => JOBS[j].outside).length;
  const storm =
    events.find((e) => e.sol === sol && e.kind === "particleBurst") ?? events.find((e) => e.sol === sol && e.kind === "stormCloud");
  const [inside, outside] = !storm
    ? [DOSE.normalDay, DOSE.normalDay + DOSE.outsideExtra]
    : storm.kind === "particleBurst"
      ? [DOSE.burstInside, DOSE.burstOutside]
      : [ENGINE.cloudInside, ENGINE.cloudOutside];
  let doseToday = inside + outsideCount * (outside - inside);
  if (sheltered) doseToday *= DOSE.shelterFactor;
  if (storm) {
    const causeIds = sheltered ? [] : [sol - 1, sol].map((s) => p(s, "shelter-skipped")).filter(fallen);
    add({ id: p(sol, "dose-high"), sol, icon: "☢️↑", textKey: "domino.doseHigh", causeIds, source: storm.source });
  }

  // Food.
  let food = state.food;
  if (done.has("greenhouse")) food += 1;
  else {
    food = Math.max(0, food - 1);
    if (food === 0)
      add({ id: p(sol, "food-empty"), sol, icon: "🥬0", textKey: "domino.foodEmpty", causeIds: [p(sol, "greenhouse-skipped")] });
  }
  const tired: CrewId[] = food === 0 ? ["a1"] : [];

  // The panels charge for tomorrow.
  const panelEfficiency = done.has("panels") ? 1 : state.panelEfficiency * ENGINE.dustFactor;
  const powerTomorrow = clamp(power + NIGHT.solarPowerAtFullEfficiency * panelEfficiency);

  const over = last || air <= 0;

  // Next morning's dominoes.
  if (!over) {
    if (!done.has("panels") && powerTomorrow + EPS < NIGHT.solarPowerAtFullEfficiency)
      add({ id: p(next, "power-low"), sol: next, icon: "⚡↓", textKey: "domino.powerLow", causeIds: [p(sol, "panels-skipped")] });
    if (tired.length)
      add({ id: p(next, "crew-tired"), sol: next, icon: "😴", textKey: "domino.crewTired", causeIds: [p(sol, "food-empty")] });
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
    bars: { power: powerTomorrow, air, dose: clamp(state.bars.dose + doseToday) },
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
