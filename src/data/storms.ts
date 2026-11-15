/**
 * The pool of real solar storms the classic mission can replay. Each one has a dated eruption in
 * NASA's DONKI database and a Mars-surface reading from Curiosity's radiation detector (RAD).
 *
 * Storm size comes from ONE ratio per storm: the worst hour ÷ the quiet level just before it, both
 * from the same detector series (NASA OSDR RadLab, MSL-RAD-Surface, measured by us on 14 Nov 2026):
 *   20 May 2024: 304 vs about 4 µGy/h  → about 74 times  → "huge"
 *   11 Sep 2017: 23.2 vs 7.9 µGy/h     → about 3 times   → "small"
 *   29 Oct 2021: 25.8 vs 8.5 µGy/h     → about 3 times   → "small"
 * We never compare one storm's ratio with another detector, year or baseline.
 */
import { DOSE, type DataRef, type StormEvent } from "../sim/types";
import { SNAPSHOT_DATES, may2024MarsHits } from "./donki";
import pool from "./snapshots/storm-pool.json";
import { DONKI_ENLIL_MAY23, RAD_STORM } from "./sources";

const RADLAB_URL = "https://visualization.osdr.nasa.gov/radlab/gui/";
/** When we measured the 2017 and 2021 peaks and quiet levels from RadLab. */
export const RADLAB_MEASURED = "2026-11-14T23:35:00.000Z";

export type StormId = "may2024" | "sep2017" | "oct2021";

export interface Storm {
  id: StormId;
  /** UTC day of the worst hour on Mars. */
  day: string;
  /** DONKI activity ID of the eruption (CME). */
  activityId: string;
  /** Flare class, as published. */
  flare: string;
  /** Worst hour ÷ quiet level, same detector. */
  peakRatio: number;
  size: "huge" | "small";
  /** Game dose of the burst. Missing = the big-storm defaults (DOSE.burstInside / burstOutside). */
  dose?: { inside: number; outside: number };
  burstRef: DataRef & { fetched: string };
  /** The slower storm cloud, only when DONKI's forecast names Mars. */
  cloud?: { day: string; ref: DataRef };
}

/** A small storm: about 3 times a normal day (the real ratio applied to the game's normal day). */
export const SMALL_STORM_FACTOR = 3;
const SMALL = {
  inside: SMALL_STORM_FACTOR * DOSE.normalDay,
  outside: SMALL_STORM_FACTOR * (DOSE.normalDay + DOSE.outsideExtra),
};

const [cme2017, cme2021] = pool.data;
const hit2017 = cme2017.marsHits.find((h) => h.arrival.startsWith("2017-09-13"))!;

export const STORMS: Storm[] = [
  {
    id: "may2024",
    day: "2024-05-20",
    activityId: "2024-05-20T05:36:00-CME-001",
    flare: "X12 or larger (estimated)",
    peakRatio: 74,
    size: "huge",
    burstRef: RAD_STORM,
    ...(may2024MarsHits.some((h) => h.arrival.startsWith("2024-05-28"))
      ? { cloud: { day: "2024-05-28", ref: { ...DONKI_ENLIL_MAY23, fetched: SNAPSHOT_DATES.may2024 } } }
      : {}),
  },
  {
    id: "sep2017",
    day: "2017-09-11",
    activityId: cme2017.activityID,
    flare: "X8.2",
    peakRatio: 2.9,
    size: "small",
    dose: SMALL,
    burstRef: {
      value: "about 3 times the usual level",
      label: "A Mars rover (Curiosity) measured this solar storm on 11 Sep 2017",
      url: RADLAB_URL,
      mode: "snapshot",
      fetched: RADLAB_MEASURED,
    },
    cloud: {
      day: hit2017.arrival.slice(0, 10),
      ref: {
        label: "NASA's space weather forecast: the storm cloud of 10 Sep 2017 was forecast to brush past Mars on 13 Sep",
        url: hit2017.link,
        mode: "snapshot",
        fetched: pool.fetchedAt,
      },
    },
  },
  {
    id: "oct2021",
    day: "2021-10-29",
    activityId: cme2021.activityID,
    flare: "X1.0",
    peakRatio: 3,
    size: "small",
    dose: SMALL,
    burstRef: {
      value: "about 3 times the usual level",
      label: "A Mars rover (Curiosity) measured this solar storm on 29 Oct 2021",
      url: RADLAB_URL,
      mode: "snapshot",
      fetched: RADLAB_MEASURED,
    },
    // DONKI's forecast for this eruption names no storm cloud reaching Mars.
  },
];

export const stormById = (id: string): Storm => STORMS.find((s) => s.id === id) ?? STORMS[0];

/**
 * The storm on a 3-sol mission. `burstSol` is the sol the real burst day falls on (the mission's
 * start day moves, the storm does not). The storm cloud arrives the sol after (days squeezed into sols).
 */
export function stormEvents(storm: Storm, burstSol: number, sols = 3): StormEvent[] {
  return [
    {
      sol: burstSol,
      kind: "particleBurst",
      id: storm.activityId,
      captionKey: `event.burst.${storm.id}`,
      source: storm.burstRef,
      ...(storm.dose ? { dose: storm.dose } : {}),
    },
    ...(storm.cloud && burstSol < sols
      ? [
          {
            sol: burstSol + 1,
            kind: "stormCloud" as const,
            id: storm.activityId,
            captionKey: `event.stormCloud.${storm.id}`,
            source: storm.cloud.ref,
          },
        ]
      : []),
  ];
}
