import { useTranslation } from "react-i18next";
import { MISSION_SOLS } from "../sim/types";
import { useNav } from "../state/screen";
import { ScreenFrame } from "./ScreenFrame";

/** Morning report. #13 fills this in: fallen domino first, then storm / Earth's answer + data chip. */
export function MorningScreen() {
  const { t } = useTranslation();
  const { sol, next } = useNav();
  return (
    <ScreenFrame title={t("morning.heading", { sol })}>
      <p className="note">{t("common.solOf", { sol, total: MISSION_SOLS })}</p>
      <div className="actions">
        <button type="button" className="primary" onClick={next}>
          {t("morning.goPlan")}
        </button>
      </div>
    </ScreenFrame>
  );
}
