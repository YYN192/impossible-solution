/**
 * Demo-proof JSON fetching. Every remote call goes through getJson:
 *   1. fresh cache (localStorage, TTL)      → instant
 *   2. network with timeout + retry/backoff → validated with zod
 *   3. stale cache                          → "last known good"
 *   4. bundled snapshot                     → the game never breaks
 * With proxyUrl, step 2 asks our own backend (/api/*, envelope {source, fetchedAt, upstream, data}) first,
 * and NASA directly only when there is no backend (static hosting) — not when the backend says NASA is down.
 * Adapted from the team's prep notes (api-resilience patterns, Apache-2.0).
 */
import { z, type ZodType } from "zod";

export type DataSource = "network" | "cache" | "stale-cache" | "snapshot";

export interface Result<T> {
  data: T;
  source: DataSource;
  /** ms since epoch; for snapshots: the snapshot's own fetch date */
  fetchedAt: number;
}

export interface GetJsonOptions<T> {
  url: string;
  schema: ZodType<T>;
  cacheKey?: string;
  ttlMs?: number;
  timeoutMs?: number;
  retries?: number;
  /** Returned when network and cache both fail. */
  snapshot?: { data: T; fetchedAt: number };
  /** Our backend for the same data (answers an envelope). Tried before `url`. */
  proxyUrl?: string;
  /** After a failed refresh, skip the network for this long (saved data at once). */
  failTtlMs?: number;
  /** Skip the network entirely (?offline=1). */
  offline?: boolean;
  fetchImpl?: typeof fetch;
}

export class HttpError extends Error {
  readonly status: number;
  readonly retryAfterMs?: number;
  constructor(status: number, message: string, retryAfterMs?: number) {
    super(message);
    this.status = status;
    this.retryAfterMs = retryAfterMs;
  }
}

const CACHE_PREFIX = "sol:cache:";
const FAIL_PREFIX = "sol:fail:";

interface CacheEntry<T> {
  t: number;
  v: T;
}

function readCache<T>(key: string): CacheEntry<T> | undefined {
  try {
    const raw = globalThis.localStorage?.getItem(CACHE_PREFIX + key);
    return raw ? (JSON.parse(raw) as CacheEntry<T>) : undefined;
  } catch {
    return undefined;
  }
}

function writeCache<T>(key: string, v: T): void {
  try {
    globalThis.localStorage?.setItem(CACHE_PREFIX + key, JSON.stringify({ t: Date.now(), v }));
  } catch {
    /* storage is a convenience, never a requirement */
  }
}

export function stripKey(url: string): string {
  return url.replace(/([?&])api_key=[^&]*&?/, "$1").replace(/[?&]$/, "");
}

function parseRetryAfter(header: string | null): number | undefined {
  if (!header) return undefined;
  const secs = Number(header);
  if (Number.isFinite(secs)) return secs * 1000;
  const date = Date.parse(header);
  return Number.isNaN(date) ? undefined : Math.max(0, date - Date.now());
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const Envelope = z.object({
  source: z.enum(["live", "cached"]),
  fetchedAt: z.string(),
  upstream: z.string(),
  data: z.unknown(),
});

async function fetchOnce(url: string, timeoutMs: number, fetchImpl: typeof fetch): Promise<unknown> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(new Error(`timeout after ${timeoutMs}ms`)), timeoutMs);
  try {
    const res = await fetchImpl(url, { signal: ctrl.signal, headers: { Accept: "application/json" } });
    if (!res.ok) {
      throw new HttpError(res.status, `${res.status} for ${stripKey(url)}`, parseRetryAfter(res.headers.get("Retry-After")));
    }
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

function isRetryable(err: unknown): boolean {
  if (err instanceof HttpError) return err.status === 429 || err.status >= 500;
  return true; // network error / timeout
}

const inFlight = new Map<string, Promise<Result<unknown>>>();

/** One request per cache key at a time: React StrictMode double effects must not burn the rate limit. */
export function getJson<T>(opts: GetJsonOptions<T>): Promise<Result<T>> {
  const key = opts.cacheKey ?? stripKey(opts.url);
  const running = inFlight.get(key);
  if (running) return running as Promise<Result<T>>;
  const p = getJsonOnce(opts).finally(() => inFlight.delete(key));
  inFlight.set(key, p);
  return p;
}

async function getJsonOnce<T>(opts: GetJsonOptions<T>): Promise<Result<T>> {
  const {
    url,
    schema,
    cacheKey = stripKey(url),
    ttlMs = 6 * 60 * 60_000,
    timeoutMs = 8_000,
    retries = 2,
    snapshot,
    offline = false,
    proxyUrl,
    failTtlMs = 0,
    fetchImpl = globalThis.fetch?.bind(globalThis),
  } = opts;

  const fallback = (cached: CacheEntry<T> | undefined, err?: unknown): Result<T> => {
    if (cached) return { data: cached.v, source: "stale-cache", fetchedAt: cached.t };
    if (snapshot) return { data: snapshot.data, source: "snapshot", fetchedAt: snapshot.fetchedAt };
    throw err ?? new Error(`No data for ${cacheKey}`);
  };

  if (offline) {
    if (snapshot) return { data: snapshot.data, source: "snapshot", fetchedAt: snapshot.fetchedAt };
    throw new Error(`Offline and no snapshot for ${cacheKey}`);
  }

  const cached = readCache<T>(cacheKey);
  if (cached && Date.now() - cached.t < ttlMs) {
    return { data: cached.v, source: "cache", fetchedAt: cached.t };
  }

  const failedAt = Number(globalThis.localStorage?.getItem(FAIL_PREFIX + cacheKey) ?? 0);
  if (failTtlMs && Date.now() - failedAt < failTtlMs) return fallback(cached);

  let lastErr: unknown;
  let tryDirect = true;
  if (proxyUrl) {
    try {
      const env = Envelope.parse(await fetchOnce(proxyUrl, timeoutMs, fetchImpl));
      const data = schema.parse(env.data);
      const fetchedAt = Date.parse(env.fetchedAt) || Date.now();
      if (env.source === "cached") return { data, source: "stale-cache", fetchedAt };
      writeCache(cacheKey, data);
      return { data, source: "network", fetchedAt };
    } catch (err) {
      lastErr = err;
      // Backend answered "NASA is down / rate-limited": asking NASA ourselves would only fail the same way.
      tryDirect = !(err instanceof HttpError && [429, 502, 503, 504].includes(err.status));
    }
  }
  for (let attempt = 0; tryDirect && attempt <= retries; attempt++) {
    try {
      const data = schema.parse(await fetchOnce(url, timeoutMs, fetchImpl));
      writeCache(cacheKey, data);
      return { data, source: "network", fetchedAt: Date.now() };
    } catch (err) {
      lastErr = err;
      if (!isRetryable(err) || attempt === retries) break;
      const base = err instanceof HttpError && err.retryAfterMs !== undefined ? err.retryAfterMs : 400 * 2 ** attempt;
      await sleep(Math.min(base, 5_000));
    }
  }
  try {
    if (failTtlMs) globalThis.localStorage?.setItem(FAIL_PREFIX + cacheKey, String(Date.now()));
  } catch {
    /* storage is a convenience */
  }
  if (import.meta.env?.DEV) console.warn("[data] falling back for", cacheKey, lastErr);
  return fallback(cached, lastErr);
}

/** Is this result real-time data (badge LIVE) or saved data (badge SNAPSHOT)? Never call a snapshot live. */
export const isLive = (s: DataSource) => s === "network" || s === "cache";

/** Badge text: LIVE only for an answer fetched just now; CACHED for a kept real answer; SAVED for bundled snapshots. */
export const badgeKind = (s: DataSource): "live" | "cached" | "saved" =>
  s === "network" ? "live" : s === "snapshot" ? "saved" : "cached";
