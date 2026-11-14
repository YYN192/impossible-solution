import { create } from "zustand";

/**
 * Best star count so far ("Best: 2★"). Kept in localStorage so it survives a reload; if storage
 * is blocked (private window, school laptop policy) it just lasts for this visit.
 */
export const BEST_KEY = "impossible-solution.best";

function readBest(): number {
  try {
    const n = Number(localStorage.getItem(BEST_KEY));
    return Number.isInteger(n) && n >= 0 && n <= 3 ? n : 0;
  } catch {
    return 0;
  }
}

interface BestStore {
  best: number;
  /** Record a finished mission; keeps the higher of the two. */
  record: (stars: number) => void;
}

export const useBest = create<BestStore>()((set, get) => ({
  best: readBest(),
  record: (stars) => {
    if (stars <= get().best) return;
    set({ best: stars });
    try {
      localStorage.setItem(BEST_KEY, String(stars));
    } catch {
      // Storage blocked: keep it in memory only.
    }
  },
}));
