import { useTranslation } from "react-i18next";
import { audio, useAudio } from "../game/audio";
import { TEXT_SIZES, useComfort, type Comfort } from "../state/comfort";

type Flag = "calm" | "contrast" | "skipMiniGames" | "slowMiniGames";

/** Sound and comfort settings (#77), shared by the menu's Settings and the Settings button on every screen. */
export function SettingsPanel({ onBack }: { onBack: () => void }) {
  const { t } = useTranslation();
  const prefs = useAudio();
  const comfort = useComfort();
  const toggle = (key: Flag) => <button type="button" className="comfort-toggle" aria-pressed={comfort[key]}
    onClick={() => { audio.playSfx("select"); useComfort.setState({ [key]: !comfort[key] } as Partial<Comfort>); }}>{t(`comfort.${key}`)}</button>;
  return <>
    <p className="eyebrow">{t("menu.preferences")}</p><h2>{t("menu.settings")}</h2>
    {(["master", "music", "sfx"] as const).map((key) => <label className="volume-control" key={key}>{t(`menu.${key}`)}<span>{Math.round(prefs[key] * 100)}%</span><input type="range" min={0} max={100} value={Math.round(prefs[key] * 100)} onChange={(e) => { useAudio.setState({ [key]: Number(e.target.value) / 100 }); audio.playSfx("volume-change"); }} /></label>)}
    <button type="button" className="comfort-toggle" aria-pressed={prefs.muted} onClick={() => audio.mute(!prefs.muted)}>{t("comfort.quiet")}</button>
    <p className="note">{t("menu.silent")}</p>
    <h3 className="comfort-heading">{t("comfort.title")}</h3>
    {toggle("calm")}
    {toggle("contrast")}
    <div className="comfort-sizes" role="group" aria-label={t("comfort.textSize")}>
      <span aria-hidden="true">{t("comfort.textSize")}</span>
      {TEXT_SIZES.map((size) => <button type="button" key={size} aria-pressed={comfort.textSize === size}
        onClick={() => { audio.playSfx("select"); useComfort.setState({ textSize: size }); }}>{size}%</button>)}
    </div>
    {toggle("skipMiniGames")}
    {toggle("slowMiniGames")}
    <p className="note">{t("comfort.saved")}</p>
    <button type="button" className="primary" onClick={() => { audio.playSfx("menu-back"); onBack(); }}>{t("dataSources.back")}</button>
  </>;
}
