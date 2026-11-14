import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { REAL_FACTS, SIMPLIFICATIONS } from "../data/sources";
import { SNAPSHOT_DATES } from "../data/donki";
import { DataBadge } from "../components/DataBadge";
import type { DataSource } from "../data/http";
import { JOBS, NIGHT, type JobId } from "../sim/types";
import "./DataSources.css";

/** Every real number with its source, the game numbers, and what the game simplifies (#7). */
export function DataSources({
  onBack,
  missionSource = "snapshot",
  missionFetchedAt,
}: {
  onBack?: () => void;
  missionSource?: DataSource;
  missionFetchedAt?: number;
}) {
  const { t, i18n } = useTranslation();
  const title = useRef<HTMLHeadingElement>(null);
  useEffect(() => title.current?.focus(), []);
  const date = new Date(SNAPSHOT_DATES.may2024).toLocaleDateString(i18n.language, { day: "numeric", month: "long", year: "numeric" });
  return (
    <section className="sources" aria-labelledby="sources-title">
      <header className="sources__head">
        <h2 id="sources-title" ref={title} tabIndex={-1}>
          {t("dataSources.title")}
        </h2>
        <DataBadge source={missionSource} fetchedAt={missionFetchedAt ?? Date.parse(SNAPSHOT_DATES.may2024)} />
      </header>
      <p>{t("dataSources.intro")}</p>

      <h3>{t("dataSources.real")}</h3>
      <ul className="sources__list">
        {REAL_FACTS.map((f) => (
          <li key={f.id} className="sources__item">
            <p className="sources__what">{f.what}</p>
            <p className="sources__value">{f.value}</p>
            <p className="sources__use">
              <span className="sources__label">{t("dataSources.inGame")}:</span> {f.usedFor}
            </p>
            <a href={f.ref.url} target="_blank" rel="noreferrer">
              {f.ref.label}
            </a>
          </li>
        ))}
      </ul>
      <p className="sources__note">{t("dataSources.savedOn", { date })}</p>

      <section aria-labelledby="game-numbers-title">
        <h3 id="game-numbers-title">{t("dataSources.gameNumbers")}</h3>
        <p>{t("dataSources.gameNumbersIntro")}</p>
        <ul className="sources__simple">
          {(Object.keys(JOBS) as JobId[]).map((id) => (
            <li key={id} data-job={id}>
              {t(`jobs.${id}`)}: {t("dataSources.power", { n: JOBS[id].powerCost })}
              {JOBS[id].outside ? `, ${t("dataSources.outside")}` : ""}
            </li>
          ))}
          <li>
            {t("dataSources.airMachine")}: {t("dataSources.power", { n: NIGHT.airMachinePower })}
          </li>
          <li>{t("dataSources.doseUnits")}</li>
        </ul>
      </section>

      <h3>{t("dataSources.simplifies")}</h3>
      <ul className="sources__simple">
        {SIMPLIFICATIONS.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ul>

      {onBack ? (
        <button type="button" className="sources__back" onClick={onBack}>
          {t("dataSources.back")}
        </button>
      ) : null}
    </section>
  );
}
