import { create } from "zustand";
import { DEMO_START } from "../data/demo";
import { readFlags } from "../data/flags";
import { act, createGame, step } from "../sim/engine";
import type { Action, Domino, GameState, Plan } from "../sim/types";
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
  /** One beat choice (site, dilemma, radio …), through the engine. */
  choose: (action: Action) => GameState;
  /** New game from the same start (Start mission, Try a different plan). */
  reset: () => void;
}

/** Use the loaded scenario when available; the URL fallback also covers a very fast Start click. */
const createMissionGame = (): GameState => {
  const setup = useMission.getState().setup;
  const initialState =
    setup?.initialState ?? (readFlags().demo ? DEMO_START : undefined);
  // The classic mission keeps the engine's default rules; campaigns bring their own.
  const state = createGame(setup && setup.campaignId !== "classic" ? setup.rules : undefined);
  return { ...state, ...initialState };
};

export const useGame = create<GameStore>()((set, get) => ({
  state: createMissionGame(),
  fell: [],
  endSol: (plan) => {
    // Mission data is loaded independently at startup. Keeping these fallbacks here
    // lets the game remain playable if a player advances before that load finishes.
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
  choose: (action) => {
    const { state } = act(get().state, action, useMission.getState().setup?.events ?? []);
    set({ state });
    return state;
  },
  reset: () => set({ state: createMissionGame(), fell: [] }),
}));
