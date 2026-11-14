import { create } from "zustand";
import { MISSION_SOLS } from "../sim/types";
import { useGame } from "./game";

/**
 * Which screen is showing. The game itself (bars, dominoes, sol results) lives in the
 * engine's GameState, held by useGame (./game.ts); this store only handles navigation.
 * Every way into sol 1 (Start mission, Try a different plan) starts a fresh game.
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
  next: () =>
    set((s) => {
      const to = nextNav(s);
      // The title and final screen both enter a new run through morning 1.
      // Reset here—not in home()—so returning home preserves the completed run
      // until the player explicitly starts again.
      if (to.screen === "morning" && to.sol === 1) useGame.getState().reset();
      return to;
    }),
  restart: () => {
    useGame.getState().reset();
    set({ screen: "morning", sol: 1 });
  },
  home: () => set(START),
  endEarly: () => set({ screen: "final" }),
}));
