import { Icon } from "../components/Icon";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { asset } from "../game/assets";
import { audio } from "../game/audio";
import { mistake, shake } from "../game/feedback";
import { EXPLORE, drivePower, driveAction, isHome, move, ranOutOfPower, farSamples, roverChoice, startDrive, type ExploreMap } from "../sim/explore";
import type { Beat } from "../sim/campaign";
import { tRun } from "../i18n/dynamic";
import type { Action } from "../sim/types";
import { gameKey, usePressedKeys } from "../game/pressedKeys";

const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] } as const;
type Dir = keyof typeof DIRS;
const KEYS: Record<string, Dir> = { arrowup: "up", arrowdown: "down", arrowleft: "left", arrowright: "right", w: "up", s: "down", a: "left", d: "right" };

// Same keys, lower-cased, so the pad lights up while a key is held (Caps Lock included).
const HINT_KEYS = Object.fromEntries(Object.entries(KEYS).map(([k, d]) => [k.toLowerCase(), d]));

/**
 * Rover drive: the kid steers the rover over a map whose colours come from a real NASA picture.
 * Arrow keys, WASD, the four buttons or a tap on a neighbouring square all work. The whole drive
 * is handed to the engine as one action when it ends (see sim/explore.ts).
 * With `beat` (Dust Season, #98) the drive picks one of that beat's own options instead (`roverChoice`).
 */
export function ExploreBeat({ map, beat, onDone }: { map: ExploreMap; beat?: Beat; onDone: (action: Action) => void }) {
  const { t } = useTranslation();
  const [drive, setDrive] = useState(() => startDrive(map));
  const [facing, setFacing] = useState<Dir>("right");
  const box = useRef<HTMLDivElement>(null);
  const home = isHome(map, drive);
  const pressed = usePressedKeys(HINT_KEYS);
  const choice = beat && roverChoice(map, drive);
  const far = beat ? farSamples(map) : [];
  const option = beat?.options.find((o) => o.id === choice);

  function go(dir: Dir) {
    const [dx, dy] = DIRS[dir];
    setFacing(dir);
    const next = move(map, drive, dx, dy);
    if (next === drive) return mistake("small", box.current); // rock, edge or no power
    audio.playSfx(next.collected.length > drive.collected.length ? "assign" : "select");
    if (ranOutOfPower(map, drive, next)) {
      audio.playSfx("rover-power-down");
      shake(box.current);
    }
    setDrive(next);
  }

  return (
    <div ref={box} className="explore">
      <div
        className="explore-map"
        role="application"
        tabIndex={0}
        aria-label={t("exploreUi.map")}
        style={{ gridTemplateColumns: `repeat(${map.cols}, 1fr)` }}
        onKeyDown={(e) => {
          const dir = KEYS[gameKey(e)];
          if (!dir) return;
          e.preventDefault();
          go(dir);
        }}
      >
        {drive.battery === 0 && !home && <p className="explore-nopower" role="alert">{t("exploreUi.noPower")}</p>}
        {map.cells.map((cell, i) => {
          const x = i % map.cols, y = Math.floor(i / map.cols);
          const sample = map.samples.findIndex((s) => s.x === x && s.y === y);
          const here = drive.x === x && drive.y === y;
          const base = map.base.x === x && map.base.y === y;
          const near = Math.abs(drive.x - x) + Math.abs(drive.y - y) === 1;
          const dir = (Object.keys(DIRS) as Dir[]).find((d) => drive.x + DIRS[d][0] === x && drive.y + DIRS[d][1] === y);
          return (
            <div
              key={i}
              className="explore-cell"
              data-terrain={cell.terrain}
              data-sample={sample >= 0 && !drive.collected.includes(sample) ? "" : undefined}
              data-far={far.includes(sample) && !drive.collected.includes(sample) ? "" : undefined}
              data-near={near && cell.terrain !== "rock" ? "" : undefined}
              style={{ backgroundColor: cell.color }}
              onClick={dir ? () => go(dir) : undefined}
            >
              {cell.terrain === "rock" && <img src={asset("campaign/map-rock")} alt="" />}
              {base && <img src={asset("campaign/map-base")} alt="" />}
              {sample >= 0 && !drive.collected.includes(sample) && <img src={asset("campaign/map-sample")} alt="" />}
              {here && <img className="explore-rover" src={asset(`campaign/rover-${facing}`)} alt="" />}
            </div>
          );
        })}
      </div>
      <div className="explore-side">
        <p className="explore-battery" role="status">
          <Icon name="battery" />{" "}
          {t("exploreUi.battery", { n: drive.battery, max: map.battery })}
          <span className="explore-pips" aria-hidden="true">
            {Array.from({ length: map.battery }, (_, i) => <i key={i} data-on={i < drive.battery ? "" : undefined} />)}
          </span>
        </p>
        <p><Icon name="rock" />{" "}{t("exploreUi.samples", { n: drive.collected.length })}</p>
        {beat ? (
          option && <p className="explore-cost" aria-live="polite">{t("exploreUi.pick", { choice: tRun(`beat.${beat.id}.${option.id}.label`) })}</p>
        ) : (
          <>
            <p className="explore-cost">{t("exploreUi.cost", { n: drivePower(map, drive) })}</p>
            {/* #66: the crew cost shows before the second sample is picked up, not only after. */}
            {drive.collected.length > 0 && <p className="explore-cost" aria-live="polite"><Icon name="tired" />{" "}
              {t(drive.collected.length < EXPLORE.maxScience ? "exploreUi.tiredNext" : "exploreUi.tiredNow")}</p>}
          </>
        )}
        {drive.collected.length >= EXPLORE.maxScience && <p className="note">{t("exploreUi.labLimit", { max: EXPLORE.maxScience })}</p>}
        <p className={home ? "explore-home" : "explore-away"} role="status">
          {drive.battery === 0 && !home ? t("exploreUi.empty") + " " : ""}
          {home ? t("exploreUi.home") : t("exploreUi.away")}
        </p>
        <div className="explore-pad">
          {(["up", "left", "right", "down"] as Dir[]).map((dir) => (
            <button type="button" key={dir} data-dir={dir} data-pressed={pressed.has(dir) ? "" : undefined} aria-label={t(`exploreUi.${dir}`)} onClick={() => go(dir)}>
              {{ up: "▲", down: "▼", left: "◀", right: "▶" }[dir]}
            </button>
          ))}
        </div>
        <button type="button" className="primary" onClick={() => onDone(option?.action ?? driveAction(map, drive))}>{t("exploreUi.finish")}</button>
        <p className="note">{beat && `${t("exploreUi.rocksRule")} `}{t("exploreUi.legend")} {t("exploreUi.square")}</p>
      </div>
    </div>
  );
}
