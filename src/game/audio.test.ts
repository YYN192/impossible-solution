import { afterEach, describe, expect, it, vi } from "vitest";

const contexts: { resume: () => Promise<void>; suspend: () => Promise<void> }[] = [];
/** Minimal Web Audio stand-in: jsdom has no AudioContext. Records every gain node it hands out. */
function fakeAudio() {
  const gains: {
    gain: { value: number; setValueAtTime: (v: number) => void };
  }[] = [];
  const started: unknown[] = [];
  const node = () => ({ connect: (n: unknown) => n });
  class FakeContext {
    state = "running";
    currentTime = 0;
    destination = node();
    createGain() {
      const g = {
        ...node(),
        gain: {
          value: 1,
          setValueAtTime(v: number) {
            this.value = v;
          },
        },
      };
      gains.push(g);
      return g;
    }
    createBufferSource() {
      const s = {
        ...node(),
        buffer: null,
        loop: false,
        start: () => started.push(s),
        stop: () => {},
      };
      return s;
    }
    decodeAudioData() {
      return Promise.resolve({});
    }
    resume = vi.fn(() => Promise.resolve());
    suspend = vi.fn(() => Promise.resolve());
  }
  contexts.length = 0;
  vi.stubGlobal("AudioContext", class extends FakeContext {
    constructor() { super(); contexts.push(this); }
  });
  const fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
    }),
  );
  vi.stubGlobal("fetch", fetch);
  return { gains, started, fetch };
}

describe("audio engine", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
    localStorage.clear();
  });

  it("does nothing without Web Audio (jsdom) instead of crashing", async () => {
    const { audio } = await import("./audio");
    expect(() => {
      audio.playSfx("menu");
      audio.setMusic({ scene: "base", storm: true });
      audio.miniGameOpened()();
      audio.setMusic({ scene: "off", storm: false });
    }).not.toThrow();
  });

  it("plays through Web Audio, and mute sets the master volume to 0 and skips new sounds", async () => {
    const { gains, started, fetch } = fakeAudio();
    const { audio, useAudio } = await import("./audio");
    audio.playSfx("door");
    expect(fetch).not.toHaveBeenCalled(); // nothing before the first user gesture
    audio.unlock(); // what the first tap does: create the context + preload the small UI set
    audio.playSfx("menu");
    await vi.waitFor(() => expect(started).toHaveLength(1));
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/audio/ui/menu-select.wav"),
    );
    const master = gains[0];
    expect(master.gain.value).toBeCloseTo(0.7);
    audio.mute(true);
    expect(useAudio.getState().muted).toBe(true);
    expect(master.gain.value).toBe(0);
    fetch.mockClear();
    audio.playSfx("door");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("#62: goes quiet while the tab is hidden and resumes when it is shown again", async () => {
    fakeAudio();
    const { audio } = await import("./audio");
    audio.unlock();
    const [c] = contexts;
    let hidden = true;
    Object.defineProperty(document, "hidden", { configurable: true, get: () => hidden });
    try {
      document.dispatchEvent(new Event("visibilitychange"));
      expect(c.suspend).toHaveBeenCalledTimes(1);
      hidden = false;
      vi.mocked(c.resume).mockClear();
      document.dispatchEvent(new Event("visibilitychange"));
      expect(c.resume).toHaveBeenCalled();
    } finally {
      delete (document as { hidden?: boolean }).hidden;
    }
  });

  it("never fetches music while the Music volume is 0", async () => {
    localStorage.setItem("sol:audio", JSON.stringify({ music: 0 }));
    const { fetch } = fakeAudio();
    const { audio } = await import("./audio");
    audio.unlock();
    audio.setMusic({ scene: "base", storm: false });
    expect(
      fetch.mock.calls
        .map((c: unknown[]) => String(c[0]))
        .some((u) => u.includes("ambience") || u.includes("/music/")),
    ).toBe(false);
  });
});

describe("music slots for the team's soundtrack", () => {
  it("uses installed soundtracks while preserving the Moon ambience fallback", async () => {
    const { musicFor, sounds } = await import("./audio");
    expect(musicFor("lobby")).toBe("music-lobby");
    expect(musicFor("hub")).toBe("mars-base-ambience");
    expect(musicFor("hub", "moon")).toBe("moon-base-ambience"); // #76: no Mars wind on the Moon
    expect(sounds.get("moon-base-ambience")).toBe(sounds.get("space-menu-ambience"));
    expect(musicFor("console", "dust")).toBe("music-console");
    // The storm track belongs to a real storm warning only, never to the storm campaign's calm console.
    expect(musicFor("console", "storm")).toBe("music-console");
    expect(musicFor("storm")).toBe("music-mission-storm");
    for (const id of [musicFor("lobby"), musicFor("hub"), musicFor("console", "moon")]) expect(sounds.has(id)).toBe(true);
  });

  it("use a mission's own track as soon as it is in the manifest, then the shared console track", async () => {
    const { musicFor, sounds } = await import("./audio");
    const track = { url: "/audio/music/x.m4a", volume: 0.5 };
    sounds.set("music-console", track);
    expect(musicFor("console", "dust")).toBe("music-console");
    sounds.set("music-mission-dust", track);
    expect(musicFor("console", "dust")).toBe("music-mission-dust");
    expect(musicFor("console", "moon")).toBe("music-console");
    sounds.delete("music-console");
    sounds.delete("music-mission-dust");
  });
});
