import i18n from "./index";

/**
 * Translate a key that arrives at runtime (e.g. Domino.textKey or StormEvent.captionKey from
 * the engine/data layer), so the compiler can't check it. A missing key shows the key itself
 * and warns in dev, instead of crashing the screen.
 */
export function tDynamic(key: string): string {
  if (!i18n.exists(key)) {
    if (import.meta.env.DEV) console.warn(`[i18n] missing key: ${key}`);
    return key;
  }
  return (i18n.t as unknown as (k: string) => string)(key);
}
