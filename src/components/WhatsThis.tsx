import { useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import "./WhatsThis.css";

export type HelpTopic = "sol" | "power" | "air" | "dose" | "food" | "dust" | "burst" | "stormCloud" | "askEarth";

/**
 * Small "?" button that opens a short kid explanation (#16). Text lives in en.json → help.<topic>.
 * Works with tap, mouse and keyboard: Enter/Space toggles, Escape closes and returns focus.
 * Usage: <h2>{t("bars.dose")} <WhatsThis topic="dose" /></h2>
 */
export function WhatsThis({ topic }: { topic: HelpTopic }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const id = useId();
  const button = useRef<HTMLButtonElement>(null);
  const root = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
    };
    const onPointer = (e: PointerEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  const title = t(`help.${topic}.title`);
  return (
    <span className="whats-this" ref={root}>
      <button
        ref={button}
        type="button"
        className="whats-this__button"
        aria-expanded={open}
        aria-controls={id}
        aria-label={`${t("help.whatsThis")} ${title}`}
        onClick={() => setOpen((o) => !o)}
      >
        ?
      </button>
      {open ? (
        <span id={id} role="note" className="whats-this__bubble">
          <strong>{title}</strong> {t(`help.${topic}.text`)}{" "}
          <button
            type="button"
            className="whats-this__close"
            onClick={() => {
              setOpen(false);
              button.current?.focus();
            }}
          >
            {t("help.close")}
          </button>
        </span>
      ) : null}
    </span>
  );
}
