import type { JobId } from "../sim/types";

/**
 * One short action mini game for every job the player can assign on the plan screen.
 * Pure and seeded: the screen calls tick() every TICK_MS, so the same seed plays the same way.
 * They are just for fun: the engine decides what a job does, so winning or skipping never changes the mission.
 */
export type MiniGame =
  /** Wipe the panels; the wind blows dust back on a clean one every DUST_EVERY ticks. */
  | { job: "panels"; clean: boolean[]; seed: number; ticks: number }
  /** Keep the plants watered: a plant with water grows, a thirsty one waits. */
  | { job: "greenhouse"; water: number[]; growth: number[]; ticks: number }
  /** A block slides along the top; drop it when it is over the middle. Faster with every block. */
  | { job: "shelter"; pos: number; dir: 1 | -1; every: number; placed: number; miss: boolean; ticks: number }
  /** Earth drifts across the sky: point the dish at it and send SENDS messages. */
  | { job: "askEarth"; aim: number; earth: number; dir: 1 | -1; sent: number; ticks: number }
  /** Rocks pop up in holes and hide again: catch the shiny ones, leave the plain ones. */
  | { job: "science"; cells: ("shiny" | "plain" | null)[]; ttl: number[]; found: number; miss: boolean; seed: number; ticks: number };

/** One game tick in milliseconds. */
export const TICK_MS = 300;

export const PANELS = 6;
export const DUST_EVERY = 4;

export const PLANTS = 3;
export const WATER_MAX = 3;
export const GROW_EVERY = 3;
export const GROW_TARGET = 5;

export const DISH_STEPS = 5;
export const STACK_CENTER = 2;
export const STACK_GOAL = 4;

export const SENDS = 2;
export const EARTH_EVERY = 6;

export const HOLES = 6;
export const POP_EVERY = 2;
export const ROCK_TTL = 6;
export const CATCH_GOAL = 4;

/** One seeded random number (mulberry32) and the next seed. */
function roll(seed: number): [number, number] {
  const a = (seed + 0x6d2b79f5) >>> 0;
  let t = a;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, a];
}

export function startMiniGame(job: JobId, seed: number): MiniGame {
  const [r, next] = roll(seed);
  switch (job) {
    case "panels":
      return { job, clean: Array(PANELS).fill(false), seed: next, ticks: 0 };
    case "greenhouse":
      return { job, water: Array(PLANTS).fill(1), growth: Array(PLANTS).fill(0), ticks: 0 };
    case "shelter":
      return { job, pos: r < 0.5 ? 0 : DISH_STEPS - 1, dir: r < 0.5 ? 1 : -1, every: 2, placed: 0, miss: false, ticks: 0 };
    case "askEarth": {
      const earth = Math.floor(r * DISH_STEPS);
      // The dish starts on the far side, so it always has to turn.
      return { job, aim: earth < DISH_STEPS / 2 ? DISH_STEPS - 1 : 0, earth, dir: earth < DISH_STEPS / 2 ? 1 : -1, sent: 0, ticks: 0 };
    }
    case "science":
      return { job, cells: Array(HOLES).fill(null), ttl: Array(HOLES).fill(0), found: 0, miss: false, seed: next, ticks: 0 };
  }
}

/** How far along the kid is, for the "2 of 4" line. */
export function progress(game: MiniGame): { done: number; total: number } {
  switch (game.job) {
    case "panels":
      return { done: game.clean.filter(Boolean).length, total: game.clean.length };
    case "greenhouse":
      return { done: game.growth.filter((g) => g >= GROW_TARGET).length, total: game.growth.length };
    case "shelter":
      return { done: game.placed, total: STACK_GOAL };
    case "askEarth":
      return { done: game.sent, total: SENDS };
    case "science":
      return { done: game.found, total: CATCH_GOAL };
  }
}

export const won = (game: MiniGame): boolean => {
  const { done, total } = progress(game);
  return done >= total;
};

/** Bounce a position between 0 and DISH_STEPS − 1. */
function bounce(pos: number, dir: 1 | -1): { pos: number; dir: 1 | -1 } {
  const next = pos + dir;
  if (next < 0 || next >= DISH_STEPS) return { pos: pos - dir, dir: (dir * -1) as 1 | -1 };
  return { pos: next, dir };
}

/** Time passes by one tick: dust blows, plants drink, blocks slide, Earth drifts, rocks pop up. */
export function tick(game: MiniGame): MiniGame {
  if (won(game)) return game;
  const ticks = game.ticks + 1;
  switch (game.job) {
    case "panels": {
      if (ticks % DUST_EVERY) return { ...game, ticks };
      const cleanOnes = game.clean.flatMap((c, i) => (c ? [i] : []));
      if (!cleanOnes.length) return { ...game, ticks };
      const [r, seed] = roll(game.seed);
      const hit = cleanOnes[Math.floor(r * cleanOnes.length)];
      return { ...game, ticks, seed, clean: game.clean.map((c, i) => c && i !== hit) };
    }
    case "greenhouse": {
      if (ticks % GROW_EVERY) return { ...game, ticks };
      return {
        ...game,
        ticks,
        growth: game.growth.map((g, i) => (game.water[i] > 0 ? Math.min(GROW_TARGET, g + 1) : g)),
        water: game.water.map((w, i) => (w > 0 && game.growth[i] < GROW_TARGET ? w - 1 : w)),
      };
    }
    case "shelter": {
      if (ticks % game.every) return { ...game, ticks };
      // Moving on clears the "oops" from a miss, so the "Now! Drop it!" cue can show again.
      return { ...game, ticks, miss: false, ...bounce(game.pos, game.dir) };
    }
    case "askEarth": {
      if (ticks % EARTH_EVERY) return { ...game, ticks };
      const moved = bounce(game.earth, game.dir);
      return { ...game, ticks, earth: moved.pos, dir: moved.dir };
    }
    case "science": {
      let seed = game.seed;
      const ttl = game.ttl.map((t) => Math.max(0, t - 1));
      const cells = game.cells.map((c, i) => (ttl[i] > 0 ? c : null));
      if (ticks % POP_EVERY === 0) {
        const empty = cells.flatMap((c, i) => (c === null ? [i] : []));
        if (empty.length) {
          let r: number;
          [r, seed] = roll(seed);
          const hole = empty[Math.floor(r * empty.length)];
          [r, seed] = roll(seed);
          cells[hole] = r < 0.55 ? "shiny" : "plain";
          ttl[hole] = ROCK_TTL;
        }
      }
      return { ...game, ticks, seed, cells, ttl };
    }
  }
}

/** Tap item `i`: wipe a panel, water a plant, or grab the rock in a hole. */
export function tap(game: MiniGame, i: number): MiniGame {
  if (won(game)) return game;
  switch (game.job) {
    case "panels":
      return game.clean[i] ? game : { ...game, clean: game.clean.map((c, j) => c || j === i) };
    case "greenhouse":
      if (game.water[i] >= WATER_MAX || game.growth[i] >= GROW_TARGET) return game;
      return { ...game, water: game.water.map((w, j) => (j === i ? w + 1 : w)) };
    case "science": {
      const rock = game.cells[i];
      if (!rock) return game;
      const cells = game.cells.map((c, j) => (j === i ? null : c));
      const ttl = game.ttl.map((t, j) => (j === i ? 0 : t));
      return rock === "shiny" ? { ...game, cells, ttl, found: game.found + 1, miss: false } : { ...game, cells, ttl, miss: true };
    }
    default:
      return game;
  }
}

/** Shelter: drop the sliding block. Over the middle it stacks (and the next one is faster); anywhere else it falls off. */
export function drop(game: MiniGame): MiniGame {
  if (game.job !== "shelter" || won(game)) return game;
  if (game.pos !== STACK_CENTER) return { ...game, miss: true };
  return { ...game, placed: game.placed + 1, miss: false, every: game.placed + 1 >= 2 ? 1 : 2 };
}

/** Ask Earth: turn the dish one step left (−1) or right (+1). */
export function turn(game: MiniGame, dir: -1 | 1): MiniGame {
  if (game.job !== "askEarth" || won(game)) return game;
  return { ...game, aim: Math.min(DISH_STEPS - 1, Math.max(0, game.aim + dir)) };
}

/** Ask Earth: send one message; it only gets through while the dish points at Earth. */
export function send(game: MiniGame): MiniGame {
  if (game.job !== "askEarth" || won(game) || game.aim !== game.earth) return game;
  return { ...game, sent: game.sent + 1 };
}
