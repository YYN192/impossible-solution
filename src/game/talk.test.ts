import { describe, expect, it } from "vitest";
import { growNeed, lettersShown, powerResult, toggleJob } from "./talk";

describe("crew talk rules", () => {
  it("types letters over time and stops at the end", () => {
    expect(lettersShown("hello", 0)).toBe(0);
    expect(lettersShown("hello", 50, 40)).toBe(2);
    expect(lettersShown("hello", 9999)).toBe(5);
  });
  it("gives at most 3 jobs to 3 crew, and a second tap takes a job back", () => {
    let p = toggleJob([], "panels");
    p = toggleJob(p, "shelter");
    p = toggleJob(p, "science");
    p = toggleJob(p, "greenhouse");
    expect(p).toEqual(["panels", "shelter", "science"]);
    expect(toggleJob(p, "shelter")).toEqual(["panels", "science"]);
  });
  it("needs both power cells used, with the air machine on", () => {
    expect(powerResult(["lamp"])).toBe("more");
    expect(powerResult(["lamp", "radio"])).toBe("noAir");
    expect(powerResult(["air", "radio"])).toBe("ok");
  });
  it("alternates water and light", () => {
    expect([0, 1, 2, 3].map(growNeed)).toEqual([
      "water",
      "light",
      "water",
      "light",
    ]);
  });
});
