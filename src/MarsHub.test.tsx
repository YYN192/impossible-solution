import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useSession } from "./game/session";
import i18n from "./i18n";
import MarsHub from "./MarsHub";

const t = i18n.t.bind(i18n) as unknown as (k: string) => string;

describe("station keys under the game light up with the keyboard", () => {
  it("lights the matching arrow button while WASD or an arrow key is held", () => {
    render(<MarsHub onConsole={vi.fn()} onMenu={vi.fn()} />);
    const up = screen.getByRole("button", { name: t("world.up") });
    const right = screen.getByRole("button", { name: t("world.right") });
    act(() => { fireEvent.keyDown(window, { key: "ArrowUp" }); });
    expect(up.hasAttribute("data-pressed")).toBe(true);
    expect(right.hasAttribute("data-pressed")).toBe(false);
    act(() => { fireEvent.keyUp(window, { key: "ArrowUp" }); fireEvent.keyDown(window, { key: "d" }); });
    expect(up.hasAttribute("data-pressed")).toBe(false);
    expect(right.hasAttribute("data-pressed")).toBe(true);
    act(() => { fireEvent.keyUp(window, { key: "d" }); });
    expect(right.hasAttribute("data-pressed")).toBe(false);
  });

  it("lights the E key hint while E is held", () => {
    render(<MarsHub onConsole={vi.fn()} onMenu={vi.fn()} />);
    const kbd = document.querySelector(".interaction-guide kbd")!;
    act(() => { fireEvent.keyDown(window, { key: "e" }); });
    expect(kbd.hasAttribute("data-pressed")).toBe(true);
    act(() => { fireEvent.keyUp(window, { key: "e" }); });
    expect(kbd.hasAttribute("data-pressed")).toBe(false);
  });
});

describe("walking up to something you can use", () => {
  it("keeps walking smoothly: a held key is not dropped when a console/NPC comes into reach", () => {
    vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame", "performance"] });
    try {
      // Start below the commander, just out of reach, and hold W the whole time.
      useSession.setState({ position: { x: 224, y: 262, facing: "back" } });
      const { unmount } = render(<MarsHub onConsole={vi.fn()} onMenu={vi.fn()} />);
      act(() => { fireEvent.keyDown(window, { key: "w" }); });
      for (let i = 0; i < 50; i++) act(() => { vi.advanceTimersByTime(16); }); // let React commit between frames
      screen.getByText(t("world.near.commander")); // the commander came into reach on the way
      unmount();
      // 800 ms at 110 px/s would be ~88 px; the commander's desk stops us around y 207.
      // Dropping the held key when "near" changed used to freeze the player at ~y 248.
      expect(useSession.getState().position.y).toBeLessThan(215);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("station room signs", () => {
  it("shows no area signs (Engineering, Mission console, Science lab, Airlock) over the game", () => {
    render(<MarsHub onConsole={vi.fn()} onMenu={vi.fn()} />);
    expect(document.querySelectorAll(".world-label")).toHaveLength(0);
    for (const sign of ["ENGINEERING", "MISSION CONSOLE", "SCIENCE LAB", "AIRLOCK / SURFACE ACCESS"])
      expect(screen.queryByText(sign)).toBeNull();
  });
});
