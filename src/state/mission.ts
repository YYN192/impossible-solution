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
  /** Start over with other flags (main menu: "Today's real Sun" / "The May 2024 storm"). */
  reload: (flags?: Flags) => Promise<void>;
}

let inflight: Promise<void> | undefined;

export const useMission = create<MissionStore>()((set, get) => ({
  status: "idle",
  setup: undefined,
  load: (flags = readFlags()) => {
    if (get().status === "ready") return Promise.resolve();
    if (get().status === "loading" && inflight) return inflight;
    set({ status: "loading" });
    const p: Promise<void> = getMissionSetup(flags).then((setup) => {
      if (inflight !== p) return; // a newer choice (menu: which Sun) replaced this load
      set({ status: "ready", setup });
      inflight = undefined;
    });
    inflight = p;
    return p;
  },
  reload: (flags = readFlags()) => {
    inflight = undefined;
    set({ status: "idle", setup: undefined });
    return get().load(flags);
  },
}));
