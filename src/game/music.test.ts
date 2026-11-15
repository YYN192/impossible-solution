import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The music coordinator against a fake Web Audio: every source knows which file it plays, records
 * stop(), and a test calls end() to fire `onended` as if the song had reached its natural end.
 */
interface FakeSource {
  buffer: { url: string } | null;
  loop: boolean;
  started: boolean;
  stopped: boolean;
  onended: null | (() => void);
  start: () => void;
  stop: () => void;
  connect: (n: unknown) => unknown;
  end: () => void;
}
function fakeAudio(opts: { slow?: string } = {}) {
  const sources: FakeSource[] = [];
  const gains: { gain: { value: number } }[] = [];
  const ctxs: { suspend: ReturnType<typeof vi.fn>; resume: ReturnType<typeof vi.fn> }[] = [];
  let release: (() => void) | undefined;
  const node = () => ({ connect: (n: unknown) => n });
  class FakeContext {
    state = "running";
    currentTime = 0;
    destination = node();
    suspend = vi.fn(() => Promise.resolve());
    resume = vi.fn(() => Promise.resolve());
    constructor() { ctxs.push(this); }
    createGain() {
      const gain = {
        value: 1,
        setValueAtTime(v: number) { this.value = v; },
        linearRampToValueAtTime(v: number) { this.value = v; },
        cancelScheduledValues() {},
      };
      const g = { ...node(), gain };
      gains.push(g);
      return g;
    }
    createBufferSource() {
      const s: FakeSource = {
        ...node(), buffer: null, loop: false, started: false, stopped: false, onended: null,
        start: () => { s.started = true; },
        stop: () => { s.stopped = true; s.onended?.(); }, // real sources fire onended after stop() too
        end: () => { s.stopped = true; s.onended?.(); }, // natural end of the buffer
      };
      sources.push(s);
      return s;
    }
    decodeAudioData(data: { url: string }) { return Promise.resolve({ url: data.url }); }
  }
  vi.stubGlobal("AudioContext", FakeContext);
  const fetch = vi.fn((url: string) => {
    const body = { ok: true, arrayBuffer: () => Promise.resolve({ url }) };
    if (opts.slow && url.includes(opts.slow)) return new Promise((r) => { release = () => r(body); });
    return Promise.resolve(body);
  });
  vi.stubGlobal("fetch", fetch);
  /** Music sources only (the UI preload never creates sources). */
  const music = () => sources.filter((s) => s.buffer?.url.includes("/music/") || s.buffer?.url.includes("ambience"));
  const live = () => music().filter((s) => s.started && !s.stopped);
  const name = (s?: FakeSource) => s?.buffer?.url.split("/").pop();
  return { sources, gains, ctxs, fetch, music, live, name, release: () => release?.() };
}
const flush = () => new Promise((r) => setTimeout(r, 0));
const MENU = "Mars_Main_Menu_8bit.wav", CONSOLE = "mars_console_preview.wav", MINI = "Mars_Minigames_8bit.wav", STORM = "STORM_8bit_electronic_preview.wav";

async function setup(prefs: Record<string, unknown> = { music: 0.5 }, opts?: { slow?: string }) {
  localStorage.setItem("sol:audio", JSON.stringify(prefs));
  const fake = fakeAudio(opts);
  const mod = await import("./audio");
  mod.musicDebug.setRandom(() => 0); // first track of the playlist: music-console
  return { ...fake, ...mod };
}

describe("music coordinator", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
    localStorage.clear();
  });

  it("menu: nothing before the first tap, then music-lobby loops; the same menu never restarts it; leaving stops it", async () => {
    const a = await setup();
    a.audio.setMusic({ scene: "menu", storm: false });
    await flush();
    expect(a.fetch).not.toHaveBeenCalled(); // no autoplay before a gesture
    a.audio.unlock();
    await flush();
    expect(a.live().map(a.name)).toEqual([MENU]);
    expect(a.live()[0].loop).toBe(true);
    a.audio.setMusic({ scene: "menu", storm: false }); // Settings / overlays re-render: same intent
    await flush();
    expect(a.music()).toHaveLength(1);
    a.audio.setMusic({ scene: "base", storm: false }); // Play
    await flush();
    expect(a.music()[0].stopped).toBe(true);
    expect(a.live().map(a.name)).toEqual([CONSOLE]);
    expect(a.live()[0].loop).toBe(false); // whole song, then the next one
  });

  it("back to the menu stops the base song and plays the menu loop from the start again", async () => {
    const a = await setup();
    a.audio.unlock();
    a.audio.setMusic({ scene: "menu", storm: false });
    await flush();
    a.audio.setMusic({ scene: "base", storm: true });
    await flush();
    a.audio.setMusic({ scene: "menu", storm: false });
    await flush();
    expect(a.live().map(a.name)).toEqual([MENU]);
    expect(a.music().filter((s) => a.name(s) === MENU)).toHaveLength(2); // a fresh source = from the beginning
  });

  it("base: only the console and mini-game songs, a new one at each natural end; hub ↔ console never restarts", async () => {
    const a = await setup();
    a.audio.unlock();
    a.audio.setMusic({ scene: "base", storm: false });
    await flush();
    expect(a.live().map(a.name)).toEqual([CONSOLE]);
    a.audio.setMusic({ scene: "base", storm: false }); // walking into the console: same scene
    await flush();
    expect(a.music()).toHaveLength(1);
    a.musicDebug.setRandom(() => 0.99);
    a.live()[0].end();
    await flush();
    expect(a.live().map(a.name)).toEqual([MINI]);
    a.live()[0].end();
    await flush();
    expect(a.live().map(a.name)).toEqual([MINI]); // twice in a row is allowed …
    a.live()[0].end();
    await flush();
    expect(a.live().map(a.name)).toEqual([CONSOLE]); // … three times is not
    const names = a.music().map(a.name);
    expect(names.every((n) => n === CONSOLE || n === MINI)).toBe(true); // never menu or storm
    expect(a.live()).toHaveLength(1);
  });

  it("a mini game waits for the console song to finish, then plays music-minigames", async () => {
    const a = await setup();
    a.audio.unlock();
    a.audio.setMusic({ scene: "base", storm: false });
    await flush();
    const close = a.audio.miniGameOpened();
    await flush();
    expect(a.live().map(a.name)).toEqual([CONSOLE]); // not cut off
    expect(a.music()).toHaveLength(1);
    a.live()[0].end();
    await flush();
    expect(a.live().map(a.name)).toEqual([MINI]);
    a.live()[0].end(); // still open: the theme again
    await flush();
    expect(a.live().map(a.name)).toEqual([MINI]);
    close();
  });

  it("closing the mini game before the console song ends cancels the switch", async () => {
    const a = await setup();
    a.audio.unlock();
    a.audio.setMusic({ scene: "base", storm: false });
    await flush();
    const close = a.audio.miniGameOpened();
    close();
    a.live()[0].end();
    await flush();
    expect(a.live().map(a.name)).toEqual([CONSOLE]); // random pick (stubbed 0), not the forced theme
  });

  it("opening a mini game while its theme plays does not restart it; rapid open/close leaves no stuck request", async () => {
    const a = await setup();
    a.musicDebug.setRandom(() => 0.99);
    a.audio.unlock();
    a.audio.setMusic({ scene: "base", storm: false });
    await flush();
    expect(a.live().map(a.name)).toEqual([MINI]);
    for (let i = 0; i < 5; i++) a.audio.miniGameOpened()();
    const close = a.audio.miniGameOpened();
    close();
    close(); // a double cleanup (React strict mode) is harmless
    await flush();
    expect(a.music()).toHaveLength(1);
    expect(a.musicDebug.miniGames()).toBe(0);
  });

  it("a real storm cuts in at once, loops, beats a mini game, and the base songs come back when it clears", async () => {
    const a = await setup();
    a.audio.unlock();
    a.audio.setMusic({ scene: "base", storm: false });
    await flush();
    const close = a.audio.miniGameOpened();
    a.audio.setMusic({ scene: "base", storm: true });
    await flush();
    expect(a.music()[0].stopped).toBe(true); // no waiting for the song end
    expect(a.live().map(a.name)).toEqual([STORM]);
    expect(a.live()[0].loop).toBe(true);
    a.live()[0].end(); // a loop never ends by itself; if the browser ends it anyway, it comes back
    await flush();
    expect(a.live().map(a.name)).toEqual([STORM]);
    a.audio.setMusic({ scene: "base", storm: false }); // all-clear, mini game still open
    await flush();
    expect(a.live().map(a.name)).toEqual([MINI]);
    close();
  });

  it("a late load never plays: the storm file arrives after the player went home", async () => {
    const a = await setup({ music: 0.5 }, { slow: "STORM" });
    a.audio.unlock();
    a.audio.setMusic({ scene: "base", storm: true });
    await flush();
    a.audio.setMusic({ scene: "menu", storm: false });
    await flush();
    a.release();
    await flush();
    expect(a.live().map(a.name)).toEqual([MENU]);
    expect(a.music().some((s) => a.name(s) === STORM)).toBe(false);
  });

  it("an intentional stop never advances the playlist (stale onended)", async () => {
    const a = await setup();
    a.audio.unlock();
    a.audio.setMusic({ scene: "base", storm: false });
    await flush();
    const first = a.live()[0];
    a.audio.setMusic({ scene: "menu", storm: false });
    await flush();
    first.end(); // the old song's late onended
    await flush();
    expect(a.live().map(a.name)).toEqual([MENU]);
    expect(a.music()).toHaveLength(2);
  });

  it("mute, Music 0 and Master 0 silence and stop the song; turning back on starts the right one, once", async () => {
    const a = await setup();
    a.audio.unlock();
    a.audio.setMusic({ scene: "base", storm: true });
    await flush();
    const master = a.gains[0], musicBus = a.gains[2];
    a.audio.mute(true);
    expect(master.gain.value).toBe(0);
    expect(a.live()).toHaveLength(0);
    a.audio.setMusic({ scene: "menu", storm: false }); // moves on while muted: no download, no playback
    await flush();
    expect(a.live()).toHaveLength(0);
    a.audio.mute(false);
    await flush();
    expect(a.live().map(a.name)).toEqual([MENU]); // the current context, not the old storm
    a.useAudio.setState({ music: 0.2 });
    expect(musicBus.gain.value).toBeCloseTo(0.2); // the slider is heard at once
    a.useAudio.setState({ music: 0 });
    expect(musicBus.gain.value).toBe(0);
    expect(a.live()).toHaveLength(0);
    a.useAudio.setState({ music: 0.4 });
    await flush();
    expect(a.live().map(a.name)).toEqual([MENU]);
    a.useAudio.setState({ master: 0 });
    expect(a.live()).toHaveLength(0);
    a.useAudio.setState({ master: 0.6 });
    await flush();
    expect(a.live()).toHaveLength(1);
    expect(a.useAudio.getState().muted).toBe(false);
  });

  it("a hidden tab suspends all sound and resumes it when shown again", async () => {
    const a = await setup();
    a.audio.unlock();
    const ctx = a.ctxs[0];
    Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
    document.dispatchEvent(new Event("visibilitychange"));
    expect(ctx.suspend).toHaveBeenCalled();
    Object.defineProperty(document, "hidden", { configurable: true, get: () => false });
    document.dispatchEvent(new Event("visibilitychange"));
    expect(ctx.resume).toHaveBeenCalled();
  });

  it("a missing track is skipped quietly", async () => {
    const a = await setup();
    const saved = a.sounds.get("music-minigames")!;
    a.sounds.delete("music-minigames");
    try {
      a.musicDebug.setRandom(() => 0.99);
      a.audio.unlock();
      a.audio.setMusic({ scene: "base", storm: false });
      await flush();
      expect(a.live().map(a.name)).toEqual([CONSOLE]);
    } finally {
      a.sounds.set("music-minigames", saved);
    }
  });

  it("the Moon base keeps its ambience and never gets the storm song through the director", async () => {
    const a = await setup();
    a.audio.unlock();
    a.audio.setMusic({ scene: "moon-hub", storm: false });
    await flush();
    expect(a.name(a.live()[0])).toBe("space-menu-ambience.m4a");
    expect(a.live()[0].loop).toBe(true);
  });
});

describe("first-visit Sound on", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
    localStorage.clear();
  });
  it("gives a quiet music level when the player never chose one", async () => {
    const { audio, useAudio, FIRST_MUSIC_LEVEL } = await import("./audio");
    audio.soundOn();
    expect(useAudio.getState().music).toBe(FIRST_MUSIC_LEVEL);
    expect(FIRST_MUSIC_LEVEL).toBeLessThanOrEqual(0.3);
  });
  it("keeps a Music 0 the player chose, and keeps mute off/on as asked", async () => {
    localStorage.setItem("sol:music-chosen", "1");
    const { audio, useAudio } = await import("./audio");
    audio.mute(true);
    audio.soundOn();
    expect(useAudio.getState()).toMatchObject({ music: 0, muted: false });
  });
  it("moving the Music slider counts as a choice", async () => {
    const { audio, useAudio } = await import("./audio");
    useAudio.setState({ music: 0.5 });
    useAudio.setState({ music: 0 });
    audio.soundOn();
    expect(useAudio.getState().music).toBe(0);
  });
});

describe("pure rules", () => {
  it("nextSong prefers the mini-game theme and never picks one song three times running", async () => {
    const { nextSong } = await import("./audio");
    const tracks = ["music-console", "music-minigames"];
    expect(nextSong(tracks, ["music-console"], true, () => 0)).toBe("music-minigames");
    expect(nextSong(tracks, ["music-console", "music-console"], false, () => 0)).toBe("music-minigames");
    expect(nextSong(tracks, ["music-minigames", "music-console"], false, () => 0)).toBe("music-console");
    expect(nextSong(tracks, [], false, () => 0.99)).toBe("music-minigames");
  });
  it("musicPlan: menu > storm > Moon hub > base playlist", async () => {
    const { musicPlan } = await import("./audio");
    expect(musicPlan({ scene: "menu", storm: true })).toEqual({ kind: "loop", id: "music-lobby" });
    expect(musicPlan({ scene: "base", storm: true })).toEqual({ kind: "loop", id: "music-mission-storm" });
    expect(musicPlan({ scene: "moon-hub", storm: false })).toEqual({ kind: "loop", id: "moon-base-ambience" });
    expect(musicPlan({ scene: "base", storm: false })).toEqual({ kind: "playlist", tracks: ["music-console", "music-minigames"] });
    expect(musicPlan({ scene: "off", storm: true })).toEqual({ kind: "none" });
  });
});
