import { getSprite, playerSprite, type Facing } from "./assets";
import type { Point, Room } from "./world";
const floor = "environment/floors/mars-floor-";
/** The dust storm as the canvas shows it: fog strength 0–1, a broken greenhouse, "!" over jobs to do. */
export interface StormView { level: number; broken: boolean; marks: string[] }

const ready = (path: string) => { const img = getSprite(path); return img.complete && img.naturalWidth > 0; };
/** Every look an entity can switch to (crew facing four ways, console states, the open airlock), loaded with the
 *  room so a switch never shows an empty frame. */
const preloaded = new WeakSet<Room>();
function preload(room: Room) {
  preloaded.add(room);
  for (const e of room.entities) {
    if (e.sprite.includes("-idle-")) for (const f of ["front", "back", "left", "right"]) getSprite(e.sprite.replace(/-idle-\w+$/, `-idle-${f}`));
    if (e.id === "console") for (const s of ["active", "inactive", "highlighted"]) getSprite(`consoles/mission-console-${s}`);
    if (e.interaction === "door") getSprite("environment/doors/mars-door-airlock-open");
  }
}

export function renderWorld(ctx: CanvasRenderingContext2D, room: Room, player: Point & { facing: Facing }, time: number, moving: boolean, near: string | undefined, reduced: boolean, storm: StormView = { level: 0, broken: false, marks: [] }) {
  if (!preloaded.has(room)) preload(room);
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
    if (e.interaction === "door") { door(ctx, getSprite(path), getSprite("environment/doors/mars-door-airlock-open"), e.x, e.y, e.w, e.h, near === e.id, reduced, time); return; }
    // A sprite that has not loaded yet draws nothing, which made crew blink out for a frame the first time they
    // turned. Until the new look is ready, keep drawing the one we already have.
    if (!ready(path)) path = ready(e.sprite) ? e.sprite : path;
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
export const DOOR = {
  /** How long the panels take to open / close, in ms. Timed by the clock, so a 60 Hz and a 144 Hz screen match. */
  openMs: 420, closeMs: 340,
  /** Where the door leaf sits in the 32×32 airlock sprites: inside the side posts, under the orange light, above the
   *  sill (columns 6–25, rows 6–28). Only this part moves; the frame around it is never covered. */
  leaf: { x: 6, y: 6, w: 20, h: 23 },
  /** Sprite columns of each panel that stay showing when fully open: the door slides into the wall, never vanishes. */
  lip: 2,
  /** The light strip over the door (sprite rows 3–5, columns 5–26): orange when shut, green while open. */
  light: { x: 5, y: 3, w: 22, h: 3 },
};
/** Smooth start and stop: the panels ease out of the frame and settle into the wall. */
export const easeInOut = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
/** Opening progress 0–1 after `dt` ms, moving toward open (`near`) or shut. Reduced motion jumps straight there. */
export function doorStep(progress: number, near: boolean, dt: number, reduced: boolean) {
  if (reduced) return near ? 1 : 0;
  const step = Math.min(dt, 100) / (near ? DOOR.openMs : DOOR.closeMs); // a long pause (tab hidden) never jumps
  return Math.max(0, Math.min(1, progress + (near ? step : -step)));
}
let doorProgress = 0, doorTime: number | undefined;
function door(ctx: CanvasRenderingContext2D, closed: HTMLImageElement, open: HTMLImageElement, x: number, y: number, w: number, h: number, near: boolean, reduced: boolean, time: number) {
  doorProgress = doorStep(doorProgress, near, doorTime === undefined ? 0 : time - doorTime, reduced);
  doorTime = time;
  if (!closed.complete || !closed.naturalWidth) return;
  ctx.drawImage(closed, x, y, w, h);
  if (!doorProgress) return;
  const eased = easeInOut(doorProgress);
  const sx = w / closed.naturalWidth, sy = h / closed.naturalHeight; // sprite pixel → canvas
  const { leaf, light } = DOOR, half = leaf.w / 2;
  const lx = x + leaf.x * sx, ly = y + leaf.y * sy, lw = leaf.w * sx, lh = leaf.h * sy;
  // The light over the door turns from orange to green as it opens ("you may pass").
  ctx.globalAlpha = eased;
  ctx.fillStyle = "#6fe08a"; ctx.fillRect(x + light.x * sx, y + light.y * sy, light.w * sx, light.h * sy);
  ctx.globalAlpha = 1;
  ctx.save();
  ctx.beginPath(); ctx.rect(lx, ly, lw, lh); ctx.clip();
  // Behind the panels: the corridor from the open-door art (or plain dark if it has not loaded yet).
  if (open.complete && open.naturalWidth) ctx.drawImage(open, leaf.x, leaf.y, leaf.w, leaf.h, lx, ly, lw, lh);
  else { ctx.fillStyle = "#03060c"; ctx.fillRect(lx, ly, lw, lh); }
  // Whole canvas pixels, so the panels stay crisp but move in small, even steps.
  const shift = Math.round(eased * (half - DOOR.lip) * sx);
  ctx.drawImage(closed, leaf.x, leaf.y, half, leaf.h, lx - shift, ly, half * sx, lh);
  ctx.drawImage(closed, leaf.x + half, leaf.y, half, leaf.h, lx + half * sx + shift, ly, half * sx, lh);
  // A thin dark seam between the panels while they part reads as a real gap opening.
  if (shift > 0 && shift < (half - DOOR.lip) * sx) { ctx.fillStyle = "#03060c"; ctx.fillRect(lx + half * sx - shift - 1, ly, 1, lh); ctx.fillRect(lx + half * sx + shift, ly, 1, lh); }
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
