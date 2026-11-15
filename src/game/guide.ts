import type { Screen } from "../state/screen";

/**
 * The first-play guide (#64, "show, don't tell"): instead of explaining, it points at the one thing to touch
 * next, with one short sentence. It walks a whole sol (menu → base → morning → beat → plan → report) and then
 * fades out: kids learn the loop once and play the other sols on their own.
 */
export type StepId = "start" | "walk" | "goal" | "drive" | "choose" | "crew" | "job" | "endSol" | "report";

/** What the guide can see of the game right now (the guide layer reads it from the screen). */
export interface GuideCtx {
  place: "menu" | "hub" | "console";
  screen: Screen;
  sol: number;
  /** A dialog (mini-game, crew talk, alarm) or a page like Settings is open: never talk over it. */
  blocked: boolean;
  /** The beat is the rover drive on the map. */
  explore: boolean;
  /** Awake astronauts without a job yet on the plan screen. */
  freeCrew: number;
  /** An astronaut is picked and waits for a job. */
  crewSelected: boolean;
}

/** `sol`: the sol the guide teaches; it turns off when the next one starts. */
export interface Guide { on: boolean; sol: number }

/** Where each step points (first match on screen) and its one-line text (`guide.step.<id>`). */
export const GUIDE_STEPS: Record<StepId, { target: string; text: `guide.step.${StepId}` }> = {
  start: { target: ".launch-button", text: "guide.step.start" },
  walk: { target: ".world-screen", text: "guide.step.walk" },
  goal: { target: ".morning-go", text: "guide.step.goal" },
  drive: { target: ".explore-map", text: "guide.step.drive" },
  choose: { target: ".hands-on, .beat-options", text: "guide.step.choose" },
  crew: { target: ".crew-tile.call > button, .crew-tile:not(.has-job) > button:not(:disabled)", text: "guide.step.crew" },
  job: { target: ".job-choice:not(.locked):not(.assigned)", text: "guide.step.job" },
  endSol: { target: ".end-sol", text: "guide.step.endSol" },
  report: { target: ".screen .actions .primary", text: "guide.step.report" },
};

export const startGuide = (sol: number): Guide => ({ on: true, sol });

const over = (c: GuideCtx, g: Guide) => c.sol > g.sol || c.screen === "final";

/** The step to show now, or null (off, something open on top, or the guide's sol is over). */
export function guideStep(c: GuideCtx, g: Guide): StepId | null {
  if (!g.on || c.blocked || over(c, g)) return null;
  if (c.place === "menu") return "start";
  if (c.place === "hub") return "walk";
  switch (c.screen) {
    case "morning": return "goal";
    case "beat": return c.explore ? "drive" : "choose";
    case "plan": return c.freeCrew > 0 ? (c.crewSelected ? "job" : "crew") : "endSol";
    case "endSol": return "report";
    default: return null;
  }
}

/** The guide after this moment: it switches itself off once its sol is over. */
export const guideAfter = (c: GuideCtx, g: Guide): Guide => (g.on && over(c, g) ? { ...g, on: false } : g);
