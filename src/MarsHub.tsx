import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { asset } from "./game/assets";
import { audio } from "./game/audio";
import { renderWorld } from "./game/renderWorld";
import { useSession } from "./game/session";
import { MARS_BASE, movePlayer, nearestInteraction, tapTarget, walkToward, type Entity, type Point } from "./game/world";
import { useGame } from "./state/game";

// Area names as HTML over the canvas (world coords), so they stay sharp and readable at any size.
const LABELS = [["world.supplies", 128, 96], ["world.console", 320, 220], ["world.research", 496, 152], ["world.airlock", 320, 382]] as const;

export default function MarsHub({ onConsole, onMenu }: { onConsole: () => void; onMenu: () => void }) {
  const { t } = useTranslation();
  const canvas = useRef<HTMLCanvasElement>(null);
  const held = useRef(new Set<string>());
  const goal = useRef<Point>(undefined); // tap-to-walk target
  const pending = useRef<string>(undefined); // tapped console/NPC/door to use on arrival
  const [arrived, setArrived] = useState(0);
  const [near, setNear] = useState<Entity>();
  const [dialogue, setDialogue] = useState<Entity>();
  const [page, setPage] = useState(0);
  const [activating, setActivating] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const sol = useGame((s) => s.state.sol);
  const interact = useCallback(() => {
    if (!near || activating || dialogue) return;
    held.current.clear(); goal.current = pending.current = undefined;
    audio.playSfx(near.interaction === "console" ? "console" : near.interaction === "door" ? "door" : "npc");
    if (near.interaction === "console") {
      setActivating(true);
      timer.current = setTimeout(onConsole, window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 350);
    } else { setDialogue(near); setPage(0); }
  }, [near, activating, dialogue, onConsole]);
  useEffect(() => { if (arrived && pending.current && pending.current === near?.id) interact(); }, [arrived, near, interact]);
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => { canvas.current?.focus({ preventScroll: true }); }, []);
  useEffect(() => {
    const c = canvas.current;
    const ctx = c?.getContext("2d");
    if (!ctx) return;
    let player = { ...useSession.getState().position };
    let last = performance.now(), raf = 0, lastNear = "", lastStep = 0;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const frame = (now: number) => {
      const keys = held.current, seconds = (now - last) / 1000, free = !dialogue && !activating;
      const dx = Number(keys.has("d") || keys.has("arrowright")) - Number(keys.has("a") || keys.has("arrowleft"));
      const dy = Number(keys.has("s") || keys.has("arrowdown")) - Number(keys.has("w") || keys.has("arrowup"));
      let moving = false;
      if (dx || dy) goal.current = pending.current = undefined;
      if (free && (dx || dy)) { player = movePlayer(MARS_BASE, player, dx, dy, seconds); moving = true; }
      else if (free && goal.current) {
        const step = walkToward(MARS_BASE, player, goal.current, seconds);
        player = step.p; moving = !step.done;
        if (step.done) { goal.current = undefined; setArrived((n) => n + 1); }
      }
      if (moving && now - lastStep > 330) { audio.playSfx("step"); lastStep = now; }
      last = now;
      const target = nearestInteraction(MARS_BASE, player);
      if ((target?.id ?? "") !== lastNear) { setNear(target); lastNear = target?.id ?? ""; }
      renderWorld(ctx, MARS_BASE, player, now, moving, target?.id, motion.matches);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); useSession.setState({ position: player }); };
  }, [dialogue, activating]);
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (dialogue || activating || (e.target instanceof HTMLElement && e.target.closest("input, select, textarea"))) return;
      const key = e.key.toLowerCase();
      if (["w", "a", "s", "d", "arrowup", "arrowleft", "arrowdown", "arrowright"].includes(key)) {
        // Arrows only stop page scrolling while the game itself has focus.
        if (e.target === canvas.current || e.target === document.body) e.preventDefault();
        held.current.add(key);
      }
      if (key === "e" && !e.repeat) interact();
    };
    const up = (e: KeyboardEvent) => held.current.delete(e.key.toLowerCase());
    // Resizing/rotating can swallow key-up or pointer-up events: never keep walking afterwards.
    const clear = () => held.current.clear();
    const events = ["blur", "resize", "orientationchange"] as const;
    window.addEventListener("keydown", down); window.addEventListener("keyup", up); events.forEach((n) => window.addEventListener(n, clear));
    document.addEventListener("visibilitychange", clear);
    return () => { clear(); window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); events.forEach((n) => window.removeEventListener(n, clear)); document.removeEventListener("visibilitychange", clear); };
  }, [interact, dialogue, activating]);
  const tap = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (dialogue || activating) return;
    const r = e.currentTarget.getBoundingClientRect();
    const target = tapTarget(MARS_BASE, { x: (e.clientX - r.left) / r.width * MARS_BASE.width, y: (e.clientY - r.top) / r.height * MARS_BASE.height });
    held.current.clear(); goal.current = target; pending.current = target.entity?.id;
  };
  const closeDialogue = () => { setDialogue(undefined); canvas.current?.focus({ preventScroll: true }); };
  const dialogueBox = useRef<HTMLDialogElement>(null);
  useEffect(() => { if (dialogue) dialogueBox.current?.showModal(); }, [dialogue]);
  const portrait = dialogue?.dialogue === "drone" ? "characters/robots/assistant-drone-portrait" : dialogue?.dialogue === "airlock" ? "consoles/mission-monitor" : `characters/npcs/${dialogue?.dialogue === "commander" ? "mission-commander" : dialogue?.dialogue}-portrait`;
  return <main className="station">
    <header className="station-header"><button onClick={onMenu}>← {t("world.menu")}</button><div><p className="eyebrow">{t("world.location")}</p><h1>{t("world.name")}</h1></div><span className="sol-tag">{t("common.solOf", { sol, total: 3 })}</span></header>
    <div className="world-objective"><span className="beacon-dot" /><p>{t("world.objective")}</p><span>{t("world.controls")}</span></div>
    <div className={`world-viewport ${activating ? "activating" : ""}`}><div className="world-screen">
      <canvas ref={canvas} width={MARS_BASE.width} height={MARS_BASE.height} tabIndex={0} aria-label={t("world.canvas")} onPointerDown={tap} />
      {LABELS.map(([key, x, y]) => <span key={key} className="world-label" style={{ left: `${x / 6.4}%`, top: `${y / 3.84}%` }}>{t(key)}</span>)}
      {activating && <div className="console-boot" role="status">{t("world.connecting")}</div>}
    </div></div>
    <div className="world-controls"><div className="dpad" aria-label={t("world.movement")}>
      {([['w', '↑', 'up'], ['a', '←', 'left'], ['s', '↓', 'down'], ['d', '→', 'right']] as const).map(([key, symbol, direction]) => <button key={key} className={`move-${direction}`} aria-label={t(`world.${direction}`)}
        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); held.current.add(key); }}
        onPointerUp={() => held.current.delete(key)} onPointerCancel={() => held.current.delete(key)} onLostPointerCapture={() => held.current.delete(key)}>{symbol}</button>)}
    </div><div className="interaction-guide"><p aria-live="polite">{near ? t(`world.near.${near.dialogue ?? "console"}`) : t("world.explore")}</p>
      <button className="primary" disabled={!near || activating} onClick={interact}>{near?.interaction === "console" ? t("world.openConsole") : t("world.interact")} <kbd>E</kbd></button>
      <button className="quiet-button go-console" onClick={onConsole}>{t("world.goConsole")} →</button>
    </div><p className="station-tip">{t("world.tip")}</p></div>
    {dialogue && <dialog ref={dialogueBox} className="npc-dialogue" onCancel={(e) => { e.preventDefault(); closeDialogue(); }}>
      <img src={asset(portrait)} alt="" /><div><p className="eyebrow">{t("world.crewChannel")}</p><h2>{t(`world.near.${dialogue.dialogue!}`)}</h2>
        <p className="lead">{t(`dialogue.${dialogue.dialogue!}.${page === 0 ? "hello" : "advice"}`)}</p>
        <div className="actions">{page === 0 && <button className="primary" onClick={() => { setPage(1); audio.playSfx("dialogue"); }}>{t("common.next")} →</button>}<button onClick={closeDialogue}>{t("help.close")}</button></div></div>
    </dialog>}
  </main>;
}
