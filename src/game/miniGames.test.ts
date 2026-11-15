import { describe, expect, it } from "vitest";
import { JOBS, type JobId } from "../sim/types";
import {
  CATCH_GOAL,
  DISH_STEPS,
  DUST_EVERY,
  GROW_TARGET,
  SENDS,
  STACK_CENTER,
  STACK_GOAL,
  WATER_MAX,
  drop,
  progress,
  send,
  startMiniGame,
  tap,
  tick,
  turn,
  won,
  type MiniGame,
} from "./miniGames";

const jobIds = Object.keys(JOBS) as JobId[];
type Of<J extends JobId> = Extract<MiniGame, { job: J }>;
const of = <J extends JobId>(job: J, seed = 1) => startMiniGame(job, seed) as Of<J>;
const ticks = <G extends MiniGame>(game: G, n: number): G => {
  let g: MiniGame = game;
  for (let i = 0; i < n; i++) g = tick(g);
  return g as G;
};

describe("mini games: one for every job the player can assign", () => {
  it("has a mini game for every job, not won at the start", () => {
    for (const job of jobIds) {
      const game = startMiniGame(job, 7);
      expect(game.job).toBe(job);
      expect(won(game), job).toBe(false);
      expect(progress(game).done, job).toBe(0);
    }
  });

  it("is pure and seeded: the same seed plays the same way, tick by tick", () => {
    for (const job of jobIds) expect(ticks(startMiniGame(job, 42), 30)).toEqual(ticks(startMiniGame(job, 42), 30));
  });

  it("is alive: every game changes on its own as time passes", () => {
    for (const job of jobIds) expect(ticks(startMiniGame(job, 3), 12), job).not.toEqual(startMiniGame(job, 3));
  });

  it("stops moving once it is won", () => {
    let game: MiniGame = of("panels");
    for (let i = 0; i < 6; i++) game = tap(game, i);
    expect(won(game)).toBe(true);
    expect(tick(game)).toEqual(game);
  });
});

describe("panels: the dust keeps blowing back", () => {
  it("a clean panel gets dusty again, so all of them must be clean at once", () => {
    let game: Of<"panels"> = of("panels");
    game = tap(game, 0) as Of<"panels">;
    expect(progress(game).done).toBe(1);
    expect(tap(game, 0)).toEqual(game);
    const later = ticks(game, DUST_EVERY);
    expect(progress(later).done).toBe(0);
    let all: MiniGame = game;
    for (let i = 0; i < game.clean.length; i++) all = tap(all, i);
    expect(won(all)).toBe(true);
  });
});

describe("greenhouse: plants grow only while they have water", () => {
  it("a thirsty plant stops growing; watering is capped", () => {
    let game: Of<"greenhouse"> = of("greenhouse");
    for (let i = 0; i < 10; i++) game = tap(game, 0) as Of<"greenhouse">;
    expect(game.water[0]).toBe(WATER_MAX);
    const dry = ticks(game, 60);
    expect(dry.growth[1]).toBeLessThan(GROW_TARGET);
    expect(dry.water[1]).toBe(0);
    expect(dry.growth[0]).toBeGreaterThan(dry.growth[1]);
  });

  it("wins when every plant is fully grown, by keeping them watered", () => {
    let game: MiniGame = of("greenhouse");
    for (let i = 0; i < 200 && !won(game); i++) {
      for (let p = 0; p < 3; p++) game = tap(game, p);
      game = tick(game);
    }
    expect(won(game)).toBe(true);
  });
});

describe("shelter: drop the sliding block on the stack", () => {
  it("the block slides and bounces inside the top row", () => {
    let game: Of<"shelter"> = of("shelter");
    const seen = new Set<number>();
    for (let i = 0; i < 40; i++) {
      game = tick(game) as Of<"shelter">;
      expect(game.pos).toBeGreaterThanOrEqual(0);
      expect(game.pos).toBeLessThan(DISH_STEPS);
      seen.add(game.pos);
    }
    expect(seen.size).toBe(DISH_STEPS);
  });

  it("dropping off the middle misses; on the middle it stacks; it gets faster", () => {
    let game: Of<"shelter"> = of("shelter");
    while (game.pos === STACK_CENTER) game = tick(game) as Of<"shelter">;
    game = drop(game) as Of<"shelter">;
    expect(game.placed).toBe(0);
    expect(game.miss).toBe(true);
    const slowEvery = game.every;
    for (let n = 0; n < STACK_GOAL; n++) {
      while (game.pos !== STACK_CENTER) game = tick(game) as Of<"shelter">;
      game = drop(game) as Of<"shelter">;
      expect(game.miss).toBe(false);
      if (n === 0) expect(game.every).toBeLessThanOrEqual(slowEvery);
    }
    expect(game.placed).toBe(STACK_GOAL);
    expect(won(game)).toBe(true);
  });
});

describe("Ask Earth: follow Earth across the sky", () => {
  it("Earth moves on its own and the dish stays in range", () => {
    const game = of("askEarth");
    const earths = new Set<number>();
    let g: Of<"askEarth"> = game;
    for (let i = 0; i < 80; i++) { g = tick(g) as Of<"askEarth">; earths.add(g.earth); }
    expect(earths.size).toBeGreaterThan(1);
    let d: MiniGame = game;
    for (let i = 0; i < DISH_STEPS + 2; i++) d = turn(d, -1);
    expect((d as Of<"askEarth">).aim).toBe(0);
    for (let i = 0; i < DISH_STEPS + 2; i++) d = turn(d, 1);
    expect((d as Of<"askEarth">).aim).toBe(DISH_STEPS - 1);
  });

  it(`starts pointing away; needs ${SENDS} messages sent while pointing at Earth`, () => {
    for (let s = 0; s < 20; s++) { const g = of("askEarth", s); expect(g.aim).not.toBe(g.earth); }
    let game: Of<"askEarth"> = of("askEarth", 9);
    expect(send(game)).toEqual(game);
    for (let n = 0; n < SENDS; n++) {
      while (game.aim !== game.earth) game = turn(game, game.earth > game.aim ? 1 : -1) as Of<"askEarth">;
      game = send(game) as Of<"askEarth">;
      expect(game.sent).toBe(n + 1);
    }
    expect(won(game)).toBe(true);
  });
});

describe("science trip: catch the shiny rocks before they hide", () => {
  it("rocks pop up and hide again by themselves", () => {
    const g = ticks(of("science"), 4);
    expect(g.cells.some((c) => c !== null)).toBe(true);
    const last: Of<"science"> = { ...of("science"), cells: ["shiny", null, null, null, null, null], ttl: [1, 0, 0, 0, 0, 0] };
    expect((tick(last) as Of<"science">).cells[0]).toBeNull();
  });

  it(`a plain rock is a miss, ${CATCH_GOAL} shiny catches win`, () => {
    let game: MiniGame = of("science", 5);
    let missed = false;
    for (let i = 0; i < 400 && !won(game); i++) {
      game = tick(game);
      const g = game as Of<"science">;
      const plain = g.cells.indexOf("plain");
      if (!missed && plain >= 0) {
        game = tap(game, plain);
        expect((game as Of<"science">).miss).toBe(true);
        expect((game as Of<"science">).cells[plain]).toBeNull();
        missed = true;
      }
      const shiny = (game as Of<"science">).cells.indexOf("shiny");
      if (shiny >= 0) game = tap(game, shiny);
    }
    expect(missed).toBe(true);
    expect(won(game)).toBe(true);
    expect(progress(game)).toEqual({ done: CATCH_GOAL, total: CATCH_GOAL });
  });

  it("tapping an empty hole does nothing", () => {
    const game = of("science");
    expect(tap(game, game.cells.indexOf(null))).toEqual(game);
  });
});
