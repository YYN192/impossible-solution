/**
 * Icon names for dominoes and choices (#50). Each one is a pixel-art PNG in
 * src/assets/pixel/icons/<name>.png (drawn in art-src/pixel/icons.px.js), shown by <Icons> in
 * src/components/Icon.tsx. The engine only passes the names around as plain strings.
 *
 * An icon is one or two names, optionally followed by a badge that sits on the corner of the
 * icon before it: "power down" = power, going down; "food power x" = food, no power.
 */
export const ICON_NAMES = [
  // resources and meters
  "power", "air", "food", "meal", "dose", "science", "battery", "rock", "star", "star-empty",
  // jobs and actions
  "wipe", "brush", "sparkle", "shield", "radio", "no-signal", "heater", "rest", "door", "home",
  "rocket", "patch", "lamp", "sprout", "wrench", "worker", "astronaut", "tired",
  // weather and space
  "sun", "dust-storm", "dusty-sky", "wind", "cold", "ice", "moon", "earth", "mars", "satellite",
  // places and map
  "rover", "map", "pin", "plain", "mountain",
  // interface
  "warning", "check", "lock", "why", "sound-on", "sound-off", "fullscreen", "windowed",
] as const;
export type IconName = (typeof ICON_NAMES)[number];

/** Badges: drawn small on the bottom-right corner of the icon before them. */
export const ICON_BADGES = ["x", "up", "down", "zero"] as const;
export type IconBadge = (typeof ICON_BADGES)[number];

export type Icon =
  | IconName
  | `${IconName} ${IconBadge}`
  | `${IconName} ${IconName}`
  | `${IconName} ${IconName} ${IconBadge}`;
