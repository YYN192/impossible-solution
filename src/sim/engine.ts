/**
 * The simulation engine: one sol = one call to `step`. Pure and deterministic.
 * Rules come from the JOBS / NIGHT / DOSE tables in ./types.ts; extra game numbers live in ENGINE below.
 *
 * Order inside one sol:
 *   1. Morning: bars.power is what is stored for today. If it is low, a powerLow domino falls.
 *   2. Jobs run in JOBS order; a job that needs more power than is left does not run.
 *   3. Night: the air machine needs power from what is left, or the air drops. Then the heater (cold sites).
 *   4. The panels charge for tomorrow: leftover + solar × panel efficiency (dusty if nobody cleaned them).
 *   5. Food, shelter, space-ray dose, science and Earth's answer are settled for the next morning.
 *
 * Campaigns change the numbers in `state.rules` (see Rules in ./types.ts), never the code path.
 * Beat choices (site, dilemma, wipe, radio, upgrade, rover, sky watch) go through `act`.
 *
 * Domino ids are `sol{N}-{name}` and text keys are `domino.{key}` from src/i18n/en.json.
 */
import type {
  Action,
  Blame,
  CrewId,
  DataRef,
  Domino,
  EarthAnswer,
  GameState,
  JobId,
  Plan,
  Rules,
  StepResult,
  StormEvent,
} from "./types";
import { CLASSIC_RULES, DOSE, JOBS, NIGHT } from "./types";

/** Engine game numbers (invented, tuned for play). Change only with the balance tests green. */
export const ENGINE = {
  startAir: 5,
  startFood: 1,
  /** Skipped panels: efficiency × this (InSight: 425 → 275 Wh/sol ≈ −35%). */
  dustFactor: CLASSIC_RULES.dustFactor,
  /** Morning power below this is "low today": not enough for the greenhouse plus the air machine. */
  lowPowerToday: JOBS.greenhouse.powerCost + NIGHT.airMachinePower,
  /** Shelter protects today and tomorrow. */
  shelterSols: 2,
  /** Storm cloud (CME) dose: a smaller burst. Game numbers; the real CME is never mapped to a Mars dose. */
  cloudInside: 0.6,
  cloudOutside: 2,
  /** Crew-safe star: final dose must stay below this. */
  doseLimit: 3,
  /** Base star: air left for tomorrow must be at least this (power: lowPowerToday, food: 1). */
  airReady: 6,
  /** Science star. */
  scienceGoal: CLASSIC_RULES.scienceGoal,
  /** Food made by a successful greenhouse job. */
  foodGain: CLASSIC_RULES.foodGain,
  /** Food the crew eats on a sol without a greenhouse harvest. */
  foodLoss: 1,
  /** Science earned by a successful science trip. */
  scienceGain: 1,
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

/** Assigned but not enough power: says so, instead of "nobody did it". */
const NO_POWER_DOMINO: Partial<Record<JobId, { icon: string; key: string }>> = {
  greenhouse: { icon: "🥬⚡✗", key: "noPowerGreenhouse" },
  shelter: { icon: "🛡️⚡✗", key: "noPowerShelter" },
  askEarth: { icon: "📡⚡✗", key: "noPowerAskEarth" },
};

const clamp = (v: number, max = 10) => Math.min(max, Math.max(0, v));

/** The rules of this run: the campaign's, or the classic mission's. */
export const rulesOf = (state: GameState): Rules => state.rules ?? CLASSIC_RULES;

/**
 * Storms the player has been told about, so the plan preview can show them. Particle bursts
 * come without warning (tens of minutes); storm clouds only after Earth warned about them.
 * Dust storms are seen coming on the horizon, so today's is always known.
 */
export function knownEvents(
  state: GameState,
  events: StormEvent[],
): StormEvent[] {
  return events.filter(
    (e) =>
      (e.kind === "stormCloud" && state.warnedSols?.includes(e.sol)) ||
      (e.kind === "dustStorm" && e.sol === state.sol),
  );
}

export function createGame(rules?: Partial<Rules>): GameState {
  const r = { ...CLASSIC_RULES, ...rules };
  return {
    sol: 1,
    bars: { power: r.solar, air: ENGINE.startAir, dose: 0 },
    food: ENGINE.startFood,
    science: 0,
    panelEfficiency: 1,
    shelterSols: 0,
    tired: [],
    dominoes: [],
    over: false,
    ...(rules ? { rules: r } : {}),
  };
}

/** Same as createGame. */
export const initialState = createGame;

/**
 * What Earth can tell the crew about the sols from `from` on: dust (from the panels), the next
 * storm cloud (the real forecast in `events`) and the chance of a particle burst on sol `from`.
 */
export function earthAnswerFor(
  events: StormEvent[],
  from: number,
  panelEfficiency: number,
  table?: EarthAnswer,
): EarthAnswer {
  const coming = events
    .filter((e) => e.kind === "stormCloud" && e.sol >= from)
    .sort((a, b) => a.sol - b.sol)[0];
  const burst = events.some((e) => e.kind === "particleBurst" && e.sol === from);
  let dustSols = 0;
  while (events.some((e) => e.kind === "dustStorm" && e.sol === from + dustSols)) dustSols++;
  return {
    ...(coming ? { stormCloudInSols: coming.sol - from } : {}),
    ...(dustSols ? { dustStormSols: dustSols } : {}),
    source: coming?.source ?? EARTH_REF,
    ...table,
    dustTomorrow: panelEfficiency < 1 ? "dusty" : "clear",
    burstRisk: burst ? "high" : "low",
  };
}

const warned = (state: GameState, answer: EarthAnswer | undefined, from: number) => [
  ...(state.warnedSols ?? []),
  ...(answer?.stormCloudInSols !== undefined ? [from + answer.stormCloudInSols] : []),
];

export function step(
  state: GameState,
  plan: Plan,
  events: StormEvent[],
  /** Earth's answer per sol (MissionSetup.forecasts). Without it, Earth answers from `events`. */
  forecasts?: Record<number, EarthAnswer>,
): StepResult {
  if (state.over) return { state, fell: [] };

  const R = rulesOf(state);
  const sol = state.sol;
  const next = sol + 1;
  const last = sol >= R.sols;
  const fell: Domino[] = [];
  const fallen = (id: string) =>
    state.dominoes.some((d) => d.id === id) || fell.some((d) => d.id === id);
  const add = (d: Domino) => fell.push(d);
  const p = (s: number, what: string) => `sol${s}-${what}`;
  // A beat choice that hurt a resource is named once, by the next problem with that resource.
  const blame = { ...state.blame };
  const blamed = (what: Blame): string[] => {
    const id = blame[what];
    delete blame[what];
    return id ? [id] : [];
  };

  // Who works today.
  const assigned = new Set<JobId>();
  for (const c of CREW) {
    const job = plan[c];
    if (job && !state.tired.includes(c)) assigned.add(job);
  }

  // Morning: is power low today? (Usually it already fell last night, caused by dusty panels.)
  let power = state.bars.power;
  if (!fallen(p(sol, "power-low")) && power + EPS < ENGINE.lowPowerToday)
    add({
      id: p(sol, "power-low"),
      sol,
      icon: "⚡↓",
      textKey: "domino.powerLow",
      causeIds: blamed("power"),
    });
  const powerLowToday = fallen(p(sol, "power-low"))
    ? [p(sol, "power-low")]
    : [];

  // Day: jobs spend today's power.
  const earthHidden = R.earthHidden.includes(sol);
  const done = new Set<JobId>();
  for (const job of JOB_IDS) {
    const assignedJob = assigned.has(job);
    if (job === "askEarth" && assignedJob && earthHidden) {
      add({ id: p(sol, "no-signal"), sol, icon: "📡🌘", textKey: "domino.noSignal", causeIds: [] });
      continue;
    }
    const affordable = JOBS[job].powerCost <= power + EPS;
    if (assignedJob && affordable) {
      power -= JOBS[job].powerCost;
      done.add(job);
      continue;
    }
    const skip = (assignedJob && NO_POWER_DOMINO[job]) || SKIP_DOMINO[job];
    if (!skip) continue;
    // Low power is a cause when it stopped the job, and for the greenhouse (the big power user) on a low-power sol.
    const causeIds = assignedJob || job === "greenhouse" ? powerLowToday : [];
    add({
      id: p(sol, `${job}-skipped`),
      sol,
      icon: skip.icon,
      textKey: `domino.${skip.key}`,
      causeIds,
    });
  }

  // Night: the air machine.
  let air = state.bars.air;
  if (power + EPS < R.airMachinePower) {
    air = clamp(air - NIGHT.airLossWithoutPower);
    add({
      id: p(sol, "air-low"),
      sol,
      icon: "🫧↓",
      textKey: "domino.airLow",
      causeIds: [...powerLowToday, ...blamed("air")],
    });
  } else {
    power -= R.airMachinePower;
    air = clamp(air + NIGHT.airGainWithPower);
  }

  // Night: the heater (cold sites only). Unpaid: the greenhouse plants freeze.
  let food = state.food;
  let coldNight = false;
  if (R.heater > 0) {
    if (power + EPS < R.heater) {
      coldNight = true;
      food = Math.max(0, food - ENGINE.foodLoss);
      add({
        id: p(sol, "cold-night"),
        sol,
        icon: "🥶",
        textKey: "domino.coldNight",
        causeIds: powerLowToday,
      });
    } else power -= R.heater;
  }

  // Space rays: shelter, storms, and every astronaut outside.
  const shelterSols = done.has("shelter")
    ? Math.max(ENGINE.shelterSols, state.shelterSols)
    : state.shelterSols;
  const sheltered = shelterSols > 0;
  const outsideCount = [...done].filter((j) => JOBS[j].outside).length;
  const storm =
    events.find((e) => e.sol === sol && e.kind === "particleBurst") ??
    events.find((e) => e.sol === sol && e.kind === "stormCloud");
  const [inside, outside] = !storm
    ? [DOSE.normalDay, DOSE.normalDay + DOSE.outsideExtra]
    : storm.dose
      ? [storm.dose.inside, storm.dose.outside]
      : storm.kind === "particleBurst"
        ? [DOSE.burstInside, DOSE.burstOutside]
        : [ENGINE.cloudInside, ENGINE.cloudOutside];
  let doseToday = inside + outsideCount * (outside - inside);
  if (sheltered) doseToday *= R.shelterFactor;
  const dose = clamp(state.bars.dose + doseToday, DOSE.meterMax);
  const doseFull = dose >= DOSE.meterMax - EPS;
  if (storm) {
    // Being outside gives most of the storm dose, so it is the first cause.
    if (outsideCount > 0)
      add({
        id: p(sol, "outside-storm"),
        sol,
        icon: "🧑‍🚀☢️",
        textKey: "domino.outsideStorm",
        causeIds: [],
      });
    const causeIds = [
      ...(outsideCount > 0 ? [p(sol, "outside-storm")] : []),
      ...(sheltered
        ? []
        : [sol - 1, sol].map((s) => p(s, "shelter-skipped")).filter(fallen)),
      ...blamed("dose"),
    ];
    add({
      id: p(sol, "dose-high"),
      sol,
      icon: "☢️↑",
      textKey: "domino.doseHigh",
      causeIds,
      source: storm.source,
    });
  }
  if (doseFull)
    add({
      id: p(sol, "dose-full"),
      sol,
      icon: "🚀🏠",
      textKey: "domino.doseFull",
      causeIds: storm ? [p(sol, "dose-high")] : blamed("dose"),
    });

  // Food: the crew eats every sol; only a greenhouse harvest keeps up.
  if (done.has("greenhouse")) food += R.foodGain;
  else {
    food = Math.max(0, food - ENGINE.foodLoss);
    if (food === 0)
      add({
        id: p(sol, "food-empty"),
        sol,
        icon: "🥬0",
        textKey: "domino.foodEmpty",
        causeIds: [
          p(sol, "greenhouse-skipped"),
          ...(coldNight ? [p(sol, "cold-night")] : []),
          ...blamed("food"),
        ],
      });
  }
  const tired: CrewId[] = food === 0 ? ["a1"] : [];

  // The panels charge for tomorrow. A dust storm dims the Sun for its sol.
  const dustStorm = events.find((e) => e.sol === sol && e.kind === "dustStorm");
  if (dustStorm)
    add({
      id: p(sol, "dust-storm"),
      sol,
      icon: "🌪️",
      textKey: dustStorm.captionKey,
      causeIds: [],
      source: dustStorm.source,
    });
  const panelEfficiency = done.has("panels")
    ? 1
    : state.panelEfficiency * R.dustFactor;
  // Whole units, rounded down: the meter never shows power the jobs cannot spend.
  const powerTomorrow = clamp(
    Math.floor(power + R.solar * (dustStorm?.solar ?? 1) * panelEfficiency + EPS),
  );

  const over = last || air <= 0 || doseFull;

  // Next morning's dominoes.
  if (!over) {
    if (
      powerTomorrow + EPS < ENGINE.lowPowerToday ||
      (!done.has("panels") && powerTomorrow + EPS < R.solar)
    ) {
      const causeIds = [
        ...(done.has("panels") ? [] : [p(sol, "panels-skipped")]),
        ...(dustStorm ? [p(sol, "dust-storm")] : []),
        ...blamed("power"),
      ];
      if (causeIds.length)
        add({
          id: p(next, "power-low"),
          sol: next,
          icon: "⚡↓",
          textKey: "domino.powerLow",
          causeIds,
        });
    }
    if (tired.length)
      add({
        id: p(next, "crew-tired"),
        sol: next,
        icon: "😴",
        textKey: "domino.crewTired",
        causeIds: [p(sol, "food-empty")],
      });
  }

  // Earth's answer: the Ask Earth job, or a radio call made in a beat today. It is about tomorrow.
  const earthAnswer =
    (done.has("askEarth") || state.radioed) && !earthHidden
      ? earthAnswerFor(events, next, panelEfficiency, forecasts?.[sol])
      : undefined;
  const warnedSols = warned(state, earthAnswer, next);

  const newState: GameState = {
    sol: over ? sol : next,
    bars: { power: powerTomorrow, air, dose },
    food,
    science: state.science + (done.has("science") ? ENGINE.scienceGain : 0),
    panelEfficiency,
    shelterSols: Math.max(0, shelterSols - 1),
    tired,
    ...(earthAnswer ? { earthAnswer } : {}),
    ...(warnedSols.length ? { warnedSols } : {}),
    dominoes: [...state.dominoes, ...fell],
    over,
    ...(state.rules ? { rules: state.rules } : {}),
    ...(Object.keys(blame).length ? { blame } : {}),
  };
  return { state: newState, fell };
}

/** Can this beat choice be taken now? (Only power is a price; other effects just happen.) */
export function canAct(state: GameState, action: Action): boolean {
  return !state.over && state.bars.power + (action.effect?.power ?? 0) > -EPS;
}

/**
 * One beat choice: apply its effect and drop a root domino for it, so later problems can point
 * back at the choice. Pure. A choice the crew cannot pay for changes nothing.
 */
export function act(
  state: GameState,
  action: Action,
  events: StormEvent[] = [],
): StepResult {
  if (!canAct(state, action)) return { state, fell: [] };
  const sol = state.sol;
  const R = rulesOf(state);
  if (action.ask && R.earthHidden.includes(sol)) {
    const d: Domino = { id: `sol${sol}-no-signal`, sol, icon: "📡🌘", textKey: "domino.noSignal", causeIds: [] };
    return { state: { ...state, dominoes: [...state.dominoes, d] }, fell: [d] };
  }
  const e = action.effect ?? {};
  const id = `sol${sol}-${action.id}`;
  const domino: Domino = {
    id,
    sol,
    icon: action.icon,
    textKey: action.textKey,
    causeIds: [],
    ...(action.source ? { source: action.source } : {}),
  };
  const blame = { ...state.blame };
  if ((e.power ?? 0) < 0 || (e.panelEfficiency !== undefined && Math.max(state.panelEfficiency, e.panelEfficiency) < 1) || (action.rules?.solar ?? R.solar) < R.solar)
    blame.power = id;
  if ((e.air ?? 0) < 0) blame.air = id;
  if ((e.food ?? 0) < 0) blame.food = id;
  if ((e.dose ?? 0) > 0) blame.dose = id;
  const rules = action.rules ? { ...R, ...action.rules } : state.rules;
  const earthAnswer =
    action.ask === "now" ? earthAnswerFor(events, sol, state.panelEfficiency) : undefined;
  const warnedSols = warned(state, earthAnswer, sol);
  const next: GameState = {
    ...state,
    bars: {
      power: clamp(state.bars.power + (e.power ?? 0)),
      air: clamp(state.bars.air + (e.air ?? 0)),
      dose: clamp(state.bars.dose + (e.dose ?? 0), DOSE.meterMax),
    },
    food: Math.max(0, state.food + (e.food ?? 0)),
    science: state.science + (e.science ?? 0),
    panelEfficiency: Math.max(state.panelEfficiency, e.panelEfficiency ?? 0),
    shelterSols: Math.max(state.shelterSols, e.shelterSols ?? 0),
    tired: e.tired ? [...new Set([...state.tired, ...e.tired])] : state.tired,
    dominoes: [...state.dominoes, domino],
    ...(rules ? { rules } : {}),
    ...(Object.keys(blame).length ? { blame } : {}),
    ...(action.ask === "night" ? { radioed: true } : {}),
    ...(earthAnswer ? { earthAnswer } : {}),
    ...(warnedSols.length ? { warnedSols } : {}),
  };
  return { state: next, fell: [domino] };
}

export interface Stars {
  /** Dose stayed under the limit. */
  crewSafe: boolean;
  /** Power, air and food are left for tomorrow. */
  baseRunning: boolean;
  /** Science goal reached. */
  science: boolean;
  count: 0 | 1 | 2 | 3;
}

export function stars(state: GameState): Stars {
  const crewSafe = state.bars.dose < ENGINE.doseLimit;
  const baseRunning =
    state.bars.air >= ENGINE.airReady &&
    state.bars.power >= ENGINE.lowPowerToday &&
    state.food >= 1;
  const science = state.science >= rulesOf(state).scienceGoal;
  return {
    crewSafe,
    baseRunning,
    science,
    count: ((crewSafe ? 1 : 0) +
      (baseRunning ? 1 : 0) +
      (science ? 1 : 0)) as Stars["count"],
  };
}
