import { afterEach, describe, expect, it, vi } from "vitest";

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
    resume() {
      return Promise.resolve();
    }
  }
  vi.stubGlobal("AudioContext", FakeContext);
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
      audio.playMusic("mars-base-ambience");
      audio.stopMusic();
    }).not.toThrow();
  });

  it("plays through Web Audio, and mute sets the master volume to 0 and skips new sounds", async () => {
    const { gains, started, fetch } = fakeAudio();
    const { audio, useAudio } = await import("./audio");
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

  it("never fetches music while the Music volume is 0 (the default)", async () => {
    const { fetch } = fakeAudio();
    const { audio } = await import("./audio");
    window.dispatchEvent(new Event("pointerdown"));
    audio.playMusic("mars-base-ambience");
    expect(
      fetch.mock.calls
        .map((c: unknown[]) => String(c[0]))
        .some((u) => u.includes("ambience")),
    ).toBe(false);
  });
});
