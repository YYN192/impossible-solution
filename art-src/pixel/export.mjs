// Copy pxl output into src/assets/pixel, matching sprites to manifest entries by file basename.
// Usage: node art-src/pixel/export.mjs <pxl out dir>   (refuses any size change, so no game code breaks)
import { readFileSync, readdirSync, copyFileSync } from "node:fs";
import { join, basename } from "node:path";

const out = join(process.argv[2] ?? "art-src/pixel/out", "sprites");
const manifest = JSON.parse(
  readFileSync("src/assets/pixel/asset-manifest.json", "utf8"),
);
const byName = new Map(
  manifest.assets.map((a) => [basename(a.path, ".png"), a]),
);
const size = (file) => {
  const b = readFileSync(file);
  return [b.readUInt32BE(16), b.readUInt32BE(20)];
}; // PNG IHDR

let copied = 0,
  failed = 0;
for (const f of readdirSync(out).filter((f) => f.endsWith(".png"))) {
  const a = byName.get(basename(f, ".png"));
  if (!a) {
    console.warn(`skip ${f}: not in asset-manifest.json`);
    continue;
  }
  const [w, h] = size(join(out, f));
  if (w !== a.width || h !== a.height) {
    console.error(`FAIL ${f}: ${w}x${h}, manifest says ${a.width}x${a.height}`);
    failed++;
    continue;
  }
  copyFileSync(join(out, f), a.path);
  copied++;
}
console.log(
  `copied ${copied} sprite(s)${failed ? `, ${failed} size mismatch(es)` : ""}`,
);
process.exitCode = failed ? 1 : 0;
