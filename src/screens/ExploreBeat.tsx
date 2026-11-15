import { Icon } from "../components/Icon";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { asset } from "../game/assets";
import { audio } from "../game/audio";
import { driveAction, isHome, move, startDrive, type ExploreMap } from "../sim/explore";
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
 */
export function ExploreBeat({ map, onDone }: { map: ExploreMap; onDone: (action: Action) => void }) {
  const { t } = useTranslation();
  const [drive, setDrive] = useState(() => startDrive(map));
  const [facing, setFacing] = useState<Dir>("right");
  const home = isHome(map, drive);
  const pressed = usePressedKeys(HINT_KEYS);

  function go(dir: Dir) {
    const [dx, dy] = DIRS[dir];
    setFacing(dir);
    const next = move(map, drive, dx, dy);
    if (next === drive) return audio.playSfx("job-remove");
    audio.playSfx(next.collected.length > drive.collected.length ? "assign" : "select");
    setDrive(next);
  }

  return (
    <div className="explore">
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
        <button type="button" className="primary" onClick={() => onDone(driveAction(map, drive))}>{t("exploreUi.finish")}</button>
        <p className="note">{t("exploreUi.legend")} {t("exploreUi.square")}</p>
      </div>
    </div>
  );
}
