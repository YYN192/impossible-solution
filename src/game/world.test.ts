import { describe, expect, it } from "vitest";
import {
  MARS_BASE,
  canStand,
  movePlayer,
  nearestInteraction,
  tapTarget,
  walkToward,
} from "./world";
import type { Facing } from "./assets";

const start: { x: number; y: number; facing: Facing } = {
  x: 320,
  y: 280,
  facing: "back",
};
const walk = (target: { x: number; y: number }) => {
  let p = { ...start },
    done = false;
  for (let i = 0; i < 600 && !done; i++)
    ({ p, done } = walkToward(MARS_BASE, p, target, 1 / 60));
  return p;
};

describe("hub world", () => {
  it("walking up from the start reaches the mission console", () => {
    let p = { ...start };
    for (let i = 0; i < 90; i++) p = movePlayer(MARS_BASE, p, 0, -1, 1 / 60);
    expect(nearestInteraction(MARS_BASE, p)?.id).toBe("console");
  });
  it("cannot stand inside a crate", () =>
    expect(canStand(MARS_BASE, 80, 312)).toBe(false));
  it("tapping any console, NPC or door walks the player right next to it", () => {
    for (const e of MARS_BASE.entities.filter((x) => x.interaction)) {
      const t = tapTarget(MARS_BASE, { x: e.x + e.w / 2, y: e.y + e.h / 2 });
      expect(t.entity?.id).toBe(e.id);
      expect(nearestInteraction(MARS_BASE, walk(t))?.id).toBe(e.id);
    }
  });
  it("tapping the floor walks there; tapping outside the walls stays inside", () => {
    expect(tapTarget(MARS_BASE, { x: 400, y: 300 })).toEqual({
      x: 400,
      y: 300,
    });
    const p = walk({ x: 400, y: 300 });
    expect(Math.hypot(p.x - 400, p.y - 300)).toBeLessThan(2);
    const out = tapTarget(MARS_BASE, { x: 0, y: 0 });
    expect(canStand(MARS_BASE, out.x, out.y)).toBe(true);
  });
  it("stops when blocked instead of pushing forever", () => {
    const p = walk({ x: 80, y: 312 });
    expect(canStand(MARS_BASE, p.x, p.y)).toBe(true);
  });
});
