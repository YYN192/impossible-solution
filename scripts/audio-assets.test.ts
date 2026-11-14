import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * The sound library in public/audio (made by scripts/generate-audio.mjs) stays consistent:
 * every manifest entry is a real, valid WAV and every sound ID the game already plays has a file.
 * Lives in scripts/ (not src/) because it reads files with Node, which the app tsconfig does not include.
 * Full level/loop checks: node scripts/verify-audio.mjs
 */
const PUBLIC = join(process.cwd(), "public");
const AUDIO = join(PUBLIC, "audio");

interface Entry {
  id: string;
  path: string;
  category: string;
  duration: number;
  channels: number;
  loop: boolean;
  volume: number;
  trigger: string;
  aliases?: string[];
}
const manifest = JSON.parse(readFileSync(join(AUDIO, "audio-manifest.json"), "utf8")) as { sounds: Entry[] };

function header(file: string) {
  const b = readFileSync(file);
  return {
    riff: b.toString("ascii", 0, 4),
    wave: b.toString("ascii", 8, 12),
    pcm: b.readUInt16LE(20),
    channels: b.readUInt16LE(22),
    sampleRate: b.readUInt32LE(24),
    bits: b.readUInt16LE(34),
    dataBytes: b.readUInt32LE(40),
  };
}

describe("sound library (public/audio)", () => {
  it("has a unique id and path for every sound", () => {
    const ids = manifest.sounds.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const s of manifest.sounds) expect(s.path).toBe(`/audio/${s.category}/${s.id}.wav`);
  });

  it("lists only files that exist, and every WAV on disk is listed", () => {
    const onDisk: string[] = [];
    const walk = (dir: string) => {
      for (const f of readdirSync(dir)) {
        const p = join(dir, f);
        if (statSync(p).isDirectory()) walk(p);
        else if (f.endsWith(".wav")) onDisk.push(`/${relative(PUBLIC, p).replaceAll("\\", "/")}`);
      }
    };
    walk(AUDIO);
    expect(onDisk.sort()).toEqual(manifest.sounds.map((s) => s.path).sort());
  });

  it("every file is 16-bit PCM WAV at 44.1 kHz with the manifest's channels and duration", () => {
    for (const s of manifest.sounds) {
      const file = join(PUBLIC, s.path);
      expect(existsSync(file), s.id).toBe(true);
      const h = header(file);
      expect([h.riff, h.wave, h.pcm, h.bits, h.sampleRate], s.id).toEqual(["RIFF", "WAVE", 1, 16, 44100]);
      expect(h.channels, s.id).toBe(s.channels);
      expect(h.dataBytes / (2 * h.channels * h.sampleRate), s.id).toBeCloseTo(s.duration, 2);
    }
  });

  it("gives every entry a trigger, a volume between 0 and 1, and loops only for long sounds", () => {
    for (const s of manifest.sounds) {
      expect(s.trigger.length, s.id).toBeGreaterThan(10);
      expect(s.volume, s.id).toBeGreaterThan(0);
      expect(s.volume, s.id).toBeLessThanOrEqual(1);
      if (s.loop) expect(s.duration, s.id).toBeGreaterThanOrEqual(2);
      else expect(s.duration, s.id).toBeLessThanOrEqual(4);
    }
  });

  it("has a file for every sound ID the game already plays (audio.playSfx)", () => {
    const aliases = new Set(manifest.sounds.flatMap((s) => s.aliases ?? []));
    for (const id of ["menu", "step", "console", "door", "npc", "dialogue", "select", "assign", "resolve"]) expect(aliases, id).toContain(id);
  });
});
