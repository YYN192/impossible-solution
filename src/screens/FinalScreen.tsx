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
import { buildChains } from "./final/buildChains";
import { audio } from "../game/audio";

export type { Stars };

/** Delay between dominoes in the fall effect (CSS turns animation off for reduced motion). */
const FALL_STEP_MS = 250;

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
  const chains = buildChains(dominoes);
  const setup = useMission((s) => s.setup);
  const reload = useMission((s) => s.reload);
  const finish = useProgress((s) => s.finish);
  // The ?demo=1 recording must look the same every time: no Best from earlier games.
  const demo = readFlags().demo;

  useEffect(() => {
    if (!demo) record(stars.count);
    // Finishing a campaign (not an early trip home) opens the next one.
    if (!demo && !endedEarly && setup) finish(setup.campaignId);
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

  const longest = Math.max(0, ...chains.map((c) => c.length));
  const won = !endedEarly && stars.count >= 2;
  useEffect(() => {
    // Chains fall side by side, so one tick per step; none when the animation is off.
    const falls = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ? 0 : longest;
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

      {chains.length > 0 ? (
        <>
          <p className="lead">{t("final.chainIntro")}</p>
          {chains.map((chain, i) => (
            <ChainView key={chain[0].id} chain={chain} label={i} />
          ))}
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
        <span aria-hidden="true">
          {"★".repeat(stars.count)}
          <span className="star-empty">{"☆".repeat(3 - stars.count)}</span>
        </span>{" "}
        {t("final.stars", { count: stars.count })}
      </p>
      <ul className="star-goals">
        {goals.map(({ key, won }) => (
          <li key={key} className={won ? "won" : "missed"}>
            <span aria-hidden="true">{won ? "★ " : "☆ "}</span>
            {t(`final.goal.${key}`)}{" "}
            <span className="visually-hidden">
              {won ? t("final.goalWon") : t("final.goalMissed")}
            </span>
          </li>
        ))}
      </ul>
      {best !== undefined && (
        <p className="note">{t("final.best", { count: best })}</p>
      )}
    </div>
  );
}

/** One chain, problem first, falling backwards to the first cause. */
function ChainView({ chain, label }: { chain: Domino[]; label: number }) {
  const { t } = useTranslation();
  return (
    <ol className="chain" aria-label={t("final.chainLabel", { n: label + 1 })}>
      {chain.map((domino, i) => (
        <li
          key={domino.id}
          style={{ "--fall-delay": `${i * FALL_STEP_MS}ms` } as CSSProperties}
        >
          {i > 0 && <p className="because">{t("morning.because")}</p>}
          <p className="chain-sol">{tRun("final.sol", { sol: domino.sol })}</p>
          <DominoCard domino={domino} fall />
        </li>
      ))}
    </ol>
  );
}
