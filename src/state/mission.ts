import { create } from "zustand";
import { readFlags, type Flags } from "../data/flags";
import { getMissionSetup, type MissionSetup } from "../data/mission";

/**
 * The mission for this game: storm events + Earth's forecasts + where the data came from.
 * Loaded once at startup from the data layer (?demo=1, ?offline=1, ?sun=today).
 * Engine: step(state, plan, useMission.getState().setup!.events)
 */
interface MissionStore {
  status: "idle" | "loading" | "ready";
  setup?: MissionSetup;
  load: (flags?: Flags) => Promise<void>;
}

let inflight: Promise<void> | undefined;

export const useMission = create<MissionStore>()((set, get) => ({
  status: "idle",
  setup: undefined,
  load: (flags = readFlags()) => {
    if (get().status === "ready") return Promise.resolve();
    if (get().status === "loading" && inflight) return inflight;
    set({ status: "loading" });
    inflight = getMissionSetup(flags).then((setup) => {
      set({ status: "ready", setup });
      inflight = undefined;
    });
    return inflight;
  },
}));
