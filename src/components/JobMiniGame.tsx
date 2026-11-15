import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { asset } from "../game/assets";
import { audio } from "../game/audio";
import {
  DISH_STEPS, GROW_TARGET, WATER_MAX, STACK_CENTER, STACK_GOAL, TICK_MS,
  drop, progress, send, startMiniGame, tap, tick, turn, won, type MiniGame,
} from "../game/miniGames";
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
  const [game, setGame] = useState<MiniGame>(() => startMiniGame(job, seed));
  const box = useRef<HTMLDialogElement>(null);
  const done = won(game);
  useEffect(() => { const b = box.current; if (b && !b.open) b.showModal(); return () => b?.close?.(); }, []);
  useEffect(() => {
    if (done) { audio.playSfx("job-complete"); return; }
    const clock = setInterval(() => setGame((g) => tick(g)), TICK_MS);
    return () => clearInterval(clock);
  }, [done]);
  const play = (nextGame: MiniGame, sound = "console-button") => {
    if (nextGame === game) return;
    const missed = "miss" in nextGame && nextGame.miss;
    audio.playSfx(missed ? "menu-error" : sound);
    setGame(nextGame);
  };
  const { done: count, total } = progress(game);
  const title = `minigame-${job}-title`;
  return <dialog ref={box} className={`npc-dialogue mini-game mini-${job}`} aria-labelledby={title}
    onCancel={(e) => { e.preventDefault(); onClose(done); }}>
    <div>
      <p className="eyebrow">{t("miniGame.eyebrow")} · <span>{t(`jobs.${job}`)}</span></p>
      <h2 id={title}>{t(`miniGame.${job}.title`)}</h2>
      <p className="lead">{t(`miniGame.${job}.lead`)}</p>
      <div className="mini-board"><Board game={game} play={play} /></div>
      <div className="mini-meter" aria-hidden="true">{Array.from({ length: total }, (_, i) => <span key={i} className={i < count ? "on" : ""} />)}</div>
      <p aria-live="polite" className="storm-left">
        {done ? <strong className="mini-won"><img className="pixel" src={asset("minigame/sparkle")} alt="" /><span>{t("miniGame.won")}</span></strong> : <Hint game={game} />}
        {!done && <span className="mini-count"> {t("miniGame.progress", { done: count, total })}</span>}
      </p>
      <div className="actions">
        {done
          ? <button type="button" className="primary" autoFocus onClick={() => onClose(true)}>{t("miniGame.finish")} <span aria-hidden="true">→</span></button>
          : <button type="button" onClick={() => onClose(false)}>{t("miniGame.skip")}</button>}
      </div>
    </div>
  </dialog>;
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

function Board({ game, play }: { game: MiniGame; play: (g: MiniGame, sound?: string) => void }) {
  const { t } = useTranslation();
  const row = (fill: (i: number) => React.ReactNode, className = "") =>
    <div className={`mini-row ${className}`} aria-hidden="true">{Array.from({ length: DISH_STEPS }, (_, i) => <span key={i}>{fill(i)}</span>)}</div>;
  switch (game.job) {
    case "panels":
      return <div className="mini-grid panels">{game.clean.map((c, i) =>
        <button key={i} type="button" autoFocus={i === 0} className={`mini-tile ${c ? "clean" : "dusty"}`} aria-pressed={c}
          aria-label={t("miniGame.panels.panel", { n: i + 1, state: t(c ? "miniGame.panels.clean" : "miniGame.panels.dusty") })}
          onClick={() => play(tap(game, i))} onPointerEnter={(e) => { if (e.buttons) play(tap(game, i)); }}>
          <Sprite name={c ? "campaign/panel-clean" : "campaign/panel-dusty"} className="big" />
        </button>)}</div>;
    case "greenhouse":
      return <div className="mini-grid">{game.growth.map((g, i) => {
        const w = game.water[i];
        const state = g >= GROW_TARGET ? "grown" : w > 0 ? "watered" : "thirsty";
        return <button key={i} type="button" autoFocus={i === 0} className={`mini-tile plant ${state}`} aria-pressed={g >= GROW_TARGET}
          aria-label={t("miniGame.greenhouse.plant", { n: i + 1, state: t(`miniGame.greenhouse.${state}`) })}
          onClick={() => play(tap(game, i))}>
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
          <button type="button" className="primary" autoFocus onClick={() => play(drop(game), "job-assign")}>{t("miniGame.shelter.drop")}</button>
        </div>
      </>;
    case "askEarth": {
      const aimed = game.aim === game.earth;
      return <>
        {row((i) => <Sprite name={i === game.earth ? "minigame/earth" : "minigame/star"} className={i === game.earth ? "big earth" : "star"} />, "mini-sky")}
        {row((i) => i === game.aim ? <Sprite name="minigame/dish" className={`big dish-here ${aimed ? "aimed" : ""}`} /> : null, "mini-sky dish")}
        <div className="mini-dish-controls">
          <button type="button" autoFocus disabled={game.aim === 0} onClick={() => play(turn(game, -1))}><span aria-hidden="true">←</span> {t("miniGame.askEarth.left")}</button>
          <button type="button" className="primary" disabled={!aimed} onClick={() => play(send(game), "earth-message-send")}>{t("miniGame.askEarth.send")}</button>
          <button type="button" disabled={game.aim === DISH_STEPS - 1} onClick={() => play(turn(game, 1))}>{t("miniGame.askEarth.right")} <span aria-hidden="true">→</span></button>
        </div>
      </>;
    }
    case "science":
      return <div className="mini-grid rocks">{game.cells.map((c, i) =>
        <button key={i} type="button" autoFocus={i === 0} className={`mini-tile hole ${c ?? "empty"}`}
          aria-label={t("miniGame.science.rock", { n: i + 1, state: t(`miniGame.science.${c ?? "empty"}`) })}
          onClick={() => play(tap(game, i), "science-discovery")}>
          {c && <Sprite name={c === "shiny" ? SHINY_ART[i % SHINY_ART.length] : "minigame/rock-plain"} className="rock" />}
          {c === "shiny" && <Sprite name="minigame/sparkle" className="glint" />}
          <Sprite name="minigame/hole" className="wide ground" />
        </button>)}</div>;
  }
}
