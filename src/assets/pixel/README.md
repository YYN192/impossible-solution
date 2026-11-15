# Pixel asset library

This is an original, procedural pixel-art set for the Mars game. PNGs are drawn at their native dimensions with hard pixel edges and transparent backgrounds where the asset is a sprite. The code that generates them is `scripts/generate-pixel-assets.mjs`; rerun it with `node scripts/generate-pixel-assets.mjs` after changing the drawing source. It recreates the library and `asset-manifest.json`.

**Hub art is now drawn with pxl** (floors, walls, player, commander/engineer/scientist, assistant drone, mission console, crate: 49 PNGs). Source: `art-src/pixel/hub.px.js`. Rebuild with `node <pxl>/bin/pxl.js build art-src/pixel/hub.px.js --out <tmp>` (Node ≥ 22.18), then `node art-src/pixel/export.mjs <tmp>`; the export refuses any size change. Rerunning `generate-pixel-assets.mjs` overwrites these files, so run the pxl export after it.

**UI icons are drawn with pxl** (#50): 55 PNGs, 16×16, in `icons/` (category `icon` in the manifest). Source: `art-src/pixel/icons.px.js`; rebuild and export the same way as the hub art. The game shows them with `<Icon name="power" />` and, for dominoes and choices, `<Icons icon="food power x" />` (`src/components/Icon.tsx`): names separated by spaces, and a badge (`x`, `up`, `down`, `zero`) sits on the corner of the icon before it. The names live in `src/sim/icons.ts`; a test checks that every name has a PNG and every engine icon uses real names. No emoji in the game.

## Current integration

The app is a React screen-based mission planner, not a Canvas tile game. The title screen uses `backgrounds/mars-menu-hero.png`, and its Start button uses the pixel treatment in `src/index.css`. Player, NPC, tile, console, item, and UI sprites are prepared for future screen/game use; no room renderer or movement system exists to consume them yet.

## Adding sprites

1. Add a named drawing function or drawing block to the generator. Use the palette in `palette.json`, transparent pixels for cutout assets, and multiples of 16 for world objects.
2. Save the PNG under the matching category directory using a lowercase, hyphenated filename.
3. Add metadata through the generator's `manifest` list, including true pixel dimensions, frame count/arrangement, usage, and status.
4. Import assets only in the screen that needs them. For pixel-art scaling, use `image-rendering: pixelated` and integer scale factors where possible.
5. Regenerate and check the manifest dimensions against PNG headers before integration.

Walking animation frames are separate 32×32 PNG files with direction and 1–4 frame index in the filename. Each direction has four distinct arm and foot phases. The set has no sprite-sheet packing yet.
