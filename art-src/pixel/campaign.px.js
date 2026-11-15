// Campaign sprites for "The Impossible SOLution" — built with pxl (tools/claude-pxl).
// Rover, map markers, solar panels, skill icons, mission cards, Pip frames, briefing planets.
// Names = file basenames in src/assets/pixel/asset-manifest.json (category "campaign").
// Original art, same palette as hub.px.js. No NASA marks, no real people.

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
  d: "#E0B07A", // dust light
  D: "#C08650", // dust mid
  E: "#8C5A38", // dust dark
  1: "#161C27",
  2: "#1D2430",
  m: "#3A4352", // moon dark grey
  M: "#8A94A2", // moon mid grey
});
ramps("k1234", "kKSLW", "kBbc", "REro", "YyW");

// ---------- rover (16x16 = 14x14 + outline) ----------
const wheel = (x, y) => [rect(x, y, 3, 3, "K"), px(x + 1, y, "S")];
sprite("rover-right", { w: 14, h: 14, outline: "k" },
  vline(9, 1, 4, "S"), rect(8, 0, 3, 2, "W"), px(10, 1, "c"), // mast + camera
  rect(1, 8, 12, 2, "S"), // far wheels axle (behind)
  rect(1, 4, 12, 5, "W"), hline(1, 4, 12, "L"),
  hline(1, 6, 12, "o"), hline(1, 7, 12, "r"), // orange accent stripe
  rect(2, 3, 4, 1, "b"), hline(3, 3, 2, "c"), // panel on the roof
  rect(11, 5, 2, 1, "c"), // headlight window
  ...wheel(0, 10), ...wheel(5, 10), ...wheel(10, 10),
);
sprite("rover-left", { base: "rover-right", flip: "x" });
sprite("rover-up", { w: 14, h: 14, outline: "k" },
  rect(0, 1, 3, 3, "K"), rect(0, 5, 3, 3, "K"), rect(0, 9, 3, 3, "K"),
  rect(11, 1, 3, 3, "K"), rect(11, 5, 3, 3, "K"), rect(11, 9, 3, 3, "K"),
  rect(2, 2, 10, 11, "W"), vline(2, 2, 11, "L"),
  vline(6, 2, 11, "o"), vline(7, 2, 11, "r"), // stripe
  rect(3, 3, 2, 4, "b"), rect(9, 3, 2, 4, "b"), // panels
  rect(4, 0, 6, 2, "L"), rect(6, 0, 2, 1, "c"), // camera head, at the front
);
sprite("rover-down", { base: "rover-up", flip: "y" });

// ---------- map markers (16x16 = 14x14 + outline) ----------
sprite("map-base", { w: 14, h: 14, outline: "k" },
  clip([0, 0, 14, 9], circ(7, 9, 6, "L")),
  clip([0, 0, 14, 9], circ(7, 9, 6, "L")),
  clip([0, 0, 14, 9], circ(6, 8, 4, "W")),
  rect(1, 9, 12, 3, "S"), hline(1, 9, 12, "L"),
  rect(5, 7, 4, 5, "K"), rect(6, 8, 2, 4, "c"), // door
  px(7, 1, "y"), px(7, 0, "y"), px(6, 1, "Y"), px(8, 1, "Y"), // beacon light
);
sprite("map-sample", { w: 14, h: 14, outline: "k" },
  poly([1, 12, 1, 8, 4, 6, 10, 6, 13, 9, 13, 12], "S"),
  poly([1, 12, 1, 8, 4, 6, 6, 6, 5, 12], "L"), hline(2, 11, 11, "K"),
  poly([6, 6, 7, 0, 9, 6], "c"), poly([8, 6, 7, 2, 9, 6], "W"), px(10, 3, "c"), px(11, 4, "c"),
);
sprite("map-rock", { w: 14, h: 14, outline: "k" },
  poly([1, 12, 0, 7, 3, 3, 8, 1, 12, 4, 14, 9, 13, 12], "m"),
  poly([1, 12, 0, 7, 3, 3, 6, 5, 5, 12], "S"),
  hline(8, 2, 3, "M"), hline(3, 4, 3, "M"),
  hline(2, 11, 11, "K"), hline(7, 8, 5, "K"),
);
sprite("map-crater", { w: 14, h: 14, outline: "k" },
  ellipse(7, 7, 6, 5, "o"), ellipse(7, 8, 5, 4, "R"), ellipse(7, 8, 4, 3, "r"),
  hline(4, 4, 6, "d"), hline(3, 5, 2, "d"), // lit rim
  hline(5, 6, 4, "R"),
);
sprite("map-dust", { w: 16, h: 16 },
  hline(2, 1, 12, "d"), hline(4, 2, 10, "D"), hline(1, 3, 11, "d"), hline(4, 4, 9, "D"),
  hline(3, 5, 9, "d"), hline(5, 6, 7, "D"), hline(3, 7, 7, "d"), hline(5, 8, 6, "D"),
  hline(5, 9, 5, "d"), hline(6, 10, 4, "D"), hline(6, 11, 3, "d"), hline(7, 12, 3, "E"), hline(5, 14, 7, "D"),
  hline(0, 2, 2, "d"), hline(14, 3, 2, "d"), hline(12, 8, 3, "d"),
);
sprite("map-flag", { w: 14, h: 14, outline: "k" },
  vline(4, 0, 14, "L"), rect(3, 11, 4, 3, "S"),
  poly([5, 1, 13, 4, 5, 7], "o"), poly([5, 5, 11, 5, 5, 7], "r"), hline(5, 1, 6, "y"),
);

// ---------- solar panel tiles (32x32, top-down) ----------
sprite("panel-clean", { w: 32, h: 32 },
  rect(0, 0, 32, 32, "k"), rect(1, 1, 30, 30, "S"), rect(2, 2, 28, 28, "n"),
  (c) => {
    for (const y of [2, 12, 22]) for (const x of [2, 12, 22]) {
      c.rect(x, y, 8, 8, "B"); c.rect(x, y, 8, 7, "b");
      c.hline(x + 1, y + 1, 4, "c"); c.px(x + 1, y + 2, "c"); // glassy corner
      c.vline(x + 4, y + 3, 4, "B"); // busbar
    }
  },
  hline(1, 1, 30, "L"),
);
sprite("panel-dusty", { base: "panel-clean" },
  // dust drifts: darker body, lighter crest, dithered edge so the panel shows through
  ellipse(6, 7, 7, 5, "D"), ellipse(24, 26, 9, 6, "D"), ellipse(27, 9, 4, 6, "D"), ellipse(11, 22, 6, 3, "D"),
  ellipse(6, 5, 5, 3, "d"), ellipse(24, 24, 7, 3, "d"), ellipse(27, 7, 3, 3, "d"),
  hline(8, 13, 8, "d"), hline(14, 17, 5, "D"), hline(3, 16, 4, "d"),
  px(20, 4, "D"), px(16, 9, "d"), px(19, 14, "D"), px(2, 25, "D"), px(13, 28, "d"),
  hline(1, 29, 12, "E"), hline(18, 31, 12, "E"),
);

// ---------- skill icons (16x16 = 14x14 + outline) ----------
sprite("skill-radio", { w: 14, h: 14, outline: "k" },
  clip([0, 7, 14, 7], circ(7, 7, 6, "b")), clip([0, 7, 14, 7], circ(7, 7, 4, "B")),
  hline(1, 7, 12, "L"), // rim
  vline(7, 1, 6, "L"), px(7, 0, "y"), // feed
  rect(6, 11, 3, 2, "S"), hline(4, 13, 7, "K"),
  px(10, 2, "c"), px(11, 1, "c"), px(12, 3, "c"), // signal
);
sprite("skill-wrench", { w: 14, h: 14, outline: "k" },
  line(2, 12, 8, 6, "o", 3),
  line(2, 12, 5, 9, "r", 1),
  circ(9, 4, 4, "L"), circ(9, 4, 3, "W"),
  rect(9, 0, 3, 4, "_"), px(9, 4, "_"), // jaw notch
  px(7, 3, "S"),
);
sprite("skill-leaf", { w: 14, h: 14, outline: "k" },
  vline(7, 7, 6, "G"), hline(5, 12, 5, "r"),
  ellipse(4, 5, 4, 2, "g"), ellipse(10, 4, 4, 3, "g"),
  hline(2, 5, 5, "G"), hline(8, 4, 5, "G"), px(3, 4, "W"), px(9, 2, "W"),
);

// ---------- mission cards (64x40, opaque) ----------
const stars = (list) => list.map(([x, y]) => px(x, y, "W"));
sprite("card-storm", { w: 64, h: 40 },
  rect(0, 0, 64, 31, "n"), grad(0, 18, 64, 13, "nRr", "v", 0.7),
  ...stars([[4, 4], [12, 9], [20, 3], [27, 8], [9, 14], [33, 4]]),
  // sun + flare arc
  clip([0, 0, 64, 12], ring(36, 12, 9, "y")), clip([0, 0, 64, 12], ring(36, 12, 8, "o")),
  circ(48, 13, 11, "o"), circ(48, 13, 9, "y"), circ(45, 10, 3, "W"),
  // ground
  rect(0, 31, 64, 9, "r"), ellipse(20, 33, 30, 3, "o"), ellipse(52, 36, 20, 3, "R"),
  hline(0, 31, 64, "o"),
  // habitat
  clip([0, 0, 64, 31], circ(15, 31, 9, "L")), clip([0, 0, 64, 31], circ(13, 29, 6, "W")),
  rect(24, 25, 8, 7, "S"), rect(25, 24, 6, 1, "L"), rect(26, 27, 2, 5, "K"),
  vline(31, 18, 7, "S"), px(31, 17, "y"), // antenna
  rect(12, 28, 3, 3, "K"), rect(13, 29, 1, 2, "y"), // door light
  hline(4, 35, 12, "R"), rect(40, 33, 4, 2, "R"),
);
sprite("card-dust", { w: 64, h: 40 },
  rect(0, 0, 64, 40, "D"), grad(0, 0, 64, 40, "dDDE", "v", 0.8),
  circ(46, 11, 8, "d"), circ(46, 11, 6, "W"), // dim sun in the haze
  // panels (poles + angled boards)
  ...[1, 22, 43].flatMap((x) => [
    poly([x, 29, x + 16, 29, x + 19, 15, x + 3, 15], "k"),
    poly([x + 1, 28, x + 15, 28, x + 18, 16, x + 4, 16], "B"),
    poly([x + 1, 28, x + 15, 28, x + 16, 23, x + 2, 23], "b"),
    line(x + 10, 16, x + 8, 28, "n"), hline(x + 2, 22, 16, "n"),
    vline(x + 8, 29, 4, "S"),
  ]),
  // dust drifts burying the lower half
  poly([0, 30, 8, 25, 20, 28, 34, 24, 48, 27, 64, 23, 64, 40, 0, 40], "d"),
  poly([0, 35, 14, 32, 30, 36, 46, 32, 64, 35, 64, 40, 0, 40], "D"),
  hline(0, 38, 64, "E"),
  // wind streaks
  hline(2, 8, 14, "d"), hline(22, 14, 10, "d"), hline(4, 19, 8, "D"), hline(52, 6, 10, "d"), hline(40, 22, 12, "d"),
  hline(30, 30, 12, "W"), hline(10, 33, 9, "W"),
);
sprite("card-moon", { w: 64, h: 40 },
  rect(0, 0, 64, 40, "k"),
  ...stars([[3, 3], [10, 8], [18, 4], [28, 10], [40, 3], [55, 6], [60, 14], [34, 7], [6, 15]]),
  // Earth, low on the horizon
  circ(50, 15, 5, "B"), circ(50, 15, 4, "b"), rect(48, 13, 3, 2, "g"), px(52, 17, "g"), px(50, 12, "W"), px(51, 12, "W"),
  // ridge
  poly([0, 26, 10, 20, 20, 24, 34, 18, 46, 24, 56, 21, 64, 24, 64, 40, 0, 40], "M"),
  poly([0, 28, 12, 25, 26, 29, 40, 26, 64, 29, 64, 40, 0, 40], "m"),
  poly([0, 26, 10, 20, 14, 22, 8, 26], "L"), poly([20, 24, 34, 18, 37, 20, 26, 25], "L"),
  // long black shadows to the left
  poly([34, 18, 36, 19, 22, 40, 4, 40], "k"), poly([10, 20, 12, 21, 0, 34, 0, 29], "k"),
  poly([56, 21, 58, 22, 52, 40, 36, 40], "k"),
  // dark crater
  ellipse(46, 32, 11, 4, "M"), ellipse(46, 33, 9, 3, "K"), hline(40, 29, 12, "L"), hline(40, 31, 12, "k"), px(36, 32, "L"),
);

// ---------- Pip, the assistant drone (30x30 + outline = 32x32; same body as hub.px.js) ----------
sprite("_pipbody", { w: 30, h: 30 },
  ellipse(15, 15, 9, 7, "L"), ellipse(15, 13, 8, 5, "W"), ellipse(15, 18, 8, 3, "S", true),
  rect(10, 12, 11, 6, "n"), rect(11, 13, 9, 4, "K"),
  rect(12, 14, 2, 2, "c"), rect(17, 14, 2, 2, "c"), hline(14, 16, 3, "c"),
  vline(15, 3, 4, "S"), px(15, 2, "o"),
  rect(1, 11, 5, 2, "S"), rect(25, 11, 5, 2, "S"), hline(0, 10, 7, "b"), hline(24, 10, 7, "b"),
);
const flames = [
  [rect(13, 22, 5, 1, "b"), rect(14, 23, 3, 1, "c"), px(15, 24, "W")],
  [rect(13, 22, 5, 1, "b"), rect(14, 23, 3, 2, "c"), px(15, 25, "y")],
  [rect(14, 22, 3, 1, "b"), px(15, 23, "c")],
  [rect(13, 22, 5, 1, "b"), rect(14, 23, 3, 1, "c"), px(15, 24, "y")],
];
[0, 1, 2, 1].forEach((dy, i) =>
  sprite(`pip-fly-${i + 1}`, { w: 30, h: 30, outline: "k" }, stamp("_pipbody", 0, dy), stamp(`_flame${i}`, 0, dy)));
flames.forEach((ops, i) => sprite(`_flame${i}`, { w: 30, h: 30 }, ...ops));

// ---------- briefing planets (48x48 = 46x46 + outline) ----------
sprite("briefing-planet-mars", { w: 46, h: 46, outline: "k" },
  circ(23, 23, 22, "r"),
  clip([23, 23, 22], circ(20, 20, 20, "o")),
  clip([23, 23, 22], circ(17, 17, 14, "d")),
  clip([23, 23, 22], ellipse(24, 28, 9, 4, "R")), clip([23, 23, 22], ellipse(32, 33, 6, 3, "R")),
  clip([23, 23, 22], ellipse(13, 24, 4, 2, "r")),
  clip([23, 23, 22], ellipse(23, 3, 7, 3, "W")), // polar cap
  clip([23, 23, 22], circ(14, 38, 5, "r")), ring(14, 38, 4, "R"), // crater
  shade((x, y) => (x - 14) ** 2 + (y - 14) ** 2 > 30 ** 2), // night side, bottom right
);
sprite("briefing-planet-moon", { w: 46, h: 46, outline: "k" },
  circ(23, 23, 22, "M"),
  clip([23, 23, 22], circ(20, 20, 20, "L")),
  clip([23, 23, 22], circ(17, 17, 13, "W")),
  clip([23, 23, 22], ellipse(28, 27, 8, 6, "S")), clip([23, 23, 22], ellipse(28, 28, 7, 5, "m")),
  clip([23, 23, 22], circ(12, 30, 4, "S")), clip([23, 23, 22], circ(34, 12, 3, "S")),
  clip([23, 23, 22], circ(10, 17, 2, "M")),
  clip([23, 23, 22], circ(36, 36, 5, "M")),
  shade((x, y) => (x - 14) ** 2 + (y - 14) ** 2 > 30 ** 2),
);
