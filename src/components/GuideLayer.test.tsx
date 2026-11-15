import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "../i18n";
import { GUIDE_KEY, useGuide } from "../state/guide";
import { START, useNav } from "../state/screen";
import { GuideLayer, GuideToggle } from "./GuideLayer";

const t = i18n.t.bind(i18n) as unknown as (k: string, o?: object) => string;
const tick = () => act(() => { vi.advanceTimersByTime(250); });

beforeEach(() => {
  vi.useFakeTimers();
  localStorage.clear();
  useNav.setState({ ...START, screen: "title", place: "menu" });
  useGuide.setState({ on: true, sol: 1 });
});
afterEach(() => { vi.useRealTimers(); act(() => { void i18n.changeLanguage("en"); }); });

describe("guide layer: a pointer and one sentence at the next thing to touch", () => {
  it("points at Start mission on the menu", () => {
    render(<><button className="primary launch-button">Start</button><GuideLayer /></>);
    tick();
    expect(screen.getByRole("note").textContent).toContain(t("guide.step.start"));
  });

  it("never blocks: it lets every tap through and sits beside the control", () => {
    render(<><button className="primary launch-button">Start</button><GuideLayer /></>);
    tick();
    expect(screen.getByRole("note").closest(".guide")!.classList.contains("guide")).toBe(true);
    expect(screen.getAllByRole("button")).toHaveLength(1); // no Next/OK button of its own
  });

  it("shows the mission goal with the three stars on the first morning", () => {
    useNav.setState({ screen: "morning", sol: 1, place: "console" });
    render(<><button className="primary morning-go">Plan</button><GuideLayer /></>);
    tick();
    const note = screen.getByRole("note").textContent!;
    expect(note).toContain(t("guide.step.goal"));
    for (const g of ["crewSafe", "baseRunning", "science"]) expect(note).toContain(t(`final.goal.${g}`));
  });

  it("hides while its control is not on screen", () => {
    render(<GuideLayer />);
    tick();
    expect(screen.queryByRole("note")).toBeNull();
  });

  it("hides while a dialog (mini-game, crew talk, alarm) is open", () => {
    render(<><button className="primary launch-button">Start</button><dialog open>x</dialog><GuideLayer /></>);
    tick();
    expect(screen.queryByRole("note")).toBeNull();
  });

  it("hides while a page like Settings is open", () => {
    render(<><button className="primary launch-button">Start</button><GuideLayer blocked /></>);
    tick();
    expect(screen.queryByRole("note")).toBeNull();
  });

  it("ends once the next sol starts, and remembers it on this device", () => {
    useNav.setState({ screen: "morning", sol: 2, place: "console" });
    render(<><button className="primary morning-go">Plan</button><GuideLayer /></>);
    tick();
    expect(screen.queryByRole("note")).toBeNull();
    expect(useGuide.getState().on).toBe(false);
    expect(JSON.parse(localStorage.getItem(GUIDE_KEY)!)).toEqual({ done: true });
  });

  it("works in Bulgarian", async () => {
    await act(async () => { await i18n.changeLanguage("bg"); });
    render(<><button className="primary launch-button">Start</button><GuideLayer /></>);
    tick();
    expect(screen.getByRole("note").textContent).toContain(t("guide.step.start"));
    expect(t("guide.step.start")).not.toBe(i18n.getFixedT("en")("guide.step.start"));
  });
});

describe("? How to play: hide the tips or replay the guide", () => {
  it("while the guide is on, it hides the tips for good", () => {
    render(<GuideToggle />);
    fireEvent.click(screen.getByRole("button", { name: new RegExp(t("guide.hide")) }));
    expect(useGuide.getState().on).toBe(false);
    expect(JSON.parse(localStorage.getItem(GUIDE_KEY)!)).toEqual({ done: true });
  });

  it("once it is off, it replays the guide from the sol the player is on", () => {
    useGuide.setState({ on: false, sol: 1 });
    useNav.setState({ screen: "plan", sol: 3, place: "console" });
    render(<GuideToggle />);
    fireEvent.click(screen.getByRole("button", { name: new RegExp(t("guide.replay")) }));
    expect(useGuide.getState()).toMatchObject({ on: true, sol: 3 });
  });
});
