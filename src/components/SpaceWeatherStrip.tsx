import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { WeatherEvent, WeatherWeek } from "../data/datasets";
import { readFlags } from "../data/flags";
import type { Result } from "../data/http";
import { liveWeatherWeek } from "../data/live";
import { cmeSpeed, flareSize, stormSize } from "../data/weatherWords";
import palette from "../assets/pixel/palette.json";
import { DataBadge } from "./DataBadge";
import HubDialog from "./HubDialog";

type RowType = WeatherWeek["rows"][number]["type"];
type Load = () => Promise<Result<WeatherWeek>>;
/** Live DONKI through the cached HTTP layer; ?offline=1 and ?demo=1 use the saved snapshot only. */
const liveLoad: Load = () => liveWeatherWeek({ offline: readFlags().offline });

// 8×8 pixel icons in the game palette, one per row.
const C: Record<string, string> = { y: palette.yellow, o: palette.orange, r: palette.rust, w: palette.white, c: palette.cyan, b: palette.blue, g: palette.green, t: palette.teal };
const ICONS: Record<RowType, string[]> = {
  flr: ["..y..y..", ".y.yy.y.", "..yooy..", "yyowwoyy", "yyowwoyy", "..yooy..", ".y.yy.y.", "..y..y.."],
  cme: ["........", "..oo....", ".oyyo.o.", "oyyyyoyo", "oyyyyyyo", ".oooooo.", "..r..r..", ".r..r..."],
  sep: ["c.....c.", "..c.c...", ".c..w..c", "...wcw..", "c..cwc..", "..c...c.", ".c..c...", "....c..c"],
  gst: ["..tttt..", ".t....t.", "..bbbb..", ".bgbbgb.", ".bbggbb.", ".bgbbbb.", "..bbbb..", "........"],
};
function PixelIcon({ type }: { type: RowType }) {
  return <svg className="radar-icon" viewBox="0 0 8 8" width="28" height="28" shapeRendering="crispEdges" aria-hidden="true">
    {ICONS[type].flatMap((line, y) => [...line].map((p, x) => p === "." ? null : <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={C[p]} />))}
  </svg>;
}

/** Every UTC day from start to end, inclusive ("2026-11-08", …). */
const daysOf = ({ start, end }: WeatherWeek["window"]) => {
  const out: string[] = [];
  for (let d = Date.parse(`${start}T00:00Z`); d <= Date.parse(`${end}T00:00Z`); d += 864e5) out.push(new Date(d).toISOString().slice(0, 10));
  return out;
};

/**
 * The radar console (#60): NASA DONKI's last 7 days, one row per event type with a pixel icon and a count,
 * one mark per event in the day it happened. Tapping, pointing at or focusing a day shows its events
 * with date and size in kid words. Mars is only named when a DONKI forecast does (the #8 rule).
 */
export default function SpaceWeatherStrip({ onClose, load = liveLoad }: { onClose: () => void; load?: Load }) {
  const { t, i18n } = useTranslation();
  const [res, setRes] = useState<Result<WeatherWeek> | "failed">();
  const [pick, setPick] = useState<{ type: RowType; day: string }>();
  useEffect(() => {
    let alive = true;
    load().then((r) => alive && setRes(r), () => alive && setRes("failed"));
    return () => { alive = false; };
  }, [load]);
  const locale = i18n.language === "en" ? "en-GB" : i18n.language;
  const date = (day: string) => new Date(`${day}T00:00Z`).toLocaleDateString(locale, { day: "numeric", month: "short", timeZone: "UTC" });
  const size = (type: RowType, e: WeatherEvent) =>
    type === "flr" ? t(`radar.size.flr.${flareSize(e.flareClass)}`, { cls: e.flareClass ?? "" })
      : type === "cme" ? t(`radar.size.cme.${cmeSpeed(e.speedKmS)}`, { speed: e.speedKmS ?? 0 })
        : type === "gst" ? t(`radar.size.gst.${stormSize(e.kp)}`, { kp: Number((e.kp ?? 0).toFixed(1)) })
          : t("radar.size.sep");
  const week = res && res !== "failed" ? res.data : undefined;
  const days = week ? daysOf(week.window) : [];
  const picked = week && pick ? week.rows.find((r) => r.type === pick.type)?.events?.filter((e) => e.time.slice(0, 10) === pick.day) ?? [] : [];
  return <HubDialog id="radar" className="radar" eyebrow={t("world.near.radar")} title={t("radar.title")} closeLabel={t("radar.close")} onClose={onClose}>
    <p className="lead">{t("radar.lead")}</p>
    {!res && <p>{t("radar.loading")}</p>}
    {res === "failed" && <p>{t("radar.failed")}</p>}
    {week && res && res !== "failed" && <>
      <p className="radar-meta"><DataBadge source={res.source} fetchedAt={res.fetchedAt} /> <span>{date(week.window.start)} – {date(week.window.end)} · {t("radar.source")}</span></p>
      <div className="radar-rows">{week.rows.map(({ type, events }) => <section key={type} className="radar-row" data-testid={`row-${type}`} aria-labelledby={`radar-row-${type}`}>
        <div className="radar-row-head">
          <PixelIcon type={type} />
          <h3 id={`radar-row-${type}`}>{t(`radar.row.${type}`)} <small>({t(`radar.what.${type}`)})</small></h3>
          <span className="radar-count">{events ? t("radar.count", { count: events.length }) : t("radar.noAnswer")}</span>
        </div>
        {events && <div className="radar-days">{days.map((day) => {
          const today = events.filter((e) => e.time.slice(0, 10) === day);
          const num = Number(day.slice(8));
          if (!today.length) return <div key={day} className="radar-day empty" aria-hidden="true"><span className="radar-date">{num}</span></div>;
          const show = () => setPick({ type, day });
          return <button key={day} type="button" className="radar-day" aria-pressed={pick?.type === type && pick.day === day}
            aria-label={t("radar.day", { row: t(`radar.row.${type}`), date: date(day), count: t("radar.count", { count: today.length }) })}
            onClick={show} onPointerEnter={show} onFocus={show}>
            <span className="radar-date">{num}</span>
            <span className="radar-marks">{today.map((e) => <i key={e.id} className="radar-mark" data-type={type} data-mars={e.marsForecast ? "" : undefined} />)}</span>
          </button>;
        })}</div>}
      </section>)}</div>
      <div className="radar-detail" data-testid="radar-detail" aria-live="polite">
        {pick && picked.length ? <>
          <strong>{t(`radar.row.${pick.type}`)} · {date(pick.day)}</strong>
          <ul>{picked.map((e) => <li key={e.id}>{size(pick.type, e)}{e.marsForecast && <> <b className="radar-mars">{t("radar.mars")}</b></>}</li>)}</ul>
        </> : <p>{t("radar.pick")}</p>}
      </div>
    </>}
  </HubDialog>;
}
