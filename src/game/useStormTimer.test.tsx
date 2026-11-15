import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useStormTimer, STORM_RETRY_MS } from "./useStormTimer";
import { audio } from "./audio";
import { useGame } from "../state/game";
import { createGame } from "../sim/engine";
import { greenhouseAction } from "../data/hubStorm";

beforeEach(() => {
  vi.useFakeTimers();
  useGame.setState({ state: createGame(), stormCheckpoint: undefined });
  Object.defineProperty(document, "hidden", { configurable: true, value: false });
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); });

describe("timed base storm", () => {
  it("waits for the briefing, fails at zero, restores repair costs and restarts repeatedly", () => {
    const release = vi.fn(), fail = vi.fn();
    vi.spyOn(audio, "holdMusic").mockReturnValue(release);
    const sfx = vi.spyOn(audio, "playSfx").mockImplementation(() => {});
    const initial = useGame.getState().state;
    const { result, rerender } = renderHook(({ briefing }) => useStormTimer(true, briefing, 1, fail), { initialProps: { briefing: true } });
    act(() => { vi.advanceTimersByTime(40000); });
    expect(result.current.seconds).toBe(30);
    rerender({ briefing: false });
    act(() => { vi.advanceTimersByTime(29000); useGame.getState().choose(greenhouseAction(initial)); });
    expect(result.current.seconds).toBe(1);
    act(() => { vi.advanceTimersByTime(1000); });
    expect(result.current).toEqual({ seconds: 0, failing: true });
    expect(fail).toHaveBeenCalledTimes(1);
    expect(audio.holdMusic).toHaveBeenCalledTimes(1);
    expect(sfx).toHaveBeenCalledWith("mission-failure");
    expect(useGame.getState().state).not.toEqual(initial);
    expect(release).not.toHaveBeenCalled();
    act(() => { vi.advanceTimersByTime(STORM_RETRY_MS - 1); });
    expect(result.current.failing).toBe(true);
    act(() => { vi.advanceTimersByTime(1); });
    expect(useGame.getState().state).toEqual(initial);
    expect(result.current).toEqual({ seconds: 30, failing: false });
    expect(release).toHaveBeenCalledTimes(1);
    act(() => { vi.advanceTimersByTime(30000); });
    expect(fail).toHaveBeenCalledTimes(2);
  });

  it("pauses in hidden tabs and stops permanently when repairs finish", () => {
    const fail = vi.fn();
    const { result, rerender } = renderHook(({ active }) => useStormTimer(active, false, 1, fail), { initialProps: { active: true } });
    act(() => { vi.advanceTimersByTime(5000); });
    Object.defineProperty(document, "hidden", { configurable: true, value: true });
    act(() => { document.dispatchEvent(new Event("visibilitychange")); vi.advanceTimersByTime(60000); });
    expect(result.current.seconds).toBe(25);
    Object.defineProperty(document, "hidden", { configurable: true, value: false });
    act(() => { document.dispatchEvent(new Event("visibilitychange")); vi.advanceTimersByTime(1000); });
    expect(result.current.seconds).toBe(24);
    rerender({ active: false });
    act(() => { vi.advanceTimersByTime(60000); });
    expect(fail).not.toHaveBeenCalled();
  });

  it("cancels failure cleanup on exit and releases the music hold", () => {
    const release = vi.fn();
    vi.spyOn(audio, "holdMusic").mockReturnValue(release);
    const { unmount } = renderHook(() => useStormTimer(true, false, 1, vi.fn()));
    act(() => { vi.advanceTimersByTime(30000); });
    unmount();
    expect(release).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });
});
