import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { GUIDE_STEPS, guideAfter, guideStep, startGuide, type GuideCtx, type StepId } from "../game/guide";
import { useGuide } from "../state/guide";
import { useNav } from "../state/screen";
import { Icon } from "./Icon";
import "./GuideLayer.css";

interface Box { left: number; top: number; width: number; height: number }
const same = (a: Box | null, b: Box | null) => a === b || Boolean(a && b && a.left === b.left && a.top === b.top && a.width === b.width && a.height === b.height);
const shown = (el: Element) => !el.closest("[hidden], [inert]") && getComputedStyle(el).display !== "none";

/** Reads the screen into what the guide's step logic needs (see game/guide.ts). */
function readCtx(blocked: boolean): GuideCtx {
  const { screen, sol, place } = useNav.getState();
  return {
    place: screen === "title" ? "menu" : place,
    screen,
    sol,
    blocked: blocked || Boolean(document.querySelector("dialog[open]")),
    explore: Boolean(document.querySelector(".explore-map")),
    freeCrew: document.querySelectorAll(".crew-tile:not(.has-job) > button:not(:disabled)").length,
    crewSelected: Boolean(document.querySelector(".crew-tile.selected")),
  };
}

/**
 * The first-play guide (#64): a glowing frame on the one thing to touch next and a bubble with one sentence
 * beside it. It never blocks: it has no buttons of its own and every tap goes through it (pointer-events: none).
 * `blocked`: a page like Settings or Data Sources is open over the game.
 */
export function GuideLayer({ blocked = false }: { blocked?: boolean }) {
  const { t } = useTranslation();
  const [at, setAt] = useState<{ step: StepId; box: Box } | null>(null);
  useEffect(() => {
    const update = () => {
      const guide = useGuide.getState(), ctx = readCtx(blocked);
      const after = guideAfter(ctx, guide);
      if (after !== guide) useGuide.setState(after);
      const step = guideStep(ctx, after);
      const el = step ? [...document.querySelectorAll(GUIDE_STEPS[step].target)].find(shown) : undefined;
      const r = el?.getBoundingClientRect();
      const box = r ? { left: Math.round(r.left), top: Math.round(r.top), width: Math.round(r.width), height: Math.round(r.height) } : null;
      setAt((prev) => (step && box ? (prev?.step === step && same(prev.box, box) ? prev : { step, box }) : null));
    };
    update();
    const timer = setInterval(update, 200);
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => { clearInterval(timer); window.removeEventListener("scroll", update, true); window.removeEventListener("resize", update); };
  }, [blocked]);
  if (!at) return null;
  const { step, box } = at;
  // The bubble sits below the control when there is room, else above; kept inside the screen with a 16 px gutter.
  const vw = window.innerWidth || 1024, vh = window.innerHeight || 768;
  const width = Math.min(300, vw - 32);
  const below = box.top + box.height + 120 < vh || box.top < 140;
  const left = Math.max(16, Math.min(vw - 16 - width, box.left + box.width / 2 - width / 2));
  const top = below ? Math.min(vh - 16, box.top + box.height + 14) : Math.max(16, box.top - 14);
  const tail = Math.max(18, Math.min(width - 18, box.left + box.width / 2 - left));
  return <div className="guide" aria-hidden={false}>
    <span className="guide-ring" style={{ left: box.left - 6, top: box.top - 6, width: box.width + 12, height: box.height + 12 }} />
    <div className={below ? "guide-bubble below" : "guide-bubble above"} role="note" aria-live="polite"
      style={{ left, width, top, ["--tail" as string]: `${tail}px` }}>
      <p>{t(GUIDE_STEPS[step].text)}</p>
      {step === "goal" && <ul className="guide-goals">
        {(["crewSafe", "baseRunning", "science"] as const).map((g) => <li key={g}><Icon name="star" /> {t(`final.goal.${g}`)}</li>)}
      </ul>}
    </div>
  </div>;
}

/** "? How to play" in the top bar: hides the tips for good, or replays the guide from the current sol. */
export function GuideToggle() {
  const { t } = useTranslation();
  const on = useGuide((g) => g.on);
  return <button type="button" className="guide-toggle" onClick={() => useGuide.setState(on ? { on: false } : startGuide(useNav.getState().sol))}>
    <span aria-hidden="true">?</span> {t(on ? "guide.hide" : "guide.replay")}
  </button>;
}
