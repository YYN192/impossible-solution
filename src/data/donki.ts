/**
 * NASA DONKI (Space Weather Database Of Notifications, Knowledge, Information).
 * We only ever use WSA-Enlil runs whose impact list names MARS. DONKI watches the Sun
 * from near Earth; most eruptions never reach Mars, so we never turn a CME into a Mars dose.
 */
import { z } from "zod";
import { getJson, type Result } from "./http";
import recentSnap from "./snapshots/enlil-mars-recent.json";
import may2024Snap from "./snapshots/enlil-mars-2024-05.json";

/** DEMO_KEY is NASA's public shared key (30 requests/hour per player IP). Not a secret; results are cached 6 h. */
const GATEWAY = "https://api.nasa.gov/DONKI";
const PUBLIC_KEY = "DEMO_KEY";

const Impact = z.object({
  location: z.string(),
  arrivalTime: z.string().nullable(),
  isGlancingBlow: z.boolean().nullable().optional(),
});

/** Raw API shape (lenient) → our trimmed shape, same as the snapshot files. */
const RawSim = z.object({
  simulationID: z.string(),
  modelCompletionTime: z.string().nullable().optional(),
  link: z.string().optional(),
  cmeInputs: z.array(z.object({ cmeStartTime: z.string().nullable().optional() }).loose()).nullable().optional(),
  impactList: z.array(Impact.loose()).nullable().optional(),
}).loose();

export const Sim = z.object({
  simulationID: z.string(),
  modelCompletionTime: z.string().nullable().optional(),
  link: z.string().optional(),
  cmeIDs: z.array(z.string().nullable()),
  impactList: z.array(Impact),
});
export type Sim = z.infer<typeof Sim>;

const trim = (s: z.infer<typeof RawSim>): Sim => ({
  simulationID: s.simulationID,
  modelCompletionTime: s.modelCompletionTime,
  link: s.link,
  cmeIDs: (s.cmeInputs ?? []).map((c) => c.cmeStartTime ?? null),
  impactList: (s.impactList ?? []).map((i) => ({ location: i.location, arrivalTime: i.arrivalTime, isGlancingBlow: i.isGlancingBlow })),
});

const SimList = z.preprocess((v) => (Array.isArray(v) ? v : []), z.array(RawSim)).transform((l) => l.map(trim));

export interface MarsHit {
  simulationID: string;
  /** ISO time the storm cloud is forecast to reach Mars */
  arrival: string;
  link?: string;
}

/** Only forecasts that name Mars, newest arrival first, one per arrival time. */
export function marsHits(sims: Sim[]): MarsHit[] {
  const seen = new Set<string>();
  const hits: MarsHit[] = [];
  for (const s of sims) {
    for (const i of s.impactList) {
      if (i.location !== "Mars" || !i.arrivalTime || seen.has(i.arrivalTime)) continue;
      seen.add(i.arrivalTime);
      hits.push({ simulationID: s.simulationID, arrival: i.arrivalTime, link: s.link });
    }
  }
  return hits.sort((a, b) => b.arrival.localeCompare(a.arrival));
}

const ymd = (d: Date) => d.toISOString().slice(0, 10);

/** Live "Today's Sun": Mars-bound storm clouds in the last 30 days. Falls back to the bundled snapshot. */
export async function getRecentMarsForecasts(opts: { offline?: boolean; now?: Date; fetchImpl?: typeof fetch } = {}): Promise<Result<MarsHit[]>> {
  const now = opts.now ?? new Date();
  const start = new Date(now.getTime() - 30 * 864e5);
  const url = `${GATEWAY}/WSAEnlilSimulations?startDate=${ymd(start)}&endDate=${ymd(now)}&api_key=${PUBLIC_KEY}`;
  const r = await getJson({
    url,
    cacheKey: "donki:enlil:recent",
    schema: SimList,
    offline: opts.offline,
    fetchImpl: opts.fetchImpl,
    snapshot: { data: recentSnap.data as Sim[], fetchedAt: Date.parse(recentSnap.fetchedAt) },
  });
  return { ...r, data: marsHits(r.data) };
}

/** The May 2024 forecast used by the main mission (always the snapshot: history doesn't change). */
export const may2024MarsHits: MarsHit[] = marsHits(may2024Snap.data as Sim[]);
export const SNAPSHOT_DATES = {
  may2024: may2024Snap.fetchedAt,
  recent: recentSnap.fetchedAt,
};
