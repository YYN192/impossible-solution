import { useEffect, type CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import { MISSION_SOLS, type Domino } from "../sim/types";
import { useBest } from "../state/best";
import { useNav } from "../state/screen";
import { DominoCard } from "./DominoCard";
import { fakeFinal } from "./fakeGame";
import { buildChains } from "./final/buildChains";
import { ScreenFrame } from "./ScreenFrame";

/** Same shape as the engine's `stars(state)` result (src/sim/engine.ts on sim/engine). */
export interface Stars {
  /** Dose stayed under the limit. */
  crewSafe: boolean;
  /** No bar hit 0. */
  baseRunning: boolean;
  /** Science goal reached. */
  science: boolean;
  count: 0 | 1 | 2 | 3;
}

/** Delay between dominoes in the fall effect (CSS turns animation off for reduced motion). */
const FALL_STEP_MS = 250;

/**
 * Final screen (#14): every problem traced back to its first cause, 1–3 stars + Best,
 * and "Try a different plan" (same start).
 */
export function FinalScreen() {
  const { sol } = useNav();
  // TODO(engine): replace fakeFinal with GameState.dominoes and stars(state).
  const { dominoes, stars } = fakeFinal();
  return (
    <FinalView
      dominoes={dominoes}
      stars={stars}
      endedEarly={sol < MISSION_SOLS}
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

  useEffect(() => {
    record(stars.count);
  }, [record, stars.count]);

  return (
    <ScreenFrame
      title={endedEarly ? t("final.endedEarly") : t("final.heading")}
    >
      <StarRow stars={stars} best={Math.max(best, stars.count)} />

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

      <div className="actions">
        <button type="button" className="primary" onClick={restart}>
          {t("final.tryAgain")}
        </button>
        <button type="button" onClick={home}>
          {t("final.home")}
        </button>
      </div>
    </ScreenFrame>
  );
}

function StarRow({ stars, best }: { stars: Stars; best: number }) {
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
      <p className="note">{t("final.best", { count: best })}</p>
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
          <p className="chain-sol">{t("final.sol", { sol: domino.sol })}</p>
          <DominoCard domino={domino} fall />
        </li>
      ))}
    </ol>
  );
}
