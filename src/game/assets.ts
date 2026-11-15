/** Vite resolves all sprite URLs at build time, including separate animation frames. */
const urls = import.meta.glob<string>(["../assets/pixel/**/*.png", "!../assets/pixel/ui/**"], {
  eager: true, query: "?url", import: "default",
});
export function asset(path: string): string {
  const url = urls[`../assets/pixel/${path}.png`];
  if (!url) throw new Error(`Unknown pixel asset: ${path}`);
  return url;
}
const images = new Map<string, HTMLImageElement>();
export function getSprite(path: string): HTMLImageElement {
  let image = images.get(path);
  if (!image) { image = new Image(); image.src = asset(path); images.set(path, image); }
  return image;
}
export type Facing = "front" | "back" | "left" | "right";
export const playerSprite = (facing: Facing, frame?: number) =>
  `characters/player/astronaut-${frame === undefined ? `idle-${facing}` : `walk-${facing}-${frame + 1}`}`;
// Load every player frame up front: a frame drawn before it loads is blank, which made the astronaut flash.
if (typeof Image !== "undefined") for (const f of ["front", "back", "left", "right"] as const) for (const n of [undefined, 0, 1, 2, 3]) getSprite(playerSprite(f, n));
