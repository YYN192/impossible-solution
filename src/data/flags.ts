/**
 * URL switches.
 *   ?offline=1  never touch the network; use bundled NASA snapshots only
 *   ?demo=1     fixed mission for recording the video (implies offline)
 *   ?sun=today  play the optional "Today's Sun" mission (live DONKI, Mars-only)
 */
export interface Flags {
  offline: boolean;
  demo: boolean;
  todaysSun: boolean;
}

export function readFlags(search: string = globalThis.location?.search ?? ""): Flags {
  const q = new URLSearchParams(search);
  const on = (k: string) => ["1", "true", "yes"].includes((q.get(k) ?? "").toLowerCase());
  const demo = on("demo");
  return {
    demo,
    offline: demo || on("offline"),
    todaysSun: !demo && q.get("sun") === "today",
  };
}
