/**
 * The campaigns. Each one is data for the one engine: rules, real events and one beat per sol.
 * Everything a kid can choose here is a GAME NUMBER (listed on Data Sources); the real records
 * named on the cards decide which way the numbers lean.
 */
import { option, type Beat, type Campaign } from "../sim/campaign";
import { pick, shuffle } from "../sim/rng";
import { DOSE, type CrewId, type DataRef, type StormEvent } from "../sim/types";
import { INSIGHT_DUST, LIGHT_DELAY } from "./sources";
import { STORMS, stormEvents, SMALL_STORM_FACTOR, RADLAB_MEASURED } from "./storms";

const CHECKED = "2026-11-14T23:35:00.000Z";
const fact = (label: string, url: string, value?: string): DataRef => ({
  label,
  url,
  mode: "constant",
  fetched: CHECKED,
  ...(value ? { value } : {}),
});

export const INSIGHT_POWER = fact(
  "NASA's InSight lander: its solar panels made about 5,000 watt-hours a sol after landing and about 500 by spring 2022, because of dust",
  "https://science.nasa.gov/photojournal/insights-power-generation-after-landing-and-spring-2022",
  "about 5,000 → about 500 Wh per sol",
);
export const INSIGHT_SAND = fact(
  "NASA's InSight team trickled sand next to a panel so the wind would carry dust off it (May 2021)",
  "https://www.nasa.gov/feature/jpl/nasa-s-insight-mars-lander-gets-a-power-boost",
  "about 30 Wh more per sol",
);
export const OPPORTUNITY_2018 = fact(
  "NASA's Opportunity rover: a dust storm around the whole planet blocked its solar panels; its last message came on 10 June 2018",
  "https://www.jpl.nasa.gov/images/opportunitys-last-message",
);
export const WIND_CLEANING = fact(
  "Wind gusts blew dust off the solar panels of NASA's rovers Spirit and Opportunity",
  "https://www.planetary.org/articles/08-31-mer-update-1",
);
export const REMS_NIGHT: DataRef = {
  value: "−71 °C",
  label: "Curiosity's weather station in Gale Crater, coldest reading of the sol (reading from 25 Aug 2026, not live)",
  url: "https://mars.nasa.gov/rss/api/?feed=weather&category=msl&feedtype=json",
  mode: "snapshot",
  fetched: "2026-11-14T16:00:00.000Z",
};
export const ARTEMIS_REGIONS = fact(
  "NASA named 13 candidate landing regions near the Moon's south pole, chosen for sunlight, talking with Earth and nearness to shadowed craters (19 Aug 2022)",
  "https://www.nasa.gov/news-release/nasa-identifies-candidate-regions-for-landing-next-americans-on-moon/",
);
export const MOON_DELAY = fact(
  "Worked out from the Earth–Moon distance (384,400 km, NASA fact sheet) and the speed of light",
  "https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html",
  "about 1.3 seconds each way",
);
export const CRATER_MAY2024: DataRef = {
  value: "about 1.3 times its usual level",
  label: "NASA's Lunar Reconnaissance Orbiter, in orbit around the Moon, during the 20 May 2024 solar storm (12.3 → 15.7 µGy/h)",
  url: "https://visualization.osdr.nasa.gov/radlab/gui/",
  mode: "snapshot",
  fetched: RADLAB_MEASURED,
};

const CREW_NAMES: Record<CrewId, string> = { a1: "Nova", a2: "Kai", a3: "Amara" };

/** A crew member needs help: feed them or let them rest. The seed picks who. */
function crewBeat(next: () => number): Beat {
  const who = pick(next, ["a2", "a3"] as CrewId[]);
  return {
    id: "crew",
    type: "dilemma",
    vars: { crew: CREW_NAMES[who] },
    options: [
      option("crew", "meal", "🍲", { effect: { food: -1 } }),
      option("crew", "rest", "🛌", { effect: { tired: [who] } }),
    ],
  };
}

const radio = (card: DataRef, ask: "night" | "now"): Beat => ({
  id: ask === "now" ? "radioMoon" : "radio",
  type: "radio",
  card,
  options: [
    option(ask === "now" ? "radioMoon" : "radio", "call", "📡", { effect: { power: -1 }, ask }),
    option(ask === "now" ? "radioMoon" : "radio", "skip", "🔋"),
  ],
});

const storm: Campaign = {
  id: "storm",
  place: "mars",
  rules: {},
  datasets: ["DONKI", "Curiosity RAD (RadLab)", "InSight", "DSN"],
  difficulty: 1,
  minutes: 5,
  // Counting through the seeds visits every real storm on every sol: tomorrow's daily mission differs from today's.
  build: (_next, seed) => {
    const n = Math.abs(seed) % (STORMS.length * 3);
    const s = STORMS[n % STORMS.length];
    return { events: stormEvents(s, 1 + Math.floor(n / STORMS.length)), beats: {}, stormId: s.id };
  },
};

/** Real dust storms. `solar` is the share of power the panels still made. */
const DUST_STORMS = [
  { id: "InSight-2022-10", captionKey: "event.dust.insight2022", solar: 275 / 425, source: INSIGHT_DUST },
  // No published power number we could verify: 0.3 is a game number, the storm and its date are real.
  { id: "Opportunity-2018-06", captionKey: "event.dust.opportunity2018", solar: 0.3, source: OPPORTUNITY_2018 },
] as const;

const dust: Campaign = {
  id: "dust",
  place: "mars",
  rules: { sols: 6, scienceGoal: 3, heater: 1 },
  datasets: ["InSight", "Opportunity", "Curiosity REMS", "Curiosity RAD (RadLab)", "DSN"],
  difficulty: 2,
  minutes: 10,
  unlockAfter: "storm",
  build: (next) => {
    const ds = pick(next, DUST_STORMS);
    const start = pick(next, [3, 4]);
    const sun = pick(next, STORMS.filter((s) => s.size === "small"));
    const events: StormEvent[] = [
      ...[start, start + 1].map((sol) => ({ sol, kind: "dustStorm" as const, id: ds.id, captionKey: ds.captionKey, solar: ds.solar, source: ds.source })),
      ...stormEvents(sun, pick(next, [5, 6]), 6).filter((e) => e.kind === "particleBurst"),
    ];
    const dilemma: Beat = pick(next, [
      {
        id: "cold",
        type: "dilemma" as const,
        card: REMS_NIGHT,
        options: [option("cold", "heat", "🔥", { effect: { power: -2 } }), option("cold", "huddle", "🥶", { effect: { food: -1 } })],
      },
      {
        id: "devil",
        type: "dilemma" as const,
        card: WIND_CLEANING,
        options: [option("devil", "tilt", "🌬️", { effect: { power: -1, panelEfficiency: 1 } }), option("devil", "shut", "🚪")],
      },
      crewBeat(next),
    ]);
    return {
      events,
      beats: {
        1: {
          id: "siteMars",
          type: "site",
          options: [
            option("siteMars", "gale", "🏔️", { rules: { heater: 2 }, source: REMS_NIGHT }, true),
            option("siteMars", "elysium", "🏜️", { rules: { dustFactor: 0.5 }, source: INSIGHT_POWER }, true),
            option("siteMars", "meridiani", "🌬️", { rules: { dustFactor: 0.8, solar: 5 }, source: WIND_CLEANING }, true),
          ],
        },
        2: {
          id: "wipe",
          type: "wipe",
          card: INSIGHT_SAND,
          options: [
            option("wipe", "none", "🧽✗"),
            option("wipe", "half", "🧽", { effect: { panelEfficiency: 0.8, dose: DOSE.outsideExtra } }),
            option("wipe", "all", "✨", { effect: { panelEfficiency: 1, dose: 2 * DOSE.outsideExtra } }),
          ],
        },
        3: {
          id: "upgrade",
          type: "upgrade",
          options: [
            option("upgrade", "brush", "🧹", { effect: { power: -2 }, rules: { dustFactor: 0.9 } }),
            option("upgrade", "shelf", "🥬", { effect: { power: -2 }, rules: { foodGain: 2 } }),
            option("upgrade", "walls", "🛡️", { effect: { power: -2 }, rules: { shelterFactor: 0.25 } }),
            option("upgrade", "none", "🔋"),
          ],
        },
        4: radio(LIGHT_DELAY, "night"),
        5: dilemma,
        6: {
          id: "rover",
          type: "rover",
          options: [
            option("rover", "near", "🚙", { effect: { power: -1, science: 1, dose: DOSE.outsideExtra } }),
            option("rover", "far", "🗺️", { effect: { power: -3, science: 2, dose: 2 * DOSE.outsideExtra } }),
            option("rover", "stay", "🏠"),
          ],
        },
      },
    };
  },
};

/** Seen from the Moon's orbit, the May 2024 storm was mild: it pointed at Mars. */
const MOON_STORM_FACTOR = 1.3;

const moon: Campaign = {
  id: "moon",
  place: "moon",
  rules: { sols: 5, solar: 5, dustFactor: 0.9, scienceGoal: 2 },
  datasets: ["Artemis candidate regions", "LRO CRaTER (RadLab)", "Moon Trek", "CSA"],
  difficulty: 3,
  minutes: 9,
  unlockAfter: "dust",
  build: (next) => {
    const hidden = shuffle(next, [2, 3, 4, 5]).slice(0, 2).sort();
    const may = STORMS[0];
    const events: StormEvent[] = [
      {
        sol: 3,
        kind: "particleBurst",
        id: may.activityId,
        captionKey: "event.burst.moonMay2024",
        source: CRATER_MAY2024,
        dose: { inside: MOON_STORM_FACTOR * DOSE.normalDay, outside: MOON_STORM_FACTOR * (DOSE.normalDay + DOSE.outsideExtra) },
      },
      // A game event: even the best ridges are not sunlit all the time.
      { sol: pick(next, [2, 4, 5]), kind: "dustStorm", id: "shadow-day", captionKey: "event.shadow.moon", solar: 0.2, source: ARTEMIS_REGIONS },
    ];
    const last: Beat = pick(next, [
      {
        id: "lastDay",
        type: "dilemma" as const,
        options: [
          option("lastDay", "sample", "🪨", { effect: { science: 1, dose: DOSE.outsideExtra } }),
          option("lastDay", "charge", "🔋", { effect: { power: 2 } }),
        ],
      },
      crewBeat(next),
    ]);
    return {
      events,
      beats: {
        1: {
          id: "siteMoon",
          type: "site",
          card: ARTEMIS_REGIONS,
          options: [
            option("siteMoon", "malapert", "⛰️", { rules: { solar: 6 }, source: ARTEMIS_REGIONS }, true),
            option("siteMoon", "shackleton", "☀️", { rules: { solar: 7, earthHidden: hidden }, source: ARTEMIS_REGIONS }, true),
            option("siteMoon", "haworth", "🧊", { rules: { solar: 4, airMachinePower: 1, foodGain: 2, earthHidden: hidden }, source: ARTEMIS_REGIONS }, true),
          ],
        },
        2: radio(MOON_DELAY, "now"),
        3: {
          id: "skywatch",
          type: "skywatch",
          card: CRATER_MAY2024,
          options: [
            option("skywatch", "shelter", "🛡️", { effect: { power: -1, shelterSols: 2 } }),
            option("skywatch", "work", "👷"),
          ],
        },
        4: {
          id: "ice",
          type: "rover",
          options: [
            option("ice", "rim", "🚙", { effect: { power: -1, air: 1 } }),
            option("ice", "deep", "🧊", { effect: { power: -3, air: 2, food: 1, science: 1, dose: DOSE.outsideExtra } }),
            option("ice", "stay", "🏠"),
          ],
        },
        5: last,
      },
    };
  },
};

export const CAMPAIGNS: Campaign[] = [storm, dust, moon];
export const campaignById = (id: string): Campaign => CAMPAIGNS.find((c) => c.id === id) ?? storm;
/** Game numbers shown on Data Sources. */
export const CAMPAIGN_NUMBERS = { SMALL_STORM_FACTOR, MOON_STORM_FACTOR };
