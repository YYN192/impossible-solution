import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ResourceMeters } from "./components/ResourceMeters";
import { WhatsThis } from "./components/WhatsThis";
import { INSIGHT_DUST, LIGHT_DELAY, RAD_BASELINE, DONKI_ENLIL_MAY23 } from "./data/sources";
import { asset } from "./game/assets";
import { audio } from "./game/audio";
import { useSession } from "./game/session";
import { DataChip } from "./screens/DataChip";
import { ScreenFrame } from "./components/ScreenFrame";
import { step } from "./sim/engine";
import { JOBS, MISSION_SOLS, type CrewId, type JobId } from "./sim/types";
import { useGame } from "./state/game";
import { useMission } from "./state/mission";
import { useNav } from "./state/screen";
const crew: CrewId[] = ["a1", "a2", "a3"];
const jobIds = Object.keys(JOBS) as JobId[];
const jobArt: Record<JobId, string> = { panels: "power-cell", greenhouse: "mineral-green", shelter: "oxygen-tank", askEarth: "mission-tablet", science: "sample-container" };
const portraits = ["mission-commander", "engineer", "scientist"];
export default function PlanScreen() {
  const { t } = useTranslation();
  const state = useGame((s) => s.state);
  const setup = useMission((s) => s.setup);
  const plan = useSession((s) => s.draft);
  const assign = useSession((s) => s.assign);
  const [selected, select] = useState<CrewId | null>(null);
  const [confirmIdle, setConfirmIdle] = useState(false);
  const resolved = useRef(false);
  // Pure engine preview; no parallel simulation in the interface.
  const preview = useMemo(() => step(state, plan, setup?.events ?? [], setup?.forecasts), [state, plan, setup]);
  const idle = crew.filter((id) => !state.tired.includes(id) && !plan[id]).length;
  function finish() {
    if (!setup || resolved.current) return;
    if (idle && !confirmIdle) { setConfirmIdle(true); return; }
    resolved.current = true;
    useSession.setState({ before: { ...state.bars }, draft: {} });
    const result = useGame.getState().endSol(plan);
    audio.playSfx("resolve");
    if (result.over && state.sol < MISSION_SOLS) useNav.getState().endEarly();
    else useNav.getState().next();
  }
  return <ScreenFrame title={t("plan.heading", { sol: state.sol })}>
    <p className="lead">{t("planHelp.howTo")}</p>
    <div className="planner-layout"><div>
      <h2 className="step-label">{t("play.crewStep")}</h2>
      <div className="crew-roster">{crew.map((id, i) => <div className={`crew-tile ${selected === id ? "selected" : ""}`} key={id}>
        <button type="button" disabled={state.tired.includes(id)} aria-pressed={selected === id} aria-label={t("crew.name", { n: i + 1 })} onClick={() => { select(id); setConfirmIdle(false); audio.playSfx("select"); }}>
          <img src={asset(`characters/npcs/${portraits[i]}-portrait`)} alt="" />
          <span><strong>{t("crew.name", { n: i + 1 })}</strong><small>{state.tired.includes(id) ? t("crew.tired") : plan[id] ? t(`jobs.${plan[id]}`) : t("crew.idle")}</small></span>
        </button>
        {plan[id] && <button type="button" className="unassign" onClick={() => assign(id)} aria-label={t("play.clearCrew", { n: i + 1 })}>×</button>}
      </div>)}</div>
      <h2 className="step-label">{t("play.jobsStep")}</h2>
      <div className="job-list">{jobIds.map((id, i) => {
        const owner = crew.find((c) => plan[c] === id);
        return <button type="button" className={`job-choice ${owner ? "assigned" : ""}`} key={id}
          disabled={!selected} aria-label={t(`jobs.${id}`)} aria-pressed={Boolean(owner)}
          onClick={() => { if (selected) assign(selected, id); select(null); audio.playSfx("assign"); }}>
          <span className="job-number">0{i + 1}</span><img src={asset(`items/${jobArt[id]}`)} alt="" />
          <span className="job-copy"><strong>{t(`jobs.${id}`)}</strong><small>{t(`jobInfo.${id}.done`)}</small>
            <span className="job-cost">{t("jobInfo.cost", { count: JOBS[id].powerCost })}{JOBS[id].outside ? ` · ${t("jobInfo.outside")}` : ""}</span></span>
          <span className="job-owner">{owner ? t("play.crewNumber", { n: crew.indexOf(owner) + 1 }) : "+"}</span>
        </button>;
      })}</div>
      <div className="planner-guidance" aria-live="polite">{selected ? t("play.chooseJob", { n: crew.indexOf(selected) + 1 }) : t("play.chooseCrew")}</div>
    </div><aside className="plan-outlook">
      <h2>{t("play.preview")}</h2><p className="note">{t("play.previewMeaning")}</p>
      <ResourceMeters bars={preview.state.bars} previous={state.bars} />
      <div className="small-counters"><span>{t("bars.food")} <b>{preview.state.food}</b></span><span>{t("bars.science")} <b>{preview.state.science}</b></span></div>
      <details className="science-details"><summary>{t("play.leftBehind")}</summary>
        {jobIds.filter((id) => !Object.values(plan).includes(id)).map((id) => <p key={id}><b>{t(`jobs.${id}`)}</b><br />{t(`jobInfo.${id}.skipped`)}</p>)}
        {preview.fell.filter((d) => d.sol > state.sol).map((d) => <p key={d.id}>{t(d.textKey as "domino.powerLow")}</p>)}
      </details>
      {confirmIdle && <p role="alert">{t("play.idleConfirm", { count: idle })}</p>}
      <button type="button" className="primary end-sol" disabled={!setup} onClick={finish}>{confirmIdle ? t("play.confirmEnd") : t("plan.endSol")} →</button>
      <p className="note">{t("play.gameUnits")}</p>
    </aside></div>
    <details className="science-details"><summary>{t("play.scienceBehind")}</summary>
      <p>{t("help.askEarth.text")} <WhatsThis topic="askEarth" /></p>
      <DataChip source={LIGHT_DELAY} /><DataChip source={state.earthAnswer?.source ?? DONKI_ENLIL_MAY23} />
      <DataChip source={INSIGHT_DUST} /><DataChip source={RAD_BASELINE} />
    </details>
  </ScreenFrame>;
}
