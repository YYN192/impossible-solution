/** Science-check findings (Sat 14 Nov) pinned as tests, so the wording can't drift back. */
import { describe, expect, it } from "vitest";
import en from "../i18n/en.json";
import {
  DONKI_ENLIL_MAY23,
  LIGHT_DELAY,
  REAL_FACTS,
  SIMPLIFICATION_KEYS,
} from "./sources";
import { may2024Mission, todaysSunMission } from "./mission";
import may from "./snapshots/enlil-mars-2024-05.json";

const fact = (id: string) => REAL_FACTS.find((f) => f.id === id)!;

describe("science check: real-data wording", () => {
  it("the burst dose has no unsourced duration and uses JPL's own number", () => {
    expect(fact("burst").value).not.toMatch(/day/i);
    expect(fact("burst").value).toContain("8,100 micrograys");
  });

  it("the CME speed covers both DONKI analyses and says 'far side' is what scientists think", () => {
    expect(fact("cme").value).toMatch(/1,900 to 2,700 km\/s/);
    expect(fact("cme").value).toMatch(/scientists think/i);
  });

  it("the 28 May forecast is described as a glancing blow, matching the snapshot", () => {
    const sim = may.data.find((s) => s.simulationID === "WSA-ENLIL/31103/1")!;
    const mars = sim.impactList.find((i) => i.location === "Mars")!;
    expect(mars.isGlancingBlow).toBe(true);
    expect(fact("forecast").value).toMatch(/brush past Mars/i);
  });

  it("the forecast links to DONKI's own page for that model run", () => {
    const sim = may.data.find((s) => s.simulationID === "WSA-ENLIL/31103/1")!;
    expect(DONKI_ENLIL_MAY23.url).toBe(sim.link);
  });

  it("the light delay says it is worked out from distance, not read off the page", () => {
    expect(LIGHT_DELAY.label).toMatch(/worked out/i);
    expect(LIGHT_DELAY.label).toMatch(/55 to 401 million km/);
  });

  it("the simplifies card says the dust forecast is made up and the dates differ", () => {
    const all = SIMPLIFICATION_KEYS.map(
      (key) => en.dataSources.simplificationItems[key],
    ).join(" ");
    expect(all).toMatch(/computer forecast, not a measurement/i);
    expect(all).toMatch(/dust forecast is made up/i);
    expect(all).toMatch(/2012.13/);
  });

  it("every real fact has complete, dated provenance", () => {
    for (const item of REAL_FACTS) {
      expect(item.what).not.toBe("");
      expect(item.value).not.toBe("");
      expect(item.ref.url).toMatch(/^https:\/\//);
      expect(new Date(item.ref.fetched).toString()).not.toBe("Invalid Date");
    }
  });

  it("uses the agreed final simplification text from issue 16", () => {
    const all = SIMPLIFICATION_KEYS.map(
      (key) => en.dataSources.simplificationItems[key],
    ).join(" ");
    expect(all).toMatch(/3 crew/i);
    expect(all).toMatch(/short sols/i);
    expect(all).toMatch(/job numbers.*game numbers/i);
    expect(all).toMatch(
      /storm, normal radiation dose, dust effect.*message delay/i,
    );
  });
});

describe("science check: Earth's answer credits DONKI only for the storm cloud", () => {
  it("main mission answers say the dust part is a game number", () => {
    for (const a of Object.values(may2024Mission().forecasts)) {
      expect(a.source.label).toMatch(/dust.*game/i);
    }
  });

  it("Today's Sun answers say the dust part is a game number", () => {
    const now = new Date("2026-11-14T10:00:00Z");
    const m = todaysSunMission(
      [{ simulationID: "x", arrival: "2026-11-16T10:00Z" }],
      "network",
      now.getTime(),
      now,
    );
    for (const a of Object.values(m.forecasts)) {
      expect(a.source.label).toMatch(/dust.*game/i);
    }
  });
});
