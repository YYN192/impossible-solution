import { describe, expect, it } from "vitest";
import type { Domino } from "../../sim/types";
import { buildRows } from "./buildRows";

const d = (id: string, sol: number, key: string, causeIds: string[] = []): Domino => ({ id, sol, icon: "x", textKey: `domino.${key}`, causeIds });

describe("buildRows: the final screen's domino rows", () => {
  it("runs from the first cause to the result", () => {
    const rows = buildRows([
      d("sol1-panels-skipped", 1, "panelsSkipped"),
      d("sol2-power-low", 2, "powerLow", ["sol1-panels-skipped"]),
      d("sol2-air-low", 2, "airLow", ["sol2-power-low"]),
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0].links.map((l) => l.domino.id)).toEqual(["sol1-panels-skipped", "sol2-power-low", "sol2-air-low"]);
    expect(rows[0].count).toBe(1);
  });

  it("merges stories that read the same on other sols into one row with a count", () => {
    const rows = buildRows([
      d("sol1-greenhouse-skipped", 1, "greenhouseSkipped"),
      d("sol1-food-empty", 1, "foodEmpty", ["sol1-greenhouse-skipped"]),
      d("sol2-crew-tired", 2, "crewTired", ["sol1-food-empty"]),
      d("sol2-greenhouse-skipped", 2, "greenhouseSkipped"),
      d("sol2-food-empty", 2, "foodEmpty", ["sol2-greenhouse-skipped"]),
      d("sol3-crew-tired", 3, "crewTired", ["sol2-food-empty"]),
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0].count).toBe(2);
    expect(rows[0].links.map((l) => l.sols)).toEqual([[1, 2], [1, 2], [2, 3]]);
    expect(rows[0].links.map((l) => l.domino.textKey)).toEqual(["domino.greenhouseSkipped", "domino.foodEmpty", "domino.crewTired"]);
  });

  it("keeps different stories apart, longest first, and never shows a domino twice", () => {
    const rows = buildRows([
      d("sol1-panels-skipped", 1, "panelsSkipped"),
      d("sol2-power-low", 2, "powerLow", ["sol1-panels-skipped"]),
      d("sol2-air-low", 2, "airLow", ["sol2-power-low"]),
      d("sol2-shelter-skipped", 2, "shelterSkipped"),
      d("sol2-dose-high", 2, "doseHigh", ["sol2-shelter-skipped"]),
    ]);
    expect(rows.map((r) => r.links.length)).toEqual([3, 2]);
    const ids = rows.flatMap((r) => r.links.map((l) => l.domino.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("no dominoes, no rows", () => expect(buildRows([])).toEqual([]));
});
