/**
 * Rover exploration: a small map the kid drives on. Pure and deterministic.
 * The map's colours are real (a NASA Mars Trek picture averaged into squares); terrain, samples
 * and battery are game rules. The whole drive becomes ONE engine action (`driveAction`).
 */
import { shuffle } from "./rng";
import { DOSE, type Action } from "./types";

export type Terrain = "sand" | "rough" | "rock";
export interface Cell {
  /** Real average colour of this square in the source picture. */
  color: string;
  terrain: Terrain;
}
export interface Point {
  x: number;
  y: number;
}
export interface ExploreMap {
  cols: number;
  rows: number;
  cells: Cell[];
  base: Point;
  samples: Point[];
  /** Battery for one drive, in move costs. */
  battery: number;
}
export interface MapSource {
  /** Row-major colours of the source grid. */
  colors: string[];
  /** Columns of the source grid. */
  cols: number;
  /** The part of the source grid that becomes the map. */
  crop: { x0: number; y0: number; cols: number; rows: number };
  /** The base, in map squares. */
  base: Point;
}

/** Game numbers of the rover drive. */
export const EXPLORE = {
  battery: 16,
  /** Share of the darkest squares that are rocks / rough ground. */
  rockShare: 0.12,
  roughShare: 0.3,
  cost: { sand: 1, rough: 2 },
  samples: 3,
  /** Battery spent per 1 power the drive costs. */
  batteryPerPower: 6,
  /** Science the samples can add at most. */
  maxScience: 2,
};

const lum = (hex: string) =>
  0.299 * parseInt(hex.slice(1, 3), 16) + 0.587 * parseInt(hex.slice(3, 5), 16) + 0.114 * parseInt(hex.slice(5, 7), 16);

/** Cheapest battery cost from the base to every square (Infinity = cannot be reached). */
export function reachCost(map: Pick<ExploreMap, "cols" | "rows" | "cells" | "base">): number[] {
  const cost = map.cells.map(() => Infinity);
  cost[map.base.y * map.cols + map.base.x] = 0;
  // The map is tiny (about 100 squares): repeat until nothing gets cheaper.
  for (let changed = true; changed; ) {
    changed = false;
    for (let y = 0; y < map.rows; y++)
      for (let x = 0; x < map.cols; x++) {
        const here = map.cells[y * map.cols + x];
        if (here.terrain === "rock") continue;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= map.cols || ny >= map.rows) continue;
          const via = cost[ny * map.cols + nx] + EXPLORE.cost[here.terrain];
          if (via < cost[y * map.cols + x]) {
            cost[y * map.cols + x] = via;
            changed = true;
          }
        }
      }
  }
  return cost;
}

export function buildMap(src: MapSource, next: () => number): ExploreMap {
  const { crop } = src;
  const colors: string[] = [];
  for (let y = 0; y < crop.rows; y++)
    for (let x = 0; x < crop.cols; x++) colors.push(src.colors[(crop.y0 + y) * src.cols + crop.x0 + x]);
  const ranked = [...colors].map(lum).sort((a, b) => a - b);
  const rockBelow = ranked[Math.floor(ranked.length * EXPLORE.rockShare)];
  const roughBelow = ranked[Math.floor(ranked.length * (EXPLORE.rockShare + EXPLORE.roughShare))];
  const cells: Cell[] = colors.map((color) => ({
    color,
    terrain: lum(color) < rockBelow ? "rock" : lum(color) < roughBelow ? "rough" : "sand",
  }));
  cells[src.base.y * crop.cols + src.base.x].terrain = "sand";
  const map = { cols: crop.cols, rows: crop.rows, cells, base: src.base, battery: EXPLORE.battery };
  // Samples: squares the rover can reach and come back from on one battery, not next to the base.
  const cost = reachCost(map);
  const spots = cells
    .map((_, i) => ({ x: i % crop.cols, y: Math.floor(i / crop.cols) }))
    .filter((p) => {
      const c = cost[p.y * crop.cols + p.x];
      return c >= 3 && c * 2 <= EXPLORE.battery;
    });
  return { ...map, samples: shuffle(next, spots).slice(0, EXPLORE.samples) };
}

export interface Drive extends Point {
  battery: number;
  /** Indexes of the samples picked up so far. */
  collected: number[];
}

export const startDrive = (map: ExploreMap): Drive => ({ ...map.base, battery: map.battery, collected: [] });

/** One step. Rocks, the map edge and an empty battery stop the rover (the same drive is returned). */
export function move(map: ExploreMap, d: Drive, dx: number, dy: number): Drive {
  const x = d.x + dx, y = d.y + dy;
  if (Math.abs(dx) + Math.abs(dy) !== 1 || x < 0 || y < 0 || x >= map.cols || y >= map.rows) return d;
  const cell = map.cells[y * map.cols + x];
  if (cell.terrain === "rock" || EXPLORE.cost[cell.terrain] > d.battery) return d;
  const found = map.samples.findIndex((s, i) => s.x === x && s.y === y && !d.collected.includes(i));
  return { x, y, battery: d.battery - EXPLORE.cost[cell.terrain], collected: found < 0 ? d.collected : [...d.collected, found] };
}

export const isHome = (map: ExploreMap, d: Drive) => d.x === map.base.x && d.y === map.base.y;

/** #68: the step that empties the battery away from the base (one event, not one per key press). */
export const ranOutOfPower = (map: ExploreMap, prev: Drive, next: Drive) =>
  prev.battery > 0 && next.battery === 0 && !isHome(map, next);

/** The whole drive as one engine action: power for the battery used, science for samples brought home. */
/** Power the drive costs so far (shown live on the rover screen; the same number driveAction charges). */
export const drivePower = (map: ExploreMap, d: Drive): number => Math.ceil((map.battery - d.battery) / EXPLORE.batteryPerPower);

export function driveAction(map: ExploreMap, d: Drive): Action {
  const used = map.battery - d.battery;
  const power = -drivePower(map, d);
  if (!isHome(map, d))
    return {
      id: "explore-stranded",
      icon: "rover warning",
      textKey: "domino.roverStranded",
      effect: { power, dose: 2 * DOSE.outsideExtra },
    };
  const science = Math.min(EXPLORE.maxScience, d.collected.length);
  return {
    id: `explore-home${science}`,
    icon: science ? "rover rock" : "rover",
    // Drove out and came back empty-handed: say so, not "stayed at the base".
    textKey: !science && used ? "domino.roverEmpty" : `domino.roverHome${science}`,
    effect: { ...(power ? { power } : {}), ...(science ? { science } : {}) },
  };
}

/** Dust Season (#98): the samples farther from the base than the nearest one are "the far crater". */
export function farSamples(map: ExploreMap): number[] {
  const cost = reachCost(map);
  const c = map.samples.map((p) => cost[p.y * map.cols + p.x]);
  return c.flatMap((v, i) => (v > Math.min(...c) ? [i] : []));
}

/** Dust Season (#98): which of the rover beat's options the drive counts as. null = stranded away from the base. */
export function roverChoice(map: ExploreMap, d: Drive): "stay" | "near" | "far" | null {
  if (!isHome(map, d)) return null;
  if (!d.collected.length) return "stay";
  const far = farSamples(map);
  return d.collected.some((i) => far.includes(i)) ? "far" : "near";
}
