import type { JobId } from "../sim/types";
/** Crew talks in the hub: who has which answers, which practice game, and what they say about this mission. */
export type Speaker =
  "commander" | "engineer" | "scientist" | "drone" | "airlock" | "greenhouse" | "radar" | "engineering";

/** Crew members have a menu of answers and one practice game; places (airlock, greenhouse) just talk. */
export const DRILL: Partial<Record<Speaker, JobId>> = {
  commander: "askEarth",
  engineer: "panels",
  scientist: "greenhouse",
  drone: "shelter",
};

export const PORTRAIT: Record<Speaker, string> = {
  commander: "characters/npcs/mission-commander-portrait",
  engineer: "characters/npcs/engineer-portrait",
  scientist: "characters/npcs/scientist-portrait",
  drone: "characters/robots/assistant-drone-portrait",
  airlock: "consoles/mission-monitor",
  greenhouse: "characters/npcs/scientist-portrait",
  engineering: "environment/decorations/mars-shelf", // the shelves open the Engineering bay graphs
  radar: "consoles/radar", // the radar opens its space weather strip (#60); listed so every station object can talk
};

/** Typewriter: how many letters show after `ms` at `cps` letters per second. */
export const lettersShown = (text: string, ms: number, cps = 40) =>
  Math.min(text.length, Math.floor((ms * cps) / 1000));

/** "What is our mission?": each crew member explains the campaign being played from their own job (classic → storm). */
export const missionTalkKey = (speaker: Speaker, campaign?: string) =>
  `talk.${speaker}.mission.${campaign === "dust" || campaign === "moon" ? campaign : "storm"}`;
