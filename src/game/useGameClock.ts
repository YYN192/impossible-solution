import { useEffect, useRef, useState } from "react";
import { useComfort } from "../state/comfort";
import { TICK_MS } from "./miniGames";

/**
 * A mini-game's clock (#77, WCAG 2.2.1 timing adjustable): it waits for the first press, can be paused,
 * and runs at half speed with "Slow mini-games" on. `step` runs once per tick; the latest one is used.
 */
export function useGameClock(done: boolean, step: () => void, startNow = false) {
  // startNow: games whose first press is not a move of its own (the shelter's sliding block) run from the start.
  const [started, setStarted] = useState(startNow);
  const [paused, setPaused] = useState(false);
  const slow = useComfort((c) => c.slowMiniGames);
  const latest = useRef(step);
  useEffect(() => { latest.current = step; });
  useEffect(() => {
    if (done || !started || paused) return;
    const clock = setInterval(() => latest.current(), TICK_MS * (slow ? 2 : 1));
    return () => clearInterval(clock);
  }, [done, started, paused, slow]);
  return {
    started,
    paused,
    togglePause: () => setPaused((p) => !p),
    /** Any play: starts the clock the first time and ends a pause. */
    go: () => { setPaused(false); setStarted(true); },
  };
}
