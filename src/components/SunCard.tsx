import { useTranslation } from "react-i18next";
import { badgeKind } from "../data/http";
import type { SunReport } from "../data/mission";

/** Today's Sun: the real Mars-bound storm cloud, with an honest live/kept/saved label. Facts only, no dose. */
export function SunCard({ sun }: { sun: SunReport }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const kind = badgeKind(sun.source);
  const at = new Date(sun.fetchedAt);
  const label = kind === "live"
    ? t("notice.sunLive", { time: at.toLocaleString(lang, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) })
    : t(kind === "cached" ? "notice.sunKept" : "notice.sunSaved", { date: at.toLocaleDateString(lang, { day: "numeric", month: "short", year: "numeric" }) });
  const date = new Date(sun.arrival).toLocaleDateString(lang, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  return (
    <section className="availability-note sun-card" aria-label={t("mission.todaysSun.title")}>
      <strong className={`sun-card__label sun-card__label--${kind}`}>{label}</strong>
      <p>{t(sun.passed ? "notice.sunReached" : "notice.sunComing", { date })}</p>
      {sun.cmeId && <p>{t("notice.sunId", { id: sun.cmeId })}</p>}
      {sun.speed && <p>{t("notice.sunSpeed", { speed: sun.speed })}</p>}
      <a href={sun.url} target="_blank" rel="noreferrer">{t("notice.sunLink")}</a>
    </section>
  );
}
