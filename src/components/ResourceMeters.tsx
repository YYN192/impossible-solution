import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { DOSE, type Bars } from "../sim/types";
import { ENGINE } from "../sim/engine";
import { asset } from "../game/assets";
import { WhatsThis } from "./WhatsThis";
const meters = [
  { key: "power", icon: "power-cell", max: 10 },
  { key: "air", icon: "oxygen-tank", max: 10 },
  { key: "dose", icon: "measuring-device", max: DOSE.meterMax },
] as const;
/** #64: the game's own lines (the star rules): power and air at or above, the space-ray meter below. */
const SAFE = { power: ENGINE.lowPowerToday, air: ENGINE.airReady, dose: ENGINE.doseLimit } as const;
// Air starts below its star line (5 < 6), so air shows a goal, not a warning.
const isSafe = (key: keyof typeof SAFE, v: number) => (key === "dose" ? v < SAFE.dose : key === "air" || v >= SAFE[key]);
export function ResourceMeters({
  bars,
  previous,
}: {
  bars: Bars;
  previous?: Bars;
}) {
  const { t } = useTranslation();
  const [display, setDisplay] = useState(previous ?? bars);
  useEffect(() => {
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => setDisplay(bars));
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, [bars]);
  return (
    <div className="resource-meters">
      {meters.map(({ key, icon, max }) => {
        const delta = previous ? bars[key] - previous[key] : 0;
        return (
          <section className={`resource-meter meter-${key}${isSafe(key, bars[key]) ? "" : " unsafe"}`} key={key}>
            <div className="meter-label">
              <img src={asset(`items/${icon}`)} alt="" />
              <span>{t(`bars.${key}`)}</span>
              <WhatsThis topic={key} />
            </div>
            <div className="meter-value">
              <strong>
                {Number(bars[key].toFixed(1))}
                <small> / {max}</small>
              </strong>
              {/* key re-mounts the number so its tick animation replays on every change */}
              {previous && (
                <span className={`meter-change ${delta === 0 ? "same" : (key === "dose" ? -delta : delta) > 0 ? "better" : "worse"}`} key={delta}>
                  {delta > 0 ? "+" : ""}
                  {Number(delta.toFixed(1))}
                </span>
              )}
            </div>
            <div
              className="meter-track"
              role="meter"
              aria-label={t(`bars.${key}`)}
              aria-valuenow={bars[key]}
              aria-valuemin={0}
              aria-valuemax={max}
            >
              <span style={{ width: `${(display[key] * 100) / max}%` }} />
              <b className="meter-safe" aria-hidden="true" style={{ left: `${(SAFE[key] * 100) / max}%` }} />
              {/* Band between the old and new value: shows the change itself (green = better, red = worse). */}
              {previous && (
                <i
                  className={`meter-delta ${(key === "dose" ? -delta : delta) >= 0 ? "better" : "worse"}`}
                  aria-hidden="true"
                  style={{
                    left: `${(Math.min(previous[key], display[key]) * 100) / max}%`,
                    width: `${(Math.abs(display[key] - previous[key]) * 100) / max}%`,
                  }}
                />
              )}
            </div>
            <small>
              {t(key === "dose" ? "play.safeBelow" : key === "air" ? "play.goalAbove" : "play.safeAbove", { n: SAFE[key] })}
            </small>
          </section>
        );
      })}
    </div>
  );
}
