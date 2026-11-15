import { act, fireEvent, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { usePressedKeys } from "./pressedKeys";

const KEYS = { w: "up", arrowup: "up", d: "right", arrowright: "right", e: "interact" } as const;

describe("usePressedKeys: which on-screen keys the physical keyboard is holding", () => {
  it("lights a control on keydown and turns it off on keyup", () => {
    const { result } = renderHook(() => usePressedKeys(KEYS));
    expect(result.current.size).toBe(0);
    act(() => { fireEvent.keyDown(window, { key: "ArrowUp" }); });
    expect(result.current.has("up")).toBe(true);
    act(() => { fireEvent.keyUp(window, { key: "ArrowUp" }); });
    expect(result.current.has("up")).toBe(false);
  });

  it("ignores letter case (Caps Lock / Shift) and keys it does not know", () => {
    const { result } = renderHook(() => usePressedKeys(KEYS));
    act(() => { fireEvent.keyDown(window, { key: "D" }); fireEvent.keyDown(window, { key: "q" }); });
    expect([...result.current]).toEqual(["right"]);
  });

  it("keeps a control lit while either of its keys is still held", () => {
    const { result } = renderHook(() => usePressedKeys(KEYS));
    act(() => { fireEvent.keyDown(window, { key: "w" }); fireEvent.keyDown(window, { key: "ArrowUp" }); fireEvent.keyUp(window, { key: "w" }); });
    expect(result.current.has("up")).toBe(true);
    act(() => { fireEvent.keyUp(window, { key: "ArrowUp" }); });
    expect(result.current.has("up")).toBe(false);
  });

  it("lets everything go when the window loses focus (the key-up would never arrive)", () => {
    const { result } = renderHook(() => usePressedKeys(KEYS));
    act(() => { fireEvent.keyDown(window, { key: "e" }); fireEvent.blur(window); });
    expect(result.current.size).toBe(0);
  });
});
