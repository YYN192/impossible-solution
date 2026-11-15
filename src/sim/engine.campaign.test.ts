/**
 * Engine rules added for campaigns and for "every choice costs something":
 * air that moves, a full space-ray meter, base-ready star, campaign rules, beat actions.
 */
import { describe, expect, it } from "vitest";
import { ENGINE, act, canAct, createGame, rulesOf, stars, step } from "./engine";
import {
  CLASSIC_RULES,
  DOSE,
  NIGHT,
  type Action,
  type DataRef,
  type GameState,
  type StormEvent,
} from "./types";

const ref: DataRef = { label: "test", url: "https://example.org", mode: "constant" };
const burst = (sol: number, extra: Partial<StormEvent> = {}): StormEvent => ({
  sol,
  kind: "particleBurst",
  captionKey: "event.burst.may2024",
  source: ref,
  ...extra,
});
const cloud = (sol: number): StormEvent => ({
  sol,
  kind: "stormCloud",
  captionKey: "event.stormCloud.may2024",
  source: ref,
});
const ids = (s: GameState) => s.dominoes.map((d) => d.id);

describe("every choice costs something", () => {
  it("air moves every sol: up with the air machine, down without it", () => {
    const ok = step(createGame(), {}, []).state;
    expect(ok.bars.air).toBe(ENGINE.startAir + NIGHT.airGainWithPower);
    const dark = step({ ...createGame(), bars: { power: 1, air: 5, dose: 0 } }, {}, []).state;
    expect(dark.bars.air).toBe(5 - NIGHT.airLossWithoutPower);
  });

  it("idle crew still eat: an empty plan costs 1 food", () => {
    const s = step({ ...createGame(), food: 2 }, {}, []).state;
    expect(s.food).toBe(1);
  });

  it("a full space-ray meter ends the mission early, with a domino that says why", () => {
    const start = { ...createGame(), bars: { power: 6, air: 6, dose: DOSE.meterMax - 1 } };
    const { state } = step(start, { a1: "science", a2: "panels" }, [burst(1)]);
    expect(state.bars.dose).toBe(DOSE.meterMax);
    expect(state.over).toBe(true);
    expect(state.sol).toBe(1);
    const full = state.dominoes.find((d) => d.id === "sol1-dose-full");
    expect(full?.causeIds).toContain("sol1-dose-high");
  });

  it("the base star needs power, air and food left for tomorrow", () => {
    const good: GameState = { ...createGame(), bars: { power: 6, air: 8, dose: 0 }, food: 1 };
    expect(stars(good).baseRunning).toBe(true);
    expect(stars({ ...good, food: 0 }).baseRunning).toBe(false);
    expect(stars({ ...good, bars: { ...good.bars, power: ENGINE.lowPowerToday - 1 } }).baseRunning).toBe(false);
    expect(stars({ ...good, bars: { ...good.bars, air: ENGINE.airReady - 1 } }).baseRunning).toBe(false);
  });

  it("an idle mission cannot earn 2 stars", () => {
    let s = createGame();
    for (let i = 0; i < 3; i++) s = step(s, {}, [burst(2), cloud(3)]).state;
    expect(stars(s).count).toBeLessThan(2);
  });
});

describe("Earth's answer", () => {
  it("the dust forecast follows the panels, even when the mission has a forecast table", () => {
    const table = { 1: { dustTomorrow: "dusty" as const, source: ref } };
    const cleaned = step(createGame(), { a1: "askEarth", a2: "panels" }, [], table).state;
    expect(cleaned.earthAnswer?.dustTomorrow).toBe("clear");
    const skipped = step(createGame(), { a1: "askEarth" }, [], table).state;
    expect(skipped.earthAnswer?.dustTomorrow).toBe("dusty");
  });

  it("gives the burst chance for the next sol: high the sol before a burst, low otherwise", () => {
    const events = [burst(2)];
    expect(step(createGame(), { a1: "askEarth" }, events).state.earthAnswer?.burstRisk).toBe("high");
    expect(step(createGame(), { a1: "askEarth" }, [burst(3)]).state.earthAnswer?.burstRisk).toBe("low");
  });

  it("gets no signal on a sol when Earth is out of view", () => {
    const start = createGame({ earthHidden: [1] });
    const { state } = step(start, { a1: "askEarth" }, []);
    expect(state.earthAnswer).toBeUndefined();
    expect(ids(state)).toContain("sol1-no-signal");
    expect(state.bars.power).toBeGreaterThan(step(createGame(), { a1: "askEarth" }, []).state.bars.power - 1);
  });
});

describe("campaign rules", () => {
  it("the classic rules are the default", () => {
    expect(rulesOf(createGame())).toEqual(CLASSIC_RULES);
  });

  it("a campaign can be longer than 3 sols", () => {
    let s = createGame({ sols: 5 });
    for (let i = 0; i < 4; i++) s = step(s, { a1: "greenhouse", a2: "panels" }, []).state;
    expect(s.over).toBe(false);
    expect(s.sol).toBe(5);
    s = step(s, { a1: "greenhouse" }, []).state;
    expect(s.over).toBe(true);
  });

  it("starts with one sol of the campaign's solar power", () => {
    expect(createGame({ solar: 4 }).bars.power).toBe(4);
  });

  it("a cold site needs heater power every night; unpaid, the plants freeze", () => {
    const warm = step(createGame({ heater: 1 }), {}, []).state;
    expect(warm.bars.power).toBe(step(createGame(), {}, []).state.bars.power - 1);
    expect(ids(warm)).not.toContain("sol1-cold-night");
    const start = { ...createGame({ heater: 2 }), bars: { power: 3, air: 5, dose: 0 }, food: 3 };
    const cold = step(start, {}, []).state;
    expect(ids(cold)).toContain("sol1-cold-night");
    expect(cold.food).toBe(1);
    expect(cold.bars.air).toBe(6);
  });

  it("a dust storm cuts the solar power of its sol by the real factor", () => {
    const storm: StormEvent = { sol: 1, kind: "dustStorm", captionKey: "x", source: ref, solar: 0.5 };
    const clear = step(createGame(), { a1: "panels" }, []).state.bars.power;
    const dusty = step(createGame(), { a1: "panels" }, [storm]).state.bars.power;
    expect(clear - dusty).toBe(NIGHT.solarPowerAtFullEfficiency * 0.5);
    expect(ids(step(createGame(), { a1: "panels" }, [storm]).state)).toContain("sol1-dust-storm");
  });

  it("a storm can carry its own dose, scaled from its real measurement", () => {
    const small = burst(1, { dose: { inside: 0.5, outside: 1.5 } });
    expect(step(createGame(), {}, [small]).state.bars.dose).toBeCloseTo(0.5);
    expect(step(createGame(), { a1: "science" }, [small]).state.bars.dose).toBeCloseTo(1.5);
  });

  it("the science star uses the campaign's goal", () => {
    const s = { ...createGame({ scienceGoal: 3 }), science: 2 };
    expect(stars(s).science).toBe(false);
    expect(stars({ ...s, science: 3 }).science).toBe(true);
  });
});

describe("act: one beat choice changes the game through the engine", () => {
  const lamps: Action = { id: "dilemma-lamps", icon: "lamp", textKey: "beat.x", effect: { food: -1, shelterSols: 2 } };

  it("applies the effect and drops a root domino for the choice", () => {
    const { state, fell } = act({ ...createGame(), food: 2 }, lamps);
    expect(state.food).toBe(1);
    expect(state.shelterSols).toBe(2);
    expect(fell).toHaveLength(1);
    expect(fell[0]).toMatchObject({ id: "sol1-dilemma-lamps", sol: 1, causeIds: [] });
    expect(state.dominoes).toContain(fell[0]);
  });

  it("is pure and deterministic", () => {
    const start = createGame();
    const copy = structuredClone(start);
    expect(act(start, lamps)).toEqual(act(start, lamps));
    expect(start).toEqual(copy);
  });

  it("a choice that costs more power than there is cannot be taken", () => {
    const costly: Action = { id: "upgrade-battery", icon: "battery", textKey: "beat.x", effect: { power: -7 } };
    expect(canAct(createGame(), costly)).toBe(false);
    expect(act(createGame(), costly).state).toEqual(createGame());
    expect(canAct(createGame(), lamps)).toBe(true);
  });

  it("the next problem with that resource names the choice as a cause", () => {
    // Wiping only a little leaves the panels dusty: tomorrow's low power points back at the wipe.
    const wipe: Action = { id: "wipe-1", icon: "wipe", textKey: "beat.x", effect: { panelEfficiency: 0.4, dose: 0.1 } };
    const after = act({ ...createGame(), panelEfficiency: 0.3 }, wipe).state;
    expect(after.panelEfficiency).toBe(0.4);
    expect(act(createGame(), wipe).state.panelEfficiency).toBe(1); // clean panels stay clean
    expect(after.bars.dose).toBeCloseTo(0.1);
    const next = step(after, { a1: "greenhouse", a2: "shelter", a3: "askEarth" }, []).state;
    const low = next.dominoes.find((d) => d.id === "sol2-power-low");
    expect(low?.causeIds).toContain("sol1-wipe-1");
  });

  it("a site or an upgrade changes the rules for the rest of the mission", () => {
    const site: Action = { id: "site-ridge", icon: "pin", textKey: "beat.x", rules: { solar: 8, heater: 1 } };
    const s = act(createGame({ sols: 5 }), site).state;
    expect(rulesOf(s)).toMatchObject({ sols: 5, solar: 8, heater: 1 });
  });

  it("radio on Mars: the answer comes with the next morning, without the Ask Earth job", () => {
    const radio: Action = { id: "radio-storm", icon: "radio", textKey: "beat.x", effect: { power: -1 }, ask: "night" };
    const asked = act(createGame(), radio, [cloud(3)]).state;
    expect(asked.earthAnswer).toBeUndefined();
    expect(asked.bars.power).toBe(createGame().bars.power - 1);
    const morning = step(asked, {}, [cloud(3)]).state;
    expect(morning.earthAnswer?.stormCloudInSols).toBe(1);
    expect(morning.warnedSols).toEqual([3]);
    expect(morning.radioed).toBeUndefined();
  });

  it("radio on the Moon: the answer is there at once", () => {
    const radio: Action = { id: "radio-storm", icon: "radio", textKey: "beat.x", ask: "now" };
    const s = act(createGame(), radio, [cloud(2), burst(1)]).state;
    expect(s.earthAnswer?.stormCloudInSols).toBe(1);
    expect(s.earthAnswer?.burstRisk).toBe("high");
    expect(s.warnedSols).toEqual([2]);
  });

  it("no signal when Earth is out of view: the radio costs nothing and answers nothing", () => {
    const radio: Action = { id: "radio-storm", icon: "radio", textKey: "beat.x", effect: { power: -1 }, ask: "now" };
    const { state, fell } = act(createGame({ earthHidden: [1] }), radio, [cloud(2)]);
    expect(state.earthAnswer).toBeUndefined();
    expect(state.bars.power).toBe(createGame().bars.power);
    expect(fell[0].id).toBe("sol1-no-signal");
  });

  it("a choice can send one astronaut to rest for the day", () => {
    const rest: Action = { id: "dilemma-rest", icon: "rest", textKey: "beat.x", effect: { tired: ["a2"] } };
    const s = act(createGame(), rest).state;
    expect(s.tired).toEqual(["a2"]);
    expect(step(s, { a2: "science" }, []).state.science).toBe(0);
  });
});

describe("dust storms in Earth's answer and in the chain", () => {
  const dust = (sol: number): StormEvent => ({ sol, kind: "dustStorm", captionKey: "event.dust.insight2022", source: ref, solar: 0.65 });

  it("Earth says how many more sols the dust storm lasts", () => {
    const events = [dust(2), dust(3)];
    expect(step(createGame({ sols: 6 }), { a1: "askEarth" }, events).state.earthAnswer?.dustStormSols).toBe(2);
    expect(step(createGame({ sols: 6 }), { a1: "askEarth" }, []).state.earthAnswer?.dustStormSols).toBeUndefined();
  });

  it("the dust-storm domino uses the event's own sentence", () => {
    const { fell } = step(createGame(), {}, [dust(1)]);
    expect(fell.find((d) => d.id === "sol1-dust-storm")?.textKey).toBe("event.dust.insight2022");
  });
});

describe("each astronaut is good at one thing", () => {
  const low = (): GameState => ({ ...createGame(), bars: { power: 4, air: 5, dose: 0 } });

  it("Nova (a1) calls Earth for free", () => {
    const nova = step(low(), { a1: "askEarth" }, []).state;
    const kai = step(low(), { a2: "askEarth" }, []).state;
    expect(nova.bars.power - kai.bars.power).toBe(1);
    expect(nova.earthAnswer).toBeDefined();
  });

  it("Kai (a2) cleans the panels so well that tomorrow has 1 more power", () => {
    const kai = step(low(), { a2: "panels" }, []).state;
    const amara = step(low(), { a3: "panels" }, []).state;
    expect(kai.bars.power - amara.bars.power).toBe(ENGINE.skill.panelsPower);
  });

  it("Amara (a3) grows 1 more food in the greenhouse", () => {
    const amara = step(low(), { a3: "greenhouse" }, []).state;
    const nova = step(low(), { a1: "greenhouse" }, []).state;
    expect(amara.food - nova.food).toBe(ENGINE.skill.greenhouseFood);
  });

  it("a tired expert brings no skill", () => {
    const tired = { ...low(), tired: ["a3" as const] };
    expect(step(tired, { a3: "greenhouse" }, []).state.food).toBe(0);
  });
});

