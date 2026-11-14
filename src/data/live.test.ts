/**
 * Live layer on top of the saved data (api-resilience: snapshot first, refresh in background).
 * Only APIs a browser may call (CORS checked 14 Nov 2026): DONKI via api.nasa.gov, APOD at science.nasa.gov.
 */
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { liveApod, liveSpaceWeather } from "./live";

const server = setupServer();
let calls = 0;
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  calls = 0;
  localStorage.clear();
});
afterAll(() => server.close());

const now = new Date("2026-11-14T12:00:00Z");
const donki = (type: string, body: unknown[] | string) =>
  http.get(`https://api.nasa.gov/DONKI/${type}`, ({ request }) => {
    calls++;
    expect(new URL(request.url).searchParams.get("api_key")).toBe("DEMO_KEY");
    return HttpResponse.json(body);
  });
const quietSun = [
  donki("FLR", [{ classType: "X1.1", peakTime: "2026-11-10T00:00Z", link: "https://x/f" }]),
  donki("SEP", ""), // DONKI answers "" when nothing happened
  donki("CME", []),
  donki("GST", []),
  donki("notifications", []),
];

describe("liveSpaceWeather (DONKI, last 30 days)", () => {
  it("is LIVE when DONKI answers, with the same shape as the saved file", async () => {
    server.use(...quietSun);
    const r = await liveSpaceWeather({ now });
    expect(r.source).toBe("network");
    expect(r.data.counts).toMatchObject({ flares: 1, bigFlares: 1, particleEvents: 0 });
    expect(r.data.window).toEqual({ start: "2026-10-15", end: "2026-11-14" });
    expect(calls).toBe(5);
  });

  it("asks DONKI only once per 6 hours (cache), to save the shared DEMO_KEY", async () => {
    server.use(...quietSun);
    await liveSpaceWeather({ now });
    const r = await liveSpaceWeather({ now });
    expect(r.source).toBe("cache");
    expect(calls).toBe(5);
  });

  it("falls back to saved data on 429 (rate limit) and says so", async () => {
    server.use(http.get("https://api.nasa.gov/DONKI/*", () => new HttpResponse(null, { status: 429, headers: { "Retry-After": "0" } })));
    const r = await liveSpaceWeather({ now, retries: 0 }).catch((e) => e);
    // Without a saved file the caller gets an error and hides the card; with one, source is "snapshot".
    if (r instanceof Error) expect(r.message).toMatch(/429|No data|snapshot|missing/i);
    else expect(r.source).toBe("snapshot");
  });

  it("never touches the network with ?offline=1", async () => {
    const r = await liveSpaceWeather({ now, offline: true }).catch((e) => e);
    expect(calls).toBe(0);
    if (!(r instanceof Error)) expect(r.source).toBe("snapshot");
  });
});

describe("liveApod (science.nasa.gov)", () => {
  const url = "https://science.nasa.gov/wp-json/wp/v2/apod-basic";
  it("returns the newest entry as a link with a plain-text credit", async () => {
    server.use(
      http.get(url, () =>
        HttpResponse.json([
          { date: "2026-11-13", title: "Old", permalink: "https://science.nasa.gov/a", media_type: "image", credit: "A", copyright: "", alt: "" },
          { date: "2026-11-14", title: "New &amp; shiny", permalink: "https://science.nasa.gov/b", media_type: "image", credit: '<a href="x">Jo</a>', copyright: '<a href="x">Jo</a>', alt: "" },
        ]),
      ),
    );
    const r = await liveApod();
    expect(r.source).toBe("network");
    expect(r.data).toMatchObject({ date: "2026-11-14", title: "New & shiny", credit: "Jo", copyrighted: true });
  });

  it("uses the saved list when the site is down", async () => {
    server.use(http.get(url, () => HttpResponse.error()));
    const r = await liveApod({ retries: 0 });
    expect(r.source).toBe("snapshot");
    expect(r.data.page).toMatch(/^https:\/\//);
  });
});

describe("liveSpaceWeather when one DONKI part is down", () => {
  it("is still LIVE for the parts that answered, and marks the missing one", async () => {
    server.use(
      http.get("https://api.nasa.gov/DONKI/FLR", () => HttpResponse.json({ status: 404, error: "Not Found" }, { status: 404 })),
      donki("SEP", []),
      donki("CME", [{ activityID: "C1", startTime: "2026-11-01T00:00Z" }]),
      donki("GST", []),
      donki("notifications", []),
    );
    const r = await liveSpaceWeather({ now, retries: 0 });
    expect(r.source).toBe("network");
    expect(r.data.counts.flares).toBeNull();
    expect(r.data.counts.cmes).toBe(1);
    expect(r.data.missing).toEqual(["flr"]);
  });
});

describe("liveSpaceWeather does not hammer a rate-limited DONKI", () => {
  it("asks each part once by default when DONKI says 429 (the saved data is already on screen)", async () => {
    server.use(http.get("https://api.nasa.gov/DONKI/*", () => (calls++, new HttpResponse(null, { status: 429, headers: { "Retry-After": "0" } }))));
    await liveSpaceWeather({ now }).catch(() => undefined);
    expect(calls).toBe(5);
  });
});
