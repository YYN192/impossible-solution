import { create } from "zustand";
import manifest from "../../public/audio/audio-manifest.json";
import { useComfort } from "../state/comfort";
export interface AudioPreferences {
  master: number;
  music: number;
  sfx: number;
  muted: boolean;
}
// Music is on at full level by default (owner's choice); Settings, the Music slider and mute still turn it down or off.
const defaults: AudioPreferences = {
  master: 0.7,
  music: 1,
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
/**
 * Music slots. The team's soundtrack drops in by manifest id (see docs/audio.md): lobby music,
 * station music, console music, and one track per mission. Until a track is in the manifest,
 * the slot plays the ambience loop that is already there.
 */
const MUSIC_SLOTS = {
  lobby: () => ["music-lobby", "space-menu-ambience"],
  // The Moon base has no Mars wind: a quiet space loop until it gets its own track.
  hub: (place?: string) => place === "moon" ? ["music-hub-moon", "moon-base-ambience"] : ["music-hub", "mars-base-ambience"],
  // A mission's own console track, except "storm": music-mission-storm is reserved for a REAL storm
  // warning (see musicDirector.ts), never the calm console of the storm campaign.
  console: (mission?: string) => [...(mission && mission !== "storm" ? [`music-mission-${mission}`] : []), "music-console", "mission-console-ambience"],
  storm: () => ["music-mission-storm"],
};
export const musicFor = (slot: keyof typeof MUSIC_SLOTS, mission?: string): string => {
  const ids: string[] = MUSIC_SLOTS[slot](mission);
  return ids.find((id) => sounds.has(id)) ?? ids[ids.length - 1];
};

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
  reconcileMusic();
}
useAudio.subscribe((prefs) => {
  try {
    localStorage.setItem("sol:audio", JSON.stringify(prefs));
  } catch {
    /* optional storage */
  }
  syncVolumes();
});

/** Calm mode (#77): warnings and alarms play at 40 % so they inform without startling. */
export const alarmFactor = (id: string, kind: Kind) =>
  kind === "sfx" && useComfort.getState().calm && /warning|alarm|burst|radiation/.test(id) ? 0.4 : 1;
/** One sound effect (music goes through the coordinator below). */
function playEffect(id: string) {
  const sound = sounds.get(id);
  const c = context(false); // created only by the gesture listener below
  if (!sound || !c || !audible("sfx")) return;
  const asked = performance.now();
  void load(sound.url).then((buffer) => {
    // A one-shot that arrives late on a slow network would no longer match what the kid did.
    if (!buffer || performance.now() - asked > 400) return;
    const source = c.createBufferSource();
    const gain = c.createGain();
    source.buffer = buffer;
    gain.gain.value = sound.volume * alarmFactor(id, "sfx");
    source.connect(gain).connect(buses.sfx);
    source.start();
  });
}

/* ───────────────────────── Background music coordinator ─────────────────────────
 * ONE place decides what plays; screens only report facts (where the player is, whether a real
 * storm is on, whether a job mini game is open). Priority, highest first:
 *   1. menu              → music-lobby, looped
 *   2. real storm        → music-mission-storm, looped; cuts in at once with a short fade
 *   3. job mini game     → music-minigames, but only at the next song boundary (a playing console
 *                          song always finishes first; closing the game before then cancels it)
 *   4. Mars base/console → whole songs of music-console / music-minigames, picked at random at each
 *                          natural end (never the same song three times in a row)
 *   The Moon base plays the same base songs (no storm song there); nothing at all when off.
 * Loops use source.loop; playlist songs play once and their `onended` picks the next. Every started
 * track is an Entry: a late load or `onended` of an entry that is no longer `playing` is ignored, so
 * stale callbacks can never bring old music back or skip ahead in the playlist.
 */
export type MusicScene = "off" | "menu" | "base" | "moon-hub";
export interface MusicIntent {
  scene: MusicScene;
  /** A real storm warning is showing or that storm is not cleared yet (see musicDirector.ts). */
  storm: boolean;
}
export type MusicPlan =
  | { kind: "none" }
  | { kind: "loop"; id: string }
  | { kind: "playlist"; tracks: string[] };
/** The theme preferred at song boundaries while a job mini game is open. */
export const MINIGAME_TRACK = "music-minigames";
const FADE_OUT = 0.4, FADE_IN = 0.3;

let intent: MusicIntent = { scene: "off", storm: false };
const openMiniGames = new Set<symbol>();
const musicHolds = new Set<symbol>();
let random = Math.random;
interface Entry {
  id: string;
  mode: "loop" | "once";
  source?: AudioBufferSourceNode;
  fade?: GainNode;
}
let playing: Entry | undefined;
/** The last base songs, newest last (for "never three in a row"). */
let recent: string[] = [];

/** Pure: what the intent asks for. Missing tracks fall back to the older ambience slots. */
export function musicPlan(i: MusicIntent, has = (id: string) => sounds.has(id)): MusicPlan {
  if (i.scene === "off") return { kind: "none" };
  if (i.scene === "menu") return { kind: "loop", id: musicFor("lobby") };
  if (i.storm && has(musicFor("storm"))) return { kind: "loop", id: musicFor("storm") };
  if (i.scene === "moon-hub") return { kind: "loop", id: musicFor("hub", "moon") };
  const tracks = [...new Set([musicFor("console"), MINIGAME_TRACK])].filter((id) => id.startsWith("music-") && has(id));
  return tracks.length ? { kind: "playlist", tracks } : { kind: "loop", id: musicFor("console") };
}

/** Pure: the next base song. A mini game open → its theme; otherwise random, never 3 times the same in a row. */
export function nextSong(tracks: string[], history: string[], miniGame: boolean, rand: () => number = Math.random): string {
  if (miniGame && tracks.includes(MINIGAME_TRACK)) return MINIGAME_TRACK;
  const [a, b] = history.slice(-2);
  const pool = tracks.length > 1 && a !== undefined && a === b ? tracks.filter((t) => t !== a) : tracks;
  return pool[Math.min(pool.length - 1, Math.floor(rand() * pool.length))];
}

function stopPlaying(fade = FADE_OUT) {
  const entry = playing;
  playing = undefined;
  if (!entry?.source || !entry.fade || !ctx) return; // still loading: its load sees it is no longer `playing`
  const now = ctx.currentTime;
  const g = entry.fade.gain;
  g.cancelScheduledValues(now);
  g.setValueAtTime(g.value, now);
  g.linearRampToValueAtTime(0, now + fade);
  const { source, fade: node } = entry;
  try { source.stop(now + fade); } catch { /* already ended */ }
  // Belt and braces: once the fade is over, cut it off for sure (a held-up stop() must never leave a storm loop playing).
  setTimeout(() => { try { source.stop(); } catch { /* already ended */ } node.disconnect?.(); }, fade * 1000 + 50);
}

function startTrack(id: string, mode: Entry["mode"]) {
  const sound = sounds.get(id);
  const c = ctx;
  if (!sound || !c) return;
  const entry: Entry = { id, mode };
  playing = entry;
  void load(sound.url).then((buffer) => {
    if (playing !== entry) return; // stopped, muted or replaced while loading
    if (!buffer) { playing = undefined; return; } // missing or broken file: stay quiet, the game goes on
    const source = c.createBufferSource();
    const fade = c.createGain();
    source.buffer = buffer;
    source.loop = mode === "loop";
    fade.gain.setValueAtTime(0, c.currentTime);
    fade.gain.linearRampToValueAtTime(sound.volume, c.currentTime + FADE_IN);
    source.connect(fade).connect(buses.music);
    source.onended = () => {
      if (playing !== entry) return; // an intentional stop, or an older song
      playing = undefined;
      reconcileMusic(); // natural end of a base song: pick the next one (a loop that ended anyway restarts)
    };
    entry.source = source;
    entry.fade = fade;
    source.start();
    // While a base song plays, fetch the other base song so the next boundary has no gap.
    const plan = musicPlan(intent);
    if (mode === "once" && plan.kind === "playlist") for (const other of plan.tracks) if (other !== id) void load(sounds.get(other)!.url);
  });
}

/** Make the music match the intent. Idempotent: safe to call on every change. */
function reconcileMusic() {
  if (musicHolds.size) return stopPlaying(0);
  if (!ctx) return; // nothing before the first tap
  if (!audible("music")) {
    // Muted / Music 0 / Master 0: the gains are 0 already; stop after the mute blip (no hidden playback).
    if (playing) stopPlaying(0.25);
    return;
  }
  const plan = musicPlan(intent);
  if (plan.kind === "none") return stopPlaying();
  if (plan.kind === "loop") {
    if (playing?.id === plan.id && playing.mode === "loop") return;
    stopPlaying();
    return startTrack(plan.id, "loop");
  }
  // A base song plays to its natural end: hub ↔ console or a mini game opening never restarts it.
  if (playing?.mode === "once" && plan.tracks.includes(playing.id)) return;
  stopPlaying();
  const id = nextSong(plan.tracks, recent, openMiniGames.size > 0, random);
  recent = [...recent.slice(-3), id];
  startTrack(id, "once");
}


let preloaded = false;
/** Create (once) or resume the context, preload the UI set, start the current music. Any tap or key does it. */
function unlock() {
  if (!context(true)) return;
  if (!preloaded) {
    preloaded = true;
    for (const id of PRELOAD) void load(sounds.get(id)!.url);
  }
  reconcileMusic();
}
/**
 * On page start: try to begin the menu music at once. Where the browser allows audio without a gesture
 * (site already trusted), it plays now; otherwise the context waits "suspended" with the track already
 * loading, and the first tap or key anywhere resumes it. Never bypasses the browser's autoplay rules.
 */
function autostart() {
  if (!context(true)) return;
  reconcileMusic();
}
if (typeof window !== "undefined")
  for (const type of ["pointerdown", "keydown", "touchend", "click"])
    window.addEventListener(type, unlock, { capture: true, passive: true });
// #62: a hidden tab goes quiet (the song keeps its place, nothing plays in the background) and carries on when the player comes back.
function onVisibility() {
  if (!ctx) return;
  if (document.hidden) void ctx.suspend?.().catch(() => {});
  else void ctx.resume().catch(() => {});
}
if (typeof document !== "undefined") document.addEventListener("visibilitychange", onVisibility);

/** Original 8-bit sounds from public/audio (see docs/audio.md). Never autoplays: nothing sounds before the first tap. */
export const audio = {
  unlock,
  autostart,
  /** Brief failure beat: silence music only, even if a click tries to unlock audio. */
  holdMusic: () => {
    const token = Symbol("music hold");
    musicHolds.add(token);
    stopPlaying(0);
    return () => { musicHolds.delete(token); reconcileMusic(); };
  },
  playSfx: (id: string, gapMs = id === "volume-change" ? 150 : 70) => {
    if (id === "step")
      id = (stepFlip = !stepFlip)
        ? "player-step-metal-1"
        : "player-step-metal-2";
    const now = performance.now();
    if (now - (lastPlayed.get(id) ?? -Infinity) < gapMs) return; // no stacking of the same blip
    lastPlayed.set(id, now);
    playEffect(id);
  },
  /** The music director (musicDirector.ts) reports where the player is and whether a real storm is on. */
  setMusic: (next: MusicIntent) => {
    if (next.scene === intent.scene && next.storm === intent.storm) return;
    intent = { ...next };
    reconcileMusic();
  },
  /**
   * A job mini game opened; returns its close function (a React effect cleanup). Opening never cuts
   * the song that is playing: the mini-game theme comes at the next song end, if the game is still open.
   */
  miniGameOpened: () => {
    const token = Symbol("mini game");
    openMiniGames.add(token);
    reconcileMusic();
    return () => { openMiniGames.delete(token); };
  },
  mute: (muted: boolean) => {
    if (muted) audio.playSfx("mute");
    useAudio.setState({ muted });
    if (!muted) audio.playSfx("unmute");
  },
};

/** For tests: what is playing, how many mini games are open, and a fixed random source. */
export const musicDebug = {
  playing: () => playing && { id: playing.id, mode: playing.mode, started: Boolean(playing.source) },
  miniGames: () => openMiniGames.size,
  setRandom: (r: () => number) => { random = r; },
};
