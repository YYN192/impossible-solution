import palette from "../assets/pixel/palette.json";
import type { Facing } from "./assets";
import type { Point } from "./world";

/**
 * Small "alive" effects for the astronaut on the base: dust puffs at the feet while walking and a
 * gentle idle bounce while standing still. Pure state, stepped once per frame inside the canvas loop
 * (no React state, so it adds no re-renders and keeps the movement stutter fix intact).
 */
export interface Puff extends Point { born: number }
export interface WalkFx {
  puffs: Puff[];
  /** When the last puff was spawned (ms, rAF clock). */
  lastPuff: number;
  /** Puffs spawned so far; alternates left/right foot. */
  count: number;
  /** When the astronaut last stopped moving; undefined while walking. */
  stillSince: number | undefined;
}
export const PUFF_LIFE = 400, PUFF_EVERY = 110, IDLE_DELAY = 500, IDLE_STEP = 420;

export const createWalkFx = (now: number): WalkFx => ({ puffs: [], lastPuff: -Infinity, count: 0, stillSince: now });

// Where "behind the feet" is for each facing: the side the astronaut walked away from.
const BEHIND: Record<Facing, Point> = { front: { x: 0, y: -3 }, back: { x: 0, y: 3 }, left: { x: 5, y: 0 }, right: { x: -5, y: 0 } };

/**
 * One frame. `moved`: the astronaut actually changed position (walking into a wall makes no dust).
 * `walking`: the player is steering (keys held or a tap-walk under way); defaults to `moved`. Any of it holds off the idle bounce.
 */
export function stepWalkFx(fx: WalkFx, f: Point & { now: number; moved: boolean; walking?: boolean; facing: Facing; reduced: boolean }): WalkFx {
  if (f.reduced) return fx.puffs.length ? { ...fx, puffs: [] } : fx; // no effects at all; idleBob() stays 0
  let { puffs, lastPuff, count } = fx;
  if (puffs.some((p) => f.now - p.born >= PUFF_LIFE)) puffs = puffs.filter((p) => f.now - p.born < PUFF_LIFE);
  if (f.moved && f.now - lastPuff >= PUFF_EVERY) {
    const back = BEHIND[f.facing], side = count % 2 ? 3 : -3; // left foot, right foot
    puffs = [...puffs, { x: f.x + back.x + (back.x ? 0 : side), y: f.y + back.y + (back.y ? 0 : side / 3), born: f.now }];
    lastPuff = f.now; count++;
  }
  const stillSince = f.moved || f.walking ? undefined : fx.stillSince ?? f.now;
  return puffs === fx.puffs && lastPuff === fx.lastPuff && stillSince === fx.stillSince ? fx : { puffs, lastPuff, count, stillSince };
}

/** How a puff looks `now`: Mars dust that grows, drifts up a little and fades out over PUFF_LIFE. */
export function puffLook(p: Puff, now: number) {
  const age = Math.min(Math.max((now - p.born) / PUFF_LIFE, 0), 1);
  return { alpha: 0.75 * (1 - age), size: 2 + Math.round(age * 2), rise: Math.round(age * 3), color: age < 0.5 ? palette.orange : palette.rust };
}

/** Pixels to lift the astronaut sprite: 0 while walking or in the first ~0.5 s still, then a slow 1 px breathing bob. */
export function idleBob(fx: WalkFx, now: number, reduced: boolean): number {
  if (reduced || fx.stillSince === undefined) return 0;
  const t = now - fx.stillSince - IDLE_DELAY;
  return t < 0 ? 0 : Math.floor(t / IDLE_STEP) % 2 === 0 ? -1 : 0;
}
