import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import "./WhatsThis.css";

export type HelpTopic = "sol" | "power" | "air" | "dose" | "food" | "dust" | "burst" | "stormCloud" | "askEarth";

/**
 * Small "?" button that opens a short kid explanation (#16). Text lives in en.json → help.<topic>.
 * Works with tap, mouse and keyboard: Enter/Space toggles, Escape closes and returns focus.
 * Usage: <h2>{t("bars.dose")} <WhatsThis topic="dose" /></h2>
 */
/** `placement="up"` always opens above the "?" (e.g. just above a footer); otherwise it flips up only when it would run off the bottom. */
export function WhatsThis({ topic, placement }: { topic: HelpTopic; placement?: "up" }) {
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

  // Keep the bubble inside the screen: it is centred on the "?", which can sit near an edge
  // on a phone. Measure once it opens and slide it back in (8 px margin).
  const bubble = useRef<HTMLSpanElement>(null);
  const [shift, setShift] = useState(0);
  // Near the bottom of the screen (the "sol" help on the start screen) it opens above the "?".
  const [up, setUp] = useState(false);
  useLayoutEffect(() => {
    if (!open || !bubble.current) { setUp(false); return setShift(0); }
    const r = bubble.current.getBoundingClientRect();
    if (r.bottom > window.innerHeight - 8 && r.top - r.height - 60 > 0) setUp(true);
    const vw = document.documentElement.clientWidth;
    if (r.left < 8) setShift(8 - r.left);
    else if (r.right > vw - 8) setShift(vw - 8 - r.right);
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
        <span
          id={id}
          ref={bubble}
          role="note"
          className={up || placement === "up" ? "whats-this__bubble whats-this__bubble--up" : "whats-this__bubble"}
          style={shift ? { transform: `translateX(calc(-50% + ${shift}px))` } : undefined}
        >
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
