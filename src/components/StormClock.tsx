import { useTranslation } from "react-i18next";

export function StormClock({ seconds, failing }: { seconds: number; failing: boolean }) {
  const { t } = useTranslation();
  return <div className="storm-clock" data-failing={failing || undefined}>
    <span>{t("hubStorm.timer")}</span>
    <strong role="timer" aria-label={t("hubStorm.timer")}>00:{String(seconds).padStart(2, "0")}</strong>
    {failing && <span role="alert">{t("hubStorm.retry")}</span>}
  </div>;
}
