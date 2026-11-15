/**
 * Today's real radio delay to Mars, from NASA's Deep Space Network (through our /api/dsn/mars).
 * Live when the backend answers and a Mars spacecraft is being tracked; otherwise the saved
 * reading of 14 Nov 2026, labelled as saved. The Moon's delay is a constant.
 */
import { z } from "zod";
import type { DataRef } from "../sim/types";
import { MOON_DELAY } from "./campaigns";
import { getJson, isLive, type DataSource } from "./http";
import snap from "./snapshots/dsn-mars.json";

export const DsnLinks = z.array(
  z.object({ spacecraft: z.string(), rtltSeconds: z.number().positive(), dish: z.string().optional(), station: z.string().optional() }),
);

export interface LightDelay {
  /** One way, in seconds. */
  seconds: number;
  /** Deep Space Network code of the spacecraft whose link was read (M20 = Perseverance). */
  craft?: string;
  ref: DataRef;
  source: DataSource;
  fetchedAt: number;
}

const CRAFT: Record<string, string> = { M20: "Perseverance", MSL: "Curiosity", MRO: "Mars Reconnaissance Orbiter", MVN: "MAVEN", TGO: "Trace Gas Orbiter", EMM: "Hope" };
const DEFAULT_BASE = String(import.meta.env.VITE_API_BASE ?? "").replace(/\/$/, "");

export const MOON_DELAY_INFO: LightDelay = {
  seconds: 1.3,
  ref: MOON_DELAY,
  source: "snapshot",
  fetchedAt: Date.parse(MOON_DELAY.fetched!),
};

function toDelay(links: z.infer<typeof DsnLinks>, source: DataSource, fetchedAt: number): LightDelay {
  // Prefer a rover on the surface; any Mars link has the same light time to within a second.
  const link = links.find((l) => l.spacecraft === "M20") ?? links.find((l) => l.spacecraft === "MSL") ?? links[0];
  const seconds = link.rtltSeconds / 2;
  const when = new Date(fetchedAt).toISOString().slice(0, 16).replace("T", " ");
  return {
    seconds,
    craft: link.spacecraft,
    source,
    fetchedAt,
    ref: {
      value: `${Math.round(seconds / 60)} min each way`,
      label: `NASA's Deep Space Network, radio link to ${CRAFT[link.spacecraft] ?? link.spacecraft} at Mars, ${when} UTC`,
      url: "https://eyes.nasa.gov/dsn/dsn.html",
      mode: isLive(source) ? "live" : "snapshot",
      fetched: new Date(fetchedAt).toISOString(),
    },
  };
}

const SAVED = { data: snap.data, fetchedAt: Date.parse(snap.fetchedAt) };

export async function getMarsDelay(
  opts: { offline?: boolean; fetchImpl?: typeof fetch; apiBase?: string; cacheKey?: string } = {},
): Promise<LightDelay> {
  const base = opts.apiBase ?? DEFAULT_BASE;
  const saved = toDelay(SAVED.data, "snapshot", SAVED.fetchedAt);
  if (opts.offline || !base) return saved;
  try {
    const r = await getJson({
      url: `${base}/dsn/mars`,
      proxyUrl: `${base}/dsn/mars`,
      schema: DsnLinks,
      cacheKey: opts.cacheKey ?? "dsn:mars",
      ttlMs: 60_000,
      // Kids are waiting on "Preparing your mission…": one quick try, then the saved reading.
      retries: 0,
      timeoutMs: 4_000,
      failTtlMs: 10 * 60_000,
      fetchImpl: opts.fetchImpl,
      snapshot: SAVED,
    });
    return r.data.length ? toDelay(r.data, r.source, r.fetchedAt) : saved;
  } catch {
    return saved;
  }
}
