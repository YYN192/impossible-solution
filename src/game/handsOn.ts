/**
 * Mission 1's hands-on moments (#59): the pure rules behind four beats the kid now does with their
 * hands instead of picking a card. Each one ends in one of the beat's existing option ids, so the
 * engine, the balance and the real-data cards stay exactly as they were.
 */

// ---------- Sol 5 "Dust on the panels": rub the dust off ----------

export const WIPE_PANELS = 6;
/** A panel counts as clean at or below this much dust (0 = spotless, 1 = fully dusty). */
export const CLEAN_AT = 0.15;
/** One Space / Enter press on a panel. Three presses clean it. */
export const RUB_KEY = 0.35;

export const startWipe = (): number[] => Array(WIPE_PANELS).fill(1);

/** Rub panel `i`: its dust drops by `amount`, never below 0. Other panels stay as they are. */
export function rub(dust: number[], i: number, amount: number): number[] {
  if (i < 0 || i >= dust.length || amount <= 0) return dust;
  return dust.map((d, j) => (j === i ? Math.max(0, d - amount) : d));
}

/** How much one drag over a panel rubs off: about 2.5 panel widths of rubbing clean a whole panel. */
export const rubFromDrag = (px: number, panelWidth: number) => (px <= 0 || panelWidth <= 0 ? 0 : Math.min(1, px / (panelWidth * 2.5)));

export const cleanCount = (dust: number[]) => dust.filter((d) => d <= CLEAN_AT).length;

/** Going back inside picks the beat option: none (nothing cleaned), half (some) or all (every panel). */
export function wipeChoice(dust: number[]): "none" | "half" | "all" {
  const n = cleanCount(dust);
  return n === 0 ? "none" : n === dust.length ? "all" : "half";
}

// ---------- Sol 2 "Build one upgrade": drag a part onto the base ----------

export type Part = "brush" | "shelf" | "walls";
export type Spot = "panels" | "greenhouse" | "shelter";
/** Where each spare part goes. The part id is the beat option id. */
export const BUILD_SPOT: Record<Part, Spot> = { brush: "panels", shelf: "greenhouse", walls: "shelter" };

export function placePart(part: Part, spot: Spot): { ok: true } | { ok: false; belongs: Spot } {
  return BUILD_SPOT[part] === spot ? { ok: true } : { ok: false, belongs: BUILD_SPOT[part] };
}

// ---------- Sol 3 "Radio Earth": hold to send, then race the signal ----------

/** How long Send must be held to power the dish. */
export const CHARGE_MS = 900;
/** One trip on screen, whatever the real delay: the clock is a time-lapse of the real minutes. */
export const TRIP_MS = 4000;

export const charge = (heldMs: number) => Math.max(0, Math.min(1, heldMs / CHARGE_MS));

/** Signal minutes after `dtMs` more of the time-lapse. Fast-forward runs the clock 3× (light itself never speeds up). */
export const advanceSignal = (minutes: number, dtMs: number, fast: boolean, delayMin: number) =>
  minutes + (Math.max(0, dtMs) / TRIP_MS) * delayMin * (fast ? 3 : 1);

/** What the strip shows: whole minutes on the clock, how far the message has flown, and whether it arrived. */
export function signalView(minutes: number, delayMin: number) {
  const arrived = minutes >= delayMin - 1e-9;
  return { minutes: arrived ? delayMin : Math.floor(minutes), progress: arrived ? 1 : minutes / delayMin, arrived };
}

// ---------- Sol 4 "A cold night": turn the heater dial ----------

/** One arrow key or button press turns the dial all the way: 0° = Off, 180° = On. */
export const dialStep = (dir: 1 | -1) => (dir > 0 ? 180 : 0);

/** On (past halfway) means the heater, which uses power; Off means the crew huddles and eats more. */
export const heaterChoice = (angle: number): "heat" | "huddle" => (angle >= 90 ? "heat" : "huddle");
