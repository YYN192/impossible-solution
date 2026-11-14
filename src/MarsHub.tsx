import { useEffect, useRef, useState } from "react";
import astronautUrl from "./assets/pixel/astronaut.png";

const W = 640,
  H = 400,
  speed = 145,
  posKey = "mars-player-position";
type Point = { x: number; y: number };
const consoleBox = { x: 482, y: 143, w: 88, h: 72 };
const blocks = [
  { x: 115, y: 108, w: 74, h: 68 },
  { x: 254, y: 85, w: 62, h: 92 },
  { x: 363, y: 250, w: 100, h: 52 },
  { x: 90, y: 270, w: 92, h: 44 },
];
const dist = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

export default function MarsHub() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nearConsole, setNearConsole] = useState(false);
  const [message, setMessage] = useState(
    "Welcome to Ares Station. Find the planning console.",
  );
  const messageTimer = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current!,
      ctx = canvas.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;
    const sprite = new Image();
    sprite.src = astronautUrl;
    const saved = sessionStorage.getItem(posKey);
    const player: Point = saved
      ? (JSON.parse(saved) as Point)
      : { x: 70, y: 200 };
    const keys = new Set<string>();
    let frame = 0,
      last = performance.now(),
      alive = true;
    const obstacles = [...blocks, { ...consoleBox }];
    const overlaps = (x: number, y: number) =>
      obstacles.some(
        (o) =>
          x + 9 > o.x && x - 9 < o.x + o.w && y + 8 > o.y && y - 8 < o.y + o.h,
      );
    const onDown = (e: KeyboardEvent) => {
      if (
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)
      )
        e.preventDefault();
      keys.add(e.key.toLowerCase());
    };
    const onUp = (e: KeyboardEvent) => keys.delete(e.key.toLowerCase());
    const draw = (now: number) => {
      if (!alive) return;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      frame += dt * 10;
      let dx =
        Number(keys.has("d") || keys.has("arrowright")) -
        Number(keys.has("a") || keys.has("arrowleft"));
      let dy =
        Number(keys.has("s") || keys.has("arrowdown")) -
        Number(keys.has("w") || keys.has("arrowup"));
      if (dx && dy) {
        dx *= Math.SQRT1_2;
        dy *= Math.SQRT1_2;
      }
      if (dx || dy) {
        const nx = Math.max(18, Math.min(W - 18, player.x + dx * speed * dt)),
          ny = Math.max(28, Math.min(H - 20, player.y + dy * speed * dt));
        if (!overlaps(nx, player.y)) player.x = nx;
        if (!overlaps(player.x, ny)) player.y = ny;
      }
      const close =
        dist(player, {
          x: consoleBox.x + consoleBox.w / 2,
          y: consoleBox.y + consoleBox.h / 2,
        }) < 74;
      setNearConsole((previous) => (previous === close ? previous : close));
      if (keys.has("e")) {
        keys.delete("e");
        if (close) {
          sessionStorage.setItem(posKey, JSON.stringify(player));
          window.location.href = `${import.meta.env.BASE_URL}console.html`;
        } else if (dist(player, { x: 536, y: 309 }) < 58) {
          setMessage("Maintenance drone: All systems nominal, Commander.");
          window.clearTimeout(messageTimer.current);
          messageTimer.current = window.setTimeout(() => setMessage(""), 3600);
        }
      }
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#101a2b";
      ctx.fillRect(0, 0, W, H);
      for (let y = 8; y < H; y += 32)
        for (let x = 8; x < W; x += 32) {
          ctx.fillStyle = (x / 32 + y / 32) % 2 ? "#131f31" : "#162337";
          ctx.fillRect(x, y, 30, 30);
        }
      ctx.fillStyle = "#252c38";
      ctx.fillRect(0, 0, W, 22);
      ctx.fillRect(0, H - 12, W, 12);
      ctx.fillRect(0, 0, 12, H);
      ctx.fillRect(W - 12, 0, 12, H);
      // Wall lights and window view of Mars.
      ctx.fillStyle = "#687586";
      ctx.fillRect(33, 35, 148, 55);
      ctx.fillStyle = "#080b12";
      ctx.fillRect(39, 41, 136, 43);
      ctx.fillStyle = "#252c38";
      ctx.fillRect(42, 44, 130, 37);
      ctx.fillStyle = "#4c2730";
      ctx.fillRect(45, 67, 124, 14);
      ctx.fillStyle = "#bc6349";
      ctx.fillRect(52, 72, 28, 8);
      ctx.fillRect(113, 66, 19, 11);
      ctx.fillStyle = "#83d9f4";
      ctx.fillRect(103, 44, 2, 37);
      blocks.forEach((o, i) => {
        ctx.fillStyle = "#080b12";
        ctx.fillRect(o.x + 4, o.y + 5, o.w, o.h);
        ctx.fillStyle = i % 2 ? "#252c38" : "#687586";
        ctx.fillRect(o.x, o.y, o.w, o.h);
        ctx.fillStyle = "#b8c4d0";
        ctx.fillRect(o.x + 5, o.y + 5, o.w - 10, 7);
        ctx.fillStyle = "#101a2b";
        ctx.fillRect(o.x + 7, o.y + 18, o.w - 14, o.h - 24);
        ctx.fillStyle = "#4c9ce5";
        ctx.fillRect(o.x + 12, o.y + 24, 8, 5);
      });
      // Interactive mission console.
      ctx.fillStyle = "#080b12";
      ctx.fillRect(
        consoleBox.x + 5,
        consoleBox.y + 7,
        consoleBox.w,
        consoleBox.h,
      );
      ctx.fillStyle = "#687586";
      ctx.fillRect(consoleBox.x, consoleBox.y, consoleBox.w, consoleBox.h);
      ctx.fillStyle = "#252c38";
      ctx.fillRect(
        consoleBox.x + 6,
        consoleBox.y + 6,
        consoleBox.w - 12,
        consoleBox.h - 12,
      );
      ctx.fillStyle = "#4c9ce5";
      ctx.fillRect(consoleBox.x + 15, consoleBox.y + 13, consoleBox.w - 30, 31);
      ctx.fillStyle = "#83d9f4";
      ctx.fillRect(consoleBox.x + 21, consoleBox.y + 18, 13, 3);
      ctx.fillRect(consoleBox.x + 21, consoleBox.y + 25, 31, 3);
      ctx.fillStyle = "#b8c4d0";
      ctx.fillRect(consoleBox.x + 19, consoleBox.y + 52, 6, 5);
      ctx.fillRect(consoleBox.x + 33, consoleBox.y + 52, 6, 5);
      ctx.fillRect(consoleBox.x + 47, consoleBox.y + 52, 6, 5);
      // Small maintenance drone placeholder.
      ctx.fillStyle = "#687586";
      ctx.fillRect(524, 300, 26, 19);
      ctx.fillRect(531, 292, 12, 8);
      ctx.fillStyle = "#83d9f4";
      ctx.fillRect(531, 306, 5, 4);
      ctx.fillStyle = "#080b12";
      ctx.fillRect(519, 319, 6, 5);
      ctx.fillRect(548, 319, 6, 5);
      if (sprite.complete && sprite.naturalWidth) {
        const bob = dx || dy ? Math.sin(frame) * 2 : 0;
        ctx.drawImage(
          sprite,
          Math.round(player.x - 18),
          Math.round(player.y - 26 + bob),
          36,
          48,
        );
      } else {
        ctx.fillStyle = "#4c9ce5";
        ctx.fillRect(player.x - 8, player.y - 12, 16, 24);
        ctx.fillStyle = "#e8f0f7";
        ctx.fillRect(player.x - 6, player.y - 17, 12, 9);
      }
      requestAnimationFrame(draw);
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    requestAnimationFrame(draw);
    return () => {
      alive = false;
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      window.clearTimeout(messageTimer.current);
    };
  }, []);

  return (
    <main className="hub-shell">
      <header className="hub-header">
        <button
          className="pixel-button pixel-small"
          onClick={() =>
            (window.location.href = `${import.meta.env.BASE_URL}index.html`)
          }
        >
          ← MENU
        </button>
        <div>
          <b>ARES STATION</b>
          <span className="pixel-small">MARS · HABITAT 01</span>
        </div>
        <span className="hub-status pixel-small">● LIFE SUPPORT NOMINAL</span>
      </header>
      <section className="hub-play-area">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          aria-label="Top-down pixel art Mars station. Use arrow keys or WASD to move."
        />
        <div className="hub-hud">
          <span>WASD / ARROWS · MOVE</span>
          <span>
            {nearConsole ? "E · OPEN PLANNING CONSOLE" : "EXPLORE THE HABITAT"}
          </span>
        </div>
      </section>
      <p className="hub-message" aria-live="polite">
        {message}
      </p>
      <footer className="pixel-small">
        A QUIET OUTPOST, A WHOLE NEW WORLD.
      </footer>
    </main>
  );
}
