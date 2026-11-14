import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { z } from "zod";
import { getJson, stripKey } from "./http";

const Thing = z.array(z.object({ id: z.string() }));
const URL_ = "https://api.test/things";
let calls = 0;
const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  calls = 0;
  localStorage.clear();
});
afterAll(() => server.close());

const snapshot = { data: [{ id: "saved" }], fetchedAt: Date.parse("2026-11-14T09:00:00Z") };

describe("getJson", () => {
  it("returns live data from the network", async () => {
    server.use(http.get(URL_, () => HttpResponse.json([{ id: "a" }])));
    const r = await getJson({ url: URL_, schema: Thing });
    expect(r).toMatchObject({ source: "network", data: [{ id: "a" }] });
  });

  it("serves a second call from cache", async () => {
    server.use(http.get(URL_, () => (calls++, HttpResponse.json([{ id: "a" }]))));
    await getJson({ url: URL_, schema: Thing });
    const r = await getJson({ url: URL_, schema: Thing });
    expect(r.source).toBe("cache");
    expect(calls).toBe(1);
  });

  it("retries a 429 then succeeds", async () => {
    server.use(http.get(URL_, () => (++calls === 1 ? new HttpResponse(null, { status: 429, headers: { "Retry-After": "0" } }) : HttpResponse.json([{ id: "a" }]))));
    const r = await getJson({ url: URL_, schema: Thing });
    expect(r.source).toBe("network");
    expect(calls).toBe(2);
  });

  it("falls back to the snapshot when the network is down", async () => {
    server.use(http.get(URL_, () => HttpResponse.error()));
    const r = await getJson({ url: URL_, schema: Thing, retries: 0, snapshot });
    expect(r).toMatchObject({ source: "snapshot", data: [{ id: "saved" }], fetchedAt: snapshot.fetchedAt });
  });

  it("falls back to the snapshot when the data has the wrong shape", async () => {
    server.use(http.get(URL_, () => HttpResponse.json({ error: "nope" })));
    const r = await getJson({ url: URL_, schema: Thing, retries: 0, snapshot });
    expect(r.source).toBe("snapshot");
  });

  it("does not retry a 404", async () => {
    server.use(http.get(URL_, () => (calls++, new HttpResponse(null, { status: 404 }))));
    const r = await getJson({ url: URL_, schema: Thing, snapshot });
    expect(r.source).toBe("snapshot");
    expect(calls).toBe(1);
  });

  it("never touches the network when offline", async () => {
    server.use(http.get(URL_, () => (calls++, HttpResponse.json([{ id: "a" }]))));
    const r = await getJson({ url: URL_, schema: Thing, offline: true, snapshot });
    expect(r.source).toBe("snapshot");
    expect(calls).toBe(0);
  });

  it("strips the api key from cache keys and messages", () => {
    expect(stripKey("https://x/y?a=1&api_key=SECRET&b=2")).toBe("https://x/y?a=1&b=2");
    expect(stripKey("https://x/y?api_key=SECRET")).toBe("https://x/y");
  });
});

describe("getJson fallbacks (gap tests)", () => {
  it("uses the stale cache before the snapshot when the network fails", async () => {
    localStorage.setItem("sol:cache:" + URL_, JSON.stringify({ t: 1, v: [{ id: "old" }] }));
    server.use(http.get(URL_, () => HttpResponse.error()));
    const r = await getJson({ url: URL_, schema: Thing, retries: 0, snapshot });
    expect(r).toMatchObject({ source: "stale-cache", data: [{ id: "old" }], fetchedAt: 1 });
  });

  it("gives up on a hanging server after the timeout and uses the snapshot", async () => {
    server.use(http.get(URL_, async () => { await new Promise((r) => setTimeout(r, 500)); return HttpResponse.json([{ id: "late" }]); }));
    const r = await getJson({ url: URL_, schema: Thing, retries: 0, timeoutMs: 50, snapshot });
    expect(r.source).toBe("snapshot");
  });
});

describe("getJson in-flight dedupe", () => {
  it("two calls at the same time share one request (StrictMode double effects)", async () => {
    server.use(http.get(URL_, () => (calls++, HttpResponse.json([{ id: "a" }]))));
    const [a, b] = await Promise.all([getJson({ url: URL_, schema: Thing }), getJson({ url: URL_, schema: Thing })]);
    expect(calls).toBe(1);
    expect(a.data).toEqual(b.data);
  });
});
