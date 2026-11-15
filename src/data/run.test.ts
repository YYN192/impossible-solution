/** Which run the app builds from the URL: campaign, seed, daily mission, demo, and the radio delay. */
import { describe, expect, it, vi } from "vitest";
import { getMarsDelay, MOON_DELAY_INFO } from "./dsn";
import { readFlags } from "./flags";
import { dailySeed, getMissionSetup } from "./mission";

const NOW = new Date("2026-11-15T08:00:00Z");
const noNetwork = vi.fn(() => Promise.reject(new Error("no network in this test")));

describe("URL flags for runs", () => {
  it("reads the campaign and the seed", () => {
    expect(readFlags("?campaign=dust&seed=7")).toMatchObject({ campaign: "dust", seed: 7 });
    expect(readFlags("?seed=abc").seed).toBeUndefined();
    expect(readFlags("?daily=1").daily).toBe(true);
    expect(readFlags("?teacher=1").teacher).toBe(true);
  });

  it("the demo ignores campaign, seed and daily: it is always the same recording", () => {
    expect(readFlags("?demo=1&campaign=moon&seed=9&daily=1")).toMatchObject({ demo: true, offline: true });
    expect(readFlags("?demo=1&campaign=moon&seed=9&daily=1").campaign).toBeUndefined();
    expect(readFlags("?demo=1&seed=9").seed).toBeUndefined();
  });
});

describe("mission setup for campaigns", () => {
  it("builds the chosen campaign from its seed, the same every time", async () => {
    const flags = readFlags("?campaign=dust&seed=7&offline=1");
    const a = await getMissionSetup(flags, NOW, noNetwork);
    expect(a).toMatchObject({ campaignId: "dust", seed: 7, place: "mars" });
    expect(a.rules.sols).toBe(6);
    expect(Object.keys(a.beats)).toHaveLength(6);
    expect(await getMissionSetup(flags, NOW, noNetwork)).toEqual(a);
    expect(noNetwork).not.toHaveBeenCalled();
  });

  it("without a campaign it is the classic storm mission, with a seed to replay it", async () => {
    const s = await getMissionSetup(readFlags("?offline=1"), NOW, noNetwork);
    expect(s.campaignId).toBe("storm");
    expect(s.rules.sols).toBe(3);
    expect(Number.isInteger(s.seed)).toBe(true);
    expect(s.events.some((e) => e.kind === "particleBurst")).toBe(true);
    expect(s.stormId).toBeTruthy();
  });

  it("the daily mission has the same seed for everyone on the same day", async () => {
    expect(dailySeed(NOW)).toBe(20261115);
    const s = await getMissionSetup(readFlags("?daily=1&offline=1"), NOW, noNetwork);
    expect(s.seed).toBe(20261115);
    expect(await getMissionSetup(readFlags("?daily=1&offline=1"), new Date("2026-11-15T21:00:00Z"), noNetwork)).toEqual(s);
  });

  it("the demo is the May 2024 storm with the burst on sol 2, whatever the clock says", async () => {
    const s = await getMissionSetup(readFlags("?demo=1"), NOW, noNetwork);
    expect(s).toMatchObject({ campaignId: "storm", stormId: "may2024", seed: 0 });
    expect(s.events.map((e) => `${e.kind}@${e.sol}`)).toEqual(["particleBurst@2", "stormCloud@3"]);
    expect(await getMissionSetup(readFlags("?demo=1"), new Date("2030-01-01T00:00:00Z"), noNetwork)).toEqual(s);
    expect(noNetwork).not.toHaveBeenCalled();
  });

  it("the Moon campaign uses the Earth–Moon light time, a constant", async () => {
    const s = await getMissionSetup(readFlags("?campaign=moon&seed=3&offline=1"), NOW, noNetwork);
    expect(s.place).toBe("moon");
    expect(s.delay).toEqual(MOON_DELAY_INFO);
    expect(s.delay.seconds).toBeCloseTo(1.3);
  });
});

describe("today's real light delay to Mars (Deep Space Network)", () => {
  const answer = (data: unknown) =>
    vi.fn(() =>
      Promise.resolve(
        new Response(JSON.stringify({ source: "live", fetchedAt: "2026-11-15T07:59:00.000Z", upstream: "https://eyes.nasa.gov/dsn/data/dsn.xml", data }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      ),
    );

  it("offline: the saved reading, labelled as saved, and no network call", async () => {
    const d = await getMarsDelay({ offline: true, fetchImpl: noNetwork, apiBase: "/api" });
    expect(d.source).toBe("snapshot");
    expect(d.ref.mode).toBe("snapshot");
    expect(Math.round(d.seconds / 60)).toBe(11);
    expect(noNetwork).not.toHaveBeenCalled();
  });

  it("live: half the round-trip time of the Mars link that is being tracked now", async () => {
    const fetchImpl = answer([{ spacecraft: "M20", rtltSeconds: 1200, dish: "DSS24", station: "Goldstone" }]);
    const d = await getMarsDelay({ fetchImpl, apiBase: "/api", cacheKey: "test:dsn:live" });
    expect(d.seconds).toBe(600);
    expect(d.craft).toBe("M20");
    expect(d.source).toBe("network");
    expect(d.ref.mode).toBe("live");
    expect(String((fetchImpl.mock.calls as unknown[][])[0][0])).toContain("/api/dsn/mars");
  });

  it("no Mars link tracked right now, or the backend is down: the saved reading, never called live", async () => {
    const empty = await getMarsDelay({ fetchImpl: answer([]), apiBase: "/api", cacheKey: "test:dsn:empty" });
    expect(empty.ref.mode).toBe("snapshot");
    const down = await getMarsDelay({ fetchImpl: noNetwork, apiBase: "/api", cacheKey: "test:dsn:down" });
    expect(down.ref.mode).toBe("snapshot");
    expect(Math.round(down.seconds / 60)).toBe(11);
  });

  it("static hosting without a backend never tries the network", async () => {
    const fetchImpl = answer([]);
    await getMarsDelay({ fetchImpl, apiBase: "" });
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
