import { useTranslation } from "react-i18next";
import { ScreenFrame } from "../components/ScreenFrame";
import { WhatsThis } from "../components/WhatsThis";
import { useMission } from "../state/mission";
import { useNav } from "../state/screen";
import heroArt from "../assets/pixel/backgrounds/mars-menu-hero.png";

export function TitleScreen() {
  const { t } = useTranslation();
  const next = useNav((s) => s.next);
  const ready = useMission((s) => s.status === "ready");
  return (
    <ScreenFrame title={t("app.name")}>
      <img className="title-art" src={heroArt} alt="" aria-hidden="true" />
      <p className="lead">
        <span>{t("title.solLine")}</span> <WhatsThis topic="sol" />
      </p>
      <div className="actions">
        <button
          type="button"
          className="primary pixel-button"
          onClick={next}
          disabled={!ready}
        >
          {t("title.start")}
        </button>
      </div>
    </ScreenFrame>
  );
}
