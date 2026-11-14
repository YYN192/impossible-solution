import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { REAL_FACTS, SIMPLIFICATION_KEYS } from "../data/sources";
import { GAME_NUMBERS } from "../data/gameNumbers";
import { SNAPSHOT_DATES } from "../data/donki";
import { DataBadge } from "../components/DataBadge";
import { MoreRealData } from "./MoreRealData";
import type { DataSource } from "../data/http";
import "./DataSources.css";

/** Every real number with its source, the game numbers, and what the game simplifies (#7). */
export function DataSources({
  onBack,
  missionSource = "snapshot",
  missionFetchedAt,
  liveData = false,
}: {
  onBack?: () => void;
  /** Refresh DONKI / APOD cards in the background (App passes !offline). */
  liveData?: boolean;
  missionSource?: DataSource;
  missionFetchedAt?: number;
}) {
  const { t, i18n } = useTranslation();
  const title = useRef<HTMLHeadingElement>(null);
  useEffect(() => title.current?.focus(), []);
  const formatDate = (value: string | number) =>
    new Date(value).toLocaleDateString(i18n.language, {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  const date = formatDate(SNAPSHOT_DATES.may2024);
  return (
    <section className="sources" aria-labelledby="sources-title">
      <header className="sources__head">
        <h2 id="sources-title" ref={title} tabIndex={-1}>
          {t("dataSources.title")}
        </h2>
        <DataBadge
          source={missionSource}
          fetchedAt={missionFetchedAt ?? Date.parse(SNAPSHOT_DATES.may2024)}
        />
      </header>
      <p>{t("dataSources.intro")}</p>

      <h3>{t("dataSources.real")}</h3>
      <ul className="sources__list">
        {REAL_FACTS.map((f) => (
          <li key={f.id} className="sources__item">
            <dl className="sources__facts">
              <div>
                <dt>{t("dataSources.what")}</dt>
                <dd className="sources__what">{f.what}</dd>
              </div>
              <div>
                <dt>{t("dataSources.value")}</dt>
                <dd className="sources__value">{f.value}</dd>
              </div>
              <div>
                <dt>{t("dataSources.inGame")}</dt>
                <dd>{f.usedFor}</dd>
              </div>
              <div>
                <dt>{t("dataSources.source")}</dt>
                <dd>
                  <a href={f.ref.url} target="_blank" rel="noreferrer">
                    {f.ref.label}
                  </a>
                </dd>
              </div>
              <div>
                <dt>{t("dataSources.fetched")}</dt>
                <dd>
                  <time dateTime={f.ref.fetched}>
                    {formatDate(f.ref.fetched)}
                  </time>
                </dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>
      <p className="sources__note">{t("dataSources.savedOn", { date })}</p>

      <MoreRealData live={liveData} />

      <section aria-labelledby="game-numbers-title">
        <h3 id="game-numbers-title">{t("dataSources.gameNumbers")}</h3>
        <p>{t("dataSources.gameNumbersIntro")}</p>
        <ul className="sources__simple">
          {GAME_NUMBERS.map((item) => (
            <li key={item.id} data-game-number={item.id}>
              <span className="sources__game-label">
                {t("dataSources.gameNumber")}
              </span>{" "}
              —{" "}
              {t(item.labelKey, {
                name: t(item.nameKey),
                value: item.value,
                job: item.jobId ? t(`jobs.${item.jobId}`) : undefined,
              })}
            </li>
          ))}
        </ul>
      </section>

      <h3>{t("dataSources.simplifies")}</h3>
      <ul className="sources__simple">
        {SIMPLIFICATION_KEYS.map((key) => (
          <li key={key}>{t(key)}</li>
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
