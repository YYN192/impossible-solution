/**
 * URL switches.
 *   ?offline=1  never touch the network; use bundled NASA snapshots only
 *   ?demo=1     fixed mission for recording the video (implies offline)
 *   ?sun=today  play the optional "Today's Sun" mission (live DONKI, Mars-only)
 *   ?campaign=storm|dust|moon   which campaign (default: storm, the classic 3-sol mission)
 *   ?seed=<n>   replay one exact run (shown on the final screen)
 *   ?daily=1    today's daily mission: the seed is the date, the same for everyone
 *   ?teacher=1  teacher mode: every campaign is open
 */
export interface Flags {
  offline: boolean;
  demo: boolean;
  todaysSun: boolean;
  campaign?: string;
  seed?: number;
  daily?: boolean;
  teacher?: boolean;
}

export function readFlags(search: string = globalThis.location?.search ?? ""): Flags {
  const q = new URLSearchParams(search);
  const on = (k: string) => ["1", "true", "yes"].includes((q.get(k) ?? "").toLowerCase());
  const demo = on("demo");
  const seed = /^\d{1,9}$/.test(q.get("seed") ?? "") ? Number(q.get("seed")) : undefined;
  return {
    demo,
    offline: demo || on("offline"),
    todaysSun: !demo && q.get("sun") === "today",
    // The demo is one fixed recording: it ignores every run choice.
    ...(!demo && q.get("campaign") ? { campaign: q.get("campaign")! } : {}),
    ...(!demo && seed !== undefined ? { seed } : {}),
    ...(!demo && on("daily") ? { daily: true } : {}),
    ...(on("teacher") ? { teacher: true } : {}),
  };
}
