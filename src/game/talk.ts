/** Crew talks in the hub: who has which answers and which practice game, plus the pure rules of those games. */
export type Speaker =
  "commander" | "engineer" | "scientist" | "drone" | "airlock" | "greenhouse" | "radar";
export type Drill = "jobs" | "power" | "grow" | "shelter";

/** Crew members have a menu of answers and one practice game; places (airlock, greenhouse) just talk. */
export const DRILL: Partial<Record<Speaker, Drill>> = {
  commander: "jobs",
  engineer: "power",
  scientist: "grow",
  drone: "shelter",
};

export const PORTRAIT: Record<Speaker, string> = {
  commander: "characters/npcs/mission-commander-portrait",
  engineer: "characters/npcs/engineer-portrait",
  scientist: "characters/npcs/scientist-portrait",
  drone: "characters/robots/assistant-drone-portrait",
  airlock: "consoles/mission-monitor",
  greenhouse: "characters/npcs/scientist-portrait",
  radar: "consoles/radar", // the radar opens its space weather strip (#60); listed so every station object can talk
};

/** Typewriter: how many letters show after `ms` at `cps` letters per second. */
export const lettersShown = (text: string, ms: number, cps = 40) =>
  Math.min(text.length, Math.floor((ms * cps) / 1000));

// Commander: 3 crew, 4 jobs. Whatever you pick, one job waits — that is the trade-off.
export const JOBS = ["panels", "greenhouse", "shelter", "science"] as const;
export const CREW = 3;
export const toggleJob = (picked: string[], job: string) =>
  picked.includes(job)
    ? picked.filter((j) => j !== job)
    : picked.length < CREW
      ? [...picked, job]
      : picked;

// Engineer: 2 power cells, 3 machines. The air machine must stay on.
export const MACHINES = ["air", "lamp", "radio"] as const;
export const CELLS = 2;
export const powerResult = (on: string[]) =>
  on.length < CELLS ? "more" : on.includes("air") ? "ok" : "noAir";

// Scientist: the sprout needs water, then light, again and again (5 steps to harvest).
export const GROW_STEPS = 5;
export const growNeed = (stage: number): "water" | "light" =>
  stage % 2 === 0 ? "water" : "light";

// Drone: stack shelter blocks before the space rays arrive. Each block lowers the dose.
export const BLOCKS = 4;
export const SHELTER_SECONDS = 12;
