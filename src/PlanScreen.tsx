import { useMemo, useState } from "react";
import { en } from "./i18n/en";
import {
  DOSE,
  JOBS,
  NIGHT,
  type CrewId,
  type GameState,
  type JobId,
  type Plan,
} from "./sim/types";

const crew: Array<{
  id: CrewId;
  name: string;
  role: string;
  initials: string;
}> = [
  {
    id: "a1",
    name: en.plan.crew.nova.name,
    role: en.plan.crew.nova.role,
    initials: "N",
  },
  {
    id: "a2",
    name: en.plan.crew.kai.name,
    role: en.plan.crew.kai.role,
    initials: "K",
  },
  {
    id: "a3",
    name: en.plan.crew.amani.name,
    role: en.plan.crew.amani.role,
    initials: "A",
  },
];

const jobIds: JobId[] = [
  "panels",
  "greenhouse",
  "shelter",
  "askEarth",
  "science",
];
const initialState: GameState = {
  sol: 1,
  bars: { power: 7, air: 8, dose: 0.4 },
  food: 1,
  science: 0,
  panelEfficiency: 0.65,
  shelterSols: 0,
  tired: [],
  dominoes: [],
  over: false,
};
const clamp = (value: number) => Math.min(10, Math.max(0, value));

export default function PlanScreen() {
  const [plan, setPlan] = useState<Plan>({});
  const [selectedCrew, setSelectedCrew] = useState<CrewId | null>(null);
  const [locked, setLocked] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const assignedJobs = useMemo(() => Object.values(plan), [plan]);

  const preview = useMemo(() => {
    const powerCost = assignedJobs.reduce(
      (total, id) => total + JOBS[id].powerCost,
      0,
    );
    const outsideJobs = assignedJobs.filter((id) => JOBS[id].outside).length;
    const totalPowerCost = powerCost + NIGHT.airMachinePower;
    return {
      power: clamp(initialState.bars.power - totalPowerCost),
      air: initialState.bars.air,
      dose: clamp(
        initialState.bars.dose +
          DOSE.normalDay +
          outsideJobs * DOSE.outsideExtra,
      ),
      food: initialState.food + (assignedJobs.includes("greenhouse") ? 1 : 0),
      powerCost: totalPowerCost,
      outsideJobs,
    };
  }, [assignedJobs]);

  function assignJob(jobId: JobId) {
    if (!selectedCrew || locked) return;
    setPlan((current) => {
      const next = { ...current };
      const otherCrew = Object.entries(next).find(
        ([, assigned]) => assigned === jobId,
      )?.[0] as CrewId | undefined;
      if (otherCrew && otherCrew !== selectedCrew) delete next[otherCrew];
      next[selectedCrew] = jobId;
      return next;
    });
    setSelectedCrew(null);
  }

  function removeAssignment(crewId: CrewId) {
    if (locked) return;
    setPlan((current) => {
      const next = { ...current };
      delete next[crewId];
      return next;
    });
    setSelectedCrew(null);
  }

  return (
    <main className="mission-shell">
      <header className="topbar">
        <a className="brand" href="#mission" aria-label={en.app.title}>
          <span className="brand-mark" aria-hidden="true">
            <span />
          </span>
          <span className="brand-name">{en.app.title}</span>
        </a>
        <div className="topbar-right">
          <span className="data-badge">
            <span className="status-dot" />
            {en.plan.snapshotBadge}
          </span>
          <button
            className="help-button"
            type="button"
            onClick={() => setShowHint(!showHint)}
            aria-expanded={showHint}
          >
            <span aria-hidden="true">?</span>
            {en.plan.helpButton}
          </button>
        </div>
      </header>

      {showHint && (
        <div className="hint-popover" role="status">
          <strong>{en.plan.helpTitle}</strong>
          <p>{en.plan.helpBody}</p>
        </div>
      )}

      <section className="mission-heading" id="mission">
        <div>
          <p className="eyebrow">{en.plan.eyebrow}</p>
          <h1>{en.plan.title}</h1>
          <p className="heading-copy">{en.plan.subtitle}</p>
        </div>
        <div className="sol-progress" aria-label={en.plan.solProgressLabel}>
          <div className="sol-progress-label">
            <span>{en.plan.solLabel} 01</span>
            <span>{en.plan.ofLabel} 03</span>
          </div>
          <div className="sol-progress-track">
            <span />
          </div>
          <span className="sol-progress-caption">{en.plan.dayOnMars}</span>
        </div>
      </section>

      <section className="morning-card" aria-labelledby="morning-title">
        <div className="morning-copy">
          <span className="morning-icon" aria-hidden="true">
            ☀️
          </span>
          <div>
            <p className="eyebrow">{en.plan.morningReport}</p>
            <h2 id="morning-title">{en.plan.reportTitle}</h2>
            <p>{en.plan.reportBody}</p>
          </div>
        </div>
        <div className="storm-alert">
          <span className="storm-icon" aria-hidden="true">
            ☄
          </span>
          <div>
            <span className="storm-label">{en.plan.stormLabel}</span>
            <strong>{en.plan.stormTitle}</strong>
            <span className="storm-sol">{en.plan.stormTiming}</span>
          </div>
          <span className="alert-pulse" aria-hidden="true" />
        </div>
      </section>

      <section className="resource-section" aria-label={en.plan.resourcesTitle}>
        <div className="section-heading">
          <div>
            <p className="eyebrow">{en.plan.resourcesEyebrow}</p>
            <h2>{en.plan.resourcesTitle}</h2>
          </div>
          <span className="game-number-tag">{en.plan.gameNumbers}</span>
        </div>
        <div className="resource-grid">
          <ResourceCard
            icon="⚡"
            label={en.plan.resources.power}
            value={preview.power}
            start={initialState.bars.power}
            delta={
              preview.powerCost
                ? en.plan.powerCommitted.replace(
                    "{value}",
                    String(preview.powerCost),
                  )
                : en.plan.powerReady
            }
            tone="power"
          />
          <ResourceCard
            icon="🫧"
            label={en.plan.resources.air}
            value={preview.air}
            start={initialState.bars.air}
            delta={en.plan.airStable}
            tone="air"
          />
          <ResourceCard
            icon="☢️"
            label={en.plan.resources.dose}
            value={preview.dose}
            start={initialState.bars.dose}
            delta={
              preview.outsideJobs
                ? en.plan.outsideDose.replace(
                    "{count}",
                    String(preview.outsideJobs),
                  )
                : en.plan.normalDose
            }
            tone="dose"
            isDose
          />
          <div className="food-counter">
            <span className="food-icon" aria-hidden="true">
              🥬
            </span>
            <div>
              <span className="resource-label">{en.plan.resources.food}</span>
              <strong>
                {preview.food}
                <small> / 5</small>
              </strong>
              <span className="resource-delta">
                {assignedJobs.includes("greenhouse")
                  ? en.plan.foodGrowing
                  : en.plan.foodWaiting}
              </span>
            </div>
          </div>
        </div>
        <p className="preview-note">
          <span aria-hidden="true">↗</span>
          {en.plan.previewNote}
        </p>
      </section>

      <section className="planning-layout" aria-label={en.plan.assignmentTitle}>
        <div className="crew-panel">
          <div className="section-heading crew-heading">
            <div>
              <p className="eyebrow">{en.plan.stepOne}</p>
              <h2>{en.plan.crewTitle}</h2>
            </div>
            <span className="count-pill">
              {assignedJobs.length}
              <span> / 3</span>
            </span>
          </div>
          <p className="panel-instruction">
            {selectedCrew ? en.plan.crewSelected : en.plan.crewInstruction}
          </p>
          <div className="crew-list">
            {crew.map((person, index) => {
              const assignedJob = plan[person.id];
              const selected = selectedCrew === person.id;
              return (
                <div
                  className={
                    "crew-card" +
                    (selected ? " is-selected" : "") +
                    (assignedJob ? " is-assigned" : "")
                  }
                  key={person.id}
                >
                  <button
                    type="button"
                    className="crew-select"
                    onClick={() => setSelectedCrew(selected ? null : person.id)}
                    disabled={locked}
                    aria-pressed={selected}
                    aria-label={en.plan.selectCrew.replace(
                      "{name}",
                      person.name,
                    )}
                  >
                    <span className={"crew-avatar avatar-" + (index + 1)}>
                      {person.initials}
                      <span className="crew-online" />
                    </span>
                    <span className="crew-info">
                      <strong>{person.name}</strong>
                      <small>{person.role}</small>
                    </span>
                    <span className="crew-check" aria-hidden="true">
                      {assignedJob ? "✓" : "+"}
                    </span>
                  </button>
                  <div className="crew-assignment">
                    {assignedJob ? (
                      <>
                        <span className="assignment-dot" />
                        {en.plan.jobNames[assignedJob]}
                        <button
                          type="button"
                          onClick={() => removeAssignment(person.id)}
                          aria-label={en.plan.removeAssignment.replace(
                            "{name}",
                            person.name,
                          )}
                        >
                          ×
                        </button>
                      </>
                    ) : (
                      <span className="idle-label">{en.plan.unassigned}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="crew-footnote">
            <span aria-hidden="true">✦</span>
            {en.plan.crewFootnote}
          </div>
        </div>

        <div className="jobs-panel">
          <div className="section-heading jobs-heading">
            <div>
              <p className="eyebrow">{en.plan.stepTwo}</p>
              <h2>{en.plan.jobsTitle}</h2>
            </div>
            <span className="job-count">{en.plan.jobCount}</span>
          </div>
          <p className="panel-instruction">{en.plan.jobsInstruction}</p>
          <div className="jobs-grid">
            {jobIds.map((jobId) => {
              const job = en.plan.jobs[jobId];
              const assignedCrew = crew.find(
                (person) => plan[person.id] === jobId,
              );
              const disabled = !selectedCrew || locked;
              return (
                <button
                  className={
                    "job-card" +
                    (assignedCrew ? " is-assigned" : "") +
                    (selectedCrew && !locked ? " is-available" : "")
                  }
                  type="button"
                  key={jobId}
                  onClick={() => assignJob(jobId)}
                  disabled={disabled}
                  aria-label={
                    assignedCrew
                      ? en.plan.assignedJob
                          .replace("{job}", job.title)
                          .replace("{name}", assignedCrew.name)
                      : en.plan.assignJob.replace("{job}", job.title)
                  }
                >
                  <span className="job-card-top">
                    <span className="job-icon" aria-hidden="true">
                      {job.icon}
                    </span>
                    <span
                      className={
                        "job-tag " +
                        (JOBS[jobId].outside ? "outside-tag" : "inside-tag")
                      }
                    >
                      {JOBS[jobId].outside ? en.plan.outside : en.plan.inside}
                    </span>
                    {assignedCrew && (
                      <span className="job-assignee">
                        {assignedCrew.initials}
                      </span>
                    )}
                  </span>
                  <span className="job-title">{job.title}</span>
                  <span className="job-description">{job.description}</span>
                  <span className="job-effect">
                    <span className="effect-label">{en.plan.ifDone}</span>
                    <strong>{job.effect}</strong>
                  </span>
                  <span className="job-cost">
                    <span>{job.cost}</span>
                    {JOBS[jobId].powerCost > 0 && (
                      <span className="power-cost">
                        ⚡ −{JOBS[jobId].powerCost}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="domino-preview" aria-label={en.plan.dominoTitle}>
        <div className="domino-heading">
          <span className="domino-spark" aria-hidden="true">
            ✳
          </span>
          <div>
            <p className="eyebrow">{en.plan.dominoEyebrow}</p>
            <h2>{en.plan.dominoTitle}</h2>
          </div>
        </div>
        <div className="domino-chain">
          <DominoStep
            icon="🧽"
            label={en.plan.dominoPanels}
            muted={!assignedJobs.includes("panels")}
          />
          <span className="chain-arrow" aria-hidden="true">
            →
          </span>
          <DominoStep
            icon="⚡"
            label={en.plan.dominoPower}
            muted={!assignedJobs.includes("panels")}
          />
          <span className="chain-arrow" aria-hidden="true">
            →
          </span>
          <DominoStep
            icon="🥬"
            label={en.plan.dominoGreenhouse}
            muted={
              !assignedJobs.includes("panels") ||
              !assignedJobs.includes("greenhouse")
            }
          />
        </div>
        <p className="domino-note">{en.plan.dominoNote}</p>
      </section>

      <footer className="plan-footer">
        <div className="plan-status">
          <span
            className={"status-ring" + (locked ? " is-locked" : "")}
            aria-hidden="true"
          >
            {locked ? "✓" : assignedJobs.length}
          </span>
          <div>
            <strong>
              {locked
                ? en.plan.lockedTitle
                : en.plan.footerTitle.replace(
                    "{count}",
                    String(assignedJobs.length),
                  )}
            </strong>
            <span>
              {locked
                ? en.plan.lockedBody
                : crew.length - assignedJobs.length > 0
                  ? en.plan.idleWarning.replace(
                      "{count}",
                      String(crew.length - assignedJobs.length),
                    )
                  : en.plan.allCrewAssigned}
            </span>
          </div>
        </div>
        <button
          className="lock-button"
          type="button"
          onClick={() => {
            setLocked(!locked);
            setSelectedCrew(null);
          }}
        >
          <span>{locked ? en.plan.editPlan : en.plan.lockPlan}</span>
          <span aria-hidden="true">{locked ? "↺" : "→"}</span>
        </button>
      </footer>
    </main>
  );
}

function ResourceCard({
  icon,
  label,
  value,
  start,
  delta,
  tone,
  isDose = false,
}: {
  icon: string;
  label: string;
  value: number;
  start: number;
  delta: string;
  tone: "power" | "air" | "dose";
  isDose?: boolean;
}) {
  const display = (number: number) =>
    Number.isInteger(number) ? String(number) : number.toFixed(1);
  const percent = Math.min(100, (value / 10) * 100);
  return (
    <div className={"resource-card " + tone}>
      <div className="resource-top">
        <span className="resource-icon" aria-hidden="true">
          {icon}
        </span>
        <span className="resource-label">{label}</span>
        {isDose && (
          <span className="dose-guidance">{en.plan.lowerIsSafer}</span>
        )}
        <span className="resource-more" title={en.plan.gameNumberTooltip}>
          i
        </span>
      </div>
      <div className="resource-reading">
        <strong>{display(value)}</strong>
        <span>/ 10</span>
        <small>
          {en.plan.nowLabel} {display(start)}
        </small>
      </div>
      <div
        className={"meter-track" + (isDose ? " dose-meter" : "")}
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={10}
        aria-valuenow={value}
      >
        <span style={{ width: percent + "%" }} />
      </div>
      <span className="resource-delta">{delta}</span>
    </div>
  );
}

function DominoStep({
  icon,
  label,
  muted,
}: {
  icon: string;
  label: string;
  muted: boolean;
}) {
  return (
    <div className={"domino-step" + (muted ? " is-muted" : "")}>
      <span aria-hidden="true">{icon}</span>
      <strong>{label}</strong>
    </div>
  );
}
