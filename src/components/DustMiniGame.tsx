import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { asset } from "../game/assets";
import { audio } from "../game/audio";
import { useGameClock } from "../game/useGameClock";
import { DUST_JOBS, dustProgress, dustTap, dustTick, dustWon, startDustGame, type DustGame } from "../game/dustMiniGames";
import { gameKey } from "../game/pressedKeys";

const Sprite = ({ name, className = "" }: { name: string; className?: string }) =>
  <img className={`pixel ${className}`} src={asset(name)} alt="" draggable={false} />;

/**
 * Dust Season's own mini game for the panels and the greenhouse (src/game/dustMiniGames.ts),
 * in the same dialog and pixel look as JobMiniGame. Skip keeps the job in the plan.
 */
export function DustMiniGame({ job, seed, onClose }: { job: (typeof DUST_JOBS)[number]; seed: number; onClose: (won: boolean) => void }) {
  const { t } = useTranslation();
  const [game, setGame] = useState<DustGame>(() => startDustGame(job, seed));
  const box = useRef<HTMLDialogElement>(null);
  const done = dustWon(game);
  useEffect(() => { const b = box.current; if (b && !b.open) b.showModal(); return () => b?.close?.(); }, []);
  // Music only: the mini-game theme comes at the next song end (game/audio.ts); the game itself is unchanged.
  useEffect(() => audio.miniGameOpened(), []);
  const { started, paused, togglePause, go } = useGameClock(done, () => setGame((g) => dustTick(g)));
  useEffect(() => { if (done) audio.playSfx("job-complete"); }, [done]);
  const play = (next: DustGame) => {
    go();
    if (next === game) return;
    const tooEarly = next.job === "panels" && next.early;
    audio.playSfx(tooEarly ? "menu-error" : "console-button");
    setGame(next);
  };
  const onKey = (e: React.KeyboardEvent<HTMLDialogElement>) => {
    const k = gameKey(e.nativeEvent);
    const tile = (e.target as HTMLElement).closest?.(".mini-tile");
    const step = { arrowleft: -1, arrowright: 1, arrowup: -3, arrowdown: 3 }[k as "arrowleft"];
    if (done || !tile || !step) return;
    e.preventDefault();
    const tiles = [...tile.parentElement!.querySelectorAll<HTMLElement>(".mini-tile")];
    tiles[tiles.indexOf(tile as HTMLElement) + step]?.focus();
  };
  const { done: count, total } = dustProgress(game);
  const title = `dust-minigame-${job}-title`;
  return <dialog ref={box} className={`npc-dialogue mini-game mini-dust dust-${job}`} aria-labelledby={title}
    onCancel={(e) => { e.preventDefault(); onClose(done); }} onKeyDown={onKey}>
    <div>
      <p className="eyebrow">{t("miniGame.dust.eyebrow")} · <span>{t(`jobs.${job}`)}</span></p>
      <h2 id={title}>{t(`miniGame.dust.${job}.title`)}</h2>
      <p className="lead">{t(`miniGame.dust.${job}.lead`)}</p>
      <div className="mini-board">
        {game.job === "panels"
          ? <div className="mini-row dust-panels">{game.clean.map((c, i) =>
            <button key={i} type="button" autoFocus={i === 0} className={`mini-tile ${c ? "clean" : "dusty"} ${i === game.gust ? "gust-here" : ""}`} aria-pressed={c}
              aria-label={t("miniGame.dust.panels.panel", { n: i + 1, state: t(c ? "miniGame.dust.panels.clean" : "miniGame.dust.panels.dusty") })}
              onClick={() => play(dustTap(game, i))}>
              <span className="dust-gust-slot">{i === game.gust && <Sprite name="minigame/dust-gust" className="dust-gust" />}</span>
              <Sprite name={c ? "campaign/panel-clean" : "campaign/panel-dusty"} />
            </button>)}</div>
          : <div className="mini-grid">{game.cracks.map((c, i) =>
            <button key={i} type="button" autoFocus={i === 0} className={`mini-tile ${c ? "cracked" : "whole"}`}
              aria-label={t("miniGame.dust.greenhouse.pane", { n: i + 1, state: t(c ? "miniGame.dust.greenhouse.cracked" : "miniGame.dust.greenhouse.whole") })}
              onClick={() => play(dustTap(game, i))}>
              <Sprite name={c ? "minigame/dust-crack" : "minigame/dust-pane"} className="big" />
            </button>)}</div>}
      </div>
      <p className="note mini-fact"><Sprite name="icons/dust-storm" /> <span>{t(`miniGame.dust.${job}.fact`)}</span></p>
      <p className="note mini-keys">{t(`miniGame.dust.keys.${job}`)}</p>
      <div className="mini-meter" aria-hidden="true">{Array.from({ length: total }, (_, i) => <span key={i} className={i < count ? "on" : ""} />)}</div>
      <p aria-live="polite" className="storm-left">
        {done
          ? <strong className="mini-won"><img className="pixel" src={asset("minigame/sparkle")} alt="" /><span>{t("miniGame.won")}</span></strong>
          : !started ? <span>{t("miniGame.start")}</span> : paused ? <span>{t("miniGame.paused")}</span>
          : game.job === "panels" && game.early ? <span>{t("miniGame.dust.panels.early")}</span> : null}
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
