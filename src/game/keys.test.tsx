import { act, fireEvent, render, renderHook, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { campaignMission } from "../data/mission";
import i18n from "../i18n";
import { EXPLORE, reachCost } from "../sim/explore";
import { ExploreBeat } from "../screens/ExploreBeat";
import { gameKey, usePressedKeys } from "./pressedKeys";

const t = i18n.t.bind(i18n) as unknown as (k: string, o?: object) => string;

// #53: a Bulgarian layout types Cyrillic letters, but the physical key (e.code) is the same.
describe("game keys follow the physical key, not the typed letter (#53)", () => {
  it("maps Bulgarian, Caps Lock and Shift presses to the same control", () => {
    expect(gameKey({ key: "е", code: "KeyE" })).toBe("e");
    expect(gameKey({ key: "в", code: "KeyW" })).toBe("w"); // BDS: W key types в
    expect(gameKey({ key: "ш", code: "KeyW" })).toBe("w"); // phonetic: W key types ш
    expect(gameKey({ key: "W", code: "KeyW" })).toBe("w"); // Caps Lock / Shift
    expect(gameKey({ key: "ArrowUp", code: "ArrowUp" })).toBe("arrowup");
    expect(gameKey({ key: "e", code: "" })).toBe("e"); // no code (old browsers, tests): fall back to the letter
  });

  it("the key hints light up for a Bulgarian keydown", () => {
    const { result } = renderHook(() => usePressedKeys({ w: "up", arrowup: "up" }));
    act(() => { window.dispatchEvent(new KeyboardEvent("keydown", { key: "ш", code: "KeyW" })); });
    expect(result.current.has("up")).toBe(true);
    act(() => { window.dispatchEvent(new KeyboardEvent("keyup", { key: "ш", code: "KeyW" })); });
    expect(result.current.has("up")).toBe(false);
  });

  it("the rover drives with WASD on a Bulgarian layout", () => {
    const map = campaignMission("storm", 3).beats[1].map!;
    const cost = reachCost(map);
    const open = ([["KeyD", "д", 1, 0], ["KeyA", "а", -1, 0], ["KeyS", "с", 0, 1], ["KeyW", "в", 0, -1]] as const)
      .filter(([, , dx, dy]) => Number.isFinite(cost[(map.base.y + dy) * map.cols + map.base.x + dx]));
    render(<ExploreBeat map={map} onDone={vi.fn()} />);
    const [code, key] = open[0];
    fireEvent.keyDown(screen.getByRole("application"), { key, code });
    expect(screen.queryByText(t("exploreUi.battery", { n: EXPLORE.battery, max: EXPLORE.battery }))).toBeNull();
  });
});
