import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import type { Bars } from "../sim/types";
import { asset } from "../game/assets";
import { WhatsThis } from "./WhatsThis";
const meters = [
  { key: "power", icon: "power-cell" }, { key: "air", icon: "oxygen-tank" }, { key: "dose", icon: "measuring-device" },
] as const;
export function ResourceMeters({ bars, previous }: { bars: Bars; previous?: Bars }) {
  const { t } = useTranslation();
  const [display, setDisplay] = useState(previous ?? bars);
  useEffect(() => {
    let second = 0;
    const first = requestAnimationFrame(() => { second = requestAnimationFrame(() => setDisplay(bars)); });
    return () => { cancelAnimationFrame(first); cancelAnimationFrame(second); };
  }, [bars]);
  return <div className="resource-meters">{meters.map(({ key, icon }) => {
    const delta = previous ? bars[key] - previous[key] : 0;
    return <section className={`resource-meter meter-${key}`} key={key}>
      <div className="meter-label"><img src={asset(`items/${icon}`)} alt="" /><span>{t(`bars.${key}`)}</span><WhatsThis topic={key} /></div>
      <div className="meter-value"><strong>{Number(bars[key].toFixed(1))}<small> / 10</small></strong>
        {previous && <span className="meter-change">{delta > 0 ? "+" : ""}{Number(delta.toFixed(1))}</span>}</div>
      <div className="meter-track" role="meter" aria-label={t(`bars.${key}`)} aria-valuenow={bars[key]} aria-valuemin={0} aria-valuemax={10}><span style={{ width: `${display[key] * 10}%` }} /></div>
      <small>{key === "dose" ? t("play.lowerBetter") : t("play.higherBetter")}</small>
    </section>;
  })}</div>;
}
