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

const memory = new Map<string, { fetchedAt: string; data: unknown }>();
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

async function fetchJson(url: string, deps: Deps): Promise<unknown> {
  const f = deps.fetchImpl ?? fetch;
  for (let attempt = 0; ; attempt++) {
    let res: Response;
    try {
      res = await f(url, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(deps.timeoutMs ?? 8000),
      });
    } catch {
      throw new Upstream(504, "NASA did not answer in time (timeout)");
    }
    if (res.ok)
      return res.json().catch(() => {
        throw new Upstream(
          502,
          "NASA answered with something that is not JSON",
        );
      });
    if (attempt === 0 && (res.status === 429 || res.status >= 500)) {
      const secs = Number(res.headers.get("Retry-After"));
      await sleep(Number.isFinite(secs) ? Math.min(secs * 1000, 2000) : 500);
      continue;
    }
    throw new Upstream(502, `NASA answered ${res.status}`);
  }
}

/** upstream = public URL (in the envelope); key = query added server-side only. */
async function proxy(
  req: Request,
  upstream: string,
  schema: ZodType,
  maxAge: number,
  deps: Deps,
  key?: string,
) {
  try {
    const sep = upstream.includes("?") ? "&" : "?";
    const raw = await fetchJson(
      key ? `${upstream}${sep}api_key=${encodeURIComponent(key)}` : upstream,
      deps,
    );
    const parsed = schema.safeParse(raw);
    if (!parsed.success)
      throw new Upstream(502, "NASA's answer had an unexpected shape");
    const entry = {
      fetchedAt: (deps.now?.() ?? new Date()).toISOString(),
      data: parsed.data,
    };
    memory.set(upstream, entry);
    return json(req, 200, { source: "live", ...entry, upstream }, maxAge);
  } catch (e) {
    const err =
      e instanceof Upstream ? e : new Upstream(502, "Unexpected error");
    const last = memory.get(upstream);
    // shortcut: per-instance memory only; a cold instance has nothing to fall back on (the client still has its snapshot).
    if (last)
      return json(req, 200, { source: "cached", ...last, upstream }, 60);
    return json(req, err.status, { error: err.message, upstream }, 60);
  }
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
  let upstream = `https://api.nasa.gov/DONKI/${type}?startDate=${start}&endDate=${end}`;
  if (type === "notifications") {
    const t = url.searchParams.get("type") ?? "all";
    if (!NOTIFICATION_TYPES.has(t))
      return bad(req, "Unknown notification type");
    upstream += `&type=${t}`;
  }
  return proxy(
    req,
    upstream,
    DonkiList,
    HOUR,
    deps,
    process.env.NASA_API_KEY || "DEMO_KEY",
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
  return proxy(req, upstream, OsdrSearch, DAY, deps);
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
