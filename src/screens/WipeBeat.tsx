import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "../components/Icon";
import { asset } from "../game/assets";
import { audio } from "../game/audio";
import { tRun } from "../i18n/dynamic";
import { WIPE_PANELS, wipeChoice, type Beat } from "../sim/campaign";
import type { Action } from "../sim/types";

/**
 * #98 Hands-on wipe: the kid wipes the dusty panels one by one (tap, click, drag or Enter).
 * How many they wipe picks the beat's own option (none / half / all), so the engine and its
 * numbers stay the same; the space-ray dose of that option is shown as it rises.
 */
export function WipeBeat({
  beat,
  onDone,
}: {
  beat: Beat;
  onDone: (action: Action) => void;
}) {
  const { t } = useTranslation();
  const [clean, setClean] = useState<boolean[]>(() =>
    Array(WIPE_PANELS).fill(false),
  );
  const wiped = clean.filter(Boolean).length;
  const option = beat.options.find((o) => o.id === wipeChoice(wiped))!;
  const dose = option.action.effect?.dose ?? 0;
  const wipe = (i: number) => {
    if (clean[i]) return;
    audio.playSfx("select");
    setClean((c) => c.map((v, j) => v || j === i));
  };
  return (
    <div className="wipe-beat">
      <p className="note">
        {t("wipeUi.rule", { half: WIPE_PANELS / 2, all: WIPE_PANELS })}
      </p>
      <div className="storm-panels">
        {clean.map((c, i) => (
          <button
            key={i}
            type="button"
            className={c ? "clean" : "dusty"}
            aria-pressed={c}
            aria-label={t("hubStorm.panel", {
              n: i + 1,
              state: t(c ? "hubStorm.clean" : "hubStorm.dusty"),
            })}
            onClick={() => wipe(i)}
            onPointerEnter={(e) => {
              if (e.buttons) wipe(i);
            }}
          >
            <img
              src={asset(c ? "campaign/panel-clean" : "campaign/panel-dusty")}
              alt=""
            />
          </button>
        ))}
      </div>
      <p className="wipe-dose" aria-live="polite">
        <Icon name="dose" /> {t("wipeUi.dose", { n: dose })}
        <span className="explore-pips" aria-hidden="true">
          {clean.map((c, i) => (
            <i key={i} data-on={c ? "" : undefined} />
          ))}
        </span>
      </p>
      <p className="storm-left" aria-live="polite">
        {t("wipeUi.now", {
          choice: tRun(`beat.${beat.id}.${option.id}.label`),
        })}
      </p>
      <div className="actions">
        <button
          type="button"
          className="primary"
          onClick={() => onDone(option.action)}
        >
          {t("hubStorm.backInside")}
        </button>
      </div>
    </div>
  );
}
