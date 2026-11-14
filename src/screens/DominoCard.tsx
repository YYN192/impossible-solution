import type { Domino } from "../sim/types";
import { tDynamic } from "../i18n/dynamic";

/**
 * One domino: icon + kid sentence. Reused by the morning report (#13) and the final chain (#14).
 * The icon is decoration for sighted kids; the sentence carries the meaning for screen readers.
 */
export function DominoCard({
  domino,
  fall = false,
}: {
  domino: Domino;
  /** Play the short tip-over animation (switched off by prefers-reduced-motion in index.css). */
  fall?: boolean;
}) {
  return (
    <div className={fall ? "domino domino-fall" : "domino"}>
      <span className="domino-icon" aria-hidden="true">
        {domino.icon}
      </span>
      <span className="domino-text">{tDynamic(domino.textKey)}</span>
    </div>
  );
}
