import { describe, expect, it } from "vitest";
import { JOBS, type JobId } from "../sim/types";
import {
  CHARGE_GOAL,
  COLUMNS,
  ICE_GOAL,
  ICE_SOLID,
  LAMP_SPOTS,
  PILE_MAX,
  REPLIES,
  SUN_STEPS,
  TRAVEL,
  moonPour,
  moonProgress,
  moonRead,
  moonSend,
  moonTap,
  moonTick,
  moonTurn,
  moonWon,
  startMoonGame,
  type MoonGame,
} from "./moonMiniGames";

const jobIds = Object.keys(JOBS) as JobId[];
type Of<J extends JobId> = Extract<MoonGame, { job: J }>;
const of = <J extends JobId>(job: J, seed = 1) => startMoonGame(job, seed) as Of<J>;
const ticks = <G extends MoonGame>(game: G, n: number): G => {
  let g: MoonGame = game;
  for (let i = 0; i < n; i++) g = moonTick(g);
  return g as G;
};

describe("Moon mini games: a different game for every job on the Moon", () => {
  it("has one for every job, not won at the start, seeded (same seed plays the same)", () => {
    for (const job of jobIds) {
      const game = startMoonGame(job, 7);
      expect(game.job).toBe(job);
      expect(moonWon(game), job).toBe(false);
      expect(moonProgress(game).done, job).toBe(0);
      expect(ticks(startMoonGame(job, 7), 20)).toEqual(ticks(startMoonGame(job, 7), 20));
    }
  });

  it("can never be lost: waiting a long time never ends the game or takes progress away below zero", () => {
    for (const job of jobIds) {
      const g = ticks(startMoonGame(job, 3), 500);
      // (The Sun can drift back onto a panel by itself: that is a lucky win, never a loss.)
      if (job !== "panels") expect(moonWon(g), job).toBe(false);
      expect(moonProgress(g).done, job).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("panels on the Moon: turn the panel after the low Sun", () => {
  it("only charges while the panel faces the Sun", () => {
    let g = of("panels");
    expect(g.aim).not.toBe(g.sun);
    g = ticks(g, 3);
    expect(g.charge).toBe(0);
    while (g.aim !== g.sun) g = moonTurn(g, g.sun > g.aim ? 1 : -1) as Of<"panels">;
    const before = g.charge;
    g = moonTick(g) as Of<"panels">;
    expect(g.charge).toBe(before + 1);
  });

  it("the Sun creeps along the horizon, and turning stays on the rail", () => {
    const g = of("panels");
    const moved = ticks(g, 40);
    const seen = new Set<number>();
    let h: MoonGame = g;
    for (let i = 0; i < 80; i++) { h = moonTick(h); seen.add((h as Of<"panels">).sun); }
    expect(seen.size).toBeGreaterThan(1);
    expect(moved.sun).toBeGreaterThanOrEqual(0);
    expect(moved.sun).toBeLessThan(SUN_STEPS);
    expect(moonTurn({ ...g, aim: 0 }, -1)).toMatchObject({ aim: 0 });
    expect(moonTurn({ ...g, aim: SUN_STEPS - 1 }, 1)).toMatchObject({ aim: SUN_STEPS - 1 });
  });

  it("is won after following the Sun long enough", () => {
    let g: MoonGame = of("panels");
    for (let i = 0; i < 400 && !moonWon(g); i++) {
      const p = g as Of<"panels">;
      g = p.aim === p.sun ? moonTick(p) : moonTurn(p, p.sun > p.aim ? 1 : -1);
    }
    expect(moonWon(g)).toBe(true);
    expect((g as Of<"panels">).charge).toBe(CHARGE_GOAL);
  });
});

describe("greenhouse on the Moon: melt crater ice into water for the plants", () => {
  it("each tap melts a block a little, until it is water", () => {
    let g = of("greenhouse");
    expect(g.ice).toEqual(Array(ICE_GOAL).fill(ICE_SOLID));
    g = moonTap(g, 0) as Of<"greenhouse">;
    expect(g.ice[0]).toBe(ICE_SOLID - 1);
    for (let i = 0; i < 10; i++) g = moonTap(g, 0) as Of<"greenhouse">;
    expect(g.ice[0]).toBe(0);
  });

  it("the crater cold freezes a half-melted block again, but never melted water", () => {
    let g = of("greenhouse");
    g = moonTap(g, 0) as Of<"greenhouse">;
    for (let i = 0; i < ICE_SOLID; i++) g = moonTap(g, 1) as Of<"greenhouse">;
    g = ticks(g, 30);
    expect(g.ice[0]).toBe(ICE_SOLID);
    expect(g.ice[1]).toBe(0);
  });

  it("is won when every block is water", () => {
    let g: MoonGame = of("greenhouse");
    for (let b = 0; b < ICE_GOAL; b++) for (let i = 0; i < ICE_SOLID; i++) g = moonTap(g, b);
    expect(moonWon(g)).toBe(true);
    expect(moonProgress(g)).toEqual({ done: ICE_GOAL, total: ICE_GOAL });
  });
});

describe("shelter on the Moon: pour Moon dirt over the shelter", () => {
  it("pours into the spot under the scoop, which slides by itself", () => {
    let g = of("shelter");
    const at = g.scoop;
    g = moonPour(g) as Of<"shelter">;
    expect(g.piles[at]).toBe(1);
    const spots = new Set<number>();
    let h: MoonGame = g;
    for (let i = 0; i < 20; i++) { h = moonTick(h); spots.add((h as Of<"shelter">).scoop); }
    expect(spots.size).toBe(COLUMNS);
  });

  it("a full spot does not overflow: it says so and nothing is lost", () => {
    let g = of("shelter");
    g = { ...g, piles: g.piles.map((_, i) => (i === g.scoop ? PILE_MAX : 0)) };
    const poured = moonPour(g) as Of<"shelter">;
    expect(poured.piles[g.scoop]).toBe(PILE_MAX);
    expect(poured.full).toBe(true);
  });

  it("is won when the whole shelter is covered", () => {
    let g: MoonGame = of("shelter");
    for (let i = 0; i < 500 && !moonWon(g); i++) g = moonTick(moonPour(g));
    expect(moonWon(g)).toBe(true);
    expect(moonProgress(g)).toEqual({ done: COLUMNS * PILE_MAX, total: COLUMNS * PILE_MAX });
  });
});

describe("Ask Earth from the Moon: the message takes about 1.3 seconds each way", () => {
  it("a sent message flies up, the answer flies back, and the kid reads it", () => {
    let g = of("askEarth");
    expect(g.phase).toBe("ready");
    expect(moonRead(g)).toBe(g); // nothing to read yet
    g = moonSend(g) as Of<"askEarth">;
    expect(g.phase).toBe("up");
    expect(moonSend(g)).toBe(g); // one message at a time
    g = ticks(g, TRAVEL);
    expect(g.phase).toBe("down");
    g = ticks(g, TRAVEL);
    expect(g.phase).toBe("arrived");
    g = moonRead(g) as Of<"askEarth">;
    expect(g.phase).toBe("ready");
    expect(g.got).toBe(1);
  });

  it("the trip there and back is about 2 × 1.3 seconds at the 300 ms tick", () => {
    expect(TRAVEL * 300).toBeGreaterThanOrEqual(1100);
    expect(TRAVEL * 300).toBeLessThanOrEqual(1500);
  });

  it(`is won after ${REPLIES} answers`, () => {
    let g: MoonGame = of("askEarth");
    for (let i = 0; i < REPLIES; i++) g = moonRead(ticks(moonSend(g), 2 * TRAVEL));
    expect(moonWon(g)).toBe(true);
  });
});

describe("science on the Moon: find ice in the dark crater with the lamp", () => {
  it("only a lit hole can be searched; a dark one just says to wait", () => {
    let g = of("science");
    const dark = g.ice.findIndex((ice, i) => ice && i !== g.lamp);
    expect(dark).toBeGreaterThanOrEqual(0);
    const tried = moonTap(g, dark) as Of<"science">;
    expect(tried.found).toBe(0);
    expect(tried.dark).toBe(true);
    // Wait for the lamp to shine on that hole, then grab the ice.
    for (let i = 0; i < 50 && g.lamp !== dark; i++) g = moonTick(g) as Of<"science">;
    expect(g.lamp).toBe(dark);
    const got = moonTap(g, dark) as Of<"science">;
    expect(got.found).toBe(1);
    expect(got.ice[dark]).toBe(false);
    expect(got.ice.filter(Boolean).length).toBe(g.ice.filter(Boolean).length); // new ice is hidden elsewhere
  });

  it("the lamp sweeps over every hole", () => {
    let g: MoonGame = of("science");
    const lit = new Set<number>();
    for (let i = 0; i < 40; i++) { g = moonTick(g); lit.add((g as Of<"science">).lamp); }
    expect(lit.size).toBe(LAMP_SPOTS);
  });

  it("is won after finding enough ice", () => {
    let g: MoonGame = of("science");
    for (let i = 0; i < 1000 && !moonWon(g); i++) {
      const s = g as Of<"science">;
      g = s.ice[s.lamp] ? moonTap(s, s.lamp) : moonTick(s);
    }
    expect(moonWon(g)).toBe(true);
  });
});
