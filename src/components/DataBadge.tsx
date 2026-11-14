import type { DataSource } from "../data/http";
import { isLive } from "../data/http";
import "./DataBadge.css";

// TODO(#12/#15): move these strings into src/i18n/en.json once i18next is set up.
const COPY = {
  live: "LIVE",
  snapshot: "SAVED DATA",
  liveTitle: "Real NASA data, downloaded just now",
  snapshotTitle: "Real NASA data, saved on",
};

/** Honest data badge: LIVE only for data fetched now (or cached from a fetch); everything else is SAVED DATA. */
export function DataBadge({ source, fetchedAt }: { source: DataSource; fetchedAt: number }) {
  const live = isLive(source);
  const when = fetchedAt ? new Date(fetchedAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "";
  return (
    <span role="status" className={`data-badge ${live ? "data-badge--live" : "data-badge--saved"}`} title={live ? COPY.liveTitle : `${COPY.snapshotTitle} ${when}`}>
      <span aria-hidden="true" className="data-badge__dot" />
      {live ? COPY.live : COPY.snapshot}
      {!live && when ? <span className="data-badge__when"> · {when}</span> : null}
    </span>
  );
}
