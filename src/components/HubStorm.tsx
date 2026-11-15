import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { asset } from "../game/assets";
import { audio } from "../game/audio";
import type { HubStorm } from "../data/hubStorm";

/** A modal <dialog> that opens on mount; Esc (cancel) calls onClose. */
function Modal({ label, onClose, className = "", children }: { label: string; onClose: () => void; className?: string; children: React.ReactNode }) {
  const box = useRef<HTMLDialogElement>(null);
  useEffect(() => { const b = box.current; if (b && !b.open) b.showModal(); return () => b?.close(); }, []);
  return <dialog ref={box} className={`npc-dialogue storm-dialog ${className}`} aria-labelledby={label} onCancel={(e) => { e.preventDefault(); onClose(); }}>{children}</dialog>;
}

/** The storm arrives: the whole screen fills with dust and the alarm names the real storm it is like. */
export function StormAlarm({ storm, onClose }: { storm: HubStorm; onClose: () => void }) {
  const { t } = useTranslation();
  useEffect(() => { audio.playSfx("storm-warning"); }, []);
  return <Modal label="storm-title" onClose={onClose} className="dust-alarm">
    <div>
      <p className="eyebrow">⚠ {t("hubStorm.eyebrow")}</p>
      <h2 id="storm-title">🌪️ {t("hubStorm.title")}</h2>
      <p className="lead">{t("hubStorm.lead")}</p>
      <ul className="storm-todo"><li>☀️ {t("hubStorm.panels")}</li><li>🌱 {t("hubStorm.greenhouse")}</li></ul>
      <aside className="storm-real"><strong>{t("hubStorm.realTitle")}</strong>
        <p>{t(`hubStorm.real.${storm.real}`)}</p>
        {storm.source && <a href={storm.source.url} target="_blank" rel="noreferrer">{t("hubStorm.source")}: {storm.source.label}</a>}
      </aside>
      <div className="actions"><button className="primary" autoFocus onClick={onClose}>{t("hubStorm.go")}</button></div>
    </div>
  </Modal>;
}

const PANELS = 6;
/** Outside the airlock: wipe every dusty panel (tap, click or Enter on each). */
export function PanelsTask({ onDone, onClose }: { onDone: () => void; onClose: () => void }) {
  const { t } = useTranslation();
  const [clean, setClean] = useState<boolean[]>(() => Array(PANELS).fill(false));
  const left = clean.filter((c) => !c).length;
  const wipe = (i: number) => {
    if (clean[i]) return;
    audio.playSfx("select");
    setClean((c) => c.map((v, j) => v || j === i));
  };
  return <Modal label="panels-title" onClose={onClose}>
    <div>
      <p className="eyebrow">{t("hubStorm.outside")}</p>
      <h2 id="panels-title">{t("hubStorm.panelsTitle")}</h2>
      <p className="lead">{t("hubStorm.panelsLead")}</p>
      <div className="storm-panels">{clean.map((c, i) =>
        <button key={i} type="button" className={c ? "clean" : "dusty"} aria-pressed={c}
          aria-label={t("hubStorm.panel", { n: i + 1, state: t(c ? "hubStorm.clean" : "hubStorm.dusty") })}
          onClick={() => wipe(i)} onPointerEnter={(e) => { if (e.buttons) wipe(i); }}>
          <img src={asset(c ? "campaign/panel-clean" : "campaign/panel-dusty")} alt="" />
        </button>)}</div>
      <p aria-live="polite" className="storm-left">{left ? t("hubStorm.panelsLeft", { count: left }) : t("hubStorm.panelsAllClean")}</p>
      <div className="actions"><button className="primary" disabled={left > 0} onClick={onDone}>{t("hubStorm.backInside")}</button><button onClick={onClose}>{t("hubStorm.later")}</button></div>
    </div>
  </Modal>;
}

const STEPS = ["cover", "lights", "plants"] as const;
/** The broken greenhouse: three repair jobs in order. */
export function GreenhouseTask({ onDone, onClose }: { onDone: () => void; onClose: () => void }) {
  const { t } = useTranslation();
  const [done, setDone] = useState(0);
  return <Modal label="greenhouse-title" onClose={onClose}>
    <div>
      <p className="eyebrow">{t("world.near.greenhouse")}</p>
      <h2 id="greenhouse-title">{t("hubStorm.greenhouseTitle")}</h2>
      <p className="lead">{t("hubStorm.greenhouseLead")}</p>
      <ol className="storm-steps">{STEPS.map((s, i) => <li key={s}>
        <button type="button" disabled={i !== done} aria-pressed={i < done} onClick={() => { audio.playSfx("select"); setDone(i + 1); }}>
          <span aria-hidden="true">{i < done ? "✅" : ["🩹", "💡", "🌱"][i]}</span> {t(`hubStorm.step.${s}`)}
        </button></li>)}</ol>
      <div className="actions"><button className="primary" disabled={done < STEPS.length} onClick={onDone}>{t("hubStorm.fixed")}</button><button onClick={onClose}>{t("hubStorm.later")}</button></div>
    </div>
  </Modal>;
}
