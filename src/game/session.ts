import { create } from "zustand";
import type { Bars, CrewId, JobId, Plan } from "../sim/types";
import type { Facing } from "./assets";

/** UI-only state; the existing engine owns all mission rules and outcomes. */
export const useSession = create<{
  position: { x: number; y: number; facing: Facing };
  draft: Plan;
  /** The numbers when the plan was sent: the end-of-sol screen shows what the night changed (#65). */
  before?: Bars & { food?: number; science?: number };
  assign: (crew: CrewId, job?: JobId) => void;
  clearPlan: () => void;
}>()((set) => ({
  position: { x: 320, y: 280, facing: "back" }, draft: {},
  assign: (crew, job) => set(({ draft }) => {
    const next = { ...draft };
    for (const id of Object.keys(next) as CrewId[])
      if (id === crew || (job && next[id] === job)) delete next[id];
    if (job) next[crew] = job;
    return { draft: next };
  }),
  clearPlan: () => set({ draft: {}, before: undefined }),
}));
