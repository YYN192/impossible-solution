/**
 * One way for screens to get NASA / CSA data:
 *
 *   const storm = await dataClient.getRadiationStorm();   // Curiosity RAD, 20 May 2024 (RadLab)
 *   const cards = await dataClient.getScienceCards("food"); // OSDR studies
 *
 * Everything here is SAVED data: downloaded by scripts/ingest (by hand or by the scheduled
 * GitHub Action), checked against src/data/datasets.ts, and bundled with the game. So it works
 * with ?offline=1 and is never labelled live. Live DONKI for "Today's Sun" stays in donki.ts.
 * Each dataset is its own lazy chunk; a missing or broken file gives null, never a crash.
 */
import { SCHEMAS, type DatasetData, type DatasetName } from "./datasets";
import type { DataSource } from "./http";

export interface Loaded<T> {
  data: T;
  source: Extract<DataSource, "snapshot">;
  fetchedAt: number;
  attribution: string;
  sourceUrl: string;
  license?: string;
}

// The May 2024 / recent WSA-Enlil and CME files are imported directly by donki.ts (needed at start-up).
const files = import.meta.glob(["./snapshots/*.json", "!./snapshots/enlil-*.json", "!./snapshots/cme-*.json"], { import: "default" });
const memo = new Map<string, Promise<Loaded<unknown> | null>>();

/** Path of a file in public/ (pictures, map tiles), honouring the GitHub Pages base path. */
export const publicUrl = (path: string) =>
  `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;

async function loadUncached<N extends DatasetName>(
  name: N,
): Promise<Loaded<DatasetData<N>> | null> {
  const importer = files[`./snapshots/${name}.json`];
  const entry = SCHEMAS[name];
  if (!importer || !entry) return null;
  try {
    const parsed = entry.schema.safeParse(await importer());
    if (!parsed.success) {
      if (import.meta.env.DEV)
        console.warn(
          `[data] ${name} does not match its schema`,
          parsed.error.issues,
        );
      return null;
    }
    const env = parsed.data;
    return {
      data: env.data as DatasetData<N>,
      source: "snapshot",
      fetchedAt: Date.parse(env.fetchedAt),
      attribution: env.attribution,
      sourceUrl: env.source,
      license: env.license,
    };
  } catch {
    return null;
  }
}

function load<N extends DatasetName>(
  name: N,
): Promise<Loaded<DatasetData<N>> | null> {
  if (!memo.has(name)) memo.set(name, loadUncached(name));
  return memo.get(name) as Promise<Loaded<DatasetData<N>> | null>;
}

const map = async <A, B>(
  p: Promise<Loaded<A> | null>,
  f: (a: A) => B,
): Promise<Loaded<B> | null> => {
  const r = await p;
  return r ? { ...r, data: f(r.data) } : null;
};

export const dataClient = {
  load,
  /** DONKI, last 30 days: flares, particle events, CMEs, geomagnetic storms (seen from near Earth). */
  getSpaceWeather: () => load("space-weather-recent"),
  getWeatherWeek: () => load("space-weather-week"),
  /** RadLab: Curiosity's dose-rate readings around the 20 May 2024 storm. */
  getRadiationStorm: () => load("radlab-msl-2024-05"),
  /** OSDR space-biology studies, optionally for one topic. */
  getScienceCards: (topic?: "food" | "radiation" | "health") =>
    map(load("osdr-studies"), (d) =>
      d.cards.filter((c) => !topic || c.topic === topic),
    ),
  /** Mars Trek map tiles around Gale Crater (local copies). */
  getMarsSite: () => load("mars-trek-gale"),
  /** NASA Image Library pictures (local copies), optionally for one use. */
  getMissionImages: (use?: "dust" | "storm" | "site") =>
    map(load("mission-images"), (d) => d.filter((i) => !use || i.use === use)),
  /** Newest Astronomy Picture of the Day in the saved list: a link with its credit. */
  getApod: async () => {
    const r = await load("apod-recent");
    if (!r) return null;
    const newest = [...r.data].sort((a, b) => b.date.localeCompare(a.date))[0];
    return newest ? { ...r, data: newest } : null;
  },
  /** Canadian Space Agency activities for teachers and families (links only). */
  getLearningResources: () => load("csa-resources"),
};
