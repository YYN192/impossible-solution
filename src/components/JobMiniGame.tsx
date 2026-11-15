import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { asset } from "../game/assets";
import { audio } from "../game/audio";
import { mistake } from "../game/feedback";
import {
  DISH_STEPS, GROW_TARGET, WATER_MAX, STACK_CENTER, STACK_GOAL,
  drop, progress, send, startMiniGame, tap, tick, turn, won, type MiniGame,
} from "../game/miniGames";
import { gameKey } from "../game/pressedKeys";
import { useGameClock } from "../game/useGameClock";
import type { JobId } from "../sim/types";

/** A pixel sprite (src/assets/pixel): hard edges, scaled by whole pixels in CSS. */
const Sprite = ({ name, className = "" }: { name: string; className?: string }) =>
  <img className={`pixel ${className}`} src={asset(name)} alt="" draggable={false} />;
const SHINY_ART = ["items/mineral-blue", "items/mineral-green", "items/mineral-red"];

/**
 * The short action mini game that plays when a job is given to an astronaut. A clock ticks every
 * TICK_MS: dust blows back, plants drink, the block slides, Earth drifts, rocks pop up.
 * Just for fun: the job is already in the plan, so Skip and Back to the plan both keep it.
 * onClose(true) after a win, onClose(false) after Skip or Esc.
 */
export function JobMiniGame({ job, seed, onClose }: { job: JobId; seed: number; onClose: (won: boolean) => void }) {
  const { t } = useTranslation();
  const [game, setGameState] = useState<MiniGame>(() => startMiniGame(job, seed));
  // The newest game, updated the moment it changes (not at the next render): a quick second key
  // press or a clock tick always builds on the last move, so no press is lost and no tick undone.
  const now = useRef(game);
  const setGame = (next: MiniGame) => { now.current = next; setGameState(next); };
  const box = useRef<HTMLDialogElement>(null);
  const done = won(game);
  const { started, paused, togglePause, go } = useGameClock(done, () => {
    const g = now.current, n = tick(g);
    if (setbackIn(g, n)) mistake("small", box.current);
    setGame(n);
  });
  useEffect(() => { const b = box.current; if (b && !b.open) b.showModal(); return () => b?.close?.(); }, []);
  // Music only: the mini-game theme comes at the next song end (game/audio.ts); the game itself is unchanged.
  useEffect(() => audio.miniGameOpened(), []);
  // "Great job!" shows for 1 s, then the game goes back to the plan by itself (the latest onClose, without restarting the second).
  const close = useRef(onClose);
  useEffect(() => { close.current = onClose; });
  useEffect(() => {
    if (!done) return;
    audio.playSfx("job-complete");
    const back = setTimeout(() => close.current(true), 1000);
    return () => clearTimeout(back);
  }, [done]);
  const play = (move: Move, sound = "console-button") => {
    go();
    const game = now.current;
    if (!started && game.job === "shelter") return; // the first press only starts the sliding block
    const nextGame = move(game);
    if (nextGame === game) return;
    const missed = "miss" in nextGame && nextGame.miss;
    if (missed) mistake("small", box.current); else audio.playSfx(sound);
    setGame(nextGame);
  };
  // Ask Earth keys live on window: the ← button disables at the edge and focus would drop to <body>.
  useEffect(() => {
    if (game.job !== "askEarth" || done) return;
    const onWindowKey = (e: KeyboardEvent) => {
      const k = gameKey(e);
      const turnBy = k === "arrowleft" || k === "a" ? -1 : k === "arrowright" || k === "d" ? 1 : 0;
      if (turnBy) { e.preventDefault(); play((g) => turn(g, turnBy)); return; }
      if (k === " " || k === "w") {
        e.preventDefault();
        const g = now.current;
        if (g.job === "askEarth" && g.aim === g.earth) play(send, "earth-message-send"); else mistake("small", box.current);
      }
    };
    window.addEventListener("keydown", onWindowKey);
    return () => window.removeEventListener("keydown", onWindowKey);
  });
  // #63: the keyboard plays every mini-game, by physical key (works on Bulgarian layouts).
  const onKey = (e: React.KeyboardEvent<HTMLDialogElement>) => {
    if (done) return;
    const k = gameKey(e.nativeEvent);
    if (game.job === "shelter" && (k === " " || k === "enter") && !(e.target instanceof HTMLButtonElement)) { e.preventDefault(); play((g) => drop(g), "job-assign"); return; }
    // Grid games: arrows move focus between the tiles.
    const tile = (e.target as HTMLElement).closest?.(".mini-tile");
    const step = { arrowleft: -1, arrowright: 1, arrowup: -2, arrowdown: 2 }[k as "arrowleft"];
    if (tile && step) {
      e.preventDefault();
      const tiles = [...tile.parentElement!.querySelectorAll<HTMLElement>(".mini-tile")];
      const cols = Math.max(1, tiles.filter((x) => x.offsetTop === tiles[0].offsetTop).length);
      const i = tiles.indexOf(tile as HTMLElement), d = Math.abs(step) === 2 ? Math.sign(step) * (cols === tiles.length ? 0 : cols) : step;
      tiles[i + d]?.focus();
    }
  };
  const { done: count, total } = progress(game);
  const title = `minigame-${job}-title`;
  return <dialog ref={box} className={`npc-dialogue mini-game mini-${job}`} aria-labelledby={title}
    onCancel={(e) => { e.preventDefault(); onClose(done); }} onKeyDown={onKey}>
    <div>
      <p className="eyebrow">{t("miniGame.eyebrow")} · <span>{t(`jobs.${job}`)}</span></p>
      <h2 id={title}>{t(`miniGame.${job}.title`)}</h2>
      <p className="lead">{t(`miniGame.${job}.lead`)}</p>
      <div className="mini-board"><Board game={game} play={play} /></div>
      <p className="note mini-keys">{t(`miniGame.keys.${job}`)}</p>
      <div className="mini-meter" aria-hidden="true">{Array.from({ length: total }, (_, i) => <span key={i} className={i < count ? "on" : ""} />)}</div>
      <p aria-live="polite" className="storm-left">
        {done ? <strong className="mini-won"><img className="pixel" src={asset("minigame/sparkle")} alt="" /><span>{t("miniGame.won")}</span></strong>
          : !started ? <span>{t("miniGame.start")}</span> : paused ? <span>{t("miniGame.paused")}</span> : <Hint game={game} />}
        {!done && <span className="mini-count"> {t("miniGame.progress", { done: count, total })}</span>}
      </p>
      <div className="actions">
        {done
          ? <button type="button" className="primary" autoFocus onClick={() => onClose(true)}>{t("miniGame.finish")} <span aria-hidden="true">→</span></button>
          : <>
            {started && <button type="button" aria-pressed={paused} onClick={togglePause}>{t(paused ? "miniGame.resume" : "miniGame.pause")}</button>}
            <button type="button" onClick={() => onClose(false)}>{t("miniGame.skip")}</button>
          </>}
      </div>
    </div>
  </dialog>;
}

/** True when a tick just undid the kid's work: dust on a clean panel, or a plant that ran out of water. */
function setbackIn(a: MiniGame, b: MiniGame): boolean {
  if (a.job === "panels" && b.job === "panels") return b.clean.filter(Boolean).length < a.clean.filter(Boolean).length;
  if (a.job === "greenhouse" && b.job === "greenhouse") return b.water.some((w, i) => w === 0 && a.water[i] > 0);
  return false;
}

function Hint({ game }: { game: MiniGame }) {
  const { t } = useTranslation();
  switch (game.job) {
    case "shelter":
      return <span className={game.pos === STACK_CENTER ? "mini-now" : ""}>{t(game.miss ? "miniGame.shelter.oops" : game.pos === STACK_CENTER ? "miniGame.shelter.now" : "miniGame.shelter.wait")}</span>;
    case "askEarth":
      return <span className={game.aim === game.earth ? "mini-now" : ""}>{t(game.aim === game.earth ? "miniGame.askEarth.aimed" : "miniGame.askEarth.notYet")}</span>;
    case "science":
      return game.miss ? <span>{t("miniGame.science.oops")}</span> : null;
    default:
      return null;
  }
}

/** A move: the next game from the newest one (never from a copy kept since the last render). */
type Move = (game: MiniGame) => MiniGame;

function Board({ game, play }: { game: MiniGame; play: (move: Move, sound?: string) => void }) {
  const { t } = useTranslation();
  const row = (fill: (i: number) => React.ReactNode, className = "") =>
    <div className={`mini-row ${className}`} aria-hidden="true">{Array.from({ length: DISH_STEPS }, (_, i) => <span key={i}>{fill(i)}</span>)}</div>;
  switch (game.job) {
    case "panels":
      return <div className="mini-grid panels">{game.clean.map((c, i) =>
        <button key={i} type="button" autoFocus={i === 0} className={`mini-tile ${c ? "clean" : "dusty"}`} aria-pressed={c}
          aria-label={t("miniGame.panels.panel", { n: i + 1, state: t(c ? "miniGame.panels.clean" : "miniGame.panels.dusty") })}
          onClick={() => play((g) => tap(g, i))} onPointerEnter={(e) => { if (e.buttons) play((g) => tap(g, i)); }}>
          <Sprite name={c ? "campaign/panel-clean" : "campaign/panel-dusty"} className="big" />
        </button>)}</div>;
    case "greenhouse":
      return <div className="mini-grid">{game.growth.map((g, i) => {
        const w = game.water[i];
        const state = g >= GROW_TARGET ? "grown" : w > 0 ? "watered" : "thirsty";
        return <button key={i} type="button" autoFocus={i === 0} className={`mini-tile plant ${state}`} aria-pressed={g >= GROW_TARGET}
          aria-label={t("miniGame.greenhouse.plant", { n: i + 1, state: t(`miniGame.greenhouse.${state}`) })}
          onClick={() => play((g) => tap(g, i))}>
          <Sprite name={`minigame/plant-${g}`} className="big" />
          <span className="mini-drops">{g >= GROW_TARGET
            ? <Sprite name="minigame/check" />
            : Array.from({ length: WATER_MAX }, (_, d) => <Sprite key={d} name={d < w ? "minigame/drop-full" : "minigame/drop-empty"} />)}</span>
        </button>;
      })}</div>;
    case "shelter":
      return <>
        {row((i) => i === game.pos ? <Sprite name="minigame/block" className="wide" /> : null, "slider")}
        {row((i) => i === STACK_CENTER ? <span className="mini-target" /> : null, "rail")}
        <div className="mini-stack" aria-hidden="true">{Array.from({ length: STACK_GOAL }, (_, i) =>
          <Sprite key={i} name={i < game.placed ? "minigame/block" : "minigame/block-slot"} className="wide" />).reverse()}</div>
        <div className="mini-dish-controls">
          <button type="button" className="primary" autoFocus onClick={() => play((g) => drop(g), "job-assign")}>{t("miniGame.shelter.drop")}</button>
        </div>
      </>;
    case "askEarth": {
      const aimed = game.aim === game.earth;
      return <>
        {row((i) => <Sprite name={i === game.earth ? "minigame/earth" : "minigame/star"} className={i === game.earth ? "big earth" : "star"} />, "mini-sky")}
        {row((i) => i === game.aim ? <Sprite name="minigame/dish" className={`big dish-here ${aimed ? "aimed" : ""}`} /> : null, "mini-sky dish")}
        <div className="mini-dish-controls">
          <button type="button" autoFocus disabled={game.aim === 0} onClick={() => play((g) => turn(g, -1))}><span aria-hidden="true">←</span> {t("miniGame.askEarth.left")}</button>
          <button type="button" className="primary" disabled={!aimed} onClick={() => play((g) => send(g), "earth-message-send")}>{t("miniGame.askEarth.send")}</button>
          <button type="button" disabled={game.aim === DISH_STEPS - 1} onClick={() => play((g) => turn(g, 1))}>{t("miniGame.askEarth.right")} <span aria-hidden="true">→</span></button>
        </div>
      </>;
    }
    case "science":
      return <div className="mini-grid rocks">{game.cells.map((c, i) =>
        <button key={i} type="button" autoFocus={i === 0} className={`mini-tile hole ${c ?? "empty"}`}
          aria-label={t("miniGame.science.rock", { n: i + 1, state: t(`miniGame.science.${c ?? "empty"}`) })}
          onClick={() => play((g) => tap(g, i), "science-discovery")}>
          {c && <Sprite name={c === "shiny" ? SHINY_ART[i % SHINY_ART.length] : "minigame/rock-plain"} className="rock" />}
          {c === "shiny" && <Sprite name="minigame/sparkle" className="glint" />}
          <Sprite name="minigame/hole" className="wide ground" />
        </button>)}</div>;
  }
}
