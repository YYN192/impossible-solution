import type { JobId } from "../sim/types";

/**
 * Dust Season's own mini games, for the two jobs the dust storms hit hardest. The other jobs keep
 * the Mars games. Pure and seeded like miniGames.ts; just for fun, they never change the mission.
 */
export type DustGame =
  /** A wind gust moves along the row: tilt a panel while the gust is over it and the wind blows it clean. */
  | { job: "panels"; gust: number; dir: 1 | -1; clean: boolean[]; early: boolean; ticks: number }
  /** Dust cracks the greenhouse panes: patch every crack. */
  | { job: "greenhouse"; cracks: boolean[]; patched: number; seed: number; ticks: number };

export const DUST_JOBS = ["panels", "greenhouse"] as const satisfies readonly JobId[];
export const hasDustGame = (job: JobId): job is (typeof DUST_JOBS)[number] => (DUST_JOBS as readonly JobId[]).includes(job);

export const GUST_SPOTS = 5;
export const GUST_EVERY = 3;

export const CRACK_SPOTS = 6;
export const CRACK_EVERY = 3;
export const PATCH_GOAL = 5;

function roll(seed: number): [number, number] {
  const a = (seed + 0x6d2b79f5) >>> 0;
  let t = a;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, a];
}

export function startDustGame(job: (typeof DUST_JOBS)[number], seed: number): DustGame {
  const [r, next] = roll(seed);
  if (job === "panels") return { job, gust: r < 0.5 ? 0 : GUST_SPOTS - 1, dir: r < 0.5 ? 1 : -1, clean: Array(GUST_SPOTS).fill(false), early: false, ticks: 0 };
  return { job, cracks: Array(CRACK_SPOTS).fill(false), patched: 0, seed: next, ticks: 0 };
}

export function dustProgress(game: DustGame): { done: number; total: number } {
  return game.job === "panels"
    ? { done: game.clean.filter(Boolean).length, total: GUST_SPOTS }
    : { done: game.patched, total: PATCH_GOAL };
}

export const dustWon = (game: DustGame): boolean => {
  const { done, total } = dustProgress(game);
  return done >= total;
};

export function dustTick(game: DustGame): DustGame {
  if (dustWon(game)) return game;
  const ticks = game.ticks + 1;
  if (game.job === "panels") {
    if (ticks % GUST_EVERY) return { ...game, ticks };
    const next = game.gust + game.dir;
    const bounced = next < 0 || next >= GUST_SPOTS;
    return { ...game, ticks, early: false, gust: bounced ? game.gust - game.dir : next, dir: bounced ? ((game.dir * -1) as 1 | -1) : game.dir };
  }
  if (ticks % CRACK_EVERY) return { ...game, ticks };
  const whole = game.cracks.flatMap((c, i) => (c ? [] : [i]));
  if (!whole.length) return { ...game, ticks };
  const [r, seed] = roll(game.seed);
  const at = whole[Math.floor(r * whole.length)];
  return { ...game, ticks, seed, cracks: game.cracks.map((c, i) => c || i === at) };
}

/** Tap panel or pane `i`. */
export function dustTap(game: DustGame, i: number): DustGame {
  if (dustWon(game)) return game;
  if (game.job === "panels") {
    if (game.clean[i]) return game;
    if (i !== game.gust) return { ...game, early: true };
    return { ...game, early: false, clean: game.clean.map((c, j) => c || j === i) };
  }
  if (!game.cracks[i]) return game;
  return { ...game, cracks: game.cracks.map((c, j) => c && j !== i), patched: game.patched + 1 };
}
