/**
 * Schemas for every saved dataset in src/data/snapshots/ (written by scripts/ingest/).
 * One envelope for all: where it came from, when, who to credit, and the trimmed data.
 */
import { z } from "zod";
import { Sim } from "./donki";

export const envelope = <T extends z.ZodType>(data: T) =>
  z.object({
    fetchedAt: z.iso.datetime(),
    source: z.url(),
    attribution: z.string().min(3),
    license: z.string().optional(),
    about: z.string(),
    data,
  });

const Cme = z
  .object({
    activityID: z.string(),
    startTime: z.string(),
    link: z.url().optional(),
    analyses: z.array(
      z.object({ speed: z.number().nullable().optional() }).loose(),
    ),
  })
  .loose();

export const SpaceWeather = z.object({
  window: z.object({ start: z.string(), end: z.string() }),
  counts: z.object({
    flares: z.number().int().min(0).nullable(),
    bigFlares: z.number().int().min(0).nullable(),
    particleEvents: z.number().int().min(0).nullable(),
    cmes: z.number().int().min(0).nullable(),
    geomagneticStorms: z.number().int().min(0).nullable(),
  }),
  strongestFlare: z
    .object({
      classType: z.string(),
      peakTime: z.string().nullable(),
      link: z.string().optional(),
    })
    .nullable(),
  latestCme: z
    .object({
      id: z.string(),
      startTime: z.string(),
      speedKmS: z.number().nullable(),
      link: z.string().optional(),
    })
    .nullable(),
  strongestStormKp: z.number().nullable(),
  notifications: z.array(
    z.object({ type: z.string(), issueTime: z.string(), url: z.string() }),
  ),
  /** DONKI parts that did not answer; their counts are null (never a fake 0). */
  missing: z
    .array(z.enum(["flr", "sep", "cme", "gst", "notifications"]))
    .default([]),
});
export type SpaceWeather = z.infer<typeof SpaceWeather>;

export const RadiationStorm = z.object({
  instrument: z.literal("MSL-RAD-Surface"),
  stormStart: z.string(),
  unit: z.literal("µGy/h"),
  normalRate: z.number().positive(),
  peak: z.object({ time: z.string(), rate: z.number().positive() }),
  peakTimesNormal: z.number().gt(1),
  extraDoseMicroGy: z.number().min(0),
  readings: z.number().int().positive(),
  series: z.array(z.object({ time: z.string(), rate: z.number() })).min(10),
});
export type RadiationStorm = z.infer<typeof RadiationStorm>;

export const ScienceCard = z.object({
  id: z.string().regex(/^OSD-\d+$/),
  topic: z.enum(["food", "radiation", "health"]),
  title: z.string(),
  description: z.string(),
  organism: z.string().nullable(),
  released: z.string().nullable(),
  url: z.url(),
});
export type ScienceCard = z.infer<typeof ScienceCard>;
const Studies = z.object({
  cards: z.array(ScienceCard).min(1),
  veggieStudies: z.number().nullable(),
});

export const MissionImage = z.object({
  nasaId: z.string(),
  use: z.enum(["dust", "storm", "site"]),
  title: z.string(),
  description: z.string(),
  date: z.string(),
  credit: z.string().min(2),
  page: z.url(),
  remoteImage: z.url(),
  image: z.string().regex(/^data\/img\/[\w-]+\.jpg$/),
});
export type MissionImage = z.infer<typeof MissionImage>;

export const ApodEntry = z.object({
  date: z.string(),
  title: z.string(),
  page: z.url(),
  mediaType: z.string(),
  credit: z.string().min(1),
  copyrighted: z.boolean(),
  alt: z.string(),
});
export type ApodEntry = z.infer<typeof ApodEntry>;

export const MarsSite = z.object({
  layer: z.string(),
  site: z.object({ name: z.string(), lat: z.number(), lon: z.number() }),
  zoom: z.number().int(),
  tiles: z
    .array(
      z.object({
        row: z.number().int(),
        col: z.number().int(),
        image: z.string().regex(/^data\/trek\//),
        remote: z.url(),
      }),
    )
    .length(4),
  explore: z.url(),
});
export type MarsSite = z.infer<typeof MarsSite>;

export const LearningResource = z.object({
  id: z.string(),
  topic: z.string(),
  title: z.string(),
  kind: z.string(),
  url: z.url(),
  links: z.array(z.object({ title: z.string(), url: z.url() })).default([]),
});
export type LearningResource = z.infer<typeof LearningResource>;

/** One eruption of the storm pool, with the WSA-Enlil forecasts that name Mars (may be none). */
export const PoolStorm = z.object({
  activityID: z.string(),
  startTime: z.string(),
  activeRegionNum: z.number().nullable(),
  link: z.url(),
  speeds: z.array(z.number()),
  marsHits: z.array(
    z.object({ arrival: z.string(), glancing: z.boolean().nullable(), speed: z.number().nullable(), link: z.url() }),
  ),
});

/** name of the file in snapshots/ → schema. `required: false` = the game works without it (e.g. not downloaded yet). */
export const SCHEMAS = {
  "cme-2024-05-20": { schema: envelope(z.array(Cme).min(1)), required: true },
  "enlil-mars-2024-05": {
    schema: envelope(z.array(Sim).min(1)),
    required: true,
  },
  "enlil-mars-recent": { schema: envelope(z.array(Sim)), required: true },
  "space-weather-recent": { schema: envelope(SpaceWeather), required: false },
  "radlab-msl-2024-05": { schema: envelope(RadiationStorm), required: true },
  "osdr-studies": { schema: envelope(Studies), required: true },
  "mission-images": {
    schema: envelope(z.array(MissionImage).min(1)),
    required: true,
  },
  "apod-recent": {
    schema: envelope(z.array(ApodEntry).min(1)),
    required: false,
  },
  "mars-trek-gale": { schema: envelope(MarsSite), required: true },
  "dsn-mars": {
    schema: envelope(z.array(z.object({ spacecraft: z.string(), rtltSeconds: z.number(), dish: z.string(), station: z.string() })).min(1)),
    required: true,
  },
  "storm-pool": { schema: envelope(z.array(PoolStorm).length(2)), required: true },
  "csa-resources": {
    schema: envelope(z.array(LearningResource).min(1)),
    required: true,
  },
} as const;

export type DatasetName = keyof typeof SCHEMAS;
export type DatasetData<N extends DatasetName> = z.infer<
  (typeof SCHEMAS)[N]["schema"]
>["data"];
