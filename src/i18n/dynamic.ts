import i18n from "./index";

/**
 * Translate a key that arrives at runtime (e.g. Domino.textKey or StormEvent.captionKey from
 * the engine/data layer), so the compiler can't check it. A missing key shows the key itself
 * and warns in dev, instead of crashing the screen.
 */
export function tDynamic(key: string): string {
  if (key.startsWith("chose:")) return tRun(key);
  if (!i18n.exists(key)) {
    if (import.meta.env.DEV) console.warn(`[i18n] missing key: ${key}`);
    return key;
  }
  return (i18n.t as unknown as (k: string) => string)(key);
}

/**
 * Translate with run-time values. Two extras for campaigns:
 *   - `chose:<labelKey>` (a beat choice's domino) reads "You chose: <label>."
 *   - `place: "moon"` picks the `_moon` wording ("day" instead of "sol") when the key has one.
 */
export function tRun(key: string, opts: Record<string, unknown> = {}, place?: string): string {
  const t = i18n.t as unknown as (k: string, o?: Record<string, unknown>) => string;
  if (key.startsWith("chose:")) return t("beat.chose", { choice: t(key.slice(6), opts) });
  const o = place === "moon" ? { ...opts, context: "moon" } : opts;
  // Plural keys only exist with their count, so check with the options.
  if (!(i18n.exists as unknown as (k: string, o?: Record<string, unknown>) => boolean)(key, o)) {
    if (import.meta.env.DEV) console.warn(`[i18n] missing key: ${key}`);
    return key;
  }
  return t(key, o);
}
