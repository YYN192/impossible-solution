import { useTranslation } from "react-i18next";
import { MISSION_SOLS, type Plan } from "../sim/types";
import { useGame } from "../state/game";
import { useNav } from "../state/screen";
import { ScreenFrame } from "./ScreenFrame";

/** The stand-in has no job picker, so every sol runs with nobody assigned. */
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
    const state = useGame.getState().endSol(STAND_IN_PLAN);
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
