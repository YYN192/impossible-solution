import { Icon } from "./Icon";
import { useTranslation } from "react-i18next";
import { audio, useAudio } from "../game/audio";

/** Sound on/off. Pressed = sound is on. Tap target stays ≥ 44 px from the global button rule. */
export function SoundToggle() {
  const { t } = useTranslation();
  const muted = useAudio((s) => s.muted);
  return (
    <button
      type="button"
      className="sound-toggle"
      aria-label={t("sound.toggle")}
      title={t("sound.toggle")}
      aria-pressed={!muted}
      onClick={() => audio.mute(!muted)}
    >
      <Icon name={muted ? "sound-off" : "sound-on"} />
    </button>
  );
}
