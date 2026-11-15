import type { JobId } from "../sim/types";

/**
 * The Moon's own mini games: the same five jobs, but Moon problems (no air, so no dust storms).
 * Pure and seeded like miniGames.ts: the screen calls moonTick() every TICK_MS.
 * Just for fun: the engine decides what a job does, so winning or skipping never changes the mission.
 * Nothing here can be lost: waiting never takes progress away from a finished part.
 */
export type MoonGame =
  /** The Sun creeps low along the horizon at the south pole: keep the panel turned to it. */
  | { job: "panels"; sun: number; dir: 1 | -1; aim: number; charge: number; ticks: number }
  /** Melt ice from the dark craters into water for the plants. The cold freezes a half-melted block again. */
  | { job: "greenhouse"; ice: number[]; ticks: number }
  /** A scoop slides over the shelter: pour Moon dirt on every part of it. */
  | { job: "shelter"; scoop: number; dir: 1 | -1; piles: number[]; full: boolean; ticks: number }
  /** Earth hangs still in the Moon's sky. A message needs about 1.3 seconds each way. */
  | { job: "askEarth"; phase: "ready" | "up" | "down" | "arrived"; pos: number; got: number; ticks: number }
  /** A lamp sweeps over a dark crater: ice only shows where the light falls. */
  | { job: "science"; lamp: number; dir: 1 | -1; ice: boolean[]; found: number; dark: boolean; seed: number; ticks: number };

export const SUN_STEPS = 5;
export const SUN_EVERY = 7;
export const CHARGE_GOAL = 8;
/** The meter shows the charge in this many steps. */
export const CHARGE_STEPS = 4;

export const ICE_GOAL = 3;
export const ICE_SOLID = 3;
export const REFREEZE_EVERY = 8;

export const COLUMNS = 5;
export const PILE_MAX = 2;
export const SCOOP_EVERY = 2;

/** Ticks one way: 4 × 300 ms = 1.2 s, close to the real 1.3 s (MOON_DELAY). */
export const TRAVEL = 4;
export const REPLIES = 2;

export const LAMP_SPOTS = 6;
export const LAMP_EVERY = 2;
export const ICE_HIDDEN = 3;
export const FIND_GOAL = 4;

/** One seeded random number (mulberry32) and the next seed. */
function roll(seed: number): [number, number] {
  const a = (seed + 0x6d2b79f5) >>> 0;
  let t = a;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, a];
}

/** Bounce a position between 0 and size − 1. */
function bounce(pos: number, dir: 1 | -1, size: number): { pos: number; dir: 1 | -1 } {
  const next = pos + dir;
  if (next < 0 || next >= size) return { pos: pos - dir, dir: (dir * -1) as 1 | -1 };
  return { pos: next, dir };
}

/** Hide one more piece of ice in a dark hole that has none (not the lit one, so it is not too easy). */
function hideIce(ice: boolean[], lamp: number, seed: number): [boolean[], number] {
  const empty = ice.flatMap((has, i) => (!has && i !== lamp ? [i] : []));
  if (!empty.length) return [ice, seed];
  const [r, next] = roll(seed);
  const at = empty[Math.floor(r * empty.length)];
  return [ice.map((has, i) => has || i === at), next];
}

export function startMoonGame(job: JobId, seed: number): MoonGame {
  const [r, next] = roll(seed);
  switch (job) {
    case "panels": {
      const sun = Math.floor(r * SUN_STEPS);
      // The panel starts turned away, so it always has to turn.
      return { job, sun, dir: sun < SUN_STEPS / 2 ? 1 : -1, aim: sun < SUN_STEPS / 2 ? SUN_STEPS - 1 : 0, charge: 0, ticks: 0 };
    }
    case "greenhouse":
      return { job, ice: Array(ICE_GOAL).fill(ICE_SOLID), ticks: 0 };
    case "shelter":
      return { job, scoop: r < 0.5 ? 0 : COLUMNS - 1, dir: r < 0.5 ? 1 : -1, piles: Array(COLUMNS).fill(0), full: false, ticks: 0 };
    case "askEarth":
      return { job, phase: "ready", pos: 0, got: 0, ticks: 0 };
    case "science": {
      const lamp = 0;
      let ice: boolean[] = Array(LAMP_SPOTS).fill(false);
      let s = next;
      for (let i = 0; i < ICE_HIDDEN; i++) [ice, s] = hideIce(ice, lamp, s);
      return { job, lamp, dir: 1, ice, found: 0, dark: false, seed: s, ticks: 0 };
    }
  }
}

/** How far along the kid is, for the "2 of 4" line and the meter. */
export function moonProgress(game: MoonGame): { done: number; total: number } {
  switch (game.job) {
    case "panels":
      return { done: Math.floor((game.charge * CHARGE_STEPS) / CHARGE_GOAL), total: CHARGE_STEPS };
    case "greenhouse":
      return { done: game.ice.filter((i) => i === 0).length, total: ICE_GOAL };
    case "shelter":
      return { done: game.piles.reduce((a, b) => a + b, 0), total: COLUMNS * PILE_MAX };
    case "askEarth":
      return { done: game.got, total: REPLIES };
    case "science":
      return { done: game.found, total: FIND_GOAL };
  }
}

export const moonWon = (game: MoonGame): boolean => {
  const { done, total } = moonProgress(game);
  return done >= total;
};

/** Time passes by one tick: the Sun creeps, ice refreezes, the scoop slides, messages fly, the lamp sweeps. */
export function moonTick(game: MoonGame): MoonGame {
  if (moonWon(game)) return game;
  const ticks = game.ticks + 1;
  switch (game.job) {
    case "panels": {
      const charge = game.aim === game.sun ? Math.min(CHARGE_GOAL, game.charge + 1) : game.charge;
      if (ticks % SUN_EVERY) return { ...game, ticks, charge };
      const moved = bounce(game.sun, game.dir, SUN_STEPS);
      return { ...game, ticks, charge, sun: moved.pos, dir: moved.dir };
    }
    case "greenhouse":
      if (ticks % REFREEZE_EVERY) return { ...game, ticks };
      // Only a block that is partly melted freezes again; water stays water.
      return { ...game, ticks, ice: game.ice.map((i) => (i > 0 && i < ICE_SOLID ? i + 1 : i)) };
    case "shelter": {
      if (ticks % SCOOP_EVERY) return { ...game, ticks };
      const moved = bounce(game.scoop, game.dir, COLUMNS);
      return { ...game, ticks, scoop: moved.pos, dir: moved.dir, full: false };
    }
    case "askEarth": {
      if (game.phase === "up") return game.pos + 1 >= TRAVEL ? { ...game, ticks, phase: "down", pos: TRAVEL } : { ...game, ticks, pos: game.pos + 1 };
      if (game.phase === "down") return game.pos - 1 <= 0 ? { ...game, ticks, phase: "arrived", pos: 0 } : { ...game, ticks, pos: game.pos - 1 };
      return { ...game, ticks };
    }
    case "science": {
      if (ticks % LAMP_EVERY) return { ...game, ticks };
      const moved = bounce(game.lamp, game.dir, LAMP_SPOTS);
      return { ...game, ticks, lamp: moved.pos, dir: moved.dir, dark: false };
    }
  }
}

/** Tap item `i`: melt an ice block, or search a hole of the crater. */
export function moonTap(game: MoonGame, i: number): MoonGame {
  if (moonWon(game)) return game;
  switch (game.job) {
    case "greenhouse":
      return game.ice[i] > 0 ? { ...game, ice: game.ice.map((v, j) => (j === i ? v - 1 : v)) } : game;
    case "science": {
      if (i !== game.lamp) return { ...game, dark: true };
      if (!game.ice[i]) return game;
      const [ice, seed] = hideIce(game.ice.map((v, j) => v && j !== i), game.lamp, game.seed);
      return { ...game, ice, seed, found: game.found + 1, dark: false };
    }
    default:
      return game;
  }
}

/** Panels: turn the panel one step left (−1) or right (+1). */
export function moonTurn(game: MoonGame, dir: -1 | 1): MoonGame {
  if (game.job !== "panels" || moonWon(game)) return game;
  return { ...game, aim: Math.min(SUN_STEPS - 1, Math.max(0, game.aim + dir)) };
}

/** Shelter: pour a scoop of Moon dirt where the scoop is. A full spot keeps its dirt. */
export function moonPour(game: MoonGame): MoonGame {
  if (game.job !== "shelter" || moonWon(game)) return game;
  if (game.piles[game.scoop] >= PILE_MAX) return { ...game, full: true };
  return { ...game, full: false, piles: game.piles.map((p, i) => (i === game.scoop ? p + 1 : p)) };
}

/** Ask Earth: send a message (one at a time). */
export function moonSend(game: MoonGame): MoonGame {
  if (game.job !== "askEarth" || moonWon(game) || game.phase !== "ready") return game;
  return { ...game, phase: "up", pos: 0 };
}

/** Ask Earth: read the answer once it has arrived. */
export function moonRead(game: MoonGame): MoonGame {
  if (game.job !== "askEarth" || game.phase !== "arrived") return game;
  return { ...game, phase: "ready", got: game.got + 1 };
}
