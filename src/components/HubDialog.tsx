import { useEffect, useRef, type ReactNode } from "react";
import { gameKey } from "../game/pressedKeys";

/**
 * A panel opened from a station object (airlock map, radar): a modal <dialog> with a × button.
 * Closes with Esc, the × (mouse and touch) and the interact key E, wherever focus is
 * (a tap on the backdrop can leave focus outside the dialog). Held-down E repeats are ignored,
 * and the E press that opened it was already handled before this listener exists.
 */
export default function HubDialog({ id, eyebrow, title, closeLabel, className = "", onClose, children }: {
  id: string; eyebrow: string; title: string; closeLabel: string; className?: string; onClose: () => void; children: ReactNode;
}) {
  const box = useRef<HTMLDialogElement>(null);
  useEffect(() => { const b = box.current; if (b && !b.open) b.showModal(); return () => b?.close(); }, []);
  // Attached once, reading the latest onClose through a ref: the hub re-renders in the middle of a real E press
  // (the key hint lights up), and a listener swapped out mid-event is skipped by the browser, so E did nothing.
  const close = useRef(onClose);
  useEffect(() => { close.current = onClose; });
  useEffect(() => {
    // gameKey: the physical key, so E works on Bulgarian layouts, with Caps Lock and with Shift (#53).
    const key = (e: KeyboardEvent) => { if (gameKey(e) === "e" && !e.repeat) { e.preventDefault(); close.current(); } };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  return <dialog ref={box} className={`npc-dialogue hub-dialog ${className}`} aria-labelledby={`${id}-title`}
    onCancel={(e) => { e.preventDefault(); onClose(); }}>
    <div>
      <div className="hub-dialog-top">
        <div><p className="eyebrow">{eyebrow}</p><h2 id={`${id}-title`}>{title}</h2></div>
        <button type="button" className="hub-dialog-x" aria-label={closeLabel} autoFocus onClick={onClose}>×</button>
      </div>
      {children}
    </div>
  </dialog>;
}
