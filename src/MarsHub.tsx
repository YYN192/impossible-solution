import { Icon } from "./components/Icon";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { audio, musicFor } from "./game/audio";
import { useMission } from "./state/mission";
import { tRun } from "./i18n/dynamic";
import { renderWorld } from "./game/renderWorld";
import { gameKey } from "./game/pressedKeys";
import { useSession } from "./game/session";
import { usePressedKeys } from "./game/pressedKeys";
import { MARS_BASE, movePlayer, nearestInteraction, tapTarget, walkToward, type Entity, type Point } from "./game/world";
import { useGame } from "./state/game";
import { useNav } from "./state/screen";
import { readFlags } from "./data/flags";
import { greenhouseAction, hubStormFor, panelsAction, repaired } from "./data/hubStorm";
import { GreenhouseTask, PanelsTask, StormAlarm } from "./components/HubStorm";
import { CrewTalk } from "./components/CrewTalk";
import type { StormView } from "./game/renderWorld";

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
  const [activating, setActivating] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const sol = useGame((s) => s.state.sol);
  const pressed = usePressedKeys(HINT_KEYS);
  // A real-data dust storm on this sol: the console stays shut until the panels and the greenhouse are fixed.
  const game = useGame((s) => s.state);
  const nav = useNav();
  const setup = useMission((m) => m.setup);
  const storm = ["morning", "beat", "plan"].includes(nav.screen) && nav.sol === game.sol ? hubStormFor(setup, nav.sol, readFlags().demo) : undefined;
  const panelsDone = !storm || repaired(game, "storm-panels"), greenhouseDone = !storm || repaired(game, "storm-greenhouse");
  const stormLeft = Number(!panelsDone) + Number(!greenhouseDone);
  const [alarm, setAlarm] = useState(stormLeft > 0);
  const [task, setTask] = useState<"panels" | "greenhouse">();
  const [notice, setNotice] = useState("");
  const view = useRef<StormView>({ level: 0, broken: false, marks: [] });
  view.current = { level: alarm ? 1 : stormLeft / 2, broken: !greenhouseDone, marks: [...(panelsDone ? [] : ["airlock"]), ...(greenhouseDone ? [] : ["greenhouse"])] };
  const finishTask = (done: boolean) => {
    if (done && task === "panels") useGame.getState().choose(panelsAction(storm!));
    if (done && task === "greenhouse") useGame.getState().choose(greenhouseAction(useGame.getState().state));
    if (done) { audio.playSfx("job-complete"); setNotice(stormLeft === 1 ? t("hubStorm.clear") : ""); }
    setTask(undefined); canvas.current?.focus({ preventScroll: true });
  };
  const interact = useCallback(() => {
    if (!near || activating || dialogue || task || alarm) return;
    held.current.clear(); goal.current = pending.current = undefined;
    if (near.interaction === "console" && stormLeft) { audio.playSfx("machine-warning"); setNotice(t("hubStorm.blocked")); return; }
    if (near.id === "airlock" && !panelsDone) { audio.playSfx("door"); setTask("panels"); return; }
    if (near.id === "greenhouse" && !greenhouseDone) { audio.playSfx("npc"); setTask("greenhouse"); return; }
    audio.playSfx(near.interaction === "console" ? "console" : near.interaction === "door" ? "door" : "npc");
    if (near.interaction === "console") {
      setActivating(true);
      timer.current = setTimeout(onConsole, window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 350);
    } else setDialogue(near);
  }, [near, activating, dialogue, onConsole, task, alarm, stormLeft, panelsDone, greenhouseDone, t]);
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
      const keys = held.current, seconds = (now - last) / 1000, free = !dialogue && !activating && !task && !alarm;
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
      renderWorld(ctx, MARS_BASE, player, now, moving, target?.id, motion.matches, view.current);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); useSession.setState({ position: player }); };
  }, [dialogue, activating, task, alarm]);
  // The key listeners live for the whole visit. They read the latest state through refs: re-adding them
  // whenever `near` changed used to clear the held keys, so walking past a crew member stopped the player.
  const live = useRef({ interact, busy: false });
  live.current = { interact, busy: Boolean(dialogue || task || alarm) || activating };
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (live.current.busy || (e.target instanceof HTMLElement && e.target.closest("input, select, textarea"))) return;
      const key = gameKey(e);
      if (["w", "a", "s", "d", "arrowup", "arrowleft", "arrowdown", "arrowright"].includes(key)) {
        // Arrows only stop page scrolling while the game itself has focus.
        if (e.target === canvas.current || e.target === document.body) e.preventDefault();
        held.current.add(key);
      }
      if (key === "e" && !e.repeat) live.current.interact();
    };
    const up = (e: KeyboardEvent) => held.current.delete(gameKey(e));
    // Leaving the tab or rotating can swallow key-up or pointer-up events: never keep walking afterwards.
    // (Not on "resize": phone address bars resize the page while a finger holds the d-pad.)
    const clear = () => held.current.clear();
    const events = ["blur", "orientationchange"] as const;
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
    setDialogue(undefined);
    // the modal dialog keeps the canvas inert until it unmounts, so focus after React removes it
    setTimeout(() => canvas.current?.focus({ preventScroll: true }));
  };
  return <main className={stormLeft ? "station in-storm" : "station"}>
    <header className="station-header"><button onClick={() => { audio.playSfx("menu-back"); onMenu(); }}>← {t("world.menu")}</button><div><p className="eyebrow">{campaign && campaign !== "storm" ? `${tRun(`campaign.${campaign}.where`)} / ${tRun(`campaign.${campaign}.name`)}` : t("world.location")}</p><h1>{tRun("world.name", {}, setup?.place)}</h1></div><span className="sol-tag">{tRun("common.solOf", { sol, total: useMission.getState().setup?.rules.sols ?? 3 }, useMission.getState().setup?.place)}</span></header>
    {stormLeft ? <div className="world-objective storm-objective"><p><strong><Icon name="dust-storm" /> {t("hubStorm.todo")}</strong></p><ul>
      <li className={panelsDone ? "done" : ""}><Icon name={panelsDone ? "check" : "sun"} /> {t("hubStorm.panels")}</li>
      <li className={greenhouseDone ? "done" : ""}><Icon name={greenhouseDone ? "check" : "sprout"} /> {t("hubStorm.greenhouse")}</li></ul></div>
      : <div className="world-objective"><p>{t("world.objective")}</p><span>{t("world.controls")}</span></div>}
    <div className={`world-viewport ${activating ? "activating" : ""}`}><div className="world-screen">
      <canvas ref={canvas} width={MARS_BASE.width} height={MARS_BASE.height} tabIndex={0} aria-label={tRun("world.canvas", {}, setup?.place)} aria-describedby="world-description" onPointerDown={tap} />
      <p id="world-description" className="visually-hidden">{t("world.description")}</p>
      {stormLeft > 0 && !alarm && <div className="dust-cover in-world" style={{ opacity: stormLeft * 0.18 }} aria-hidden="true" />}
      {activating && <div className="console-boot" role="status">{t("world.connecting")}</div>}
    </div></div>
    <div className="world-controls"><div className="dpad" aria-label={t("world.movement")}>
      {([['w', '↑', 'up'], ['a', '←', 'left'], ['s', '↓', 'down'], ['d', '→', 'right']] as const).map(([key, symbol, direction]) => <button key={key} className={`move-${direction}`} data-pressed={pressed.has(key) ? "" : undefined} aria-label={t(`world.${direction}`)}
        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); held.current.add(key); }}
        onPointerUp={() => held.current.delete(key)} onPointerCancel={() => held.current.delete(key)} onLostPointerCapture={() => held.current.delete(key)}>{symbol}</button>)}
    </div><div className="interaction-guide"><p aria-live="polite">{notice || (near ? t(`world.near.${near.dialogue ?? "console"}`) : tRun("world.explore", {}, setup?.place))}</p>
      <button className="primary" disabled={!near || activating} onClick={interact}>{near?.interaction === "console" ? t("world.openConsole") : t("world.interact")} <kbd data-pressed={pressed.has("e") ? "" : undefined}>E</kbd></button>
      <button className="quiet-button go-console" disabled={stormLeft > 0} onClick={onConsole}>{t("world.goConsole")} →</button>
    </div><p className="station-tip">{t("world.tip")}</p></div>
    {dialogue?.dialogue && <CrewTalk speaker={dialogue.dialogue} onClose={closeDialogue} />}
    {stormLeft > 0 && alarm && <div className="dust-cover full" aria-hidden="true" />}
    {storm && alarm && <StormAlarm storm={storm} onClose={() => { setAlarm(false); canvas.current?.focus({ preventScroll: true }); }} />}
    {task === "panels" && <PanelsTask onDone={() => finishTask(true)} onClose={() => finishTask(false)} />}
    {task === "greenhouse" && <GreenhouseTask onDone={() => finishTask(true)} onClose={() => finishTask(false)} />}
  </main>;
}
