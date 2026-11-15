import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { audio } from "./audio";
import { mistake } from "./feedback";
import { useComfort } from "../state/comfort";

describe("mistake feedback", () => {
  beforeEach(() => vi.stubGlobal("matchMedia", () => ({ matches: false }))); // the test setup defaults to reduced motion
  afterEach(() => { vi.unstubAllGlobals();
    useComfort.setState({ calm: false });
    vi.restoreAllMocks();
    document.body.className = "";
  });

  it("small: plays menu-error and shakes the given element", () => {
    const play = vi.spyOn(audio, "playSfx").mockImplementation(() => {});
    const el = document.createElement("div");
    mistake("small", el);
    expect(play).toHaveBeenCalledWith("menu-error");
    expect(el.classList.contains("mistake-shake")).toBe(true);
  });

  it("big: plays resource-critical; default target is the page", () => {
    const play = vi.spyOn(audio, "playSfx").mockImplementation(() => {});
    mistake("big");
    expect(play).toHaveBeenCalledWith("resource-critical");
    expect(document.body.classList.contains("mistake-shake")).toBe(true);
  });

  it("calm mode: sound only, no shake class", () => {
    const play = vi.spyOn(audio, "playSfx").mockImplementation(() => {});
    useComfort.setState({ calm: true });
    const el = document.createElement("div");
    mistake("small", el);
    expect(play).toHaveBeenCalled();
    expect(el.classList.contains("mistake-shake")).toBe(false);
  });

  it("system reduced motion: no shake class", () => {
    vi.spyOn(audio, "playSfx").mockImplementation(() => {});
    vi.stubGlobal("matchMedia", () => ({ matches: true }));
    const el = document.createElement("div");
    mistake("small", el);
    expect(el.classList.contains("mistake-shake")).toBe(false);
  });

  it("re-trigger restarts the animation", () => {
    vi.spyOn(audio, "playSfx").mockImplementation(() => {});
    const el = document.createElement("div");
    const remove = vi.spyOn(el.classList, "remove");
    mistake("small", el);
    mistake("small", el);
    expect(remove).toHaveBeenCalledTimes(2);
    expect(el.classList.contains("mistake-shake")).toBe(true);
  });
});
