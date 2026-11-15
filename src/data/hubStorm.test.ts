import { describe, expect, it } from "vitest";
import { act, createGame } from "../sim/engine";
import { campaignMission } from "./mission";
import { greenhouseAction, hubStormFor, panelsAction, repaired } from "./hubStorm";

const stormSols = (id: string, seed: number) => {
  const setup = campaignMission(id, seed);
  return Array.from({ length: setup.rules.sols ?? 3 }, (_, i) => i + 1).filter((sol) => hubStormFor(setup, sol));
};

describe("dust storm at the base", () => {
  it("never on the Moon, never in the demo recording, never on sol 1 of a random storm", () => {
    for (let seed = 1; seed < 200; seed++) {
      expect(stormSols("moon", seed)).toEqual([]);
      expect(stormSols("storm", seed)).not.toContain(1);
      expect(hubStormFor(campaignMission("storm", seed), 2, true)).toBeUndefined();
    }
  });

  it("is random per run but the same for the same run number; at most one per Mars run", () => {
    const counts = Array.from({ length: 300 }, (_, seed) => stormSols("storm", seed + 1).length);
    expect(Math.max(...counts)).toBe(1);
    const share = counts.filter(Boolean).length / counts.length;
    expect(share).toBeGreaterThan(0.5);
    expect(share).toBeLessThan(0.8);
    expect(stormSols("storm", 42)).toEqual(stormSols("storm", 42));
  });

  it("Dust Season: on the first sol of each real dust storm it replays", () => {
    const setup = campaignMission("dust", 7);
    const firstSols = setup.events.filter((e) => e.kind === "dustStorm" && !setup.events.some((d) => d.id === e.id && d.sol === e.sol - 1)).map((e) => e.sol);
    expect(stormSols("dust", 7)).toEqual(firstSols);
    expect(firstSols.length).toBeGreaterThan(0);
  });

  it("each repair is a domino through the engine and costs something", () => {
    const storm = hubStormFor(campaignMission("dust", 7), stormSols("dust", 7)[0])!;
    let state = { ...createGame(), panelEfficiency: 0.5 };
    state = act(state, panelsAction(storm)).state;
    expect(state.panelEfficiency).toBe(1);
    expect(state.bars.dose).toBeGreaterThan(createGame().bars.dose);
    expect(repaired(state, "storm-panels")).toBe(true);
    const power = state.bars.power;
    state = act(state, greenhouseAction(state)).state;
    expect(state.bars.power).toBe(power - 1);
    expect(repaired(state, "storm-greenhouse")).toBe(true);
    // With no power left the repair still happens (and costs nothing), so the kid is never stuck.
    const empty = { ...createGame(), bars: { ...createGame().bars, power: 0 } };
    expect(repaired(act(empty, greenhouseAction(empty)).state, "storm-greenhouse")).toBe(true);
  });
});
