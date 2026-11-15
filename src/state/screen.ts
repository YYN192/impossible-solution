import { create } from "zustand";
import { MISSION_SOLS } from "../sim/types";
import { useGame } from "./game";
import { useMission } from "./mission";

/**
 * Which screen is showing. The game itself (bars, dominoes, sol results) lives in the
 * engine's GameState, held by useGame (./game.ts); this store only handles navigation.
 * Every way into sol 1 (Start mission, Try a different plan) starts a fresh game.
 *
 * Flow: title → (morning → [beat] → plan → endSol) × sols → final → morning sol 1 (same start).
 * A beat is the campaign's interaction for that sol (site, dilemma, radio …), when it has one.
 */
export type Screen = "title" | "morning" | "beat" | "plan" | "endSol" | "final";
/** Where the player is: the menu, the walkable station, or the mission console. */
export type Place = "menu" | "hub" | "console";

export interface Nav {
  screen: Screen;
  sol: number;
}

export const START: Nav & { place: Place } = { screen: "title", sol: 1, place: "menu" };

/** The player has got past sol 1's morning, so they know the console (its hub glow can rest, #55). */
export const firstSolStarted = ({ screen, sol }: Nav) => sol > 1 || (screen !== "title" && screen !== "morning");

/** Pure: the screen after `nav` when the player presses the main button. */
export function nextNav(
  { screen, sol }: Nav,
  totalSols = MISSION_SOLS,
  hasBeat: (sol: number) => boolean = () => false,
): Nav {
  switch (screen) {
    case "title":
      return { screen: "morning", sol: 1 };
    case "morning":
      return { screen: hasBeat(sol) ? "beat" : "plan", sol };
    case "beat":
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
  place: Place;
  go: (place: Place) => void;
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
  go: (place) => set({ place }),
  next: () =>
    set((s) => {
      const setup = useMission.getState().setup;
      const to = nextNav(s, setup?.rules.sols, (sol) => Boolean(setup?.beats[sol]));
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
