import { create } from "zustand";
import { MISSION_SOLS } from "../sim/types";

/**
 * Which screen is showing. The game itself (bars, dominoes, sol results) lives in the
 * engine's GameState (src/sim/); this store only handles navigation.
 *
 * Flow: title → (morning → plan → endSol) × MISSION_SOLS → final → morning sol 1 (same start)
 */
export type Screen = "title" | "morning" | "plan" | "endSol" | "final";

export interface Nav {
  screen: Screen;
  sol: number;
}

export const START: Nav = { screen: "title", sol: 1 };

/** Pure: the screen after `nav` when the player presses the main button. */
export function nextNav({ screen, sol }: Nav, totalSols = MISSION_SOLS): Nav {
  switch (screen) {
    case "title":
      return { screen: "morning", sol: 1 };
    case "morning":
      return { screen: "plan", sol };
    case "plan":
      return { screen: "endSol", sol };
    case "endSol":
      return sol >= totalSols
        ? { screen: "final", sol }
        : { screen: "morning", sol: sol + 1 };
    case "final":
      return { screen: "morning", sol: 1 };
  }
}

interface NavStore extends Nav {
  /** Main button: go to the next screen in the loop. */
  next: () => void;
  /** "Try a different plan": back to sol 1 morning (same start). */
  restart: () => void;
  /** Back to the title screen. */
  home: () => void;
  /** End the mission early (e.g. a bar hit 0): straight to the final chain. */
  endEarly: () => void;
}

export const useNav = create<NavStore>()((set) => ({
  ...START,
  next: () => set((s) => nextNav(s)),
  restart: () => set({ screen: "morning", sol: 1 }),
  home: () => set(START),
  endEarly: () => set({ screen: "final" }),
}));
