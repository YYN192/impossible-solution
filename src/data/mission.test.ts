import { describe, expect, it } from "vitest";
import { marsHits } from "./donki";
import { readFlags } from "./flags";
import { getMissionSetup, may2024Mission, todaysSunMission } from "./mission";
import cme from "./snapshots/cme-2024-05-20.json";
import may from "./snapshots/enlil-mars-2024-05.json";

describe("snapshots are real and safe", () => {
  it("contain the 20 May 2024 CME", () => {
    expect(cme.data[0].activityID).toBe("2024-05-20T05:36:00-CME-001");
  });
  it("contain the forecast of a storm cloud reaching Mars on 28 May 2024", () => {
    expect(marsHits(may.data).some((h) => h.arrival === "2024-05-28T11:30Z")).toBe(true);
  });
  it("never contain an API key", () => {
    expect(JSON.stringify([cme, may])).not.toMatch(/api_key|DEMO_KEY/);
  });
});

describe("marsHits", () => {
  it("ignores forecasts that do not name Mars", () => {
    const sims = [
      { simulationID: "a", cmeIDs: [], impactList: [{ location: "Solar Orbiter", arrivalTime: "2024-05-21T06:05Z" }] },
      { simulationID: "b", cmeIDs: [], impactList: [{ location: "Mars", arrivalTime: "2024-05-28T11:30Z" }] },
    ];
    expect(marsHits(sims).map((h) => h.simulationID)).toEqual(["b"]);
  });
});

describe("flags", () => {
  it("demo implies offline and disables Today's Sun", () => {
    expect(readFlags("?demo=1&sun=today")).toEqual({ demo: true, offline: true, todaysSun: false });
  });
  it("defaults are all off", () => {
    expect(readFlags("")).toEqual({ demo: false, offline: false, todaysSun: false });
  });
});

describe("mission setup", () => {
  it("main mission: burst on sol 2 (no warning), storm cloud on sol 3, Earth warns on sol 1", () => {
    const m = may2024Mission();
    expect(m.events.map((e) => [e.sol, e.kind])).toEqual([
      [2, "particleBurst"],
      [3, "stormCloud"],
    ]);
    expect(m.forecasts[1].stormCloudInSols).toBe(1);
    expect(m.dataSource).toBe("snapshot");
  });

  it("demo mission is identical every time and never needs the network", async () => {
    const flags = readFlags("?demo=1");
    const a = await getMissionSetup(flags);
    const b = await getMissionSetup(flags);
    expect(a).toEqual(b);
    expect(a.kind).toBe("may2024");
  });

  it("Today's Sun with no Mars-bound storm falls back to the main mission with a notice", () => {
    const m = todaysSunMission([], "network", Date.now(), new Date());
    expect(m.kind).toBe("may2024");
    expect(m.noticeKey).toBe("notice.sunQuiet");
  });

  it("Today's Sun labels live data as live and saved data as snapshot", () => {
    const hit = [{ simulationID: "x", arrival: "2026-11-13T12:00Z" }];
    const now = new Date("2026-11-14T10:00:00Z");
    expect(todaysSunMission(hit, "network", now.getTime(), now).events[0].source.mode).toBe("live");
    expect(todaysSunMission(hit, "snapshot", now.getTime(), now).events[0].source.mode).toBe("snapshot");
  });

  it("Today's Sun offline uses the bundled recent snapshot", async () => {
    const m = await getMissionSetup(readFlags("?offline=1&sun=today"));
    expect(m.dataSource).toBe("snapshot");
  });
});

describe("Today's Sun sol mapping (gap tests)", () => {
  const now = new Date("2026-11-14T10:00:00Z");
  const at = (iso: string) => todaysSunMission([{ simulationID: "x", arrival: iso }], "network", now.getTime(), now).events[0].sol;
  it("a storm cloud arriving in about 1 day lands on sol 2", () => expect(at("2026-11-15T10:00Z")).toBe(2));
  it("a storm cloud arriving in about 2 days lands on sol 3", () => expect(at("2026-11-16T10:00Z")).toBe(3));
  it("far-future and already-arrived storm clouds land on the last sol", () => {
    expect(at("2026-11-30T10:00Z")).toBe(3);
    expect(at("2026-11-01T10:00Z")).toBe(3);
  });
  it("Earth's sol-1 answer counts down to the storm cloud", () => {
    const m = todaysSunMission([{ simulationID: "x", arrival: "2026-11-16T10:00Z" }], "network", now.getTime(), now);
    expect(m.forecasts[1].stormCloudInSols).toBe(1);
    expect(m.forecasts[2].stormCloudInSols).toBe(0);
  });
});
