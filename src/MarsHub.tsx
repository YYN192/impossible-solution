import { Icon } from "./components/Icon";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { audio } from "./game/audio";
import { useMission } from "./state/mission";
import { reducedMotion, useComfort } from "./state/comfort";
import { tRun } from "./i18n/dynamic";
import { renderWorld } from "./game/renderWorld";
import { gameKey } from "./game/pressedKeys";
import { useSession } from "./game/session";
import { usePressedKeys } from "./game/pressedKeys";
import { createWalkFx, idleBob, stepWalkFx } from "./game/walkFx";
import { MARS_BASE, movePlayer, nearestInteraction, tapTarget, walkToward, type Entity, type Point } from "./game/world";
import { useGame } from "./state/game";
import { firstSolStarted, useNav } from "./state/screen";
import { readFlags } from "./data/flags";
import { greenhouseAction, hubStormFor, panelsAction, repaired } from "./data/hubStorm";
import { GreenhouseTask, PanelsTask, StormAlarm } from "./components/HubStorm";
import { CrewTalk } from "./components/CrewTalk";
import SiteMap from "./components/SiteMap";
import SpaceWeatherStrip from "./components/SpaceWeatherStrip";
import EngineeringBay from "./components/EngineeringBay";
import type { StormView } from "./game/renderWorld";

// Physical keys → on-screen hint they light up (keydown on, keyup off).
const HINT_KEYS = { w: "w", arrowup: "w", a: "a", arrowleft: "a", s: "s", arrowdown: "s", d: "d", arrowright: "d", e: "e" } as const;

/** The station header names the place of the campaign being played (the classic keeps Gale Crater). */
export default function MarsHub({ onConsole, onMenu, onTravel }: { onConsole: () => void; onMenu: () => void; onTravel?: (campaign: string) => void }) {
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
  const [panel, setPanel] = useState<"map" | "radar" | "engineering">(); // the airlock's mission map (#54), the radar's space weather (#60)
  const view = useRef<StormView>({ level: 0, broken: false, marks: [] });
  view.current = { level: alarm ? 1 : stormLeft / 2, broken: !greenhouseDone, marks: [...(panelsDone ? [] : ["airlock"]), ...(greenhouseDone ? [] : ["greenhouse"])] };
  const finishTask = (done: boolean) => {
    if (done && task === "panels") useGame.getState().choose(panelsAction(storm!));
    if (done && task === "greenhouse") useGame.getState().choose(greenhouseAction(useGame.getState().state));
    if (done) { audio.playSfx("job-complete"); setNotice(stormLeft === 1 ? t("hubStorm.clear") : ""); }
    setTask(undefined); canvas.current?.focus({ preventScroll: true });
  };
  const interact = useCallback(() => {
    if (!near || activating || dialogue || task || alarm || panel) return;
    held.current.clear(); goal.current = pending.current = undefined;
    if (near.interaction === "console" && stormLeft) { audio.playSfx("machine-warning"); setNotice(t("hubStorm.blocked")); return; }
    if (near.id === "airlock" && !panelsDone) { audio.playSfx("door"); setTask("panels"); return; }
    if (near.id === "greenhouse" && !greenhouseDone) { audio.playSfx("npc"); setTask("greenhouse"); return; }
    if (near.id === "radar") { audio.playSfx("console"); setPanel("radar"); return; }
    if (near.dialogue === "engineering") { audio.playSfx("console-data"); setPanel("engineering"); return; }
    audio.playSfx(near.interaction === "console" ? "console" : near.interaction === "door" ? "door" : "npc");
    if (near.interaction === "console") {
      setActivating(true);
      timer.current = setTimeout(onConsole, reducedMotion() ? 0 : 350);
    } else if (near.id === "airlock") setPanel("map"); // outside a storm (the panel job comes first above)
    else setDialogue(near);
  }, [near, activating, dialogue, onConsole, task, alarm, panel, stormLeft, panelsDone, greenhouseDone, t]);
  useEffect(() => { if (arrived && pending.current && pending.current === near?.id) interact(); }, [arrived, near, interact]);
  useEffect(() => () => clearTimeout(timer.current), []);
  // Focus the game on arrival and again once a panel has closed (a modal dialog keeps the canvas inert until then).
  useEffect(() => { if (!panel) canvas.current?.focus({ preventScroll: true }); }, [panel]);
  const closePanel = () => { audio.playSfx("menu-back"); setPanel(undefined); };
  useEffect(() => {
    const c = canvas.current;
    const ctx = c?.getContext("2d");
    if (!ctx) return;
    let player = { ...useSession.getState().position };
    let last = performance.now(), raf = 0, lastNear = "", lastStep = 0, fx = createWalkFx(last);
    const frame = (now: number) => {
      const keys = held.current, seconds = (now - last) / 1000, free = !dialogue && !activating && !task && !alarm && !panel;
      const dx = Number(keys.has("d") || keys.has("arrowright")) - Number(keys.has("a") || keys.has("arrowleft"));
      const dy = Number(keys.has("s") || keys.has("arrowdown")) - Number(keys.has("w") || keys.has("arrowup"));
      let moving = false;
      const before = player;
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
      // High contrast drops the dust fog (the "!" marks stay); calm mode stills the canvas like reduced motion,
      // and turns off the walk dust and the idle bounce. Dust follows real movement (pushing into a wall raises none).
      const comfort = useComfort.getState(), reduced = reducedMotion();
      fx = stepWalkFx(fx, { now, moved: player.x !== before.x || player.y !== before.y, walking: moving, x: player.x, y: player.y, facing: player.facing, reduced });
      renderWorld(ctx, MARS_BASE, player, now, moving, target?.id, reduced, comfort.contrast ? { ...view.current, level: 0 } : view.current, useMission.getState().setup?.place === "moon", { puffs: fx.puffs, bob: idleBob(fx, now, reduced) }, firstSolStarted(useNav.getState()));
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); useSession.setState({ position: player }); };
  }, [dialogue, activating, task, alarm, panel]);
  // The key listeners live for the whole visit. They read the latest state through refs: re-adding them
  // whenever `near` changed used to clear the held keys, so walking past a crew member stopped the player.
  const live = useRef({ interact, busy: false });
  // While a panel is open its own listener handles E (busy here, so the closing E cannot reopen it).
  live.current = { interact, busy: Boolean(dialogue || task || alarm || panel) || activating };
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
  const dragging = useRef(false); // the mouse button (or finger) is held down on the room
  const pointAt = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return tapTarget(MARS_BASE, { x: (e.clientX - r.left) / r.width * MARS_BASE.width, y: (e.clientY - r.top) / r.height * MARS_BASE.height });
  };
  const tap = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (dialogue || activating) return;
    const target = pointAt(e);
    held.current.clear(); goal.current = target; pending.current = target.entity?.id;
    dragging.current = true;
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  // Click and drag: the player keeps walking after the held mouse. Letting go on a console, NPC or door uses it.
  const drag = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragging.current || !e.buttons || dialogue || activating) return;
    const target = pointAt(e);
    goal.current = target; pending.current = undefined;
  };
  const release = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragging.current) return;
    dragging.current = false;
    if (!pending.current && goal.current) pending.current = pointAt(e).entity?.id;
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
      : <div className="world-objective"><p>{campaign && campaign !== "classic" ? t(`world.objectiveFor.${campaign}` as never) : t("world.objective")}</p><span>{t("world.controls")}</span></div>}
    <div className={`world-viewport ${activating ? "activating" : ""}`}><div className="world-screen">
      <canvas ref={canvas} width={MARS_BASE.width} height={MARS_BASE.height} tabIndex={0} aria-label={tRun("world.canvas", {}, setup?.place)} aria-describedby="world-description" onPointerDown={tap} onPointerMove={drag} onPointerUp={release} onPointerCancel={() => { dragging.current = false; }} />
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
    {panel === "map" && <SiteMap current={campaign} onClose={closePanel} onTravel={onTravel && ((id) => { audio.playSfx("door"); setPanel(undefined); onTravel(id); })} />}
    {panel === "radar" && <SpaceWeatherStrip onClose={closePanel} />}
    {panel === "engineering" && <EngineeringBay onClose={closePanel} />}
    {task === "panels" && <PanelsTask onDone={() => finishTask(true)} onClose={() => finishTask(false)} />}
    {task === "greenhouse" && <GreenhouseTask onDone={() => finishTask(true)} onClose={() => finishTask(false)} />}
  </main>;
}
