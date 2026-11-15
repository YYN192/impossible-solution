import { useCallback, useEffect, useRef, useState, type JSX } from "react";
import { BeatScreen } from "./screens/BeatScreen";
import { MENU_CAMPAIGNS as CAMPAIGNS } from "./data/campaigns";
import { isOpen, useProgress } from "./state/progress";
import { useTranslation } from "react-i18next";
import { DataBadge } from "./components/DataBadge";
import { LanguageToggle } from "./components/LanguageToggle";
import { SoundToggle } from "./components/SoundToggle";
import { FullscreenToggle } from "./components/FullscreenToggle";
import { audio } from "./game/audio";
import { readFlags } from "./data/flags";
import { DataSources } from "./screens/DataSources";
import { EndOfSolScreen } from "./screens/EndOfSolScreen";
import { FinalScreen } from "./screens/FinalScreen";
import { MorningScreen } from "./screens/MorningScreen";
import { TeacherCard } from "./screens/TeacherCard";
import { useMission } from "./state/mission";
import { useNav, type Screen } from "./state/screen";
import { useSession } from "./game/session";
import { hubStormFor, repaired } from "./data/hubStorm";
import { useGame } from "./state/game";
import MainMenu, { type RunChoice } from "./MainMenu";
import MarsHub from "./MarsHub";
import ConsolePage from "./ConsolePage";
import PlanScreen from "./PlanScreen";

const SCREENS: Record<Exclude<Screen, "title">, () => JSX.Element | null> = {
  morning: MorningScreen, beat: BeatScreen, plan: PlanScreen, endSol: EndOfSolScreen, final: FinalScreen,
};
export default function App() {
  const { t } = useTranslation();
  const { screen, sol } = useNav();
  const { setup, load, reload } = useMission();
  const place = useNav((s) => s.place);
  const setPlace = useNav((s) => s.go);
  const [overlay, setOverlay] = useState<null | "sources" | "teacher">(null);
  const directEntry = useRef(false);
  const openOverlay = (o: "sources" | "teacher") => { audio.playSfx("menu-open"); setOverlay(o); };
  const closeOverlay = () => { audio.playSfx("menu-back"); setOverlay(null); };
  const openConsole = useCallback(() => setPlace("console"), [setPlace]);
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
  // A dust storm on this sol's morning calls the crew back to the base (once per sol).
  const stormCalled = useRef(0);
  useEffect(() => {
    if (screen !== "morning" || place !== "console" || stormCalled.current === sol) return;
    const game = useGame.getState().state;
    if (game.sol === sol && hubStormFor(setup, sol, readFlags().demo) && !repaired(game, "storm-panels")) { stormCalled.current = sol; setPlace("hub"); }
  }, [screen, sol, place, setup, setPlace]);
  const visiblePlace = screen === "title" ? "menu" : place;
  const play = () => {
    if (screen === "title") { useSession.getState().clearPlan(); useNav.getState().next(); }
    setPlace("hub");
  };
  // The menu's choice becomes the page link (?campaign=, ?sun=today, ?daily=1), so it can be shared and replayed.
  const chooseRun = (choice: RunChoice) => {
    const q = new URLSearchParams(window.location.search);
    for (const k of ["sun", "campaign", "seed", "daily"]) q.delete(k);
    if (choice.today) q.set("sun", "today");
    else if (choice.daily) q.set("daily", "1");
    else if (choice.surprise) {
      const open = CAMPAIGNS.filter((c) => isOpen(c, useProgress.getState()));
      q.set("campaign", open[Math.floor(Math.random() * open.length)].id);
    } else if (choice.campaign) q.set("campaign", choice.campaign);
    const search = q.toString();
    window.history.replaceState({}, "", `${window.location.pathname}${search ? `?${search}` : ""}${window.location.hash}`);
    void reload();
  };
  const Current = screen !== "title" ? SCREENS[screen] : null;
  return <div className="expedition">
    <div className="mission-status-bar">
      {setup ? <DataBadge source={setup.dataSource} fetchedAt={setup.dataFetchedAt} /> : <span role="status">{t("menu.loading")}</span>}
      <LanguageToggle /><SoundToggle /><FullscreenToggle />
      {!overlay && visiblePlace !== "menu" && <nav><button onClick={() => openOverlay("sources")}>{t("dataSources.open")}</button><button onClick={() => openOverlay("teacher")}>{t("teacher.open")}</button></nav>}
    </div>
    {setup?.noticeKey && <p className="availability-note" role="status">{t(setup.noticeKey as "notice.sunQuiet" | "notice.sunPassed")}</p>}
    {overlay ? <main className="information-panel">{overlay === "teacher" ? <TeacherCard onBack={closeOverlay} /> : <DataSources onBack={closeOverlay} missionSource={setup?.dataSource} missionFetchedAt={setup?.dataFetchedAt} liveData={!readFlags().offline && import.meta.env.MODE !== "test"} />}</main>
      : visiblePlace === "menu" ? <MainMenu ready={Boolean(setup)} resume={screen !== "title"} campaignId={setup?.campaignId} onPlay={play} onSources={() => openOverlay("sources")} onTeacher={() => openOverlay("teacher")} onChoose={chooseRun} onNew={() => useNav.getState().home()} />
      : visiblePlace === "hub" ? <MarsHub onConsole={openConsole} onMenu={() => setPlace("menu")} />
      : <ConsolePage onExit={() => setPlace("hub")}>{Current && <Current key={`${screen}-${sol}`} />}</ConsolePage>}
  </div>;
}
