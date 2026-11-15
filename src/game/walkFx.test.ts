import { describe, expect, it } from "vitest";
import palette from "../assets/pixel/palette.json";
import { IDLE_DELAY, PUFF_EVERY, PUFF_LIFE, createWalkFx, idleBob, puffLook, stepWalkFx, type WalkFx } from "./walkFx";
import type { Facing } from "./assets";

const at = { x: 320, y: 280 };
/** Run the effect state for `ms` at 60 fps, moving (or not) in one direction. */
const run = (fx: WalkFx, from: number, ms: number, moved: boolean, facing: Facing = "front", reduced = false) => {
  let p = { ...at };
  for (let now = from; now <= from + ms; now += 1000 / 60) {
    if (moved) p = { x: p.x + (facing === "right" ? 2 : facing === "left" ? -2 : 0), y: p.y + (facing === "front" ? 2 : facing === "back" ? -2 : 0) };
    fx = stepWalkFx(fx, { now, moved, ...p, facing, reduced });
  }
  return { fx, p };
};

describe("dust puffs at the astronaut's feet", () => {
  it.each<Facing>(["front", "back", "left", "right"])("walking %s leaves puffs behind the astronaut", (facing) => {
    const { fx, p } = run(createWalkFx(0), 0, 300, true, facing);
    expect(fx.puffs.length).toBeGreaterThan(0);
    const last = fx.puffs[fx.puffs.length - 1];
    // Behind = on the side the astronaut came from.
    if (facing === "front") expect(last.y).toBeLessThan(p.y);
    if (facing === "back") expect(last.y).toBeGreaterThan(p.y);
    if (facing === "left") expect(last.x).toBeGreaterThan(p.x);
    if (facing === "right") expect(last.x).toBeLessThan(p.x);
  });

  it("standing still makes none", () => {
    expect(run(createWalkFx(0), 0, 2000, false).fx.puffs).toEqual([]);
  });

  it("spawns them a few at a time, not one per frame", () => {
    const { fx } = run(createWalkFx(0), 0, 1000, true);
    expect(fx.puffs.length).toBeLessThanOrEqual(Math.ceil(PUFF_LIFE / PUFF_EVERY) + 1);
  });

  it("each puff fades out and is gone after ~0.4 s once the astronaut stops", () => {
    let { fx } = run(createWalkFx(0), 0, 500, true);
    const puff = fx.puffs[0];
    expect(puffLook(puff, puff.born).alpha).toBeGreaterThan(puffLook(puff, puff.born + PUFF_LIFE * 0.75).alpha);
    expect(puffLook(puff, puff.born + PUFF_LIFE).alpha).toBe(0);
    ({ fx } = run(fx, 520, PUFF_LIFE + 20, false));
    expect(fx.puffs).toEqual([]);
  });

  it("uses colours from the pixel palette", () => {
    const { fx } = run(createWalkFx(0), 0, 300, true);
    const colours = Object.values(palette);
    for (const p of fx.puffs) expect(colours).toContain(puffLook(p, p.born + 50).color);
  });

  it("is skipped when prefers-reduced-motion is set", () => {
    expect(run(createWalkFx(0), 0, 1000, true, "front", true).fx.puffs).toEqual([]);
  });
});

describe("idle bounce", () => {
  const bobsAt = (fx: WalkFx, from: number, to: number) => {
    const seen = new Set<number>();
    for (let now = from; now <= to; now += 1000 / 60) seen.add(idleBob(fx, now, false));
    return seen;
  };

  it("waits ~0.5 s without input, then bobs 1–2 px up and down", () => {
    const { fx } = run(createWalkFx(0), 0, 500, true);
    expect(fx.stillSince).toBeUndefined();
    const still = run(fx, 520, 2500, false).fx; // stops moving at 520 ms
    const stopped = still.stillSince!;
    expect(stopped).toBe(520);
    expect(bobsAt(still, stopped, stopped + IDLE_DELAY - 20)).toEqual(new Set([0]));
    const bobs = bobsAt(still, stopped + IDLE_DELAY, stopped + IDLE_DELAY + 2000);
    expect(bobs.size).toBeGreaterThan(1);
    for (const b of bobs) expect(Math.abs(b)).toBeLessThanOrEqual(2);
  });

  it("stops the moment the player moves", () => {
    let { fx } = run(createWalkFx(0), 0, 3000, false);
    expect(bobsAt(fx, 1000, 3000).size).toBeGreaterThan(1);
    fx = stepWalkFx(fx, { now: 3010, moved: true, ...at, facing: "left", reduced: false });
    expect(fx.stillSince).toBeUndefined();
    expect(idleBob(fx, 3010, false)).toBe(0);
  });

  it("waits while the player pushes into a wall (keys held, no movement): no bounce and no dust", () => {
    let fx = createWalkFx(0);
    for (let now = 0; now < 2000; now += 1000 / 60) fx = stepWalkFx(fx, { now, moved: false, walking: true, ...at, facing: "back", reduced: false });
    expect(fx.puffs).toEqual([]);
    expect(idleBob(fx, 2000, false)).toBe(0);
  });

  it("is skipped when prefers-reduced-motion is set", () => {
    const { fx } = run(createWalkFx(0), 0, 3000, false);
    expect(bobsAt(fx, 0, 3000).size).toBeGreaterThan(1);
    for (let now = 0; now < 3000; now += 50) expect(idleBob(fx, now, true)).toBe(0);
  });
});
