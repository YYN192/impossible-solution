import { useTranslation } from "react-i18next";
import { Icon } from "../components/Icon";
import { localText } from "../i18n/sourceText";
import type { DataRef } from "../sim/types";

/**
 * "Real data" chip in plain words, e.g. "[satellite icon] Real NASA data (saved): A Mars rover measured this
 * storm on 20 May 2024". The mode comes from the data layer and is shown honestly: saved
 * (snapshot) data is never called live. Label and value follow the language (#19).
 */
export function DataChip({ source }: { source: DataRef }) {
  const { t, i18n } = useTranslation();
  const value = localText(source.value, i18n.language);
  return (
    <p className="chip" data-mode={source.mode}>
      <Icon name="satellite" />{" "}
      <strong>{t(`chip.${source.mode}`)}:</strong>{" "}
      {value && <b>{value} — </b>}
      {localText(source.label, i18n.language)}{" "}
      <a href={source.url} target="_blank" rel="noreferrer">
        {t("chip.source")}
      </a>
    </p>
  );
}
