// Network + file helpers for the ingestion pipeline (Node 20+, no extra dependencies).
// Rules: timeout on every request, limited retries with backoff, rate-limit headers logged,
// the API key never printed or written, and a failed source never overwrites good data.
import { mkdir, readFile, writeFile } from "node:fs/promises";

export const SNAPSHOT_DIR = new URL(
  "../../src/data/snapshots/",
  import.meta.url,
);
export const PUBLIC_DATA_DIR = new URL("../../public/data/", import.meta.url);

/** NASA_API_KEY from the environment (GitHub Actions secret or a local .env loaded by the shell). DEMO_KEY otherwise. */
export const NASA_KEY = process.env.NASA_API_KEY || "DEMO_KEY";

export const stripKey = (url) =>
  String(url)
    .replace(/([?&])api_key=[^&]*&?/, "$1")
    .replace(/[?&]$/, "");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function logRateLimit(res, url) {
  const left = res.headers.get("x-ratelimit-remaining");
  const limit = res.headers.get("x-ratelimit-limit");
  if (left !== null)
    console.log(
      `    rate limit: ${left}/${limit ?? "?"} left (${new URL(url).host})`,
    );
}

async function fetchOnce(url, { timeoutMs, accept }) {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(timeoutMs),
    headers: {
      Accept: accept,
      "User-Agent":
        "impossible-solution-ingest/1.0 (Space Apps 2026 student project)",
    },
  });
  logRateLimit(res, url);
  if (!res.ok) {
    const err = new Error(`HTTP ${res.status} for ${stripKey(url)}`);
    err.status = res.status;
    err.retryAfter = Number(res.headers.get("retry-after")) || undefined;
    throw err;
  }
  return res;
}

const retryable = (e) => !e.status || e.status === 429 || e.status >= 500;

async function withRetry(url, opts, read) {
  const { retries = 2, timeoutMs = 45_000, accept = "application/json" } = opts;
  let last;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await read(await fetchOnce(url, { timeoutMs, accept }));
    } catch (e) {
      last = e;
      if (!retryable(e) || attempt === retries) break;
      const wait = Math.min(
        e.retryAfter ? e.retryAfter * 1000 : 1000 * 2 ** attempt,
        10_000,
      );
      console.warn(
        `    retry ${attempt + 1}/${retries} in ${wait} ms (${e.cause?.code ?? e.message})`,
      );
      await sleep(wait);
    }
  }
  // Error messages never contain the key.
  throw new Error(stripKey(last?.message ?? "request failed"));
}

export const fetchJson = (url, opts = {}) =>
  withRetry(url, opts, (r) => r.json());
export const fetchBytes = (url, opts = {}) =>
  withRetry(url, { accept: "*/*", ...opts }, async (r) =>
    Buffer.from(await r.arrayBuffer()),
  );

/** Checks a page is reachable (for curated links). */
export const checkLink = (url, opts = {}) =>
  withRetry(
    url,
    { accept: "text/html", retries: 1, timeoutMs: 20_000, ...opts },
    (r) => r.status,
  );

export async function readSnapshot(name) {
  try {
    return JSON.parse(
      await readFile(new URL(`${name}.json`, SNAPSHOT_DIR), "utf8"),
    );
  } catch {
    return undefined;
  }
}

const isEmpty = (d) =>
  d == null ||
  (Array.isArray(d) && d.length === 0) ||
  (typeof d === "object" && Object.keys(d).length === 0);

/** Writes { fetchedAt, source, attribution, license, about, data }. Refuses empty data so a bad day keeps the last good file. */
export async function writeSnapshot(name, env) {
  if (isEmpty(env.data))
    throw new Error(
      "no records — refusing to overwrite the last good snapshot with nothing",
    );
  const out = {
    fetchedAt: new Date().toISOString(),
    source: stripKey(env.source),
    attribution: env.attribution,
    ...(env.license ? { license: env.license } : {}),
    about: env.about,
    data: env.data,
  };
  const text = JSON.stringify(out, null, 2) + "\n";
  if (text.includes(NASA_KEY) && NASA_KEY !== "DEMO_KEY")
    throw new Error("refusing to write a file that contains the API key");
  await mkdir(SNAPSHOT_DIR, { recursive: true });
  await writeFile(new URL(`${name}.json`, SNAPSHOT_DIR), text);
  return out;
}

/** Saves a binary file under public/data/ (served next to the app, so it works with ?offline=1). */
export async function writePublic(relPath, bytes) {
  const url = new URL(relPath, PUBLIC_DATA_DIR);
  await mkdir(new URL(".", url), { recursive: true });
  await writeFile(url, bytes);
}

export const ymd = (d) => d.toISOString().slice(0, 10);
export const daysAgo = (n, now = new Date()) =>
  new Date(now.getTime() - n * 864e5);
