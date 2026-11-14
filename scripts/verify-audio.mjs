#!/usr/bin/env node
/**
 * Checks the generated sound library without trusting the generator: reads every WAV back and
 * reports format, duration, levels, clipping, clean edges and seamless loops.
 * Run: node scripts/verify-audio.mjs   (exit code 1 if anything fails)
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = join(ROOT, "public");
const AUDIO = join(PUBLIC, "audio");

/** Every file the sound brief asks for, by folder. */
export const REQUIRED = {
  ui: ["menu-hover", "menu-select", "menu-back", "menu-error", "menu-open"],
  player: ["player-step-metal-1", "player-step-metal-2", "player-interact", "player-equipment", "player-celebrate"],
  station: ["door-open", "door-close", "airlock-open", "airlock-close", "machine-beep", "machine-warning", "station-ventilation", "station-machinery"],
  console: ["console-activate", "console-boot", "console-button", "console-data", "console-close", "console-success"],
  npc: ["npc-dialogue", "npc-confirm", "robot-beep-1", "robot-beep-2", "robot-move", "drone-hover"],
  planning: ["astronaut-select", "job-assign", "job-remove", "job-complete", "job-skipped", "plan-confirm"],
  resources: ["power-increase", "power-decrease", "air-warning", "radiation-increase", "resource-critical", "resource-stable"],
  events: ["storm-warning", "particle-burst", "earth-message-send", "earth-message-receive", "earth-forecast"],
  mission: ["morning-report", "sol-end", "next-sol", "mission-success", "mission-failure", "science-discovery"],
  domino: ["domino-fall", "domino-reveal", "domino-complete", "replay-start"],
  settings: ["volume-change", "mute", "unmute"],
  ambience: ["mars-base-ambience", "mission-console-ambience", "space-menu-ambience"],
};

/** Parse a PCM WAV into format + per-channel Float32 samples. Throws if it is not valid. */
export function readWav(bytes) {
  const b = Buffer.from(bytes);
  if (b.toString("ascii", 0, 4) !== "RIFF" || b.toString("ascii", 8, 12) !== "WAVE") throw new Error("not a RIFF/WAVE file");
  let off = 12;
  let fmt;
  let data;
  while (off + 8 <= b.length) {
    const id = b.toString("ascii", off, off + 4);
    const size = b.readUInt32LE(off + 4);
    if (id === "fmt ") fmt = { audioFormat: b.readUInt16LE(off + 8), channels: b.readUInt16LE(off + 10), sampleRate: b.readUInt32LE(off + 12), bitDepth: b.readUInt16LE(off + 22) };
    if (id === "data") data = b.subarray(off + 8, off + 8 + size);
    off += 8 + size + (size % 2);
  }
  if (!fmt || !data) throw new Error("missing fmt or data chunk");
  if (fmt.audioFormat !== 1 || fmt.bitDepth !== 16) throw new Error("not 16-bit PCM");
  const frames = data.length / (2 * fmt.channels);
  const ch = Array.from({ length: fmt.channels }, () => new Float32Array(frames));
  for (let i = 0; i < frames; i++) for (let c = 0; c < fmt.channels; c++) ch[c][i] = data.readInt16LE((i * fmt.channels + c) * 2) / 32768;
  return { ...fmt, frames, duration: frames / fmt.sampleRate, ch };
}

const db = (v) => (v > 0 ? 20 * Math.log10(v) : -Infinity);

export function analyse(w, isLoop) {
  let peak = 0;
  let sum = 0;
  let clipped = 0;
  let edge = 0;
  let maxJump = 0;
  for (const x of w.ch) {
    for (let i = 0; i < x.length; i++) {
      const a = Math.abs(x[i]);
      peak = Math.max(peak, a);
      sum += x[i] * x[i];
      if (a >= 0.9999) clipped++;
      if (i > 0) maxJump = Math.max(maxJump, Math.abs(x[i] - x[i - 1]));
    }
    edge = Math.max(edge, isLoop ? Math.abs(x[x.length - 1] - x[0]) : Math.max(Math.abs(x[0]), Math.abs(x[x.length - 1])));
  }
  const rms = Math.sqrt(sum / (w.frames * w.channels));
  return { peak, peakDb: db(peak), rmsDb: db(rms), clipped, edge, maxJump };
}

function main() {
  const manifest = JSON.parse(readFileSync(join(AUDIO, "audio-manifest.json"), "utf8"));
  const problems = [];
  const byId = new Map(manifest.sounds.map((s) => [s.id, s]));

  for (const [cat, ids] of Object.entries(REQUIRED)) {
    for (const id of ids) {
      const s = byId.get(id);
      if (!s) problems.push(`${id}: missing from manifest`);
      else if (s.category !== cat || s.path !== `/audio/${cat}/${id}.wav`) problems.push(`${id}: wrong category or path (${s.path})`);
    }
  }
  const wavsOnDisk = [];
  const walk = (dir) => {
    for (const f of readdirSync(dir)) {
      const p = join(dir, f);
      if (statSync(p).isDirectory()) walk(p);
      else if (f.endsWith(".wav")) wavsOnDisk.push(`/${relative(PUBLIC, p).replaceAll("\\", "/")}`);
    }
  };
  walk(AUDIO);
  for (const p of wavsOnDisk) if (!manifest.sounds.some((s) => s.path === p)) problems.push(`${p}: on disk but not in the manifest`);

  console.log("id".padEnd(26), "ch", "dur(s)", "peak dBFS", "rms dBFS", "edge", "result");
  for (const s of manifest.sounds) {
    const file = join(PUBLIC, s.path);
    if (!existsSync(file)) {
      problems.push(`${s.id}: file ${s.path} does not exist`);
      continue;
    }
    let w;
    try {
      w = readWav(readFileSync(file));
    } catch (e) {
      problems.push(`${s.id}: ${e.message}`);
      continue;
    }
    const a = analyse(w, s.loop);
    const issues = [];
    if (w.sampleRate !== 44100) issues.push(`sample rate ${w.sampleRate}`);
    if (w.channels !== s.channels) issues.push(`channels ${w.channels} ≠ manifest ${s.channels}`);
    if (Math.abs(w.duration - s.duration) > 0.002) issues.push(`duration ${w.duration.toFixed(3)} ≠ manifest ${s.duration}`);
    if (a.clipped > 0) issues.push(`${a.clipped} clipped samples`);
    if (a.peakDb > -3) issues.push(`too loud (peak ${a.peakDb.toFixed(1)} dBFS)`);
    if (a.peakDb < -24) issues.push(`too quiet (peak ${a.peakDb.toFixed(1)} dBFS)`);
    if (s.loop && s.category === "ambience" && a.peakDb > -10) issues.push("ambience louder than -10 dBFS peak");
    // One-shots must start and end at silence; loops must join with no bigger step than the sound itself makes.
    if (!s.loop && a.edge > 0.002) issues.push(`edge not silent (${a.edge.toFixed(4)})`);
    if (s.loop && a.edge > Math.max(0.01, a.maxJump)) issues.push(`loop seam jump ${a.edge.toFixed(4)} > max in-sound step ${a.maxJump.toFixed(4)}`);
    if (issues.length) problems.push(`${s.id}: ${issues.join("; ")}`);
    console.log(s.id.padEnd(26), String(w.channels).padEnd(2), w.duration.toFixed(3).padStart(6), a.peakDb.toFixed(1).padStart(9), a.rmsDb.toFixed(1).padStart(8), a.edge.toFixed(4).padStart(6), issues.length ? "FAIL" : "ok");
  }

  const total = Object.values(REQUIRED).flat().length;
  console.log(`\n${manifest.sounds.length} sounds in manifest, ${wavsOnDisk.length} WAV files on disk, ${total} required by the brief.`);
  if (problems.length) {
    console.log(`\n${problems.length} problem(s):\n- ${problems.join("\n- ")}`);
    process.exit(1);
  }
  console.log("All checks passed.");
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();
