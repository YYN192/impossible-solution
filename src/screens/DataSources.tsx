import { REAL_FACTS, SIMPLIFICATIONS } from "../data/sources";
import { SNAPSHOT_DATES } from "../data/donki";
import { DataBadge } from "../components/DataBadge";
import type { DataSource } from "../data/http";
import { JOBS, NIGHT, type JobId } from "../sim/types";
import "./DataSources.css";

// TODO(#12/#15): move these strings into src/i18n/en.json once i18next is set up.
const COPY = {
  title: "Where our numbers come from",
  intro:
    "This game uses real NASA science. Here is every real number, where it comes from, and what the game makes up.",
  real: "Real NASA data",
  colWhat: "What",
  colValue: "Real value",
  colUse: "In the game",
  simplifies: "What this game simplifies",
  gameNumbers: "Game numbers",
  gameNumbersIntro:
    "We chose these numbers so the game is fair and fun. Each one is a game number, not a NASA measurement.",
  jobs: {
    panels: "Clean solar panels",
    greenhouse: "Run greenhouse lights",
    shelter: "Build up the shelter",
    askEarth: "Ask Earth",
    science: "Science trip",
  } satisfies Record<JobId, string>,
  outside: "outside (more space rays)",
  airMachine: "Air machine, every night",
  doseUnits:
    "The space-ray meter uses game units. Only the size of a storm compared with a normal day is real.",
  snapshotNote: "Saved NASA space-weather data was downloaded on",
  back: "Back",
  footer: "Uses NASA open data. Not affiliated with or endorsed by NASA.",
};

export function DataSources({
  onBack,
  missionSource = "snapshot",
  missionFetchedAt,
}: {
  onBack?: () => void;
  missionSource?: DataSource;
  missionFetchedAt?: number;
}) {
  const saved = new Date(SNAPSHOT_DATES.may2024).toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return (
    <section className="sources" aria-labelledby="sources-title">
      <header className="sources__head">
        <h2 id="sources-title">{COPY.title}</h2>
        <DataBadge
          source={missionSource}
          fetchedAt={missionFetchedAt ?? Date.parse(SNAPSHOT_DATES.may2024)}
        />
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

      <section aria-labelledby="game-numbers-title">
        <h3 id="game-numbers-title">{COPY.gameNumbers}</h3>
        <p>{COPY.gameNumbersIntro}</p>
        <ul className="sources__simple">
          {(Object.keys(JOBS) as JobId[]).map((id) => (
            <li key={id} data-job={id}>
              {COPY.jobs[id]}: {JOBS[id].powerCost} power
              {JOBS[id].outside ? `, ${COPY.outside}` : ""}
            </li>
          ))}
          <li>
            {COPY.airMachine}: {NIGHT.airMachinePower} power
          </li>
          <li>{COPY.doseUnits}</li>
        </ul>
      </section>

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
