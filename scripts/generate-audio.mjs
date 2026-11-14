#!/usr/bin/env node
/**
 * Original 8-bit sound library for The Impossible SOLution.
 *
 * Every sound is synthesised here from scratch (square / triangle / sine oscillators, a noise
 * channel, envelopes and gentle filters). No samples, recordings or third-party audio are used,
 * and the output is deterministic: running the script again gives byte-identical files.
 *
 * Output: public/audio/<category>/<id>.wav (PCM 16-bit, 44.1 kHz) + public/audio/audio-manifest.json
 * Run: node scripts/generate-audio.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "public", "audio");
const SR = 44100;

/* ----------------------------------------------------------------- building blocks */

/** Deterministic PRNG (mulberry32), so noise and "random" bleeps are the same on every run. */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SEMI = { C: 0, "C#": 1, Db: 1, D: 2, "D#": 3, Eb: 3, E: 4, F: 5, "F#": 6, Gb: 6, G: 7, "G#": 8, Ab: 8, A: 9, "A#": 10, Bb: 10, B: 11 };
/** Note name → Hz, e.g. n("A4") = 440. */
function n(name) {
  const m = /^([A-G][#b]?)(\d)$/.exec(name);
  if (!m) throw new Error(`bad note ${name}`);
  const midi = (Number(m[2]) + 1) * 12 + SEMI[m[1]];
  return 440 * 2 ** ((midi - 69) / 12);
}

const WAVES = {
  square: (p, duty = 0.5) => ((p % 1) < duty ? 1 : -1),
  triangle: (p) => {
    const x = p % 1;
    return x < 0.5 ? 4 * x - 1 : 3 - 4 * x;
  },
  sine: (p) => Math.sin(2 * Math.PI * p),
  /** 4-bit stepped triangle, like a retro wave channel: softer than a square, still chiptune. */
  wave4: (p) => {
    const x = p % 1;
    const tri = x < 0.5 ? 4 * x - 1 : 3 - 4 * x;
    return Math.round(tri * 7.5) / 7.5;
  },
};

const buf = (seconds) => new Float32Array(Math.round(seconds * SR));

/** Attack / decay / sustain / release envelope over a note of length `dur` (seconds). */
function envAt(t, dur, { a = 0.004, d = 0, s = 1, r = 0.02, decay } = {}) {
  if (t < 0 || t >= dur) return 0;
  const att = Math.min(a, dur * 0.5);
  const rel = Math.min(r, dur * 0.5);
  let v;
  if (t < att) v = t / att;
  else if (d > 0 && t < att + d) v = 1 - (1 - s) * ((t - att) / d);
  else v = d > 0 ? s : 1;
  if (decay && t >= att) v *= Math.exp(-(t - att) / decay);
  const left = dur - t;
  if (left < rel) v *= left / rel;
  return v;
}

/**
 * Add one note to `b`. Frequency can slide from f to f2 (exponential), with optional vibrato.
 * `wrap` writes past the end back to the start (for seamless loops).
 */
function tone(b, t, dur, f, o = {}) {
  const { f2 = f, wave = "square", duty = 0.5, vol = 0.5, env = {}, vib, wrap = false, tremolo } = o;
  const start = Math.round(t * SR);
  const len = Math.round(dur * SR);
  const fn = WAVES[wave];
  let phase = 0;
  for (let i = 0; i < len; i++) {
    const tt = i / SR;
    const p = tt / dur;
    let freq = f2 === f ? f : f * (f2 / f) ** p;
    if (vib) freq *= 1 + vib.depth * Math.sin(2 * Math.PI * vib.rate * tt);
    phase += freq / SR;
    let amp = vol * envAt(tt, dur, env);
    if (tremolo) amp *= 1 - tremolo.depth * (0.5 + 0.5 * Math.sin(2 * Math.PI * tremolo.rate * tt));
    let idx = start + i;
    if (wrap) idx %= b.length;
    else if (idx >= b.length) break;
    b[idx] += amp * fn(phase, duty);
  }
}

/** Play notes one after another, each `step` seconds apart (gate = how much of the step sounds). */
function arp(b, t, notes, step, o = {}) {
  const { gate = 0.9, ...rest } = o;
  notes.forEach((note, i) => {
    if (note) tone(b, t + i * step, step * gate, typeof note === "number" ? note : n(note), rest);
  });
}

function lowpass(x, fc) {
  const a = 1 - Math.exp((-2 * Math.PI * fc) / SR);
  let y = 0;
  for (let i = 0; i < x.length; i++) {
    y += a * (x[i] - y);
    x[i] = y;
  }
  return x;
}
function highpass(x, fc) {
  const a = Math.exp((-2 * Math.PI * fc) / SR);
  let y = 0;
  let px = 0;
  for (let i = 0; i < x.length; i++) {
    y = a * (y + x[i] - px);
    px = x[i];
    x[i] = y;
  }
  return x;
}
/** Low-pass whose cutoff glides from f0 to f1 (Hz) across the buffer: a "whoosh". */
function sweepLowpass(x, f0, f1) {
  let y = 0;
  for (let i = 0; i < x.length; i++) {
    const fc = f0 * (f1 / f0) ** (i / x.length);
    const a = 1 - Math.exp((-2 * Math.PI * fc) / SR);
    y += a * (x[i] - y);
    x[i] = y;
  }
  return x;
}

/** Sample-and-hold noise (a retro noise channel). `rate` = how often it picks a new value. */
function noiseBuf(len, seed, rate = SR) {
  const r = rng(seed);
  const x = new Float32Array(len);
  const hold = Math.max(1, Math.round(SR / rate));
  let v = 0;
  for (let i = 0; i < len; i++) {
    if (i % hold === 0) v = r() * 2 - 1;
    x[i] = v;
  }
  return x;
}

/** Add a noise burst: filtered, enveloped, starting at `t` for `dur` seconds. */
function noise(b, t, dur, o = {}) {
  const { vol = 0.3, seed = 1, rate = SR, lp, hp, sweep, env = {} } = o;
  const len = Math.round(dur * SR);
  const x = noiseBuf(len, seed, rate);
  if (sweep) sweepLowpass(x, sweep[0], sweep[1]);
  if (lp) lowpass(lowpass(x, lp), lp);
  if (hp) highpass(x, hp);
  const start = Math.round(t * SR);
  for (let i = 0; i < len && start + i < b.length; i++) b[start + i] += vol * envAt(i / SR, dur, env) * x[i];
}

/** Loudest average level (RMS) a one-shot may have, so square-wave cues are not louder than the rest. */
const MAX_RMS = 10 ** (-13 / 20);

/** Clean up a one-shot: remove DC, tame harsh highs, normalise to `peak` (and at most MAX_RMS), fade the edges. */
function finishOneShot(b, peak, lp = 9000) {
  highpass(b, 25);
  lowpass(b, lp);
  normalise(b, peak);
  let sum = 0;
  for (const v of b) sum += v * v;
  const rms = Math.sqrt(sum / b.length);
  if (rms > MAX_RMS) for (let i = 0; i < b.length; i++) b[i] *= MAX_RMS / rms;
  const fadeIn = Math.min(b.length, Math.round(0.001 * SR));
  for (let i = 0; i < fadeIn; i++) b[i] *= i / fadeIn;
  const fadeOut = Math.min(b.length, Math.round(0.006 * SR));
  for (let i = 0; i < fadeOut; i++) b[b.length - 1 - i] *= i / fadeOut;
  return b;
}

function normalise(b, peak) {
  let m = 0;
  for (const v of b) m = Math.max(m, Math.abs(v));
  if (m > 0) for (let i = 0; i < b.length; i++) b[i] *= peak / m;
  return b;
}

/**
 * Seamless loop of `seconds`: everything inside `draw` must be periodic in the loop length
 * (whole cycles, wrapped notes). Filters run over two copies and keep the second, so they are in
 * steady state and the end joins the start without a click.
 */
function loop(seconds, peak, draw, filters = (x) => x) {
  const b = buf(seconds);
  draw(b);
  const two = new Float32Array(b.length * 2);
  two.set(b);
  two.set(b, b.length);
  filters(two);
  const out = two.slice(b.length);
  // Remove any tiny DC offset, then level.
  let mean = 0;
  for (const v of out) mean += v / out.length;
  for (let i = 0; i < out.length; i++) out[i] -= mean;
  return normalise(out, peak);
}

/** Periodic noise for loops: the noise itself repeats every loop, so it can be filtered circularly. */
function addLoopNoise(b, o = {}) {
  const { vol = 0.2, seed = 7, rate = SR, am } = o;
  const x = noiseBuf(b.length, seed, rate);
  for (let i = 0; i < b.length; i++) {
    const t = i / SR;
    const mod = am ? 1 - am.depth * (0.5 + 0.5 * Math.cos(2 * Math.PI * am.rate * t)) : 1;
    b[i] += vol * mod * x[i];
  }
}

const S = (seconds, peak, draw, lp) => {
  const b = buf(seconds);
  draw(b);
  return finishOneShot(b, peak, lp);
};

/* ----------------------------------------------------------------- the sound library */

const SOFT = { a: 0.003, r: 0.03 };
const PLUCK = { a: 0.002, decay: 0.06, r: 0.02 };

/** Each entry: category, id, gameplay trigger, default volume, peak level and how it is made. */
const SOUNDS = [
  // A. Main menu
  { cat: "ui", id: "menu-hover", volume: 0.4, trigger: "Pointer or keyboard focus moves onto a menu button",
    make: () => S(0.06, 0.4, (b) => tone(b, 0, 0.05, n("A5"), { duty: 0.25, vol: 0.5, env: PLUCK }), 6000) },
  { cat: "ui", id: "menu-select", volume: 0.6, aliases: ["menu"], trigger: "A menu button is pressed (Start mission, Settings, Data Sources)",
    make: () => S(0.17, 0.55, (b) => arp(b, 0, ["C5", "G5"], 0.075, { vol: 0.5, env: SOFT, gate: 0.95 })) },
  { cat: "ui", id: "menu-back", volume: 0.5, trigger: "Back button or closing a panel",
    make: () => S(0.16, 0.5, (b) => tone(b, 0, 0.15, n("G5"), { f2: n("C5"), wave: "wave4", vol: 0.6, env: SOFT })) },
  { cat: "ui", id: "menu-error", volume: 0.5, trigger: "A choice is not allowed (e.g. a button that cannot be used yet)",
    make: () => S(0.24, 0.5, (b) => arp(b, 0, ["E4", "Eb4"], 0.11, { vol: 0.5, env: SOFT, gate: 0.95 }), 3500) },
  { cat: "ui", id: "menu-open", volume: 0.5, trigger: "A menu, settings panel or overlay opens",
    make: () => S(0.17, 0.5, (b) => arp(b, 0, ["C5", "E5", "G5", "C6"], 0.038, { duty: 0.25, vol: 0.5, env: SOFT })) },

  // B. Astronaut and player
  { cat: "player", id: "player-step-metal-1", volume: 0.3, aliases: ["step"], trigger: "Footstep on the station's metal floor (alternate with -2; throttle to ~3 per second)",
    make: () => S(0.09, 0.35, (b) => {
      noise(b, 0, 0.03, { vol: 0.5, seed: 11, hp: 1500, lp: 6000, env: { a: 0.001, decay: 0.008, r: 0.005 } });
      tone(b, 0, 0.07, 1180, { wave: "triangle", vol: 0.25, env: { a: 0.001, decay: 0.02, r: 0.01 } });
      tone(b, 0, 0.05, 160, { f2: 110, wave: "triangle", vol: 0.4, env: { a: 0.001, decay: 0.015, r: 0.01 } });
    }) },
  { cat: "player", id: "player-step-metal-2", volume: 0.3, trigger: "Footstep variation (alternate with -1 so walking does not sound repetitive)",
    make: () => S(0.09, 0.33, (b) => {
      noise(b, 0, 0.028, { vol: 0.5, seed: 12, hp: 1700, lp: 5500, env: { a: 0.001, decay: 0.007, r: 0.005 } });
      tone(b, 0, 0.07, 1040, { wave: "triangle", vol: 0.22, env: { a: 0.001, decay: 0.018, r: 0.01 } });
      tone(b, 0, 0.05, 150, { f2: 100, wave: "triangle", vol: 0.4, env: { a: 0.001, decay: 0.015, r: 0.01 } });
    }) },
  { cat: "player", id: "player-interact", volume: 0.6, trigger: "Player presses E / Interact near a console, crew member or door",
    make: () => S(0.13, 0.5, (b) => arp(b, 0, ["A5", "E6"], 0.055, { duty: 0.25, vol: 0.5, env: SOFT, gate: 0.95 })) },
  { cat: "player", id: "player-equipment", volume: 0.5, trigger: "Astronaut uses a tool or piece of equipment",
    make: () => S(0.32, 0.5, (b) => {
      tone(b, 0, 0.3, 380, { f2: 900, wave: "square", duty: 0.125, vol: 0.3, env: SOFT, tremolo: { rate: 28, depth: 0.6 } });
      noise(b, 0, 0.3, { vol: 0.12, seed: 21, rate: 4000, lp: 2500, env: SOFT });
    }, 5000) },
  { cat: "player", id: "player-celebrate", volume: 0.6, trigger: "Small personal success (a goal reached, a star earned)",
    make: () => S(0.72, 0.6, (b) => {
      arp(b, 0, ["C5", "E5", "G5", "C6", "E6"], 0.065, { duty: 0.25, vol: 0.45, env: SOFT, gate: 0.9 });
      tone(b, 0.33, 0.38, n("C6"), { duty: 0.5, vol: 0.45, env: { a: 0.004, r: 0.18 }, vib: { rate: 6, depth: 0.012 } });
      tone(b, 0.33, 0.38, n("C4"), { wave: "triangle", vol: 0.4, env: { a: 0.004, r: 0.18 } });
    }) },

  // C. Mars research station
  { cat: "station", id: "door-open", volume: 0.5, aliases: ["door"], trigger: "A sliding door in the station opens",
    make: () => S(0.45, 0.5, (b) => {
      noise(b, 0, 0.42, { vol: 0.5, seed: 31, sweep: [300, 2600], env: { a: 0.05, r: 0.12 } });
      tone(b, 0, 0.36, 180, { f2: 360, wave: "triangle", vol: 0.35, env: { a: 0.02, r: 0.08 } });
      tone(b, 0.36, 0.08, 520, { wave: "square", duty: 0.25, vol: 0.18, env: PLUCK });
    }, 6000) },
  { cat: "station", id: "door-close", volume: 0.5, trigger: "A sliding door in the station closes",
    make: () => S(0.45, 0.5, (b) => {
      noise(b, 0, 0.38, { vol: 0.5, seed: 32, sweep: [2600, 300], env: { a: 0.03, r: 0.1 } });
      tone(b, 0, 0.34, 360, { f2: 170, wave: "triangle", vol: 0.35, env: { a: 0.02, r: 0.06 } });
      tone(b, 0.34, 0.1, 95, { f2: 70, wave: "triangle", vol: 0.6, env: { a: 0.002, decay: 0.04, r: 0.03 } });
    }, 6000) },
  { cat: "station", id: "airlock-open", volume: 0.55, trigger: "The airlock to the Mars surface opens",
    make: () => S(0.95, 0.55, (b) => {
      tone(b, 0, 0.1, 90, { f2: 70, wave: "triangle", vol: 0.6, env: { a: 0.002, decay: 0.05, r: 0.03 } });
      noise(b, 0.08, 0.75, { vol: 0.45, seed: 33, sweep: [400, 3200], env: { a: 0.08, r: 0.35 } });
      tone(b, 0.12, 0.7, 110, { f2: 165, wave: "triangle", vol: 0.35, env: { a: 0.05, r: 0.25 } });
      tone(b, 0.8, 0.12, 330, { f2: 440, wave: "square", duty: 0.25, vol: 0.15, env: SOFT });
    }, 5500) },
  { cat: "station", id: "airlock-close", volume: 0.55, trigger: "The airlock closes and seals",
    make: () => S(0.95, 0.55, (b) => {
      noise(b, 0, 0.7, { vol: 0.45, seed: 34, sweep: [3200, 350], env: { a: 0.04, r: 0.3 } });
      tone(b, 0, 0.62, 165, { f2: 100, wave: "triangle", vol: 0.35, env: { a: 0.04, r: 0.15 } });
      tone(b, 0.62, 0.3, 80, { f2: 55, wave: "triangle", vol: 0.7, env: { a: 0.002, decay: 0.08, r: 0.08 } });
      noise(b, 0.62, 0.06, { vol: 0.2, seed: 35, lp: 900, env: { a: 0.001, decay: 0.02, r: 0.02 } });
    }, 5000) },
  { cat: "station", id: "machine-beep", volume: 0.4, trigger: "Small working-equipment indicator (a machine finishes a cycle)",
    make: () => S(0.2, 0.4, (b) => arp(b, 0, [n("E6"), 0, n("E6")], 0.055, { wave: "sine", vol: 0.5, env: SOFT, gate: 0.9 }), 7000) },
  { cat: "station", id: "machine-warning", volume: 0.5, trigger: "A machine needs attention (not dangerous)",
    make: () => S(0.62, 0.5, (b) => arp(b, 0, ["E5", "C#5", "E5", "C#5", "E5", "C#5"], 0.1, { duty: 0.5, vol: 0.45, env: SOFT, gate: 0.85 }), 4000) },
  { cat: "station", id: "station-ventilation", volume: 0.3, loop: true, trigger: "Background loop near vents (play quietly, loop)",
    make: () => loop(4, 0.3, (b) => {
      addLoopNoise(b, { vol: 0.6, seed: 41, am: { rate: 0.5, depth: 0.35 } });
      tone(b, 0, 4, 110, { wave: "triangle", vol: 0.05, env: { a: 0, r: 0 }, wrap: true });
    }, (x) => highpass(lowpass(lowpass(x, 650), 650), 80)) },
  { cat: "station", id: "station-machinery", volume: 0.3, loop: true, trigger: "Background loop near engineering machines (play quietly, loop)",
    make: () => loop(4, 0.3, (b) => {
      tone(b, 0, 4, 55, { wave: "triangle", vol: 0.5, env: { a: 0, r: 0 }, wrap: true });
      tone(b, 0, 4, 110, { wave: "square", duty: 0.5, vol: 0.08, env: { a: 0, r: 0 }, wrap: true });
      for (let k = 0; k < 8; k++) noise(b, 0.25 + k * 0.5, 0.012, { vol: 0.25, seed: 50 + (k % 2), hp: 2000, lp: 6000, env: { a: 0.001, decay: 0.004, r: 0.004 } });
      tone(b, 1.0, 0.09, 880, { wave: "sine", vol: 0.08, env: SOFT, wrap: true });
      tone(b, 3.0, 0.09, 660, { wave: "sine", vol: 0.08, env: SOFT, wrap: true });
    }, (x) => lowpass(x, 3000)) },

  // D. Mission console
  { cat: "console", id: "console-activate", volume: 0.6, aliases: ["console"], trigger: "Player activates the mission console",
    make: () => S(0.38, 0.55, (b) => {
      tone(b, 0, 0.22, 300, { f2: 1200, duty: 0.25, vol: 0.4, env: SOFT });
      arp(b, 0.22, ["E6", "B6"], 0.07, { wave: "triangle", vol: 0.5, env: SOFT });
    }) },
  { cat: "console", id: "console-boot", volume: 0.55, trigger: "The console screen starts up",
    make: () => S(1.15, 0.55, (b) => {
      const r = rng(61);
      const scale = ["C5", "D5", "E5", "G5", "A5", "C6", "D6", "E6"];
      for (let i = 0; i < 12; i++) tone(b, i * 0.055, 0.04, n(scale[Math.floor(r() * scale.length)]), { duty: 0.125, vol: 0.28, env: SOFT });
      tone(b, 0.72, 0.42, n("C5"), { wave: "square", vol: 0.3, env: { a: 0.004, r: 0.2 } });
      tone(b, 0.72, 0.42, n("G5"), { wave: "triangle", vol: 0.35, env: { a: 0.004, r: 0.2 } });
      tone(b, 0.72, 0.42, n("C4"), { wave: "triangle", vol: 0.35, env: { a: 0.004, r: 0.2 } });
    }) },
  { cat: "console", id: "console-button", volume: 0.45, trigger: "A button on the console is pressed",
    make: () => S(0.05, 0.45, (b) => {
      tone(b, 0, 0.025, 1760, { duty: 0.5, vol: 0.4, env: { a: 0.001, decay: 0.01, r: 0.005 } });
      noise(b, 0, 0.015, { vol: 0.25, seed: 62, hp: 3000, env: { a: 0.001, r: 0.005 } });
    }, 7000) },
  { cat: "console", id: "console-data", volume: 0.4, trigger: "The console is working out a result (data processing)",
    make: () => S(0.48, 0.4, (b) => {
      const r = rng(63);
      const scale = ["C6", "D6", "E6", "G6", "A6"];
      for (let i = 0; i < 16; i++) tone(b, i * 0.028, 0.022, n(scale[Math.floor(r() * scale.length)]), { duty: 0.25, vol: 0.3, env: { a: 0.001, r: 0.006 } });
    }, 6000) },
  { cat: "console", id: "console-close", volume: 0.5, trigger: "The console closes or shuts down",
    make: () => S(0.36, 0.5, (b) => {
      tone(b, 0, 0.26, 1000, { f2: 200, duty: 0.25, vol: 0.35, env: SOFT });
      tone(b, 0.26, 0.08, n("C5"), { wave: "triangle", vol: 0.45, env: PLUCK });
    }) },
  { cat: "console", id: "console-success", volume: 0.6, trigger: "The console finishes a calculation successfully",
    make: () => S(0.46, 0.55, (b) => {
      arp(b, 0, ["C5", "E5", "G5"], 0.065, { duty: 0.25, vol: 0.45, env: SOFT });
      tone(b, 0.195, 0.25, n("C6"), { duty: 0.5, vol: 0.4, env: { a: 0.004, r: 0.12 } });
    }) },

  // E. NPCs and robots
  { cat: "npc", id: "npc-dialogue", volume: 0.35, aliases: ["dialogue"], trigger: "Text appears in a crew dialogue box. Throttle: at most one blip every ~70 ms, never one per letter",
    make: () => S(0.05, 0.35, (b) => tone(b, 0, 0.04, 700, { wave: "wave4", vol: 0.5, env: { a: 0.002, r: 0.015 } }), 5000) },
  { cat: "npc", id: "npc-confirm", volume: 0.5, aliases: ["npc"], trigger: "A crew member answers or a dialogue opens",
    make: () => S(0.21, 0.5, (b) => arp(b, 0, ["G4", "D5"], 0.1, { wave: "wave4", vol: 0.55, env: SOFT, gate: 0.95 })) },
  { cat: "npc", id: "robot-beep-1", volume: 0.5, trigger: "Pip the maintenance drone talks (first variation)",
    make: () => S(0.3, 0.5, (b) => {
      tone(b, 0, 0.12, 900, { f2: 1300, duty: 0.25, vol: 0.4, env: SOFT });
      tone(b, 0.13, 0.15, 1300, { f2: 850, duty: 0.25, vol: 0.4, env: SOFT });
    }, 6000) },
  { cat: "npc", id: "robot-beep-2", volume: 0.5, trigger: "Pip the maintenance drone talks (second variation)",
    make: () => S(0.28, 0.5, (b) => arp(b, 0, [1200, 900, 1500], 0.085, { duty: 0.125, vol: 0.4, env: SOFT }), 6000) },
  { cat: "npc", id: "robot-move", volume: 0.4, trigger: "A robot or drone moves (small servo motor)",
    make: () => S(0.36, 0.45, (b) => {
      tone(b, 0, 0.34, 150, { f2: 230, duty: 0.5, vol: 0.35, env: { a: 0.02, r: 0.06 }, tremolo: { rate: 30, depth: 0.7 } });
      noise(b, 0, 0.34, { vol: 0.1, seed: 71, rate: 6000, lp: 1800, env: { a: 0.02, r: 0.06 } });
    }, 4000) },
  { cat: "npc", id: "drone-hover", volume: 0.3, loop: true, trigger: "Background loop while the drone is on screen (loop, quiet)",
    make: () => loop(2, 0.32, (b) => {
      tone(b, 0, 2, 196, { wave: "triangle", vol: 0.4, env: { a: 0, r: 0 }, vib: { rate: 3, depth: 0.01 }, wrap: true });
      tone(b, 0, 2, 294, { wave: "square", duty: 0.25, vol: 0.06, env: { a: 0, r: 0 }, wrap: true });
      addLoopNoise(b, { vol: 0.12, seed: 72, am: { rate: 2, depth: 0.5 } });
    }, (x) => lowpass(lowpass(x, 2200), 2200)) },

  // F. Mission planning
  { cat: "planning", id: "astronaut-select", volume: 0.5, aliases: ["select"], trigger: "Player taps a crew member on the plan screen",
    make: () => S(0.1, 0.45, (b) => arp(b, 0, ["E5", "B5"], 0.045, { duty: 0.25, vol: 0.5, env: SOFT, gate: 0.95 })) },
  { cat: "planning", id: "job-assign", volume: 0.55, aliases: ["assign"], trigger: "A crew member is placed on a job card",
    make: () => S(0.2, 0.5, (b) => {
      arp(b, 0, ["C5", "G5", "C6"], 0.05, { duty: 0.5, vol: 0.45, env: SOFT });
      noise(b, 0, 0.01, { vol: 0.2, seed: 81, hp: 3000, env: { a: 0.001, r: 0.004 } });
    }) },
  { cat: "planning", id: "job-remove", volume: 0.45, trigger: "A job assignment is undone",
    make: () => S(0.18, 0.42, (b) => arp(b, 0, ["C6", "G5", "C5"], 0.05, { wave: "wave4", vol: 0.5, env: SOFT })) },
  { cat: "planning", id: "job-complete", volume: 0.55, trigger: "A job is done during the night (shown in the end-of-sol report)",
    make: () => S(0.36, 0.5, (b) => arp(b, 0, ["G5", "B5", "D6", "G6"], 0.07, { duty: 0.25, vol: 0.45, env: SOFT })) },
  { cat: "planning", id: "job-skipped", volume: 0.45, trigger: "A job was left undone (a soft 'this may matter later' cue)",
    make: () => S(0.42, 0.45, (b) => {
      tone(b, 0, 0.12, n("D5"), { wave: "wave4", vol: 0.5, env: SOFT });
      tone(b, 0.13, 0.28, n("C#5"), { f2: n("B4"), wave: "wave4", vol: 0.5, env: { a: 0.004, r: 0.15 } });
    }) },
  { cat: "planning", id: "plan-confirm", volume: 0.6, aliases: ["resolve"], trigger: "Player locks in the plan / ends the sol",
    make: () => S(0.62, 0.55, (b) => {
      arp(b, 0, ["C5", "E5", "G5"], 0.06, { duty: 0.25, vol: 0.4, env: SOFT });
      tone(b, 0.18, 0.42, n("C6"), { duty: 0.5, vol: 0.35, env: { a: 0.004, r: 0.2 } });
      tone(b, 0.18, 0.42, n("E5"), { wave: "triangle", vol: 0.35, env: { a: 0.004, r: 0.2 } });
      tone(b, 0.18, 0.42, n("C4"), { wave: "triangle", vol: 0.35, env: { a: 0.004, r: 0.2 } });
    }) },

  // G. Resources
  { cat: "resources", id: "power-increase", volume: 0.5, trigger: "The power bar goes up",
    make: () => S(0.36, 0.5, (b) => {
      arp(b, 0, [n("G4"), n("C5"), n("E5"), n("G5")], 0.06, { wave: "triangle", vol: 0.45, env: SOFT });
      tone(b, 0, 0.34, 400, { f2: 800, duty: 0.125, vol: 0.15, env: SOFT });
    }) },
  { cat: "resources", id: "power-decrease", volume: 0.5, trigger: "The power bar goes down (e.g. dusty panels)",
    make: () => S(0.42, 0.5, (b) => {
      tone(b, 0, 0.4, 780, { f2: 330, duty: 0.25, vol: 0.4, env: { a: 0.004, r: 0.12 }, vib: { rate: 9, depth: 0.02 } });
    }, 5000) },
  { cat: "resources", id: "air-warning", volume: 0.55, trigger: "Air is getting low (gentle life-support warning)",
    make: () => S(0.85, 0.5, (b) => arp(b, 0, ["A5", "E5", "A5", "E5"], 0.2, { wave: "triangle", vol: 0.55, env: { a: 0.01, r: 0.06 }, gate: 0.8 })) },
  { cat: "resources", id: "radiation-increase", volume: 0.55, trigger: "The space-ray meter goes up",
    make: () => S(0.72, 0.5, (b) => {
      // Geiger-style ticks that speed up, then a rising tone: unique to radiation.
      let t = 0;
      let gap = 0.11;
      let k = 0;
      while (t < 0.5 && gap > 0.018) {
        noise(b, t, 0.008, { vol: 0.6, seed: 90 + k, hp: 2500, lp: 7000, env: { a: 0.0005, decay: 0.002, r: 0.003 } });
        t += gap;
        gap *= 0.8;
        k++;
      }
      tone(b, 0.1, 0.6, 600, { f2: 950, duty: 0.25, vol: 0.18, env: { a: 0.05, r: 0.15 }, vib: { rate: 12, depth: 0.015 } });
    }, 7000) },
  { cat: "resources", id: "resource-critical", volume: 0.6, trigger: "A bar is about to hit zero (important, not scary)",
    make: () => S(0.92, 0.6, (b) => {
      for (let i = 0; i < 3; i++) tone(b, i * 0.26, 0.18, n("A5"), { f2: n("F5"), duty: 0.5, vol: 0.45, env: SOFT });
      for (let i = 0; i < 3; i++) tone(b, i * 0.26, 0.18, n("A4"), { wave: "triangle", vol: 0.35, env: SOFT });
    }, 4500) },
  { cat: "resources", id: "resource-stable", volume: 0.45, trigger: "A bar is back in the safe zone",
    make: () => S(0.52, 0.45, (b) => {
      tone(b, 0, 0.5, n("G4"), { wave: "triangle", vol: 0.45, env: { a: 0.02, r: 0.25 } });
      tone(b, 0.04, 0.46, n("D5"), { wave: "triangle", vol: 0.35, env: { a: 0.02, r: 0.25 } });
    }) },

  // H. Space weather and Earth communication (game cues, not NASA recordings)
  { cat: "events", id: "storm-warning", volume: 0.55, trigger: "Earth's forecast says a storm cloud is coming",
    make: () => S(1.25, 0.55, (b) => {
      tone(b, 0, 0.6, 500, { f2: 800, wave: "triangle", vol: 0.45, env: { a: 0.05, r: 0.1 } });
      tone(b, 0.6, 0.6, 800, { f2: 500, wave: "triangle", vol: 0.45, env: { a: 0.02, r: 0.2 } });
      noise(b, 0, 1.2, { vol: 0.08, seed: 101, hp: 3000, lp: 6000, env: { a: 0.2, r: 0.4 } });
    }, 6000) },
  { cat: "events", id: "particle-burst", volume: 0.6, trigger: "A solar particle burst hits (the 20 May 2024 storm sol)",
    make: () => S(1.45, 0.6, (b) => {
      noise(b, 0, 1.3, { vol: 0.35, seed: 102, rate: 9000, sweep: [5000, 600], env: { a: 0.01, r: 0.6 } });
      tone(b, 0, 1.2, 120, { f2: 70, wave: "triangle", vol: 0.5, env: { a: 0.02, r: 0.6 } });
      arp(b, 0.05, ["E7", "B6", "G#6", "E6", "B5", "G#5", "E5"], 0.07, { wave: "triangle", vol: 0.25, env: PLUCK });
    }, 6500) },
  { cat: "events", id: "earth-message-send", volume: 0.5, trigger: "Ask Earth: the message is sent",
    make: () => S(0.72, 0.5, (b) => {
      arp(b, 0, ["G5", 0, "G5", 0, "G5"], 0.06, { wave: "sine", vol: 0.45, env: SOFT, gate: 0.9 });
      tone(b, 0.32, 0.38, 600, { f2: 2000, duty: 0.25, vol: 0.25, env: { a: 0.01, r: 0.2 } });
    }, 7000) },
  { cat: "events", id: "earth-message-receive", volume: 0.55, trigger: "Earth's answer arrives in the morning",
    make: () => S(0.82, 0.55, (b) => {
      tone(b, 0, 0.3, 2000, { f2: 600, duty: 0.25, vol: 0.22, env: { a: 0.01, r: 0.08 } });
      tone(b, 0.32, 0.22, n("E6"), { wave: "triangle", vol: 0.55, env: { a: 0.003, decay: 0.15, r: 0.05 } });
      tone(b, 0.54, 0.28, n("C6"), { wave: "triangle", vol: 0.55, env: { a: 0.003, decay: 0.2, r: 0.08 } });
    }, 7000) },
  { cat: "events", id: "earth-forecast", volume: 0.5, trigger: "A forecast line appears in the morning report",
    make: () => S(0.46, 0.5, (b) => {
      arp(b, 0, ["G5", "C6", "E6"], 0.06, { wave: "triangle", vol: 0.5, env: SOFT });
      noise(b, 0.18, 0.25, { vol: 0.06, seed: 103, hp: 4000, lp: 8000, env: { a: 0.01, r: 0.15 } });
    }) },

  // I. Mission progression
  { cat: "mission", id: "morning-report", volume: 0.55, trigger: "A new sol starts: the morning report appears",
    make: () => S(1.2, 0.5, (b) => {
      arp(b, 0, ["C4", "E4", "G4", "C5"], 0.13, { wave: "triangle", vol: 0.5, env: { a: 0.01, r: 0.08 }, gate: 1.4 });
      tone(b, 0.52, 0.6, n("E5"), { duty: 0.25, vol: 0.25, env: { a: 0.02, r: 0.35 } });
    }) },
  { cat: "mission", id: "sol-end", volume: 0.5, trigger: "Night falls: end-of-sol transition",
    make: () => S(1.45, 0.5, (b) => {
      arp(b, 0, ["G5", "E5", "C5", "G4"], 0.22, { wave: "triangle", vol: 0.5, env: { a: 0.01, r: 0.15 }, gate: 1.3 });
      tone(b, 0.66, 0.75, n("C4"), { wave: "triangle", vol: 0.3, env: { a: 0.05, r: 0.5 } });
    }) },
  { cat: "mission", id: "next-sol", volume: 0.55, trigger: "Moving on to the next sol",
    make: () => S(1.2, 0.55, (b) => {
      arp(b, 0, ["C5", "D5", "E5", "G5"], 0.09, { duty: 0.25, vol: 0.4, env: SOFT });
      tone(b, 0.36, 0.8, n("C6"), { duty: 0.5, vol: 0.35, env: { a: 0.005, r: 0.45 }, vib: { rate: 5, depth: 0.01 } });
      tone(b, 0.36, 0.8, n("C4"), { wave: "triangle", vol: 0.4, env: { a: 0.005, r: 0.45 } });
    }) },
  { cat: "mission", id: "mission-success", volume: 0.65, trigger: "The mission ends with the base running (final screen, 2–3 stars)",
    make: () => S(2.45, 0.63, (b) => {
      arp(b, 0, ["G4", "C5", "E5", "G5"], 0.11, { duty: 0.25, vol: 0.4, env: SOFT });
      arp(b, 0.44, ["E5", "G5"], 0.11, { duty: 0.25, vol: 0.4, env: SOFT });
      const t = 0.66;
      tone(b, t, 1.7, n("C6"), { duty: 0.5, vol: 0.35, env: { a: 0.005, r: 0.9 }, vib: { rate: 5.5, depth: 0.012 } });
      tone(b, t, 1.7, n("G5"), { wave: "triangle", vol: 0.35, env: { a: 0.005, r: 0.9 } });
      tone(b, t, 1.7, n("E5"), { wave: "triangle", vol: 0.3, env: { a: 0.005, r: 0.9 } });
      arp(b, 0, ["C3", "G3", "C3", "G3", "C3", "E3"], 0.11, { wave: "triangle", vol: 0.45, env: SOFT });
      tone(b, t, 1.7, n("C3"), { wave: "triangle", vol: 0.45, env: { a: 0.005, r: 0.9 } });
    }) },
  { cat: "mission", id: "mission-failure", volume: 0.55, trigger: "Mission ended early: gentle and encouraging, before the domino chain",
    make: () => S(2.05, 0.5, (b) => {
      arp(b, 0, ["E5", "D5", "C5"], 0.24, { wave: "triangle", vol: 0.45, env: { a: 0.01, r: 0.1 }, gate: 1.1 });
      // ...then a hopeful lift back up to a major chord: "try again".
      arp(b, 0.8, ["G4", "C5"], 0.2, { wave: "wave4", vol: 0.45, env: SOFT });
      tone(b, 1.2, 0.8, n("E5"), { wave: "triangle", vol: 0.4, env: { a: 0.01, r: 0.45 } });
      tone(b, 1.2, 0.8, n("C5"), { wave: "triangle", vol: 0.35, env: { a: 0.01, r: 0.45 } });
      tone(b, 1.2, 0.8, n("C3"), { wave: "triangle", vol: 0.35, env: { a: 0.01, r: 0.45 } });
    }) },
  { cat: "mission", id: "science-discovery", volume: 0.6, trigger: "A science trip earns science, or the science star is reached",
    make: () => S(0.92, 0.55, (b) => {
      arp(b, 0, ["E5", "G#5", "B5", "E6", "G#6"], 0.07, { wave: "triangle", vol: 0.45, env: PLUCK, gate: 1.6 });
      tone(b, 0.35, 0.55, n("E6"), { duty: 0.25, vol: 0.2, env: { a: 0.01, r: 0.3 }, vib: { rate: 7, depth: 0.015 } });
      noise(b, 0.3, 0.5, { vol: 0.05, seed: 111, hp: 5000, lp: 9000, env: { a: 0.02, r: 0.3 } });
    }) },

  // J. Domino chain
  { cat: "domino", id: "domino-fall", volume: 0.5, trigger: "One domino tips over on the final screen",
    make: () => S(0.12, 0.5, (b) => {
      noise(b, 0, 0.015, { vol: 0.4, seed: 121, hp: 2500, env: { a: 0.0005, r: 0.006 } });
      tone(b, 0.005, 0.1, 320, { f2: 120, wave: "triangle", vol: 0.6, env: { a: 0.001, decay: 0.035, r: 0.02 } });
    }) },
  { cat: "domino", id: "domino-reveal", volume: 0.5, trigger: "A cause-and-effect link is revealed",
    make: () => S(0.38, 0.45, (b) => {
      tone(b, 0, 0.36, n("A5"), { wave: "triangle", vol: 0.5, env: { a: 0.003, decay: 0.12, r: 0.05 } });
      tone(b, 0.06, 0.3, n("E6"), { wave: "triangle", vol: 0.4, env: { a: 0.003, decay: 0.1, r: 0.05 } });
    }) },
  { cat: "domino", id: "domino-complete", volume: 0.55, trigger: "The whole domino chain has been traced back to its first cause",
    make: () => S(1.25, 0.55, (b) => {
      const times = [0, 0.16, 0.29, 0.39];
      times.forEach((t, i) => {
        noise(b, t, 0.012, { vol: 0.35, seed: 130 + i, hp: 2500, env: { a: 0.0005, r: 0.005 } });
        tone(b, t, 0.09, 300 + i * 40, { f2: 120, wave: "triangle", vol: 0.5, env: { a: 0.001, decay: 0.03, r: 0.02 } });
      });
      tone(b, 0.5, 0.72, n("C5"), { wave: "triangle", vol: 0.4, env: { a: 0.005, r: 0.4 } });
      tone(b, 0.5, 0.72, n("E5"), { duty: 0.25, vol: 0.2, env: { a: 0.005, r: 0.4 } });
      tone(b, 0.5, 0.72, n("G5"), { wave: "triangle", vol: 0.3, env: { a: 0.005, r: 0.4 } });
    }) },
  { cat: "domino", id: "replay-start", volume: 0.55, trigger: "Player presses Try a different plan",
    make: () => S(0.62, 0.5, (b) => {
      noise(b, 0, 0.3, { vol: 0.3, seed: 141, sweep: [400, 4000], env: { a: 0.05, r: 0.08 } });
      arp(b, 0.25, ["C5", "G5", "C6"], 0.09, { duty: 0.25, vol: 0.45, env: SOFT, gate: 1.2 });
    }, 7000) },

  // K. Settings
  { cat: "settings", id: "volume-change", volume: 0.4, trigger: "A volume slider moves (play at most a few times per second)",
    make: () => S(0.04, 0.4, (b) => tone(b, 0, 0.03, 1000, { wave: "triangle", vol: 0.5, env: { a: 0.001, r: 0.012 } }), 6000) },
  { cat: "settings", id: "mute", volume: 0.45, trigger: "Sound is muted (play just before muting)",
    make: () => S(0.18, 0.45, (b) => tone(b, 0, 0.17, n("E5"), { f2: n("A4"), wave: "wave4", vol: 0.5, env: SOFT })) },
  { cat: "settings", id: "unmute", volume: 0.45, trigger: "Sound is turned back on",
    make: () => S(0.18, 0.45, (b) => tone(b, 0, 0.17, n("A4"), { f2: n("E5"), wave: "wave4", vol: 0.5, env: SOFT })) },

  // Ambience loops: much quieter than effects.
  { cat: "ambience", id: "mars-base-ambience", volume: 0.25, loop: true, trigger: "Background loop in the Mars station hub",
    make: () => loop(16, 0.22, (b) => {
      tone(b, 0, 16, 55, { wave: "triangle", vol: 0.35, env: { a: 0, r: 0 }, wrap: true });
      tone(b, 0, 16, 82.5, { wave: "sine", vol: 0.15, env: { a: 0, r: 0 }, wrap: true });
      addLoopNoise(b, { vol: 0.35, seed: 151, am: { rate: 0.125, depth: 0.4 } });
      for (const [t, f] of [[2, 440], [6, 523.25], [10, 440], [14, 392]]) tone(b, t, 0.3, f, { wave: "sine", vol: 0.05, env: { a: 0.01, r: 0.2 }, wrap: true });
    }, (x) => highpass(lowpass(lowpass(x, 700), 700), 30)) },
  { cat: "ambience", id: "mission-console-ambience", volume: 0.2, loop: true, trigger: "Background loop while the mission console is open",
    make: () => loop(12, 0.18, (b) => {
      tone(b, 0, 12, 120, { wave: "triangle", vol: 0.25, env: { a: 0, r: 0 }, wrap: true });
      addLoopNoise(b, { vol: 0.08, seed: 161, am: { rate: 0.25, depth: 0.5 } });
      const r = rng(162);
      const scale = ["C6", "D6", "E6", "G6", "A6"];
      for (let i = 0; i < 18; i++) {
        const t = 0.2 + r() * 11.4;
        tone(b, t, 0.04, n(scale[Math.floor(r() * scale.length)]), { duty: 0.25, vol: 0.05, env: { a: 0.002, r: 0.02 } });
      }
    }, (x) => highpass(lowpass(x, 5000), 40)) },
  { cat: "ambience", id: "space-menu-ambience", volume: 0.25, loop: true, stereo: true, trigger: "Background loop on the main menu (never autoplay; start after the first click)",
    make: () => {
      // A slow stereo pad: the right side is detuned by 0.125 Hz so it gently shimmers.
      const side = (detune, seed, sparkleTimes) => loop(16, 0.2, (b) => {
        for (const [f, v] of [[110, 0.3], [165, 0.2], [220, 0.15], [277.1875, 0.08]]) {
          tone(b, 0, 16, f + detune, { wave: "sine", vol: v, env: { a: 0, r: 0 }, wrap: true, tremolo: { rate: 0.0625, depth: 0.5 } });
        }
        addLoopNoise(b, { vol: 0.12, seed, am: { rate: 0.125, depth: 0.6 } });
        for (const [t, f] of sparkleTimes) tone(b, t, 0.6, f, { wave: "triangle", vol: 0.03, env: { a: 0.01, decay: 0.2, r: 0.2 }, wrap: true });
      }, (x) => highpass(lowpass(lowpass(x, 1800), 1800), 30));
      return [
        side(0, 171, [[1.5, n("E6")], [9.5, n("A6")]]),
        side(0.125, 172, [[5.5, n("C#7")], [13.5, n("E6")]]),
      ];
    } },
];

/* ----------------------------------------------------------------- write files + manifest */

function wav(channels) {
  const C = channels.length;
  const N = channels[0].length;
  const out = Buffer.alloc(44 + N * C * 2);
  out.write("RIFF", 0);
  out.writeUInt32LE(36 + N * C * 2, 4);
  out.write("WAVE", 8);
  out.write("fmt ", 12);
  out.writeUInt32LE(16, 16);
  out.writeUInt16LE(1, 20); // PCM
  out.writeUInt16LE(C, 22);
  out.writeUInt32LE(SR, 24);
  out.writeUInt32LE(SR * C * 2, 28);
  out.writeUInt16LE(C * 2, 32);
  out.writeUInt16LE(16, 34);
  out.write("data", 36);
  out.writeUInt32LE(N * C * 2, 40);
  let o = 44;
  for (let i = 0; i < N; i++) {
    for (let c = 0; c < C; c++) {
      const v = Math.max(-1, Math.min(1, channels[c][i]));
      out.writeInt16LE(Math.round(v * 32767), o);
      o += 2;
    }
  }
  return out;
}

const manifest = {
  generatedBy: "scripts/generate-audio.mjs",
  license: "Apache-2.0 (original, synthesised by this project; no samples or third-party audio)",
  format: { container: "wav", encoding: "pcm_s16le", sampleRate: SR, bitDepth: 16 },
  note: "Paths are relative to the site root. In the app, prefix them with import.meta.env.BASE_URL (\"/impossible-solution/\"). Game sound cues, not NASA recordings.",
  sounds: [],
};

for (const s of SOUNDS) {
  const result = s.make();
  const channels = Array.isArray(result) ? result : [result];
  const rel = `audio/${s.cat}/${s.id}.wav`;
  const file = join(ROOT, "public", rel);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, wav(channels));
  manifest.sounds.push({
    id: s.id,
    path: `/${rel}`,
    category: s.cat,
    duration: Number((channels[0].length / SR).toFixed(3)),
    format: "wav",
    channels: channels.length,
    loop: Boolean(s.loop),
    volume: s.volume,
    trigger: s.trigger,
    ...(s.aliases ? { aliases: s.aliases } : {}),
  });
}

writeFileSync(join(OUT, "audio-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Wrote ${manifest.sounds.length} sounds to public/audio/ and audio-manifest.json`);
