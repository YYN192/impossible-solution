import { describe, expect, it } from "vitest";
import bg from "./bg.json";
import en from "./en.json";
import { JARGON } from "./jargon";

/** Bulgarian text rules (#19): same keys and placeholders as English, fully translated, kid-sized. */

type Tree = { [k: string]: string | Tree };

function strings(tree: Tree, prefix = ""): Map<string, string> {
  const out = new Map<string, string>();
  for (const [k, v] of Object.entries(tree)) {
    if (typeof v === "string") out.set(`${prefix}${k}`, v);
    else for (const [kk, vv] of strings(v, `${prefix}${k}.`)) out.set(kk, vv);
  }
  return out;
}

const EN = strings(en as Tree);
const BG = strings(bg as Tree);

const placeholders = (s: string) => [...s.matchAll(/\{\{\s*(\w+)\s*\}\}/g)].map((m) => m[1]).sort();

/** Strings that stay the same in every language: the game's brand name and language names. */
// crew.name and play.crewNumber only point at the translated crew names (crew.who.*).
const SAME_IN_EVERY_LANGUAGE = new Set(["app.name", "lang.en", "lang.bg", "crew.name", "play.crewNumber"]);

const KID_SECTIONS = [
  "title", "common", "morning", "domino", "event", "earth", "plan", "endSol", "final",
  "jobs", "jobInfo", "crew", "planHelp", "bars", "help", "miniGame", "dialogue", "play",
];
const MAX_WORDS = 14; // Bulgarian needs a few more small words ("се", "не", "за") than English's 12.

const sentences = (text: string) =>
  text.replace(/\{\{[^}]+\}\}/g, "X").split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 0);
const words = (sentence: string) => sentence.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w));

describe("bg.json", () => {
  it("has exactly the same keys as en.json", () => {
    expect([...BG.keys()].sort()).toEqual([...EN.keys()].sort());
  });

  it("keeps every {{placeholder}} of the English text", () => {
    for (const [key, text] of EN) expect(placeholders(BG.get(key) ?? ""), key).toEqual(placeholders(text));
  });

  it("is fully translated: every sentence has Bulgarian letters", () => {
    for (const [key, text] of BG) {
      if (SAME_IN_EVERY_LANGUAGE.has(key)) continue;
      const letters = text.replace(/\{\{[^}]+\}\}/g, "").replace(/[^\p{L}]/gu, "");
      if (letters.length === 0) continue; // e.g. "{{label}} · {{date}}"
      expect(text, key).toMatch(/\p{Script=Cyrillic}/u);
    }
  });

  it("never uses science jargon (DONKI, mGy, CME, X-rays …)", () => {
    for (const [key, text] of BG) for (const bad of JARGON) expect(text, key).not.toMatch(bad);
  });

  it(`keeps kid sentences short (≤ ${MAX_WORDS} words)`, () => {
    for (const [key, text] of BG) {
      if (!KID_SECTIONS.some((s) => key.startsWith(`${s}.`))) continue;
      for (const s of sentences(text)) expect(words(s).length, `${key}: "${s}"`).toBeLessThanOrEqual(MAX_WORDS);
    }
  });

  it("uses the same science facts as English (numbers and dates match)", () => {
    const numbers = (s: string) => (s.replace(/\{\{[^}]+\}\}/g, "").match(/\d+/g) ?? []).sort();
    for (const [key, text] of EN) {
      if (key.startsWith("menu.coordinates")) continue; // 4.6 is written 4,6 in Bulgarian
      expect(numbers(BG.get(key) ?? ""), key).toEqual(numbers(text));
    }
  });
});
