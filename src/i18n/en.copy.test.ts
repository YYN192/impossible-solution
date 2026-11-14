import { describe, expect, it } from "vitest";
import en from "./en.json";
import { JARGON } from "./jargon";

/**
 * Copy rules for kid text (#15). Grown-up screens (Data Sources, teacher card, badges) may use
 * longer sentences, but no screen may use the jargon words below.
 */
const KID_SECTIONS = [
  "title", "common", "morning", "domino", "event", "earth", "plan", "endSol", "final",
  "jobs", "jobInfo", "crew", "planHelp", "bars", "help",
] as const;


const MAX_WORDS = 12;

type Tree = { [k: string]: string | Tree };

function strings(tree: Tree, prefix = ""): [string, string][] {
  return Object.entries(tree).flatMap(([k, v]) =>
    typeof v === "string" ? [[`${prefix}${k}`, v] as [string, string]] : strings(v, `${prefix}${k}.`),
  );
}

const all = strings(en as Tree);
const kid = all.filter(([key]) => KID_SECTIONS.some((s) => key.startsWith(`${s}.`)));

const sentences = (text: string) =>
  text
    .replace(/\{\{[^}]+\}\}/g, "X")
    .split(/(?<=[.!?])\s+/)
    .filter((s) => s.trim().length > 0);

const words = (sentence: string) => sentence.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w));

describe("en.json copy rules", () => {
  it("has kid text in every kid section", () => {
    for (const s of KID_SECTIONS) expect(kid.some(([key]) => key.startsWith(`${s}.`)), s).toBe(true);
  });

  it("never uses science jargon (DONKI, mGy, CME, X-rays …) on any screen", () => {
    for (const [key, text] of all) for (const bad of JARGON) expect(text, key).not.toMatch(bad);
  });

  it(`keeps kid sentences short (≤ ${MAX_WORDS} words)`, () => {
    for (const [key, text] of kid)
      for (const s of sentences(text)) expect(words(s).length, `${key}: "${s}"`).toBeLessThanOrEqual(MAX_WORDS);
  });

  it("has a 'What's this?' title and text for every tooltip topic", () => {
    const topics = Object.entries(en.help).filter(([, v]) => typeof v === "object");
    expect(topics.map(([k]) => k)).toEqual(
      expect.arrayContaining(["sol", "dose", "dust", "stormCloud", "askEarth", "burst"]),
    );
    for (const [k, v] of topics) {
      const t = v as { title: string; text: string };
      expect(t.title, k).toBeTruthy();
      expect(t.text, k).toBeTruthy();
    }
  });

  it("uses the locked Ask Earth wording from concept.md", () => {
    expect(en.help.askEarth.text).toBe(
      "Your message takes about 12 minutes to reach Earth. Scientists study it overnight. Their answer is waiting for you in the morning.",
    );
  });

  it("has a done and skipped line for every job", () => {
    for (const job of Object.keys(en.jobs) as (keyof typeof en.jobs)[]) {
      expect(en.jobInfo[job].done, job).toBeTruthy();
      expect(en.jobInfo[job].skipped, job).toBeTruthy();
    }
  });
});
