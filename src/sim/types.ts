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
  /** 0–10, whole units: the number on screen is what the jobs can spend. */
  power: number;
  /** 0–10 */
  air: number;
  /** Crew dose in game units, 0–DOSE.meterMax (lower is better). Normal Mars day = DOSE.normalDay. */
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
  /** Sols of storm clouds Earth has warned about: the only storms the plan preview may show. */
  warnedSols?: number[];
  /** Every effect that happened so far, for the domino chain. */
  dominoes: Domino[];
  over: boolean;
  /** Campaign rules for this run. Missing = the classic 3-sol Mars mission (CLASSIC_RULES). */
  rules?: Rules;
  /** The last beat choice that hurt a resource: the next problem with that resource names it as a cause. */
  blame?: Partial<Record<Blame, string>>;
  /** The crew radioed Earth in a beat today: the answer comes with the next morning (like the Ask Earth job). */
  radioed?: boolean;
}

export type Blame = "power" | "air" | "food" | "dose";

/**
 * The numbers a campaign (and a site or an upgrade inside it) may change. All are GAME NUMBERS;
 * the real data decides which way they move (a dusty site, a sunlit ridge, a cold night).
 */
export interface Rules {
  /** Mission length in sols (on the Moon: Earth days). */
  sols: number;
  /** Power the clean panels make per sol. */
  solar: number;
  /** Panel efficiency × this for every sol nobody cleans them. */
  dustFactor: number;
  /** Power the heater needs every night (0 = warm enough). Unpaid: the plants freeze, food −1. */
  heater: number;
  /** Power the air machine needs every night. */
  airMachinePower: number;
  /** Shelter multiplies the space-ray dose by this. */
  shelterFactor: number;
  /** Food from one greenhouse job. */
  foodGain: number;
  /** Science trips needed for the science star. */
  scienceGoal: number;
  /** Sols when Earth is out of view (Moon sites): Ask Earth and the radio get no signal. */
  earthHidden: number[];
}

/** A storm or other outside event on a given sol. Comes from the data layer (snapshot or live). */
export interface StormEvent {
  sol: number;
  /** particleBurst and stormCloud raise the dose; dustStorm cuts the solar power of that sol. */
  kind: "particleBurst" | "stormCloud" | "dustStorm";
  /** Real event id shown in play, e.g. the DONKI activity ID. */
  id?: string;
  /** Dose of this storm in game units, scaled from its real measurement. Missing = the DOSE / ENGINE defaults. */
  dose?: { inside: number; outside: number };
  /** dustStorm: the panels make solar × this on that sol (from the real power record). */
  solar?: number;
  /** Text key for the kid-facing caption, e.g. 'event.burst.may2024' */
  captionKey: string;
  /** Data provenance shown in Data Sources and on the chip. */
  source: DataRef;
  /** A game event, not a real NASA event: never shown as "It's real!" or with an event number. */
  game?: true;
}

export interface EarthAnswer {
  dustTomorrow: "clear" | "dusty";
  /** Sols until a storm cloud (CME) reaches Mars, if one is forecast. */
  stormCloudInSols?: number;
  /** A dust storm is on: how many more sols it lasts, from the morning this answer arrives. */
  dustStormSols?: number;
  /** Chance of a particle burst on the morning this answer arrives. Earth can give a chance, never the hour. */
  burstRisk?: "high" | "low";
  source: DataRef;
}

export interface DataRef {
  label: string; // human words: "A Mars rover measured this storm on 20 May 2024"
  /** The real number itself, short (e.g. "8.1 mGy"). Shown first on the chip. */
  value?: string;
  url: string;
  mode: "live" | "snapshot" | "constant";
  fetched?: string; // ISO date for snapshots/live
}

/** One link in the cause → effect chain. `causeIds` must point to real earlier dominoes. */
export interface Domino {
  id: string; // e.g. 'sol1-panels-skipped'
  sol: number;
  icon: string; // icon names from src/sim/icons.ts, e.g. 'wipe x', 'power down' (#50)
  textKey: string; // i18n key
  causeIds: string[];
  source?: DataRef;
}

export interface StepResult {
  state: GameState;
  /** Dominoes created by this step (also appended to state.dominoes). */
  fell: Domino[];
}

/**
 * One beat choice (site, dilemma, wipe, radio, upgrade, rover, sky watch): what it changes.
 * Every interaction outside the plan screen goes through `act(state, action)` in the engine.
 */
export interface Action {
  /** Domino id suffix, unique in the campaign, e.g. 'site-gale' → domino 'sol1-site-gale'. */
  id: string;
  icon: string;
  textKey: string;
  source?: DataRef;
  /** Added to the resources now. Power is a cost when negative: the choice needs that much power. */
  effect?: {
    power?: number;
    air?: number;
    food?: number;
    science?: number;
    dose?: number;
    /** Panels are wiped up to this efficiency (clean panels stay clean). */
    panelEfficiency?: number;
    /** Shelter stays up at least this many sols, today included. */
    shelterSols?: number;
    /** These astronauts rest today (cannot work). */
    tired?: CrewId[];
  };
  /** Lasting rule changes (a site, an upgrade). */
  rules?: Partial<Rules>;
  /** Radio Earth: "night" = the answer comes next morning (Mars), "now" = at once (Moon, 1.3 s). */
  ask?: "night" | "now";
}

/** The engine contract. Must be pure and deterministic: same input → same output. */
export type Step = (
  state: GameState,
  plan: Plan,
  events: StormEvent[],
) => StepResult;

/** Length of the classic mission. Campaigns set their own in Rules.sols: use `rulesOf(state).sols`. */
export const MISSION_SOLS = 3;

/**
 * Causal table — THE game. Cost today / if done / if skipped.
 * Game numbers; tune them only with the brute-force tests green
 * (3-link chain exists, several 2–3 star plans exist, no plan is free).
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

/** Nightly needs (game numbers). The air machine runs on power: with power the air goes up, without it the air drops. */
export const NIGHT = {
  airMachinePower: 2,
  airLossWithoutPower: 3,
  /** The machine cleans a little more air than the crew breathes. */
  airGainWithPower: 1,
  solarPowerAtFullEfficiency: 6,
};

/** Dose per sol in game units (all game numbers). The big burst stands for the real 20 May 2024 storm, whose worst hour was about 74 times the quiet level (Curiosity RAD); smaller real storms carry their own dose (StormEvent.dose). */
export const DOSE = {
  normalDay: 0.2,
  outsideExtra: 0.3,
  burstOutside: 7.8,
  burstInside: 2,
  shelterFactor: 0.5,
  /** Top of the space-ray meter. A full meter ends the mission: the crew has to go home early. One astronaut outside in the real burst (7.8) does not fill it. */
  meterMax: 15,
};

/** The classic 3-sol Mars mission. Campaigns start from this and change a few numbers. */
export const CLASSIC_RULES: Rules = {
  sols: MISSION_SOLS,
  solar: NIGHT.solarPowerAtFullEfficiency,
  dustFactor: 0.65,
  heater: 0,
  airMachinePower: NIGHT.airMachinePower,
  shelterFactor: DOSE.shelterFactor,
  foodGain: 1,
  scienceGoal: 2,
  earthHidden: [],
};
