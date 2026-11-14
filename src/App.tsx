import { useEffect, useState, type JSX } from "react";
import { useTranslation } from "react-i18next";
import { DataBadge } from "./components/DataBadge";
import { readFlags } from "./data/flags";
import { DataSources } from "./screens/DataSources";
import { EndOfSolScreen } from "./screens/EndOfSolScreen";
import { FinalScreen } from "./screens/FinalScreen";
import { MorningScreen } from "./screens/MorningScreen";
import { StandInPlanScreen } from "./screens/StandInPlanScreen";
import { TeacherCard } from "./screens/TeacherCard";
import { TitleScreen } from "./screens/TitleScreen";
import { useMission } from "./state/mission";
import { useNav, type Screen } from "./state/screen";

// Viktor (#9): swap StandInPlanScreen for your Plan screen here.
const SCREENS: Record<Screen, () => JSX.Element> = {
  title: TitleScreen,
  morning: MorningScreen,
  plan: StandInPlanScreen,
  endSol: EndOfSolScreen,
  final: FinalScreen,
};

export default function App() {
  const { t } = useTranslation();
  const screen = useNav((s) => s.screen);
  const sol = useNav((s) => s.sol);
  const setup = useMission((s) => s.setup);
  const load = useMission((s) => s.load);
  /** A grown-up page shown over the game (the game keeps its place underneath). */
  const [overlay, setOverlay] = useState<null | "sources" | "teacher">(null);
  const close = () => setOverlay(null);

  // Load the mission (storm events, Earth's forecasts, data source) once at start.
  // Reads ?demo=1, ?offline=1, ?sun=today from the URL.
  useEffect(() => {
    void load();
  }, [load]);

  const Current = SCREENS[screen];
  return (
    <main className="shell">
      <div className="topbar">
        {setup ? (
          <DataBadge
            source={setup.dataSource}
            fetchedAt={setup.dataFetchedAt}
          />
        ) : (
          <span />
        )}
        {!overlay ? (
          <span className="topbar__links">
            <button
              type="button"
              className="link-button"
              onClick={() => setOverlay("sources")}
            >
              {t("dataSources.open")}
            </button>
            <button
              type="button"
              className="link-button"
              onClick={() => setOverlay("teacher")}
            >
              {t("teacher.open")}
            </button>
          </span>
        ) : null}
      </div>
      {setup?.noticeKey ? (
        <p className="notice">{t(setup.noticeKey as "notice.sunQuiet")}</p>
      ) : null}

      {overlay === "teacher" ? (
        <TeacherCard onBack={close} />
      ) : overlay === "sources" ? (
        <DataSources
          onBack={close}
          missionSource={setup?.dataSource}
          missionFetchedAt={setup?.dataFetchedAt}
          liveData={!readFlags().offline && import.meta.env.MODE !== "test"}
        />
      ) : (
        /* key: remount on every step so each screen starts fresh and focuses its heading */
        <Current key={`${screen}-${sol}`} />
      )}
      <p className="note">{t("app.disclaimer")}</p>
    </main>
  );
}
