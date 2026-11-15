/**
 * Kid words for how big a space weather event was (#60). The i18n keys are `radar.size.{type}.{word}`.
 * Flares by class letter (A/B tiny, C small, M big, X huge); CMEs by speed; geomagnetic storms by Kp,
 * where NOAA's scale starts at Kp 5 (G1) and ends at Kp 9 (G5).
 */
export type FlareSize = "tiny" | "small" | "big" | "huge" | "unknown";
export type CmeSpeed = "slow" | "fast" | "veryFast" | "unknown";
export type StormSize = "small" | "strong" | "huge" | "unknown";

export function flareSize(classType: string | null | undefined): FlareSize {
  const letter = /^[ABCMX]/.exec(classType ?? "")?.[0];
  return !letter ? "unknown" : letter === "X" ? "huge" : letter === "M" ? "big" : letter === "C" ? "small" : "tiny";
}

export function cmeSpeed(kmS: number | null | undefined): CmeSpeed {
  if (kmS == null || !Number.isFinite(kmS)) return "unknown";
  return kmS < 500 ? "slow" : kmS < 1000 ? "fast" : "veryFast";
}

export function stormSize(kp: number | null | undefined): StormSize {
  if (kp == null || !Number.isFinite(kp)) return "unknown";
  return kp < 6 ? "small" : kp < 8 ? "strong" : "huge";
}
