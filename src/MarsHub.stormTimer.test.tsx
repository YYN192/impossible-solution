import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { STORM_RETRY_MS } from "./game/useStormTimer";
import MarsHub from "./MarsHub";
import { useSession } from "./game/session";
import { useGame } from "./state/game";
import { useMission } from "./state/mission";
import { START, useNav } from "./state/screen";
import { greenhouseAction, hubStormFor, panelsAction } from "./data/hubStorm";
import i18n from "./i18n";

afterEach(() => {
  cleanup(); vi.useRealTimers();
  useMission.setState({ status: "idle", setup: undefined });
  useNav.setState(START); useGame.getState().reset();
});

it("shows the clock inside repairs, closes unfinished work on timeout, and removes the clock on success", () => {
  vi.useFakeTimers();
  Object.defineProperty(document, "hidden", { configurable: true, value: false });
  useMission.setState({ status: "ready", setup: { place: "mars", seed: 1, rules: { sols: 5 }, campaignId: "dust",
    events: [{ sol: 1, kind: "dustStorm", id: "InSight-2022-10", solar: 0.6 }] } as never });
  useGame.getState().reset();
  useNav.setState({ screen: "morning", sol: 1, place: "hub" });
  useSession.setState({ position: { x: 320, y: 330, facing: "front" } });
  render(<MarsHub onConsole={vi.fn()} onMenu={vi.fn()} />);
  fireEvent.click(screen.getByRole("button", { name: i18n.t("hubStorm.go") }));
  act(() => { vi.advanceTimersByTime(48); });
  fireEvent.keyDown(window, { key: "e" });
  expect(Boolean(screen.getByRole("dialog").querySelector('[role="timer"]'))).toBe(true);
  act(() => { vi.advanceTimersByTime(30000); });
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(screen.getByRole("timer").textContent).toBe("00:00");
  expect(document.querySelector(".storm-iris")).not.toBeNull();
  act(() => { vi.advanceTimersByTime(STORM_RETRY_MS); });
  expect(document.querySelector(".storm-iris")).toBeNull();
  expect(screen.getByRole("timer").textContent).toBe("00:30");
  act(() => {
    useGame.getState().choose(panelsAction(hubStormFor(useMission.getState().setup, 1)!));
    useGame.getState().choose(greenhouseAction(useGame.getState().state));
  });
  expect(screen.queryByRole("timer")).toBeNull();
  act(() => { vi.advanceTimersByTime(31000); });
  expect(screen.queryByRole("alert")).toBeNull();
});
