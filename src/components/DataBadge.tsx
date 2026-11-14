import { useTranslation } from "react-i18next";
import type { DataSource } from "../data/http";
import { isLive } from "../data/http";
import "./DataBadge.css";

/** Honest data badge: LIVE only for data fetched now (or cached from a fetch); everything else is SAVED DATA. */
export function DataBadge({ source, fetchedAt }: { source: DataSource; fetchedAt: number }) {
  const { t, i18n } = useTranslation();
  const live = isLive(source);
  const date = fetchedAt ? new Date(fetchedAt).toLocaleDateString(i18n.language, { day: "numeric", month: "short", year: "numeric" }) : "";
  return (
    <span
      role="status"
      className={`data-badge ${live ? "data-badge--live" : "data-badge--saved"}`}
      title={live ? t("data.badge.liveTitle") : t("data.badge.savedTitle", { date })}
    >
      <span aria-hidden="true" className="data-badge__dot" />
      {live ? t("data.badge.live") : t("data.badge.saved")}
      {!live && date ? <span className="data-badge__when"> · {date}</span> : null}
    </span>
  );
}
