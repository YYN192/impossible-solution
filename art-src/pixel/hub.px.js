// Mars hub art for "The Impossible SOLution" — built with pxl (tools/claude-pxl).
// Sprite names = file basenames in src/assets/pixel/asset-manifest.json; art-src/pixel/export.mjs copies them there.
// Original art: top-down 16-bit style, 1px ink outlines, palette from src/assets/pixel/palette.json + a few in-between shades.

pal({
  k: "#080B12", // ink (outlines)
  // swap placeholders, recoloured per crew member (see CREW)
  a: "#F0C7A0",
  A: "#D49B78",
  x: "#D86E3B",
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
  y: "#E6BD5D", // yellow
  Y: "#B48A35", // yellow shade
  t: "#4BB8B0", // teal
  g: "#65BF83", // green
  G: "#3E8A5C", // green shade
  // floor tones: deliberately close together so the floor stays calm
  1: "#161C27", // seam
  2: "#1D2430", // plate
  3: "#232B38", // plate light
  4: "#2B3443", // edge highlight
  5: "#121821", // grate hole
  // faces (generic cartoon, three skin tones)
  f: "#F0C7A0",
  F: "#D49B78",
  p: "#B97A55",
  P: "#8E5A3D",
  q: "#7A4E35",
  Q: "#5C3826",
  e: "#1B1630", // eyes
  m: "#C9665A", // mouth / cheeks
});
ramps("k1234", "kKSLW", "kBbc", "rof", "YyW", "GgW");

// ---------- floors (16x16, tile seamlessly) ----------
// Deck plates in running bond (16x8 rows offset by 8): reads as a floor, not as boxes.
const deck = [
  rect(0, 0, 16, 16, "2"),
  hline(0, 0, 16, "1"),
  hline(0, 8, 16, "1"),
  vline(0, 0, 8, "1"),
  vline(8, 8, 8, "1"),
  hline(1, 1, 15, "3"),
  hline(0, 9, 8, "3"),
  hline(9, 9, 7, "3"), // lit top lip of each plate
];
sprite(
  "mars-floor-metal",
  { w: 16, h: 16 },
  ...deck,
  px(3, 4, "3"),
  px(12, 4, "3"),
  px(4, 12, "3"),
  px(11, 12, "3"),
); // rivets, barely there
sprite(
  "mars-floor-panel",
  { w: 16, h: 16 },
  ...deck,
  // tread pattern: short diagonal bumps, one shade up — texture, not a box
  (c) => {
    for (let y = 2; y < 16; y += 3)
      for (let x = (y % 2) * 2 + 1; x < 16; x += 4)
        if (
          y !== 8 &&
          y !== 9 &&
          !c.is(x, y, "1") &&
          !c.is(x + 1, y - 1, "1")
        ) {
          c.px(x, y, "3");
          c.px(x + 1, y - 1, "3");
        }
  },
);
// Walkway grating: darker, regular 4px mesh; tiles both ways.
sprite(
  "mars-floor-reinforced",
  { w: 16, h: 16 },
  rect(0, 0, 16, 16, "3"),
  (c) => {
    // long slots, offset every other row: reads as walkway grating, not as boxes
    for (let y = 1; y < 16; y += 4) {
      const o = y % 8 === 1 ? 0 : 8;
      for (const x of [o + 1, o - 7, o + 9]) { c.hline(x, y, 6, "5"); c.hline(x, y + 1, 6, "1"); }
    }
  },
);
// Guide-light strip across the room: dark channel with glowing dashes.
sprite(
  "mars-floor-blue-strip",
  { w: 16, h: 16 },
  rect(0, 0, 16, 16, "3"),
  (c) => {
    for (const x of [1, 9]) { c.hline(x, 1, 6, "5"); c.hline(x, 2, 6, "1"); c.hline(x, 13, 6, "5"); c.hline(x, 14, 6, "1"); }
  },
  rect(0, 5, 16, 6, "1"),
  hline(0, 5, 16, "K"),
  hline(0, 10, 16, "4"),
  rect(1, 7, 6, 2, "b"),
  rect(9, 7, 6, 2, "b"),
  hline(2, 7, 4, "c"),
  hline(10, 7, 4, "c"),
);

// ---------- walls (16x16) ----------
sprite(
  "mars-wall-straight",
  { w: 16, h: 16 },
  rect(0, 0, 16, 16, "K"),
  hline(0, 0, 16, "L"),
  hline(0, 1, 16, "S"),
  rect(0, 2, 16, 10, "K"),
  vline(7, 3, 8, "1"),
  vline(8, 3, 8, "S"),
  hline(0, 12, 16, "S"),
  rect(0, 13, 16, 3, "1"),
  hline(0, 15, 16, "k"),
);
sprite(
  "mars-wall-bottom-edge",
  { w: 16, h: 16 },
  rect(0, 0, 16, 16, "K"),
  hline(0, 0, 16, "k"),
  hline(0, 1, 16, "S"),
  hline(0, 2, 16, "L"),
  rect(0, 3, 16, 13, "K"),
  hline(0, 8, 16, "1"),
  vline(7, 3, 5, "1"),
);
sprite(
  "mars-wall-left-edge",
  { w: 16, h: 16 },
  rect(0, 0, 16, 16, "K"),
  vline(0, 0, 16, "k"),
  vline(9, 0, 16, "S"),
  vline(10, 0, 16, "L"),
  vline(11, 0, 16, "1"),
  hline(1, 7, 8, "1"),
);
sprite("mars-wall-right-edge", { base: "mars-wall-left-edge", flip: "x" });

// ---------- crew (32x32: draw on 30x30, outline grows it to 32) ----------
const sym = (s) =>
  s
    .trim()
    .split("\n")
    .map((r) => {
      r = r.trim();
      return r + [...r].reverse().join("");
    })
    .join("\n");
// Face window keys: a = skin, A = skin shade. Suit: W main, L shade, S deep; x = accent.
const FRONT_TOP = sym(`
...........WWWW
.........WWWWWW
........WWWWWWW
.......WWWWWWWW
.......WLLLLLLL
.......WLaaaaaa
.......WLaaekaa
.......WLmaekaa
.......WLaaaaaA
.......WLLLLLLL
........WWWWWWW
.........SSSSSS
.......WWWWWWWW
......LWWWWLLLL
......LWWWWLcbL
......LWWWWLLLL
......LWWWWWWWW
......SLxxxxxxx
.......LWWWWWWW`);
const BACK_TOP = sym(`
...........WWWW
.........WWWWWW
........WWWWWWW
.......WWWWWWWW
.......WWWWWWWW
.......WWWWWWWW
.......WWWWWWWW
.......LWWWWWWW
.......LWWWWWWW
.......LLWWWWWW
........LLLLLLL
.........SSSSSS
.......WLSSSSSS
......LWLSLLLLL
......LWLSLLcLL
......LWLSLLLLL
......LWLSSSSSS
......SLxxxxxxx
.......LWWWWWWW`);
// Right-facing profile (left = flip). Visor on the right, life-support pack on the left.
const SIDE_TOP = `
.............WWWWW
...........WWWWWWWWW
..........WWWWWWWWWWW
.........WWWWWWWLLLLLLW
.........WWWWWWLaaaaaLW
.........WWWWWWLaaeaaLW
.........WWWWWWLaaeaaLW
.........LWWWWWLaaaAALW
.........LWWWWWLLLLLLLW
..........LLWWWWWWWWWL
...........SSSSSSSS
........SSSWWWWWWWWW
........SLSWWLLLLWWW
........SLSWLWWWWLWW
........SLSWLWWWWLWW
........SLSWLWWWWLWW
........SSSWWLSSLWW
...........xxxxxxxxx
...........WWWWWWWWW`;

// legs: [leftLegLift, rightLegLift] in px; front/back use two legs, side uses stride
function legs(view, step) {
  return (c) => {
    const Y = 21;
    if (view === "side") {
      const s = [0, 2, 0, -2][step]; // stride offset
      const leg = (x, lift, shade) => {
        c.rect(x, Y, 4, 3 - lift, shade ? "L" : "W");
        c.rect(x, Y + 3 - lift, 4, 1, "L");
        c.rect(x, Y + 4 - lift, 5, 2, "S");
      };
      leg(12 - s, 0, true); // far leg, shaded
      leg(15 + s, s !== 0 ? 1 : 0, false);
      return;
    }
    const lift =
      view === "idle"
        ? [0, 0]
        : [
            [1, 0],
            [0, 0],
            [0, 1],
            [0, 0],
          ][step];
    for (const [i, x] of [
      [0, 9],
      [1, 16],
    ]) {
      const l = lift[i];
      c.rect(x, Y, 5, 3 - l, "W");
      c.rect(x, Y + 3 - l, 5, 1, "L");
      c.rect(x + (i ? 0 : -1), Y + 4 - l, 6, 2, "S");
    }
  };
}
function body(top, view, step, bob = 0) {
  return [grid(0, 2 + bob, top), legs(view, step)];
}

// crew palettes: suit W/L/S, accent x, skin a/A
const CREW = {
  astronaut: { W: "W", L: "L", S: "S", x: "o", a: "f", A: "F" },
  "mission-commander": { W: "b", L: "B", S: "K", x: "y", a: "p", A: "P" },
  engineer: { W: "o", L: "r", S: "K", x: "y", a: "f", A: "F" },
  scientist: { W: "g", L: "G", S: "K", x: "W", a: "q", A: "Q" },
};
const DIRS = { front: FRONT_TOP, back: BACK_TOP, right: SIDE_TOP };
function person(name, dir, step, extra = []) {
  const crew = name.startsWith("astronaut")
    ? CREW.astronaut
    : CREW[name.replace(/-idle.*/, "")];
  const d = dir === "left" ? "right" : dir;
  const view = d === "right" ? "side" : step === undefined ? "idle" : "walk";
  const bob = step === 1 || step === 3 ? 1 : 0;
  return [
    {
      w: 30,
      h: 30,
      outline: "k",
      swap: crew,
      flip: dir === "left" ? "x" : undefined,
    },
    ...body(DIRS[d], view, step ?? 0, bob),
    ...extra.flatMap((f) => f(d, bob)),
  ];
}
// Distinct silhouettes: commander antenna + chevron, engineer headlamp + tool belt, scientist sample pouch.
const ANTENNA = (d, b) =>
  d === "right"
    ? [vline(14, b, 3, "S"), px(14, b, "y")]
    : [vline(18, b, 3, "S"), px(18, b, "y")];
const CHEVRON = (d, b) =>
  d === "front" ? [px(10, 16 + b, "y"), px(11, 17 + b, "y")] : [];
const LAMP = (d, b) =>
  d === "front"
    ? [rect(14, 3 + b, 2, 2, "y")]
    : d === "right"
      ? [rect(17, 3 + b, 2, 2, "y")]
      : [rect(14, 3 + b, 2, 1, "Y")];
const BELT = (d, b) =>
  d === "right"
    ? [rect(12, 19 + b, 3, 2, "S")]
    : [rect(8, 19 + b, 2, 2, "S"), rect(20, 19 + b, 2, 2, "S")];
const POUCH = (d, b) =>
  d === "back"
    ? []
    : d === "right"
      ? [rect(16, 18 + b, 3, 3, "c"), hline(16, 18 + b, 3, "W")]
      : [rect(19, 17 + b, 3, 3, "c"), hline(19, 17 + b, 3, "W")];
const EXTRAS = {
  "mission-commander": [ANTENNA, CHEVRON],
  engineer: [LAMP, BELT],
  scientist: [POUCH],
};

for (const dir of ["front", "back", "left", "right"]) {
  sprite(`astronaut-idle-${dir}`, ...person("astronaut", dir));
  for (let i = 0; i < 4; i++)
    sprite(`astronaut-walk-${dir}-${i + 1}`, ...person("astronaut", dir, i));
  for (const who of Object.keys(EXTRAS))
    sprite(`${who}-idle-${dir}`, ...person(who, dir, undefined, EXTRAS[who]));
}

// ---------- portraits (48x48) ----------
function portrait(who, ring, ringShade, extra = []) {
  const s = CREW[who];
  return sprite(
    `${who}-portrait`,
    { w: 48, h: 48, swap: s },
    circ(24, 24, 23, "k"),
    circ(24, 24, 22, ringShade),
    circ(24, 24, 20, ring),
    circ(24, 24, 18, "n"),
    clip(
      [24, 24, 18],
      rect(0, 36, 48, 12, "W"),
      rect(0, 36, 48, 2, "L"),
      rect(18, 38, 12, 3, "x"),
    ), // shoulders
    ellipse(24, 22, 13, 12, "k"),
    ellipse(24, 22, 12, 11, "W"),
    ellipse(24, 25, 12, 8, "L", true), // helmet
    rect(15, 16, 18, 12, "L"),
    rect(16, 17, 16, 10, "a"),
    rect(16, 26, 16, 1, "A"), // face window
    rect(19, 20, 2, 3, "e"),
    rect(27, 20, 2, 3, "e"),
    px(19, 20, "W"),
    px(27, 20, "W"), // eyes with sparkle
    hline(22, 24, 4, "A"),
    hline(23, 25, 2, "m"),
    px(18, 24, "m"),
    px(29, 24, "m"), // smile + cheeks
    line(17, 17, 19, 17, "c"),
    px(17, 18, "c"), // glass glint
    ...extra,
  );
}
portrait("mission-commander", "b", "B", [
  vline(24, 6, 5, "S"),
  rect(23, 4, 3, 2, "y"),
  px(20, 39, "y"),
  px(21, 40, "y"),
]);
portrait("engineer", "o", "r", [
  rect(22, 11, 4, 3, "y"),
  hline(22, 11, 4, "W"),
]);
portrait("scientist", "g", "G", [
  rect(30, 37, 4, 4, "c"),
  hline(30, 37, 4, "W"),
]);

// ---------- assistant drone ----------
const droneBody = [
  ellipse(15, 15, 9, 7, "L"),
  ellipse(15, 13, 8, 5, "W"),
  ellipse(15, 18, 8, 3, "S", true),
  rect(10, 12, 11, 6, "n"),
  rect(11, 13, 9, 4, "K"), // screen face
  rect(12, 14, 2, 2, "c"),
  rect(17, 14, 2, 2, "c"),
  hline(14, 16, 3, "c"), // happy eyes + smile
  vline(15, 3, 4, "S"),
  px(15, 2, "o"), // antenna
  rect(1, 11, 5, 2, "S"),
  rect(25, 11, 5, 2, "S"),
  hline(0, 10, 7, "b"),
  hline(24, 10, 7, "b"), // rotor arms
];
sprite(
  "assistant-drone",
  { w: 30, h: 30, outline: "k" },
  ...droneBody,
  rect(13, 22, 5, 1, "b"),
  rect(14, 23, 3, 1, "c"),
); // thruster glow
// pxl has no scale op, so the portrait re-draws the drone at 1.5x by hand:
sprite(
  "assistant-drone-portrait",
  { w: 48, h: 48 },
  rect(0, 0, 48, 48, "c"),
  rect(1, 1, 46, 46, "n"),
  circ(24, 26, 17, "K"),
  ellipse(24, 26, 15, 11, "k"),
  ellipse(24, 26, 14, 10, "L"),
  ellipse(24, 24, 13, 8, "W"),
  rect(15, 21, 19, 10, "k"),
  rect(16, 22, 17, 8, "n"),
  rect(19, 24, 3, 3, "c"),
  rect(27, 24, 3, 3, "c"),
  px(19, 24, "W"),
  px(27, 24, "W"),
  hline(22, 28, 5, "c"),
  vline(24, 7, 7, "S"),
  rect(23, 5, 3, 2, "o"),
  rect(2, 19, 9, 3, "S"),
  rect(38, 19, 9, 3, "S"),
  hline(2, 18, 9, "b"),
  hline(38, 18, 9, "b"),
  rect(20, 38, 9, 2, "b"),
  rect(22, 40, 5, 1, "c"),
);

// ---------- mission console (64x64; drawn over the console bay) ----------
function console(state) {
  const lit = state !== "inactive",
    hi = state === "highlighted";
  return sprite(
    `mission-console-${state}`,
    { w: 64, h: 64 },
    // desk body in 3/4 view: monitor back, sloped deck, front panel
    rect(4, 2, 56, 34, "k"),
    rect(5, 3, 54, 32, hi ? "L" : "S"),
    rect(7, 5, 50, 28, "k"),
    rect(8, 6, 48, 26, lit ? "n" : "5"),
    ...(lit
      ? [
          // screen: Mars outline, orbit and a bar chart = "plan the mission"
          circ(20, 19, 8, "r"),
          circ(19, 18, 7, "o"),
          px(16, 15, "y"),
          px(22, 21, "r"),
          ring(20, 19, 11, "B"),
          px(31, 19, "c"),
          rect(36, 22, 3, 6, "b"),
          rect(41, 18, 3, 10, "c"),
          rect(46, 14, 3, 14, hi ? "y" : "b"),
          rect(51, 20, 3, 8, "t"),
          hline(35, 29, 20, "S"),
          text(36, 8, "PLAN", hi ? "y" : "c"),
        ]
      : [px(12, 10, "S"), hline(12, 12, 4, "1")]),
    rect(2, 36, 60, 4, "k"),
    rect(3, 36, 58, 3, "L"),
    hline(3, 36, 58, "W"), // deck lip
    poly([2, 40, 62, 40, 60, 52, 4, 52], "k"),
    poly([3, 40, 61, 40, 59, 51, 5, 51], "K"), // sloped keyboard deck
    (c) => {
      for (let i = 0; i < 6; i++)
        c.rect(9 + i * 8, 43, 6, 2, i % 2 ? "S" : "4");
    },
    rect(12, 47, 8, 2, lit ? "g" : "S"),
    rect(24, 47, 16, 2, "S"),
    rect(44, 47, 8, 2, lit ? (hi ? "y" : "o") : "S"),
    rect(4, 52, 56, 9, "k"),
    rect(5, 52, 54, 8, "K"),
    hline(5, 52, 54, "S"), // front panel
    rect(10, 55, 3, 2, lit ? "c" : "1"),
    rect(16, 55, 3, 2, lit ? "b" : "1"),
    rect(48, 55, 6, 2, "S"),
    rect(6, 61, 52, 2, "1"), // contact shadow
    ...(hi ? [box(0, 0, 64, 64, "c"), box(1, 1, 62, 62, "y")] : []),
  );
}
console("active");
console("highlighted");
// "inactive" blinks in for 1 of every 4 beats, so it is the same screen dimmed (a soft pulse, not a blackout)
sprite("mission-console-inactive", { base: "mission-console-active" },
  recolor({ o: "r", r: "P", y: "Y", c: "B", b: "B", t: "G", B: "K" }, [8, 6, 48, 26]),
  recolor({ g: "S", o: "S", c: "1", b: "1" }, [4, 44, 56, 16]));

// ---------- supply crate (16x16, shown at 2x) ----------
sprite(
  "mars-crate",
  { w: 14, h: 14, outline: "k" },
  rect(0, 0, 14, 5, "y"),
  hline(0, 0, 14, "W"),
  rect(0, 4, 14, 1, "Y"), // lid (top face)
  rect(0, 5, 14, 9, "o"),
  rect(0, 12, 14, 2, "r"), // front face
  vline(3, 5, 9, "r"),
  vline(10, 5, 9, "r"), // straps
  rect(5, 7, 4, 3, "W"),
  hline(5, 9, 4, "L"),
  px(6, 8, "b"),
  px(7, 8, "b"), // label
  px(1, 2, "Y"),
  px(12, 2, "Y"),
);
