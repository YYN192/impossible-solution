import type { JSX } from "react";
import { useTranslation } from "react-i18next";
import { DataSources } from "./screens/DataSources";
import { EndOfSolScreen } from "./screens/EndOfSolScreen";
import { FinalScreen } from "./screens/FinalScreen";
import { MorningScreen } from "./screens/MorningScreen";
import { StandInPlanScreen } from "./screens/StandInPlanScreen";
import { TitleScreen } from "./screens/TitleScreen";
import { useNav, type Screen } from "./state/screen";

// Viktor (#9): swap StandInPlanScreen for your Plan screen here.
const SCREENS: Record<Screen, () => JSX.Element> = {
  title: TitleScreen,
  morning: MorningScreen,
  plan: StandInPlanScreen,
  endSol: EndOfSolScreen,
  final: FinalScreen,
};

// Temporary: Data Sources preview (?view=sources) until #5/#7 add it to the navigation.
const view = new URLSearchParams(globalThis.location?.search ?? "").get("view");

export default function App() {
  const { t } = useTranslation();
  const screen = useNav((s) => s.screen);
  const sol = useNav((s) => s.sol);
  const Current = SCREENS[screen];
  if (view === "sources") return <DataSources onBack={() => (location.search = "")} />;
  return (
    <main className="shell">
      {/* key: remount on every step so each screen starts fresh and focuses its heading */}
      <Current key={`${screen}-${sol}`} />
      <p className="note">{t("app.disclaimer")}</p>
    </main>
  );
}
