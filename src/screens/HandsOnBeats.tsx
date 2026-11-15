import { useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Icon, Icons } from "../components/Icon";
import { asset } from "../game/assets";
import { audio } from "../game/audio";
import {
  CLEAN_AT, RUB_KEY, advanceSignal, charge, cleanCount, dialStep, heaterChoice, placePart, rub, rubFromDrag, signalView, startWipe, wipeChoice,
  type Part, type Spot,
} from "../game/handsOn";
import { gameKey } from "../game/pressedKeys";
import { tRun } from "../i18n/dynamic";
import type { Beat } from "../sim/campaign";
import { reducedMotion } from "../state/comfort";
import "./HandsOnBeats.css";

/**
 * Mission 1's hands-on moments (#59): four beats the kid does with mouse, finger or keys instead of
 * picking a card. Each ends in one of the beat's own options (`onChoose(optionId)`), so the engine
 * decides the result exactly as the cards did. The rules are in game/handsOn.ts.
 */
export interface HandsOnProps {
  beat: Beat;
  /** Can the base pay for this option? */
  can: (optionId: string) => boolean;
  /** The option's real cost and gain as chips (the same ones the cards show). */
  preview: (optionId: string) => ReactNode;
  onChoose: (optionId: string) => void;
  /** Mars–Earth light delay in whole minutes (the run's real reading). */
  delayMin: number;
}

const Preview = ({ children }: { children: ReactNode }) => <div className="hands-on-preview" data-testid="hands-on-preview">{children}</div>;
const isPress = (e: React.KeyboardEvent) => gameKey(e) === " " || e.key === " " || e.key === "Enter" || e.code === "Space";

/** Sol 5 (mission 1): rub the dust off six panels. Every clean panel means more time outside, so more space rays. */
export function RubPanels({ can, preview, onChoose }: HandsOnProps) {
  const { t } = useTranslation();
  const [dust, setDust] = useState(startWipe);
  const panels = useRef<(HTMLButtonElement | null)[]>([]);
  const last = useRef<{ x: number; y: number; i: number } | null>(null);
  const choice = wipeChoice(dust);
  const scrub = (i: number, amount: number) => setDust((d) => {
    const next = rub(d, i, amount);
    if (d[i] > CLEAN_AT && next[i] <= CLEAN_AT) audio.playSfx("select");
    return next;
  });
  // Rubbing: follow the pointer across the row (a finger stays captured by the panel it started on, so look up what is under it).
  const panelAt = (x: number, y: number) => {
    const el = document.elementFromPoint?.(x, y)?.closest<HTMLElement>("[data-panel]");
    return el ? Number(el.dataset.panel) : -1;
  };
  // Follow the whole path since the last event in small steps: a fast swipe sends few events, far apart,
  // and every panel it crosses still gets rubbed by the distance travelled over it.
  const move = (e: React.PointerEvent) => {
    const from = last.current;
    if (!from) return;
    const dx = e.clientX - from.x, dy = e.clientY - from.y, steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / 6));
    const over = new Map<number, number>();
    for (let s = 1; s <= steps; s++) {
      const i = panelAt(from.x + (dx * s) / steps, from.y + (dy * s) / steps);
      if (i >= 0) over.set(i, (over.get(i) ?? 0) + Math.hypot(dx, dy) / steps);
    }
    for (const [i, px] of over) scrub(i, rubFromDrag(px, panels.current[i]?.offsetWidth ?? 80));
    last.current = { x: e.clientX, y: e.clientY, i: panelAt(e.clientX, e.clientY) };
  };
  const key = (e: React.KeyboardEvent, i: number) => {
    const k = gameKey(e);
    if (isPress(e)) { e.preventDefault(); if (!e.repeat) scrub(i, RUB_KEY); return; }
    const to = k === "arrowright" || k === "d" ? i + 1 : k === "arrowleft" || k === "a" ? i - 1 : -1;
    if (to >= 0 && to < dust.length) { e.preventDefault(); panels.current[to]?.focus(); }
  };
  return <div className="hands-on wipe-beat">
    <p className="hands-on-hint">{t("handsOn.wipe.hint")}</p>
    <div className="wipe-panels" onPointerDown={(e) => { last.current = { x: e.clientX, y: e.clientY, i: panelAt(e.clientX, e.clientY) }; }}
      onPointerMove={move} onPointerUp={() => { last.current = null; }} onPointerCancel={() => { last.current = null; }} onPointerLeave={() => { last.current = null; }}>
      {dust.map((d, i) => {
        const clean = d <= CLEAN_AT;
        return <button key={i} type="button" ref={(el) => { panels.current[i] = el; }} data-panel={i} className={clean ? "wipe-panel clean" : "wipe-panel"}
          aria-label={t("handsOn.wipe.panel", { n: i + 1, state: t(clean ? "handsOn.wipe.clean" : "handsOn.wipe.dusty") })}
          onClick={() => scrub(i, RUB_KEY)} onKeyDown={(e) => key(e, i)}>
          <img src={asset("campaign/panel-clean")} alt="" draggable={false} />
          <img className="wipe-dust" src={asset("campaign/panel-dusty")} alt="" draggable={false} style={{ opacity: clean ? 0 : d }} />
        </button>;
      })}
    </div>
    <p className="wipe-count" role="status">{t("handsOn.wipe.count", { n: cleanCount(dust), total: dust.length })}</p>
    <p className="hands-on-if">{t("handsOn.ifNow")}</p>
    <Preview>{preview(choice)}</Preview>
    <div className="actions"><button type="button" className="primary hands-on-done" disabled={!can(choice)} onClick={() => onChoose(choice)}>{t("handsOn.wipe.inside")}</button></div>
  </div>;
}

const SPOT_ICON: Record<Spot, string> = { panels: "sun", greenhouse: "sprout", shelter: "shield" };

/** Sol 2: drag one spare part onto the base where it belongs (or tap the part, then its spot). */
export function BuildBeat({ beat, can, preview, onChoose }: HandsOnProps) {
  const { t } = useTranslation();
  const parts = beat.options.filter((o) => o.id !== "none").map((o) => o.id as Part);
  const [held, setHeld] = useState<Part>();
  const [msg, setMsg] = useState("");
  const [drag, setDrag] = useState<{ part: Part; x: number; y: number; moved: boolean } | null>(null);
  const dragged = useRef(false); // the click that ends a drag is not a tap
  const spots = useRef<Partial<Record<Spot, HTMLButtonElement | null>>>({});
  // Picking a part up moves the keyboard to the base (the spots are only enabled once something is held).
  useEffect(() => { if (held) spots.current.panels?.focus(); }, [held]);
  const place = (part: Part, spot: Spot) => {
    const r = placePart(part, spot);
    if (r.ok) { audio.playSfx("job-complete"); onChoose(part); return; }
    audio.playSfx("job-remove");
    setMsg(t("handsOn.build.wrong", { spot: t(`handsOn.build.spot.${r.belongs}`) }));
  };
  const hold = (part: Part) => { setHeld(part); setMsg(""); audio.playSfx("select"); };
  const dropAt = (x: number, y: number) => {
    const el = document.elementFromPoint?.(x, y)?.closest<HTMLElement>("[data-spot]");
    return el?.dataset.spot as Spot | undefined;
  };
  return <div className="hands-on build-beat">
    <p className="hands-on-hint">{t("handsOn.build.hint")}</p>
    <div className="build-base" role="group" aria-label={t("handsOn.build.base")}>
      {(["panels", "greenhouse", "shelter"] as Spot[]).map((spot) => <button key={spot} type="button" data-spot={spot} ref={(el) => { spots.current[spot] = el; }}
        className={held ? "build-spot ready" : "build-spot"} disabled={!held} onClick={() => held && place(held, spot)}>
        <Icon name={SPOT_ICON[spot]} /> <span>{t(`handsOn.build.spot.${spot}`)}</span>
      </button>)}
    </div>
    <p className="build-msg" role="status">{msg || (held ? t("handsOn.build.holding", { part: tRun(`beat.upgrade.${held}.label`) }) : t("handsOn.build.pick"))}</p>
    <div className="build-parts">
      {parts.map((part) => {
        const ok = can(part);
        return <button key={part} type="button" className={held === part ? "build-part held" : "build-part"} disabled={!ok} aria-pressed={held === part}
          onPointerDown={(e) => { if (!ok) return; dragged.current = false; e.currentTarget.setPointerCapture?.(e.pointerId); setDrag({ part, x: e.clientX, y: e.clientY, moved: false }); }}
          onPointerMove={(e) => { if (drag?.part === part) setDrag({ ...drag, x: e.clientX, y: e.clientY, moved: drag.moved || Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 8 }); }}
          onPointerUp={(e) => {
            if (drag?.part !== part) return;
            dragged.current = drag.moved;
            const spot = drag.moved ? dropAt(e.clientX, e.clientY) : undefined;
            setDrag(null);
            if (spot) place(part, spot); else if (drag.moved) setMsg(t("handsOn.build.missed"));
          }}
          onPointerCancel={() => setDrag(null)}
          onClick={() => { if (!dragged.current) hold(part); dragged.current = false; }}>
          <span className="build-part-icon" aria-hidden="true"><Icons icon={beat.options.find((o) => o.id === part)!.action.icon} /></span>
          <strong>{tRun(`beat.upgrade.${part}.label`)}</strong>
          <span className="beat-effects">{preview(part)}</span>
          {!ok && <small className="beat-cannot">{t("beatUi.cannot")}</small>}
        </button>;
      })}
    </div>
    {drag?.moved && <span className="build-ghost" aria-hidden="true" style={{ left: drag.x, top: drag.y }}><Icons icon={beat.options.find((o) => o.id === drag.part)!.action.icon} /></span>}
    <div className="actions"><button type="button" className="hands-on-done" onClick={() => onChoose("none")}>{t("handsOn.build.keep")}</button></div>
  </div>;
}

/** Sol 3: hold Send to power the dish, then watch the question cross to Earth while the clock counts the real delay. */
export function RadioRace({ can, preview, onChoose, delayMin }: HandsOnProps) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<"ready" | "charging" | "flying" | "arrived">("ready");
  const [level, setLevel] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [fast, setFast] = useState(false);
  const [msg, setMsg] = useState("");
  const start = useRef(0), fastRef = useRef(false);
  useEffect(() => { fastRef.current = fast; }, [fast]);
  const delay = Math.max(1, delayMin);
  // Charging: fill the dish while Send is held; full = sent.
  useEffect(() => {
    if (phase !== "charging") return;
    let raf = 0;
    const tick = () => {
      const c = charge(performance.now() - start.current);
      setLevel(c);
      if (c >= 1) {
        audio.playSfx("earth-message-send");
        // Calm mode and reduced motion skip the flight: the message is there at once.
        if (reducedMotion()) { setMinutes(delay); setPhase("arrived"); } else setPhase("flying");
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, delay]);
  // Flying: the time-lapse clock.
  useEffect(() => {
    if (phase !== "flying") return;
    let raf = 0, last = performance.now(), m = 0;
    const tick = () => {
      const now = performance.now();
      m = advanceSignal(m, now - last, fastRef.current, delay); last = now;
      setMinutes(m);
      if (signalView(m, delay).arrived) { setPhase("arrived"); return; }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, delay]);
  const sent = useRef(false);
  useEffect(() => {
    if (phase !== "arrived" || sent.current) return;
    sent.current = true;
    audio.playSfx("earth-message-receive");
    onChoose("call");
  }, [phase, onChoose]);
  const press = () => { if (phase !== "ready" || !can("call")) return; setMsg(""); start.current = performance.now(); setLevel(0); setPhase("charging"); };
  const release = () => { if (phase !== "charging") return; setPhase("ready"); setLevel(0); setMsg(t("handsOn.radio.tooShort")); };
  const view = signalView(minutes, delay);
  return <div className="hands-on radio-race">
    <p className="hands-on-hint">{t("handsOn.radio.hint")}</p>
    <div className="radio-strip" aria-hidden="true">
      <span className="radio-end"><Icon name="mars" /> {t("handsOn.radio.mars")}</span>
      <span className="radio-track"><i className="radio-signal" style={{ left: `${view.progress * 100}%` }} data-on={phase === "flying" || phase === "arrived" ? "" : undefined} /></span>
      <span className="radio-end"><Icon name="earth" /> {t("handsOn.radio.earth")}</span>
    </div>
    <p className="radio-clock" role="status">
      {phase === "flying" || phase === "arrived" ? <>{t("handsOn.radio.flying")} · <b>{t("handsOn.radio.clock", { n: view.minutes })}</b></> : msg || t("handsOn.radio.ready", { n: delay })}
    </p>
    <div className="radio-charge" aria-hidden="true"><i style={{ width: `${level * 100}%` }} /></div>
    <p className="hands-on-if">{t("handsOn.ifSend")}</p>
    <Preview>{preview("call")}</Preview>
    <div className="actions">
      {/* Separate keys: Send becomes fast-forward while it is still held, and letting go must not "click" the new button. */}
      {phase === "flying" ? <button key="fast" type="button" className="radio-fast" aria-pressed={fast} onClick={() => setFast(!fast)}>⏩ {t("handsOn.radio.fast")}</button>
        : <button key="send" type="button" className="primary radio-send" disabled={!can("call") || phase === "arrived"}
          onPointerDown={(e) => { e.currentTarget.setPointerCapture?.(e.pointerId); press(); }} onPointerUp={release} onPointerCancel={release}
          onKeyDown={(e) => { if (isPress(e)) { e.preventDefault(); if (!e.repeat) press(); } }} onKeyUp={(e) => { if (isPress(e)) release(); }}
          onContextMenu={(e) => e.preventDefault()}>{t("handsOn.radio.send")}</button>}
      {phase !== "flying" && <button type="button" className="hands-on-done" onClick={() => onChoose("skip")}>{t("handsOn.radio.skip")}</button>}
    </div>
  </div>;
}

/** Sol 4 (cold night): turn the heater dial. On = the heater uses power; Off = the crew huddles and eats more. */
export function HeaterDial({ can, preview, onChoose }: HandsOnProps) {
  const { t } = useTranslation();
  const [angle, setAngle] = useState(0);
  const dragging = useRef(false);
  const choice = heaterChoice(angle);
  const fromPointer = (e: React.PointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2), up = r.top + r.height / 2 - e.clientY;
    const a = up >= 0 ? Math.atan2(up, dx) : dx < 0 ? Math.PI : 0; // 0 = right, π = left; below the knob counts as the nearer side
    return 180 - (a * 180) / Math.PI;
  };
  const set = (a: number) => { if (heaterChoice(a) !== heaterChoice(angle)) audio.playSfx(heaterChoice(a) === "heat" ? "assign" : "select"); setAngle(a); };
  return <div className="hands-on heater-dial">
    <p className="hands-on-hint">{t("handsOn.heater.hint")}</p>
    <div className="heater-row">
      <div className="heater-knob" role="slider" tabIndex={0} aria-label={t("handsOn.heater.dial")}
        aria-valuemin={0} aria-valuemax={180} aria-valuenow={angle} aria-valuetext={t(choice === "heat" ? "handsOn.heater.on" : "handsOn.heater.off")}
        onPointerDown={(e) => { dragging.current = true; e.currentTarget.setPointerCapture?.(e.pointerId); set(fromPointer(e)); }}
        onPointerMove={(e) => { if (dragging.current) set(fromPointer(e)); }}
        onPointerUp={() => { dragging.current = false; set(heaterChoice(angle) === "heat" ? 180 : 0); }}
        onPointerCancel={() => { dragging.current = false; }}
        onKeyDown={(e) => {
          const k = gameKey(e);
          if (["arrowright", "arrowup", "d", "w"].includes(k)) { e.preventDefault(); set(dialStep(1)); }
          else if (["arrowleft", "arrowdown", "a", "s"].includes(k)) { e.preventDefault(); set(dialStep(-1)); }
          else if (isPress(e)) { e.preventDefault(); set(angle >= 90 ? 0 : 180); }
        }}>
        <span className="heater-label off" aria-hidden="true">{t("handsOn.heater.offShort")}</span>
        <span className="heater-pointer" aria-hidden="true" style={{ transform: `rotate(${angle - 90}deg)` }} />
        <span className="heater-label on" aria-hidden="true">{t("handsOn.heater.onShort")}</span>
      </div>
      <div className="heater-thermo" aria-hidden="true"><i style={{ height: `${20 + (angle / 180) * 80}%` }} data-warm={choice === "heat" ? "" : undefined} /></div>
      <span className="heater-crew" aria-hidden="true"><Icon name={choice === "heat" ? "heater" : "cold"} /></span>
    </div>
    <p className="heater-state" role="status">{t(choice === "heat" ? "handsOn.heater.on" : "handsOn.heater.off")}</p>
    <Preview>{preview(choice)}</Preview>
    <div className="actions"><button type="button" className="primary hands-on-done" disabled={!can(choice)} onClick={() => onChoose(choice)}>{t("handsOn.heater.go")}</button></div>
  </div>;
}

