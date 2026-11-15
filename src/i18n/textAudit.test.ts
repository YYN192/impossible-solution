/**
 * Text audit (#67): rules for text that did not add anything. The report is docs/text-audit.md.
 * EN and BG change together; the copy tests (en.copy.test.ts, bg.copy.test.ts) keep the keys identical.
 */
import { describe, expect, it } from "vitest";
import bg from "./bg.json";
import en from "./en.json";

type Tree = { [k: string]: string | Tree };
const flat = (o: Tree, p = ""): [string, string][] =>
  Object.entries(o).flatMap(([k, v]) => (typeof v === "string" ? [[p + k, v] as [string, string]] : flat(v, `${p}${k}.`)));
const EN = Object.fromEntries(flat(en as Tree)), BG = Object.fromEntries(flat(bg as Tree));
const words = (s: string) => s.replace(/\{\{[^}]+\}\}/g, "X").split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;

describe("#67: say what to do, not which finger to use", () => {
  it('no EN text says "tap" (keyboard and mouse players do not tap)', () => {
    expect(Object.entries(EN).filter(([, v]) => /\btap/i.test(v))).toEqual([]);
  });
  it('no BG text says "докосни" either', () => {
    expect(Object.entries(BG).filter(([, v]) => /докосн/i.test(v))).toEqual([]);
  });
});

describe("#67: one word per resource", () => {
  it('BG calls power "енергия" everywhere, like its meter (never "ток")', () => {
    expect(BG["bars.power"]).toBe("Енергия");
    const tok = /(^|[^\p{L}])(ток|тока|токът)(?=[^\p{L}]|$)/iu; // \b does not work on Cyrillic
    expect(Object.entries(BG).filter(([, v]) => tok.test(v))).toEqual([]);
  });
  it('EN kid text says "space rays", not "dose" (dose is only on the grown-up Data Sources page)', () => {
    expect(Object.entries(EN).filter(([k, v]) => /\bdose\b/i.test(v) && !k.startsWith("dataSources."))).toEqual([]);
  });
});

describe("#67: the dust alarm's real storm, short and with no units kids do not know", () => {
  for (const id of ["insight2022", "opportunity2018"]) {
    it(`${id}: at most 2 short sentences, no watt-hours`, () => {
      for (const s of [EN[`hubStorm.real.${id}`], BG[`hubStorm.real.${id}`]]) {
        expect(s).not.toMatch(/watt|ватчас|\bWh\b/i);
        const sentences = s.replace(/(\d) г\./g, "$1 г").split(/(?<=[.!?])\s+/).filter(Boolean); // "2022 г." is a year, not a sentence end
        expect(sentences.length).toBeLessThanOrEqual(2);
        for (const x of sentences) expect(words(x), x).toBeLessThanOrEqual(12);
      }
    });
  }
});

describe("#67: clearer lines", () => {
  it("the Moon sites say what is different about them, not that each 'lacks something'", () => {
    expect(EN["beat.siteMoon.text"]).not.toMatch(/lacks/i);
    expect(BG["beat.siteMoon.text"]).not.toMatch(/липсва/i);
  });
  it("the NASA event number says what it is", () => {
    expect(EN["storm.id"]).toMatch(/name/i);
    expect(BG["storm.id"]).toMatch(/име/i);
  });
});

describe("#67: the final screen teaches something", () => {
  it('"Mission complete! N of 3 stars" instead of "Mission over"', () => {
    expect(EN["final.heading"]).toBe("Mission complete! {{count}} of 3 stars");
    expect(BG["final.heading"]).toContain("{{count}}");
    expect(Object.values(EN)).not.toContain("Mission over");
  });
  it('one short "Next time: …" tip for each star goal', () => {
    for (const g of ["crewSafe", "baseRunning", "science"]) {
      expect(EN[`final.next.${g}`]).toMatch(/^Next time: /);
      expect(BG[`final.next.${g}`]).toMatch(/^Следващия път: /);
      for (const s of [EN[`final.next.${g}`], BG[`final.next.${g}`]])
        for (const x of s.split(/(?<=[.!?])\s+/)) expect(words(x), x).toBeLessThanOrEqual(12);
    }
  });
});
