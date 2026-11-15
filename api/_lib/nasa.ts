/**
 * Our small backend: an allowlisted NASA proxy (never an open relay).
 * Every answer: {source: "live" | "cached", fetchedAt, upstream, data}. The NASA key lives only in
 * process.env.NASA_API_KEY (Vercel settings); DEMO_KEY when unset. It never appears in a response.
 * Each call: timeout → one retry on 429/5xx (Retry-After) → zod check → CDN cache (s-maxage + SWR)
 * → last good answer in this warm instance ("cached") → JSON error (502 / 504).
 */
import { z, type ZodType } from "zod";

export interface Deps {
  fetchImpl?: typeof fetch;
  now?: () => Date;
  timeoutMs?: number;
}

const ORIGINS =
  /^(https:\/\/yyn192\.github\.io|https:\/\/impossible-solution[a-z0-9-]*\.vercel\.app|http:\/\/(localhost|127\.0\.0\.1):\d+)$/;
const DONKI_TYPES = new Set([
  "CME",
  "WSAEnlilSimulations",
  "GST",
  "FLR",
  "SEP",
  "notifications",
]);
const NOTIFICATION_TYPES = new Set([
  "all",
  "FLR",
  "SEP",
  "CME",
  "IPS",
  "MPC",
  "GST",
  "RBE",
  "report",
]);
const HOUR = 3600;
const DAY = 86400;

const DonkiList = z.preprocess(
  (v) => (v === "" || v === null ? [] : v),
  z.array(z.record(z.string(), z.unknown())),
);
const OsdrSearch = z
  .object({ hits: z.object({ hits: z.array(z.unknown()) }).loose() })
  .loose();

const memory = new Map<string, { fetchedAt: string; data: unknown; upstream: string }>();
/** Tests only. */
export const clearCache = () => memory.clear();

function cors(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin");
  return origin && ORIGINS.test(origin)
    ? {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        Vary: "Origin",
      }
    : { Vary: "Origin" };
}

function json(
  req: Request,
  status: number,
  body: unknown,
  maxAge: number,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": `public, max-age=0, s-maxage=${maxAge}, stale-while-revalidate=${maxAge * 24}`,
      "X-Content-Type-Options": "nosniff",
      ...cors(req),
    },
  });
}

export const preflight = (req: Request) =>
  new Response(null, { status: 204, headers: cors(req) });
const bad = (req: Request, error: string) => json(req, 400, { error }, DAY);

class Upstream extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface Source {
  /** Public URL, shown in the envelope (never contains the key). */
  url: string;
  key?: string;
  timeoutMs?: number;
  /** One retry on 429 / 5xx. */
  retry?: boolean;
}

async function fetchBody(src: Source, deps: Deps, asText: boolean): Promise<unknown> {
  const f = deps.fetchImpl ?? fetch;
  const sep = src.url.includes("?") ? "&" : "?";
  const url = src.key ? `${src.url}${sep}api_key=${encodeURIComponent(src.key)}` : src.url;
  for (let attempt = 0; ; attempt++) {
    let res: Response;
    try {
      res = await f(url, { signal: AbortSignal.timeout(deps.timeoutMs ?? src.timeoutMs ?? 8000) });
    } catch {
      throw new Upstream(504, "NASA did not answer in time (timeout)");
    }
    if (res.ok)
      return (asText ? res.text() : res.json()).catch(() => {
        throw new Upstream(502, "NASA answered with something we cannot read");
      });
    if (src.retry && attempt === 0 && (res.status === 429 || res.status >= 500)) {
      const secs = Number(res.headers.get("Retry-After"));
      await sleep(Number.isFinite(secs) ? Math.min(secs * 1000, 2000) : 500);
      continue;
    }
    throw new Upstream(502, `NASA answered ${res.status}`);
  }
}

/** Try each source in order; first valid answer wins. memoKey names the data, whichever source answered. */
async function proxy(req: Request, sources: Source[], schema: ZodType, maxAge: number, deps: Deps, asText = false) {
  const memoKey = sources[sources.length - 1].url;
  let err = new Upstream(502, "Unexpected error");
  for (const src of sources) {
    try {
      const parsed = schema.safeParse(await fetchBody(src, deps, asText));
      if (!parsed.success) throw new Upstream(502, "NASA's answer had an unexpected shape");
      const entry = { fetchedAt: (deps.now?.() ?? new Date()).toISOString(), data: parsed.data, upstream: src.url };
      memory.set(memoKey, entry);
      return json(req, 200, { source: "live", ...entry }, maxAge);
    } catch (e) {
      if (e instanceof Upstream) err = e;
    }
  }
  const last = memory.get(memoKey);
  // shortcut: per-instance memory only; a cold instance has nothing to fall back on (the client still has its snapshot).
  if (last) return json(req, 200, { source: "cached", stale: true, ...last }, 60);
  return json(req, err.status, { error: err.message, upstream: memoKey }, 60);
}

const ymd = (d: Date) => d.toISOString().slice(0, 10);
const isDate = (s: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(s) &&
  !Number.isNaN(Date.parse(`${s}T00:00:00Z`)) &&
  ymd(new Date(`${s}T00:00:00Z`)) === s;

export async function handleDonki(
  req: Request,
  deps: Deps = {},
): Promise<Response> {
  const url = new URL(req.url);
  const type = decodeURIComponent(
    url.pathname.split("/").filter(Boolean).pop() ?? "",
  );
  if (!DONKI_TYPES.has(type))
    return bad(
      req,
      `Unknown DONKI type. Allowed: ${[...DONKI_TYPES].join(", ")}`,
    );
  const today = deps.now?.() ?? new Date();
  const end = url.searchParams.get("endDate") ?? ymd(today);
  const start =
    url.searchParams.get("startDate") ??
    ymd(new Date(Date.parse(`${end}T00:00:00Z`) - 30 * DAY * 1000));
  if (!isDate(start) || !isDate(end))
    return bad(req, "startDate and endDate must be real dates as YYYY-MM-DD");
  const days = (Date.parse(end) - Date.parse(start)) / (DAY * 1000);
  if (days < 0) return bad(req, "startDate must be before endDate");
  if (days > 60) return bad(req, "The window can be at most 60 days");
  let query = `${type}?startDate=${start}&endDate=${end}`;
  if (type === "notifications") {
    // Vercel adds the route parameter itself as ?type=notifications: skip it.
    const t = url.searchParams.getAll("type").find((v) => v !== "notifications") ?? "all";
    if (!NOTIFICATION_TYPES.has(t))
      return bad(req, "Unknown notification type");
    query += `&type=${t}`;
  }
  // CCMC is DONKI's own server (no key, no rate limit) but can be unreachable; the gateway uses our key.
  return proxy(
    req,
    [
      { url: `https://kauai.ccmc.gsfc.nasa.gov/DONKI/WS/get/${query}`, timeoutMs: 3000 },
      { url: `https://api.nasa.gov/DONKI/${query}`, key: process.env.NASA_API_KEY || "DEMO_KEY", retry: true },
    ],
    DonkiList,
    HOUR,
    deps,
  );
}

export async function handleOsdrSearch(
  req: Request,
  deps: Deps = {},
): Promise<Response> {
  const q = new URL(req.url).searchParams;
  const term = (q.get("term") ?? "").trim();
  const size = Number(q.get("size") ?? "10");
  if (!/^[\p{L}\p{N} _.-]{1,64}$/u.test(term))
    return bad(req, "term: 1–64 letters, digits, spaces, . _ -");
  if (!Number.isInteger(size) || size < 1 || size > 25)
    return bad(req, "size: a whole number from 1 to 25");
  const upstream = `https://osdr.nasa.gov/osdr/data/search?${new URLSearchParams({ term, type: "cgene", size: String(size) })}`;
  return proxy(req, [{ url: upstream, retry: true }], OsdrSearch, DAY, deps);
}

/** Health: which upstreams answer right now (cheap calls, CDN-cached 5 min). */
export async function handleStatus(
  req: Request,
  deps: Deps = {},
): Promise<Response> {
  const today = ymd(deps.now?.() ?? new Date());
  const key = process.env.NASA_API_KEY || "DEMO_KEY";
  const checks = [
    {
      name: "donki",
      url: `https://api.nasa.gov/DONKI/notifications?startDate=${today}&endDate=${today}&type=all`,
      key,
    },
    {
      name: "osdr",
      url: "https://osdr.nasa.gov/osdr/data/search?term=Veggie&type=cgene&size=1",
    },
  ];
  const f = deps.fetchImpl ?? fetch;
  const upstreams = await Promise.all(
    checks.map(async (c) => {
      const t0 = Date.now();
      try {
        const res = await f(
          c.key ? `${c.url}&api_key=${encodeURIComponent(c.key)}` : c.url,
          { signal: AbortSignal.timeout(deps.timeoutMs ?? 5000) },
        );
        return {
          name: c.name,
          upstream: c.url,
          ok: res.ok,
          status: res.status,
          ms: Date.now() - t0,
        };
      } catch {
        return {
          name: c.name,
          upstream: c.url,
          ok: false,
          status: 504,
          ms: Date.now() - t0,
        };
      }
    }),
  );
  return json(
    req,
    200,
    {
      checkedAt: (deps.now?.() ?? new Date()).toISOString(),
      keyType: process.env.NASA_API_KEY ? "personal" : "DEMO_KEY",
      upstreams,
    },
    300,
  );
}

const MARS_CRAFT = new Set(["M20", "MSL", "MRO", "MVN", "TGO", "EMM", "ODY"]);
const attrs = (s: string) => Object.fromEntries([...s.matchAll(/(\w+)="([^"]*)"/g)].map((m) => [m[1], m[2]]));

/** DSN Now XML → Mars spacecraft being talked to right now, with the real round-trip light time. */
export function parseDsn(xml: string) {
  const out: { spacecraft: string; rtltSeconds: number; dish: string; station: string }[] = [];
  let station = "";
  let dish = "";
  for (const m of xml.matchAll(/<(station|dish|target)\b([^>]*)>/g)) {
    const a = attrs(m[2]);
    if (m[1] === "station") station = a.friendlyName ?? a.name ?? "";
    else if (m[1] === "dish") dish = a.name ?? "";
    else if (MARS_CRAFT.has(a.name) && Number(a.rtlt) > 0)
      out.push({ spacecraft: a.name, rtltSeconds: Number(a.rtlt), dish, station });
  }
  return out;
}

const DsnXml = z
  .string()
  .refine((s) => s.includes("<dsn"), "not DSN Now")
  .transform(parseDsn);

/** GET /api/dsn/mars: today's real message delay to Mars (CDN cache 60 s). */
export const handleDsnMars = (req: Request, deps: Deps = {}) =>
  proxy(req, [{ url: "https://eyes.nasa.gov/dsn/data/dsn.xml", timeoutMs: 5000 }], DsnXml, 60, deps, true);
