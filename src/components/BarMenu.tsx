import { useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { audio } from "../game/audio";
import "./BarMenu.css";

/**
 * The top bar's extra buttons (sound, full screen, sources, teachers). On wide screens they sit in the bar as
 * before; on phones they fold into one "More" button so the game itself starts near the top of the screen (#75).
 * The panel closes on Escape, on a tap outside, and after a link button opens its page.
 */
export function BarMenu({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      box.current?.querySelector<HTMLButtonElement>(".bar-more")?.focus();
    };
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("pointerdown", away); document.removeEventListener("keydown", esc); };
  }, [open]);
  return (
    <div className="bar-menu" ref={box}>
      <button
        type="button"
        className="bar-more"
        aria-expanded={open}
        aria-controls="bar-tools"
        aria-label={t("app.more")}
        onClick={() => { audio.playSfx(open ? "menu-back" : "menu-open"); setOpen(!open); }}
      >
        <span className="bar-more__lines" aria-hidden="true"><i /><i /><i /></span>
        <span className="bar-more__text">{t("app.more")}</span>
      </button>
      <div
        className="bar-tools"
        id="bar-tools"
        data-open={open || undefined}
        onClick={(e) => { if ((e.target as Element).closest("nav button")) setOpen(false); }}
      >
        {children}
      </div>
    </div>
  );
}
