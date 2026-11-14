import { useTranslation } from "react-i18next";
import { useNav } from "../state/screen";
import { ScreenFrame } from "./ScreenFrame";

/**
 * Stand-in so the loop is clickable end to end. Viktor's real Plan screen (#9, branch ui/planner)
 * replaces this in App.tsx; it should call `useNav().next()` from its "End sol" button.
 */
export function StandInPlanScreen() {
  const { t } = useTranslation();
  const { sol, next } = useNav();
  return (
    <ScreenFrame title={t("plan.heading", { sol })}>
      <div className="actions">
        <button type="button" className="primary" onClick={next}>
          {t("plan.endSol")}
        </button>
      </div>
    </ScreenFrame>
  );
}
