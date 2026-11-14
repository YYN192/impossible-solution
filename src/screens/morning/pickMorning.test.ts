import { describe, expect, it } from "vitest";
import type { Domino, EarthAnswer, StormEvent } from "../../sim/types";
import { pickMorning } from "./pickMorning";

const dom = (id: string, causeIds: string[] = []): Domino => ({
  id,
  sol: 1,
  icon: "x",
  textKey: "k",
  causeIds,
});
const src = { label: "l", url: "u", mode: "snapshot" as const };
const burst: StormEvent = {
  sol: 2,
  kind: "particleBurst",
  captionKey: "c",
  source: src,
};
const earth: EarthAnswer = { dustTomorrow: "clear", source: src };

describe("pickMorning", () => {
  it("nothing fell → no headline", () => {
    expect(pickMorning({ sol: 1, fell: [], all: [], events: [] })).toEqual({});
  });

  it("headline is the newest domino with a cause, and its cause is resolved", () => {
    const skip = dom("skip");
    const low = dom("low", ["skip"]);
    const r = pickMorning({
      sol: 2,
      fell: [skip, low, dom("other")],
      all: [skip, low],
      events: [],
    });
    expect(r.headline?.id).toBe("low");
    expect(r.cause?.id).toBe("skip");
  });

  it("falls back to the newest domino when none has a cause", () => {
    const r = pickMorning({
      sol: 2,
      fell: [dom("a"), dom("b")],
      all: [],
      events: [],
    });
    expect(r.headline?.id).toBe("b");
    expect(r.cause).toBeUndefined();
  });

  it("unknown cause id → no cause shown, no crash", () => {
    const r = pickMorning({
      sol: 2,
      fell: [dom("low", ["gone"])],
      all: [],
      events: [],
    });
    expect(r.cause).toBeUndefined();
  });

  it("today's event beats Earth's answer (max one extra sentence)", () => {
    expect(
      pickMorning({
        sol: 2,
        fell: [],
        all: [],
        events: [burst],
        earthAnswer: earth,
      }).extra,
    ).toEqual({
      kind: "event",
      event: burst,
    });
  });

  it("an event on another sol is ignored; Earth's answer shows", () => {
    expect(
      pickMorning({
        sol: 3,
        fell: [],
        all: [],
        events: [burst],
        earthAnswer: earth,
      }).extra,
    ).toEqual({
      kind: "earth",
      answer: earth,
    });
  });
});
