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
  weatherWeek,
} from "../../scripts/ingest/normalize.mjs";
import { dataClient } from "./client";
import { donkiUrls, FAIL_TTL_MS, ymd } from "./donki";
import { ApodEntry, SpaceWeather, WeatherWeek } from "./datasets";
import { getJson, type Result } from "./http";


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

/**
 * One DONKI list for the last 30 days. Today's Sun and the radar strip ask with the same URL and cache key,
 * so whichever opens second costs no extra call on the shared DEMO_KEY.
 */
function donkiMonth(path: string, now: Date, opts: LiveOpts, extra = "") {
  const start = ymd(new Date(now.getTime() - 30 * 864e5));
  return getJson({
    ...donkiUrls(path, start, ymd(now), extra),
    failTtlMs: FAIL_TTL_MS,
    cacheKey: `donki:${path}:${start}`,
    schema: LenientList,
    offline: opts.offline,
    // One try per part: on 429 the saved card is already showing, retries would only burn the shared DEMO_KEY.
    retries: opts.retries ?? 0,
    fetchImpl: opts.fetchImpl,
  });
}

/** DONKI, last 30 days → same summary as src/data/snapshots/space-weather-recent.json. */
export async function liveSpaceWeather(
  opts: LiveOpts = {},
): Promise<Result<SpaceWeather>> {
  const now = opts.now ?? new Date();
  const start = ymd(new Date(now.getTime() - 30 * 864e5));
  const end = ymd(now);
  const snapshot = await snapshotOf(dataClient.getSpaceWeather());
  const one = (path: string, extra = "") => donkiMonth(path, now, opts, extra);
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

/**
 * The radar's strip (#60): DONKI's last 7 days, one row per event type. Uses the 30-day answers Today's Sun
 * already asked for (same cache) and keeps the last week. A broken part shows as "no answer";
 * offline, or with no CMEs from DONKI, it is the saved snapshot.
 */
export async function liveWeatherWeek(
  opts: LiveOpts = {},
): Promise<Result<WeatherWeek>> {
  const now = opts.now ?? new Date();
  const window = { start: ymd(new Date(now.getTime() - 7 * 864e5)), end: ymd(now) };
  const snapshot = await snapshotOf(dataClient.getWeatherWeek());
  try {
    if (opts.offline) throw new Error("offline");
    const keys = ["flr", "sep", "cme", "gst"] as const;
    const settled = await Promise.allSettled(keys.map((k) => donkiMonth(k.toUpperCase(), now, opts)));
    const ok = settled.flatMap((s, i) => (s.status === "fulfilled" ? [{ key: keys[i], r: s.value }] : []));
    const missing = keys.filter((k) => !ok.some((o) => o.key === k));
    if (missing.includes("cme") || missing.length > 2) throw new Error(`DONKI: missing ${missing.join(", ")}`);
    const parts = ok.map((o) => o.r);
    if (parts.some((p) => p.source === "stale-cache")) throw new Error("DONKI: some answers were old");
    const raw = Object.fromEntries(ok.map((o) => [o.key, o.r.data]));
    return {
      data: WeatherWeek.parse(weatherWeek(raw, window, { missing })),
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
    failTtlMs: FAIL_TTL_MS,
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
