import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { asset } from "../game/assets";
import { audio } from "../game/audio";
import { TICK_MS } from "../game/miniGames";
import {
  COLUMNS, ICE_SOLID, PILE_MAX, SUN_STEPS, TRAVEL,
  moonPour, moonProgress, moonRead, moonSend, moonTap, moonTick, moonTurn, moonWon, startMoonGame, type MoonGame,
} from "../game/moonMiniGames";
import { gameKey } from "../game/pressedKeys";
import type { JobId } from "../sim/types";

const Sprite = ({ name, className = "" }: { name: string; className?: string }) =>
  <img className={`pixel ${className}`} src={asset(name)} alt="" draggable={false} />;

/**
 * The Moon's own mini game for a job (src/game/moonMiniGames.ts), in the same dialog and pixel look
 * as JobMiniGame. Each one shows a real Moon fact. Just for fun: Skip keeps the job in the plan.
 */
export function MoonMiniGame({ job, seed, onClose }: { job: JobId; seed: number; onClose: (won: boolean) => void }) {
  const { t } = useTranslation();
  const [game, setGame] = useState<MoonGame>(() => startMoonGame(job, seed));
  const box = useRef<HTMLDialogElement>(null);
  const done = moonWon(game);
  useEffect(() => { const b = box.current; if (b && !b.open) b.showModal(); return () => b?.close?.(); }, []);
  useEffect(() => {
    if (done) { audio.playSfx("job-complete"); return; }
    const clock = setInterval(() => setGame((g) => moonTick(g)), TICK_MS);
    return () => clearInterval(clock);
  }, [done]);
  const play = (next: MoonGame, sound = "console-button") => {
    if (next === game) return;
    const oops = ("full" in next && next.full) || ("dark" in next && next.dark);
    audio.playSfx(oops ? "menu-error" : sound);
    setGame(next);
  };
  const onKey = (e: React.KeyboardEvent<HTMLDialogElement>) => {
    if (done) return;
    const k = gameKey(e.nativeEvent);
    const onButton = e.target instanceof HTMLButtonElement;
    if (game.job === "panels") {
      const by = k === "arrowleft" || k === "a" ? -1 : k === "arrowright" || k === "d" ? 1 : 0;
      if (by) { e.preventDefault(); play(moonTurn(game, by)); }
      return;
    }
    if (game.job === "shelter" && (k === " " || k === "enter") && !onButton) { e.preventDefault(); play(moonPour(game), "job-assign"); return; }
    if (game.job === "askEarth" && (k === " " || k === "enter") && !onButton) {
      e.preventDefault();
      play(game.phase === "arrived" ? moonRead(game) : moonSend(game), "earth-message-send");
      return;
    }
    // Grid games: arrows move focus between the tiles.
    const tile = (e.target as HTMLElement).closest?.(".mini-tile");
    const step = { arrowleft: -1, arrowright: 1, arrowup: -3, arrowdown: 3 }[k as "arrowleft"];
    if (tile && step) {
      e.preventDefault();
      const tiles = [...tile.parentElement!.querySelectorAll<HTMLElement>(".mini-tile")];
      tiles[tiles.indexOf(tile as HTMLElement) + step]?.focus();
    }
  };
  const { done: count, total } = moonProgress(game);
  const title = `moon-minigame-${job}-title`;
  return <dialog ref={box} className={`npc-dialogue mini-game mini-moon moon-${job}`} aria-labelledby={title}
    onCancel={(e) => { e.preventDefault(); onClose(done); }} onKeyDown={onKey}>
    <div>
      <p className="eyebrow">{t("miniGame.moon.eyebrow")} · <span>{t(`jobs.${job}`)}</span></p>
      <h2 id={title}>{t(`miniGame.moon.${job}.title`)}</h2>
      <p className="lead">{t(`miniGame.moon.${job}.lead`)}</p>
      <div className="mini-board"><Board game={game} play={play} /></div>
      <p className="note mini-fact"><Sprite name="icons/moon" /> <span>{t(`miniGame.moon.${job}.fact`)}</span></p>
      <p className="note mini-keys">{t(`miniGame.moon.keys.${job}`)}</p>
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

function Hint({ game }: { game: MoonGame }) {
  const { t } = useTranslation();
  switch (game.job) {
    case "panels":
      return <span className={game.aim === game.sun ? "mini-now" : ""}>{t(game.aim === game.sun ? "miniGame.moon.panels.facing" : "miniGame.moon.panels.away")}</span>;
    case "shelter":
      return <span>{t(game.full ? "miniGame.moon.shelter.full" : "miniGame.moon.shelter.low")}</span>;
    case "askEarth":
      return <span className={game.phase === "arrived" ? "mini-now" : ""}>{t(`miniGame.moon.askEarth.${game.phase}`)}</span>;
    case "science":
      return game.dark ? <span>{t("miniGame.moon.science.oops")}</span> : null;
    default:
      return null;
  }
}

function Board({ game, play }: { game: MoonGame; play: (g: MoonGame, sound?: string) => void }) {
  const { t } = useTranslation();
  const row = (size: number, fill: (i: number) => React.ReactNode, className = "") =>
    <div className={`mini-row ${className}`} aria-hidden="true">{Array.from({ length: size }, (_, i) => <span key={i}>{fill(i)}</span>)}</div>;
  switch (game.job) {
    case "panels": {
      const facing = game.aim === game.sun;
      return <>
        {row(SUN_STEPS, (i) => i === game.sun ? <Sprite name="minigame/moon-sun" className="big moon-sun" /> : <Sprite name="minigame/star" className="star" />, "mini-sky moon-sky")}
        {row(SUN_STEPS, (i) => i === game.aim ? <Sprite name="campaign/panel-clean" className={`big panel-here ${facing ? "aimed" : ""}`} /> : null, "mini-sky dish moon-ground")}
        <div className="mini-dish-controls">
          <button type="button" autoFocus disabled={game.aim === 0} onClick={() => play(moonTurn(game, -1))}><span aria-hidden="true">←</span> {t("miniGame.moon.panels.left")}</button>
          <button type="button" disabled={game.aim === SUN_STEPS - 1} onClick={() => play(moonTurn(game, 1))}>{t("miniGame.moon.panels.right")} <span aria-hidden="true">→</span></button>
        </div>
      </>;
    }
    case "greenhouse":
      return <div className="mini-grid">{game.ice.map((ice, i) => {
        const state = ice === 0 ? "water" : ice === ICE_SOLID ? "frozen" : "melting";
        return <button key={i} type="button" autoFocus={i === 0} className={`mini-tile ice ${state}`} aria-pressed={ice === 0}
          aria-label={t("miniGame.moon.greenhouse.block", { n: i + 1, state: t(`miniGame.moon.greenhouse.${state}`) })}
          onClick={() => play(moonTap(game, i))}>
          <Sprite name={ice === 0 ? "minigame/moon-water" : `minigame/moon-ice-${ice}`} className="big" />
          {ice === 0 && <span className="mini-drops"><Sprite name="minigame/check" /></span>}
        </button>;
      })}</div>;
    case "shelter":
      return <>
        {row(COLUMNS, (i) => i === game.scoop ? <Sprite name="minigame/moon-scoop" className="wide" /> : null, "slider")}
        <div className="mini-row moon-piles" aria-hidden="true">{game.piles.map((p, i) =>
          <span key={i} className="moon-pile">{Array.from({ length: PILE_MAX }, (_, j) =>
            <Sprite key={j} name={j < p ? "minigame/moon-dirt" : "minigame/block-slot"} className="wide" />).reverse()}</span>)}</div>
        <div className="mini-dish-controls">
          <button type="button" className="primary" autoFocus onClick={() => play(moonPour(game), "job-assign")}>{t("miniGame.moon.shelter.pour")}</button>
        </div>
      </>;
    case "askEarth": {
      // The message climbs from the base to Earth (TRAVEL steps), then the answer comes back down.
      const slot = game.phase === "up" ? game.pos : game.phase === "down" ? game.pos - 1 : -1;
      return <>
        <div className="moon-echo" aria-hidden="true">
          <Sprite name="minigame/earth" className="big earth" />
          <div className="moon-path">{Array.from({ length: TRAVEL }, (_, n) => TRAVEL - 1 - n).map((i) =>
            <span key={i}>{i === slot
              ? <Sprite name={game.phase === "up" ? "minigame/moon-signal" : "minigame/moon-reply"} className={game.phase === "down" ? "coming" : ""} />
              : <Sprite name="minigame/star" className="star" />}</span>)}</div>
          <Sprite name="minigame/dish" className={`big dish-here ${game.phase === "arrived" ? "aimed" : ""}`} />
          {game.phase === "arrived" && <Sprite name="minigame/moon-reply" className="moon-letter" />}
        </div>
        <div className="mini-dish-controls">
          <button type="button" autoFocus disabled={game.phase !== "ready"} onClick={() => play(moonSend(game), "earth-message-send")}>{t("miniGame.moon.askEarth.send")}</button>
          <button type="button" className="primary" disabled={game.phase !== "arrived"} onClick={() => play(moonRead(game), "job-complete")}>{t("miniGame.moon.askEarth.read")}</button>
        </div>
      </>;
    }
    case "science":
      return <div className="mini-grid rocks moon-crater">{game.ice.map((ice, i) => {
        const lit = i === game.lamp;
        const state = !lit ? "dark" : ice ? "ice" : "empty";
        return <button key={i} type="button" autoFocus={i === 0} className={`mini-tile hole ${lit ? "lit" : "dark"}`}
          aria-label={t("miniGame.moon.science.hole", { n: i + 1, state: t(`miniGame.moon.science.${state}`) })}
          onClick={() => play(moonTap(game, i), "science-discovery")}>
          {lit && <Sprite name="minigame/moon-lamp" className="moon-beam" />}
          {lit && ice && <Sprite name="minigame/moon-ice" className="rock" />}
          {lit && ice && <Sprite name="minigame/sparkle" className="glint" />}
          <Sprite name="minigame/moon-crater" className="wide ground" />
        </button>;
      })}</div>;
  }
}
