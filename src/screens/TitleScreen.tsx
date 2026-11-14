import { useTranslation } from "react-i18next";
import { ScreenFrame } from "../components/ScreenFrame";
import { useNav } from "../state/screen";
import heroArt from "../assets/pixel/backgrounds/mars-menu-hero.png";

export function TitleScreen() {
  const { t } = useTranslation();
  const next = useNav((s) => s.next);
  return (
    <ScreenFrame title={t("app.name")}>
      <img className="title-art" src={heroArt} alt="" aria-hidden="true" />
      <p className="lead">{t("title.solLine")}</p>
      <div className="actions">
        <button type="button" className="primary pixel-button" onClick={next}>
          {t("title.start")}
        </button>
      </div>
    </ScreenFrame>
  );
}
