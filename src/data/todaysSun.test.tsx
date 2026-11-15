import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SunCard } from "../components/SunCard";
import i18n from "../i18n";
import { getRecentMarsForecasts, marsHits } from "./donki";
import { getMissionSetup, todaysSunMission } from "./mission";
import { readFlags } from "./flags";
import recent from "./snapshots/enlil-mars-recent.json";

const t = i18n.t.bind(i18n);
const now = new Date("2026-11-15T10:00:00Z");
// Shape of a real DONKI WSA-Enlil answer (15 Nov 2026), trimmed.
const raw = (id: string, location: string, arrivalTime: string, CMEID: string, speed: number) => ({
  simulationID: id,
  modelCompletionTime: "2026-11-09T19:32Z",
  link: `https://ccmc.gsfc.nasa.gov/DONKI/view/${id}`,
  cmeInputs: [{ cmeStartTime: "2026-11-09T18:15Z", CMEID, speed }],
  impactList: [{ location, arrivalTime, isGlancingBlow: true }],
});
const answer = (body: unknown) =>
  vi.fn(async () => new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } }));

describe("Today's Sun (#8)", () => {
  beforeEach(() => localStorage.clear());

  it("keeps only WSA-Enlil runs whose impact list names Mars, with the CME's ID and speed", async () => {
    const fetchImpl = answer([
      raw("earth-only", "Earth", "2026-11-17T00:00Z", "2026-11-14T01:00:00-CME-001", 900),
      raw("mars", "Mars", "2026-11-18T12:00Z", "2026-11-14T02:00:00-CME-001", 726),
    ]);
    const r = await getRecentMarsForecasts({ now, fetchImpl: fetchImpl as unknown as typeof fetch });
    expect(r.source).toBe("network");
    expect(r.data).toEqual([expect.objectContaining({ simulationID: "mars", cmeId: "2026-11-14T02:00:00-CME-001", speed: 726 })]);
    // The request asks DONKI for exactly the last 30 days.
    expect(String(fetchImpl.mock.calls[0])).toContain("startDate=2026-10-16&endDate=2026-11-15");
  });

  it("a forecast older than 30 days counts as a quiet Sun, not 'this month'", () => {
    const m = todaysSunMission([{ simulationID: "old", arrival: "2026-10-10T00:00Z" }], "snapshot", now.getTime(), now);
    expect(m.noticeKey).toBe("notice.sunQuiet");
    expect(m.sun).toBeUndefined();
  });

  it("no Mars-bound storm → quiet notice and the saved May 2024 storm, labelled saved", () => {
    const m = todaysSunMission([], "network", now.getTime(), now);
    expect(m.noticeKey).toBe("notice.sunQuiet");
    expect(m.dataSource).toBe("snapshot");
    expect(t("notice.sunQuiet")).toBe("The Sun is quiet toward Mars this month, so you get the May 2024 mission.");
  });

  it("a live CME only sets when the storm cloud comes: never a Mars dose", () => {
    const hit = { simulationID: "x", arrival: "2026-11-17T10:00Z", cmeId: "2026-11-14T02:00:00-CME-001", speed: 726 };
    const m = todaysSunMission([hit], "network", now.getTime(), now);
    expect(m.events).toHaveLength(1);
    expect(m.events[0]).not.toHaveProperty("dose"); // engine falls back to the disclosed game dose
    expect(m.events[0].id).toBe(hit.cmeId);
    expect(JSON.stringify(m.sun)).not.toMatch(/dose|mGy|mSv/i);
  });

  it("a storm cloud that already reached Mars is reported in the past tense", () => {
    const m = todaysSunMission(marsHits(recent.data), "network", now.getTime(), now);
    expect(m.noticeKey).toBe("notice.sunPassed");
    expect(m.events.every((e) => e.captionKey !== "event.stormCloud.today")).toBe(true);
    expect(m.sun).toMatchObject({ passed: true, arrival: "2026-11-13T12:00Z", cmeId: "2026-11-09T18:15:00-CME-001", speed: 726 });
  });

  it("the card says Live only for data downloaded just now", () => {
    const sun = { arrival: "2026-11-13T12:00Z", passed: true, url: "https://ccmc.gsfc.nasa.gov/DONKI/", cmeId: "C-1", speed: 726, fetchedAt: now.getTime() };
    const live = render(<SunCard sun={{ ...sun, source: "network" }} />);
    expect(live.container.textContent).toContain("Live NASA data");
    expect(live.container.textContent).toContain(t("notice.sunSpeed", { speed: 726 }));
    expect(screen.getByRole("link").getAttribute("href")).toBe(sun.url);
    live.unmount();
    for (const source of ["snapshot", "cache", "stale-cache"] as const) {
      const r = render(<SunCard sun={{ ...sun, source }} />);
      expect(r.container.textContent).not.toMatch(/live/i);
      r.unmount();
    }
  });

  it("?offline=1&sun=today makes no request and uses the saved forecast", async () => {
    const fetchImpl = vi.fn();
    const m = await getMissionSetup(readFlags("?offline=1&sun=today"), now, fetchImpl as unknown as typeof fetch);
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(m.sun?.source).toBe("snapshot");
  });
});
