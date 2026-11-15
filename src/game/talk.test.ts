import { describe, expect, it } from "vitest";
import en from "../i18n/en.json";
import { DRILL, lettersShown, missionTalkKey } from "./talk";

describe("crew talk", () => {
  it("types letters over time and stops at the end", () => {
    expect(lettersShown("hello", 0)).toBe(0);
    expect(lettersShown("hello", 50, 40)).toBe(2);
    expect(lettersShown("hello", 9999)).toBe(5);
  });
  it("each crew member practises a real mission mini-game", () => {
    expect(DRILL).toMatchObject({ commander: "askEarth", engineer: "panels", scientist: "greenhouse", drone: "shelter" });
  });
  it("every crew member explains every menu campaign; the classic uses the storm lines", () => {
    for (const sp of ["commander", "engineer", "scientist", "drone"] as const)
      for (const c of ["storm", "dust", "moon", "classic", undefined]) {
        const key = missionTalkKey(sp, c).split(".");
        expect(key.reduce((o: never, k) => (o as Record<string, never>)?.[k], en as never), `${sp}/${c}`).toEqual(expect.any(String));
      }
    expect(missionTalkKey("drone", "classic")).toBe("talk.drone.mission.storm");
  });
});
