import { useTranslation } from "react-i18next";
import { ScreenFrame } from "../components/ScreenFrame";
import { demoPlanForSol } from "../data/demo";
import { readFlags } from "../data/flags";
import { MISSION_SOLS, type Plan } from "../sim/types";
import { useGame } from "../state/game";
import { useNav } from "../state/screen";

/** Outside recording mode, the stand-in has no job picker, so nobody is assigned. */
const STAND_IN_PLAN: Plan = {};

/**
 * Stand-in so the loop is clickable end to end. Viktor's real Plan screen (#9, branch ui/planner)
 * replaces this in App.tsx. Its "End sol" button should do what `endSol` below does: run the sol
 * with the player's plan, then go on (or straight to the final screen if the base failed early).
 */
export function StandInPlanScreen() {
  const { t } = useTranslation();
  const { sol, next, endEarly } = useNav();
  const endSol = () => {
    const plan = readFlags().demo ? demoPlanForSol(sol) : STAND_IN_PLAN;
    const state = useGame.getState().endSol(plan);
    if (state.over && sol < MISSION_SOLS) endEarly();
    else next();
  };
  return (
    <ScreenFrame title={t("plan.heading", { sol })}>
      <div className="actions">
        <button type="button" className="primary" onClick={endSol}>
          {t("plan.endSol")}
        </button>
      </div>
    </ScreenFrame>
  );
}
