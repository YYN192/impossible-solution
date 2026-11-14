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
