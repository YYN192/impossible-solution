/**
 * Every real number in the game, with its source. Single source of truth for the
 * Data Sources screen, the chips in the game, and CREDITS.md.
 * Verified by the science-checker agent on Sat 14 Nov 2026.
 */
import type { DataRef } from "../sim/types";

export interface RealFact {
  id: string;
  /** What it is, in plain words. */
  what: string;
  /** The real value. */
  value: string;
  /** How the game uses it. */
  usedFor: string;
  ref: DataRef;
}

export const RAD_STORM: DataRef = {
  label: "A Mars rover (Curiosity) measured this solar storm on 20 May 2024",
  url: "https://www.jpl.nasa.gov/news/nasa-watches-mars-light-up-during-epic-solar-storm/",
  mode: "constant",
};

export const RAD_BASELINE: DataRef = {
  label: "Curiosity's radiation detector, first measurements on the Mars surface (Hassler et al., Science 2014)",
  url: "https://doi.org/10.1126/science.1244797",
  mode: "constant",
};

export const INSIGHT_DUST: DataRef = {
  label: "NASA's InSight lander lost power when dust covered its solar panels",
  url: "https://www.jpl.nasa.gov/news/nasas-insight-waits-out-dust-storm/",
  mode: "constant",
};

export const LIGHT_DELAY: DataRef = {
  label: "Radio signals take 3 to 22 minutes between Earth and Mars",
  url: "https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html",
  mode: "constant",
};

export const DONKI_CME_MAY20: DataRef = {
  label: "NASA's space weather database (DONKI): the 20 May 2024 solar eruption",
  url: "https://ccmc.gsfc.nasa.gov/DONKI/view/CME/31034/-1",
  mode: "snapshot",
};

export const DONKI_ENLIL_MAY23: DataRef = {
  label: "NASA's space weather forecast (DONKI WSA-Enlil): a storm cloud of 23 May 2024 was forecast to reach Mars on 28 May",
  url: "https://kauai.ccmc.gsfc.nasa.gov/DONKI/WS/get/WSAEnlilSimulations?startDate=2024-05-19&endDate=2024-05-24",
  mode: "snapshot",
};

export const REAL_FACTS: RealFact[] = [
  {
    id: "burst",
    what: "Radiation from the 20 May 2024 solar storm, measured on Mars",
    value: "8.1 mGy (milligray) absorbed dose, about one day",
    usedFor: "How much the space-ray meter jumps in a particle burst",
    ref: RAD_STORM,
  },
  {
    id: "baseline",
    what: "Normal radiation on the Mars surface",
    value: "0.21 mGy per day absorbed (0.64 mSv per day dose equivalent)",
    usedFor: "The normal daily rise of the space-ray meter. The burst is about 39 normal days at once.",
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
    value: "A 2022 dust storm cut InSight's power from 425 to 275 watt-hours per sol (about one third less)",
    usedFor: "Skipping panel cleaning lowers tomorrow's power by about a third",
    ref: INSIGHT_DUST,
  },
  {
    id: "delay",
    what: "Earth–Mars message delay",
    value: "3 to 22 minutes one way, depending on where the planets are",
    usedFor: "Ask Earth: the message arrives fast, but scientists need the night to study it",
    ref: LIGHT_DELAY,
  },
  {
    id: "cme",
    what: "The 20 May 2024 eruption in NASA's DONKI database",
    value: "CME 2024-05-20T05:36Z, about 1,900 km/s, from the far side of the Sun",
    usedFor: "The storm on sol 2 of the main mission",
    ref: DONKI_CME_MAY20,
  },
  {
    id: "forecast",
    what: "A storm cloud forecast to hit Mars",
    value: "CME of 23 May 2024, forecast arrival at Mars 28 May 2024 11:30 UTC",
    usedFor: "What Earth's answer tells you: a storm cloud is coming",
    ref: DONKI_ENLIL_MAY23,
  },
];

/** Things the game invents or simplifies. Shown on the "What this game simplifies" card. */
export const SIMPLIFICATIONS: string[] = [
  "A real base would have more than 3 astronauts and many more jobs.",
  "Our sols are short rounds. Real storm clouds take several days to reach Mars; we squeeze that into a sol or two.",
  "Job costs (power, food, the size of each bar) are game numbers we chose so the game is fair and fun.",
  "The space-ray meter uses game units. The size of a storm compared with a normal day is real.",
  "Real: the 20 May 2024 storm, normal Mars radiation, the dust effect on solar panels, and the message delay.",
];
