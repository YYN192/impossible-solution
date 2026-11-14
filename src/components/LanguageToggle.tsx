import { useTranslation } from "react-i18next";
import { LANGS } from "../i18n";
import "./LanguageToggle.css";

/** EN | BG switch (#19). Each button names its language in that language, so a kid can find their own. */
export function LanguageToggle() {
  const { t, i18n } = useTranslation();
  return (
    <div className="lang-toggle" role="group" aria-label={t("lang.label")}>
      {LANGS.map((lng) => (
        <button
          key={lng}
          type="button"
          lang={lng}
          aria-label={t(`lang.${lng}`)}
          aria-pressed={i18n.language === lng}
          onClick={() => void i18n.changeLanguage(lng)}
        >
          {lng.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
