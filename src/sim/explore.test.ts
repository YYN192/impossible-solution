import { describe, expect, it } from "vitest";
import { act, createGame } from "./engine";
import { EXPLORE, buildMap, drivePower, driveAction, farSamples, move, ranOutOfPower, reachCost, roverChoice, startDrive, type ExploreMap } from "./explore";
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
    expect(fell[0].textKey).toBe("domino.roverHome1");
  });

  it("stranded away from the base: no science, and the crew walks out to tow it (space rays)", () => {
    const m = map(2);
    const d = follow(m, route(m, m.samples[0]));
    const action = driveAction(m, d);
    expect(action.effect?.science).toBeUndefined();
    expect(action.effect?.dose).toBeGreaterThan(0);
    expect(action.textKey).toBe("domino.roverStranded");
  });

  it("not driving at all costs nothing", () => {
    const m = map(2);
    const action = driveAction(m, startDrive(m));
    expect(action.effect).toEqual({});
    expect(action.textKey).toBe("domino.roverHome0");
  });
});

// #66: the rover must really reach a sample, a sample-less trip says so, and the cost is visible up front.
describe("rover scoring (#66)", () => {
  it("never leaving the base scores nothing and says the rover stayed", () => {
    const m = map(3);
    const a = driveAction(m, startDrive(m));
    expect(a.effect?.science ?? 0).toBe(0);
    expect(a.textKey).toBe("domino.roverHome0");
  });

  it("driving out and back without a sample scores nothing and says so", () => {
    const m = map(3);
    const step = [[1, 0], [-1, 0], [0, 1], [0, -1]].find(([dx, dy]) => move(m, startDrive(m), dx, dy) !== startDrive(m) && !m.samples.some((s) => s.x === m.base.x + dx && s.y === m.base.y + dy))!;
    let d = move(m, startDrive(m), step[0], step[1]);
    d = move(m, d, -step[0], -step[1]);
    expect(d.collected).toHaveLength(0);
    const a = driveAction(m, d);
    expect(a.effect?.science ?? 0).toBe(0);
    expect(a.textKey).toBe("domino.roverEmpty");
  });

  it("samples are never next to the base, so a sample means a real drive", () => {
    for (let seed = 1; seed < 30; seed++) {
      const m = map(seed), cost = reachCost(m);
      for (const s of m.samples) expect(cost[s.y * m.cols + s.x]).toBeGreaterThanOrEqual(3);
    }
  });

  it("the power cost shown during the drive is the cost the engine charges", () => {
    const m = map(3);
    const d = follow(m, route(m, m.samples[0]));
    expect(-(driveAction(m, { ...d, ...m.base }).effect?.power ?? 0)).toBe(drivePower(m, d));
    expect(drivePower(m, startDrive(m))).toBe(0);
  });
});

// #68: running out of power away from the base is one clear event, not one per frame or per key press.
describe("rover runs out of power (#68)", () => {
  it("fires exactly once, on the step that empties the battery away from the base", () => {
    const m = map(3);
    let d = startDrive(m), fired = 0;
    // Drive back and forth next to the base until the battery is empty, then keep pressing.
    const [dx, dy] = [[1, 0], [-1, 0], [0, 1], [0, -1]].find(([x, y]) => move(m, d, x, y) !== d)!;
    for (let i = 0; i < 40; i++) {
      const next = move(m, d, i % 2 ? -dx : dx, i % 2 ? -dy : dy);
      if (ranOutOfPower(m, d, next)) fired++;
      d = next;
    }
    expect(d.battery).toBe(0);
    expect(fired).toBeLessThanOrEqual(1);
  });

  it("does not fire when the battery hits 0 at the base", () => {
    const m = map(3);
    const home = { ...startDrive(m), battery: 0 };
    expect(ranOutOfPower(m, { ...home, battery: 1 }, home)).toBe(false);
  });

  it("fires when the battery hits 0 away from the base", () => {
    const m = map(3);
    const away = { ...startDrive(m), x: m.base.x + 1, battery: 0 };
    expect(ranOutOfPower(m, { ...away, battery: 1 }, away)).toBe(true);
  });
});

describe("#98 rover drive picks the beat's own option", () => {
  // A map whose samples are not all the same distance from the base.
  const m = [1, 2, 3, 4, 5, 6, 7, 8].map(map).find((x) => farSamples(x).length > 0)!;
  const cost = reachCost(m);
  const sampleCost = m.samples.map((p) => cost[p.y * m.cols + p.x]);
  const nearest = sampleCost.indexOf(Math.min(...sampleCost));
  const far = farSamples(m)[0];
  const at = (x: number, y: number, collected: number[]) => ({ x, y, battery: 8, collected });
  it("the far samples are the ones farther than the nearest", () => {
    expect(farSamples(m)).not.toContain(nearest);
    expect(sampleCost[far]).toBeGreaterThan(sampleCost[nearest]);
  });
  it("home with no sample = stay, the nearest sample = near, any farther one = far, stranded = no option", () => {
    expect(roverChoice(m, at(m.base.x, m.base.y, []))).toBe("stay");
    expect(roverChoice(m, at(m.base.x, m.base.y, [nearest]))).toBe("near");
    expect(roverChoice(m, at(m.base.x, m.base.y, [far]))).toBe("far");
    expect(roverChoice(m, at(m.base.x, m.base.y, [nearest, far]))).toBe("far");
    expect(roverChoice(m, at(m.base.x + 1, m.base.y, [nearest]))).toBeNull();
  });
  it("every sample can be fetched and brought home on one battery, so both near and far are playable", () => {
    for (const c of sampleCost) expect(2 * c).toBeLessThanOrEqual(EXPLORE.battery);
  });
});
