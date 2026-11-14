import { useState } from "react";
import { useTranslation } from "react-i18next";
import { asset } from "./game/assets";
import { audio, useAudio } from "./game/audio";
import { WhatsThis } from "./components/WhatsThis";
import { readFlags } from "./data/flags";
const stars = Array.from({ length: 48 }, (_, i) => ({ left: `${(i * 37 + 13) % 100}%`, top: `${(i * 61 + 7) % 100}%`, animationDelay: `${-(i % 11)}s` }));
export default function MainMenu({ onPlay, onSources, onTeacher, onChooseSun, ready, resume }: {
  onPlay: () => void; onSources: () => void; onTeacher: () => void; onChooseSun?: (today: boolean) => void; ready: boolean; resume: boolean;
}) {
  const flags = readFlags();
  const { t } = useTranslation();
  const [settings, showSettings] = useState(false);
  const [quit, setQuit] = useState(false);
  const prefs = useAudio();
  return <main className="mission-menu">
    <div className="drifting-stars" aria-hidden="true">{stars.map((style, i) => <i key={i} style={style} />)}</div>
    <div className="menu-orbit" aria-hidden="true" />
    <div className="menu-layout"><div className="menu-story">
      <p className="eyebrow"><span className="beacon-dot" />{t("menu.eyebrow")}</p>
      <h1>{t("app.name")}</h1><p className="menu-tagline">{t("menu.tagline")}</p>
      <div className="menu-landscape"><img src={asset("backgrounds/mars-menu-hero")} alt="" /><span>{t("menu.coordinates")}</span></div>
      <div className="mission-facts"><span><b>03</b>{t("menu.crew")}</span><span><b>03</b>{t("menu.days")}</span><span><b>01</b>{t("menu.home")}</span></div>
    </div><section className="menu-panel" onPointerOver={(e) => {
      const button = (e.target as Element).closest("button:not(:disabled)");
      if (button && !button.contains(e.relatedTarget as Node | null)) audio.playSfx("menu-hover");
    }}>
      <div className="panel-rivets" aria-hidden="true">+ <span>+</span></div>
      {!settings ? <>
        <p className="eyebrow">{t("menu.welcome")}</p><h2>{t("menu.ready")}</h2><p>{t("menu.intro")}</p>
        {!resume && !flags.offline && onChooseSun && <div role="group" aria-label={t("menu.sunToday")}>
          {[false, true].map((today) => <button key={String(today)} aria-pressed={flags.todaysSun === today} onClick={() => flags.todaysSun !== today && onChooseSun(today)}>{t(today ? "menu.sunToday" : "menu.sunMay")}</button>)}
          <p className="note">{t(flags.todaysSun ? "menu.sunTodayHint" : "menu.sunMayHint")}</p>
        </div>}
        <button className="primary launch-button" disabled={!ready} onClick={() => { audio.playSfx("menu"); onPlay(); }}><span aria-hidden="true">▶</span>{!ready ? t("menu.loading") : resume ? t("menu.resume") : t("title.start")}</button>
        <button onClick={() => { audio.playSfx("menu-open"); showSettings(true); }}>{t("menu.settings")}</button>
        <button onClick={onSources}>{t("dataSources.open")}</button>
        <button onClick={onTeacher}>{t("teacher.open")}</button>
        <button className="quiet-button" onClick={() => { audio.playSfx("menu-back"); window.close(); setQuit(true); }}>{t("menu.quit")}</button>
        {quit && <p role="status">{t("menu.closeTab")}</p>}
        <p className="sol-explainer"><span>{t("title.solLine")}</span><WhatsThis topic="sol" /></p>
      </> : <>
        <p className="eyebrow">{t("menu.preferences")}</p><h2>{t("menu.settings")}</h2>
        {(["master", "music", "sfx"] as const).map((key) => <label className="volume-control" key={key}>{t(`menu.${key}`)}<span>{Math.round(prefs[key] * 100)}%</span><input type="range" min={0} max={100} value={Math.round(prefs[key] * 100)} onChange={(e) => { useAudio.setState({ [key]: Number(e.target.value) / 100 }); audio.playSfx("volume-change"); }} /></label>)}
        <button aria-pressed={prefs.muted} onClick={() => audio.mute(!prefs.muted)}>{prefs.muted ? t("menu.unmute") : t("menu.mute")}</button>
        <p className="note">{t("menu.silent")}</p><button className="primary" onClick={() => { audio.playSfx("menu-back"); showSettings(false); }}>{t("dataSources.back")}</button>
      </>}
      <div className="panel-rivets" aria-hidden="true">+ <span>+</span></div>
    </section></div>
    <footer className="menu-bottom"><span>{t("menu.edition")}</span><span>{t("app.disclaimer")}</span></footer>
  </main>;
}
