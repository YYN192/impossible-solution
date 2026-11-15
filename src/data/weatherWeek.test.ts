/**
 * The radar's space weather strip (#60): DONKI's last 7 days, one row per event type, one mark per event.
 * Fixtures are trimmed real DONKI answers (CME 9 Nov 2026 really had a WSA-Enlil run listing Mars).
 */
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { weatherWeek } from "../../scripts/ingest/normalize.mjs";
import { WeatherWeek } from "./datasets";
import { liveSpaceWeather, liveWeatherWeek } from "./live";
import { cmeSpeed, flareSize, stormSize } from "./weatherWords";

const window = { start: "2026-11-08", end: "2026-11-15" };
const cme = (id: string, speed: number | null, impacts: string[][] = []) => ({
  activityID: id,
  startTime: id.slice(0, 16) + "Z",
  link: `https://webtools.ccmc.gsfc.nasa.gov/DONKI/view/CME/${id}/-1`,
  cmeAnalyses: [
    { isMostAccurate: false, speed: 1, enlilList: null },
    { isMostAccurate: true, speed, enlilList: impacts.map((locations) => ({ impactList: locations.map((location) => ({ location, arrivalTime: "2026-11-12T00:00Z" })) })) },
  ],
});
const RAW = {
  flr: [
    { flrID: "2026-11-10T05:00:00-FLR-001", classType: "M1.2", beginTime: "2026-11-10T04:40Z", peakTime: "2026-11-10T05:00Z", link: "https://x/flr1" },
    { flrID: "2026-11-01T00:00:00-FLR-001", classType: "X2.0", peakTime: "2026-11-01T00:00Z" }, // before the window
  ],
  sep: "", // DONKI answers "" when nothing happened
  cme: [
    cme("2026-11-14T22:15:00-CME-001", 804, [["Europa Clipper", "Juice"]]),
    cme("2026-11-09T18:15:00-CME-001", 726, [[], ["Mars", "Psyche", "STEREO A"]]),
    cme("2026-11-13T16:24:00-CME-001", null),
  ],
  gst: [{ gstID: "2026-11-12T03:00:00-GST-001", startTime: "2026-11-12T03:00Z", allKpIndex: [{ kpIndex: 5.33 }, { kpIndex: 7 }, { kpIndex: 6 }] }],
};
const row = (w: ReturnType<typeof weatherWeek>, type: string) => w.rows.find((r) => r.type === type)!;

describe("weatherWeek: DONKI answers → one row per event type", () => {
  const w = weatherWeek(RAW, window);

  it("has a row for flares, CMEs, particle showers and geomagnetic storms, and matches the saved-file schema", () => {
    expect(w.rows.map((r) => r.type)).toEqual(["flr", "cme", "sep", "gst"]);
    expect(WeatherWeek.parse(w)).toEqual(w);
  });

  it("keeps only events inside the 7-day window, oldest first", () => {
    expect(row(w, "flr").events!.map((e) => e.id)).toEqual(["2026-11-10T05:00:00-FLR-001"]);
    expect(row(w, "cme").events!.map((e) => e.time)).toEqual(["2026-11-09T18:15Z", "2026-11-13T16:24Z", "2026-11-14T22:15Z"]);
  });

  it("flare: class and peak time; CME: speed of the most accurate analysis (or unknown)", () => {
    expect(row(w, "flr").events![0]).toMatchObject({ time: "2026-11-10T05:00Z", flareClass: "M1.2", link: "https://x/flr1" });
    expect(row(w, "cme").events!.map((e) => e.speedKmS)).toEqual([726, null, 804]);
  });

  it("says Mars only when a DONKI WSA-Enlil run lists Mars (#8 rule)", () => {
    expect(row(w, "cme").events!.map((e) => e.marsForecast)).toEqual([true, false, false]);
    for (const type of ["flr", "sep", "gst"]) expect(row(w, type).events!.every((e) => !e.marsForecast)).toBe(true);
  });

  it("geomagnetic storm: the strongest Kp of the storm", () => {
    expect(row(w, "gst").events![0]).toMatchObject({ time: "2026-11-12T03:00Z", kp: 7 });
  });

  it("an empty answer is a real zero, a missing part is null (never a fake 0)", () => {
    expect(row(w, "sep").events).toEqual([]);
    const gone = weatherWeek({ ...RAW, flr: undefined }, window, { missing: ["flr"] });
    expect(row(gone, "flr").events).toBeNull();
    expect(row(gone, "cme").events).toHaveLength(3);
  });
});

describe("kid words for an event's size", () => {
  it("flares by class letter", () => {
    expect(["A1.0", "B5.1", "C3.2", "M1.2", "X2.0", "", undefined].map(flareSize)).toEqual(["tiny", "tiny", "small", "big", "huge", "unknown", "unknown"]);
  });
  it("CMEs by speed", () => {
    expect([300, 499, 500, 999, 1000, 2500, null].map(cmeSpeed)).toEqual(["slow", "slow", "fast", "fast", "veryFast", "veryFast", "unknown"]);
  });
  it("geomagnetic storms by Kp (NOAA G1 at Kp 5 … G5 at Kp 9)", () => {
    expect([5, 5.67, 6, 7, 8, 9, null].map(stormSize)).toEqual(["small", "small", "strong", "strong", "huge", "huge", "unknown"]);
  });
});

const server = setupServer();
let calls = 0;
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => { server.resetHandlers(); calls = 0; localStorage.clear(); });
afterAll(() => server.close());
const now = new Date("2026-11-15T12:00:00Z");
const donki = (type: string, body: unknown) =>
  http.get(`https://api.nasa.gov/DONKI/${type}`, () => { calls++; return HttpResponse.json(body as never); });
const week = [
  http.get("https://api.nasa.gov/DONKI/FLR", () => { calls++; return HttpResponse.json({ status: 404 }, { status: 404 }); }), // as on 14–15 Nov 2026
  donki("SEP", RAW.sep), donki("CME", RAW.cme), donki("GST", RAW.gst), donki("notifications", []),
];

describe("liveWeatherWeek (DONKI through the cached HTTP layer)", () => {
  it("is LIVE when DONKI answers; a broken part (FLR 404) is null, the rest still shows", async () => {
    server.use(...week);
    const r = await liveWeatherWeek({ now });
    expect(r.source).toBe("network");
    expect(r.data.window).toEqual({ start: "2026-11-08", end: "2026-11-15" });
    expect(r.data.rows.find((x) => x.type === "flr")!.events).toBeNull();
    expect(r.data.rows.find((x) => x.type === "cme")!.events).toHaveLength(3);
  });

  it("shares Today's Sun's cached answers: no extra NASA calls after it (rate limit)", async () => {
    server.use(...week);
    await liveSpaceWeather({ now }).catch(() => undefined);
    const before = calls;
    const r = await liveWeatherWeek({ now });
    expect(calls).toBe(before); // even the FLR 404 is not asked again for an hour (FAIL_TTL_MS)
    expect(r.source).toBe("cache");
  });

  it("offline: the saved snapshot, labelled as a snapshot", async () => {
    const r = await liveWeatherWeek({ now, offline: true });
    expect(calls).toBe(0);
    expect(r.source).toBe("snapshot");
    expect(WeatherWeek.parse(r.data)).toEqual(r.data);
  });

  it("when DONKI fails: the saved snapshot", async () => {
    server.use(http.get("https://api.nasa.gov/DONKI/*", () => new HttpResponse(null, { status: 500 })));
    const r = await liveWeatherWeek({ now, retries: 0 });
    expect(r.source).toBe("snapshot");
  });
});
