// Pixel sprites for the job mini games (src/components/JobMiniGame.tsx).
// Run from the repo root: node scripts/generate-minigame-assets.mjs
// Writes only src/assets/pixel/minigame/*.png, in the shared palette, hard edges, transparent cut-outs.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const root = path.resolve('src/assets/pixel/minigame');
const P = JSON.parse(fs.readFileSync(path.resolve('src/assets/pixel/palette.json'), 'utf8'));
const rgb = (hex) => [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16));
const image = (w, h) => ({ w, h, px: new Uint8Array(w * h * 4) });
function put(im, x, y, c) {
  if (x < 0 || y < 0 || x >= im.w || y >= im.h) return;
  im.px.set([...rgb(c), 255], (y * im.w + x) * 4);
}
const get = (im, x, y) => (x < 0 || y < 0 || x >= im.w || y >= im.h ? 0 : im.px[(y * im.w + x) * 4 + 3]);
function rect(im, x, y, w, h, c) { for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) put(im, xx, yy, c); }
function disc(im, cx, cy, rx, ry, c) {
  for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) if ((x * x) / (rx * rx) + (y * y) / (ry * ry) <= 1) put(im, cx + x, cy + y, c);
}
/** Paint a 1 px ink outline around every solid shape (the campaign art's look). */
function outline(im, c = P.ink) {
  const edge = [];
  for (let y = 0; y < im.h; y++) for (let x = 0; x < im.w; x++)
    if (!get(im, x, y) && (get(im, x - 1, y) || get(im, x + 1, y) || get(im, x, y - 1) || get(im, x, y + 1))) edge.push([x, y]);
  for (const [x, y] of edge) put(im, x, y, c);
  return im;
}
/** Draw rows of characters: each key in `keys` is a palette colour, '.' is transparent. */
function grid(im, ox, oy, rows, keys) {
  rows.forEach((row, y) => [...row].forEach((ch, x) => { if (keys[ch]) put(im, ox + x, oy + y, keys[ch]); }));
}
function save(im, name) {
  fs.mkdirSync(root, { recursive: true });
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; table[n] = c >>> 0; }
  const crc = (buf) => { let c = 0xffffffff; for (const b of buf) c = table[(c ^ b) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (type, data) => { const body = Buffer.concat([Buffer.from(type), data]); const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const sum = Buffer.alloc(4); sum.writeUInt32BE(crc(body)); return Buffer.concat([len, body, sum]); };
  const raw = Buffer.alloc((im.w * 4 + 1) * im.h);
  for (let y = 0; y < im.h; y++) raw.set(im.px.subarray(y * im.w * 4, (y + 1) * im.w * 4), y * (im.w * 4 + 1) + 1);
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(im.w, 0); ihdr.writeUInt32BE(im.h, 4); ihdr[8] = 8; ihdr[9] = 6;
  fs.writeFileSync(path.join(root, `${name}.png`), Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]));
}

// Greenhouse: a pot with a plant in six growth stages (seed → flower).
function pot(im) {
  rect(im, 9, 24, 14, 2, P.orange); rect(im, 10, 26, 12, 4, P.rust); rect(im, 10, 26, 12, 1, P.orange);
  rect(im, 10, 23, 12, 1, P.steelDark);
}
const leaf = (im, x, y, dir) => { rect(im, x, y, 3, 2, P.green); put(im, x + (dir > 0 ? 3 : -1), y, P.green); put(im, x + (dir > 0 ? 1 : 1), y, P.teal); };
for (let stage = 0; stage <= 5; stage++) {
  const im = image(32, 32);
  pot(im);
  if (stage === 0) { rect(im, 15, 21, 3, 2, P.yellow); put(im, 16, 20, P.green); }
  const top = [22, 19, 16, 12, 9, 6][stage];
  if (stage > 0) rect(im, 16, top, 1, 23 - top, P.green);
  if (stage >= 1) { leaf(im, 17, top + 1, 1); }
  if (stage >= 2) { leaf(im, 12, top + 3, -1); rect(im, 13, top + 3, 3, 2, P.green); }
  if (stage >= 3) { leaf(im, 17, top + 6, 1); rect(im, 17, top + 6, 4, 2, P.green); }
  if (stage >= 4) { rect(im, 12, top + 8, 4, 2, P.green); rect(im, 15, top - 2, 3, 3, P.green); put(im, 16, top - 2, P.teal); }
  if (stage === 5) { disc(im, 16, top - 2, 3, 3, P.yellow); rect(im, 16, top - 2, 1, 1, P.orange); put(im, 15, top - 3, P.white); }
  save(outline(im), `plant-${stage}`);
}

// Water drops: full (has water) and empty (thirsty).
const DROP = ['.......#........', '......###.......', '......###.......', '.....#####......', '.....#####......', '....#######.....', '....#######.....', '...#########....', '...#########....', '...#########....', '....#######.....', '.....#####......'];
for (const [name, fill, shine] of [['drop-full', P.blue, P.cyan], ['drop-empty', P.steelDark, P.steel]]) {
  const im = image(16, 16);
  grid(im, 0, 2, DROP, { '#': fill });
  put(im, 5, 9, shine); put(im, 5, 10, shine); put(im, 6, 8, shine);
  save(outline(im), name);
}

// Shelter: one stacking block and the empty slot it fills.
{
  const im = image(32, 16);
  rect(im, 1, 1, 30, 14, P.orange);
  rect(im, 1, 1, 30, 1, P.yellow); rect(im, 1, 14, 30, 1, P.rust);
  for (const y of [7]) rect(im, 1, y, 30, 1, P.rust);
  for (const x of [8, 22]) rect(im, x, 2, 1, 5, P.rust);
  for (const x of [15]) rect(im, x, 8, 1, 6, P.rust);
  save(outline(im), 'block');
  const slot = image(32, 16);
  for (let x = 1; x < 31; x += 3) { put(slot, x, 1, P.steel); put(slot, x + 1, 1, P.steel); put(slot, x, 14, P.steel); put(slot, x + 1, 14, P.steel); }
  for (let y = 1; y < 15; y += 3) { put(slot, 1, y, P.steel); put(slot, 1, y + 1, P.steel); put(slot, 30, y, P.steel); put(slot, 30, y + 1, P.steel); }
  save(slot, 'block-slot');
}

// Ask Earth: a radio dish and the blue Earth (same look as the briefing planets).
{
  const im = image(32, 32);
  rect(im, 14, 16, 4, 10, P.steel); rect(im, 10, 26, 12, 3, P.steelDark); rect(im, 11, 26, 10, 1, P.steel);
  for (let y = 0; y < 9; y++) { const half = 12 - Math.floor((y * y) / 7); rect(im, 16 - half, 8 + y, half * 2, 1, y < 2 ? P.white : P.silver); }
  rect(im, 6, 10, 20, 1, P.steel);
  rect(im, 15, 3, 2, 6, P.steel); rect(im, 14, 2, 4, 2, P.cyan);
  save(outline(im), 'dish');
  const earth = image(32, 32);
  disc(earth, 16, 16, 12, 12, P.blue);
  disc(earth, 11, 12, 4, 3, P.green); disc(earth, 20, 19, 5, 4, P.green); disc(earth, 22, 10, 2, 2, P.green); rect(earth, 9, 21, 4, 2, P.green);
  rect(earth, 12, 5, 8, 2, P.white); rect(earth, 6, 15, 3, 1, P.white); rect(earth, 21, 25, 5, 1, P.white);
  for (let y = 4; y <= 28; y++) for (let x = 4; x <= 28; x++) {
    const dx = x - 16, dy = y - 16;
    if (dx * dx + dy * dy <= 144 && (dx - 3) * (dx - 3) + (dy - 3) * (dy - 3) > 150) put(earth, x, y, P.space);
  }
  save(outline(earth), 'earth');
}

// A twinkling star for the sky.
{
  const im = image(16, 16);
  grid(im, 4, 4, ['...#...', '...#...', '..###..', '#######', '..###..', '...#...', '...#...'], { '#': P.silver });
  put(im, 7, 7, P.white);
  save(im, 'star');
}

// Science trip: a hole in the ground, a plain rock, the sparkle of a shiny one.
{
  const im = image(32, 16);
  disc(im, 16, 9, 14, 6, P.rust); disc(im, 16, 10, 12, 4, P.ink); disc(im, 16, 11, 10, 3, P.space);
  rect(im, 5, 6, 4, 1, P.orange); rect(im, 23, 6, 4, 1, P.orange);
  save(im, 'hole');
  const rock = image(16, 16);
  grid(rock, 2, 4, ['....######..', '..##########', '.###########', '############', '############', '.##########.', '..########..'], { '#': P.steel });
  rect(rock, 6, 5, 4, 1, P.silver); rect(rock, 4, 6, 2, 1, P.silver);
  rect(rock, 4, 9, 9, 1, P.steelDark); rect(rock, 6, 10, 6, 1, P.steelDark);
  save(outline(rock), 'rock-plain');
  const spark = image(16, 16);
  grid(spark, 4, 4, ['...#...', '...#...', '...#...', '###.###', '...#...', '...#...', '...#...'], { '#': P.yellow });
  put(spark, 7, 7, P.white); put(spark, 2, 2, P.white); put(spark, 13, 12, P.yellow);
  save(spark, 'sparkle');
}

// A green tick for a finished plant.
{
  const im = image(16, 16);
  grid(im, 2, 3, ['..........##', '.........###', '........###.', '.##....###..', '.###..###...', '..######....', '...####.....', '....##......'], { '#': P.green });
  save(outline(im), 'check');
}

console.log(`Wrote mini game sprites to ${root}`);
