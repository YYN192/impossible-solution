import { useEffect, useState } from "react";

/**
 * Which on-screen controls the physical keyboard is holding right now, so the key hints under
 * the game can light up while the matching key is down. `keys` maps a lower-case `KeyboardEvent.key`
 * to a control name (several keys may share one, e.g. "w" and "arrowup" → "up").
 * Purely visual: it never stops or handles the key itself.
 */
export function usePressedKeys(keys: Readonly<Record<string, string>>): ReadonlySet<string> {
  const [held, setHeld] = useState<ReadonlySet<string>>(() => new Set());
  useEffect(() => {
    const update = (key: string, down: boolean) => setHeld((prev) => {
      if (prev.has(key) === down) return prev;
      const next = new Set(prev);
      if (down) next.add(key); else next.delete(key);
      return next;
    });
    const down = (e: KeyboardEvent) => { const k = e.key.toLowerCase(); if (k in keys) update(k, true); };
    const up = (e: KeyboardEvent) => { const k = e.key.toLowerCase(); if (k in keys) update(k, false); };
    // A blurred window never gets the key-up: let everything go so nothing stays lit.
    const clear = () => setHeld((prev) => (prev.size ? new Set() : prev));
    window.addEventListener("keydown", down); window.addEventListener("keyup", up); window.addEventListener("blur", clear);
    document.addEventListener("visibilitychange", clear);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); window.removeEventListener("blur", clear); document.removeEventListener("visibilitychange", clear); };
  }, [keys]);
  const controls = new Set<string>();
  for (const k of held) controls.add(keys[k]);
  return controls;
}
