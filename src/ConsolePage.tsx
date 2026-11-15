import { useEffect, type ReactNode } from "react";
import { audio } from "./game/audio";
import { useTranslation } from "react-i18next";
import { useNav } from "./state/screen";
import { useGame } from "./state/game";
import { useMission } from "./state/mission";
import { EarthAnswer } from "./components/EarthAnswer";
import { tRun } from "./i18n/dynamic";
import { asset } from "./game/assets";

export default function ConsolePage({ children, onExit }: { children: ReactNode; onExit: () => void }) {
  const { t } = useTranslation();
  const { screen, sol } = useNav();
  const answer = useGame((s) => s.state.earthAnswer);
  const events = useMission((s) => s.setup?.events);
  const sols = useMission((s) => s.setup?.rules.sols) ?? 3;
  const moon = useMission((s) => s.setup?.place) === "moon" ? "moon" : undefined;
  // A separate earned inbox, not a change to pickMorning's one-extra-line contract.
  const showInbox = screen === "morning" && answer && events?.some((e) => e.sol === sol);
  useEffect(() => { audio.playSfx("console-boot"); audio.playMusic("mission-console-ambience"); return audio.stopMusic; }, []);
  return <main className="mission-console">
    <header className="console-top"><button onClick={() => { audio.playSfx("console-close"); onExit(); }}>← {t("world.return")}</button><div><span className="eyebrow">{t("world.name")}</span><b>{t("world.console")}</b></div></header>
    <div className="sol-navigation" aria-label={t("play.progress")}>{Array.from({ length: sols }, (_, i) => i + 1).map((day) => <span key={day} aria-current={day === sol ? "step" : undefined} className={day <= sol ? "reached" : ""}><i />{tRun("final.sol", { sol: day }, moon)}</span>)}</div>
    <div className="console-content">{showInbox && <aside className="earth-inbox" aria-label={t("play.earthInbox")}>
      <img src={asset("characters/robots/mission-control-hologram-portrait")} alt="" /><div><strong>{t("play.earthInbox")}</strong>
        <EarthAnswer answer={answer} /></div></aside>}{children}</div>
    <footer className="console-footer"><span>{t("play.gameUnits")}</span><span>{t("menu.edition")}</span></footer>
  </main>;
}
