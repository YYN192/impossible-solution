import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { audio } from "../game/audio";
import { ENGINE } from "../sim/engine";
import { DominoCard } from "../components/DominoCard";
import { ResourceMeters } from "../components/ResourceMeters";
import { ScreenFrame } from "../components/ScreenFrame";
import { asset } from "../game/assets";
import { useSession } from "../game/session";
import { rulesOf } from "../sim/engine";
import { tDynamic, tRun } from "../i18n/dynamic";
import { useMission } from "../state/mission";
import { STORMS, stormById } from "../data/storms";
import { DataChip } from "./DataChip";
import { useGame } from "../state/game";
import { useNav } from "../state/screen";

/** End of sol: the bars animate here once the engine lands (respect reduced motion). */
export function EndOfSolScreen() {
  const { t } = useTranslation();
  const { sol, next } = useNav();
  const { state, fell } = useGame();
  const before = useSession((s) => s.before);
  const setup = useMission((s) => s.setup);
  const moon = setup?.place === "moon" ? "moon" : undefined;
  // The storm of the sol that just ended (the burst wins over the cloud, like in the engine).
  const today = (setup?.events ?? []).filter((e) => e.sol === sol);
  const storm = today.find((e) => e.kind === "particleBurst") ?? today.find((e) => e.kind === "stormCloud") ?? today[0];
  // The real storm behind this event, by its DONKI id: Dust Season has no stormId, and its burst is not May 2024.
  const real = STORMS.find((s) => s.activityId === storm?.id) ?? (setup?.stormId ? stormById(setup.stormId) : undefined);
  const small = storm?.kind === "particleBurst" && storm.dose !== undefined;
  useEffect(() => {
    const { power, air, dose } = useGame.getState().state.bars;
    const timers = [setTimeout(() => audio.playSfx("sol-end"), 300), setTimeout(() => audio.playSfx(
      power <= 1 || air <= 2 || dose >= ENGINE.doseLimit ? "resource-critical" : air <= 4 ? "air-warning"
        : power < ENGINE.lowPowerToday ? "power-decrease" : dose >= ENGINE.doseLimit - 2 ? "radiation-increase" : "resource-stable"), 1800)];
    if (storm) timers.push(setTimeout(() => audio.playSfx(storm.kind === "particleBurst" ? "particle-burst" : "storm-warning"), 900));
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Every warning sound has words on screen too (deaf, muted or classroom players).
  const { power, air, dose } = state.bars;
  const warning = air <= 4 ? t("endSol.warn.air", { n: air }) : power <= 1 ? t("endSol.warn.power", { n: power })
    : dose >= ENGINE.doseLimit ? t("endSol.warn.dose") : undefined;
  return <ScreenFrame title={tRun("endSol.heading", { sol }, moon)}>
    {warning && <p className="sol-warning" role="alert">⚠ {warning}</p>}
    {storm && <section className="storm-alarm" role="status" data-kind={storm.kind} data-size={small ? "small" : "big"}>
      <h2>{t(storm.game ? "storm.alarmShadow" : storm.kind === "particleBurst" ? "storm.alarmBurst" : storm.kind === "stormCloud" ? "storm.alarmCloud" : "storm.alarmDust")}</h2>
      {storm.kind !== "dustStorm" && <p className="pip-line"><img src={asset("characters/robots/assistant-drone-portrait")} alt="" />{t(storm.kind === "stormCloud" ? "storm.pipCloud" : small ? "storm.pipSmall" : "storm.pipBurst")}</p>}
      <div className="real-card">
        <strong>{t(storm.game ? "storm.gameEvent" : "storm.real")}</strong>
        <p>{storm.kind === "dustStorm" ? tDynamic(storm.captionKey) : tRun(storm.kind === "stormCloud" ? "storm.fact.cloud" : moon ? "storm.fact.moon" : `storm.fact.${real?.id ?? "may2024"}`)}</p>
        {storm.kind === "particleBurst" && real && !moon && <p>{t("storm.flare", { flare: real.flare })}</p>}
        {storm.id && !storm.game && <p className="event-id">{t("storm.id", { id: storm.id })}</p>}
        {!storm.game && <DataChip source={storm.source} />}
      </div>
    </section>}
    <div className="night-banner"><img src={asset("backgrounds/mars-menu-space")} alt="" /><p>{t("play.nightSummary")}</p></div>
    <ResourceMeters bars={state.bars} previous={before} />
    <div className="small-counters"><span>{t("bars.food")} <b>{state.food}</b></span><span>{t("bars.science")} <b>{state.science}</b></span></div>
    <div className="night-results">{fell.filter((d) => d.causeIds.length > 0 || d.source).map((d) => <DominoCard key={d.id} domino={d} />)}</div>
    <div className="actions"><button type="button" className="primary" onClick={() => { audio.playSfx("next-sol"); next(); }}>{state.over || sol >= rulesOf(state).sols ? t("endSol.seeResults") : t("endSol.nextMorning")}</button></div>
  </ScreenFrame>;
}
