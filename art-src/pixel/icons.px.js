// UI icons for "The Impossible SOLution" — built with pxl (tools/claude-pxl). Issue #50.
// They replace every emoji in the game, so the game has one 16-bit look on every device.
// Each icon: 14x14 + 1px ink outline = 16x16. Names = file basenames in src/assets/pixel/icons/
// (category "icon" in asset-manifest.json). Same palette as hub.px.js / campaign.px.js.
// Badges (x, up, down, zero) are drawn to sit on the bottom-right corner of another icon.
// Original art, no NASA marks, no real people.

pal({
  k: "#080B12", // ink
  n: "#101A2B", // space
  K: "#252C38", // steelDark
  S: "#687586", // steel
  L: "#B8C4D0", // silver
  W: "#E8F0F7", // white
  b: "#4C9CE5", // blue
  B: "#2F6BAE", // blue shade
  c: "#83D9F4", // cyan
  o: "#D86E3B", // orange
  r: "#A84730", // rust
  R: "#6E2E22", // deep rust
  y: "#E6BD5D", // yellow
  Y: "#B48A35", // yellow shade
  g: "#65BF83", // green
  G: "#3E8A5C", // green shade
  t: "#4BB8B0", // teal
  d: "#E0B07A", // dust light
  D: "#C08650", // dust mid
  E: "#8C5A38", // dust dark
  m: "#3A4352", // moon dark grey
  M: "#8A94A2", // moon mid grey
  x: "#D2483A", // badge red (warm, reads as "no" on the dark UI)
});
ramps("kKSLW", "kBbc", "REro", "YyW", "GgW");

const icon = (name, ...items) => sprite(name, { w: 14, h: 14, outline: "k" }, ...items);
/** 5-point star polygon (flat list of x, y) around cx, cy. */
const starPts = (cx, cy, R, r) => {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rad = i % 2 ? r : R;
    pts.push(Math.round(cx + rad * Math.cos(a)), Math.round(cy + rad * Math.sin(a)));
  }
  return pts;
};

// ================= resources and meters =================
icon("power", `
  .......yyyyy..
  ......yyyyY...
  .....yyyyY....
  ....yyyyY.....
  ...yyyyY......
  ..yyyyyyyyyy..
  ..YYYYyyyyY...
  ......yyyY....
  .....yyyY.....
  ....yyyY......
  ....yyY.......
  ...yyY........
  ...yY.........
  ..yY..........`,
  px(8, 0, "W"), px(7, 1, "W"), px(6, 2, "W"), // glint
);
icon("air",
  circ(5, 8, 5, "b"), circ(5, 8, 4, "c"), px(3, 6, "W"), px(3, 5, "W"), px(4, 5, "W"), px(2, 7, "W"),
  circ(11, 10, 3, "b"), circ(11, 10, 2, "c"), px(10, 9, "W"),
  circ(11, 2, 2, "b"), circ(11, 2, 1, "c"), px(10, 1, "W"),
);
icon("food", // a head of lettuce
  circ(7, 7, 6, "G"), circ(7, 7, 5, "g"), circ(6, 6, 3, "W"), circ(6, 6, 2, "g"),
  line(7, 13, 7, 3, "G"), line(7, 9, 3, 5, "G"), line(7, 9, 11, 5, "G"), line(7, 12, 2, 9, "G"), line(7, 12, 12, 9, "G"),
  px(4, 3, "W"), px(3, 4, "W"),
);
icon("meal", // bowl of stew with steam
  clip([0, 7, 14, 7], circ(7, 6, 7, "o")), clip([0, 10, 14, 4], circ(7, 6, 7, "r")),
  hline(0, 7, 14, "o"), rect(1, 6, 12, 1, "E"), px(3, 6, "g"), px(6, 6, "y"), px(9, 6, "g"), px(11, 6, "y"),
  hline(2, 9, 3, "d"),
  vline(4, 1, 2, "L"), px(5, 3, "L"), px(5, 0, "L"),
  vline(7, 2, 2, "L"), px(8, 0, "L"), px(8, 1, "L"),
  vline(10, 1, 2, "L"), px(11, 3, "L"), px(11, 0, "L"),
);
icon("dose", // radiation trefoil
  circ(7, 7, 6, "y"),
  (c) => {
    for (let y = 0; y < 14; y++) for (let x = 0; x < 14; x++) {
      const dx = x + 0.5 - 7, dy = 7 - (y + 0.5);
      const r = Math.hypot(dx, dy);
      const a = (Math.atan2(dy, dx) * 180) / Math.PI;
      const near = [30, 150, -90].some((b) => Math.abs(((a - b + 540) % 360) - 180) < 30);
      if ((r > 2.3 && r < 5.9 && near) || r < 1.3) c.px(x, y, "k");
    }
  },
);
icon("science", `
  ..kk..........
  ..WLk.........
  ...WLk........
  ....WLk.SS....
  .....WLSSSS...
  ......WLSSS...
  ......kKk.SS..
  .......c...SS.
  ...KKKKKKK.SS.
  ...........SS.
  ..........SS..
  .........SS...
  ..SSSSSSSSSSS.
  ..KKKKKKKKKKK.`, // microscope, side view
  vline(12, 7, 3, "L"), px(11, 10, "L"), px(10, 11, "L"), hline(2, 12, 11, "L"),
);
icon("battery",
  rect(5, 0, 4, 2, "S"), rect(3, 2, 8, 12, "K"), rect(4, 3, 6, 10, "n"),
  rect(4, 7, 6, 6, "g"), hline(4, 7, 6, "W"), vline(4, 8, 5, "G"),
  vline(3, 2, 12, "S"),
);
icon("rock", // same rock as map-rock
  poly([1, 12, 0, 7, 3, 3, 8, 1, 12, 4, 14, 9, 13, 12], "m"),
  poly([1, 12, 0, 7, 3, 3, 6, 5, 5, 12], "S"),
  hline(8, 2, 3, "M"), hline(3, 4, 3, "M"),
  hline(2, 11, 11, "K"), hline(7, 8, 5, "K"),
);
icon("star", poly(starPts(7, 7.6, 7.4, 3), "y"), poly([7, 2, 9, 6, 7, 8, 5, 6], "W"), recolor({ y: "Y" }, [7, 9, 7, 5]), px(7, 3, "W"));
icon("star-empty", poly(starPts(7, 7.6, 7.4, 3), "S"), poly(starPts(7, 7.6, 5.4, 2), "m"));

// ================= jobs and actions =================
icon("wipe", // sponge with a scrubby top and a few bubbles
  rect(0, 6, 11, 8, "y"), rect(0, 4, 11, 3, "g"), hline(0, 6, 11, "G"),
  vline(10, 7, 7, "Y"), hline(0, 13, 11, "Y"),
  px(2, 8, "Y"), px(5, 9, "Y"), px(8, 8, "Y"), px(3, 11, "Y"), px(7, 11, "Y"),
  circ(12, 2, 1, "c"), px(9, 1, "c"), px(13, 5, "c"),
);
icon("brush", // a dust brush / broom
  line(13, 0, 7, 6, "D", 2), line(13, 0, 7, 6, "d"),
  rect(5, 6, 4, 2, "r"),
  poly([4, 8, 10, 8, 9, 14, 0, 14], "y"), poly([4, 8, 6, 8, 3, 14, 0, 14], "Y"),
  line(5, 9, 3, 13, "Y"), line(7, 9, 6, 13, "Y"),
);
icon("sparkle", `
  ....y.........
  ....y.........
  ...yWy........
  .yyWWWyy...y..
  ...yWy.....y..
  ....y.....yWy.
  ....y....yWWWy
  ..........yWy.
  ...........y..
  ......y....y..
  .....yWy......
  ....yWWWy.....
  .....yWy......
  ......y.......`);
icon("shield",
  poly([0, 0, 14, 0, 14, 7, 7, 14, 0, 7], "L"),
  poly([1, 1, 13, 1, 13, 7, 7, 13, 1, 7], "B"),
  clip([0, 0, 7, 14], poly([1, 1, 13, 1, 13, 7, 7, 13, 1, 7], "b")),
  vline(6, 2, 10, "c"), hline(2, 5, 10, "c"), vline(7, 2, 10, "b"),
);
icon("radio", // same dish as skill-radio
  clip([0, 7, 14, 7], circ(7, 7, 6, "b")), clip([0, 7, 14, 7], circ(7, 7, 4, "B")),
  hline(1, 7, 12, "L"),
  vline(7, 1, 6, "L"), px(7, 0, "y"),
  rect(6, 11, 3, 2, "S"), hline(4, 13, 7, "K"),
  px(10, 2, "c"), px(11, 1, "c"), px(12, 3, "c"),
);
icon("no-signal", // Earth hidden: a dark Moon with only a thin lit edge, and a cut-off signal
  circ(6, 8, 5, "L"), circ(8, 8, 5, "m"), circ(8, 8, 4, "K"), px(9, 6, "m"), px(7, 10, "m"),
  px(11, 0, "c"), px(12, 1, "c"), px(13, 2, "c"), px(9, 1, "c"), px(10, 2, "c"),
);
icon("heater", `
  ......r.......
  ......rr......
  .....roor.....
  .....rooor....
  ....roooor..r.
  ...rooyooor.r.
  ..roooyyooorr.
  ..rooyyyyooor.
  .rooyyyyyyoor.
  .rooyyWWyyoor.
  .rooyyWWWyoor.
  ..rooyWWyyor..
  ...rooyyyoor..
  ....rrrrrrr...`);
icon("rest", // a bed with a blanket, and Zs
  rect(0, 5, 2, 9, "S"), vline(0, 5, 9, "L"),
  rect(2, 9, 12, 2, "W"), rect(2, 11, 12, 1, "S"), vline(13, 11, 3, "S"), vline(2, 12, 2, "S"),
  rect(2, 7, 3, 2, "W"), hline(2, 8, 3, "L"),
  rect(5, 7, 9, 3, "b"), hline(5, 7, 9, "c"), hline(5, 9, 9, "B"),
  hline(8, 0, 3, "W"), px(9, 1, "W"), hline(8, 2, 3, "W"),
  hline(11, 3, 2, "L"), px(11, 4, "L"), hline(11, 5, 2, "L"),
);
icon("door", // airlock door
  rect(1, 0, 12, 14, "S"), vline(1, 0, 14, "L"),
  rect(3, 2, 8, 12, "L"), vline(10, 2, 12, "S"), vline(6, 2, 12, "S"),
  circ(5, 5, 1, "c"), circ(8, 5, 1, "c"),
  px(5, 8, "y"), px(8, 8, "y"),
  (c) => { for (let x = 3; x < 11; x++) c.px(x, 12 + ((x >> 1) % 2), (x >> 1) % 2 ? "k" : "y"); c.hline(3, 12, 8, "y"); c.px(4, 12, "k"); c.px(5, 12, "k"); c.px(8, 12, "k"); c.px(9, 12, "k"); c.hline(3, 13, 8, "K"); },
);
icon("home", // same dome as map-base
  clip([0, 0, 14, 9], circ(7, 9, 6, "L")),
  clip([0, 0, 14, 9], circ(6, 8, 4, "W")),
  rect(1, 9, 12, 3, "S"), hline(1, 9, 12, "L"),
  rect(5, 7, 4, 5, "K"), rect(6, 8, 2, 4, "c"),
  px(7, 1, "y"), px(7, 0, "y"), px(6, 1, "Y"), px(8, 1, "Y"),
  hline(0, 12, 14, "E"), hline(1, 13, 12, "D"),
);
sprite("rocket", { mx: true, outline: "k" }, `
  ......W
  .....WW
  .....WL
  ....WWc
  ....Wcc
  ....WWc
  ....WWW
  ....WWL
  ...rWWL
  ..rrWWL
  .rrrWWL
  .rr.oyy
  ....oyW
  .....oy`);
icon("patch", // a bandage, corner to corner
  line(2, 11, 11, 2, "d", 5), line(3, 12, 12, 3, "D"),
  poly([5, 7, 7, 5, 9, 7, 7, 9], "E"), px(6, 7, "D"), px(7, 6, "D"), px(8, 7, "D"), px(7, 8, "D"),
  px(3, 8, "W"), px(4, 7, "W"),
);
icon("lamp", // grow light bulb
  circ(7, 5, 5, "y"), circ(6, 4, 2, "W"), px(5, 3, "W"),
  vline(6, 6, 3, "Y"), vline(8, 6, 3, "Y"), px(7, 6, "Y"),
  rect(5, 10, 5, 3, "S"), hline(5, 11, 5, "L"), px(7, 13, "K"), rect(6, 13, 3, 1, "K"),
);
icon("sprout",
  rect(1, 11, 12, 3, "E"), hline(1, 11, 12, "D"), px(3, 12, "D"), px(9, 13, "D"),
  vline(7, 5, 6, "G"),
  ellipse(4, 4, 3, 2, "g"), hline(2, 4, 4, "G"), px(3, 3, "W"),
  ellipse(10, 3, 3, 2, "g"), hline(8, 3, 4, "G"), px(10, 2, "W"),
);
icon("wrench", // same as skill-wrench
  line(2, 12, 8, 6, "o", 3),
  line(2, 12, 5, 9, "r", 1),
  circ(9, 4, 4, "L"), circ(9, 4, 3, "W"),
  rect(9, 0, 3, 4, "_"), px(9, 4, "_"),
  px(7, 3, "S"),
);
icon("worker", // crew member in a hard hat
  circ(7, 9, 4, "d"), hline(4, 12, 6, "D"),
  px(5, 9, "k"), px(9, 9, "k"), hline(6, 11, 3, "E"),
  clip([0, 0, 14, 7], circ(7, 7, 5, "y")), hline(1, 6, 12, "y"), hline(1, 7, 12, "Y"),
  vline(7, 2, 4, "Y"), px(4, 4, "W"), px(5, 3, "W"),
);
icon("astronaut", // helmet with a visor
  rect(3, 12, 8, 2, "S"), hline(3, 12, 8, "L"),
  circ(7, 6, 6, "W"), clip([7, 0, 7, 14], circ(7, 6, 6, "L")), circ(7, 6, 5, "W"),
  ellipse(7, 6, 4, 3, "B"), ellipse(7, 6, 3, 2, "b"), px(5, 5, "c"), px(6, 4, "c"), px(5, 4, "W"),
);
icon("tired", // sleepy face with Zs
  circ(6, 8, 5, "d"), clip([6, 0, 8, 14], circ(6, 8, 5, "D")), circ(5, 7, 3, "d"),
  hline(3, 8, 2, "k"), hline(7, 8, 2, "k"), hline(5, 11, 2, "E"),
  hline(10, 0, 3, "W"), px(11, 1, "W"), hline(10, 2, 3, "W"),
  hline(12, 4, 2, "L"), px(12, 5, "L"), hline(12, 6, 2, "L"),
);

// ================= weather and space =================
icon("sun",
  circ(7, 7, 4, "y"), clip((x, y) => x + y > 15, circ(7, 7, 4, "Y")), circ(6, 6, 2, "W"), circ(6, 6, 1, "y"), px(5, 5, "W"),
  vline(7, 0, 2, "o"), vline(7, 12, 2, "o"), hline(0, 7, 2, "o"), hline(12, 7, 2, "o"),
  px(2, 2, "o"), px(3, 3, "o"), px(11, 2, "o"), px(10, 3, "o"), px(2, 12, "o"), px(3, 11, "o"), px(11, 12, "o"), px(10, 11, "o"),
);
icon("dust-storm", // a dust devil
  hline(0, 0, 14, "d"), hline(1, 1, 12, "D"), hline(1, 2, 11, "d"), hline(3, 3, 10, "D"),
  hline(3, 4, 9, "d"), hline(4, 5, 8, "E"), hline(4, 6, 7, "d"), hline(5, 7, 6, "D"),
  hline(5, 8, 5, "d"), hline(6, 9, 4, "D"), hline(6, 10, 3, "d"), hline(5, 11, 3, "E"),
  hline(6, 12, 2, "D"), hline(4, 13, 6, "E"),
  px(3, 1, "W"), px(6, 4, "W"), px(7, 8, "W"),
);
icon("dusty-sky", // a dim sun behind bands of dust
  circ(9, 4, 3, "Y"), circ(8, 3, 1, "y"),
  hline(0, 5, 12, "d"), hline(2, 6, 12, "D"),
  hline(0, 9, 10, "d"), hline(3, 10, 11, "D"),
  hline(1, 13, 12, "D"), hline(4, 12, 8, "d"),
);
icon("wind",
  hline(0, 2, 8, "L"), px(8, 1, "L"), px(9, 0, "L"), px(10, 1, "L"), px(10, 2, "L"), px(9, 3, "L"),
  hline(0, 6, 12, "W"), px(12, 5, "W"), px(13, 4, "W"), px(13, 3, "W"), px(12, 2, "W"),
  hline(2, 10, 9, "L"), px(11, 11, "L"), px(12, 12, "L"), px(11, 13, "L"), px(10, 13, "L"), px(9, 12, "L"),
);
icon("cold", // snowflake
  vline(7, 0, 14, "c"), hline(0, 7, 14, "c"), line(2, 2, 12, 12, "c"), line(12, 2, 2, 12, "c"),
  px(6, 1, "c"), px(8, 1, "c"), px(6, 13, "c"), px(8, 13, "c"),
  px(1, 6, "c"), px(1, 8, "c"), px(13, 6, "c"), px(13, 8, "c"),
  rect(6, 6, 3, 3, "W"),
);
icon("ice", // an ice cube
  poly([0, 4, 7, 1, 14, 4, 7, 7], "W"),
  poly([0, 4, 7, 7, 7, 14, 0, 11], "c"),
  poly([7, 7, 14, 4, 14, 11, 7, 14], "b"),
  px(2, 6, "W"), px(2, 7, "W"), px(9, 9, "c"), hline(4, 3, 3, "c"),
);
icon("moon", // crescent
  circ(7, 7, 6, "L"), clip([7, 0, 7, 14], circ(7, 7, 6, "M")), circ(10, 5, 5, "_"),
  px(3, 9, "M"), px(5, 11, "M"), px(2, 5, "W"),
);
icon("earth",
  circ(7, 7, 6, "b"),
  ellipse(5, 5, 2, 3, "g"), ellipse(9, 9, 3, 2, "g"), px(10, 3, "g"), px(11, 4, "g"),
  hline(4, 2, 3, "W"), px(3, 4, "c"),
  clip((x, y) => x + y > 15, circ(7, 7, 6, "B")), clip((x, y) => x + y > 15, ellipse(9, 9, 3, 2, "G")),
);
icon("mars",
  circ(7, 7, 6, "o"),
  clip((x, y) => x + y > 15, circ(7, 7, 6, "r")),
  hline(5, 1, 4, "W"), hline(6, 2, 2, "W"),
  ellipse(5, 7, 2, 1, "r"), ellipse(10, 9, 2, 1, "R"), px(4, 10, "R"),
  px(3, 4, "d"),
);
icon("satellite",
  rect(0, 4, 5, 6, "b"), vline(2, 4, 6, "B"), hline(0, 6, 5, "B"), hline(0, 4, 5, "c"),
  rect(9, 4, 5, 6, "b"), vline(11, 4, 6, "B"), hline(9, 6, 5, "B"), hline(9, 4, 5, "c"),
  hline(5, 7, 4, "S"),
  rect(5, 3, 4, 8, "y"), vline(8, 3, 8, "Y"), hline(5, 3, 4, "W"),
  vline(7, 0, 3, "L"), px(6, 0, "W"),
  rect(6, 11, 2, 2, "S"), px(6, 13, "L"), px(7, 13, "L"),
);

// ================= places and map =================
const wheel = (x, y) => [rect(x, y, 3, 3, "K"), px(x + 1, y, "S")];
icon("rover", // same rover as rover-right
  vline(9, 1, 4, "S"), rect(8, 0, 3, 2, "W"), px(10, 1, "c"),
  rect(1, 8, 12, 2, "S"),
  rect(1, 4, 12, 5, "W"), hline(1, 4, 12, "L"),
  hline(1, 6, 12, "o"), hline(1, 7, 12, "r"),
  rect(2, 3, 4, 1, "b"), hline(3, 3, 2, "c"),
  rect(11, 5, 2, 1, "c"),
  ...wheel(0, 10), ...wheel(5, 10), ...wheel(10, 10),
);
icon("map", // folded paper map with a route
  poly([0, 2, 5, 0, 9, 2, 14, 0, 14, 12, 9, 14, 5, 12, 0, 14], "d"),
  poly([5, 0, 9, 2, 9, 14, 5, 12], "D"),
  line(1, 11, 4, 8, "r"), px(5, 8, "r"), px(7, 7, "r"), px(9, 6, "r"),
  line(10, 3, 12, 5, "r"), line(12, 3, 10, 5, "r"),
);
icon("pin",
  circ(7, 5, 5, "x"), poly([3, 8, 11, 8, 7, 14], "x"), clip((x) => x > 7, circ(7, 5, 5, "r")), clip((x) => x > 7, poly([3, 8, 11, 8, 7, 14], "r")),
  circ(7, 5, 2, "W"), px(4, 3, "d"), px(5, 2, "d"),
);
icon("plain", // dunes under a small sun
  circ(10, 3, 2, "y"), px(9, 2, "W"),
  clip([0, 7, 14, 7], ellipse(4, 12, 6, 4, "d")),
  clip([0, 7, 14, 7], ellipse(11, 13, 6, 3, "D")),
  hline(0, 13, 14, "E"), hline(2, 9, 3, "W"),
);
icon("mountain", // a rusty ridge with a light top
  poly([0, 14, 5, 3, 8, 8, 10, 5, 14, 14], "r"),
  poly([5, 3, 8, 8, 6, 14, 3, 14], "o"),
  poly([5, 3, 7, 7, 5, 6, 3, 7], "d"),
  poly([10, 5, 12, 9, 10, 8, 9, 8], "d"),
  hline(0, 13, 14, "R"),
);

// ================= interface =================
icon("warning",
  poly([6, 0, 8, 0, 14, 13, 0, 13], "y"), hline(0, 13, 14, "Y"),
  rect(6, 4, 2, 5, "k"), rect(6, 10, 2, 2, "k"),
);
const tile = (c, shade) => [rect(0, 0, 14, 14, c), hline(0, 13, 14, shade), vline(13, 0, 14, shade), px(0, 0, "_"), px(13, 0, "_"), px(0, 13, "_"), px(13, 13, "_")];
icon("check", ...tile("g", "G"), line(3, 7, 6, 10, "W", 2), line(6, 10, 11, 3, "W", 2));
icon("lock",
  clip([0, 0, 14, 7], ring(7, 6, 4, "L")), clip([0, 0, 14, 7], ring(7, 6, 3, "S")),
  rect(1, 6, 12, 8, "y"), hline(1, 6, 12, "W"), vline(12, 7, 7, "Y"), hline(1, 13, 12, "Y"),
  rect(6, 8, 2, 2, "k"), px(6, 10, "k"), px(7, 10, "k"), px(7, 11, "k"), px(6, 11, "k"),
);
icon("why", // magnifying glass
  line(8, 8, 13, 13, "o", 3), line(9, 9, 13, 13, "r"),
  circ(5, 5, 5, "L"), circ(5, 5, 4, "c"), circ(4, 4, 2, "W"), circ(5, 5, 4, "S", true),
);
sprite("_speaker", { w: 14, h: 14 },
  rect(0, 5, 3, 5, "L"), vline(0, 5, 5, "W"),
  poly([3, 5, 8, 0, 8, 15, 3, 10], "L"), poly([3, 5, 5, 3, 5, 12, 3, 10], "W"),
);
icon("sound-on",
  stamp("_speaker", 0, 0),
  clip([10, 0, 4, 14], ring(8, 7, 2, "c")),
  clip([11, 0, 3, 14], ring(8, 7, 4, "c")),
  clip([12, 0, 2, 14], ring(8, 7, 6, "c")),
);
icon("sound-off",
  stamp("_speaker", 0, 0),
  line(9, 4, 13, 10, "x", 2), line(13, 4, 9, 10, "x", 2),
);
const corner = (x, y, dx, dy, c) => [hline(dx > 0 ? x : x - 4, y, 5, c), vline(x, dy > 0 ? y : y - 4, 5, c)];
icon("fullscreen", // four corners pointing out
  ...corner(0, 0, 1, 1, "W"), ...corner(13, 0, -1, 1, "W"), ...corner(0, 13, 1, -1, "W"), ...corner(13, 13, -1, -1, "W"),
  ...corner(1, 1, 1, 1, "W"), ...corner(12, 1, -1, 1, "W"), ...corner(1, 12, 1, -1, "W"), ...corner(12, 12, -1, -1, "W"),
  rect(4, 4, 6, 6, "S"), rect(5, 5, 4, 4, "c"),
);
icon("windowed", // two windows: back to a normal window
  rect(4, 0, 10, 9, "S"), rect(5, 2, 8, 6, "n"), hline(4, 0, 10, "L"), hline(4, 1, 10, "L"),
  rect(0, 5, 10, 9, "S"), rect(1, 7, 8, 6, "c"), hline(0, 5, 10, "W"), hline(0, 6, 10, "W"),
);

// ================= badges (sit on the corner of another icon) =================
icon("x", ...tile("x", "r"), line(3, 3, 10, 10, "W", 2), line(10, 3, 3, 10, "W", 2));
icon("up", ...tile("K", "k"), poly([7, 2, 12, 7, 9, 7, 9, 12, 5, 12, 5, 7, 2, 7], "W"));
icon("down", ...tile("K", "k"), poly([7, 12, 12, 7, 9, 7, 9, 2, 5, 2, 5, 7, 2, 7], "W"));
icon("zero", ...tile("K", "k"), rect(4, 2, 6, 10, "W"), rect(6, 4, 2, 6, "K"));

// ---------- contact sheet for checking the set by eye (not exported to the game) ----------
const ALL = ["power", "air", "food", "meal", "dose", "science", "battery", "rock", "star", "star-empty",
  "wipe", "brush", "sparkle", "shield", "radio", "no-signal", "heater", "rest", "door", "home",
  "rocket", "patch", "lamp", "sprout", "wrench", "worker", "astronaut", "tired", "sun", "dust-storm",
  "dusty-sky", "wind", "cold", "ice", "moon", "earth", "mars", "satellite", "rover", "map",
  "pin", "plain", "mountain", "warning", "check", "lock", "why", "sound-on", "sound-off", "fullscreen",
  "windowed", "x", "up", "down", "zero"];
scene("contact", { w: 10 * 20 + 4, h: 6 * 20 + 4, bg: "n" },
  ...ALL.map((n, i) => stamp(n, 4 + (i % 10) * 20, 4 + Math.floor(i / 10) * 20)),
);
