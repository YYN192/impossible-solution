import { reducedMotion } from "../state/comfort";
import { Icon } from "../components/Icon";
import { useEffect, type CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import { DominoCard } from "../components/DominoCard";
import { ScreenFrame } from "../components/ScreenFrame";
import { readFlags } from "../data/flags";
import { rulesOf, stars as starsOf, type Stars } from "../sim/engine";
import type { Domino } from "../sim/types";
import { tRun } from "../i18n/dynamic";
import { useMission } from "../state/mission";
import { useProgress } from "../state/progress";
import { useBest } from "../state/best";
import { useGame } from "../state/game";
import { useNav } from "../state/screen";
import { buildRows, type Row } from "./final/buildRows";
import { audio } from "../game/audio";

export type { Stars };

/** Delay between dominoes in the fall effect (CSS turns animation off for reduced motion). */
const FALL_STEP_MS = 250;
/** Rows shown at once; the rest sit behind "Show more" so the screen stays short. */
const SHOWN = 3;

/**
 * Final screen (#14): every problem traced back to its first cause, 1–3 stars + Best,
 * and "Try a different plan" (same start).
 */
export function FinalScreen() {
  const state = useGame((s) => s.state);
  return (
    <FinalView
      dominoes={state.dominoes}
      stars={starsOf(state)}
      endedEarly={state.sol < rulesOf(state).sols}
    />
  );
}

export function FinalView({
  dominoes,
  stars,
  endedEarly = false,
}: {
  dominoes: Domino[];
  stars: Stars;
  endedEarly?: boolean;
}) {
  const { t } = useTranslation();
  const { restart, home } = useNav();
  const best = useBest((s) => s.best);
  const record = useBest((s) => s.record);
  const rows = buildRows(dominoes);
  const setup = useMission((s) => s.setup);
  const reload = useMission((s) => s.reload);
  const finish = useProgress((s) => s.finish);
  // The ?demo=1 recording must look the same every time: no Best from earlier games.
  const demo = readFlags().demo;

  useEffect(() => {
    if (!demo) record(stars.count);
    // Finishing a campaign (not an early trip home) opens the next one.
    if (!demo && !endedEarly && setup) finish(setup.campaignId === "classic" ? "storm" : setup.campaignId);
  }, [demo, record, stars.count, endedEarly, setup, finish]);

  /** A new run of the same campaign: without a seed in the link, the next run draws a new one. */
  const again = () => {
    const q = new URLSearchParams(window.location.search);
    q.delete("seed");
    const search = q.toString();
    window.history.replaceState({}, "", `${window.location.pathname}${search ? `?${search}` : ""}`);
    audio.playSfx("replay-start");
    void reload().then(() => restart());
  };

  const longest = Math.max(0, ...rows.map((r) => r.links.length));
  const won = !endedEarly && stars.count >= 2;
  useEffect(() => {
    // Chains fall side by side, so one tick per step; none when the animation is off.
    const falls = reducedMotion() ? 0 : longest;
    const timers = Array.from({ length: falls }, (_, i) => setTimeout(() => audio.playSfx("domino-fall"), i * FALL_STEP_MS + 300));
    timers.push(setTimeout(() => audio.playSfx(won ? "mission-success" : "mission-failure"), falls * FALL_STEP_MS + 600));
    return () => timers.forEach(clearTimeout);
  }, [longest, won]);

  return (
    <ScreenFrame
      title={endedEarly ? t("final.endedEarly") : t("final.heading")}
    >
      <StarRow
        stars={stars}
        best={demo ? undefined : Math.max(best, stars.count)}
      />

      {rows.length > 0 ? (
        <>
          <p className="lead">{t("final.chainIntro")}</p>
          {rows.slice(0, SHOWN).map((row, i) => (
            <RowView key={row.links.map((l) => l.domino.id).join(">")} row={row} label={i} />
          ))}
          {rows.length > SHOWN && (
            <details className="more-chains">
              <summary>{t("final.more", { count: rows.length - SHOWN })}</summary>
              {rows.slice(SHOWN).map((row, i) => (
                <RowView key={row.links.map((l) => l.domino.id).join(">")} row={row} label={SHOWN + i} />
              ))}
            </details>
          )}
        </>
      ) : (
        <p className="lead">{t("final.noChain")}</p>
      )}

      {setup && (
        <div className="campaign-ending">
          <p><strong>{t("run.planners")}:</strong> {tRun(`campaign.${setup.campaignId}.planners`)}</p>
          {!demo && <p className="note run-seed" title={t("run.seedHint", { seed: setup.seed })}>{t("run.seed", { seed: setup.seed })}</p>}
        </div>
      )}

      <div className="actions">
        <button type="button" className="primary" onClick={() => { audio.playSfx("replay-start"); restart(); }}>
          {t("final.tryAgain")}
        </button>
        {!demo && setup?.kind === "campaign" && (
          <button type="button" onClick={again}>{t("run.again")}</button>
        )}
        <button type="button" onClick={() => { audio.playSfx("menu-back"); home(); }}>
          {t("final.home")}
        </button>
      </div>
    </ScreenFrame>
  );
}

function StarRow({ stars, best }: { stars: Stars; best?: number }) {
  const { t } = useTranslation();
  const goals = [
    { key: "crewSafe", won: stars.crewSafe },
    { key: "baseRunning", won: stars.baseRunning },
    { key: "science", won: stars.science },
  ] as const;
  return (
    <div className="stars">
      <p className="stars-count">
        <span className="star-icons" aria-hidden="true">
          {[0, 1, 2].map((i) => <Icon key={i} name={i < stars.count ? "star" : "star-empty"} />)}
        </span>{" "}
        {t("final.stars", { count: stars.count })}
      </p>
      <ul className="star-goals">
        {goals.map(({ key, won }) => (
          <li key={key} className={won ? "won" : "missed"}>
            <Icon name={won ? "star" : "star-empty"} />{" "}
            {t(`final.goal.${key}`)}{" "}
            <span className="visually-hidden">
              {won ? t("final.goalWon") : t("final.goalMissed")}
            </span>
          </li>
        ))}
      </ul>
      {best !== undefined && (
        <p className="note"><Icon name="star" /> {t("final.best", { count: best })}</p>
      )}
    </div>
  );
}

/** One row of dominoes: first cause on the left, the result on the right, toppling in order. */
function RowView({ row, label }: { row: Row; label: number }) {
  const { t } = useTranslation();
  return (
    <div className="chain-row">
      <ol className="chain" aria-label={t("final.chainLabel", { n: label + 1 })}>
        {row.links.map(({ domino, sols }, i) => (
          <li key={domino.id} style={{ "--fall-delay": `${i * FALL_STEP_MS}ms` } as CSSProperties}>
            {i > 0 && (
              <span className="domino-arrow">
                <span aria-hidden="true">→</span>
                <span className="visually-hidden">{t("final.so")}</span>
              </span>
            )}
            <div className="domino-tile">
              <p className="chain-sol">{tRun("final.sol", { sol: [...new Set(sols)].join(", ") }, useMission.getState().setup?.place)}</p>
              <DominoCard domino={domino} fall />
            </div>
          </li>
        ))}
      </ol>
      {row.count > 1 && <p className="note chain-times">×{row.count} · {t("final.times", { count: row.count })}</p>}
    </div>
  );
}
