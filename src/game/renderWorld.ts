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
  // Console bay guide: a calm outline with soft "chase lights" running all the way round (classic arcade marquee).
  // It rests once the player arrives, and while a storm sends them elsewhere first.
  if (near !== "console" && !storm.marks.length) {
    ctx.lineWidth = 1; ctx.strokeStyle = "#3d5d73"; ctx.strokeRect(272.5, 108.5, 95, 90);
    ctx.setLineDash([4, 8]); ctx.lineDashOffset = reduced ? 0 : -time / 45;
    ctx.strokeStyle = "#8fd3e8aa"; ctx.strokeRect(272.5, 108.5, 95, 90);
    ctx.setLineDash([]);
  }
  ctx.fillStyle = "#29445b"; ctx.fillRect(272, 198, 96, 3);
  const entities = room.entities.map((e) => ({ y: e.y + e.h, draw: () => {
    if (e.id === "greenhouse") { greenhouse(ctx, e.x, e.y, storm.broken); return; }
    let path = e.sprite;
    if (e.id === "console") path = `consoles/mission-console-${near === e.id ? "highlighted" : !reduced && Math.floor(time / 1100) % 4 === 0 ? "inactive" : "active"}`;
    const bob = !reduced && e.id === "drone" ? Math.round(Math.sin(time / 450) * 2) : 0;
    // Crew turn to face you when you come close (their idle sprites exist for all four directions).
    if (near === e.id && path.includes("-idle-")) {
      const dx = player.x - (e.x + e.w / 2), dy = player.y - (e.y + e.h - 4);
      path = path.replace(/-idle-\w+$/, `-idle-${Math.abs(dx) > Math.abs(dy) ? dx > 0 ? "right" : "left" : dy > 0 ? "front" : "back"}`);
    }
    if (e.interaction === "door") { door(ctx, getSprite(path), e.x, e.y, e.w, e.h, near === e.id, reduced); return; }
    sprite(path, e.x, e.y + bob, e.w, e.h);
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
  // A speech bubble over everyone you can talk to: small and quiet from afar, bigger with "…" when you are close.
  for (const e of room.entities) if (e.interaction === "npc") {
    const close = near === e.id, cx = Math.round(e.x + e.w / 2), y = e.y - (close ? 13 : 7) + (reduced ? 0 : Math.round(Math.sin(time / 300 + e.x) * (close ? 1.5 : 1)));
    const w = close ? 16 : 8, h = close ? 10 : 6;
    ctx.fillStyle = "#080b12"; ctx.fillRect(cx - w / 2 - 1, y - 1, w + 2, h + 2); ctx.fillRect(cx - 2, y + h, 4, 3);
    ctx.fillStyle = close ? "#f2f6fa" : "#a9bccb"; ctx.fillRect(cx - w / 2, y, w, h); ctx.fillRect(cx - 1, y + h, 2, 2);
    ctx.fillStyle = "#080b12";
    if (close) for (let i = 0; i < 3; i++) if (reduced || Math.floor(time / 250) % 4 > i) ctx.fillRect(cx - 5 + i * 4, y + 4, 2, 2);
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

/** Sliding airlock (like classic top-down games): the frame stays put and the two panels part, never a sprite swap. */
let doorOpen = 0;
function door(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number, open: boolean, reduced: boolean) {
  if (!img.complete || !img.naturalWidth) return;
  doorOpen = reduced ? Number(open) : Math.max(0, Math.min(1, doorOpen + (open ? 0.08 : -0.08)));
  ctx.drawImage(img, x, y, w, h);
  if (!doorOpen) return;
  const sw = img.naturalWidth, sh = img.naturalHeight, inset = w * 0.16, shift = Math.round(doorOpen * (w / 2 - inset));
  ctx.save();
  ctx.beginPath(); ctx.rect(x + inset, y + h * 0.12, w - inset * 2, h * 0.88); ctx.clip();
  ctx.fillStyle = "#03060c"; ctx.fillRect(x, y, w, h);
  ctx.drawImage(img, 0, 0, sw / 2, sh, x - shift, y, w / 2, h);
  ctx.drawImage(img, sw / 2, 0, sw / 2, sh, x + w / 2 + shift, y, w / 2, h);
  ctx.restore();
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
