import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { asset } from "./game/assets";
import { audio } from "./game/audio";
import { renderWorld } from "./game/renderWorld";
import { useSession } from "./game/session";
import { MARS_BASE, movePlayer, nearestInteraction, type Entity } from "./game/world";
import { useGame } from "./state/game";

export default function MarsHub({ onConsole, onMenu }: { onConsole: () => void; onMenu: () => void }) {
  const { t } = useTranslation();
  const canvas = useRef<HTMLCanvasElement>(null);
  const held = useRef(new Set<string>());
  const [near, setNear] = useState<Entity>();
  const [dialogue, setDialogue] = useState<Entity>();
  const [page, setPage] = useState(0);
  const [activating, setActivating] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const sol = useGame((s) => s.state.sol);
  const interact = useCallback(() => {
    if (!near || activating || dialogue) return;
    held.current.clear();
    audio.playSfx(near.interaction === "console" ? "console" : near.interaction === "door" ? "door" : "npc");
    if (near.interaction === "console") {
      setActivating(true);
      timer.current = setTimeout(onConsole, window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 350);
    } else { setDialogue(near); setPage(0); }
  }, [near, activating, dialogue, onConsole]);
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => { audio.playMusic("mars-base-ambience"); return audio.stopMusic; }, []);
  useEffect(() => { canvas.current?.focus(); }, []);
  useEffect(() => {
    const c = canvas.current;
    const ctx = c?.getContext("2d");
    if (!ctx) return;
    let player = { ...useSession.getState().position };
    let last = performance.now(), raf = 0, lastNear = "", lastStep = 0;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const labels = [t("world.supplies"), t("world.console"), t("world.research"), t("world.airlock")];
    const frame = (now: number) => {
      const keys = held.current;
      const dx = Number(keys.has("d") || keys.has("arrowright")) - Number(keys.has("a") || keys.has("arrowleft"));
      const dy = Number(keys.has("s") || keys.has("arrowdown")) - Number(keys.has("w") || keys.has("arrowup"));
      const moving = !dialogue && !activating && Boolean(dx || dy);
      if (moving) {
        player = movePlayer(MARS_BASE, player, dx, dy, (now - last) / 1000);
        if (now - lastStep > 330) { audio.playSfx("step"); lastStep = now; }
      }
      last = now;
      const target = nearestInteraction(MARS_BASE, player);
      if ((target?.id ?? "") !== lastNear) { setNear(target); lastNear = target?.id ?? ""; }
      renderWorld(ctx, MARS_BASE, player, now, moving, target?.id, motion.matches, labels);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); useSession.setState({ position: player }); };
  }, [dialogue, activating, t]);
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (dialogue || activating || (e.target instanceof HTMLElement && e.target.closest("input, select, textarea"))) return;
      const key = e.key.toLowerCase();
      if (["w", "a", "s", "d", "arrowup", "arrowleft", "arrowdown", "arrowright"].includes(key)) { e.preventDefault(); held.current.add(key); }
      if (key === "e" && !e.repeat) interact();
    };
    const up = (e: KeyboardEvent) => held.current.delete(e.key.toLowerCase());
    const clear = () => held.current.clear();
    window.addEventListener("keydown", down); window.addEventListener("keyup", up); window.addEventListener("blur", clear);
    document.addEventListener("visibilitychange", clear);
    return () => { clear(); window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); window.removeEventListener("blur", clear); document.removeEventListener("visibilitychange", clear); };
  }, [interact, dialogue, activating]);
  const closeDialogue = () => { audio.playSfx("menu-back"); setDialogue(undefined); canvas.current?.focus(); };
  const dialogueBox = useRef<HTMLDialogElement>(null);
  useEffect(() => { if (dialogue) dialogueBox.current?.showModal(); }, [dialogue]);
  const portrait = dialogue?.dialogue === "drone" ? "characters/robots/assistant-drone-portrait" : dialogue?.dialogue === "airlock" ? "consoles/mission-monitor" : `characters/npcs/${dialogue?.dialogue === "commander" ? "mission-commander" : dialogue?.dialogue}-portrait`;
  return <main className="station">
    <header className="station-header"><button onClick={() => { audio.playSfx("menu-back"); onMenu(); }}>← {t("world.menu")}</button><div><p className="eyebrow">{t("world.location")}</p><h1>{t("world.name")}</h1></div><span className="sol-tag">{t("common.solOf", { sol, total: 3 })}</span></header>
    <div className="world-objective"><span className="beacon-dot" /><p>{t("world.objective")}</p><span>{t("world.controls")}</span></div>
    <div className={`world-viewport ${activating ? "activating" : ""}`}>
      <canvas ref={canvas} width={640} height={384} tabIndex={0} aria-label={t("world.canvas")} />
      {activating && <div className="console-boot" role="status">{t("world.connecting")}</div>}
    </div>
    <div className="world-controls"><div className="dpad" aria-label={t("world.movement")}>
      {([['w', '↑', 'up'], ['a', '←', 'left'], ['s', '↓', 'down'], ['d', '→', 'right']] as const).map(([key, symbol, direction]) => <button key={key} className={`move-${direction}`} aria-label={t(`world.${direction}`)}
        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); held.current.add(key); }}
        onPointerUp={() => held.current.delete(key)} onPointerCancel={() => held.current.delete(key)} onLostPointerCapture={() => held.current.delete(key)}>{symbol}</button>)}
    </div><div className="interaction-guide"><p aria-live="polite">{near ? t(`world.near.${near.dialogue ?? "console"}`) : t("world.explore")}</p>
      <button className="primary" disabled={!near || activating} onClick={interact}>{near?.interaction === "console" ? t("world.openConsole") : t("world.interact")} <kbd>E</kbd></button>
    </div><p className="station-tip">{t("world.tip")}</p></div>
    {dialogue && <dialog ref={dialogueBox} className="npc-dialogue" onCancel={(e) => { e.preventDefault(); closeDialogue(); }}>
      <img src={asset(portrait)} alt="" /><div><p className="eyebrow">{t("world.crewChannel")}</p><h2>{t(`world.near.${dialogue.dialogue!}`)}</h2>
        <p className="lead">{t(`dialogue.${dialogue.dialogue!}.${page === 0 ? "hello" : "advice"}`)}</p>
        <div className="actions">{page === 0 && <button className="primary" onClick={() => { setPage(1); audio.playSfx("dialogue"); }}>{t("common.next")} →</button>}<button onClick={closeDialogue}>{t("help.close")}</button></div></div>
    </dialog>}
  </main>;
}
