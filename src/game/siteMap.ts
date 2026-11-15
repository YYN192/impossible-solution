import type { Campaign, Place } from "../sim/campaign";
import { isOpen } from "../state/progress";
import type { Point } from "./world";

/** locked: finish `unlockAfter` first · open: can be played from the menu · done: finished · here: being played now. */
export type SiteState = "locked" | "open" | "done" | "here";
export interface MapSite {
  /** The campaign id; its name is `campaign.{id}.name`. */
  id: string;
  place: Place;
  state: SiteState;
  unlockAfter?: string;
  /** Where the marker sits on its place's map panel, in % of the panel. A picture, not real coordinates. */
  at: Point;
}

const AT: Record<string, Point> = { storm: { x: 34, y: 58 }, dust: { x: 68, y: 34 }, moon: { x: 50, y: 62 } };
/** The base on Mars, shown on its own when no site is "here" (the quick mission is not a menu site). */
export const BASE_AT: Point = { x: 50, y: 82 };

/** Every menu mission as a map site, in menu order. */
export function mapSites(campaigns: readonly Campaign[], progress: { done: string[]; teacher: boolean }, current?: string): MapSite[] {
  return campaigns.map((c) => ({
    id: c.id, place: c.place, unlockAfter: c.unlockAfter, at: AT[c.id] ?? { x: 50, y: 50 },
    state: c.id === current ? "here" : progress.done.includes(c.id) ? "done" : isOpen(c, progress) ? "open" : "locked",
  }));
}

/** #106: a base you can fast-travel to from the airlock: open or done. Not locked, and not the one you are on. */
export const canTravel = (s: MapSite) => s.state === "open" || s.state === "done";
