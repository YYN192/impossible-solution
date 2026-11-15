import { getSprite, playerSprite, type Facing } from "./assets";
import type { Point, Room } from "./world";
const floor = "environment/floors/mars-floor-";
/** The dust storm as the canvas shows it: fog strength 0–1, a broken greenhouse, "!" over jobs to do. */
export interface StormView { level: number; broken: boolean; marks: string[] }

export function renderWorld(ctx: CanvasRenderingContext2D, room: Room, player: Point & { facing: Facing }, time: number, moving: boolean, near: string | undefined, reduced: boolean, storm: StormView = { level: 0, broken: false, marks: [] }) {
  ctx.imageSmoothingEnabled = false;
  const sprite = (path: string, x: number, y: number, w: number, h: number) => {
    const img = getSprite(path);
    if (img.complete && img.naturalWidth) ctx.drawImage(img, Math.round(x), Math.round(y), w, h);
  };
  ctx.fillStyle = "#070e19"; ctx.fillRect(0, 0, room.width, room.height);
  // Warm Mars beyond the base; the habitat itself stays silver and blue.
  sprite("backgrounds/mars-menu-space", 0, -104, 640, 256);
  for (let y = 64; y < 352; y += 16) for (let x = 16; x < 624; x += 16) {
    sprite(floor + ((x >= 288 && x < 352) || (y >= 240 && y < 256) ? "reinforced" : "metal"), x, y, 16, 16);
    // Calm floor: plain metal, a stable hash lightens ~1 tile in 9 very slightly (no busy "panel" grid).
    if (((x * 7 + y * 13) ^ (x >> 3)) % 9 === 0) { ctx.fillStyle = "#ffffff07"; ctx.fillRect(x, y, 16, 16); }
  }
  for (let x = 16; x < 624; x += 16) {
    sprite("environment/walls/mars-wall-straight", x, 48, 16, 16);
    sprite("environment/walls/mars-wall-bottom-edge", x, 352, 16, 16);
    if (x < 272 || x > 352) sprite(floor + "blue-strip", x, 240, 16, 16);
  }
  for (let y = 64; y < 352; y += 16) {
    sprite("environment/walls/mars-wall-left-edge", 16, y, 16, 16);
    sprite("environment/walls/mars-wall-right-edge", 608, y, 16, 16);
  }
  for (const x of [64, 144, 400, 480]) sprite("environment/windows/mars-window-mountains", x, 40, 64, 40);
  for (const x of [40, 240, 376, 584]) for (const y of [96, 208, 320]) {
    sprite("environment/decorations/mars-floor-light", x, y, 16, 16);
  }
  for (const x of [32, 592]) sprite("environment/decorations/mars-pipe", x, 144, 16, 64);
  for (const x of [64, 192, 416, 560]) sprite("environment/decorations/mars-vent", x, 336, 32, 16);
  // Marked console bay and light strips make the goal easy to find.
  // The bay outline pulses gently to guide the player to Mission Control (steady with reduced motion).
  ctx.globalAlpha = reduced ? 1 : 0.55 + 0.45 * Math.sin(time / 380);
  ctx.strokeStyle = "#57829b"; ctx.lineWidth = 1; ctx.strokeRect(272.5, 104.5, 95, 94);
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#29445b"; ctx.fillRect(272, 198, 96, 3);
  const entities = room.entities.map((e) => ({ y: e.y + e.h, draw: () => {
    if (e.id === "greenhouse") { greenhouse(ctx, e.x, e.y, storm.broken); return; }
    let path = e.sprite;
    if (e.id === "console") path = `consoles/mission-console-${near === e.id ? "highlighted" : !reduced && Math.floor(time / 1100) % 4 === 0 ? "inactive" : "active"}`;
    if (e.interaction === "door" && near === e.id) path = "environment/doors/mars-door-airlock-open";
    const bob = !reduced && e.id === "drone" ? Math.round(Math.sin(time / 450) * 2) : 0;
    sprite(path, e.x, e.y + bob, e.w, e.h);
    if (e.interaction === "npc" && !reduced && Math.floor(time / 1700 + e.x) % 5 === 0) {
      ctx.fillStyle = "#a1e5e5"; ctx.fillRect(e.x + 15, e.y - 5, 2, 2);
    }
  }}));
  entities.push({ y: player.y, draw: () => {
    ctx.fillStyle = "#090f1d88"; ctx.fillRect(Math.round(player.x - 10), Math.round(player.y - 3), 20, 5);
    sprite(playerSprite(player.facing, moving && !reduced ? Math.floor(time / 140) % 4 : undefined), player.x - 16, player.y - 27, 32, 32);
  }});
  entities.sort((a, b) => a.y - b.y).forEach((e) => e.draw());
  if (storm.level > 0) {
    // Dust everywhere; the astronaut's helmet lamp keeps a small clear circle.
    const g = ctx.createRadialGradient(player.x, player.y - 12, 26, player.x, player.y - 12, 200);
    g.addColorStop(0, `rgba(196,112,58,${0.12 * storm.level})`); g.addColorStop(1, `rgba(120,62,30,${0.82 * storm.level})`);
    ctx.fillStyle = g; ctx.fillRect(0, 0, room.width, room.height);
    ctx.fillStyle = `rgba(236,178,118,${0.45 * storm.level})`;
    for (let i = 0; i < 90; i++) {
      const x = (((i * 97) + (reduced ? 0 : time * 0.12 * (1 + i % 4))) % (room.width + 60)) - 30;
      const y = ((i * 53) + (reduced ? 0 : time * 0.02 * (i % 5))) % room.height;
      ctx.fillRect(Math.round(x), Math.round(y), 4 + i % 6, 1);
    }
  }
  for (const id of storm.marks) {
    const e = room.entities.find((n) => n.id === id);
    if (!e) continue;
    const y = e.y - 18 + (reduced ? 0 : Math.round(Math.sin(time / 260) * 2));
    ctx.fillStyle = "#080b12"; ctx.fillRect(e.x + e.w / 2 - 7, y - 1, 14, 16);
    ctx.fillStyle = "#f5c542"; ctx.fillRect(e.x + e.w / 2 - 6, y, 12, 14);
    ctx.fillStyle = "#080b12"; ctx.fillRect(e.x + e.w / 2 - 1, y + 2, 2, 7); ctx.fillRect(e.x + e.w / 2 - 1, y + 10, 2, 2);
  }
  // Area names are HTML overlays in MarsHub so they stay sharp and readable at any scale.
  ctx.font = "bold 10px monospace"; ctx.textAlign = "center";
  if (near) { ctx.fillStyle = "#0b1829"; ctx.fillRect(Math.round(player.x - 10), Math.round(player.y - 47), 20, 16); ctx.fillStyle = "#b4f6ed"; ctx.fillText("E", Math.round(player.x), Math.round(player.y - 35)); }
}

/** A small pixel greenhouse (glass dome over a planter), drawn in code; `broken` after a dust storm. */
function greenhouse(ctx: CanvasRenderingContext2D, x: number, y: number, broken: boolean) {
  const box = (c: string, dx: number, dy: number, w: number, h: number) => { ctx.fillStyle = c; ctx.fillRect(x + dx, y + dy, w, h); };
  box("#080b12", 0, 15, 64, 15); box("#3a4656", 1, 16, 62, 13); box("#8a9aae", 1, 16, 62, 2); box("#5a3a22", 4, 19, 56, 4);
  for (let i = 0; i < 7; i++) {
    const px = 6 + i * 8;
    if (broken) { box("#8a5a2b", px, 17 - (i % 2), 2, 2 + (i % 2)); box("#6b4423", px + 2, 18, 2, 1); }
    else { box("#3f8f45", px + 1, 8 + (i % 3), 2, 10 - (i % 3)); box("#7fd36e", px - 1, 9 + (i % 3), 3, 2); box("#7fd36e", px + 2, 12, 3, 2); }
  }
  for (let r = 0; r < 14; r++) {
    const half = Math.round(Math.sqrt(Math.max(0, 30 * 30 - (14 - r) * (14 - r) * 4.4)));
    box(broken && r % 3 === 0 ? "#c9a27a55" : "#9de3d833", 32 - half, 2 + r, half * 2, 1);
  }
  box("#b4f6ed", 10, 2, 44, 1);
  if (broken) { box("#080b12", 20, 3, 1, 6); box("#080b12", 21, 8, 4, 1); box("#080b12", 40, 4, 1, 8); box("#d18a4a", 6, 25, 52, 4); }
}
