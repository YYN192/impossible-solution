import { describe, expect, it } from "vitest";
import { createGame } from "../sim/engine";
import type { GameState } from "../sim/types";
import { campaignMission, may2024Mission, type MissionSetup } from "../data/mission";
import { hubStormFor } from "../data/hubStorm";
import { musicScene, stormMusic } from "./musicDirector";

/** A Mars setup whose seed brings the base dust storm, and the sol it comes on. */
function dustRun(): { setup: MissionSetup; sol: number } {
  for (let seed = 1; seed < 500; seed++) {
    const setup = campaignMission("classic", seed);
    for (let sol = 1; sol <= (setup.rules.sols ?? 3); sol++) if (hubStormFor(setup, sol)) return { setup, sol };
  }
  throw new Error("no storm seed");
}
const on = (sol: number, extra: Partial<GameState> = {}): GameState => ({ ...createGame(), sol, ...extra });
const domino = (sol: number, id: string) => ({ id: `sol${sol}-${id}` }) as GameState["dominoes"][number];

describe("music scene", () => {
  it("menu, loading, base and the Moon hub", () => {
    expect(musicScene("menu", undefined)).toBe("menu");
    expect(musicScene("hub", undefined)).toBe("off");
    expect(musicScene("hub", { place: "mars" } as MissionSetup)).toBe("base");
    expect(musicScene("console", { place: "mars" } as MissionSetup)).toBe("base");
    expect(musicScene("hub", { place: "moon" } as MissionSetup)).toBe("moon-hub");
    expect(musicScene("console", { place: "moon" } as MissionSetup)).toBe("base");
  });
});

describe("storm music follows the real storm only", () => {
  it("the base dust storm: from its alarm (morning of that sol) until BOTH repairs are done", () => {
    const { setup, sol } = dustRun();
    expect(stormMusic(setup, { screen: "morning", sol }, on(sol))).toBe(true);
    expect(stormMusic(setup, { screen: "plan", sol }, on(sol))).toBe(true); // alarm closed, not fixed yet
    const half = on(sol, { dominoes: [domino(sol, "storm-panels")] });
    expect(stormMusic(setup, { screen: "plan", sol }, half)).toBe(true); // repairs in stages
    const fixed = on(sol, { dominoes: [domino(sol, "storm-panels"), domino(sol, "storm-greenhouse")] });
    expect(stormMusic(setup, { screen: "plan", sol }, fixed)).toBe(false); // all clear
    expect(stormMusic(setup, { screen: "endSol", sol }, on(sol))).toBe(false);
    expect(stormMusic(setup, { screen: "morning", sol: sol === 1 ? 2 : sol - 1 }, on(sol === 1 ? 2 : sol - 1))).toBe(false);
  });

  it("never in the ?demo=1 recording, never on the Moon, never because the campaign is called storm", () => {
    const { setup, sol } = dustRun();
    expect(stormMusic(setup, { screen: "morning", sol }, on(sol), true)).toBe(false);
    expect(stormMusic({ ...setup, place: "moon" }, { screen: "morning", sol }, on(sol))).toBe(false);
    const calm = { ...setup, campaignId: "storm", events: [], rules: { ...setup.rules, sols: 1 } };
    for (let s = 1; s <= 3; s++) expect(stormMusic(calm, { screen: "plan", sol: s }, on(s))).toBe(false);
  });

  it("a storm cloud counts only when Earth warned about it; a particle burst never does", () => {
    const setup = may2024Mission();
    const cloud = setup.events.find((e) => e.kind === "stormCloud")!;
    const burst = setup.events.find((e) => e.kind === "particleBurst")!;
    // sols: 1 switches off the seeded base dust storm, so only the space-weather events are left.
    const space: MissionSetup = { ...setup, rules: { ...setup.rules, sols: 1 } };
    expect(hubStormFor(space, cloud.sol)).toBeUndefined();
    const nav = { screen: "morning" as const, sol: cloud.sol };
    expect(stormMusic(space, nav, on(cloud.sol))).toBe(false); // no warning, no storm music
    expect(stormMusic(space, nav, on(cloud.sol, { warnedSols: [cloud.sol] }))).toBe(true);
    expect(stormMusic(space, { screen: "plan", sol: cloud.sol }, on(cloud.sol, { warnedSols: [cloud.sol] }))).toBe(true);
    expect(stormMusic(space, { screen: "endSol", sol: cloud.sol }, on(cloud.sol, { warnedSols: [cloud.sol] }))).toBe(false);
    expect(stormMusic(space, { screen: "morning", sol: cloud.sol - 1 }, on(cloud.sol - 1, { warnedSols: [cloud.sol] }))).toBe(false); // a forecast is not the storm
    expect(stormMusic(space, { screen: "morning", sol: burst.sol }, on(burst.sol, { warnedSols: [burst.sol] }))).toBe(false); // bursts come unwarned
  });
});
