import { afterEach, describe, expect, it, vi } from "vitest";
import {
  clearCache,
  handleDonki,
  handleDsnMars,
  handleOsdrSearch,
  handleStatus,
} from "./nasa.js";

const ok = (
  body: unknown,
  status = 200,
  headers: Record<string, string> = {},
) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
const req = (path: string, origin?: string) =>
  new Request(`https://impossible-solution.vercel.app${path}`, {
    headers: origin ? { Origin: origin } : {},
  });
const now = () => new Date("2026-11-14T12:00:00Z");
/** CCMC unreachable (as from the venue): every call goes to the api.nasa.gov gateway. */
const noCcmc = (f: (u: string) => Promise<Response>) =>
  vi.fn(async (u: string | URL | Request) => {
    if (String(u).includes("kauai")) throw new TypeError("fetch failed");
    return f(String(u));
  });

afterEach(() => {
  clearCache();
  vi.unstubAllEnvs();
});

describe("/api/donki/:type", () => {
  it("rejects unknown types without calling NASA", async () => {
    const f = vi.fn();
    const r = await handleDonki(req("/api/donki/APOD"), { fetchImpl: f, now });
    expect(r.status).toBe(400);
    expect(f).not.toHaveBeenCalled();
  });

  it.each([
    ["startDate=2026-13-01&endDate=2026-11-14", /date/i],
    ["startDate=yesterday", /date/i],
    ["startDate=2026-11-14&endDate=2026-11-01", /before/i],
    ["startDate=2026-08-01&endDate=2026-11-14", /60/],
  ])("rejects bad dates: %s", async (q, msg) => {
    const f = vi.fn();
    const r = await handleDonki(req(`/api/donki/CME?${q}`), {
      fetchImpl: f,
      now,
    });
    expect(r.status).toBe(400);
    expect((await r.json()).error).toMatch(msg);
    expect(f).not.toHaveBeenCalled();
  });

  it("answers a live envelope, keeps the key server-side, sets CDN cache", async () => {
    vi.stubEnv("NASA_API_KEY", "secret-test-key");
    const f = noCcmc(async () => ok([{ activityID: "C1" }]));
    const r = await handleDonki(
      req("/api/donki/CME?startDate=2026-11-01&endDate=2026-11-14"),
      { fetchImpl: f, now },
    );
    expect(r.status).toBe(200);
    const body = await r.json();
    expect(body).toMatchObject({
      source: "live",
      data: [{ activityID: "C1" }],
    });
    expect(body.upstream).toBe(
      "https://api.nasa.gov/DONKI/CME?startDate=2026-11-01&endDate=2026-11-14",
    );
    expect(Date.parse(body.fetchedAt)).not.toBeNaN();
    expect(JSON.stringify(body)).not.toContain("secret-test-key");
    expect(String(f.mock.calls[1]?.[0])).toContain("api_key=secret-test-key");
    expect(r.headers.get("Cache-Control")).toMatch(
      /s-maxage=3600.*stale-while-revalidate/,
    );
  });

  it("uses DEMO_KEY when no key is set and defaults to the last 30 days", async () => {
    const f = noCcmc(async () => ok(""));
    const r = await handleDonki(req("/api/donki/notifications?type=all"), {
      fetchImpl: f,
      now,
    });
    expect(r.status).toBe(200);
    expect((await r.json()).data).toEqual([]); // DONKI says "" when nothing happened
    const url = new URL(String(f.mock.calls[1]?.[0]));
    expect(url.searchParams.get("api_key")).toBe("DEMO_KEY");
    expect(url.searchParams.get("startDate")).toBe("2026-10-15");
    expect(url.searchParams.get("type")).toBe("all");
  });

  it("retries once on 429 / 5xx, honouring Retry-After", async () => {
    const f = vi
      .fn()
      .mockResolvedValueOnce(ok({}, 503, { "Retry-After": "0" }))
      .mockResolvedValueOnce(ok([]));
    const r = await handleDonki(req("/api/donki/GST"), { fetchImpl: f, now });
    expect(r.status).toBe(200);
    expect(f).toHaveBeenCalledTimes(2);
  });

  it("answers 504 JSON when NASA is too slow", async () => {
    const hang = (_u: unknown, init?: RequestInit) =>
      new Promise<Response>((_, reject) =>
        init?.signal?.addEventListener("abort", () =>
          reject(init.signal?.reason),
        ),
      );
    const r = await handleDonki(req("/api/donki/CME"), {
      fetchImpl: hang as typeof fetch,
      now,
      timeoutMs: 20,
    });
    expect(r.status).toBe(504);
    expect(r.headers.get("Content-Type")).toMatch(/json/);
    expect((await r.json()).error).toMatch(/timeout/i);
  });

  it("serves the last good answer as 'cached' when NASA fails later", async () => {
    const f = vi
      .fn()
      .mockResolvedValueOnce(ok([{ a: 1 }]))
      .mockResolvedValue(ok({}, 500));
    await handleDonki(req("/api/donki/SEP"), { fetchImpl: f, now });
    const r = await handleDonki(req("/api/donki/SEP"), { fetchImpl: f, now });
    expect(r.status).toBe(200);
    expect(await r.json()).toMatchObject({
      source: "cached",
      data: [{ a: 1 }],
    });
  });

  it("refuses answers that are not a DONKI list (schema check)", async () => {
    const r = await handleDonki(req("/api/donki/FLR"), {
      fetchImpl: async () => ok({ hello: 1 }),
      now,
    });
    expect(r.status).toBe(502);
  });

  it("allows CORS only for our own origins", async () => {
    const f = async () => ok([]);
    const mine = await handleDonki(
      req("/api/donki/CME", "https://yyn192.github.io"),
      { fetchImpl: f, now },
    );
    expect(mine.headers.get("Access-Control-Allow-Origin")).toBe(
      "https://yyn192.github.io",
    );
    const other = await handleDonki(
      req("/api/donki/CME", "https://evil.example"),
      { fetchImpl: f, now },
    );
    expect(other.headers.get("Access-Control-Allow-Origin")).toBeNull();
  });
});

describe("/api/osdr/search", () => {
  it("validates term and size", async () => {
    const f = vi.fn();
    for (const q of [
      "",
      "?term=",
      "?term=a%26b",
      "?term=Veggie&size=500",
      `?term=${"x".repeat(80)}`,
    ]) {
      expect(
        (await handleOsdrSearch(req(`/api/osdr/search${q}`), { fetchImpl: f }))
          .status,
      ).toBe(400);
    }
    expect(f).not.toHaveBeenCalled();
  });

  it("proxies a search with a 1-day CDN cache", async () => {
    const f = vi.fn(async () =>
      ok({ hits: { total: 1, hits: [{ _source: { x: 1 } }] } }),
    );
    const r = await handleOsdrSearch(
      req("/api/osdr/search?term=Veggie lettuce&size=3"),
      { fetchImpl: f },
    );
    expect(r.status).toBe(200);
    expect((await r.json()).source).toBe("live");
    expect(String(f.mock.calls[0]?.[0])).toBe(
      "https://osdr.nasa.gov/osdr/data/search?term=Veggie+lettuce&type=cgene&size=3",
    );
    expect(r.headers.get("Cache-Control")).toMatch(/s-maxage=86400/);
  });
});

describe("/api/status", () => {
  it("reports which upstreams answered", async () => {
    const f = vi.fn(async (u: string | URL | Request) =>
      String(u).includes("osdr") ? ok({}, 500) : ok([]),
    );
    const r = await handleStatus(req("/api/status"), {
      fetchImpl: f as typeof fetch,
      now,
    });
    const body = await r.json();
    expect(
      body.upstreams.find((u: { name: string }) => u.name === "donki"),
    ).toMatchObject({ ok: true });
    expect(
      body.upstreams.find((u: { name: string }) => u.name === "osdr"),
    ).toMatchObject({ ok: false, status: 500 });
    expect(JSON.stringify(body)).not.toContain("api_key");
  });
});

describe("DONKI: CCMC first (no key), then the api.nasa.gov gateway", () => {
  it("answers from CCMC when it works and never sends the key there", async () => {
    vi.stubEnv("NASA_API_KEY", "secret-test-key");
    const f = vi.fn(async () => ok([]));
    const r = await handleDonki(req("/api/donki/CME?startDate=2026-11-01&endDate=2026-11-14"), { fetchImpl: f, now });
    expect(String(f.mock.calls[0]?.[0])).toBe("https://kauai.ccmc.gsfc.nasa.gov/DONKI/WS/get/CME?startDate=2026-11-01&endDate=2026-11-14");
    expect((await r.json()).upstream).toMatch(/^https:\/\/kauai/);
  });

  it("falls back to the gateway when CCMC is unreachable", async () => {
    const f = vi.fn(async (u: string | URL | Request) => {
      if (String(u).includes("kauai")) throw new TypeError("fetch failed");
      return ok([{ activityID: "G" }]);
    });
    const r = await handleDonki(req("/api/donki/GST"), { fetchImpl: f as typeof fetch, now });
    expect(r.status).toBe(200);
    expect((await r.json()).upstream).toMatch(/^https:\/\/api\.nasa\.gov/);
  });

  it("marks the last good copy stale", async () => {
    const f = vi.fn().mockResolvedValueOnce(ok([{ a: 1 }])).mockResolvedValue(ok({}, 500));
    await handleDonki(req("/api/donki/SEP"), { fetchImpl: f, now });
    expect(await (await handleDonki(req("/api/donki/SEP"), { fetchImpl: f, now })).json()).toMatchObject({ source: "cached", stale: true });
  });
});

describe("/api/dsn/mars", () => {
  const xml = `<dsn><station name="gdscc" friendlyName="Goldstone" timeUTC="1"/>
    <dish name="DSS24"><target name="M20" id="168" rtlt="1320"/></dish>
    <dish name="DSS26"><target name="SOHO" id="21" rtlt="8.34"/></dish>
    <station name="mdscc" friendlyName="Madrid" timeUTC="1"/>
    <dish name="DSS55"><target name="MRO" id="74" rtlt="-1"/></dish></dsn>`;
  it("gives the real round-trip light time for Mars spacecraft only", async () => {
    const r = await handleDsnMars(req("/api/dsn/mars"), { fetchImpl: async () => new Response(xml), now });
    const body = await r.json();
    expect(body.source).toBe("live");
    expect(body.data).toEqual([{ spacecraft: "M20", rtltSeconds: 1320, dish: "DSS24", station: "Goldstone" }]);
    expect(r.headers.get("Cache-Control")).toMatch(/s-maxage=60/);
  });
  it("refuses a page that is not DSN Now", async () => {
    const r = await handleDsnMars(req("/api/dsn/mars"), { fetchImpl: async () => new Response("<html>"), now });
    expect(r.status).toBe(502);
  });
});
