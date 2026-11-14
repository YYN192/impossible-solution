import { create } from "zustand";
import { createGame, step } from "../sim/engine";
import type { Domino, GameState, Plan } from "../sim/types";
import { useMission } from "./mission";

/**
 * The running game: the engine's GameState plus what fell last night (for the morning report).
 * The engine (src/sim/engine.ts) does the rules; this store only holds the result between screens.
 */
interface GameStore {
  state: GameState;
  /** Dominoes from the last step (StepResult.fell): what the next morning report shows first. */
  fell: Domino[];
  /** Run one sol with `plan` and the mission's storm events / Earth's forecasts. */
  endSol: (plan: Plan) => GameState;
  /** New game from the same start (Start mission, Try a different plan). */
  reset: () => void;
}

export const useGame = create<GameStore>()((set, get) => ({
  state: createGame(),
  fell: [],
  endSol: (plan) => {
    const setup = useMission.getState().setup;
    const { state, fell } = step(
      get().state,
      plan,
      setup?.events ?? [],
      setup?.forecasts,
    );
    set({ state, fell });
    return state;
  },
  reset: () => set({ state: createGame(), fell: [] }),
}));
