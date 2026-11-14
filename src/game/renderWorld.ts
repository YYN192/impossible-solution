import { getSprite, playerSprite, type Facing } from "./assets";
import type { Point, Room } from "./world";
const floor = "environment/floors/mars-floor-";
export function renderWorld(ctx: CanvasRenderingContext2D, room: Room, player: Point & { facing: Facing }, time: number, moving: boolean, near: string | undefined, reduced: boolean, labels: string[]) {
  ctx.imageSmoothingEnabled = false;
  const sprite = (path: string, x: number, y: number, w: number, h: number) => {
    const img = getSprite(path);
    if (img.complete && img.naturalWidth) ctx.drawImage(img, Math.round(x), Math.round(y), w, h);
  };
  ctx.fillStyle = "#070e19"; ctx.fillRect(0, 0, room.width, room.height);
  // Warm Mars beyond the base; the habitat itself stays silver and blue.
  sprite("backgrounds/mars-menu-space", 0, -104, 640, 256);
  for (let y = 64; y < 352; y += 16) for (let x = 16; x < 624; x += 16) {
    sprite(floor + ((x >= 288 && x < 352) || (y >= 240 && y < 256) ? "reinforced" : (x / 16 + y / 16) % 4 === 0 ? "panel" : "metal"), x, y, 16, 16);
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
  ctx.strokeStyle = "#57829b"; ctx.lineWidth = 1; ctx.strokeRect(272.5, 104.5, 95, 94);
  ctx.fillStyle = "#29445b"; ctx.fillRect(272, 198, 96, 3);
  const entities = room.entities.map((e) => ({ y: e.y + e.h, draw: () => {
    let path = e.sprite;
    if (e.id === "console") path = `consoles/mission-console-${near === e.id ? "highlighted" : !reduced && Math.floor(time / 1100) % 4 === 0 ? "inactive" : "active"}`;
    if (e.interaction === "door" && near === e.id) path = "environment/doors/mars-door-airlock-open";
    const bob = !reduced && e.id === "drone" ? Math.round(Math.sin(time / 450) * 2) : 0;
    sprite(path, e.x, e.y + bob, e.w, e.h);
    if (e.interaction === "npc" && !reduced && Math.floor(time / 1700 + e.x) % 5 === 0) {
      ctx.fillStyle = "#a1e5e5"; ctx.fillRect(e.x + 15, e.y - 5, 2, 2);
    }
    if (near === e.id) { ctx.strokeStyle = "#a0efea"; ctx.strokeRect(e.x - 2.5, e.y - 2.5, e.w + 5, e.h + 5); }
  }}));
  entities.push({ y: player.y, draw: () => {
    ctx.fillStyle = "#090f1d88"; ctx.fillRect(Math.round(player.x - 10), Math.round(player.y - 3), 20, 5);
    sprite(playerSprite(player.facing, moving && !reduced ? Math.floor(time / 140) % 4 : undefined), player.x - 16, player.y - 27, 32, 32);
  }});
  entities.sort((a, b) => a.y - b.y).forEach((e) => e.draw());
  ctx.font = "8px monospace"; ctx.textAlign = "center"; ctx.fillStyle = "#afc4d2";
  ctx.fillText(labels[0], 128, 96); ctx.fillText(labels[1], 320, 220); ctx.fillText(labels[2], 496, 152);
  ctx.fillStyle = "#7995aa"; ctx.fillText(labels[3], 320, 378);
  if (near) { ctx.fillStyle = "#0b1829"; ctx.fillRect(Math.round(player.x - 10), Math.round(player.y - 47), 20, 16); ctx.fillStyle = "#b4f6ed"; ctx.fillText("E", Math.round(player.x), Math.round(player.y - 35)); }
}
