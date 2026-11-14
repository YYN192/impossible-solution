import { useTranslation } from "react-i18next";
import { MISSION_SOLS } from "../sim/types";
import { useNav } from "../state/screen";
import { ScreenFrame } from "./ScreenFrame";

/** End of sol: the bars animate here once the engine lands (respect reduced motion). */
export function EndOfSolScreen() {
  const { t } = useTranslation();
  const { sol, next } = useNav();
  const last = sol >= MISSION_SOLS;
  return (
    <ScreenFrame title={t("endSol.heading", { sol })}>
      <div className="actions">
        <button type="button" className="primary" onClick={next}>
          {last ? t("endSol.seeResults") : t("endSol.nextMorning")}
        </button>
      </div>
    </ScreenFrame>
  );
}
