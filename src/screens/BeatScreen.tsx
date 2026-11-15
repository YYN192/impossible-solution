import { useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { EarthAnswer } from "../components/EarthAnswer";
import { Icon, Icons } from "../components/Icon";
import { ResourceMeters } from "../components/ResourceMeters";
import { ScreenFrame } from "../components/ScreenFrame";
import { audio } from "../game/audio";
import { mistake } from "../game/feedback";
import { tDynamic, tRun } from "../i18n/dynamic";
import type { BeatOption } from "../sim/campaign";
import type { IconName } from "../sim/icons";
import { ENGINE, canAct, rulesOf } from "../sim/engine";
import type { Action, Bars, Domino, Rules } from "../sim/types";
import { useGame } from "../state/game";
import { useMission } from "../state/mission";
import { useNav } from "../state/screen";
import { DataChip } from "./DataChip";
import { ExploreBeat } from "./ExploreBeat";
import { BuildBeat, HeaterDial, RadioRace, WipeBeat, type HandsOnProps } from "./HandsOnBeats";

/** Beat id → its hands-on moment (#59). Beats not listed keep their cards. */
const HANDS_ON: Partial<Record<string, (p: HandsOnProps) => ReactNode>> = { wipe: WipeBeat, upgrade: BuildBeat, radio: RadioRace, cold: HeaterDial };

const num = (n: number) => `${n > 0 ? "+" : "−"}${Math.abs(Number(n.toFixed(1)))}`;

interface Chip { icon?: IconName; text: string }

/** What an option costs and gives, as short chips. Numbers come straight from the engine action. */
function effects(action: Action, t: (k: string, o?: object) => string): Chip[] {
  const e = action.effect ?? {};
  const r: Partial<Rules> = action.rules ?? {};
  const pct = (v: number) => Math.round(v * 100);
  const chip = (icon: IconName, text: string): Chip => ({ icon, text });
  return [
    e.power && chip("power", `${num(e.power)} ${t("bars.power")}`),
    e.air && chip("air", `${num(e.air)} ${t("bars.air")}`),
    e.food && chip("food", `${num(e.food)} ${t("bars.food")}`),
    e.science && chip("science", `${num(e.science)} ${t("bars.science")}`),
    e.dose && chip("dose", `${num(e.dose)} ${t("bars.dose")}`),
    e.shelterSols && chip("shield", t("fx.shelter")),
    e.tired && chip("tired", t("fx.rest")),
    e.panelEfficiency && chip("wipe", t("fx.panels", { n: pct(e.panelEfficiency) })),
    action.ask && chip("radio", t("fx.ask")),
    r.solar !== undefined && chip("sun", t("rule.solar", { n: r.solar })),
    r.heater !== undefined && chip("heater", t("rule.heater", { n: r.heater })),
    r.dustFactor !== undefined && chip("wipe", t("rule.dustFactor", { n: pct(r.dustFactor) })),
    r.airMachinePower !== undefined && chip("air", t("rule.airMachinePower", { n: r.airMachinePower })),
    r.foodGain !== undefined && chip("food", t("rule.foodGain", { n: r.foodGain })),
    r.shelterFactor !== undefined && chip("shield", t("rule.shelterFactor", { n: pct(r.shelterFactor) })),
    r.earthHidden !== undefined &&
      chip("radio", r.earthHidden.length ? t("rule.earthHidden", { days: r.earthHidden.join(", ") }) : t("rule.earthAlways")),
  ].filter((x): x is Chip => Boolean(x));
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
  // Explore beats open on the map; "Let Pip drive" shows the plain choices instead.
  const [pipDrives, setPipDrives] = useState(false);
  // Hands-on beats (#59) open as the hands-on moment; "Show the choices instead" shows the plain cards.
  const [cards, setCards] = useState(false);
  const beat = setup?.beats[sol];
  // No beat for this sol (old link, restored run): go on to the plan.
  useEffect(() => {
    if (setup && !beat) next();
  }, [setup, beat, next]);
  if (!setup || !beat) return null;
  const place = setup.place === "moon" ? "moon" : undefined;
  const vars = beat.vars ?? {};

  function act(action: Action) {
    const before = { ...state.bars };
    const after = useGame.getState().choose(action);
    const fell = after.dominoes.at(-1);
    if (!fell) return;
    audio.playSfx(action.ask ? "earth-message-send" : "assign");
    const { power, air, dose } = after.bars;
    if (power <= 1 || air <= 2 || dose >= ENGINE.doseLimit) mistake("big"); else if (dose > before.dose) mistake("small"); // the choice cost something
    setDone({ fell, before });
  }
  const choose = (o: BeatOption) => act(o.action);
  const onMap = beat.map && !pipDrives && !done;
  const HandsOn = HANDS_ON[beat.id];
  const handsOn = HandsOn && !cards && !done;
  const delayMin = Math.round(setup.delay.seconds / 60);
  const pick = (id: string) => { const o = beat.options.find((x) => x.id === id); if (o) choose(o); };
  const canPick = (id: string) => { const o = beat.options.find((x) => x.id === id); return Boolean(o && canAct(state, o.action)); };
  const chipsOf = (id: string) => { const o = beat.options.find((x) => x.id === id); const chips = o ? effects(o.action, tt) : []; return (chips.length ? chips : [{ text: t("beatUi.nothing") } as Chip]).map((c) => <span key={`${c.icon}-${c.text}`}>{c.icon && <Icon name={c.icon} />} {c.text}</span>); };

  return (
    <ScreenFrame title={tRun(`beat.${beat.id}.title`, vars)}>
      <p className="eyebrow beat-type">
        {tRun("common.solOf", { sol, total: rulesOf(state).sols }, place)} · {t(`beatUi.type.${beat.type}`)}
      </p>
      <p className="lead">{tRun(`beat.${beat.id}.text`, vars)}</p>
      {beat.type === "radio" && (
        <p className="beat-delay">
          {/* "today" only for a live reading; a saved one says so. */}
          {place ? t("beatUi.delayMoon") : t(setup.delay.ref.mode === "live" ? "beatUi.delayMars" : "beatUi.delayMarsSaved", { minutes: Math.round(setup.delay.seconds / 60) })}
        </p>
      )}
      {beat.card && <DataChip source={beat.card} />}
      <div className="beat-meters">
        <ResourceMeters bars={state.bars} previous={done?.before} />
        <div className="small-counters">
          <span>{t("bars.food")} <b>{state.food}</b></span>
          <span>{t("bars.science")} <b>{state.science}</b></span>
        </div>
      </div>
      {onMap && beat.map && (
        <>
          <ExploreBeat map={beat.map} onDone={act} />
          <button type="button" className="explore-switch" onClick={() => setPipDrives(true)}>{t("exploreUi.pip")}</button>
        </>
      )}
      {handsOn && HandsOn && (
        <>
          <HandsOn beat={beat} can={canPick} preview={chipsOf} onChoose={pick} delayMin={delayMin} />
          <button type="button" className="hands-on-switch" onClick={() => setCards(true)}>{t("handsOn.cards")}</button>
        </>
      )}
      {onMap || handsOn ? null : !done ? (
        <div className="beat-options" role="group" aria-label={t("beatUi.options")} data-type={beat.type}>
          {beat.options.map((o) => {
            const can = canAct(state, o.action);
            const chips = effects(o.action, tt);
            return (
              <button type="button" className="beat-option" key={o.id} disabled={!can} onClick={() => choose(o)}>
                <span className="beat-icon" aria-hidden="true"><Icons icon={o.action.icon} /></span>
                <strong>{tRun(`beat.${beat.id}.${o.id}.label`, vars)}</strong>
                {o.real && (
                  <small className="beat-real">
                    <b>{t("beatUi.real")}:</b> {tRun(`beat.${beat.id}.${o.id}.real`)}
                  </small>
                )}
                <span className="beat-effects">
                  {(chips.length ? chips : [{ text: t("beatUi.nothing") } as Chip]).map((c) => <span key={`${c.icon}-${c.text}`}>{c.icon && <Icon name={c.icon} />} {c.text}</span>)}
                </span>
                {!can && <small className="beat-cannot">{t("beatUi.cannot")}</small>}
              </button>
            );
          })}
          {beat.map && <button type="button" className="explore-switch" onClick={() => setPipDrives(false)}>{t("exploreUi.back")}</button>}
          {HandsOn && <button type="button" className="hands-on-switch" onClick={() => setCards(false)}>{t("handsOn.back")}</button>}
        </div>
      ) : (
        <div className="beat-result" role="status">
          <p className="lead"><Icons icon={done.fell.icon} />{" "}{tDynamic(done.fell.textKey)}</p>
          {done.fell.source && <DataChip source={done.fell.source} />}
          {beat.type === "radio" && (state.earthAnswer && place ? <EarthAnswer answer={state.earthAnswer} /> : state.radioed && <p>{t("handsOn.radio.arrived", { n: delayMin })}</p>)}
          <div className="actions">
            <button type="button" className="primary" onClick={() => { audio.playSfx("select"); next(); }}>{t("beatUi.continue")} →</button>
          </div>
        </div>
      )}
    </ScreenFrame>
  );
}
