import { ENGINE } from "../sim/engine";
import { DOSE, JOBS, MISSION_SOLS, NIGHT, type JobId } from "../sim/types";
import { DEMO_START } from "./demo";

export type GameNumberKey =
  "dataSources.gameNumberItems.jobPower" | "dataSources.gameNumberItems.value";

type GameNumberName =
  | "jobPower"
  | "missionSols"
  | "nightAirPower"
  | "nightAirLoss"
  | "nightSolarPower"
  | "doseNormal"
  | "doseOutsideExtra"
  | "doseBurstOutside"
  | "doseBurstInside"
  | "doseShelterFactor"
  | "startAir"
  | "startFood"
  | "dustFactor"
  | "lowPowerThreshold"
  | "shelterSols"
  | "cloudDoseInside"
  | "cloudDoseOutside"
  | "safeDoseLimit"
  | "scienceGoal"
  | "foodGain"
  | "foodLoss"
  | "scienceGain"
  | "demoStartFood"
  | "demoStartPanels";

export interface GameNumberDescriptor {
  /** Stable DOM/test identifier; do not derive this from translated copy. */
  id: string;
  labelKey: GameNumberKey;
  nameKey: `dataSources.gameNumberNames.${GameNumberName}`;
  value: string | number;
  jobId?: JobId;
}

const jobs = Object.entries(JOBS) as [JobId, (typeof JOBS)[JobId]][];

/**
 * Player-facing invented or rounded mechanics, kept next to their engine constants.
 * Adding a mechanic here automatically adds it to the Data Sources screen and its
 * exhaustive rendering test. Real measurements remain in REAL_FACTS instead.
 */
export const GAME_NUMBERS: GameNumberDescriptor[] = [
  ...jobs.map(([jobId, job]) => ({
    id: `job-power-${jobId}`,
    labelKey: "dataSources.gameNumberItems.jobPower" as const,
    nameKey: "dataSources.gameNumberNames.jobPower" as const,
    value: job.powerCost,
    jobId,
  })),
  value("mission-sols", "missionSols", MISSION_SOLS),
  value("night-air-power", "nightAirPower", NIGHT.airMachinePower),
  value("night-air-loss", "nightAirLoss", NIGHT.airLossWithoutPower),
  value(
    "night-solar-power",
    "nightSolarPower",
    NIGHT.solarPowerAtFullEfficiency,
  ),
  value("dose-normal", "doseNormal", DOSE.normalDay),
  value("dose-outside-extra", "doseOutsideExtra", DOSE.outsideExtra),
  value("dose-burst-outside", "doseBurstOutside", DOSE.burstOutside),
  value("dose-burst-inside", "doseBurstInside", DOSE.burstInside),
  value("dose-shelter-factor", "doseShelterFactor", DOSE.shelterFactor),
  value("start-air", "startAir", ENGINE.startAir),
  value("start-food", "startFood", ENGINE.startFood),
  value("dust-factor", "dustFactor", ENGINE.dustFactor),
  value("low-power-threshold", "lowPowerThreshold", ENGINE.lowPowerToday),
  value("shelter-sols", "shelterSols", ENGINE.shelterSols),
  value("cloud-dose-inside", "cloudDoseInside", ENGINE.cloudInside),
  value("cloud-dose-outside", "cloudDoseOutside", ENGINE.cloudOutside),
  value("safe-dose-limit", "safeDoseLimit", ENGINE.doseLimit),
  value("science-goal", "scienceGoal", ENGINE.scienceGoal),
  value("food-gain", "foodGain", ENGINE.foodGain),
  value("food-loss", "foodLoss", ENGINE.foodLoss),
  value("science-gain", "scienceGain", ENGINE.scienceGain),
  value("demo-start-food", "demoStartFood", DEMO_START.food),
  value("demo-start-panels", "demoStartPanels", DEMO_START.panelEfficiency),
];

function value(
  id: string,
  name: GameNumberName,
  amount: number,
): GameNumberDescriptor {
  return {
    id,
    labelKey: "dataSources.gameNumberItems.value",
    nameKey: `dataSources.gameNumberNames.${name}`,
    value: amount,
  };
}
