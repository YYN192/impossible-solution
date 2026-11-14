import { useTranslation } from "react-i18next";
import { useNav } from "../state/screen";
import { ScreenFrame } from "./ScreenFrame";
import { WhatsThis } from "../components/WhatsThis";
import heroArt from "../assets/pixel/backgrounds/mars-menu-hero.png";

export function TitleScreen() {
  const { t } = useTranslation();
  const next = useNav((s) => s.next);
  return (
    <ScreenFrame title={t("app.name")}>
      <img className="title-art" src={heroArt} alt="" aria-hidden="true" />
      <p className="lead">
        <span>{t("title.solLine")}</span> <WhatsThis topic="sol" />
      </p>
      <div className="actions">
        <button type="button" className="primary pixel-button" onClick={next}>
          {t("title.start")}
        </button>
      </div>
    </ScreenFrame>
  );
}
