/**
 * Mission setup = everything the engine needs from the outside world for one game.
 * Deterministic: the same flags (and the same live data) always give the same setup.
 *
 * How the engine/UI uses it:
 *   - `events` → pass to step(state, plan, events); each event has the sol it happens on.
 *   - `forecasts[sol]` → if the crew did Ask Earth on `sol`, show forecasts[sol] in the NEXT morning's report
 *     (state.earthAnswer). Earth's answer: storm-cloud part = real DONKI WSA-Enlil forecast (Mars-only);
 *     dust part = game-invented (DONKI does not forecast Mars dust).
 */
import type { EarthAnswer, GameState, StormEvent } from "../sim/types";
import { MISSION_SOLS } from "../sim/types";
import {
  getRecentMarsForecasts,
  may2024MarsHits,
  SNAPSHOT_DATES,
  type MarsHit,
} from "./donki";
import type { DataSource } from "./http";
import { isLive } from "./http";
import type { Flags } from "./flags";
import { DEMO_START } from "./demo";
import { DONKI_ENLIL_MAY23, earthAnswerRef, RAD_STORM } from "./sources";

export type MissionKind = "may2024" | "todaysSun";

export interface MissionSetup {
  kind: MissionKind;
  /** Text key for the mission title, e.g. 'mission.may2024.title' */
  titleKey: string;
  events: StormEvent[];
  /** Earth's answer if you Ask Earth on that sol (shown the next morning). */
  forecasts: Record<number, EarthAnswer>;
  /** For the LIVE / SNAPSHOT badge. */
  dataSource: DataSource;
  dataFetchedAt: number;
  /** Set when "Today's Sun" was asked for but no Mars-bound storm was found. Text key for the kid message. */
  noticeKey?: string;
  /** Fixed start overrides. Omitted for ordinary missions, which use the engine default. */
  initialState?: Partial<Pick<GameState, "food" | "panelEfficiency">>;
}

/**
 * Main May 2024 storm data (also reused by the fixed demo scenario).
 *   Sol 2: particle burst, no warning possible (20 May 2024, Curiosity RAD 8.1 mGy).
 *   Sol 3: storm cloud arrives (23 May 2024 CME, forecast to brush past Mars 28 May; days squeezed into sols).
 *   Ask Earth on sol 1 → sol 2 morning: "dusty tomorrow" + "storm cloud in 1 sol".
 *   Ask Earth on sol 2 → sol 3 morning: "storm cloud arrives today".
 */
export function may2024Mission(): MissionSetup {
  const cloud = may2024MarsHits.find((h) => h.arrival.startsWith("2024-05-28"));
  const cloudRef = { ...DONKI_ENLIL_MAY23, fetched: SNAPSHOT_DATES.may2024 };
  const answerRef = earthAnswerRef(cloudRef);
  return {
    kind: "may2024",
    titleKey: "mission.may2024.title",
    events: [
      {
        sol: 2,
        kind: "particleBurst",
        captionKey: "event.burst.may2024",
        source: RAD_STORM,
      },
      ...(cloud
        ? [
            {
              sol: 3,
              kind: "stormCloud" as const,
              captionKey: "event.stormCloud.may2024",
              source: cloudRef,
            },
          ]
        : []),
    ],
    forecasts: {
      1: {
        dustTomorrow: "dusty",
        stormCloudInSols: cloud ? 1 : undefined,
        source: answerRef,
      },
      2: {
        dustTomorrow: "clear",
        stormCloudInSols: cloud ? 0 : undefined,
        source: answerRef,
      },
      3: { dustTomorrow: "clear", source: answerRef },
    },
    dataSource: "snapshot",
    dataFetchedAt: Date.parse(SNAPSHOT_DATES.may2024),
  };
}

/** The recording mission uses the same saved storm, plus a fixed start that yields its story. */
export function demoMission(): MissionSetup {
  return {
    ...may2024Mission(),
    initialState: DEMO_START,
  };
}

/**
 * Optional "Today's Sun" mission: the storm cloud comes from the newest real DONKI forecast
 * of a storm cloud reaching Mars (last 30 days). No particle burst: we can't know one in advance.
 * If DONKI has no Mars-bound storm, kids get the main mission plus a "quiet Sun" notice.
 */
export function todaysSunMission(
  hits: MarsHit[],
  source: DataSource,
  fetchedAt: number,
  now: Date,
): MissionSetup {
  const newest = hits[0];
  if (!newest) {
    return { ...may2024Mission(), noticeKey: "notice.sunQuiet" };
  }
  const days = Math.round((Date.parse(newest.arrival) - now.getTime()) / 864e5);
  // Future arrival: show it on the sol it would arrive (capped). Past arrival (already hit): last sol.
  const sol = Math.min(
    MISSION_SOLS,
    Math.max(2, days >= 0 ? days + 1 : MISSION_SOLS),
  );
  const ref = {
    label: `NASA's space weather forecast: a storm cloud reaching Mars on ${newest.arrival.slice(0, 10)}`,
    url: newest.link ?? "https://kauai.ccmc.gsfc.nasa.gov/DONKI/",
    mode: isLive(source) ? ("live" as const) : ("snapshot" as const),
    fetched: new Date(fetchedAt).toISOString(),
  };
  const forecasts: Record<number, EarthAnswer> = {};
  for (let s = 1; s <= MISSION_SOLS; s++) {
    forecasts[s] = {
      dustTomorrow: s === 1 ? "dusty" : "clear",
      stormCloudInSols: sol > s ? sol - s - 1 : undefined,
      source: earthAnswerRef(ref),
    };
  }
  return {
    kind: "todaysSun",
    titleKey: "mission.todaysSun.title",
    events: [
      {
        sol,
        kind: "stormCloud",
        captionKey: "event.stormCloud.today",
        source: ref,
      },
    ],
    forecasts,
    dataSource: source,
    dataFetchedAt: fetchedAt,
  };
}

/** Entry point for the app. Never throws: worst case is the bundled May 2024 mission. */
export async function getMissionSetup(
  flags: Flags,
  now: Date = new Date(),
): Promise<MissionSetup> {
  if (flags.demo) return demoMission();
  if (!flags.todaysSun) return may2024Mission();
  try {
    const r = await getRecentMarsForecasts({ offline: flags.offline, now });
    return todaysSunMission(r.data, r.source, r.fetchedAt, now);
  } catch {
    return { ...may2024Mission(), noticeKey: "notice.sunQuiet" };
  }
}
