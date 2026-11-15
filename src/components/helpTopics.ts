import type { HelpTopic } from "./WhatsThis";

/**
 * Which "What's this?" tooltip explains a fallen domino. Keys are the engine's
 * Domino.textKey values (domino.* in en.json). Unknown keys get no tooltip.
 */
const BY_DOMINO: Record<string, HelpTopic> = {
  "domino.panelsSkipped": "dust",
  "domino.powerLow": "power",
  "domino.airLow": "air",
  "domino.foodEmpty": "food",
  "domino.greenhouseSkipped": "food",
  "domino.crewTired": "food",
  "domino.doseHigh": "dose",
  "domino.shelterSkipped": "dose",
  "domino.noPowerGreenhouse": "power",
  "domino.noPowerShelter": "power",
  "domino.noPowerAskEarth": "power",
  "domino.outsideStorm": "dose",
  "domino.noSignal": "askEarth",
  "domino.coldNight": "power",
  "domino.doseFull": "dose",
  "domino.roverHome0": "power",
  "domino.roverHome1": "power",
  "domino.roverHome2": "power",
  "domino.roverStranded": "dose",
  "domino.stormPanels": "dust",
  "domino.stormGreenhouse": "food",
};

export function helpTopicForDomino(textKey: string): HelpTopic | undefined {
  return BY_DOMINO[textKey];
}

/** Tooltip for a storm event on the morning report. */
export const helpTopicForEvent = (kind: "particleBurst" | "stormCloud" | "dustStorm"): HelpTopic =>
  kind === "particleBurst" ? "burst" : kind === "stormCloud" ? "stormCloud" : "dust";
