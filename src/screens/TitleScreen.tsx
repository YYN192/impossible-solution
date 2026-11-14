import { useTranslation } from "react-i18next";
import { useNav } from "../state/screen";
import { ScreenFrame } from "./ScreenFrame";

export function TitleScreen() {
  const { t } = useTranslation();
  const next = useNav((s) => s.next);
  return (
    <ScreenFrame title={t("app.name")}>
      <p className="lead">{t("title.solLine")}</p>
      <div className="actions">
        <button type="button" className="primary" onClick={next}>
          {t("title.start")}
        </button>
      </div>
    </ScreenFrame>
  );
}
