# Pixel asset library

This is an original, procedural pixel-art set for the Mars game. PNGs are drawn at their native dimensions with hard pixel edges and transparent backgrounds where the asset is a sprite. The code that generates them is `scripts/generate-pixel-assets.mjs`; rerun it with `node scripts/generate-pixel-assets.mjs` after changing the drawing source. It recreates the library and `asset-manifest.json`.

## Current integration

The app is a React screen-based mission planner, not a Canvas tile game. The title screen uses `backgrounds/mars-menu-hero.png`, and its Start button uses the pixel treatment in `src/index.css`. Player, NPC, tile, console, item, and UI sprites are prepared for future screen/game use; no room renderer or movement system exists to consume them yet.

## Adding sprites

1. Add a named drawing function or drawing block to the generator. Use the palette in `palette.json`, transparent pixels for cutout assets, and multiples of 16 for world objects.
2. Save the PNG under the matching category directory using a lowercase, hyphenated filename.
3. Add metadata through the generator's `manifest` list, including true pixel dimensions, frame count/arrangement, usage, and status.
4. Import assets only in the screen that needs them. For pixel-art scaling, use `image-rendering: pixelated` and integer scale factors where possible.
5. Regenerate and check the manifest dimensions against PNG headers before integration.

Walking animation frames are separate 32×32 PNG files with direction and 1–4 frame index in the filename. Each direction has four distinct arm and foot phases. The set has no sprite-sheet packing yet.
