import { useTranslation } from "react-i18next";
import { useNav } from "../state/screen";
import { ScreenFrame } from "./ScreenFrame";

/** Final screen. #14 fills this in: domino chain (follow causeIds), 1–3 stars + Best. */
export function FinalScreen() {
  const { t } = useTranslation();
  const { restart, home } = useNav();
  return (
    <ScreenFrame title={t("final.heading")}>
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
