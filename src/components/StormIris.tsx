import { useId, useLayoutEffect, useState, type CSSProperties, type RefObject } from "react";
import { createPortal } from "react-dom";
import { STORM_CLOSE_MS, STORM_SHAKE_MS } from "../game/useStormTimer";
import type { Point } from "../game/world";
import { MARS_BASE } from "../game/world";

/** A top-level pixel iris: the hole closes on the astronaut, not the room's center. */
export function StormIris({ canvas, player }: { canvas: RefObject<HTMLCanvasElement | null>; player: RefObject<Point> }) {
  const mask = useId();
  const [spot, setSpot] = useState({ x: 0, y: 0, radius: 0 });
  useLayoutEffect(() => {
    const measure = () => {
      const rect = canvas.current?.getBoundingClientRect();
      if (!rect) return;
      const x = rect.left + player.current.x / MARS_BASE.width * rect.width;
      const y = rect.top + (player.current.y - 12) / MARS_BASE.height * rect.height;
      setSpot({ x, y, radius: Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y)) });
    };
    measure(); window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [canvas, player]);
  return createPortal(<div className="storm-iris" aria-hidden="true" style={{
    "--iris-radius": `${spot.radius}px`, "--iris-delay": `${STORM_SHAKE_MS}ms`, "--iris-duration": `${STORM_CLOSE_MS}ms`,
  } as CSSProperties}>
    <svg width="100%" height="100%">
      <defs><mask id={mask} maskUnits="userSpaceOnUse" x="0" y="0" width="100%" height="100%">
        <rect width="100%" height="100%" fill="white" />
        <circle className="storm-iris-hole" cx={spot.x} cy={spot.y} r={spot.radius} fill="black" />
      </mask></defs>
      <rect width="100%" height="100%" fill="black" mask={`url(#${mask})`} />
    </svg>
  </div>, document.body);
}
