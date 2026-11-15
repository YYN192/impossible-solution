/**
 * Mission 1's hands-on moments (#59). Each one ends in one of the beat's existing options, so the
 * engine, the balance and the real-data cards stay exactly as they were.
 */
import { describe, expect, it } from "vitest";
import {
  BUILD_SPOT, CHARGE_MS, CLEAN_AT, RUB_KEY, TRIP_MS, WIPE_PANELS,
  advanceSignal, charge, cleanCount, dialStep, heaterChoice, placePart, rub, rubFromDrag, signalView, startWipe, wipeChoice,
} from "./handsOn";

describe("sol 5: swipe the dust off the panels", () => {
  it("starts with 6 fully dusty panels", () => {
    expect(startWipe()).toEqual(Array(WIPE_PANELS).fill(1));
    expect(cleanCount(startWipe())).toBe(0);
  });

  it("rubbing lowers one panel's dust, never below 0, and leaves the others alone", () => {
    const d = rub(startWipe(), 2, 0.4);
    expect(d[2]).toBeCloseTo(0.6);
    expect(d.filter((_, i) => i !== 2)).toEqual(Array(WIPE_PANELS - 1).fill(1));
    expect(rub(d, 2, 5)[2]).toBe(0);
    expect(rub(d, 9, 0.5)).toBe(d); // no such panel: nothing changes
  });

  it("three Space presses clean a panel; about 2.5 panel widths of rubbing clean one too", () => {
    let d = startWipe();
    for (let i = 0; i < 3; i++) d = rub(d, 0, RUB_KEY);
    expect(d[0]).toBeLessThanOrEqual(CLEAN_AT);
    expect(rubFromDrag(250, 100)).toBeCloseTo(1);
    expect(rubFromDrag(50, 100)).toBeCloseTo(0.2);
    expect(rubFromDrag(-30, 100)).toBe(0);
  });

  it("going inside picks the beat option: none, half (1–5 clean) or all (6 clean)", () => {
    const cleaned = (n: number) => startWipe().map((d, i) => (i < n ? 0 : d));
    expect(wipeChoice(cleaned(0))).toBe("none");
    expect(wipeChoice(cleaned(1))).toBe("half");
    expect(wipeChoice(cleaned(5))).toBe("half");
    expect(wipeChoice(cleaned(6))).toBe("all");
  });
});

describe("sol 2: drag a part onto the base", () => {
  it("each part has its own spot", () => {
    expect(BUILD_SPOT).toEqual({ brush: "panels", shelf: "greenhouse", walls: "shelter" });
  });

  it("the right spot builds it; a wrong spot says where it belongs", () => {
    expect(placePart("brush", "panels")).toEqual({ ok: true });
    expect(placePart("walls", "shelter")).toEqual({ ok: true });
    expect(placePart("shelf", "panels")).toEqual({ ok: false, belongs: "greenhouse" });
  });
});

describe("sol 3: race the radio signal", () => {
  it("holding Send charges the dish; it is ready once full", () => {
    expect(charge(0)).toBe(0);
    expect(charge(CHARGE_MS / 2)).toBeCloseTo(0.5);
    expect(charge(CHARGE_MS * 3)).toBe(1);
  });

  it("the clock counts real signal minutes (time-lapse); fast-forward speeds the clock, not the light", () => {
    const slow = advanceSignal(0, 1000, false, 12), fast = advanceSignal(0, 1000, true, 12);
    expect(slow).toBeCloseTo(12 * 1000 / TRIP_MS);
    expect(fast).toBeCloseTo(slow * 3);
    expect(advanceSignal(5, 0, false, 12)).toBe(5);
  });

  it("every trip takes about the same time on screen, short delay or long", () => {
    const trip = (delay: number) => { let m = 0, ms = 0; while (!signalView(m, delay).arrived) { m = advanceSignal(m, 100, false, delay); ms += 100; } return ms; };
    expect(trip(3)).toBe(TRIP_MS);
    expect(trip(22)).toBe(TRIP_MS);
  });

  it("the message arrives after exactly the real delay, never sooner", () => {
    expect(signalView(0, 12)).toEqual({ minutes: 0, progress: 0, arrived: false });
    expect(signalView(6.7, 12)).toEqual({ minutes: 6, progress: 6.7 / 12, arrived: false });
    expect(signalView(11.99, 12).arrived).toBe(false);
    expect(signalView(40, 12)).toEqual({ minutes: 12, progress: 1, arrived: true });
  });

});

describe("sol 4: the heater dial on a cold night", () => {
  it("one key press turns the dial all the way: Off (0°) or On (180°)", () => {
    expect(dialStep(1)).toBe(180);
    expect(dialStep(-1)).toBe(0);
  });

  it("On means the heater (power), Off means huddling together (food)", () => {
    expect(heaterChoice(180)).toBe("heat");
    expect(heaterChoice(100)).toBe("heat");
    expect(heaterChoice(80)).toBe("huddle");
    expect(heaterChoice(0)).toBe("huddle");
  });
});
