import { useCallback, useEffect, useRef, useState, type JSX } from "react";
import { useTranslation } from "react-i18next";
import { DataBadge } from "./components/DataBadge";
import { LanguageToggle } from "./components/LanguageToggle";
import { readFlags } from "./data/flags";
import { DataSources } from "./screens/DataSources";
import { EndOfSolScreen } from "./screens/EndOfSolScreen";
import { FinalScreen } from "./screens/FinalScreen";
import { MorningScreen } from "./screens/MorningScreen";
import { TeacherCard } from "./screens/TeacherCard";
import { useMission } from "./state/mission";
import { useNav, type Screen } from "./state/screen";
import { useSession } from "./game/session";
import MainMenu from "./MainMenu";
import MarsHub from "./MarsHub";
import ConsolePage from "./ConsolePage";
import PlanScreen from "./PlanScreen";

const SCREENS: Record<Exclude<Screen, "title">, () => JSX.Element> = {
  morning: MorningScreen, plan: PlanScreen, endSol: EndOfSolScreen, final: FinalScreen,
};
type Place = "menu" | "hub" | "console";
export default function App() {
  const { t } = useTranslation();
  const { screen, sol } = useNav();
  const { setup, load, reload } = useMission();
  const [place, setPlace] = useState<Place>("menu");
  const [overlay, setOverlay] = useState<null | "sources" | "teacher">(null);
  const directEntry = useRef(false);
  const openConsole = useCallback(() => setPlace("console"), []);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (!setup || directEntry.current) return;
    directEntry.current = true;
    // Legacy pages share the same app, stores and URL flags.
    // Vercel serves clean URLs (/hub), GitHub Pages the file name (/hub.html).
    const name = window.location.pathname.split("/").pop()?.replace(/\.html$/, "");
    if (name === "hub" || name === "console") {
      if (useNav.getState().screen === "title") useNav.getState().next();
      setPlace(name);
    }
  }, [setup]);
  const visiblePlace = screen === "title" ? "menu" : place;
  const play = () => {
    if (screen === "title") { useSession.getState().clearPlan(); useNav.getState().next(); }
    setPlace("hub");
  };
  const chooseSun = (today: boolean) => {
    const q = new URLSearchParams(window.location.search);
    if (today) q.set("sun", "today"); else q.delete("sun");
    const search = q.toString();
    window.history.replaceState({}, "", `${window.location.pathname}${search ? `?${search}` : ""}${window.location.hash}`);
    void reload();
  };
  const Current = screen !== "title" ? SCREENS[screen] : null;
  return <div className="expedition">
    <div className="mission-status-bar">
      {setup ? <DataBadge source={setup.dataSource} fetchedAt={setup.dataFetchedAt} /> : <span role="status">{t("menu.loading")}</span>}
      <LanguageToggle />
      {!overlay && visiblePlace !== "menu" && <nav><button onClick={() => setOverlay("sources")}>{t("dataSources.open")}</button><button onClick={() => setOverlay("teacher")}>{t("teacher.open")}</button></nav>}
    </div>
    {setup?.noticeKey && <p className="availability-note" role="status">{t(setup.noticeKey as "notice.sunQuiet" | "notice.sunPassed")}</p>}
    {overlay ? <main className="information-panel">{overlay === "teacher" ? <TeacherCard onBack={() => setOverlay(null)} /> : <DataSources onBack={() => setOverlay(null)} missionSource={setup?.dataSource} missionFetchedAt={setup?.dataFetchedAt} liveData={!readFlags().offline && import.meta.env.MODE !== "test"} />}</main>
      : visiblePlace === "menu" ? <MainMenu ready={Boolean(setup)} resume={screen !== "title"} onPlay={play} onSources={() => setOverlay("sources")} onTeacher={() => setOverlay("teacher")} onChooseSun={chooseSun} />
      : visiblePlace === "hub" ? <MarsHub onConsole={openConsole} onMenu={() => setPlace("menu")} />
      : <ConsolePage onExit={() => setPlace("hub")}>{Current && <Current key={`${screen}-${sol}`} />}</ConsolePage>}
  </div>;
}
