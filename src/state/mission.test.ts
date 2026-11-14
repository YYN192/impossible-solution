import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFlags } from "../data/flags";
import { useMission } from "./mission";

const reset = () => useMission.setState({ status: "idle", setup: undefined });

describe("mission store (#5, #6, #8)", () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    reset();
    localStorage.clear();
    fetchSpy = vi.spyOn(globalThis, "fetch");
  });
  afterEach(() => fetchSpy.mockRestore());

  it("?demo=1 loads the May 2024 mission from saved data, with no network at all", async () => {
    await useMission.getState().load(readFlags("?demo=1"));
    const { status, setup } = useMission.getState();
    expect(status).toBe("ready");
    expect(setup?.kind).toBe("may2024");
    expect(setup?.dataSource).toBe("snapshot");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("?offline=1&sun=today uses the saved Today's Sun data, with no network", async () => {
    await useMission.getState().load(readFlags("?offline=1&sun=today"));
    expect(useMission.getState().setup?.dataSource).toBe("snapshot");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("loads only once, even if asked twice (React StrictMode runs effects twice)", async () => {
    const flags = readFlags("?demo=1");
    await Promise.all([useMission.getState().load(flags), useMission.getState().load(flags)]);
    const first = useMission.getState().setup;
    await useMission.getState().load(flags);
    expect(useMission.getState().setup).toBe(first);
  });

  it("Today's Sun with no Mars-bound storm in live data shows the quiet-Sun notice", async () => {
    fetchSpy.mockResolvedValue(new Response("[]", { status: 200, headers: { "Content-Type": "application/json" } }));
    await useMission.getState().load(readFlags("?sun=today"));
    const { setup } = useMission.getState();
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(String(fetchSpy.mock.calls[0][0])).toContain("api.nasa.gov/DONKI/WSAEnlilSimulations");
    expect(setup?.noticeKey).toBe("notice.sunQuiet");
    expect(setup?.dataSource).toBe("snapshot"); // the fallback mission is saved data, never "live"
  });
});

describe("every text key the data layer hands to screens exists in en.json", () => {
  it("mission titles, storm captions and notices all resolve", async () => {
    const i18n = (await import("../i18n")).default;
    const { may2024Mission, todaysSunMission } = await import("../data/mission");
    const now = new Date("2026-11-14T10:00:00Z");
    const missions = [
      may2024Mission(),
      todaysSunMission([{ simulationID: "x", arrival: "2026-11-16T10:00Z" }], "network", now.getTime(), now),
      todaysSunMission([], "network", now.getTime(), now),
    ];
    for (const m of missions) {
      const keys = [m.titleKey, ...m.events.map((e) => e.captionKey), ...(m.noticeKey ? [m.noticeKey] : [])];
      for (const k of keys) expect(i18n.exists(k as never), k).toBe(true);
    }
  });
});
