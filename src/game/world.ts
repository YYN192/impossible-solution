import type { Facing } from "./assets";

export interface Point { x: number; y: number }
export interface Rect extends Point { w: number; h: number }
export interface Entity extends Rect {
  id: string;
  sprite: string;
  solid?: boolean;
  interaction?: "console" | "npc" | "door" | "task";
  dialogue?: "commander" | "engineer" | "scientist" | "drone" | "airlock" | "greenhouse";
}
export interface Room { id: string; width: number; height: number; bounds: Rect; entities: Entity[] }
const object = (id: string, sprite: string, x: number, y: number, w = 32, h = 32): Entity => ({ id, sprite, x, y, w, h, solid: true });
/** One authored base. Future rooms can supply another Room, without changing movement. */
export const MARS_BASE: Room = {
  id: "ares", width: 640, height: 384, bounds: { x: 32, y: 80, w: 576, h: 272 },
  entities: [
    { ...object("console", "consoles/mission-console-active", 288, 112, 64, 64), interaction: "console" },
    object("monitor", "consoles/mission-monitor", 288, 58, 64, 48),
    object("lab", "consoles/research-terminal", 480, 96),
    object("lab2", "environment/decorations/mars-research-equipment", 528, 96),
    object("supply", "environment/decorations/mars-shelf", 64, 112, 64, 32),
    object("supply2", "environment/decorations/mars-shelf", 144, 112, 64, 32),
    object("radar", "consoles/radar", 400, 96),
    object("map", "consoles/planet-map", 432, 96),
    object("table", "environment/decorations/mars-table", 448, 272, 64, 32),
    object("chair", "environment/decorations/mars-chair", 464, 310, 24, 24),
    object("crate1", "environment/decorations/mars-crate", 64, 288),
    object("crate2", "environment/decorations/mars-crate", 96, 288),
    object("machine", "consoles/charging-station", 560, 272),
    { ...object("greenhouse", "", 176, 286, 64, 30), interaction: "task", dialogue: "greenhouse" },
    { ...object("airlock", "environment/doors/mars-door-airlock-closed", 288, 336, 64, 32), interaction: "door", dialogue: "airlock" },
    { ...object("commander", "characters/npcs/mission-commander-idle-front", 208, 168), interaction: "npc", dialogue: "commander" },
    { ...object("scientist", "characters/npcs/scientist-idle-left", 496, 176), interaction: "npc", dialogue: "scientist" },
    { ...object("engineer", "characters/npcs/engineer-idle-right", 128, 224), interaction: "npc", dialogue: "engineer" },
    { ...object("drone", "characters/robots/assistant-drone", 528, 304), interaction: "npc", dialogue: "drone" },
  ],
};

export function canStand(room: Room, x: number, y: number): boolean {
  const b = room.bounds, r = 7;
  return x >= b.x + r && x <= b.x + b.w - r && y >= b.y + r && y <= b.y + b.h - r &&
    !room.entities.some((e) => e.solid && x + r > e.x + 3 && x - r < e.x + e.w - 3 && y + r > e.y + e.h * 0.55 && y - r < e.y + e.h);
}
export function movePlayer(room: Room, p: Point & { facing: Facing }, dx: number, dy: number, seconds: number) {
  const length = Math.hypot(dx, dy);
  if (!length) return p;
  const distance = 110 * Math.min(seconds, 0.05);
  const x = p.x + dx / length * distance, y = p.y + dy / length * distance;
  const nextX = canStand(room, x, p.y) ? x : p.x;
  return { x: nextX, y: canStand(room, nextX, y) ? y : p.y,
    facing: (Math.abs(dx) > Math.abs(dy) ? dx > 0 ? "right" : "left" : dy > 0 ? "front" : "back") as Facing };
}
export function nearestInteraction(room: Room, p: Point): Entity | undefined {
  return room.entities.filter((e) => e.interaction)
    .map((e) => ({ e, distance: Math.hypot(p.x - (e.x + e.w / 2), p.y - (e.y + e.h - 5)) }))
    .filter(({ distance }) => distance < 53).sort((a, b) => a.distance - b.distance)[0]?.e;
}
/** Where a tap sends the player: in front of a tapped console/NPC/door, else the tapped floor spot (kept inside the walls). */
export function tapTarget(room: Room, tap: Point): Point & { entity?: Entity } {
  const b = room.bounds, r = 8;
  const clamp = (x: number, y: number) => ({ x: Math.min(Math.max(x, b.x + r), b.x + b.w - r), y: Math.min(Math.max(y, b.y + r), b.y + b.h - r) });
  const entity = room.entities.find((e) => e.interaction && tap.x >= e.x - 6 && tap.x <= e.x + e.w + 6 && tap.y >= e.y - 6 && tap.y <= e.y + e.h + 6);
  return entity ? { ...clamp(entity.x + entity.w / 2, entity.y + entity.h + 12), entity } : clamp(tap.x, tap.y);
}
/** One frame of tap-to-walk; `done` once arrived or blocked, so the player never pushes into a wall forever. */
export function walkToward(room: Room, p: Point & { facing: Facing }, target: Point, seconds: number) {
  const dx = target.x - p.x, dy = target.y - p.y;
  if (Math.hypot(dx, dy) < 2) return { p, done: true };
  const next = movePlayer(room, p, dx, dy, seconds);
  return { p: next, done: next.x === p.x && next.y === p.y };
}
