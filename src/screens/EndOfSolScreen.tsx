import { useTranslation } from "react-i18next";
import { DominoCard } from "../components/DominoCard";
import { ResourceMeters } from "../components/ResourceMeters";
import { ScreenFrame } from "../components/ScreenFrame";
import { asset } from "../game/assets";
import { useSession } from "../game/session";
import { MISSION_SOLS } from "../sim/types";
import { useGame } from "../state/game";
import { useNav } from "../state/screen";

/** End of sol: the bars animate here once the engine lands (respect reduced motion). */
export function EndOfSolScreen() {
  const { t } = useTranslation();
  const { sol, next } = useNav();
  const { state, fell } = useGame();
  const before = useSession((s) => s.before);
  return <ScreenFrame title={t("endSol.heading", { sol })}>
    <div className="night-banner"><img src={asset("backgrounds/mars-menu-space")} alt="" /><p>{t("play.nightSummary")}</p></div>
    <ResourceMeters bars={state.bars} previous={before} />
    <div className="small-counters"><span>{t("bars.food")} <b>{state.food}</b></span><span>{t("bars.science")} <b>{state.science}</b></span></div>
    <div className="night-results">{fell.filter((d) => d.causeIds.length > 0 || d.source).map((d) => <DominoCard key={d.id} domino={d} />)}</div>
    <div className="actions"><button type="button" className="primary" onClick={next}>{sol >= MISSION_SOLS ? t("endSol.seeResults") : t("endSol.nextMorning")}</button></div>
  </ScreenFrame>;
}
