import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { DOSE, type Bars } from "../sim/types";
import { asset } from "../game/assets";
import { WhatsThis } from "./WhatsThis";
const meters = [
  { key: "power", icon: "power-cell", max: 10 },
  { key: "air", icon: "oxygen-tank", max: 10 },
  { key: "dose", icon: "measuring-device", max: DOSE.meterMax },
] as const;
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
          <section className={`resource-meter meter-${key}`} key={key}>
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
                <span className="meter-change" key={delta}>
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
              {key === "dose" ? t("play.lowerBetter") : t("play.higherBetter")}
            </small>
          </section>
        );
      })}
    </div>
  );
}
