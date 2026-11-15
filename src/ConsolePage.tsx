import { useEffect, type ReactNode } from "react";
import { audio } from "./game/audio";
import { useTranslation } from "react-i18next";
import { useNav } from "./state/screen";
import { useMission } from "./state/mission";
import { tRun } from "./i18n/dynamic";

export default function ConsolePage({ children, onExit }: { children: ReactNode; onExit: () => void }) {
  const { t } = useTranslation();
  const { sol } = useNav();
  const sols = useMission((s) => s.setup?.rules.sols) ?? 3;
  const moon = useMission((s) => s.setup?.place) === "moon" ? "moon" : undefined;
  // Music is chosen in one place (game/musicDirector.ts): entering the console never restarts the song.
  useEffect(() => { audio.playSfx("console-boot"); }, []);
  return <main className="mission-console">
    <header className="console-top"><button onClick={() => { audio.playSfx("console-close"); onExit(); }}>← {t("world.return")}</button><div><span className="eyebrow">{t("world.name")}</span><b>{t("world.console")}</b></div></header>
    <div className={sols > 3 ? "sol-navigation many" : "sol-navigation"} aria-label={t("play.progress")}>{Array.from({ length: sols }, (_, i) => i + 1).map((day) => <span key={day} aria-current={day === sol ? "step" : undefined} className={day <= sol ? "reached" : ""}><i />{sols > 3 ? <><span className="visually-hidden">{tRun("final.sol", { sol: day }, moon)}</span><span aria-hidden="true">{day}</span></> : tRun("final.sol", { sol: day }, moon)}</span>)}</div>
    <div className="console-content">{children}</div>
    <footer className="console-footer"><span>{t("play.gameUnits")}</span><span>{t("menu.edition")}</span></footer>
  </main>;
}
