import { useTranslation } from "react-i18next";
import { badgeKind } from "../data/http";
import type { SunReport } from "../data/mission";

/** Today's Sun: the real Mars-bound storm cloud, with an honest live/kept/saved label. Facts only, no dose. */
/** One compact strip: the notice (if any) as its headline, then the facts on one line, so Start stays on screen. */
export function SunCard({ sun, notice }: { sun: SunReport; notice?: string }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const kind = badgeKind(sun.source);
  const at = new Date(sun.fetchedAt);
  const label = kind === "live"
    ? t("notice.sunLive", { time: at.toLocaleString(lang, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) })
    : t(kind === "cached" ? "notice.sunKept" : "notice.sunSaved", { date: at.toLocaleDateString(lang, { day: "numeric", month: "short", year: "numeric" }) });
  const date = new Date(sun.arrival).toLocaleDateString(lang, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  return (
    <section className="availability-note sun-card" role="status" aria-label={t("mission.todaysSun.title")}>
      {notice && <p className="sun-card__notice">{notice}</p>}
      <p className="sun-card__facts">
        <strong className={`sun-card__label sun-card__label--${kind}`}>{label}</strong>{" "}
        {t(sun.passed ? "notice.sunReached" : "notice.sunComing", { date })}
        {sun.cmeId && <> {t("notice.sunId", { id: sun.cmeId })}</>}
        {sun.speed && <> {t("notice.sunSpeed", { speed: sun.speed })}</>}{" "}
        <a href={sun.url} target="_blank" rel="noreferrer">{t("notice.sunLink")}</a>
      </p>
    </section>
  );
}
