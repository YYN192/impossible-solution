import { describe, expect, it } from "vitest";
import { solChanges } from "./changes";

const night = { power: 5, air: 6, dose: 1, food: 3, science: 0 };

describe("end-of-sol changes (#65)", () => {
  it("lists only what changed, bad news first, each in a fixed order", () => {
    const after = { power: 7, air: 5, dose: 1.4, food: 3, science: 1 };
    expect(solChanges(night, after).map((c) => [c.key, c.good])).toEqual([
      ["air", false], ["dose", false], // bad: they need the kid's attention
      ["power", true], ["science", true], // good
    ]);
  });

  it("knows which way is good: more space rays are bad, more of the rest is good", () => {
    const [dose] = solChanges(night, { ...night, dose: 0.5 });
    expect(dose).toEqual({ key: "dose", from: 1, to: 0.5, good: true });
    const [food] = solChanges(night, { ...night, food: 2 });
    expect(food).toMatchObject({ key: "food", good: false });
  });

  it("ignores changes too small to show (meters show one decimal)", () => {
    expect(solChanges(night, { ...night, dose: 1.04 })).toEqual([]);
  });

  it("without a before snapshot (a restored run) shows nothing rather than guessing", () => {
    expect(solChanges(undefined, night)).toEqual([]);
    expect(solChanges({ power: 5, air: 6, dose: 1 }, { ...night, food: 9 })).toEqual([]); // food unknown: skipped
  });
});
