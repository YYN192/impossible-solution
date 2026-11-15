import { create } from "zustand";
import type { Campaign } from "../sim/campaign";
import { readFlags } from "../data/flags";

/**
 * Which campaigns this player has finished (localStorage; in memory only if storage is blocked),
 * and teacher mode, which opens every campaign for a class.
 */
export const DONE_KEY = "sol:done";
export const TEACHER_KEY = "sol:teacher";

const read = <T,>(key: string, fallback: T): T => {
  try {
    return (JSON.parse(localStorage.getItem(key) ?? "null") as T) ?? fallback;
  } catch {
    return fallback;
  }
};
const write = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage blocked: keep it for this visit only.
  }
};

interface Progress {
  done: string[];
  teacher: boolean;
  finish: (campaignId: string) => void;
  setTeacher: (on: boolean) => void;
}

export const useProgress = create<Progress>()((set, get) => ({
  done: read<string[]>(DONE_KEY, []),
  teacher: readFlags().teacher === true || read<boolean>(TEACHER_KEY, false),
  finish: (id) => {
    if (get().done.includes(id)) return;
    const done = [...get().done, id];
    set({ done });
    write(DONE_KEY, done);
  },
  setTeacher: (teacher) => {
    set({ teacher });
    write(TEACHER_KEY, teacher);
  },
}));

export const isOpen = (c: Campaign, p: Pick<Progress, "done" | "teacher">): boolean =>
  p.teacher || !c.unlockAfter || p.done.includes(c.unlockAfter);

