import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { EarthAnswer } from "../components/EarthAnswer";
import { ResourceMeters } from "../components/ResourceMeters";
import { ScreenFrame } from "../components/ScreenFrame";
import { audio } from "../game/audio";
import { tDynamic, tRun } from "../i18n/dynamic";
import type { BeatOption } from "../sim/campaign";
import { canAct, rulesOf } from "../sim/engine";
import type { Action, Bars, Domino, Rules } from "../sim/types";
import { useGame } from "../state/game";
import { useMission } from "../state/mission";
import { useNav } from "../state/screen";
import { DataChip } from "./DataChip";

const num = (n: number) => `${n > 0 ? "+" : "−"}${Math.abs(Number(n.toFixed(1)))}`;

/** What an option costs and gives, as short chips. Numbers come straight from the engine action. */
function effects(action: Action, t: (k: string, o?: object) => string): string[] {
  const e = action.effect ?? {};
  const r: Partial<Rules> = action.rules ?? {};
  const pct = (v: number) => Math.round(v * 100);
  return [
    e.power && `⚡ ${num(e.power)} ${t("bars.power")}`,
    e.air && `🫧 ${num(e.air)} ${t("bars.air")}`,
    e.food && `🥬 ${num(e.food)} ${t("bars.food")}`,
    e.science && `🔬 ${num(e.science)} ${t("bars.science")}`,
    e.dose && `☢️ ${num(e.dose)} ${t("bars.dose")}`,
    e.shelterSols && `🛡️ ${t("fx.shelter")}`,
    e.tired && `😴 ${t("fx.rest")}`,
    e.panelEfficiency && `🧽 ${t("fx.panels", { n: pct(e.panelEfficiency) })}`,
    action.ask && `📡 ${t("fx.ask")}`,
    r.solar !== undefined && `☀️ ${t("rule.solar", { n: r.solar })}`,
    r.heater !== undefined && `🔥 ${t("rule.heater", { n: r.heater })}`,
    r.dustFactor !== undefined && `🌫️ ${t("rule.dustFactor", { n: pct(r.dustFactor) })}`,
    r.airMachinePower !== undefined && `🫧 ${t("rule.airMachinePower", { n: r.airMachinePower })}`,
    r.foodGain !== undefined && `🥬 ${t("rule.foodGain", { n: r.foodGain })}`,
    r.shelterFactor !== undefined && `🛡️ ${t("rule.shelterFactor", { n: pct(r.shelterFactor) })}`,
    r.earthHidden !== undefined &&
      `📡 ${r.earthHidden.length ? t("rule.earthHidden", { days: r.earthHidden.join(", ") }) : t("rule.earthAlways")}`,
  ].filter((x): x is string => Boolean(x));
}

/**
 * One beat: the campaign's interaction for this sol (site, dilemma, wipe, radio, upgrade, rover,
 * sky watch). The kid picks one option; the engine applies it (`act`) and the result is shown
 * before the plan. Every option shows its cost; a choice the base cannot pay for is switched off.
 */
export function BeatScreen() {
  const { t } = useTranslation();
  const tt = t as unknown as (k: string, o?: object) => string;
  const sol = useNav((s) => s.sol);
  const next = useNav((s) => s.next);
  const setup = useMission((s) => s.setup);
  const state = useGame((s) => s.state);
  const [done, setDone] = useState<{ fell: Domino; before: Bars } | null>(null);
  const beat = setup?.beats[sol];
  // No beat for this sol (old link, restored run): go on to the plan.
  useEffect(() => {
    if (setup && !beat) next();
  }, [setup, beat, next]);
  if (!setup || !beat) return null;
  const place = setup.place === "moon" ? "moon" : undefined;
  const vars = beat.vars ?? {};

  function choose(o: BeatOption) {
    const before = { ...state.bars };
    const after = useGame.getState().choose(o.action);
    const fell = after.dominoes.at(-1);
    if (!fell) return;
    audio.playSfx(o.action.ask ? "earth-message-send" : "assign");
    setDone({ fell, before });
  }

  return (
    <ScreenFrame title={tRun(`beat.${beat.id}.title`, vars)}>
      <p className="eyebrow beat-type">
        {tRun("common.solOf", { sol, total: rulesOf(state).sols }, place)} · {t(`beatUi.type.${beat.type}`)}
      </p>
      <p className="lead">{tRun(`beat.${beat.id}.text`, vars)}</p>
      {beat.type === "radio" && (
        <p className="beat-delay">
          {place ? t("beatUi.delayMoon") : t("beatUi.delayMars", { minutes: Math.round(setup.delay.seconds / 60) })}
        </p>
      )}
      {beat.card && <DataChip source={beat.card} />}
      <ResourceMeters bars={state.bars} previous={done?.before} />
      <div className="small-counters">
        <span>{t("bars.food")} <b>{state.food}</b></span>
        <span>{t("bars.science")} <b>{state.science}</b></span>
      </div>
      {!done ? (
        <div className="beat-options" role="group" aria-label={t("beatUi.options")} data-type={beat.type}>
          {beat.options.map((o) => {
            const can = canAct(state, o.action);
            const chips = effects(o.action, tt);
            return (
              <button type="button" className="beat-option" key={o.id} disabled={!can} onClick={() => choose(o)}>
                <span className="beat-icon" aria-hidden="true">{o.action.icon}</span>
                <strong>{tRun(`beat.${beat.id}.${o.id}.label`, vars)}</strong>
                {o.real && (
                  <small className="beat-real">
                    <b>{t("beatUi.real")}:</b> {tRun(`beat.${beat.id}.${o.id}.real`)}
                  </small>
                )}
                <span className="beat-effects">
                  {(chips.length ? chips : [t("beatUi.nothing")]).map((c) => <span key={c}>{c}</span>)}
                </span>
                {!can && <small className="beat-cannot">{t("beatUi.cannot")}</small>}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="beat-result" role="status">
          <p className="lead"><span aria-hidden="true">{done.fell.icon} </span>{tDynamic(done.fell.textKey)}</p>
          {done.fell.source && <DataChip source={done.fell.source} />}
          {beat.type === "radio" && (state.earthAnswer && place ? <EarthAnswer answer={state.earthAnswer} /> : state.radioed && <p>{t("beatUi.answerNight")}</p>)}
          <div className="actions">
            <button type="button" className="primary" onClick={() => { audio.playSfx("select"); next(); }}>{t("beatUi.continue")} →</button>
          </div>
        </div>
      )}
    </ScreenFrame>
  );
}
