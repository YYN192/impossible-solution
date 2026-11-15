import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { asset } from "./game/assets";
import { audio, musicFor } from "./game/audio";
import { useMission } from "./state/mission";
import { tRun } from "./i18n/dynamic";
import { renderWorld } from "./game/renderWorld";
import { useSession } from "./game/session";
import { usePressedKeys } from "./game/pressedKeys";
import { MARS_BASE, movePlayer, nearestInteraction, tapTarget, walkToward, type Entity, type Point } from "./game/world";
import { useGame } from "./state/game";

// Physical keys → on-screen hint they light up (keydown on, keyup off).
const HINT_KEYS = { w: "w", arrowup: "w", a: "a", arrowleft: "a", s: "s", arrowdown: "s", d: "d", arrowright: "d", e: "e" } as const;

/** The station header names the place of the campaign being played (the classic keeps Gale Crater). */
export default function MarsHub({ onConsole, onMenu }: { onConsole: () => void; onMenu: () => void }) {
  const { t } = useTranslation();
  const campaign = useMission((m) => m.setup?.campaignId);
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
  const pressed = usePressedKeys(HINT_KEYS);
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
  useEffect(() => { const track = musicFor("hub"); audio.playMusic(track); return audio.stopMusic; }, []);
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
  // The key listeners read the latest state through a ref, so they are attached once. Re-attaching
  // them whenever `interact` changed (every time something came into or out of reach) ran the
  // cleanup below, which dropped the held keys: the player froze until the OS key-repeat kicked in.
  const latest = useRef({ interact, dialogue, activating });
  useEffect(() => { latest.current = { interact, dialogue, activating }; });
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const { interact, dialogue, activating } = latest.current;
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
  }, []);
  const tap = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (dialogue || activating) return;
    const r = e.currentTarget.getBoundingClientRect();
    const target = tapTarget(MARS_BASE, { x: (e.clientX - r.left) / r.width * MARS_BASE.width, y: (e.clientY - r.top) / r.height * MARS_BASE.height });
    held.current.clear(); goal.current = target; pending.current = target.entity?.id;
  };
  const closeDialogue = () => {
    audio.playSfx("menu-back");
    dialogueBox.current?.close(); // a modal dialog keeps the canvas inert until it is closed, so focus() only works after this
    setDialogue(undefined); canvas.current?.focus({ preventScroll: true });
  };
  const dialogueBox = useRef<HTMLDialogElement>(null);
  useEffect(() => { if (dialogue) dialogueBox.current?.showModal(); }, [dialogue]);
  const portrait = dialogue?.dialogue === "drone" ? "characters/robots/assistant-drone-portrait" : dialogue?.dialogue === "airlock" ? "consoles/mission-monitor" : `characters/npcs/${dialogue?.dialogue === "commander" ? "mission-commander" : dialogue?.dialogue}-portrait`;
  return <main className="station">
    <header className="station-header"><button onClick={() => { audio.playSfx("menu-back"); onMenu(); }}>← {t("world.menu")}</button><div><p className="eyebrow">{campaign && campaign !== "storm" ? `${tRun(`campaign.${campaign}.where`)} / ${tRun(`campaign.${campaign}.name`)}` : t("world.location")}</p><h1>{t("world.name")}</h1></div><span className="sol-tag">{tRun("common.solOf", { sol, total: useMission.getState().setup?.rules.sols ?? 3 }, useMission.getState().setup?.place)}</span></header>
    <div className="world-objective"><span className="beacon-dot" /><p>{t("world.objective")}</p><span>{t("world.controls")}</span></div>
    <div className={`world-viewport ${activating ? "activating" : ""}`}><div className="world-screen">
      <canvas ref={canvas} width={MARS_BASE.width} height={MARS_BASE.height} tabIndex={0} aria-label={t("world.canvas")} aria-describedby="world-description" onPointerDown={tap} />
      <p id="world-description" className="visually-hidden">{t("world.description")}</p>
      {activating && <div className="console-boot" role="status">{t("world.connecting")}</div>}
    </div></div>
    <div className="world-controls"><div className="dpad" aria-label={t("world.movement")}>
      {([['w', '↑', 'up'], ['a', '←', 'left'], ['s', '↓', 'down'], ['d', '→', 'right']] as const).map(([key, symbol, direction]) => <button key={key} className={`move-${direction}`} data-pressed={pressed.has(key) ? "" : undefined} aria-label={t(`world.${direction}`)}
        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); held.current.add(key); }}
        onPointerUp={() => held.current.delete(key)} onPointerCancel={() => held.current.delete(key)} onLostPointerCapture={() => held.current.delete(key)}>{symbol}</button>)}
    </div><div className="interaction-guide"><p aria-live="polite">{near ? t(`world.near.${near.dialogue ?? "console"}`) : t("world.explore")}</p>
      <button className="primary" disabled={!near || activating} onClick={interact}>{near?.interaction === "console" ? t("world.openConsole") : t("world.interact")} <kbd data-pressed={pressed.has("e") ? "" : undefined}>E</kbd></button>
      <button className="quiet-button go-console" onClick={onConsole}>{t("world.goConsole")} →</button>
    </div><p className="station-tip">{t("world.tip")}</p></div>
    {dialogue && <dialog ref={dialogueBox} className="npc-dialogue" aria-labelledby="npc-dialogue-title" onCancel={(e) => { e.preventDefault(); closeDialogue(); }}>
      <img src={asset(portrait)} alt="" /><div><p className="eyebrow">{t("world.crewChannel")}</p><h2 id="npc-dialogue-title">{t(`world.near.${dialogue.dialogue!}`)}</h2>
        <p className="lead">{t(`dialogue.${dialogue.dialogue!}.${page === 0 ? "hello" : "advice"}`)}</p>
        <div className="actions">{page === 0 && <button className="primary" onClick={() => { setPage(1); audio.playSfx("dialogue"); }}>{t("common.next")} →</button>}<button onClick={closeDialogue}>{t("help.close")}</button></div></div>
    </dialog>}
  </main>;
}
