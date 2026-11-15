import { useEffect, useRef, useState } from "react";
import { useGame } from "../state/game";
import { audio } from "./audio";
import { shake } from "./feedback";

export const STORM_SECONDS = 30;
export const STORM_SHAKE_MS = 350;
export const STORM_CLOSE_MS = 1800;
export const STORM_RETRY_MS = STORM_SHAKE_MS + STORM_CLOSE_MS + 150;

/** One clock for the room and both repair dialogs. No ticking in a hidden tab. */
export function useStormTimer(active: boolean, briefing: boolean, sol: number, onFail: () => void) {
  const [seconds, setSeconds] = useState(STORM_SECONDS);
  const [failing, setFailing] = useState(false);
  const callback = useRef(onFail);
  useEffect(() => { callback.current = onFail; }, [onFail]);
  const checkpoint = useRef(useGame.getState().state);
  const remaining = useRef(STORM_SECONDS * 1000);
  useEffect(() => {
    const store = useGame.getState();
    checkpoint.current = store.stormCheckpoint?.sol === sol ? store.stormCheckpoint : store.state;
    if (active && store.stormCheckpoint?.sol !== sol) useGame.setState({ stormCheckpoint: checkpoint.current });
    remaining.current = STORM_SECONDS * 1000;
    // A new sol resets this visit’s clock.
    // eslint-disable-next-line react/set-state-in-effect
    setSeconds(STORM_SECONDS);
    setFailing(false);
  }, [sol, active]);

  useEffect(() => {
    if (!active || briefing || failing) return;
    let last = performance.now();
    const visibility = () => { last = performance.now(); };
    document.addEventListener("visibilitychange", visibility);
    const clock = setInterval(() => {
      const now = performance.now();
      if (!document.hidden) remaining.current = Math.max(0, remaining.current - (now - last));
      last = now;
      setSeconds(Math.ceil(remaining.current / 1000));
      if (remaining.current === 0) {
        clearInterval(clock);
        setFailing(true);
      }
    }, 100);
    return () => { clearInterval(clock); document.removeEventListener("visibilitychange", visibility); };
  }, [active, briefing, failing, sol]);

  useEffect(() => {
    if (!failing) return;
    const release = audio.holdMusic(); // stop now; release starts the storm track from its beginning
    callback.current();
    audio.playSfx("mission-failure");
    shake();
    const retry = setTimeout(() => {
      // Restore only once the iris is fully black, hiding the repair reset.
      useGame.setState({ state: checkpoint.current });
      remaining.current = STORM_SECONDS * 1000;
      setSeconds(STORM_SECONDS);
      setFailing(false);
    }, STORM_RETRY_MS);
    return () => { clearTimeout(retry); release(); };
  }, [failing]);
  return { seconds, failing };
}
