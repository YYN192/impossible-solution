import { REAL_FACTS, SIMPLIFICATIONS } from "../data/sources";
import { SNAPSHOT_DATES } from "../data/donki";
import { DataBadge } from "../components/DataBadge";
import type { DataSource } from "../data/http";
import "./DataSources.css";

// TODO(#12/#15): move these strings into src/i18n/en.json once i18next is set up.
const COPY = {
  title: "Where our numbers come from",
  intro: "This game uses real NASA science. Here is every real number, where it comes from, and what the game makes up.",
  real: "Real NASA data",
  colWhat: "What",
  colValue: "Real value",
  colUse: "In the game",
  simplifies: "What this game simplifies",
  snapshotNote: "Saved NASA space-weather data was downloaded on",
  back: "Back",
  footer: "Uses NASA open data. Not affiliated with or endorsed by NASA.",
};

export function DataSources({ onBack, missionSource = "snapshot", missionFetchedAt }: { onBack?: () => void; missionSource?: DataSource; missionFetchedAt?: number }) {
  const saved = new Date(SNAPSHOT_DATES.may2024).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });
  return (
    <section className="sources" aria-labelledby="sources-title">
      <header className="sources__head">
        <h2 id="sources-title">{COPY.title}</h2>
        <DataBadge source={missionSource} fetchedAt={missionFetchedAt ?? Date.parse(SNAPSHOT_DATES.may2024)} />
      </header>
      <p>{COPY.intro}</p>

      <h3>{COPY.real}</h3>
      <ul className="sources__list">
        {REAL_FACTS.map((f) => (
          <li key={f.id} className="sources__item">
            <p className="sources__what">{f.what}</p>
            <p className="sources__value">{f.value}</p>
            <p className="sources__use">
              <span className="sources__label">{COPY.colUse}:</span> {f.usedFor}
            </p>
            <a href={f.ref.url} target="_blank" rel="noreferrer">
              {f.ref.label}
            </a>
          </li>
        ))}
      </ul>
      <p className="sources__note">
        {COPY.snapshotNote} {saved}.
      </p>

      <h3>{COPY.simplifies}</h3>
      <ul className="sources__simple">
        {SIMPLIFICATIONS.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ul>

      {onBack ? (
        <button type="button" className="sources__back" onClick={onBack}>
          {COPY.back}
        </button>
      ) : null}
      <p className="sources__note">{COPY.footer}</p>
    </section>
  );
}
