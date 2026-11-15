import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { inflateSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import palette from "../src/assets/pixel/palette.json";

/**
 * The mini games are drawn as pixel art like the rest of the game: small PNG sprites made by
 * scripts/generate-minigame-assets.mjs, hard edges, only the shared palette, transparent cut-outs.
 */
const SPRITES: Record<string, [number, number]> = {
  ...Object.fromEntries([0, 1, 2, 3, 4, 5].map((n) => [`plant-${n}`, [32, 32]])),
  "drop-full": [16, 16], "drop-empty": [16, 16],
  block: [32, 16], "block-slot": [32, 16],
  dish: [32, 32], earth: [32, 32], star: [16, 16],
  hole: [32, 16], "rock-plain": [16, 16], sparkle: [16, 16], check: [16, 16],
  // The Moon's own mini games (src/game/moonMiniGames.ts).
  "moon-sun": [32, 32], "moon-ice-3": [32, 32], "moon-ice-2": [32, 32], "moon-ice-1": [32, 32], "moon-water": [32, 32],
  "moon-scoop": [32, 16], "moon-dirt": [32, 16], "moon-signal": [16, 16], "moon-reply": [16, 16],
  "moon-crater": [32, 16], "moon-ice": [16, 16], "moon-lamp": [16, 16],
  // Dust Season's own mini games (src/game/dustMiniGames.ts).
  "dust-gust": [32, 32], "dust-pane": [32, 32], "dust-crack": [32, 32],
};
const dir = resolve(process.cwd(), "src/assets/pixel/minigame");
const colors = new Set(Object.values(palette).map((c) => c.toLowerCase()));

/** Width, height and the RGBA pixels of a PNG written by the asset generators (8-bit RGBA, filter 0). */
function readPng(file: string) {
  const buf = readFileSync(file);
  expect([...buf.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
  let pos = 8, w = 0, h = 0;
  const idat: Buffer[] = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos), type = buf.toString("ascii", pos + 4, pos + 8), data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === "IHDR") { w = data.readUInt32BE(0); h = data.readUInt32BE(4); expect(data[8]).toBe(8); expect(data[9]).toBe(6); }
    if (type === "IDAT") idat.push(data);
    pos += 12 + len;
  }
  const raw = inflateSync(Buffer.concat(idat));
  const px: [number, number, number, number][] = [];
  for (let y = 0; y < h; y++) {
    expect(raw[y * (w * 4 + 1)]).toBe(0);
    for (let x = 0; x < w; x++) { const i = y * (w * 4 + 1) + 1 + x * 4; px.push([raw[i], raw[i + 1], raw[i + 2], raw[i + 3]]); }
  }
  return { w, h, px };
}
const hex = ([r, g, b]: number[]) => `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;

describe("mini game pixel sprites", () => {
  it.each(Object.entries(SPRITES))("%s is a %j pixel sprite in the game palette", (name, [w, h]) => {
    const file = resolve(dir, `${name}.png`);
    expect(existsSync(file), file).toBe(true);
    const png = readPng(file);
    expect([png.w, png.h]).toEqual([w, h]);
    const solid = png.px.filter((p) => p[3] > 0);
    expect(solid.length, "not empty").toBeGreaterThan(8);
    expect(png.px.some((p) => p[3] === 0), "has a transparent cut-out").toBe(true);
    for (const p of solid) {
      expect(p[3], "hard edges: no half-transparent pixels").toBe(255);
      expect(colors.has(hex(p)), `${name}: ${hex(p)} is not in palette.json`).toBe(true);
    }
  });

  it("the Moon's ice really melts: every stage has less ice than the one before", () => {
    const ice = (name: string) => readPng(resolve(dir, `${name}.png`)).px.filter((p) => p[3] && [palette.cyan, palette.white, palette.silver].map((c) => c.toLowerCase()).includes(hex(p))).length;
    expect(ice("moon-ice-2")).toBeLessThan(ice("moon-ice-3"));
    expect(ice("moon-ice-1")).toBeLessThan(ice("moon-ice-2"));
  });

  it("the plant really grows: every stage has more plant than the one before", () => {
    const green = (n: number) => readPng(resolve(dir, `plant-${n}.png`)).px.filter((p) => p[3] && hex(p) === palette.green.toLowerCase()).length;
    for (let n = 1; n <= 4; n++) expect(green(n), `plant-${n}`).toBeGreaterThan(green(n - 1));
    expect(readPng(resolve(dir, "plant-5.png")).px.some((p) => p[3] && hex(p) === palette.yellow.toLowerCase()), "a flower").toBe(true);
  });
});
