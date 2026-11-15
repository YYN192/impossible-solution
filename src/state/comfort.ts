import { create } from "zustand";

/** Comfort settings for sensitive kids and classrooms (#77). Saved on this device only. */
export interface Comfort {
  /** No shake, blowing dust, pulsing or falling animations; softer alarms. Same as the system's "reduce motion". */
  calm: boolean;
  /** Brighter muted text, stronger borders, no dust veil over the base. */
  contrast: boolean;
  /** Text size in percent of normal. */
  textSize: 100 | 125 | 150;
  /** The job mini-games never open (they are just for fun and never change the result). */
  skipMiniGames: boolean;
  /** The mini-game clock runs at half speed. */
  slowMiniGames: boolean;
  /** The first-start "Sound? On / Off" question was answered. */
  soundAsked: boolean;
}
export const TEXT_SIZES = [100, 125, 150] as const;
const KEY = "sol:comfort";
const defaults: Comfort = { calm: false, contrast: false, textSize: 100, skipMiniGames: false, slowMiniGames: false, soundAsked: false };

/** Saved settings, each checked: a broken or old value falls back to its default. */
export function readComfort(): Comfort {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? "{}");
    const flag = (k: keyof Comfort) => (typeof saved[k] === "boolean" ? saved[k] : defaults[k]) as boolean;
    return {
      calm: flag("calm"), contrast: flag("contrast"), skipMiniGames: flag("skipMiniGames"), slowMiniGames: flag("slowMiniGames"), soundAsked: flag("soundAsked"),
      textSize: (TEXT_SIZES as readonly number[]).includes(saved.textSize) ? saved.textSize : defaults.textSize,
    };
  } catch {
    return defaults;
  }
}
export const useComfort = create<Comfort>(() => readComfort());

/** Puts the settings on <html> so the CSS can follow them: data-calm, data-contrast and the root text size. */
function apply(c: Comfort) {
  if (typeof document === "undefined") return;
  const html = document.documentElement;
  html.toggleAttribute("data-calm", c.calm);
  html.toggleAttribute("data-contrast", c.contrast);
  html.style.fontSize = c.textSize === 100 ? "" : `${c.textSize}%`;
}
apply(useComfort.getState());
useComfort.subscribe((c) => {
  apply(c);
  try { localStorage.setItem(KEY, JSON.stringify(c)); } catch { /* private window or full storage: settings last for this visit */ }
});

/** True when motion should stay still: the system asks for reduced motion, or calm mode is on. */
export const reducedMotion = (): boolean =>
  useComfort.getState().calm || (typeof window !== "undefined" && Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches));
