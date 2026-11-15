import { describe, expect, it } from "vitest";
import { cellsFor, engineeringGraphs, MAX_CELLS } from "./engineeringGraphs";

describe("engineering graphs: bar data from sourced facts", () => {
  const [power, cold, rays] = engineeringGraphs();
  it("sizes bars against the biggest bar, never below one block", () => {
    expect(cellsFor(425, 425)).toBe(MAX_CELLS);
    expect(cellsFor(0, 71)).toBe(0);
    expect(cellsFor(0.21, 8.1)).toBe(1);
  });
  it("InSight: 425 Wh clean vs 275 Wh in the October 2022 dust storm", () => {
    expect(power.bars.map((b) => b.value)).toEqual([425, 275]);
    expect(power.bars.map((b) => b.cells)).toEqual([12, 8]);
  });
  it("REMS: a −71 °C night is far from 0 °C ice", () => {
    expect(cold.bars.map((b) => [b.value, b.cells])).toEqual([
      [0, 0],
      [-71, 12],
    ]);
  });
  it("Curiosity RAD: 0.21 mGy a normal day vs 8.1 mGy one storm", () => {
    expect(rays.bars.map((b) => b.value)).toEqual([0.21, 8.1]);
    expect(rays.bars[1].cells).toBe(MAX_CELLS);
  });
  it("every graph carries a source that is never called live", () => {
    for (const g of engineeringGraphs()) expect(g.source.mode).not.toBe("live");
  });
});
