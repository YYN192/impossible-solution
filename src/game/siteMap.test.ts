import { describe, expect, it } from "vitest";
import { MENU_CAMPAIGNS } from "../data/campaigns";
import { canTravel, mapSites, type SiteState } from "./siteMap";

const states = (done: string[], current?: string, teacher = false) =>
  Object.fromEntries(mapSites(MENU_CAMPAIGNS, { done, teacher }, current).map((s) => [s.id, s.state])) as Record<string, SiteState>;

describe("mission sites on the airlock map", () => {
  it("shows every menu mission once, in menu order, with its place", () => {
    const sites = mapSites(MENU_CAMPAIGNS, { done: [], teacher: false });
    expect(sites.map((s) => s.id)).toEqual(MENU_CAMPAIGNS.map((c) => c.id));
    expect(sites.map((s) => s.place)).toEqual(MENU_CAMPAIGNS.map((c) => c.place));
  });

  it("a new player: the first mission is open, the rest are locked", () => {
    expect(states([])).toEqual({ storm: "open", dust: "locked", moon: "locked" });
  });

  it("finishing a mission marks it done and opens the next one", () => {
    expect(states(["storm"])).toEqual({ storm: "done", dust: "open", moon: "locked" });
    expect(states(["storm", "dust", "moon"])).toEqual({ storm: "done", dust: "done", moon: "done" });
  });

  it("the mission being played is 'here', even when it was finished before", () => {
    expect(states([], "storm")).toEqual({ storm: "here", dust: "locked", moon: "locked" });
    expect(states(["storm"], "storm")).toEqual({ storm: "here", dust: "open", moon: "locked" });
  });

  it("the quick classic mission is not a site, so nothing is 'here'", () => {
    expect(Object.values(states([], "classic"))).not.toContain("here");
  });

  it("teacher mode opens every site", () => {
    expect(states([], undefined, true)).toEqual({ storm: "open", dust: "open", moon: "open" });
  });

  it("a locked site names the mission to finish first", () => {
    const sites = mapSites(MENU_CAMPAIGNS, { done: [], teacher: false });
    expect(sites.find((s) => s.id === "dust")?.unlockAfter).toBe("storm");
    expect(sites.find((s) => s.id === "storm")?.unlockAfter).toBeUndefined();
  });

  it("every site sits inside its map panel", () => {
    for (const s of mapSites(MENU_CAMPAIGNS, { done: [], teacher: false })) {
      expect(s.at.x).toBeGreaterThanOrEqual(8); expect(s.at.x).toBeLessThanOrEqual(92);
      expect(s.at.y).toBeGreaterThanOrEqual(8); expect(s.at.y).toBeLessThanOrEqual(92);
    }
  });
});

describe("fast travel from the airlock map (#106)", () => {
  const travel = (done: string[], current?: string) =>
    mapSites(MENU_CAMPAIGNS, { done, teacher: false }, current).filter(canTravel).map((s) => s.id);
  it("open and done bases can be travelled to; locked ones and the base you are on cannot", () => {
    expect(travel([])).toEqual(["storm"]); // a new player on the quick mission: only the first base is open
    expect(travel(["storm"], "storm")).toEqual(["dust"]); // storm is "here", dust just opened, the Moon is locked
    expect(travel(["storm", "dust"], "dust")).toEqual(["storm", "moon"]); // a done base can be replayed
  });
});
