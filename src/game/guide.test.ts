/**
 * The first-play guide (#64): one pointer and one short sentence at a time, at the next thing to touch.
 * Pure step logic: the guide layer reads the screen into a GuideCtx and asks which step to show.
 */
import { describe, expect, it } from "vitest";
import { GUIDE_STEPS, guideAfter, guideStep, startGuide, type GuideCtx } from "./guide";

const ctx = (c: Partial<GuideCtx> = {}): GuideCtx => ({ place: "console", screen: "plan", sol: 1, blocked: false, explore: false, freeCrew: 3, crewSelected: false, ...c });
const on = startGuide(1);

describe("which step the guide points at", () => {
  it("walks through a whole first sol, one thing at a time", () => {
    expect(guideStep(ctx({ place: "menu", screen: "title" }), on)).toBe("start");
    expect(guideStep(ctx({ place: "hub", screen: "morning" }), on)).toBe("walk");
    expect(guideStep(ctx({ screen: "morning" }), on)).toBe("goal");
    expect(guideStep(ctx({ screen: "beat", explore: true }), on)).toBe("drive");
    expect(guideStep(ctx({ screen: "beat" }), on)).toBe("choose");
    expect(guideStep(ctx({ screen: "plan", freeCrew: 3 }), on)).toBe("crew");
    expect(guideStep(ctx({ screen: "plan", freeCrew: 2, crewSelected: true }), on)).toBe("job");
    expect(guideStep(ctx({ screen: "plan", freeCrew: 0 }), on)).toBe("endSol");
    expect(guideStep(ctx({ screen: "endSol" }), on)).toBe("report");
  });

  it("says nothing while a dialog, a mini-game or a page like Settings is open", () => {
    expect(guideStep(ctx({ blocked: true }), on)).toBeNull();
  });

  it("says nothing when it is off", () => {
    expect(guideStep(ctx(), { on: false, sol: 1 })).toBeNull();
  });

  it("only teaches the sol it started on; the final screen ends it", () => {
    expect(guideStep(ctx({ sol: 2, screen: "morning" }), on)).toBeNull();
    expect(guideStep(ctx({ screen: "final" }), on)).toBeNull();
  });

  it("every step points at a real control and has its own one-line text", () => {
    for (const [id, step] of Object.entries(GUIDE_STEPS)) {
      expect(step.target.length, id).toBeGreaterThan(0);
      expect(step.text, id).toBe(`guide.step.${id}`);
    }
  });
});

describe("when the guide ends", () => {
  it("stays on during its sol, and turns off once the next sol starts", () => {
    expect(guideAfter(ctx({ screen: "endSol" }), on)).toEqual(on);
    expect(guideAfter(ctx({ sol: 2, screen: "morning" }), on)).toEqual({ on: false, sol: 1 });
  });

  it("turns off on the final screen (a 1-sol run ends there)", () => {
    expect(guideAfter(ctx({ screen: "final" }), on).on).toBe(false);
  });

  it("a replay from the help starts on the sol the player is on", () => {
    expect(startGuide(3)).toEqual({ on: true, sol: 3 });
    expect(guideStep(ctx({ sol: 3, screen: "morning" }), startGuide(3))).toBe("goal");
  });

  it("an off guide stays off", () => {
    expect(guideAfter(ctx({ sol: 4 }), { on: false, sol: 1 })).toEqual({ on: false, sol: 1 });
  });
});
