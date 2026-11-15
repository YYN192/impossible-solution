import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { asset } from "../game/assets";
import { audio } from "../game/audio";
import {
  BLOCKS,
  CELLS,
  CREW,
  DRILL,
  GROW_STEPS,
  JOBS,
  MACHINES,
  PORTRAIT,
  SHELTER_SECONDS,
  growNeed,
  lettersShown,
  powerResult,
  toggleJob,
  type Drill,
  type Speaker,
} from "../game/talk";
import { Icon } from "./Icon";
import "./CrewTalk.css";

const reduced = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

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
  | { kind: "text"; key: string; then: "menu" | "close" | Drill | string }
  | { kind: "menu" }
  | { kind: "drill"; drill: Drill };

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
              else if (
                (["jobs", "power", "grow", "shelter"] as string[]).includes(
                  step.then,
                )
              )
                setStep({ kind: "drill", drill: step.then as Drill });
              else say(step.then, "close");
            }}
          />
        )}
        {step.kind === "menu" && (
          <AnswerMenu
            options={[
              [t("talk.ask.who"), () => say(`talk.${speaker}.who`)],
              [t("talk.ask.tip"), () => say(`talk.${speaker}.tip`)],
              [
                t("talk.ask.drill"),
                () => say(`talk.${speaker}.drillIntro`, drill),
              ],
              [t("talk.ask.bye"), onClose],
            ]}
            prompt={t("talk.choose")}
          />
        )}
        {step.kind === "drill" && (
          <div className="crew-drill">
            {step.drill === "jobs" && (
              <JobsDrill onWin={() => say(`talk.${speaker}.win`)} />
            )}
            {step.drill === "power" && (
              <PowerDrill onWin={() => say(`talk.${speaker}.win`)} />
            )}
            {step.drill === "grow" && (
              <GrowDrill onWin={() => say(`talk.${speaker}.win`)} />
            )}
            {step.drill === "shelter" && (
              <ShelterDrill
                onWin={() => say(`talk.${speaker}.win`)}
                onLate={() => say(`talk.${speaker}.late`)}
              />
            )}
            <button
              className="quiet-button"
              onClick={() => {
                audio.playSfx("menu-back");
                setStep({ kind: "menu" });
              }}
            >
              {t("drills.back")}
            </button>
          </div>
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

/** Answers like an old RPG menu: arrow keys move the ▶ cursor, Enter, E or a tap picks. */
function AnswerMenu({
  options,
  prompt,
}: {
  options: [string, () => void][];
  prompt: string;
}) {
  const list = useRef<HTMLDivElement>(null);
  const move = (e: React.KeyboardEvent) => {
    const d = e.key === "ArrowDown" ? 1 : e.key === "ArrowUp" ? -1 : 0;
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

function JobsDrill({ onWin }: { onWin: () => void }) {
  const { t } = useTranslation();
  const [picked, setPicked] = useState<string[]>([]);
  const waiting = JOBS.find((j) => !picked.includes(j));
  return (
    <>
      <h3>{t("drills.jobs.title")}</h3>
      <div className="crew-drill__grid">
        {JOBS.map((j) => (
          <button
            key={j}
            aria-pressed={picked.includes(j)}
            onClick={() => {
              audio.playSfx(picked.includes(j) ? "job-remove" : "job-assign");
              setPicked((p) => toggleJob(p, j));
            }}
          >
            <Icon
              name={
                {
                  panels: "wipe",
                  greenhouse: "sprout",
                  shelter: "shield",
                  science: "science",
                }[j]
              }
            />{" "}
            {t(`jobs.${j}`)}
            {picked.includes(j) && <Icon name="astronaut" />}
          </button>
        ))}
      </div>
      <p aria-live="polite">
        {picked.length < CREW
          ? t("drills.jobs.left", { count: CREW - picked.length })
          : t("drills.jobs.done", { job: t(`jobs.${waiting!}`) })}
      </p>
      <button
        className="primary"
        disabled={picked.length < CREW}
        onClick={() => {
          audio.playSfx("job-complete");
          onWin();
        }}
      >
        {t("drills.jobs.go")}
      </button>
    </>
  );
}

function PowerDrill({ onWin }: { onWin: () => void }) {
  const { t } = useTranslation();
  const [on, setOn] = useState<string[]>([]);
  const [tried, setTried] = useState(false);
  const result = powerResult(on);
  return (
    <>
      <h3>{t("drills.power.title")}</h3>
      <div className="crew-drill__grid">
        {MACHINES.map((m) => (
          <button
            key={m}
            aria-pressed={on.includes(m)}
            onClick={() => {
              setTried(false);
              if (on.includes(m)) {
                audio.playSfx("power-decrease");
                setOn(on.filter((x) => x !== m));
              } else if (on.length < CELLS) {
                audio.playSfx("power-increase");
                setOn([...on, m]);
              } else audio.playSfx("menu-error");
            }}
          >
            <Icon name={{ air: "air", lamp: "lamp", radio: "radio" }[m]} />{" "}
            {t(`drills.power.${m}`)}
            {on.includes(m) && <Icon name="power" />}
          </button>
        ))}
      </div>
      <p aria-live="polite">
        {tried && result === "noAir"
          ? t("drills.power.noAir")
          : t("drills.power.cells", { count: CELLS - on.length })}
      </p>
      <button
        className="primary"
        disabled={result === "more"}
        onClick={() => {
          if (result === "ok") {
            audio.playSfx("job-complete");
            onWin();
          } else {
            audio.playSfx("air-warning");
            setTried(true);
          }
        }}
      >
        {t("drills.power.go")}
      </button>
    </>
  );
}

function GrowDrill({ onWin }: { onWin: () => void }) {
  const { t } = useTranslation();
  const [stage, setStage] = useState(0);
  const [wrong, setWrong] = useState(false);
  const need = growNeed(stage),
    grown = stage >= GROW_STEPS;
  const give = (what: "water" | "light") => {
    if (what === need) {
      audio.playSfx("select");
      setStage(stage + 1);
      setWrong(false);
    } else {
      audio.playSfx("menu-error");
      setWrong(true);
    }
  };
  return (
    <>
      <h3>{t("drills.grow.title")}</h3>
      <div className="crew-drill__plant">
        <img src={asset(`minigame/plant-${stage}`)} alt="" />
        {!grown && (
          <span className="crew-drill__bubble">
            <Icon name={need === "water" ? "ice" : "lamp"} />
          </span>
        )}
      </div>
      <p aria-live="polite">
        {wrong
          ? t("drills.grow.wrong")
          : grown
            ? t("drills.grow.ready")
            : `${t("drills.grow.stage", { n: stage, total: GROW_STEPS })} · ${t(`drills.grow.needs.${need}`)}`}
      </p>
      {grown ? (
        <button
          className="primary"
          autoFocus
          onClick={() => {
            audio.playSfx("job-complete");
            onWin();
          }}
        >
          {t("drills.grow.harvest")}
        </button>
      ) : (
        <div className="crew-drill__grid">
          <button autoFocus onClick={() => give("water")}>
            <Icon name="ice" /> {t("drills.grow.water")}
          </button>
          <button onClick={() => give("light")}>
            <Icon name="lamp" /> {t("drills.grow.light")}
          </button>
        </div>
      )}
    </>
  );
}

function ShelterDrill({
  onWin,
  onLate,
}: {
  onWin: () => void;
  onLate: () => void;
}) {
  const { t } = useTranslation();
  const [blocks, setBlocks] = useState(0);
  const [left, setLeft] = useState(SHELTER_SECONDS);
  useEffect(() => {
    if (blocks >= BLOCKS) return;
    if (left <= 0) {
      audio.playSfx("radiation-increase");
      onLate();
      return;
    }
    const id = setTimeout(() => {
      setLeft(left - 1);
      if (left <= 4) audio.playSfx("machine-beep");
    }, 1000);
    return () => clearTimeout(id);
  }, [left, blocks, onLate]);
  const safe = blocks >= BLOCKS;
  return (
    <>
      <h3>{t("drills.shelter.title")}</h3>
      <p className="crew-drill__timer" aria-live="off">
        {safe
          ? t("drills.shelter.safe")
          : t("drills.shelter.time", { s: left })}
      </p>
      <div className="crew-drill__wall" aria-hidden="true">
        {Array.from({ length: BLOCKS }, (_, i) => (
          <img
            key={i}
            src={asset(i < blocks ? "minigame/block" : "minigame/block-slot")}
            alt=""
          />
        ))}
      </div>
      <p aria-live="polite">
        <Icon name="dose" /> {t("drills.shelter.dose")}:{" "}
        <meter
          min={0}
          max={BLOCKS}
          value={BLOCKS - blocks}
          aria-label={t("drills.shelter.dose")}
        />{" "}
        · {t("drills.shelter.left", { count: BLOCKS - blocks })}
      </p>
      {safe ? (
        <button className="primary" autoFocus onClick={onWin}>
          {t("drills.shelter.done")}
        </button>
      ) : (
        <button
          className="primary"
          autoFocus
          onClick={() => {
            const n = blocks + 1;
            audio.playSfx(n >= BLOCKS ? "job-complete" : "job-assign");
            setBlocks(n);
          }}
        >
          <Icon name="shield" /> {t("drills.shelter.place")}
        </button>
      )}
    </>
  );
}
