/**
 * Campaigns are DATA: a place, engine rules, real events and one beat per sol.
 * `buildRun(campaign, seed)` turns a campaign into one run. Same seed → same run.
 * Real data is never changed by the seed; only which real event and which beat a run gets.
 */
import type { Icon } from "./icons";
import type { ExploreMap } from "./explore";
import { rng } from "./rng";
import { CLASSIC_RULES, type Action, type DataRef, type Rules, type StormEvent } from "./types";

/** Eight ways a sol can play differently from "assign the crew". Each ends in one engine action. */
export type BeatType = "site" | "dilemma" | "wipe" | "radio" | "upgrade" | "rover" | "skywatch" | "explore";

export interface BeatOption {
  /** Short id, unique in the beat. Text: `beat.{beat.id}.{id}.label`, and `.real` when `real` is set. */
  id: string;
  action: Action;
  /** The option carries a real, sourced fact line (`beat.{beat.id}.{id}.real`). */
  real?: boolean;
}

export interface Beat {
  /** Text: `beat.{id}.title` and `beat.{id}.text`. */
  id: string;
  type: BeatType;
  /** The real data behind this beat, shown as a card with its source. */
  card?: DataRef;
  options: BeatOption[];
  /** explore: the map the kid drives on. The options are the "let Pip drive" choices for players who skip the driving. */
  map?: ExploreMap;
  /** wipe: the kid wipes the panels by hand; the count picks the option (`wipeChoice`). */
  hands?: true;
  /** Words the seed picked (a crew name), for the beat's text. */
  vars?: Record<string, string>;
}

/** Game numbers of the hands-on wipe (#98): 6 panels; half of them = "half", all = "all". */
export const WIPE_PANELS = 6;
export const wipeChoice = (wiped: number, total = WIPE_PANELS): "none" | "half" | "all" =>
  wiped >= total ? "all" : wiped * 2 >= total ? "half" : "none";

export type Place = "mars" | "moon";

export interface Campaign {
  /** Text: `campaign.{id}.name`, `.where`, `.hook`, `.brief`, `.real`, `.planners`. */
  id: string;
  place: Place;
  rules: Partial<Rules>;
  /** Real datasets named on the campaign card. */
  datasets: string[];
  /** 1 easy … 3 hard. */
  difficulty: 1 | 2 | 3;
  minutes: number;
  /** Not on the menu (the quick classic mission: `?campaign=classic`, the demo and the teacher card use it). */
  hidden?: boolean;
  /** Finish this campaign first (teacher mode opens everything). */
  unlockAfter?: string;
  /** The real event(s) and the beats for one seed. `next` is the seeded random source. */
  build: (next: () => number, seed: number) => {
    events: StormEvent[];
    beats: Record<number, Beat>;
    /** The real storm this run replays (classic), for the storm card. */
    stormId?: string;
  };
}

export interface Run {
  campaignId: string;
  seed: number;
  place: Place;
  rules: Rules;
  events: StormEvent[];
  /** At most one beat per sol, played between the morning report and the plan. */
  beats: Record<number, Beat>;
  stormId?: string;
}

export function buildRun(campaign: Campaign, seed: number): Run {
  const built = campaign.build(rng(seed), seed);
  return {
    campaignId: campaign.id,
    seed,
    place: campaign.place,
    rules: { ...CLASSIC_RULES, ...campaign.rules },
    ...built,
  };
}

/** One option of a beat as the engine action it stands for. */
export const option = (
  beatId: string,
  id: string,
  icon: Icon,
  rest: Omit<Action, "id" | "icon" | "textKey"> = {},
  real = false,
): BeatOption => ({
  id,
  ...(real ? { real } : {}),
  action: { id: `${beatId}-${id}`, icon, textKey: `chose:beat.${beatId}.${id}.label`, ...rest },
});

/** What a run is made of, as one line: used to check that seeds really differ. */
export const signature = (run: Run): string =>
  [
    run.stormId ?? "",
    ...run.events.map((e) => `${e.kind}@${e.sol}:${e.id ?? ""}`),
    ...Object.entries(run.beats).map(([sol, b]) => `${sol}:${b.id}${b.vars ? `(${Object.values(b.vars)})` : ""}`),
    run.rules.earthHidden.join("/"),
  ].join("|");
