import { reducedMotion } from "../state/comfort";
import { audio } from "./audio";

const SOUND = { small: "menu-error", big: "resource-critical" } as const;
const SHAKE_MS = 350;
const timers = new WeakMap<HTMLElement, ReturnType<typeof setTimeout>>();

/** Short 8-bit screen shake (CSS class `mistake-shake`, whole-pixel steps). Nothing under reduced motion or calm mode. Re-trigger restarts it. */
export function shake(el?: HTMLElement | null): void {
  if (typeof document === "undefined" || reducedMotion()) return;
  const target =
    el ?? document.querySelector<HTMLElement>("main, .screen") ?? document.body;
  clearTimeout(timers.get(target));
  target.classList.remove("mistake-shake");
  void target.offsetWidth; // reflow, so the animation starts again
  target.classList.add("mistake-shake");
  timers.set(
    target,
    setTimeout(() => target.classList.remove("mistake-shake"), SHAKE_MS),
  );
}

/** One consistent "oops": a sound (the usual audio prefs apply) plus a short shake. "big" is for losses (critical resource, failed mission). */
export function mistake(
  kind: "small" | "big" = "small",
  el?: HTMLElement | null,
): void {
  audio.playSfx(SOUND[kind]);
  shake(el);
}
