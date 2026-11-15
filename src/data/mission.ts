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
import { buildRun, type Beat, type Place, type Run } from "../sim/campaign";
import type { EarthAnswer, GameState, Rules, StormEvent } from "../sim/types";
import { CLASSIC_RULES, MISSION_SOLS } from "../sim/types";
import { campaignById } from "./campaigns";
import { getMarsDelay, MOON_DELAY_INFO, type LightDelay } from "./dsn";
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

/** DONKI activity ID of the 20 May 2024 eruption (from our snapshot), shown on the storm card. */
const MAY2024_ID = "2024-05-20T05:36:00-CME-001";

export type MissionKind = "may2024" | "todaysSun" | "campaign";

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
  /** The run: which campaign, which seed (shown on the final screen; `?seed=` replays it). */
  campaignId: string;
  seed: number;
  place: Place;
  rules: Rules;
  /** At most one beat per sol, between the morning report and the plan. */
  beats: Record<number, Beat>;
  /** The real storm this run replays (classic mission), for the storm card. */
  stormId?: string;
  /** Today's Sun: the real Mars-bound storm cloud DONKI forecast (shown as a card; never a dose). */
  sun?: SunReport;
  /** Radio delay to Earth: today's Deep Space Network reading for Mars, a constant for the Moon. */
  delay: LightDelay;
}

/** The newest Mars-bound CME from DONKI, as facts for the kid card. It only times the storm: the dose stays a game number. */
export interface SunReport {
  cmeId?: string;
  /** km/s, leaving the Sun */
  speed?: number;
  /** ISO time WSA-Enlil forecasts it reaching Mars */
  arrival: string;
  /** true when the arrival is already in the past */
  passed: boolean;
  url: string;
  source: DataSource;
  fetchedAt: number;
}

/** Today's Sun looks back this far (issue #8: "last 30 days"). */
export const SUN_WINDOW_DAYS = 30;

/** The saved Mars delay (14 Nov 2026): every setup starts with it; getMissionSetup swaps in today's. */
const SAVED_DELAY = await getMarsDelay({ offline: true });
const CLASSIC = {
  campaignId: "classic",
  seed: 0,
  place: "mars" as const,
  rules: CLASSIC_RULES,
  beats: {},
  delay: SAVED_DELAY,
};

/** Today's date as a number (UTC), e.g. 20261115: the daily mission's seed, the same for everyone. */
export const dailySeed = (now: Date): number => Number(now.toISOString().slice(0, 10).replaceAll("-", ""));

/** One run of a campaign: bundled real data, picked by the seed. */
export function campaignMission(id: string, seed: number): MissionSetup {
  const run: Run = buildRun(campaignById(id), seed);
  return withDelay({
    ...CLASSIC,
    kind: "campaign",
    titleKey: `campaign.${run.campaignId}.name`,
    events: run.events,
    forecasts: {},
    dataSource: "snapshot",
    dataFetchedAt: Date.parse(SNAPSHOT_DATES.may2024),
    campaignId: run.campaignId,
    seed,
    place: run.place,
    rules: run.rules,
    beats: run.beats,
    ...(run.stormId ? { stormId: run.stormId } : {}),
  }, SAVED_DELAY);
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
    ...CLASSIC,
    stormId: "may2024",
    kind: "may2024",
    titleKey: "mission.may2024.title",
    events: [
      {
        sol: 2,
        kind: "particleBurst",
        id: MAY2024_ID,
        captionKey: "event.burst.may2024",
        source: RAD_STORM,
      },
      ...(cloud
        ? [
            {
              sol: 3,
              kind: "stormCloud" as const,
              id: MAY2024_ID,
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
  // Only storm clouds that reach (or reached) Mars inside the window: an old snapshot must not pass as "this month".
  const newest = hits.find((h) => Date.parse(h.arrival) >= now.getTime() - SUN_WINDOW_DAYS * 864e5);
  if (!newest) {
    return { ...may2024Mission(), noticeKey: "notice.sunQuiet" };
  }
  const passed = Date.parse(newest.arrival) < now.getTime();
  const sun: SunReport = {
    ...(newest.cmeId ? { cmeId: newest.cmeId } : {}),
    ...(newest.speed ? { speed: newest.speed } : {}),
    arrival: newest.arrival,
    passed,
    url: newest.link ?? "https://kauai.ccmc.gsfc.nasa.gov/DONKI/",
    source,
    fetchedAt,
  };
  // Already reached Mars: never tell kids it is "heading for Mars".
  if (passed) {
    return { ...may2024Mission(), noticeKey: "notice.sunPassed", sun };
  }
  const days = Math.round((Date.parse(newest.arrival) - now.getTime()) / 864e5);
  // Show it on the sol it would arrive (capped to the mission).
  const sol = Math.min(MISSION_SOLS, Math.max(2, days + 1));
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
    ...CLASSIC,
    kind: "todaysSun",
    titleKey: "mission.todaysSun.title",
    events: [
      {
        sol,
        kind: "stormCloud",
        ...(newest.cmeId ? { id: newest.cmeId } : {}),
        captionKey: "event.stormCloud.today",
        source: ref,
      },
    ],
    forecasts,
    dataSource: source,
    dataFetchedAt: fetchedAt,
    sun,
  };
}

/** Entry point for the app. Never throws: worst case is the bundled May 2024 mission. */
export async function getMissionSetup(
  flags: Flags,
  now: Date = new Date(),
  fetchImpl?: typeof fetch,
): Promise<MissionSetup> {
  const setup = await pickMission(flags, now, fetchImpl);
  if (setup.place === "moon") return withDelay(setup, MOON_DELAY_INFO);
  // The demo and offline play never touch the network: they keep the saved reading.
  if (flags.offline) return setup;
  return withDelay(setup, await getMarsDelay({ fetchImpl }));
}

async function pickMission(flags: Flags, now: Date, fetchImpl?: typeof fetch): Promise<MissionSetup> {
  if (flags.demo) return demoMission();
  if (flags.todaysSun) {
    try {
      const r = await getRecentMarsForecasts({ offline: flags.offline, now, fetchImpl });
      return todaysSunMission(r.data, r.source, r.fetchedAt, now);
    } catch {
      return { ...may2024Mission(), noticeKey: "notice.sunQuiet" };
    }
  }
  const seed = flags.seed ?? (flags.daily ? dailySeed(now) : 100_000 + Math.floor(Math.random() * 900_000));
  return campaignMission(flags.campaign ?? "storm", seed);
}

/** Put the radio delay on the setup and on the radio beat's real-data card. */
function withDelay(setup: MissionSetup, delay: LightDelay): MissionSetup {
  const beats = Object.fromEntries(
    Object.entries(setup.beats).map(([sol, b]) => [sol, b.type === "radio" ? { ...b, card: delay.ref } : b]),
  );
  return { ...setup, delay, beats };
}
