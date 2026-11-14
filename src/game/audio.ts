import { create } from "zustand";
import manifest from "../../public/audio/audio-manifest.json";
export interface AudioPreferences {
  master: number;
  music: number;
  sfx: number;
  muted: boolean;
}
// Music (ambience loops, 1–3 MB each) is off by default so cheap phones never download it unasked.
const defaults: AudioPreferences = {
  master: 0.7,
  music: 0,
  sfx: 0.7,
  muted: false,
};
function readPreferences(): AudioPreferences {
  try {
    const saved = JSON.parse(localStorage.getItem("sol:audio") ?? "{}");
    const volume = (key: "master" | "music" | "sfx") =>
      typeof saved[key] === "number" && Number.isFinite(saved[key])
        ? Math.max(0, Math.min(1, saved[key]))
        : defaults[key];
    return {
      master: volume("master"),
      music: volume("music"),
      sfx: volume("sfx"),
      muted: saved.muted === true,
    };
  } catch {
    return defaults;
  }
}
export const useAudio = create<AudioPreferences>(() => readPreferences());

type Kind = "music" | "sfx";
interface Sound {
  url: string;
  volume: number;
}
/** Every manifest id and alias → file. The one place game ids map to sounds (aliases live in the manifest). */
export const sounds = new Map<string, Sound>();
for (const s of manifest.sounds as {
  id: string;
  path: string;
  /** Smaller compressed copy (big loops only); the WAV stays the source of truth. */
  web?: string;
  volume: number;
  aliases?: string[];
}[]) {
  const sound = {
    url: import.meta.env.BASE_URL + (s.web ?? s.path).slice(1),
    volume: s.volume,
  };
  sounds.set(s.id, sound);
  for (const alias of s.aliases ?? []) sounds.set(alias, sound);
}
/** Small, frequent sounds fetched on the first tap; everything else loads the first time it plays. */
const PRELOAD = [
  "menu-hover",
  "menu-select",
  "menu-back",
  "menu-open",
  "player-step-metal-1",
  "player-step-metal-2",
  "console-activate",
  "console-button",
  "npc-confirm",
  "astronaut-select",
  "job-assign",
  "job-remove",
  "mute",
  "unmute",
];

let ctx: AudioContext | undefined;
let master: GainNode, buses: Record<Kind, GainNode>;
const buffers = new Map<string, Promise<AudioBuffer | undefined>>();
const lastPlayed = new Map<string, number>();
let stepFlip = false;
let musicId: string | undefined;
let musicSource: Promise<AudioBufferSourceNode | undefined> | undefined;

/** Web Audio context, created only from a user gesture (browsers block audio before one). jsdom has none. */
function context(create: boolean) {
  const Ctor =
    typeof window === "undefined"
      ? undefined
      : (window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext);
  if (!ctx && create && Ctor) {
    ctx = new Ctor();
    master = ctx.createGain();
    master.connect(ctx.destination);
    buses = { sfx: ctx.createGain(), music: ctx.createGain() };
    buses.sfx.connect(master);
    buses.music.connect(master);
    syncVolumes();
  }
  if (ctx?.state === "suspended") void ctx.resume().catch(() => {});
  return ctx;
}
function load(url: string) {
  let buffer = buffers.get(url);
  if (!buffer && ctx) {
    const c = ctx;
    buffer = fetch(url)
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(url))))
      .then((data) => c.decodeAudioData(data))
      .catch(() => {
        buffers.delete(url);
        return undefined;
      });
    buffers.set(url, buffer);
  }
  return buffer ?? Promise.resolve(undefined);
}
const audible = (kind: Kind, p = useAudio.getState()) =>
  !p.muted && p.master * p[kind] > 0;
function syncVolumes() {
  if (!ctx) return;
  const p = useAudio.getState();
  // A short delay on mute lets the "mute" blip finish.
  master.gain.setValueAtTime(
    p.muted ? 0 : p.master,
    ctx.currentTime + (p.muted ? 0.2 : 0),
  );
  buses.sfx.gain.setValueAtTime(p.sfx, ctx.currentTime);
  buses.music.gain.setValueAtTime(p.music, ctx.currentTime);
  startMusic();
}
useAudio.subscribe((prefs) => {
  try {
    localStorage.setItem("sol:audio", JSON.stringify(prefs));
  } catch {
    /* optional storage */
  }
  syncVolumes();
});

function play(id: string, kind: Kind) {
  const sound = sounds.get(id);
  const c = context(false); // created only by the gesture listener below
  if (!sound || !c || !audible(kind)) return;
  const asked = performance.now();
  return load(sound.url).then((buffer) => {
    // A one-shot that arrives late on a slow network would no longer match what the kid did.
    if (!buffer || (kind === "sfx" && performance.now() - asked > 400)) return;
    const source = c.createBufferSource();
    const gain = c.createGain();
    source.buffer = buffer;
    source.loop = kind === "music";
    gain.gain.value = sound.volume;
    source.connect(gain).connect(buses[kind]);
    source.start();
    return source;
  });
}
function startMusic() {
  if (!musicId || musicSource || !ctx || !audible("music")) return;
  const wanted = musicId;
  musicSource = play(wanted, "music")?.then((s) => {
    if (musicId !== wanted) s?.stop();
    return s;
  });
}

/** Create/resume the context and preload the UI set. Must run inside a user gesture. */
function unlock() {
  const first = !ctx;
  if (context(true) && first) {
    for (const id of PRELOAD) void load(sounds.get(id)!.url);
    startMusic();
  }
}
if (typeof window !== "undefined")
  for (const type of ["pointerdown", "keydown", "touchend", "click"])
    window.addEventListener(type, unlock, { capture: true, passive: true });

/** Original 8-bit sounds from public/audio (see docs/audio.md). Never autoplays: nothing sounds before the first tap. */
export const audio = {
  unlock,
  playSfx: (id: string, gapMs = id === "volume-change" ? 150 : 70) => {
    if (id === "step")
      id = (stepFlip = !stepFlip)
        ? "player-step-metal-1"
        : "player-step-metal-2";
    const now = performance.now();
    if (now - (lastPlayed.get(id) ?? -Infinity) < gapMs) return; // no stacking of the same blip
    lastPlayed.set(id, now);
    void play(id, "sfx");
  },
  /** Remembers the loop and starts it once audio is unlocked and the music volume is above zero. */
  playMusic: (id: string) => {
    if (musicId === id) return;
    audio.stopMusic();
    musicId = id;
    startMusic();
  },
  stopMusic: () => {
    musicId = undefined;
    void musicSource?.then((s) => s?.stop());
    musicSource = undefined;
  },
  mute: (muted: boolean) => {
    if (muted) audio.playSfx("mute");
    useAudio.setState({ muted });
    if (!muted) audio.playSfx("unmute");
  },
};
