import { useEffect, useState } from "react";

/** Phone width: the same breakpoint as the CSS (max-width: 720px). */
export const PHONE = "(max-width: 720px)";

/** True on a phone-width screen; follows rotation and window resizes. */
export function usePhone(): boolean {
  const [phone, setPhone] = useState(() => typeof window !== "undefined" && Boolean(window.matchMedia?.(PHONE)?.matches));
  useEffect(() => {
    const query = window.matchMedia?.(PHONE);
    if (!query) return;
    const sync = () => setPhone(query.matches);
    sync();
    query.addEventListener?.("change", sync);
    return () => query.removeEventListener?.("change", sync);
  }, []);
  return phone;
}
