import { useTranslation } from "react-i18next";
import type { DataSource } from "../data/http";
import { badgeKind } from "../data/http";
import "./DataBadge.css";

/** Honest data badge: LIVE only for data fetched just now; KEPT DATA for an earlier real download; SAVED DATA for bundled snapshots. */
export function DataBadge({ source, fetchedAt }: { source: DataSource; fetchedAt: number }) {
  const { t, i18n } = useTranslation();
  const kind = badgeKind(source);
  const live = kind === "live";
  const date = fetchedAt ? new Date(fetchedAt).toLocaleDateString(i18n.language, { day: "numeric", month: "short", year: "numeric" }) : "";
  return (
    <span
      role="status"
      className={`data-badge ${live ? "data-badge--live" : "data-badge--saved"}`}
      title={live ? t("data.badge.liveTitle") : t(kind === "cached" ? "data.badge.cachedTitle" : "data.badge.savedTitle", { date })}
    >
      {t(`data.badge.${kind === "cached" ? "cached" : kind}`)}
      {!live && date ? <span className="data-badge__when"> · {date}</span> : null}
    </span>
  );
}
