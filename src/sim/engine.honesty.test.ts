/** Judge-found honesty bugs: the preview, the numbers and the chain must tell the kid the truth. */
import { describe, expect, it } from "vitest";
import { may2024Mission } from "../data/mission";
import { createGame, knownEvents, step } from "./engine";
import { DOSE, JOBS, type GameState, type JobId, type Plan } from "./types";

const { events, forecasts } = may2024Mission();
const JOB_IDS = Object.keys(JOBS) as JobId[];
const play = (plans: Plan[], start = createGame()) =>
  plans.reduce((g, p) => step(g, p, events, forecasts).state, start);

describe("what the player knows (preview leak)", () => {
  it("a particle burst is never known in advance", () => {
    const sol2 = play([{ a1: "askEarth" }]);
    expect(
      knownEvents(sol2, events).some((e) => e.kind === "particleBurst"),
    ).toBe(false);
  });

  it("a storm cloud is known only after Earth warned about it", () => {
    const blind = play([{ a1: "greenhouse" }, { a1: "greenhouse" }]);
    expect(knownEvents(blind, events)).toEqual([]);
    const warned = play([{ a1: "askEarth" }, { a1: "greenhouse" }]);
    expect(knownEvents(warned, events).map((e) => e.sol)).toEqual([3]);
  });
});

describe("power is whole", () => {
  it("dusty panels give whole power units, so the shown number is the rule", () => {
    const g: GameState = { ...createGame(), panelEfficiency: 0.5 };
    const p = step(g, { a1: "greenhouse", a2: "shelter", a3: "askEarth" }, [])
      .state.bars.power;
    expect(Number.isInteger(p)).toBe(true);
  });
});

describe("assigned but no power", () => {
  it("says there was not enough power, not that nobody did the job", () => {
    const g: GameState = {
      ...createGame(),
      bars: { power: 0, air: 6, dose: 0 },
    };
    const fell = step(g, { a1: "greenhouse", a2: "askEarth" }, []).fell;
    const byId = new Map(fell.map((d) => [d.id, d]));
    expect(byId.get("sol1-greenhouse-skipped")?.textKey).toBe(
      "domino.noPowerGreenhouse",
    );
    expect(byId.get("sol1-greenhouse-skipped")?.causeIds).toEqual([
      "sol1-power-low",
    ]);
    expect(byId.get("sol1-askEarth-skipped")?.textKey).toBe(
      "domino.noPowerAskEarth",
    );
  });
});

describe("space-ray blame", () => {
  it("astronauts outside during a burst are a cause of the dose", () => {
    const r = step(createGame(), { a1: "science" }, [{ ...events[0], sol: 1 }]);
    const dose = r.fell.find((d) => d.id === "sol1-dose-high");
    expect(dose?.causeIds[0]).toBe("sol1-outside-storm");
    expect(r.fell.find((d) => d.id === "sol1-outside-storm")?.textKey).toBe(
      "domino.outsideStorm",
    );
  });

  it("the meter never saturates, so the storm always shows its real jump", () => {
    for (const a of JOB_IDS)
      for (const b of JOB_IDS) {
        const p: Plan = { a1: a, a2: b, a3: "science" };
        const before = play([p, p]);
        const after = play([p], before);
        expect(after.bars.dose).toBeLessThan(DOSE.meterMax);
        expect(after.bars.dose).toBeGreaterThan(before.bars.dose);
      }
  });
});
