/**
 * NASA DONKI (Space Weather Database Of Notifications, Knowledge, Information).
 * We only ever use WSA-Enlil runs whose impact list names MARS. DONKI watches the Sun
 * from near Earth; most eruptions never reach Mars, so we never turn a CME into a Mars dose.
 */
import { z } from "zod";
import { getJson, type Result } from "./http";
import cmeMay2024Snap from "./snapshots/cme-2024-05-20.json";
import recentSnap from "./snapshots/enlil-mars-recent.json";
import may2024Snap from "./snapshots/enlil-mars-2024-05.json";

/** DEMO_KEY is NASA's public shared key (30 requests/hour per player IP). Not a secret; results are cached 6 h. */
export const DONKI = "https://api.nasa.gov/DONKI";
const PUBLIC_KEY = "DEMO_KEY";
/** Our backend (Vercel /api, holds the real key). Build-time, not secret. Empty on static hosting (GitHub Pages). */
const API_BASE = String(import.meta.env.VITE_API_BASE ?? "").replace(/\/$/, "");
export const ymd = (d: Date) => d.toISOString().slice(0, 10);
/** A failed refresh is not retried for an hour: saved data shows at once (Data Sources, Today's Sun). */
export const FAIL_TTL_MS = 60 * 60_000;

/** Where to ask for one DONKI list: our backend first (if any), NASA directly with DEMO_KEY as fallback. */
export function donkiUrls(type: string, start: string, end: string, extra = "") {
  const q = `startDate=${start}&endDate=${end}${extra}`;
  return {
    url: `${DONKI}/${type}?${q}&api_key=${PUBLIC_KEY}`,
    proxyUrl: API_BASE ? `${API_BASE}/donki/${type}?${q}` : undefined,
  };
}

const Impact = z.object({
  location: z.string(),
  arrivalTime: z.string().nullable(),
  isGlancingBlow: z.boolean().nullable().optional(),
});

/** Raw API shape (lenient) → our trimmed shape, same as the snapshot files. */
const RawSim = z
  .object({
    simulationID: z.string(),
    modelCompletionTime: z.string().nullable().optional(),
    link: z.string().optional(),
    cmeInputs: z
      .array(
        z
          .object({
            cmeStartTime: z.string().nullable().optional(),
            CMEID: z.string().nullable().optional(),
            speed: z.number().nullable().optional(),
          })
          .loose(),
      )
      .nullable()
      .optional(),
    impactList: z.array(Impact.loose()).nullable().optional(),
  })
  .loose();

export const Sim = z.object({
  simulationID: z.string(),
  modelCompletionTime: z.string().nullable().optional(),
  link: z.string().optional(),
  cmeIDs: z.array(z.string().nullable()),
  /** DONKI activity ID and launch speed (km/s) of the run's first CME input. */
  cmeId: z.string().nullable().optional(),
  speed: z.number().nullable().optional(),
  impactList: z.array(Impact),
});
export type Sim = z.infer<typeof Sim>;

const trim = (s: z.infer<typeof RawSim>): Sim => ({
  simulationID: s.simulationID,
  modelCompletionTime: s.modelCompletionTime,
  link: s.link,
  cmeIDs: (s.cmeInputs ?? []).map((c) => c.cmeStartTime ?? null),
  // shortcut: a run with several CMEs shows only the first one's ID and speed; list all if kids ask.
  cmeId: s.cmeInputs?.[0]?.CMEID ?? null,
  speed: s.cmeInputs?.[0]?.speed ?? null,
  impactList: (s.impactList ?? []).map((i) => ({
    location: i.location,
    arrivalTime: i.arrivalTime,
    isGlancingBlow: i.isGlancingBlow,
  })),
});

const SimList = z
  .preprocess((v) => (Array.isArray(v) ? v : []), z.array(RawSim))
  .transform((l) => l.map(trim));

export interface MarsHit {
  simulationID: string;
  /** ISO time the storm cloud is forecast to reach Mars */
  arrival: string;
  link?: string;
  /** DONKI activity ID of the CME, e.g. 2026-11-09T18:15:00-CME-001 */
  cmeId?: string;
  /** CME speed leaving the Sun, km/s (WSA-Enlil input) — not a speed at Mars, not a dose. */
  speed?: number;
}

/** Only forecasts that name Mars, newest arrival first, one per arrival time. */
export function marsHits(sims: Sim[]): MarsHit[] {
  const seen = new Set<string>();
  const hits: MarsHit[] = [];
  for (const s of sims) {
    for (const i of s.impactList) {
      if (i.location !== "Mars" || !i.arrivalTime || seen.has(i.arrivalTime))
        continue;
      seen.add(i.arrivalTime);
      hits.push({
        simulationID: s.simulationID,
        arrival: i.arrivalTime,
        link: s.link,
        ...(s.cmeId ? { cmeId: s.cmeId } : {}),
        ...(s.speed ? { speed: s.speed } : {}),
      });
    }
  }
  return hits.sort((a, b) => b.arrival.localeCompare(a.arrival));
}

/** Live "Today's Sun": Mars-bound storm clouds in the last 30 days. Falls back to the bundled snapshot. */
export async function getRecentMarsForecasts(
  opts: { offline?: boolean; now?: Date; fetchImpl?: typeof fetch } = {},
): Promise<Result<MarsHit[]>> {
  const now = opts.now ?? new Date();
  const start = new Date(now.getTime() - 30 * 864e5);
  const r = await getJson({
    ...donkiUrls("WSAEnlilSimulations", ymd(start), ymd(now)),
    cacheKey: "donki:enlil:recent",
    // Kids are waiting on "Preparing your mission…": one quick try, then saved data.
    retries: 0,
    timeoutMs: 4_000,
    failTtlMs: FAIL_TTL_MS,
    schema: SimList,
    offline: opts.offline,
    fetchImpl: opts.fetchImpl,
    snapshot: {
      data: recentSnap.data as Sim[],
      fetchedAt: Date.parse(recentSnap.fetchedAt),
    },
  });
  return { ...r, data: marsHits(r.data) };
}

/** The May 2024 forecast used by the main mission (always the snapshot: history doesn't change). */
export const may2024MarsHits: MarsHit[] = marsHits(may2024Snap.data as Sim[]);
export const SNAPSHOT_DATES = {
  cmeMay2024: cmeMay2024Snap.fetchedAt,
  may2024: may2024Snap.fetchedAt,
  recent: recentSnap.fetchedAt,
};
