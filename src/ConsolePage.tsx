import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useNav } from "./state/screen";
import { useGame } from "./state/game";
import { useMission } from "./state/mission";
import { DataChip } from "./screens/DataChip";
import { asset } from "./game/assets";

export default function ConsolePage({ children, onExit }: { children: ReactNode; onExit: () => void }) {
  const { t } = useTranslation();
  const { screen, sol } = useNav();
  const answer = useGame((s) => s.state.earthAnswer);
  const events = useMission((s) => s.setup?.events);
  // A separate earned inbox, not a change to pickMorning's one-extra-line contract.
  const showInbox = screen === "morning" && answer && events?.some((e) => e.sol === sol);
  return <main className="mission-console">
    <header className="console-top"><button onClick={onExit}>← {t("world.return")}</button><div><span className="eyebrow">{t("world.name")}</span><b>{t("world.console")}</b></div><span className="sol-tag">{t("common.solOf", { sol, total: 3 })}</span></header>
    <div className="sol-navigation" aria-label={t("play.progress")}>{[1, 2, 3].map((day) => <span key={day} aria-current={day === sol ? "step" : undefined} className={day <= sol ? "reached" : ""}><i />{t("final.sol", { sol: day })}</span>)}</div>
    <div className="console-content">{showInbox && <aside className="earth-inbox" aria-label={t("play.earthInbox")}>
      <img src={asset("characters/robots/mission-control-hologram-portrait")} alt="" /><div><strong>{t("play.earthInbox")}</strong>
        <p>{t("earth.answer", { dust: t(`earth.dust.${answer.dustTomorrow}`), storm: answer.stormCloudInSols === undefined ? t("earth.storm.none") : t("earth.storm.coming", { count: answer.stormCloudInSols }) })}</p>
        <DataChip source={answer.source} /></div></aside>}{children}</div>
    <footer className="console-footer"><span>{t("play.gameUnits")}</span><span>{t("menu.edition")}</span></footer>
  </main>;
}
