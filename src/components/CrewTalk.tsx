import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { asset } from "../game/assets";
import { audio } from "../game/audio";
import { gameKey } from "../game/pressedKeys";
import { DRILL, PORTRAIT, lettersShown, missionTalkKey, type Speaker } from "../game/talk";
import { useMission } from "../state/mission";
import { JobMiniGame } from "./JobMiniGame";
import "./CrewTalk.css";
import { reducedMotion } from "../state/comfort";

const reduced = reducedMotion;

/** Arcade-style typewriter: letters appear one by one with a soft blip. A click or key shows the whole line at once. */
function useTyped(text: string, blip: string) {
  const [shown, setShown] = useState(() => (reduced() ? text.length : 0));
  // Set by finish(): the typing timer must stop, or its next tick would put the shorter text back.
  const skipped = useRef(false);
  useEffect(() => {
    skipped.current = false;
    if (reduced()) {
      setShown(text.length);
      return;
    }
    setShown(0);
    const start = performance.now();
    const id = setInterval(() => {
      if (skipped.current) {
        clearInterval(id);
        return;
      }
      const n = lettersShown(text, performance.now() - start);
      setShown(n);
      if (n % 3 === 1 && text[n - 1]?.trim()) audio.playSfx(blip, 60);
      if (n >= text.length) clearInterval(id);
    }, 25);
    return () => clearInterval(id);
  }, [text, blip]);
  return {
    shown: text.slice(0, shown),
    done: shown >= text.length,
    finish: () => {
      skipped.current = true;
      setShown(text.length);
    },
  };
}

type Step =
  | { kind: "text"; key: string; then: "menu" | "close" | "drill" | string }
  | { kind: "menu" }
  | { kind: "drill" };

/** A crew member's window: portrait, name plate, typed lines, an answer menu and their practice game. */
export function CrewTalk({
  speaker,
  onClose,
}: {
  speaker: Speaker;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const drill = DRILL[speaker];
  const campaign = useMission((m) => m.setup?.campaignId);
  const box = useRef<HTMLDialogElement>(null);
  const [step, setStep] = useState<Step>(
    drill
      ? { kind: "text", key: `talk.${speaker}.intro`, then: "menu" }
      : {
          kind: "text",
          key: `dialogue.${speaker}.hello`,
          then: `dialogue.${speaker}.advice`,
        },
  );
  useEffect(() => {
    const b = box.current;
    if (b && !b.open) b.showModal();
    return () => b?.close();
  }, []);
  const say = (key: string, then: string = "menu") =>
    setStep({ kind: "text", key, then });
  const blip = speaker === "drone" ? "robot-beep-2" : "menu-hover";
  return (
    <dialog
      ref={box}
      className={`npc-dialogue crew-talk${step.kind === "drill" ? " crew-talk--wide" : ""}`}
      aria-labelledby="crew-talk-name"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onKeyDown={(e) => {
        if (
          e.key.toLowerCase() === "e" &&
          document.activeElement instanceof HTMLButtonElement
        ) {
          e.preventDefault();
          document.activeElement.click();
        }
      }}
    >
      <div className="crew-talk__who">
        <img src={asset(PORTRAIT[speaker])} alt="" />
        <h2 id="crew-talk-name">{t(`world.near.${speaker}`)}</h2>
      </div>
      <div className="crew-talk__body">
        {step.kind === "text" && (
          <TypedLine
            key={step.key}
            text={t(step.key as never)}
            blip={blip}
            onNext={() => {
              audio.playSfx("dialogue");
              if (step.then === "close") onClose();
              else if (step.then === "menu") setStep({ kind: "menu" });
              else if (step.then === "drill") setStep({ kind: "drill" });
              else say(step.then, "close");
            }}
          />
        )}
        {step.kind === "menu" && (
          <AnswerMenu
            options={[
              // Practice first: playtesters went for it, and it is the same game as in the mission.
              [t("talk.ask.drill"), () => say(`talk.${speaker}.drillIntro`, "drill")],
              [t("talk.ask.mission"), () => say(missionTalkKey(speaker, campaign))],
              [t("talk.ask.who"), () => say(`talk.${speaker}.who`)],
              [t("talk.ask.bye"), onClose],
            ]}
            prompt={t("talk.choose")}
          />
        )}
        {step.kind === "drill" && drill && (
          // The real mission mini-game for this crew member's job, so practice is exactly what the mission asks.
          <JobMiniGame
            job={drill}
            seed={Date.now()}
            onClose={(won) => (won ? say(`talk.${speaker}.win`) : setStep({ kind: "menu" }))}
          />
        )}
      </div>
    </dialog>
  );
}

function TypedLine({
  text,
  blip,
  onNext,
}: {
  text: string;
  blip: string;
  onNext: () => void;
}) {
  const { t } = useTranslation();
  const { shown, done, finish } = useTyped(text, blip);
  return (
    <>
      {/* Screen readers get the whole line at once; the typing is visual only. */}
      <p
        className="lead crew-talk__line"
        aria-hidden="true"
        onClick={() => (done ? onNext() : finish())}
      >
        {shown}
        {!done && (
          <span className="crew-talk__ghost">{text.slice(shown.length)}</span>
        )}
      </p>
      <p className="visually-hidden" aria-live="polite">
        {text}
      </p>
      <button
        className="primary crew-talk__next"
        autoFocus
        onClick={() => (done ? onNext() : finish())}
      >
        {t("talk.next")}{" "}
        <span aria-hidden="true" className={done ? "crew-talk__caret" : ""}>
          ▼
        </span>
      </button>
    </>
  );
}

/** Answers like an old RPG menu: arrow keys or W A S D move the ▶ cursor, Enter, E or a tap picks. */
function AnswerMenu({
  options,
  prompt,
}: {
  options: [string, () => void][];
  prompt: string;
}) {
  const list = useRef<HTMLDivElement>(null);
  const move = (e: React.KeyboardEvent) => {
    const k = gameKey(e);
    const d = ["arrowdown", "arrowright", "s", "d"].includes(k) ? 1 : ["arrowup", "arrowleft", "w", "a"].includes(k) ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const buttons = [...list.current!.querySelectorAll("button")];
    const next =
      buttons[
        (buttons.indexOf(document.activeElement as HTMLButtonElement) +
          d +
          buttons.length) %
          buttons.length
      ];
    next.focus();
    audio.playSfx("menu-hover");
  };
  return (
    <div
      className="crew-talk__menu"
      role="group"
      aria-label={prompt}
      ref={list}
      onKeyDown={move}
    >
      <p className="eyebrow">{prompt}</p>
      {options.map(([label, pick], i) => (
        <button
          key={label}
          autoFocus={i === 0}
          onClick={() => {
            audio.playSfx("menu-select");
            pick();
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
