/** The Engineering bay graphs: pure bar data from numbers that are already sourced in this repo. */
import type { DataRef } from "../sim/types";
import { REMS_NIGHT } from "./campaigns";
import { INSIGHT_DUST, RAD_STORM } from "./sources";

export const MAX_CELLS = 12;
export interface Bar {
  id: string;
  value: number;
  unit: string;
  cells: number;
  tone: "sun" | "dust" | "cold" | "ice" | "calm" | "storm";
}
export interface Graph {
  id: "power" | "cold" | "rays";
  source: DataRef;
  bars: Bar[];
}

/** InSight's power in October 2022: the same numbers as the dust storm event in campaigns.ts (425 and 275 Wh a sol). */
const INSIGHT_CLEAN_WH = 425,
  INSIGHT_DUSTY_WH = 275;
/** REMS_NIGHT is "−71 °C"; 0 °C is where water freezes (a physical constant). */
const NIGHT_C = -71,
  ICE_C = 0;
/** RAD_BASELINE "0.21 mGy per day" and RAD_STORM "8.1 mGy" (the whole 20 May 2024 storm). */
const RAD_DAY_MGY = 0.21,
  RAD_STORM_MGY = 8.1;

/** Bar length in whole blocks: at least 1 for any real value, the biggest bar is MAX_CELLS. */
export const cellsFor = (value: number, max: number) =>
  value === 0
    ? 0
    : Math.max(1, Math.round((Math.abs(value) / max) * MAX_CELLS));

export function engineeringGraphs(): Graph[] {
  const bar = (
    id: string,
    value: number,
    unit: string,
    max: number,
    tone: Bar["tone"],
  ): Bar => ({ id, value, unit, cells: cellsFor(value, max), tone });
  return [
    {
      id: "power",
      source: INSIGHT_DUST,
      bars: [
        bar("clean", INSIGHT_CLEAN_WH, "Wh", INSIGHT_CLEAN_WH, "sun"),
        bar("dusty", INSIGHT_DUSTY_WH, "Wh", INSIGHT_CLEAN_WH, "dust"),
      ],
    },
    {
      id: "cold",
      source: REMS_NIGHT,
      bars: [
        bar("ice", ICE_C, "°C", Math.abs(NIGHT_C), "ice"),
        bar("night", NIGHT_C, "°C", Math.abs(NIGHT_C), "cold"),
      ],
    },
    {
      id: "rays",
      source: RAD_STORM,
      bars: [
        bar("day", RAD_DAY_MGY, "mGy", RAD_STORM_MGY, "calm"),
        bar("storm", RAD_STORM_MGY, "mGy", RAD_STORM_MGY, "storm"),
      ],
    },
  ];
}
