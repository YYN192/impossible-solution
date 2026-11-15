import { Icon } from "./components/Icon";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { asset } from "./game/assets";
import { audio, useAudio } from "./game/audio";
import { WhatsThis } from "./components/WhatsThis";
import { SettingsPanel } from "./components/SettingsPanel";
import { useComfort } from "./state/comfort";
import { MENU_CAMPAIGNS as CAMPAIGNS } from "./data/campaigns";
import { readFlags } from "./data/flags";
import { tRun } from "./i18n/dynamic";
import "./menu.css";
import { isOpen, useProgress } from "./state/progress";

/** What the player picked on the menu. The app turns it into a run (campaign + seed). */
export interface RunChoice {
  campaign?: string;
  today?: boolean;
  daily?: boolean;
  surprise?: boolean;
}

const stars = Array.from({ length: 48 }, (_, i) => ({ left: `${(i * 37 + 13) % 100}%`, top: `${(i * 61 + 7) % 100}%`, animationDelay: `${-(i % 11)}s` }));

export default function MainMenu({ onPlay, onSources, onTeacher, onChoose, onNew, ready, resume, campaignId }: {
  onPlay: () => void; onSources: () => void; onTeacher: () => void;
  /** Pick another mission (reloads the mission data). */
  onChoose: (choice: RunChoice) => void;
  /** Leave the mission in progress and show the picker again. */
  onNew: () => void;
  ready: boolean; resume: boolean;
  /** The campaign that Start will play. */
  campaignId?: string;
}) {
  const flags = readFlags();
  const { t } = useTranslation();
  const [settings, showSettings] = useState(false);
  const prefs = useAudio();
  const progress = useProgress();
  const special = flags.todaysSun || flags.daily;
  const soundAsked = useComfort((c) => c.soundAsked);
  const answerSound = (muted: boolean) => { if (muted) audio.mute(true); else audio.soundOn(); useComfort.setState({ soundAsked: true }); };
  const pick = (choice: RunChoice) => { audio.playSfx("select"); onChoose(choice); };
  return <main className="mission-menu">
    <div className="drifting-stars" aria-hidden="true">{stars.map((style, i) => <i key={i} style={style} />)}</div>
    <div className="menu-orbit" aria-hidden="true" />
    <div className="menu-stage" onPointerOver={(e) => {
      const button = (e.target as Element).closest("button:not(:disabled)");
      if (button && !button.contains(e.relatedTarget as Node | null)) audio.playSfx("menu-hover");
    }}>
      {!settings ? <>
        <header className="menu-head">
          <p className="eyebrow">{t("menu.eyebrow")}</p>
          <h1>{t("app.name")}</h1><p className="menu-tagline">{t("menu.tagline")}</p>
          {/* #77: asked once, on the first visit; the answer is saved with the comfort settings. */}
          {!soundAsked && <p className="sound-ask"><span>{t("comfort.soundAsk")}</span>
            <button type="button" aria-pressed={!prefs.muted} onClick={() => answerSound(false)}>{t("comfort.soundOn")}</button>
            <button type="button" aria-pressed={prefs.muted} onClick={() => answerSound(true)}>{t("comfort.soundOff")}</button>
            <span>{t("comfort.headphones")}</span></p>}
        </header>
        {resume ? <p className="menu-resume">{t("menu.intro")}</p> : <div className="mission-picker" role="group" aria-label={t("run.pick")}>
          {CAMPAIGNS.map((c) => {
            const open = isOpen(c, progress);
            const moon = c.place === "moon" ? "moon" : undefined;
            return <button type="button" className="mission-card" key={c.id} disabled={!open}
              aria-pressed={!special && campaignId === c.id} onClick={() => pick({ campaign: c.id })}>
              <img className="mission-art" src={asset(`campaign/card-${c.id}`)} alt="" />
              <strong>{open ? null : <><Icon name="lock" />{" "}</>}{tRun(`campaign.${c.id}.name`)}</strong>
              <span className="mission-meta">{tRun(`campaign.${c.id}.where`)} · {tRun("run.sols", { count: c.rules.sols ?? 3 }, moon)} · {t("run.minutes", { count: c.minutes })} · {t(`run.level.${c.difficulty}`)}</span>
              <small>{open ? tRun(`campaign.${c.id}.hook`) : t("run.locked", { name: tRun(`campaign.${c.unlockAfter}.name`) })}</small>
              <span className="mission-tags">{t("run.realData", { list: c.datasets.join(", ") })}</span>
            </button>;
          })}
        </div>}
        <div className="menu-actions">
          <button className="primary launch-button" disabled={!ready} onClick={() => { audio.playSfx("menu"); onPlay(); }}><span aria-hidden="true">▶</span> {!ready ? t("menu.loading") : resume ? t("menu.resume") : t("title.start")}</button>
          {resume && <button onClick={() => { audio.playSfx("menu-back"); onNew(); }}>{t("run.newMission")}</button>}
          {!resume && !flags.offline && <button type="button" className="menu-sun" aria-pressed={flags.todaysSun} onClick={() => pick({ today: true })}>{t("menu.sunToday")}</button>}
          {special && !resume && <p className="note">{flags.todaysSun ? t("run.todayHint") : t("run.dailyHint")}</p>}
        </div>
        <nav className="menu-quiet" aria-label={t("menu.settings")}>
          <button onClick={() => { audio.playSfx("menu-open"); showSettings(true); }}>{t("menu.settings")}</button>
          <button onClick={onSources}>{t("dataSources.open")}</button>
          <button onClick={onTeacher}>{t("teacher.open")}</button>
        </nav>
        <p className="sol-explainer"><span>{t("title.solLine")}</span><WhatsThis topic="sol" placement="up" /></p>
      </> : <section className="menu-panel menu-settings"><SettingsPanel onBack={() => showSettings(false)} /></section>}
    </div>
    <footer className="menu-bottom"><span>{t("menu.edition")}</span><span>{t("app.disclaimer")}</span></footer>
  </main>;
}
