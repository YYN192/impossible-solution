/**
 * Mission 1's hands-on beats (#59) on the real beat screen: each one ends in one of the beat's own options,
 * so the engine decides the result exactly as the cards did. Taps and keys here; drags are checked in a browser.
 */
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { campaignMission } from "../data/mission";
import i18n from "../i18n";
import { useGame } from "../state/game";
import { useMission } from "../state/mission";
import { START, useNav } from "../state/screen";
import { BeatScreen } from "./BeatScreen";

const t = i18n.t.bind(i18n) as unknown as (k: string, o?: object) => string;
const fell = () => useGame.getState().state.dominoes.map((d) => d.id);

function open(sol: number, seed = 7) {
  useNav.setState(START);
  useMission.setState({ status: "ready", setup: campaignMission("storm", seed) });
  useNav.getState().next();
  useGame.setState({ state: { ...useGame.getState().state, sol } });
  useNav.setState({ screen: "beat", sol });
  return render(<BeatScreen />);
}
const button = (name: string | RegExp) => screen.getByRole("button", { name });

beforeEach(() => sessionStorage.clear());
afterEach(() => { vi.useRealTimers(); act(() => { void i18n.changeLanguage("en"); }); });

describe("hands-on beats keep the plain cards one tap away", () => {
  it("'Show the choices instead' brings back the cards, and 'Do it yourself' the hands-on view", () => {
    open(5);
    fireEvent.click(button(t("handsOn.cards")));
    button(new RegExp(t("beat.wipe.all.label")));
    fireEvent.click(button(t("handsOn.back")));
    expect(screen.getAllByRole("button", { name: /Panel 1/ })).toHaveLength(1);
  });
});

describe("sol 5: rub the dust off the panels", () => {
  const panel = (n: number) => button(new RegExp(`^${t("handsOn.wipe.panel", { n, state: ".*" })}$`));

  it("tapping a panel three times cleans it; going inside with some clean picks 'half'", () => {
    open(5);
    for (let i = 0; i < 3; i++) fireEvent.click(panel(1));
    expect(panel(1).getAttribute("aria-label")).toBe(t("handsOn.wipe.panel", { n: 1, state: t("handsOn.wipe.clean") }));
    screen.getByText(t("handsOn.wipe.count", { n: 1, total: 6 }));
    fireEvent.click(button(t("handsOn.wipe.inside")));
    expect(fell()).toEqual(["sol5-wipe-half"]);
  });

  it("keyboard: arrows pick a panel, Space rubs; all six clean picks 'all'", () => {
    open(5);
    panel(1).focus();
    for (let p = 1; p <= 6; p++) {
      for (let i = 0; i < 3; i++) fireEvent.keyDown(document.activeElement!, { key: " ", code: "Space" });
      if (p < 6) fireEvent.keyDown(document.activeElement!, { key: "ArrowRight", code: "ArrowRight" });
    }
    screen.getByText(t("handsOn.wipe.count", { n: 6, total: 6 }));
    fireEvent.click(button(t("handsOn.wipe.inside")));
    expect(fell()).toEqual(["sol5-wipe-all"]);
  });

  it("going straight back inside leaves the dust ('none')", () => {
    open(5);
    fireEvent.click(button(t("handsOn.wipe.inside")));
    expect(fell()).toEqual(["sol5-wipe-none"]);
  });

  it("shows the real cost of what you have done so far (space rays rise with more panels)", () => {
    open(5);
    const preview = () => screen.getByTestId("hands-on-preview").textContent;
    const none = preview();
    for (let i = 0; i < 3; i++) fireEvent.click(panel(2));
    expect(preview()).not.toBe(none);
    expect(preview()).toContain(t("bars.dose"));
  });
});

describe("sol 2: drag a spare part onto the base", () => {
  it("tap a part, then its spot: it is built", () => {
    open(2);
    fireEvent.click(button(new RegExp(t("beat.upgrade.walls.label"))));
    screen.getByText(new RegExp(t("handsOn.build.holding", { part: ".*" }).slice(0, 12)));
    fireEvent.click(button(new RegExp(t("handsOn.build.spot.shelter"))));
    expect(fell()).toEqual(["sol2-upgrade-walls"]);
  });

  it("a wrong spot is not built and says where the part goes", () => {
    open(2);
    fireEvent.click(button(new RegExp(t("beat.upgrade.shelf.label"))));
    fireEvent.click(button(new RegExp(t("handsOn.build.spot.panels"))));
    expect(fell()).toEqual([]);
    screen.getByText(t("handsOn.build.wrong", { spot: t("handsOn.build.spot.greenhouse") }));
  });

  it("keeping the parts saves the power ('none')", () => {
    open(2);
    fireEvent.click(button(t("handsOn.build.keep")));
    expect(fell()).toEqual(["sol2-upgrade-none"]);
  });

  it("parts the base cannot pay for are switched off and say why", () => {
    open(2);
    act(() => useGame.setState({ state: { ...useGame.getState().state, bars: { power: 1, air: 5, dose: 0 } } }));
    const brush = button(new RegExp(t("beat.upgrade.brush.label"))) as HTMLButtonElement;
    expect(brush.disabled).toBe(true);
    expect(brush.textContent).toContain(t("beatUi.cannot"));
  });
});

describe("sol 3: hold Send, then race the signal to Earth", () => {
  const fake = () => vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame", "performance", "setTimeout", "clearTimeout"] });
  const run = (ms: number) => { for (let i = 0; i < ms / 50; i++) act(() => { vi.advanceTimersByTime(50); }); };

  it("holding Send long enough sends it; the clock counts the real delay; arriving picks 'call'", () => {
    fake();
    // The shared test setup reports "reduce motion"; this test watches the flight itself.
    const media = vi.spyOn(window, "matchMedia").mockImplementation((q: string) => ({ matches: false, media: q, addEventListener: vi.fn(), removeEventListener: vi.fn() }) as never);
    open(3);
    const delay = Math.round(useMission.getState().setup!.delay.seconds / 60);
    const send = button(t("handsOn.radio.send"));
    fireEvent.pointerDown(send);
    run(1000); // a full dish sends by itself, even before letting go
    fireEvent.pointerUp(send);
    screen.getByText(new RegExp(t("handsOn.radio.flying")));
    expect(fell()).toEqual([]); // still on its way
    run(4500);
    expect(fell()).toEqual(["sol3-radio-call"]);
    screen.getByText(t("handsOn.radio.arrived", { n: delay }));
    media.mockRestore();
  });

  it("with reduced motion or calm mode the message arrives at once", () => {
    fake();
    open(3);
    const send = button(t("handsOn.radio.send"));
    fireEvent.pointerDown(send);
    run(1000);
    expect(fell()).toEqual(["sol3-radio-call"]);
  });

  it("letting go too early does not send", () => {
    fake();
    open(3);
    fireEvent.pointerDown(button(t("handsOn.radio.send")));
    run(300);
    fireEvent.pointerUp(button(t("handsOn.radio.send")));
    screen.getByText(t("handsOn.radio.tooShort"));
    run(5000);
    expect(fell()).toEqual([]);
  });

  it("keyboard: hold Space on Send", () => {
    fake();
    open(3);
    const send = button(t("handsOn.radio.send"));
    fireEvent.keyDown(send, { key: " ", code: "Space" });
    run(1000);
    fireEvent.keyUp(send, { key: " ", code: "Space" });
    run(4500);
    expect(fell()).toEqual(["sol3-radio-call"]);
  });

  it("staying quiet saves the power ('skip')", () => {
    open(3);
    fireEvent.click(button(t("handsOn.radio.skip")));
    expect(fell()).toEqual(["sol3-radio-skip"]);
  });
});

describe("sol 4: turn the heater dial on a cold night", () => {
  const coldSeed = () => { for (let s = 1; s < 200; s++) if (campaignMission("storm", s).beats[4]?.id === "cold") return s; throw new Error("no cold seed"); };

  it("starts Off; Good night with it Off means huddling ('huddle')", () => {
    open(4, coldSeed());
    expect(screen.getByRole("slider", { name: t("handsOn.heater.dial") }).getAttribute("aria-valuenow")).toBe("0");
    fireEvent.click(button(t("handsOn.heater.go")));
    expect(fell()).toEqual(["sol4-cold-huddle"]);
  });

  it("turning it On (arrow key or tap) means the heater ('heat'), and says what it costs", () => {
    open(4, coldSeed());
    const dial = screen.getByRole("slider", { name: t("handsOn.heater.dial") });
    fireEvent.keyDown(dial, { key: "ArrowRight", code: "ArrowRight" });
    expect(dial.getAttribute("aria-valuenow")).toBe("180");
    screen.getByText(t("handsOn.heater.on"));
    expect(screen.getByTestId("hands-on-preview").textContent).toContain(t("bars.power"));
    fireEvent.click(button(t("handsOn.heater.go")));
    expect(fell()).toEqual(["sol4-cold-heat"]);
  });

  it("other sol-4 dilemmas keep their cards", () => {
    let other = 1;
    while (campaignMission("storm", other).beats[4]?.id === "cold") other++;
    open(4, other);
    expect(screen.queryByRole("slider")).toBeNull();
    expect(within(screen.getByRole("group", { name: t("beatUi.options") })).getAllByRole("button").length).toBeGreaterThan(1);
  });
});

describe("works in Bulgarian", () => {
  it("the wipe moment is translated", async () => {
    await act(async () => { await i18n.changeLanguage("bg"); });
    open(5);
    button(t("handsOn.wipe.inside"));
    expect(t("handsOn.wipe.inside")).not.toBe(i18n.getFixedT("en")("handsOn.wipe.inside"));
  });
});
