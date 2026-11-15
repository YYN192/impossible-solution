import { describe, expect, it } from "vitest";
import { act, createGame } from "./engine";
import { buildMap, driveAction, move, reachCost, startDrive, type ExploreMap } from "./explore";
import { rng } from "./rng";
import snap from "../data/snapshots/rover-map-gale.json";

const GALE = { colors: snap.data.colors, cols: snap.data.cols, crop: { x0: 2, y0: 4, cols: 12, rows: 8 }, base: { x: 6, y: 3 } };
const map = (seed: number): ExploreMap => buildMap(GALE, rng(seed));
/** Drive along a list of cells (each next to the last). */
function follow(m: ExploreMap, path: { x: number; y: number }[]) {
  let d = startDrive(m);
  for (const c of path) d = move(m, d, c.x - d.x, c.y - d.y);
  return d;
}
/** Cheapest way from the base to a cell, as a list of cells. */
function route(m: ExploreMap, to: { x: number; y: number }) {
  const cost = reachCost(m);
  const path = [to];
  let cur = to;
  while (cur.x !== m.base.x || cur.y !== m.base.y) {
    const next = [[1, 0], [-1, 0], [0, 1], [0, -1]]
      .map(([dx, dy]) => ({ x: cur.x + dx, y: cur.y + dy }))
      .filter((c) => c.x >= 0 && c.y >= 0 && c.x < m.cols && c.y < m.rows)
      .sort((a, b) => cost[a.y * m.cols + a.x] - cost[b.y * m.cols + b.x])[0];
    path.unshift(next);
    cur = next;
  }
  return path.slice(1);
}

describe("rover map from the real Mars Trek picture", () => {
  it("keeps the real colours and turns the darkest ground into rocks and rough ground", () => {
    const m = map(1);
    expect(m.cells).toHaveLength(12 * 8);
    expect(m.cells[0].color).toBe(snap.data.colors[4 * 16 + 2]);
    const kinds = new Set(m.cells.map((c) => c.terrain));
    expect(kinds).toEqual(new Set(["sand", "rough", "rock"]));
    expect(m.cells[m.base.y * m.cols + m.base.x].terrain).toBe("sand");
  });

  it("is the same for the same seed, and puts the samples elsewhere for another seed", () => {
    expect(map(5)).toEqual(map(5));
    const places = new Set([1, 2, 3, 4, 5, 6].map((s) => JSON.stringify(map(s).samples)));
    expect(places.size).toBeGreaterThanOrEqual(4);
  });

  it("every sample can be fetched and brought home on one battery, for 60 seeds", () => {
    for (let seed = 1; seed <= 60; seed++) {
      const m = map(seed);
      const cost = reachCost(m);
      expect(m.samples).toHaveLength(3);
      for (const s of m.samples) {
        expect(m.cells[s.y * m.cols + s.x].terrain).not.toBe("rock");
        expect(cost[s.y * m.cols + s.x] * 2, `seed ${seed}`).toBeLessThanOrEqual(m.battery);
      }
    }
  });
});

describe("driving", () => {
  it("each move spends battery: 1 on sand, 2 on rough ground; rocks and the map edge stop the rover", () => {
    const m = map(1);
    const start = startDrive(m);
    expect(start).toMatchObject({ ...m.base, battery: m.battery, collected: [] });
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    for (const [dx, dy] of dirs) {
      const cell = m.cells[(m.base.y + dy) * m.cols + m.base.x + dx];
      const after = move(m, start, dx, dy);
      if (cell.terrain === "rock") expect(after).toBe(start);
      else expect(start.battery - after.battery).toBe(cell.terrain === "rough" ? 2 : 1);
    }
    expect(move(m, { ...start, x: 0, y: 0 }, -1, 0)).toMatchObject({ x: 0, y: 0 });
    const flat = move(m, { ...start, battery: 0 }, 1, 0);
    expect(flat.battery).toBe(0);
    expect(flat.x).toBe(start.x);
  });

  it("driving over a sample picks it up", () => {
    const m = map(2);
    const d = follow(m, route(m, m.samples[0]));
    expect(d.collected).toEqual([0]);
  });
});

describe("the drive is one engine action", () => {
  it("home with samples: science goes up and the drive costs power", () => {
    const m = map(2);
    const out = route(m, m.samples[0]);
    const d = follow(m, [...out, ...out.slice(0, -1).reverse(), m.base]);
    expect(d).toMatchObject(m.base);
    const action = driveAction(m, d);
    expect(action.effect?.science).toBe(1);
    expect(action.effect?.power).toBeLessThan(0);
    expect(action.effect?.dose).toBeUndefined();
    const { state, fell } = act(createGame(), action);
    expect(state.science).toBe(1);
    expect(fell[0].textKey).toBe("domino.rover.home1");
  });

  it("stranded away from the base: no science, and the crew walks out to tow it (space rays)", () => {
    const m = map(2);
    const d = follow(m, route(m, m.samples[0]));
    const action = driveAction(m, d);
    expect(action.effect?.science).toBeUndefined();
    expect(action.effect?.dose).toBeGreaterThan(0);
    expect(action.textKey).toBe("domino.rover.stranded");
  });

  it("not driving at all costs nothing", () => {
    const m = map(2);
    const action = driveAction(m, startDrive(m));
    expect(action.effect).toEqual({});
    expect(action.textKey).toBe("domino.rover.home0");
  });
});
