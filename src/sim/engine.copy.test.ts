/**
 * The kid text (en.json) must tell the same story as the engine's game numbers.
 * If a game number changes, these tests point at the sentence that has to change with it.
 */
import { describe, expect, it } from "vitest";
import en from "../i18n/en.json";
import { may2024Mission } from "../data/mission";
import { createGame, ENGINE, step } from "./engine";
import type { JobId, Plan } from "./types";

type Tree = { [k: string]: string | Tree };
const lookup = (key: string): string | undefined =>
  key.split(".").reduce<string | Tree | undefined>((t, k) => (typeof t === "object" ? t[k] : undefined), en as Tree) as
    | string
    | undefined;

describe("kid text matches the engine", () => {
  it("the science job says how many trips the science star needs", () => {
    const text = en.jobInfo.science.done;
    expect(text).toContain(String(ENGINE.scienceGoal));
    if (ENGINE.scienceGoal > 1) expect(text).not.toMatch(/\b1 science star\b/i);
  });

  it("every domino the engine drops has a sentence in en.json", () => {
    const { events, forecasts } = may2024Mission();
    const plans: Plan[][] = [
      [{}, {}, {}],
      [{ a1: "science", a2: "science" }, { a1: "science", a2: "science" }, {}],
      [{ a1: "panels" as JobId }, { a1: "greenhouse" }, { a1: "shelter" }],
    ];
    for (const mission of plans) {
      let g = createGame();
      for (const p of mission) if (!g.over) g = step(g, p, events, forecasts).state;
      for (const d of g.dominoes) expect(lookup(d.textKey), d.textKey).toEqual(expect.any(String));
    }
  });
});
