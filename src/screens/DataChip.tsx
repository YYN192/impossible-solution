import { useTranslation } from "react-i18next";
import type { DataRef } from "../sim/types";

/**
 * "Real data" chip in plain words, e.g. "🛰️ Real NASA data (saved): A Mars rover measured this
 * storm on 20 May 2024". The mode comes from the data layer and is shown honestly: saved
 * (snapshot) data is never called live.
 */
export function DataChip({ source }: { source: DataRef }) {
  const { t } = useTranslation();
  return (
    <p className="chip" data-mode={source.mode}>
      <span aria-hidden="true">🛰️ </span>
      <strong>{t(`chip.${source.mode}`)}:</strong>{" "}
      {source.value && <b>{source.value} — </b>}
      {source.label}{" "}
      <a href={source.url} target="_blank" rel="noreferrer">
        {t("chip.source")}
      </a>
    </p>
  );
}
