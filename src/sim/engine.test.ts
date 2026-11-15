/**
 * Engine spec (#1), written BEFORE the engine. Numbers come from src/sim/types.ts (JOBS, NIGHT, DOSE),
 * never literals, so tuning the game numbers doesn't break these tests.
 * Domino ids/text keys match the screens: id `sol{N}-{name}`, textKey `domino.{key}` (see en.json "domino").
 */
import { describe, expect, it } from "vitest";
import { createGame, step } from "./engine";
import { DOSE, JOBS, MISSION_SOLS, type EarthAnswer, type GameState, type Plan, type StormEvent } from "./types";
import { RAD_STORM } from "../data/sources";

const NONE: StormEvent[] = [];
const burst = (sol: number): StormEvent => ({ sol, kind: "particleBurst", captionKey: "event.burst.may2024", source: RAD_STORM });
const keys = (s: GameState) => s.dominoes.map((d) => d.textKey);
/** A plan with nobody outside and the panels + greenhouse covered, so only the job under test differs. */
const safe: Plan = { a1: "panels", a2: "greenhouse", a3: "shelter" };

describe("createGame", () => {
  it("starts on sol 1 with bars in range, clean panels, no dose, nothing fallen", () => {
    const g = createGame();
    expect(g.sol).toBe(1);
    expect(g.over).toBe(false);
    expect(g.panelEfficiency).toBe(1);
    expect(g.bars.dose).toBe(0);
    for (const v of [g.bars.power, g.bars.air]) expect(v).toBeGreaterThan(0), expect(v).toBeLessThanOrEqual(10);
    expect(g.food).toBeGreaterThan(0);
    expect(g.dominoes).toEqual([]);
    expect(g.tired).toEqual([]);
  });
});

describe("step: pure and deterministic", () => {
  it("same input gives the same output", () => {
    const g = createGame();
    expect(step(g, safe, [burst(1)])).toEqual(step(g, safe, [burst(1)]));
  });

  it("never changes the state it was given", () => {
    const g = createGame();
    const before = structuredClone(g);
    step(g, { a1: "science" }, [burst(1)]);
    expect(g).toEqual(before);
  });

  it("moves to the next sol and ends after the last one", () => {
    let g = createGame();
    for (let s = 1; s <= MISSION_SOLS; s++) {
      expect(g.sol).toBe(s);
      expect(g.over).toBe(false);
      g = step(g, safe, NONE).state;
    }
    expect(g.over).toBe(true);
  });

  it("does nothing once the mission is over", () => {
    let g = createGame();
    for (let s = 1; s <= MISSION_SOLS; s++) g = step(g, safe, NONE).state;
    const r = step(g, safe, NONE);
    expect(r.state).toEqual(g);
    expect(r.fell).toEqual([]);
  });

  it("returns the dominoes it created and also appends them to the state", () => {
    const r = step(createGame(), {}, NONE);
    expect(r.fell.length).toBeGreaterThan(0);
    expect(r.state.dominoes.slice(-r.fell.length)).toEqual(r.fell);
  });
});

describe("jobs: every job costs something today, every skipped job costs something later", () => {
  it("cleaning panels keeps them at full strength", () => {
    expect(step(createGame(), safe, NONE).state.panelEfficiency).toBe(1);
  });

  it("skipping panels makes them dusty (×0.65, InSight) and drops a domino with no cause", () => {
    const r = step(createGame(), { a2: "greenhouse", a3: "shelter" }, NONE);
    expect(r.state.panelEfficiency).toBeCloseTo(0.65);
    const d = r.fell.find((x) => x.textKey === "domino.panelsSkipped")!;
    expect(d.id).toBe("sol1-panels-skipped");
    expect(d.causeIds).toEqual([]);
  });

  it("the greenhouse makes food and costs power", () => {
    const g = createGame();
    const with_ = step(g, { a1: "panels", a2: "greenhouse" }, NONE).state;
    const without = step(g, { a1: "panels", a2: "shelter" }, NONE).state;
    expect(with_.food).toBe(g.food + 1);
    // shelter costs JOBS.shelter.powerCost, greenhouse JOBS.greenhouse.powerCost
    expect(without.bars.power - with_.bars.power).toBeCloseTo(JOBS.greenhouse.powerCost - JOBS.shelter.powerCost);
  });

  it("skipping the greenhouse costs food and drops a domino", () => {
    const g = createGame();
    const r = step(g, { a1: "panels", a3: "shelter" }, NONE);
    expect(r.state.food).toBe(g.food - 1);
    expect(keys(r.state)).toContain("domino.greenhouseSkipped");
  });

  it("when food runs out, an astronaut is too tired to work next sol, caused by the empty food", () => {
    let g: GameState = { ...createGame(), food: 1 };
    g = step(g, { a1: "panels", a3: "shelter" }, NONE).state;
    expect(g.food).toBe(0);
    expect(g.tired.length).toBe(1);
    const tired = g.dominoes.find((d) => d.textKey === "domino.crewTired")!;
    const empty = g.dominoes.find((d) => d.textKey === "domino.foodEmpty")!;
    expect(tired.causeIds).toContain(empty.id);
  });

  it("a tired astronaut's job doesn't happen", () => {
    const g: GameState = { ...createGame(), tired: ["a1"] };
    const r = step(g, { a1: "panels", a2: "greenhouse", a3: "shelter" }, NONE);
    expect(r.state.panelEfficiency).toBeCloseTo(0.65);
  });

  it("a science trip earns science and extra space rays", () => {
    const g = createGame();
    const inside = step(g, { a1: "panels", a2: "greenhouse" }, NONE).state;
    const trip = step(g, { a1: "panels", a2: "greenhouse", a3: "science" }, NONE).state;
    expect(trip.science).toBe(g.science + 1);
    expect(trip.bars.dose - inside.bars.dose).toBeCloseTo(DOSE.outsideExtra);
  });

  it("Ask Earth puts Earth's forecast into the next morning; otherwise there is none", () => {
    const answer: EarthAnswer = { dustTomorrow: "dusty", stormCloudInSols: 1, source: RAD_STORM };
    const g = createGame();
    // The storm part comes from the mission's forecast; the dust part follows the panels (skipped here → dusty).
    expect(step(g, { a1: "askEarth" }, NONE, { 1: answer }).state.earthAnswer).toMatchObject(answer);
    expect(step(g, { a1: "panels" }, NONE, { 1: answer }).state.earthAnswer).toBeUndefined();
  });
});

describe("power and air", () => {
  it("dusty panels mean less power the next sol", () => {
    const clean = step(step(createGame(), safe, NONE).state, safe, NONE).state;
    const dusty = step(step(createGame(), { a2: "greenhouse", a3: "shelter" }, NONE).state, safe, NONE).state;
    expect(dusty.bars.power).toBeLessThan(clean.bars.power);
    expect(dusty.dominoes.some((d) => d.textKey === "domino.powerLow" && d.causeIds.includes("sol1-panels-skipped"))).toBe(true);
  });

  it("without enough power for the air machine, the air drops, caused by low power", () => {
    const g: GameState = { ...createGame(), bars: { power: 0, air: 8, dose: 0 }, panelEfficiency: 0 };
    const r = step(g, {}, NONE);
    expect(r.state.bars.air).toBeLessThan(8);
    const air = r.fell.find((d) => d.textKey === "domino.airLow")!;
    const low = r.fell.find((d) => d.textKey === "domino.powerLow")!;
    expect(air.causeIds).toContain(low.id);
  });

  it("the mission ends early when the air runs out", () => {
    const g: GameState = { ...createGame(), bars: { power: 0, air: 1, dose: 0 }, panelEfficiency: 0 };
    const r = step(g, {}, NONE);
    expect(r.state.bars.air).toBe(0);
    expect(r.state.over).toBe(true);
  });
});

describe("space rays (the huge storm stands for 20 May 2024, Curiosity RAD)", () => {
  it("a normal day inside adds the normal daily dose", () => {
    const g = createGame();
    expect(step(g, { a1: "panels", a2: "greenhouse" }, NONE).state.bars.dose).toBeCloseTo(g.bars.dose + DOSE.normalDay + DOSE.outsideExtra);
    expect(step(g, { a2: "greenhouse" }, NONE).state.bars.dose).toBeCloseTo(g.bars.dose + DOSE.normalDay);
  });

  it("a burst hurts more if someone is outside, and drops a domino with the real source", () => {
    const g = createGame();
    const inside = step(g, { a2: "greenhouse" }, [burst(1)]);
    const outside = step(g, { a1: "science", a2: "greenhouse" }, [burst(1)]);
    expect(outside.state.bars.dose).toBeGreaterThan(inside.state.bars.dose);
    const d = inside.fell.find((x) => x.textKey === "domino.doseHigh")!;
    expect(d.source).toEqual(RAD_STORM);
  });

  it("the shelter halves storm rays today and tomorrow", () => {
    const g = createGame();
    const bare = step(g, { a2: "greenhouse" }, [burst(1)]).state.bars.dose - g.bars.dose;
    const sheltered = step(g, { a2: "greenhouse", a3: "shelter" }, [burst(1)]);
    expect(sheltered.state.bars.dose - g.bars.dose).toBeLessThan(bare);
    expect(sheltered.state.shelterSols).toBeGreaterThan(0);
  });

  it("events on other sols do nothing today", () => {
    const g = createGame();
    expect(step(g, safe, [burst(2)]).state).toEqual(step(g, safe, NONE).state);
  });
});

describe("bars stay in range", () => {
  it("power and air are clamped to 0–10, dose to 0–DOSE.meterMax", () => {
    const g: GameState = { ...createGame(), bars: { power: 10, air: 10, dose: 24.9 } };
    const r = step(g, { a1: "science", a2: "science", a3: "science" }, [burst(1)]).state;
    for (const [k, v] of Object.entries(r.bars)) expect(v).toBeGreaterThanOrEqual(0), expect(v).toBeLessThanOrEqual(k === "dose" ? DOSE.meterMax : 10);
  });
});
