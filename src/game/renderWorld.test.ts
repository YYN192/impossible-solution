import { describe, expect, it } from "vitest";
import { DOOR, doorStep, easeInOut } from "./renderWorld";

describe("sliding airlock", () => {
  it("opens in openMs and closes in closeMs, by the clock (any screen refresh rate)", () => {
    let p = 0;
    for (let t = 0; t < DOOR.openMs; t += 1000 / 60) p = doorStep(p, true, 1000 / 60, false);
    expect(p).toBeGreaterThan(0.95);
    let q = 0;
    for (let t = 0; t < DOOR.openMs; t += 1000 / 144) q = doorStep(q, true, 1000 / 144, false);
    expect(Math.abs(p - q)).toBeLessThan(0.05);
    for (let t = 0; t < DOOR.closeMs + 20; t += 1000 / 60) p = doorStep(p, false, 1000 / 60, false);
    expect(p).toBe(0);
  });

  it("never jumps after a long pause, and stays between shut and open", () => {
    expect(doorStep(0, true, 5000, false)).toBeLessThan(0.3);
    expect(doorStep(1, true, 50, false)).toBe(1);
    expect(doorStep(0, false, 50, false)).toBe(0);
  });

  it("jumps straight open or shut with reduced motion", () => {
    expect(doorStep(0, true, 16, true)).toBe(1);
    expect(doorStep(1, false, 16, true)).toBe(0);
  });

  it("eases in and out: slow at both ends, halfway at the middle", () => {
    expect(easeInOut(0)).toBe(0);
    expect(easeInOut(1)).toBe(1);
    expect(easeInOut(0.5)).toBeCloseTo(0.5);
    expect(easeInOut(0.1)).toBeLessThan(0.1);
    expect(easeInOut(0.9)).toBeGreaterThan(0.9);
  });

  it("the moving leaf stays inside the 32×32 frame, under the light", () => {
    const { leaf, light } = DOOR;
    expect(leaf.x + leaf.w).toBeLessThanOrEqual(32 - leaf.x);
    expect(light.y + light.h).toBeLessThanOrEqual(leaf.y);
  });
});
