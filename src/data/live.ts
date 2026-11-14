/**
 * Live refresh for the saved datasets whose APIs a browser may call (CORS checked 14 Nov 2026):
 *   DONKI (api.nasa.gov, Access-Control-Allow-Origin: *) and APOD (science.nasa.gov reflects our origin).
 * OSDR and RadLab block browsers (CORS) and hold history anyway → saved only. Image Library and Mars Trek
 * allow browsers, but our pictures are fixed history → saved only (no requests wasted).
 *
 * Every call: timeout → retry/backoff (429/5xx) → 6 h cache → stale cache → saved snapshot.
 * The parsers are the same ones the ingest scripts use, so live and saved data have one shape.
 * DEMO_KEY is NASA's public shared key (not a secret): 30 requests/hour per player IP.
 */
import { z } from "zod";
import {
  apodEntry,
  summarizeSpaceWeather,
} from "../../scripts/ingest/normalize.mjs";
import { dataClient } from "./client";
import { ApodEntry, SpaceWeather } from "./datasets";
import { getJson, type Result } from "./http";

const DONKI = "https://api.nasa.gov/DONKI";
const KEY = "DEMO_KEY";
const ymd = (d: Date) => d.toISOString().slice(0, 10);

/** DONKI answers "" or null when nothing happened. */
const LenientList = z.preprocess(
  (v) => (Array.isArray(v) ? v : []),
  z.array(z.unknown()),
);

interface LiveOpts {
  offline?: boolean;
  now?: Date;
  retries?: number;
  fetchImpl?: typeof fetch;
}

async function snapshotOf<T>(
  p: Promise<{ data: T; fetchedAt: number } | null>,
) {
  const s = await p;
  return s ? { data: s.data, fetchedAt: s.fetchedAt } : undefined;
}

/** DONKI, last 30 days → same summary as src/data/snapshots/space-weather-recent.json. */
export async function liveSpaceWeather(
  opts: LiveOpts = {},
): Promise<Result<SpaceWeather>> {
  const now = opts.now ?? new Date();
  const start = ymd(new Date(now.getTime() - 30 * 864e5));
  const end = ymd(now);
  const snapshot = await snapshotOf(dataClient.getSpaceWeather());
  const one = (path: string, extra = "") =>
    getJson({
      url: `${DONKI}/${path}?startDate=${start}&endDate=${end}${extra}&api_key=${KEY}`,
      cacheKey: `donki:${path}:${start}`,
      schema: LenientList,
      offline: opts.offline,
      // One try per part: on 429 the saved card is already showing, retries would only burn the shared DEMO_KEY.
      retries: opts.retries ?? 0,
      fetchImpl: opts.fetchImpl,
    });
  try {
    if (opts.offline) throw new Error("offline");
    // Each part on its own: one broken endpoint (FLR answered 404 on 14 Nov 2026) must not sink the rest.
    const keys = ["flr", "sep", "cme", "gst", "notifications"] as const;
    const settled = await Promise.allSettled([
      one("FLR"),
      one("SEP"),
      one("CME"),
      one("GST"),
      one("notifications", "&type=all"),
    ]);
    const ok = settled.flatMap((s, i) =>
      s.status === "fulfilled" ? [{ key: keys[i], r: s.value }] : [],
    );
    const missing = keys.filter((k) => !ok.some((o) => o.key === k));
    if (missing.includes("cme") || missing.length > 2)
      throw new Error(`DONKI: missing ${missing.join(", ")}`);
    const raw = Object.fromEntries(
      ok.map((o) => [o.key, o.r.data]),
    ) as Parameters<typeof summarizeSpaceWeather>[0];
    const data = SpaceWeather.parse(
      summarizeSpaceWeather(raw, { start, end }, { missing }),
    );
    const parts = ok.map((o) => o.r);
    // getJson without a snapshot only ever answers network/cache/stale-cache; stale-cache is not live.
    if (parts.some((p) => p.source === "stale-cache"))
      throw new Error("DONKI: some answers were old");
    return {
      data,
      source: parts.some((p) => p.source === "network") ? "network" : "cache",
      fetchedAt: Math.min(...parts.map((p) => p.fetchedAt)),
    };
  } catch (e) {
    if (snapshot) return { ...snapshot, source: "snapshot" };
    throw e;
  }
}

const ApodList = z.array(z.unknown()).min(1);

/** Newest Astronomy Picture of the Day (link + credit only). */
export async function liveApod(
  opts: LiveOpts = {},
): Promise<Result<ApodEntry>> {
  const saved = await dataClient.load("apod-recent");
  const r = await getJson({
    url: "https://science.nasa.gov/wp-json/wp/v2/apod-basic?per_page=7",
    cacheKey: "apod:recent",
    schema: ApodList,
    offline: opts.offline,
    retries: opts.retries,
    fetchImpl: opts.fetchImpl,
    snapshot: saved
      ? { data: saved.data as unknown[], fetchedAt: saved.fetchedAt }
      : undefined,
  });
  const entries = z
    .array(ApodEntry)
    .parse(r.source === "snapshot" ? r.data : r.data.map(apodEntry));
  const newest = [...entries].sort((a, b) => b.date.localeCompare(a.date))[0];
  return { data: newest, source: r.source, fetchedAt: r.fetchedAt };
}
