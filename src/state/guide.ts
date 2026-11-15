import { create } from "zustand";
import { readFlags } from "../data/flags";
import type { Guide } from "../game/guide";

/** Saved once the first-play guide has run (or the player hid it): it never comes back on its own. */
export const GUIDE_KEY = "sol:guide";

function seen(): boolean {
  try {
    return JSON.parse(localStorage.getItem(GUIDE_KEY) ?? "{}").done === true;
  } catch {
    return false;
  }
}

/**
 * The first-play guide (#64): on for a new player, teaching sol 1. Off in the recorded demo (?demo=1)
 * and in unit tests (they turn it on themselves). "? How to play" hides it or replays it.
 */
export const useGuide = create<Guide>(() => ({
  on: !seen() && !readFlags().demo && import.meta.env.MODE !== "test",
  sol: 1,
}));

useGuide.subscribe((g, before) => {
  if (before.on && !g.on) {
    try { localStorage.setItem(GUIDE_KEY, JSON.stringify({ done: true })); } catch { /* private window: off for this visit only */ }
  }
});
