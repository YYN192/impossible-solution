import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

/** Full screen on/off (big classroom screens, tablets). Hidden where the browser has no full-screen mode (iPhone). */
export function FullscreenToggle() {
  const { t } = useTranslation();
  const [on, setOn] = useState(Boolean(document.fullscreenElement));
  useEffect(() => {
    const sync = () => setOn(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);
  if (!document.fullscreenEnabled) return null;
  const toggle = () => void (on ? document.exitFullscreen() : document.documentElement.requestFullscreen()).catch(() => {});
  return <button type="button" className="sound-toggle fullscreen-toggle" aria-pressed={on} onClick={toggle}>
    {on ? t("fullscreen.exit") : t("fullscreen.enter")}
  </button>;
}
