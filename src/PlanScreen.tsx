import { useEffect, useMemo, useRef, useState } from "react";
import "./plan.css";
import { useTranslation } from "react-i18next";
import { JobMiniGame } from "./components/JobMiniGame";
import { ResourceMeters } from "./components/ResourceMeters";
import { WhatsThis } from "./components/WhatsThis";
import {
  INSIGHT_DUST,
  LIGHT_DELAY,
  RAD_BASELINE,
  DONKI_ENLIL_MAY23,
} from "./data/sources";
import { asset } from "./game/assets";
import { audio } from "./game/audio";
import { useSession } from "./game/session";
import { DataChip } from "./screens/DataChip";
import { ScreenFrame } from "./components/ScreenFrame";
import { knownEvents, rulesOf, step } from "./sim/engine";
import { tRun } from "./i18n/dynamic";
import {
  JOBS,
  type CrewId,
  type Domino,
  type JobId,
} from "./sim/types";
import { useGame } from "./state/game";
import { useMission } from "./state/mission";
import { useNav } from "./state/screen";
const crew: CrewId[] = ["a1", "a2", "a3"];
const jobIds = Object.keys(JOBS) as JobId[];
const jobArt: Record<JobId, string> = {
  panels: "power-cell",
  greenhouse: "mineral-green",
  shelter: "oxygen-tank",
  askEarth: "mission-tablet",
  science: "sample-container",
};
const portraits = ["mission-commander", "engineer", "scientist"];
/** What each astronaut is best at (ENGINE.skill): Nova radio, Kai panels, Amara greenhouse. */
const skillArt = ["skill-radio", "skill-wrench", "skill-leaf"];
/** Every engine domino that this one knocks over, directly or further down the chain. */
function effectsOf(fell: Domino[], id: string): Domino[] {
  return fell
    .filter((d) => d.causeIds.includes(id))
    .flatMap((d) => [d, ...effectsOf(fell, d.id)]);
}
export default function PlanScreen() {
  const { t } = useTranslation();
  const state = useGame((s) => s.state);
  const setup = useMission((s) => s.setup);
  const plan = useSession((s) => s.draft);
  const assign = useSession((s) => s.assign);
  const moon = setup?.place === "moon" ? "moon" : undefined;
  const [selected, select] = useState<CrewId | null>(null);
  const [confirmIdle, setConfirmIdle] = useState(false);
  const [nudge, setNudge] = useState(false);
  // The job's mini game, open right after the job is given (the job is already in the plan).
  const [miniGame, setMiniGame] = useState<{ job: JobId; seed: number } | null>(null);
  const plays = useRef(0);
  const resolved = useRef(false);
  // Keyboard flow: after a tap, move focus to where the next tap goes (jobs, then the next idle astronaut).
  const root = useRef<HTMLDivElement>(null);
  const focusNext = useRef<"job" | "crew" | null>(null);
  useEffect(() => {
    const want = focusNext.current;
    focusNext.current = null;
    if (!want || !root.current) return;
    const target =
      want === "job"
        ? root.current.querySelector<HTMLButtonElement>(
            ".job-choice:not(:disabled)",
          )
        : (root.current.querySelector<HTMLButtonElement>(
            ".crew-tile:not(.has-job) > button:not(:disabled)",
          ) ?? root.current.querySelector<HTMLButtonElement>(".end-sol"));
    target?.focus();
  });
  // Pure engine preview; no parallel simulation in the interface.
  // Only storms the kid was told about: a surprise burst must not leak through the preview.
  const preview = useMemo(
    () =>
      step(
        state,
        plan,
        knownEvents(state, setup?.events ?? []),
        setup?.forecasts,
      ),
    [state, plan, setup],
  );
  const idle = crew.filter(
    (id) => !state.tired.includes(id) && !plan[id],
  ).length;
  function finish() {
    if (!setup || resolved.current) return;
    if (idle && !confirmIdle) {
      setConfirmIdle(true);
      return;
    }
    resolved.current = true;
    useSession.setState({ before: { ...state.bars }, draft: {} });
    const result = useGame.getState().endSol(plan);
    audio.playSfx("resolve");
    if (result.over && state.sol < rulesOf(state).sols) useNav.getState().endEarly();
    else useNav.getState().next();
  }
  return (
    <ScreenFrame title={tRun("plan.heading", { sol: state.sol }, moon)}>
      <p className="lead">{t("planHelp.howTo")}</p>
      <div className="planner-layout plan-screen" ref={root}>
        <div>
          <h2 className="step-label">{t("play.crewStep")}</h2>
          <div className="crew-roster">
            {crew.map((id, i) => (
              <div
                className={`crew-tile ${selected === id ? "selected" : ""} ${plan[id] ? "has-job" : ""}`}
                key={id}
              >
                <button
                  type="button"
                  disabled={state.tired.includes(id)}
                  aria-pressed={selected === id}
                  aria-label={t("crew.name", { n: i + 1 })}
                  onClick={() => {
                    select(id);
                    setNudge(false);
                    setConfirmIdle(false);
                    focusNext.current = "job";
                    audio.playSfx("select");
                  }}
                >
                  <img
                    src={asset(`characters/npcs/${portraits[i]}-portrait`)}
                    alt=""
                  />
                  <span>
                    <strong>{t("crew.name", { n: i + 1 })}</strong>
                    <span className="crew-skill"><img src={asset(`campaign/${skillArt[i]}`)} alt="" />{t(`crew.skill.${id}`)}</span>
                    <small>
                      {state.tired.includes(id)
                        ? t("crew.tired")
                        : plan[id]
                          ? t(`jobs.${plan[id]}`)
                          : t("crew.idle")}
                    </small>
                  </span>
                </button>
                {plan[id] && (
                  <button
                    type="button"
                    className="unassign"
                    onClick={() => { assign(id); audio.playSfx("job-remove"); }}
                    aria-label={t("play.clearCrew", { n: i + 1 })}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
          <h2 className="step-label">{t("play.jobsStep")}</h2>
          <div className="job-list">
            {jobIds.map((id, i) => {
              const owner = crew.find((c) => plan[c] === id);
              return (
                <button
                  type="button"
                  className={`job-choice ${owner ? "assigned" : ""}`}
                  key={id}
                  aria-disabled={!selected}
                  aria-label={t(`jobs.${id}`)}
                  aria-pressed={Boolean(owner)}
                  onClick={() => {
                    if (!selected) { setNudge(true); audio.playSfx("select"); return; }
                    setNudge(false);
                    assign(selected, id);
                    select(null);
                    plays.current += 1;
                    setMiniGame({ job: id, seed: state.sol * 97 + plays.current });
                    audio.playSfx(id === "askEarth" ? "earth-message-send" : "assign");
                  }}
                >
                  <span className="job-number">0{i + 1}</span>
                  <img src={asset(`items/${jobArt[id]}`)} alt="" />
                  <span className="job-copy">
                    <strong>{t(`jobs.${id}`)}</strong>
                    <small>{t(`jobInfo.${id}.done`)}</small>
                    <span className="job-cost">
                      {t("jobInfo.cost", { count: JOBS[id].powerCost })}
                      {JOBS[id].outside ? ` · ${t("jobInfo.outside")}` : ""}
                    </span>
                  </span>
                  <span className="job-owner">
                    {owner
                      ? t("play.crewNumber", { n: crew.indexOf(owner) + 1 })
                      : "+"}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="planner-guidance" aria-live="polite">
            {selected
              ? t("play.chooseJob", { n: crew.indexOf(selected) + 1 })
              : nudge ? t("play.pickCrewFirst") : t("play.chooseCrew")}
          </div>
        </div>
        <aside className="plan-outlook">
          <h2>{tRun("play.preview", {}, moon)}</h2>
          <p className="note">{t("play.previewMeaning")}</p>
          <ResourceMeters bars={preview.state.bars} previous={state.bars} />
          <div className="small-counters">
            <span>
              {t("bars.food")} <b>{preview.state.food}</b>
            </span>
            <span>
              {t("bars.science")} <b>{preview.state.science}</b>
            </span>
          </div>
          <h3 className="skip-heading" id="skip-heading">
            {t("play.leftBehind")}
          </h3>
          <ul className="skip-dominoes" aria-labelledby="skip-heading">
            {jobIds
              .filter((id) => !Object.values(plan).includes(id))
              .map((id) => {
                // Engine ids are `sol{N}-{job}-skipped`; jobs without a skip domino (Ask Earth, science) show their art + ✗.
                const skip = preview.fell.find(
                  (d) => d.id === `sol${state.sol}-${id}-skipped`,
                );
                const effects = skip ? effectsOf(preview.fell, skip.id) : [];
                return (
                  <li className="mini-domino" key={id}>
                    <span className="mini-chain" aria-hidden="true">
                      <span className="mini-link">
                        {skip ? (
                          skip.icon
                        ) : (
                          <>
                            <img src={asset(`items/${jobArt[id]}`)} alt="" />✗
                          </>
                        )}
                      </span>
                      {effects.map((d) => (
                        <span className="mini-effect" key={d.id}>
                          <span className="mini-arrow">→</span>
                          <span className="mini-link">
                            {d.icon}
                            {d.sol > state.sol && (
                              <small>{t("play.tomorrow")}</small>
                            )}
                          </span>
                        </span>
                      ))}
                    </span>
                    <small className="mini-text">
                      <b>{t(`jobs.${id}`)}:</b> {t(`jobInfo.${id}.skipped`)}
                    </small>
                  </li>
                );
              })}
          </ul>
          {confirmIdle && (
            <p role="alert">{t("play.idleConfirm", { count: idle })}</p>
          )}
          <button
            type="button"
            className="primary end-sol"
            disabled={!setup}
            onClick={finish}
          >
            {confirmIdle ? t("play.confirmEnd") : tRun("plan.endSol", {}, moon)} →
          </button>
          <p className="note">{t("play.gameUnits")}</p>
        </aside>
      </div>
      {miniGame && (
        <JobMiniGame
          key={miniGame.seed}
          job={miniGame.job}
          seed={miniGame.seed}
          onClose={() => {
            setMiniGame(null);
            focusNext.current = "crew";
          }}
        />
      )}
      <details className="science-details">
        <summary>{t("play.scienceBehind")}</summary>
        <p>
          {t("help.askEarth.text")} <WhatsThis topic="askEarth" />
        </p>
        <DataChip source={LIGHT_DELAY} />
        <DataChip source={state.earthAnswer?.source ?? DONKI_ENLIL_MAY23} />
        <DataChip source={INSIGHT_DUST} />
        <DataChip source={RAD_BASELINE} />
      </details>
    </ScreenFrame>
  );
}
