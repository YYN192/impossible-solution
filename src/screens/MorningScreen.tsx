import { Icon } from "../components/Icon";
import { useEffect, useRef, useState } from "react";
import "../morning.css";
import { useTranslation } from "react-i18next";
import { audio } from "../game/audio";
import { DominoCard } from "../components/DominoCard";
import {
  helpTopicForDomino,
  helpTopicForEvent,
} from "../components/helpTopics";
import { WhatsThis } from "../components/WhatsThis";
import { tDynamic, tRun } from "../i18n/dynamic";
import { earthSentence } from "../components/EarthAnswer";
import { knownEvents } from "../sim/engine";
import type { DataRef, EarthAnswer } from "../sim/types";
import { useGame } from "../state/game";
import { useMission } from "../state/mission";
import { useNav } from "../state/screen";
import { DataChip } from "./DataChip";
import {
  pickMorning,
  type MorningReport,
} from "./morning/pickMorning";

/**
 * Morning report: a sunrise header, "what happened overnight" as a tap-to-reveal cause chain,
 * and Earth's message as ONE radio card (tap to decode) with the real-data details folded away.
 */
export function MorningScreen() {
  const sol = useNav((s) => s.sol);
  const state = useGame((s) => s.state);
  const fell = useGame((s) => s.fell);
  const events = useMission((s) => s.setup?.events);
  const report = pickMorning({
    sol,
    fell,
    all: state.dominoes,
    // Bursts come without warning (the end-of-sol report shows them); clouds only once Earth warned.
    events: knownEvents(state, events ?? []),
    earthAnswer: state.earthAnswer,
  });
  return <MorningReportView sol={sol} report={report} answer={state.earthAnswer} />;
}

const reducedMotion = () =>
  typeof window === "undefined" || !window.matchMedia
    ? true // no matchMedia (tests): skip the animation
    : window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Reveals `text` one letter at a time once `on`; instantly under reduced motion. */
function useTypewriter(text: string, on: boolean) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!on) return;
    if (reducedMotion()) { setN(text.length); return; }
    setN(0);
    const id = setInterval(() => setN((c) => (c >= text.length ? (clearInterval(id), c) : c + 1)), 28);
    return () => clearInterval(id);
  }, [text, on]);
  return { shown: text.slice(0, n), done: on && n >= text.length };
}

export function MorningReportView({
  sol,
  report,
  answer,
}: {
  sol: number;
  report: MorningReport;
  /** Earth's answer, shown even when today's event is the report's one extra line. */
  answer?: EarthAnswer;
}) {
  const { t } = useTranslation();
  const next = useNav((s) => s.next);
  const setup = useMission((s) => s.setup);
  const moon = setup?.place === "moon" ? "moon" : undefined;
  const { headline, cause, extra } = report;
  const event = extra?.kind === "event" ? extra.event : undefined;
  const earth = extra?.kind === "earth" ? extra.answer : answer;
  const alert = event ? event.kind : extra?.kind;
  const h1 = useRef<HTMLHeadingElement>(null);
  const total = setup?.rules.sols ?? 3;
  useEffect(() => { h1.current?.focus(); }, []); // keyboard and screen-reader users land at the top
  useEffect(() => {
    if (sol > 1) audio.playSfx("morning-report"); // sol 1 opens with the console boot sound
    if (!alert) return;
    const timer = setTimeout(() => audio.playSfx(alert === "particleBurst" ? "particle-burst" : alert === "stormCloud" ? "storm-warning" : "earth-message-receive"), 1300);
    return () => clearTimeout(timer);
  }, [sol, alert]);

  const hasLeft = Boolean(headline) || sol === 1 || !(event || earth);
  return (
    <section className="screen morning">
      <header className="morning-hero">
        <h1 ref={h1} tabIndex={-1}>{tRun("morning.heading", { sol }, moon)}</h1>
        <ol className="sol-track" aria-label={tRun("common.solOf", { sol, total }, moon)}>
          {Array.from({ length: total }, (_, i) => i + 1).map((d) => (
            <li key={d} className={d < sol ? "done" : d === sol ? "now" : ""} aria-current={d === sol ? "step" : undefined}>
              <span className="rover" aria-hidden="true">{d === sol ? <Icon name="rover" /> : null}</span>
              <i aria-hidden="true">{d}</i>
            </li>
          ))}
        </ol>
        <span className="sun" aria-hidden="true" />
      </header>

      <div className="morning-grid">
        {hasLeft && (
          <section className="m-card m-overnight" aria-labelledby="m-over">
            <h2 id="m-over">{t("morning.overnight")}</h2>
            {headline ? <Chain headline={headline} cause={cause} /> : (
              <p className="m-calm"><span aria-hidden="true"><Icon name="tired" /></span> {sol === 1 ? t("morning.firstDay") : t("morning.nothingFell")}</p>
            )}
            {/* Sol 1: Pip's briefing for this campaign and the real thing behind it. */}
            {sol === 1 && setup && (
              <div className="campaign-ending">
                <p className="lead">{tRun(`campaign.${setup.campaignId}.brief`)}</p>
                <p><strong>{t("run.realThing")}:</strong> {tRun(`campaign.${setup.campaignId}.real`)}</p>
              </div>
            )}
          </section>
        )}
        {(event || earth) && (
          <section className="m-card m-earth extra" aria-labelledby="m-earth">
            <h2 id="m-earth">{t("morning.fromEarth")} {earth && <WhatsThis topic="askEarth" />}</h2>
            {earth && <RadioMessage answer={earth} moon={moon} />}
            {event && (
              <div className={`m-alert m-alert-${event.kind}`}>
                <span className="m-alert-icon" aria-hidden="true"><Icon name={event.kind === "particleBurst" ? "dose" : "dust-storm"} /></span>
                <span>{tDynamic(event.captionKey)} <WhatsThis topic={helpTopicForEvent(event.kind)} /></span>
              </div>
            )}
            <NasaData refs={[
              ...(event ? [event.source] : []),
              ...(earth && earth.stormCloudInSols !== undefined ? [earth.source] : []),
              ...(earth && setup ? [setup.delay.ref] : []),
            ]}>
              {earth && setup && <Delay />}
            </NasaData>
          </section>
        )}
      </div>

      <div className="actions">
        <button type="button" className="primary morning-go" onClick={next}>
          {t("morning.goPlan")} <span aria-hidden="true">→</span>
        </button>
      </div>
    </section>
  );
}

/** Problem card with a big icon; "Why?" tips the next domino over to show the cause. */
function Chain({ headline, cause }: { headline: NonNullable<MorningReport["headline"]>; cause?: MorningReport["cause"] }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const topic = helpTopicForDomino(headline.textKey);
  return (
    <div className="fallen">
      <div className="fallen__row">
        <DominoCard domino={headline} fall />
        {topic && <WhatsThis topic={topic} />}
      </div>
      {cause && (
        <>
          <button type="button" className="why" aria-expanded={open} aria-controls="m-cause" onClick={() => setOpen(!open)}>
            <span aria-hidden="true">{open ? "▲" : <Icon name="why" />}</span> {open ? t("morning.hideWhy") : t("morning.why")}
          </button>
          <div id="m-cause" className="cause" hidden={!open}>
            {open && (
              <>
                <p className="because">{t("morning.because")}</p>
                <div className="cause-fall"><DominoCard domino={cause} /></div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/** The radio: a big button decodes Earth's message with a typewriter, then risk and dust storm show as badges. */
function RadioMessage({ answer, moon }: { answer: EarthAnswer; moon?: "moon" }) {
  const { t } = useTranslation();
  const [on, setOn] = useState(false);
  const text = earthSentence(t, answer, moon);
  const { shown, done } = useTypewriter(text, on);
  return (
    <div className="radio">
      <button type="button" className="radio-btn" aria-expanded={on} aria-controls="m-msg" onClick={() => { setOn(true); audio.playSfx("earth-message-receive"); }} disabled={on}>
        <span className="radio-icon" aria-hidden="true"><Icon name="radio" /></span>
        <span>{t("morning.radio")}<small>{on ? t("morning.decoded") : t("morning.radioTap")}</small></span>
      </button>
      <div id="m-msg" className="radio-msg" hidden={!on}>
        <p className="radio-text" aria-live="polite" aria-atomic="true">
          {done ? text : <span aria-hidden="true">{shown}<b className="caret">▌</b></span>}
        </p>
        {done && (
          <>
            {answer.burstRisk && (
              <p className={`m-alert m-alert-risk-${answer.burstRisk}`}>
                <span className="m-alert-icon" aria-hidden="true"><Icon name={answer.burstRisk === "high" ? "warning" : "check"} /></span>
                <span>{t(`earth.risk.${answer.burstRisk}`)}</span>
              </p>
            )}
            {answer.dustStormSols !== undefined && <p className="m-note"><Icon name="dusty-sky" /> {t("earth.dustStorm", { count: answer.dustStormSols })}</p>}
          </>
        )}
      </div>
    </div>
  );
}

/** Light delay as a little signal travelling Mars → Earth (still when motion is reduced). */
function Delay() {
  const { t } = useTranslation();
  const setup = useMission((s) => s.setup);
  if (!setup) return null;
  const moon = setup.place === "moon";
  return (
    <div className="delay">
      <div className="signal" aria-hidden="true"><span><Icon name={moon ? "moon" : "mars"} /></span><i /><span><Icon name="earth" /></span></div>
      <p className="note">
        {moon ? t("earth.delayMoon") : t(setup.delay.ref.mode === "live" ? "earth.delay" : "earth.delaySaved", { minutes: Math.round(setup.delay.seconds / 60) })}
      </p>
    </div>
  );
}

/** Folded "Real NASA data" panel: every chip keeps its honest live/saved label and source link. */
function NasaData({ refs, children }: { refs: DataRef[]; children?: React.ReactNode }) {
  const { t } = useTranslation();
  if (refs.length === 0) return null;
  return (
    <details className="nasa">
      <summary><Icon name="satellite" /> {t("morning.nasa")}</summary>
      {children}
      {refs.map((r, i) => <DataChip key={i} source={r} />)}
    </details>
  );
}
