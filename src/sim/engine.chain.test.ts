/**
 * Whole-mission checks (#2), written BEFORE the engine: brute force over every plan.
 * Uses the real main mission (may2024Mission: burst on sol 2, storm cloud on sol 3).
 * If these fail after the engine exists, tune the GAME NUMBERS in types.ts, not the tests.
 */
import { describe, expect, it } from "vitest";
import { may2024Mission } from "../data/mission";
import { createGame, step } from "./engine";
import { MISSION_SOLS, type CrewId, type Domino, type GameState, type JobId, type Plan } from "./types";

const CHOICES: (JobId | undefined)[] = [undefined, "panels", "greenhouse", "shelter", "askEarth", "science"];
const CREW: CrewId[] = ["a1", "a2", "a3"];

/** Every distinct sol plan (crew are interchangeable except when tired, so use multisets): 56 plans. */
function solPlans(): Plan[] {
  const out: Plan[] = [];
  for (let i = 0; i < CHOICES.length; i++)
    for (let j = i; j < CHOICES.length; j++)
      for (let k = j; k < CHOICES.length; k++) {
        const p: Plan = {};
        [CHOICES[i], CHOICES[j], CHOICES[k]].forEach((job, n) => job && (p[CREW[n]] = job));
        out.push(p);
      }
  return out;
}

/** Give the plan's jobs to astronauts who are awake first. */
function assign(plan: Plan, tired: CrewId[]): Plan {
  const jobs = Object.values(plan);
  const awake = [...CREW.filter((c) => !tired.includes(c)), ...CREW.filter((c) => tired.includes(c))];
  const p: Plan = {};
  jobs.forEach((j, n) => (p[awake[n]] = j));
  return p;
}

function play(plans: Plan[]): GameState {
  const { events, forecasts } = may2024Mission();
  let g = createGame();
  for (const p of plans) {
    if (g.over) break;
    g = step(g, assign(p, g.tired), events, forecasts).state;
  }
  return g;
}

function chainLength(dominoes: Domino[]): number {
  const byId = new Map(dominoes.map((d) => [d.id, d]));
  const depth = (d: Domino): number => 1 + Math.max(0, ...d.causeIds.map((c) => (byId.has(c) ? depth(byId.get(c)!) : 0)));
  return Math.max(0, ...dominoes.map(depth));
}

const PLANS = solPlans();
function* allMissions(): Generator<Plan[]> {
  for (const a of PLANS) for (const b of PLANS) for (const c of PLANS) yield [a, b, c];
}

/** One streaming pass over every mission; keeps only the facts the tests need (not 175k game states). */
function survey() {
  let longest = 0;
  let free = 0;
  let badCause = "";
  let outOfRange = 0;
  let demoStory = false;
  for (const plans of allMissions()) {
    const g = play(plans);
    longest = Math.max(longest, chainLength(g.dominoes));
    if (g.dominoes.length === 0) free++;
    const seen = new Map<string, number>();
    for (const d of g.dominoes) {
      for (const c of d.causeIds) if (!badCause && (!seen.has(c) || seen.get(c)! > d.sol)) badCause = `${d.id} ← ${c}`;
      seen.set(d.id, d.sol);
    }
    if (Object.values(g.bars).some((v) => v < 0 || v > 10)) outOfRange++;
    if (!demoStory && traces(g, "sol1-panels-skipped", "domino.crewTired")) demoStory = true;
  }
  return { longest, free, badCause, outOfRange, demoStory };
}

function traces(g: GameState, fromId: string, toKey: string): boolean {
  const byId = new Map(g.dominoes.map((d) => [d.id, d]));
  const walk = (d: Domino | undefined): boolean => !!d && (d.id === fromId || d.causeIds.some((c) => walk(byId.get(c))));
  return g.dominoes.some((d) => d.textKey === toKey && walk(d));
}

describe("whole mission (brute force over all 175,616 plans)", () => {
  const r = survey();

  it("has 3 sols", () => expect(MISSION_SOLS).toBe(3));
  it("some plan produces a domino chain at least 3 links long", () => expect(r.longest).toBeGreaterThanOrEqual(3));
  it("no plan is free: every mission ends with at least one fallen domino", () => expect(r.free).toBe(0));
  it("every cause points to a domino that already fell", () => expect(r.badCause).toBe(""));
  it("bars always stay between 0 and 10", () => expect(r.outOfRange).toBe(0));
  it("the demo story works: skipping panels on sol 1 can end in a tired astronaut traced back to it", () => expect(r.demoStory).toBe(true));
});
