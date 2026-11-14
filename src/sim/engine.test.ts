import { describe, expect, it } from "vitest";
import { may2024Mission } from "../data/mission";
import { ENGINE, initialState, stars, step } from "./engine";
import type { CrewId, Domino, EarthAnswer, GameState, JobId, Plan, StormEvent } from "./types";
import { DOSE, JOBS, MISSION_SOLS, NIGHT } from "./types";

const CREW: CrewId[] = ["a1", "a2", "a3"];
const JOB_IDS = Object.keys(JOBS) as JobId[];

const burstOn = (sol: number): StormEvent => ({
  sol,
  kind: "particleBurst",
  captionKey: "event.burst.test",
  source: { label: "test burst", url: "https://example.test/burst", mode: "constant" },
});
const cloudOn = (sol: number): StormEvent => ({
  sol,
  kind: "stormCloud",
  captionKey: "event.cloud.test",
  source: { label: "test cloud", url: "https://example.test/cloud", mode: "snapshot" },
});

/** Plan in crew order: plan('panels', 'greenhouse') → a1 panels, a2 greenhouse, a3 idle. */
function plan(...jobs: (JobId | undefined)[]): Plan {
  const p: Plan = {};
  jobs.forEach((j, i) => {
    if (j) p[CREW[i]] = j;
  });
  return p;
}

function run(plans: Plan[], events: StormEvent[] = []): GameState {
  return plans.reduce((s, p) => step(s, p, events).state, initialState());
}

function deepFreeze<T>(o: T): T {
  if (o && typeof o === "object") {
    Object.values(o).forEach(deepFreeze);
    Object.freeze(o);
  }
  return o;
}

function depth(dominoes: Domino[], id: string): number {
  const d = dominoes.find((x) => x.id === id);
  if (!d) return 0;
  return 1 + Math.max(0, ...d.causeIds.map((c) => depth(dominoes, c)));
}

function ids(dominoes: Domino[]): string[] {
  return dominoes.map((d) => d.id);
}

/** Every possible one-sol plan: each astronaut gets one of the 5 jobs or stays idle (6^3 = 216). */
const ALL_PLANS: Plan[] = (() => {
  const options: (JobId | undefined)[] = [...JOB_IDS, undefined];
  const out: Plan[] = [];
  for (const x of options) for (const y of options) for (const z of options) out.push(plan(x, y, z));
  return out;
})();

/**
 * Plays every 3-sol plan sequence (216^3 ≈ 10M) by merging identical states.
 * Returns each distinct final state with how many plan sequences reach it.
 */
function bruteForce(events: StormEvent[]): { state: GameState; count: number }[] {
  const key = (s: GameState) =>
    JSON.stringify([s.sol, s.over, s.bars, s.food, s.science, s.panelEfficiency, s.shelterSols, s.tired, s.earthAnswer]);
  let layer = new Map<string, { state: GameState; count: number }>([[key(initialState()), { state: initialState(), count: 1 }]]);
  for (let sol = 1; sol <= MISSION_SOLS; sol++) {
    const next = new Map<string, { state: GameState; count: number }>();
    for (const { state, count } of layer.values()) {
      for (const p of ALL_PLANS) {
        const s = step(state, p, events).state;
        const k = key(s);
        const hit = next.get(k);
        if (hit) hit.count += count;
        else next.set(k, { state: s, count });
      }
    }
    layer = next;
  }
  return [...layer.values()];
}

describe("initialState", () => {
  it("starts on sol 1 with clean panels, full daily power and nothing done yet", () => {
    const s = initialState();
    expect(s.sol).toBe(1);
    expect(s.over).toBe(false);
    expect(s.panelEfficiency).toBe(1);
    expect(s.bars.power).toBe(NIGHT.solarPowerAtFullEfficiency);
    expect(s.bars.dose).toBe(0);
    expect(s.bars.air).toBe(ENGINE.startAir);
    expect(s.food).toBe(ENGINE.startFood);
    expect(s.science).toBe(0);
    expect(s.shelterSols).toBe(0);
    expect(s.tired).toEqual([]);
    expect(s.dominoes).toEqual([]);
    expect(s.earthAnswer).toBeUndefined();
  });

  it("returns a fresh object each time", () => {
    const a = initialState();
    a.bars.air = 0;
    expect(initialState().bars.air).toBe(ENGINE.startAir);
  });
});

describe("step: contract", () => {
  it("is deterministic: same input gives the same output", () => {
    const p = plan("greenhouse", "shelter", "science");
    const events = [burstOn(1)];
    expect(step(initialState(), p, events)).toEqual(step(initialState(), p, events));
  });

  it("is pure: does not change the state, plan or events it is given", () => {
    const s = deepFreeze(initialState());
    const p = deepFreeze(plan("panels", "greenhouse", "askEarth"));
    const ev = deepFreeze([burstOn(1), cloudOn(3)]);
    expect(() => step(s, p, ev)).not.toThrow();
  });

  it("appends the fallen dominoes to state.dominoes", () => {
    const first = step(initialState(), plan("greenhouse"), []);
    expect(first.fell.length).toBeGreaterThan(0);
    expect(first.state.dominoes).toEqual(first.fell);
    const second = step(first.state, plan("greenhouse"), []);
    expect(second.state.dominoes).toEqual([...first.fell, ...second.fell]);
  });

  it("gives every domino a unique id, an icon, a text key, and causes that already fell", () => {
    const s = run([plan("greenhouse", "shelter", "science"), plan("greenhouse", "science", "askEarth"), plan()], [burstOn(2)]);
    const seen = new Set<string>();
    for (const d of s.dominoes) {
      expect(seen.has(d.id), d.id).toBe(false);
      expect(d.icon).not.toBe("");
      expect(d.textKey).toMatch(/^domino\./);
      for (const c of d.causeIds) expect(seen.has(c), `${d.id} ← ${c}`).toBe(true);
      seen.add(d.id);
    }
  });
});

describe("step: sols and the end of the mission", () => {
  it("moves to the next sol and ends after sol 3", () => {
    let s = initialState();
    for (let sol = 1; sol <= MISSION_SOLS; sol++) {
      expect(s.sol).toBe(sol);
      expect(s.over).toBe(false);
      s = step(s, plan("panels", "greenhouse", "shelter"), []).state;
    }
    expect(s.over).toBe(true);
    expect(s.sol).toBe(MISSION_SOLS);
  });

  it("does nothing once the mission is over", () => {
    const done = run([plan(), plan(), plan()]);
    const again = step(done, plan("science"), []);
    expect(again.state).toEqual(done);
    expect(again.fell).toEqual([]);
  });

  it("ends the mission early when the air runs out", () => {
    const low: GameState = { ...initialState(), bars: { power: 0, air: 1, dose: 0 } };
    const r = step(low, plan(), []);
    expect(r.state.bars.air).toBe(0);
    expect(r.state.over).toBe(true);
  });
});

describe("jobs: cost today, and cost if skipped", () => {
  it("panels done → clean panels and full power tomorrow", () => {
    const dusty: GameState = { ...initialState(), panelEfficiency: 0.5, bars: { power: 3, air: 6, dose: 0 } };
    const s = step(dusty, plan("panels"), []).state;
    expect(s.panelEfficiency).toBe(1);
    expect(s.bars.power).toBe(NIGHT.solarPowerAtFullEfficiency);
  });

  it("panels skipped → dust: efficiency × 0.65 and tomorrow's power about a third lower", () => {
    const r = step(initialState(), plan("science"), []);
    expect(r.state.panelEfficiency).toBeCloseTo(ENGINE.dustFactor);
    expect(ENGINE.dustFactor).toBeCloseTo(0.65);
    expect(r.state.bars.power).toBeCloseTo(NIGHT.solarPowerAtFullEfficiency * 0.65);
    expect(ids(r.fell)).toContain("sol1-panels-skipped");
    const low = r.fell.find((d) => d.id === "sol2-power-low");
    expect(low?.causeIds).toEqual(["sol1-panels-skipped"]);
    expect(low?.sol).toBe(2);
  });

  it("dust builds up when panels are skipped two sols in a row", () => {
    const s = run([plan(), plan()]);
    expect(s.panelEfficiency).toBeCloseTo(0.65 * 0.65);
  });

  it("greenhouse costs 2 power and gives +1 food", () => {
    const r = step(initialState(), plan("greenhouse"), []);
    expect(r.state.food).toBe(ENGINE.startFood + 1);
    expect(ids(r.fell)).not.toContain("sol1-greenhouse-skipped");
  });

  it("greenhouse skipped → food −1; food 0 → one astronaut too tired next sol", () => {
    expect(ENGINE.startFood).toBe(1);
    const r = step(initialState(), plan("panels"), []);
    expect(r.state.food).toBe(0);
    expect(r.state.tired).toEqual(["a1"]);
    const empty = r.fell.find((d) => d.id === "sol1-food-empty");
    expect(empty?.causeIds).toEqual(["sol1-greenhouse-skipped"]);
    const tired = r.fell.find((d) => d.id === "sol2-tired");
    expect(tired?.causeIds).toEqual(["sol1-food-empty"]);
    expect(tired?.sol).toBe(2);
  });

  it("food never goes below 0", () => {
    expect(run([plan(), plan()]).food).toBe(0);
  });

  it("a tired astronaut does not work", () => {
    const tiredA1: GameState = { ...initialState(), tired: ["a1"] };
    const s = step(tiredA1, plan("science"), []).state;
    expect(s.science).toBe(0);
  });

  it("tiredness lasts one sol once there is food again", () => {
    const tiredA1: GameState = { ...initialState(), food: 0, tired: ["a1"] };
    const s = step(tiredA1, plan(undefined, "greenhouse"), []).state;
    expect(s.food).toBe(1);
    expect(s.tired).toEqual([]);
  });

  it("science gives +1 science and a small extra dose for going outside", () => {
    const r = step(initialState(), plan("science"), []);
    expect(r.state.science).toBe(1);
    expect(r.state.bars.dose).toBeCloseTo(DOSE.normalDay + DOSE.outsideExtra);
  });

  it("staying inside on a normal sol gives the normal Mars dose", () => {
    const r = step(initialState(), plan("greenhouse"), []);
    expect(r.state.bars.dose).toBeCloseTo(DOSE.normalDay);
  });

  it("two astronauts on the same job only do it once", () => {
    const r = step(initialState(), plan("science", "science"), []);
    expect(r.state.science).toBe(1);
  });

  it("shelter halves the dose today and tomorrow", () => {
    const r1 = step(initialState(), plan("shelter", "science"), []);
    expect(r1.state.bars.dose).toBeCloseTo((DOSE.normalDay + DOSE.outsideExtra) * DOSE.shelterFactor);
    const r2 = step(r1.state, plan("science"), []);
    expect(r2.state.bars.dose - r1.state.bars.dose).toBeCloseTo((DOSE.normalDay + DOSE.outsideExtra) * DOSE.shelterFactor);
    const r3 = step(r2.state, plan("science"), []);
    expect(r3.state.bars.dose - r2.state.bars.dose).toBeCloseTo(DOSE.normalDay + DOSE.outsideExtra);
  });
});

describe("power and the air machine", () => {
  it("jobs spend today's power, then the air machine needs 2 at night", () => {
    // 6 power: greenhouse 2 + shelter 1 + askEarth 1 = 4, air machine 2 → exactly enough.
    const r = step(initialState(), plan("greenhouse", "shelter", "askEarth"), []);
    expect(r.state.bars.air).toBe(ENGINE.startAir);
    expect(ids(r.fell)).not.toContain("sol1-air-drop");
  });

  it("not enough power left for the air machine → air drops by 3", () => {
    const low: GameState = { ...initialState(), bars: { power: 3, air: 6, dose: 0 } };
    const r = step(low, plan("greenhouse"), []);
    expect(r.state.bars.air).toBe(6 - NIGHT.airLossWithoutPower);
    expect(ids(r.fell)).toContain("sol1-air-drop");
  });

  it("a job that costs more power than is left does not run", () => {
    const low: GameState = { ...initialState(), bars: { power: 1, air: 6, dose: 0 } };
    const r = step(low, plan("greenhouse"), []);
    expect(r.state.food).toBe(0);
    expect(ids(r.fell)).toContain("sol1-greenhouse-nopower");
  });

  it("bars stay inside 0–10", () => {
    for (const p of ALL_PLANS) {
      const { bars } = run([p, p, p], [burstOn(2)]);
      for (const v of Object.values(bars)) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(10);
      }
    }
  });
});

describe("particle burst", () => {
  it("staying inside gives the inside burst dose", () => {
    const r = step(initialState(), plan("greenhouse"), [burstOn(1)]);
    expect(r.state.bars.dose).toBeCloseTo(DOSE.burstInside);
    expect(r.fell.find((d) => d.id === "sol1-burst")?.source?.url).toBe("https://example.test/burst");
  });

  it("being outside in a burst gives the big dose (39 × a normal day)", () => {
    const r = step(initialState(), plan("science"), [burstOn(1)]);
    expect(r.state.bars.dose).toBeCloseTo(DOSE.burstOutside);
    const big = r.fell.find((d) => d.id === "sol1-dose-big");
    expect(big?.causeIds).toContain("sol1-burst");
  });

  it("a shelter built the sol before halves the burst", () => {
    const s = run([plan("shelter"), plan("science")], [burstOn(2)]);
    expect(s.bars.dose).toBeCloseTo(DOSE.normalDay * DOSE.shelterFactor + DOSE.burstOutside * DOSE.shelterFactor);
  });

  it("only hits on its own sol", () => {
    const r = step(initialState(), plan("science"), [burstOn(2)]);
    expect(r.state.bars.dose).toBeCloseTo(DOSE.normalDay + DOSE.outsideExtra);
    expect(ids(r.fell)).not.toContain("sol1-burst");
  });
});

describe("Ask Earth", () => {
  const answer: EarthAnswer = {
    dustTomorrow: "dusty",
    stormCloudInSols: 1,
    source: { label: "test forecast", url: "https://example.test/f", mode: "snapshot" },
  };

  it("done → Earth's forecast for this sol is waiting next morning", () => {
    const r = step(initialState(), plan("askEarth"), [], { 1: answer });
    expect(r.state.earthAnswer).toEqual(answer);
  });

  it("without a forecast table, Earth answers from the mission's events", () => {
    const r = step(initialState(), plan("askEarth"), [cloudOn(3)]);
    expect(r.state.earthAnswer?.stormCloudInSols).toBe(1);
    expect(r.state.earthAnswer?.dustTomorrow).toBe("dusty");
    expect(r.state.earthAnswer?.source.url).toBe("https://example.test/cloud");
  });

  it("skipped → no answer next morning (plan blind)", () => {
    const first = step(initialState(), plan("askEarth"), [], { 1: answer }).state;
    const r = step(first, plan("panels"), [], { 2: answer });
    expect(r.state.earthAnswer).toBeUndefined();
    expect(ids(r.fell)).toContain("sol2-askEarth-skipped");
  });
});

describe("stars", () => {
  it("3★: crew safe, base running, science goal reached", () => {
    const s = run(
      [plan("panels", "greenhouse", "shelter"), plan("panels", "greenhouse", "science"), plan("panels", "greenhouse", "science")],
      [burstOn(2)],
    );
    expect(stars(s)).toEqual({ crewSafe: true, baseRunning: true, science: true, count: 3 });
  });

  it("crew not safe when the dose reaches the limit", () => {
    const s: GameState = { ...initialState(), bars: { power: 6, air: 6, dose: ENGINE.doseLimit } };
    expect(stars(s).crewSafe).toBe(false);
  });

  it("base not running when the air hit 0", () => {
    const s: GameState = { ...initialState(), bars: { power: 6, air: 0, dose: 0 } };
    expect(stars(s).baseRunning).toBe(false);
  });

  it("science goal needs ENGINE.scienceGoal science", () => {
    expect(stars({ ...initialState(), science: ENGINE.scienceGoal - 1 }).science).toBe(false);
    expect(stars({ ...initialState(), science: ENGINE.scienceGoal }).science).toBe(true);
  });
});

describe("the built-in domino chain (concept.md)", () => {
  it("skip panels on sol 1 → power low sol 2 → air drops sol 2 night → air warning sol 3", () => {
    const s = run([plan("greenhouse", "shelter", "science"), plan("greenhouse", "science", "askEarth")], [burstOn(2)]);
    expect(s.dominoes.find((d) => d.id === "sol2-power-low")?.causeIds).toEqual(["sol1-panels-skipped"]);
    expect(s.dominoes.find((d) => d.id === "sol2-air-drop")?.causeIds).toContain("sol2-power-low");
    const warning = s.dominoes.find((d) => d.id === "sol3-air-low");
    expect(warning?.sol).toBe(3);
    expect(warning?.causeIds).toContain("sol2-air-drop");
    expect(depth(s.dominoes, "sol3-air-low")).toBeGreaterThanOrEqual(3);
  });

  it("skip the greenhouse on sol 1 → food 0 → an astronaut too tired on sol 2", () => {
    const s = run([plan("panels", "shelter", "science")]);
    expect(depth(s.dominoes, "sol2-tired")).toBeGreaterThanOrEqual(3);
  });
});

describe("balance (brute force over every 3-sol plan, May 2024 mission)", () => {
  const mission = may2024Mission();
  const finals = bruteForce(mission.events);
  const total = finals.reduce((n, f) => n + f.count, 0);
  const withStars = (k: number) => finals.filter((f) => stars(f.state).count === k).reduce((n, f) => n + f.count, 0);

  it("covers every plan sequence", () => {
    expect(total).toBe(ALL_PLANS.length ** MISSION_SOLS);
  });

  it("3★ is reachable", () => {
    expect(withStars(3)).toBeGreaterThan(0);
  });

  it("several 2–3★ plans exist", () => {
    expect(withStars(2) + withStars(3)).toBeGreaterThan(1);
  });

  it("is not trivial: most plans miss at least one star", () => {
    expect(withStars(3) / total).toBeLessThan(0.5);
  });

  it("no plan is free: every sol, every plan leaves at least 2 jobs undone, each with a domino", () => {
    for (const p of ALL_PLANS) {
      const costs = step(initialState(), p, mission.events).fell.filter((d) => /-(skipped|nopower)$/.test(d.id));
      expect(costs.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("works with the real May 2024 mission setup end to end", () => {
    let s = initialState();
    s = step(s, plan("panels", "shelter", "askEarth"), mission.events, mission.forecasts).state;
    expect(s.earthAnswer).toEqual(mission.forecasts[1]);
    s = step(s, plan("panels", "greenhouse", "askEarth"), mission.events, mission.forecasts).state;
    expect(s.dominoes.some((d) => d.id === "sol2-burst")).toBe(true);
    expect(s.earthAnswer).toEqual(mission.forecasts[2]);
    s = step(s, plan("panels", "greenhouse", "science"), mission.events, mission.forecasts).state;
    expect(s.over).toBe(true);
  });
});
