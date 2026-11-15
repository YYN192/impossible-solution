import { ENGINE } from "../sim/engine";
import { WIPE_PANELS } from "../sim/campaign";
import { EXPLORE } from "../sim/explore";
import { DOSE, JOBS, MISSION_SOLS, NIGHT, type JobId } from "../sim/types";
import { CAMPAIGN_NUMBERS } from "./campaigns";
import { DEMO_START } from "./demo";
import { STORM_CHANCE } from "./hubStorm";

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
  | "nightAirGain"
  | "airReady"
  | "meterMax"
  | "smallStormFactor"
  | "moonStormFactor"
  | "skillAskEarth"
  | "skillPanels"
  | "skillGreenhouse"
  | "roverBattery"
  | "roverBatteryPerPower"
  | "roverMaxScience"
  | "demoStartFood"
  | "demoStartPanels"
  | "dustStormChance"
  | "stormPanelsDose"
  | "stormGreenhousePower"
  | "wipePanels"
  | "dustStormSols"
  | "opportunitySolar"
  | "heaterPowerDust"
  | "heaterPowerGale"
  | "shadowDaySolar";

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
  value("night-air-gain", "nightAirGain", NIGHT.airGainWithPower),
  value("air-ready", "airReady", ENGINE.airReady),
  value("meter-max", "meterMax", DOSE.meterMax),
  value("small-storm-factor", "smallStormFactor", CAMPAIGN_NUMBERS.SMALL_STORM_FACTOR),
  value("moon-storm-factor", "moonStormFactor", CAMPAIGN_NUMBERS.MOON_STORM_FACTOR),
  value("skill-ask-earth", "skillAskEarth", ENGINE.skill.askEarthCost),
  value("skill-panels", "skillPanels", ENGINE.skill.panelsPower),
  value("skill-greenhouse", "skillGreenhouse", ENGINE.skill.greenhouseFood),
  value("rover-battery", "roverBattery", EXPLORE.battery),
  value("rover-battery-per-power", "roverBatteryPerPower", EXPLORE.batteryPerPower),
  value("rover-max-science", "roverMaxScience", EXPLORE.maxScience),
  value("demo-start-food", "demoStartFood", DEMO_START.food),
  value("demo-start-panels", "demoStartPanels", DEMO_START.panelEfficiency),
  value("dust-storm-chance", "dustStormChance", STORM_CHANCE),
  value("storm-panels-dose", "stormPanelsDose", DOSE.outsideExtra),
  value("storm-greenhouse-power", "stormGreenhousePower", 1),
  value("wipe-panels", "wipePanels", WIPE_PANELS),
  value("dust-storm-sols", "dustStormSols", CAMPAIGN_NUMBERS.DUST_STORM_SOLS),
  value("opportunity-solar", "opportunitySolar", CAMPAIGN_NUMBERS.OPPORTUNITY_SOLAR),
  value("heater-power-dust", "heaterPowerDust", CAMPAIGN_NUMBERS.HEATER_POWER.dust),
  value("heater-power-gale", "heaterPowerGale", CAMPAIGN_NUMBERS.HEATER_POWER.gale),
  value("shadow-day-solar", "shadowDaySolar", CAMPAIGN_NUMBERS.SHADOW_DAY_SOLAR),
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
