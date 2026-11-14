import { describe, expect, it } from "vitest";
import { nextNav, START, type Nav } from "./screen";

describe("nextNav", () => {
  it("walks title → 3 × (morning → plan → endSol) → final", () => {
    const path: Nav[] = [START];
    while (path.at(-1)!.screen !== "final") path.push(nextNav(path.at(-1)!, 3));
    expect(
      path.map((n) => `${n.screen}${n.screen === "title" ? "" : n.sol}`),
    ).toEqual([
      "title",
      "morning1",
      "plan1",
      "endSol1",
      "morning2",
      "plan2",
      "endSol2",
      "morning3",
      "plan3",
      "endSol3",
      "final3",
    ]);
  });

  it("final → sol 1 morning (try again, same start)", () => {
    expect(nextNav({ screen: "final", sol: 3 })).toEqual({
      screen: "morning",
      sol: 1,
    });
  });
});
