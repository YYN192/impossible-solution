/**
 * Every real number in the game, with its source. Single source of truth for the
 * Data Sources screen, the chips in the game, and CREDITS.md.
 * Verified by the science-checker agent on Sat 14 Nov 2026.
 */
import type { DataRef } from "../sim/types";
import { SNAPSHOT_DATES } from "./donki";

const CHECKED_AT = "2026-11-14T12:04:30.000Z";
type DatedDataRef = DataRef & { fetched: string };

export interface RealFact {
  id: string;
  /** What it is, in plain words. */
  what: string;
  /** The real value. */
  value: string;
  /** How the game uses it. */
  usedFor: string;
  ref: DatedDataRef;
}

export const RAD_STORM: DatedDataRef = {
  value: "8.1 mGy",
  label: "A Mars rover (Curiosity) measured this solar storm on 20 May 2024",
  url: "https://www.jpl.nasa.gov/news/nasa-watches-mars-light-up-during-epic-solar-storm/",
  mode: "constant",
  fetched: CHECKED_AT,
};

export const RAD_BASELINE: DatedDataRef = {
  value: "0.21 mGy per day",
  label:
    "Curiosity's radiation detector, first measurements on the Mars surface (Hassler et al., Science 2014)",
  url: "https://doi.org/10.1126/science.1244797",
  mode: "constant",
  fetched: CHECKED_AT,
};

export const INSIGHT_DUST: DatedDataRef = {
  label: "NASA's InSight lander lost power when a dust storm darkened its sky",
  url: "https://www.jpl.nasa.gov/news/nasas-insight-waits-out-dust-storm/",
  mode: "constant",
  fetched: CHECKED_AT,
};

export const LIGHT_DELAY: DatedDataRef = {
  label:
    "Worked out from the Earth–Mars distance (55 to 401 million km, NASA fact sheet) and the speed of light: 3 to 22 minutes",
  url: "https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html",
  mode: "constant",
  fetched: CHECKED_AT,
};

export const DONKI_CME_MAY20: DatedDataRef = {
  label:
    "NASA's space weather database (DONKI): the 20 May 2024 solar eruption",
  url: "https://ccmc.gsfc.nasa.gov/DONKI/view/CME/31034/-1",
  mode: "snapshot",
  fetched: SNAPSHOT_DATES.cmeMay2024,
};

export const DONKI_ENLIL_MAY23: DatedDataRef = {
  // Kid chip text: no dataset names here (the Data Sources facts name DONKI WSA-Enlil).
  label:
    "NASA's space weather forecast: a storm cloud of 23 May 2024 was forecast to brush past Mars on 28 May",
  url: "https://ccmc.gsfc.nasa.gov/DONKI/view/WSA-ENLIL/31103/-1",
  mode: "snapshot",
  fetched: SNAPSHOT_DATES.may2024,
};

/** Earth's answer = storm-cloud forecast (real, DONKI) + dust forecast (game number). */
export const earthAnswerRef = (cloud: DataRef): DataRef => ({
  ...cloud,
  label: `Storm-cloud forecast: ${cloud.label}. The dust forecast is a game number.`,
});

export const REAL_FACTS: RealFact[] = [
  {
    id: "burst",
    what: "Radiation from the 20 May 2024 solar storm, measured on Mars",
    value: `${RAD_STORM.value} (8,100 micrograys) absorbed dose from one storm`,
    usedFor: "How much the space-ray meter jumps in a particle burst",
    ref: RAD_STORM,
  },
  {
    id: "baseline",
    what: "Normal radiation on the Mars surface",
    value: `${RAD_BASELINE.value} absorbed (0.64 mSv per day dose equivalent)`,
    usedFor:
      "The normal daily rise of the space-ray meter. (We do not compare it with the 2024 storm: different years and series.)",
    ref: RAD_BASELINE,
  },
  {
    id: "burst-speed",
    what: "How fast the burst arrived",
    value: "Tens of minutes after the eruption",
    usedFor: "Why Earth cannot warn you about a particle burst",
    ref: RAD_STORM,
  },
  {
    id: "dust",
    what: "Dust on solar panels",
    value:
      "A 2022 dust storm cut InSight's power from 425 to 275 watt-hours per sol (about one third less)",
    usedFor: "Stand-in for dusty panels: skipping panel cleaning lowers tomorrow's power by about a third (in the real storm the dusty sky, not the panels, cut the power)",
    ref: INSIGHT_DUST,
  },
  {
    id: "delay",
    what: "Earth–Mars message delay",
    value: "3 to 22 minutes one way, depending on where the planets are",
    usedFor:
      "Ask Earth: the message arrives fast, but scientists need the night to study it",
    ref: LIGHT_DELAY,
  },
  {
    id: "cme",
    what: "The 20 May 2024 eruption in NASA's DONKI database",
    value:
      "CME 2024-05-20T05:36Z, about 1,900 to 2,700 km/s, from the far side of the Sun (the side facing away from Earth), scientists think",
    usedFor: "The storm on sol 2 of the main mission",
    ref: DONKI_CME_MAY20,
  },
  {
    id: "forecast",
    what: "A storm cloud forecast to hit Mars",
    value:
      "CME of 23 May 2024, forecast to brush past Mars on 28 May 2024 around 11:30 UTC",
    usedFor: "What Earth's answer tells you: a storm cloud is coming",
    ref: DONKI_ENLIL_MAY23,
  },
];

/**
 * Things the game invents or simplifies, as en.json keys (simplifies.*) so BG can translate them.
 * Shown on the "What this game simplifies" card.
 */
export const SIMPLIFICATION_KEYS = [
  "simplifies.crew",
  "simplifies.sols",
  "simplifies.costs",
  "simplifies.dose",
  "simplifies.forecast",
  "simplifies.dates",
  "simplifies.storms",
  "simplifies.sites",
  "simplifies.moon",
  "simplifies.risk",
  "simplifies.rover",
  "simplifies.real",
] as const;
