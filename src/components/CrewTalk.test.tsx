import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import en from "../i18n/en.json";
import { CrewTalk } from "./CrewTalk";
import { campaignMission } from "../data/mission";
import { useMission } from "../state/mission";

describe("CrewTalk answer menu", () => {
  it("W A S D move the cursor like the arrow keys (by key position, so any keyboard layout works)", () => {
    HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) { this.removeAttribute("open"); };
    render(<CrewTalk speaker="commander" onClose={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: /Next/ }));
    const answers = screen.getAllByRole("button").filter((b) => b.closest(".crew-talk__menu"));
    answers[0].focus();
    const key = (code: string) => fireEvent.keyDown(document.activeElement!, { code, key: "x" });
    key("KeyS"); expect(document.activeElement).toBe(answers[1]);
    key("KeyD"); expect(document.activeElement).toBe(answers[2]);
    key("KeyW"); expect(document.activeElement).toBe(answers[1]);
    key("KeyA"); expect(document.activeElement).toBe(answers[0]);
    key("KeyW"); expect(document.activeElement).toBe(answers[3]); // wraps round
    key("ArrowDown"); expect(document.activeElement).toBe(answers[0]);
  });
});

describe("CrewTalk typing", () => {
  const before = window.matchMedia;
  beforeEach(() => {
    vi.useFakeTimers();
    // jsdom has no dialog.close(); the shared setup only adds showModal().
    HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) { this.removeAttribute("open"); };
    // Normal motion, so the line types letter by letter (the shared setup turns reduced motion on).
    window.matchMedia = vi.fn((query: string) => ({ matches: false, media: query, addEventListener: vi.fn(), removeEventListener: vi.fn() })) as never;
  });
  afterEach(() => {
    vi.useRealTimers();
    window.matchMedia = before;
  });

  it("Next during typing shows the whole line, and it stays whole while the timer would still be typing", () => {
    render(<CrewTalk speaker="commander" onClose={() => {}} />);
    const line = () => document.querySelector(".crew-talk__line")!.childNodes[0].textContent;
    act(() => { vi.advanceTimersByTime(100); });
    expect(line()!.length).toBeLessThan(en.talk.commander.intro.length);
    fireEvent.click(screen.getByRole("button", { name: /Next/ }));
    expect(line()).toBe(en.talk.commander.intro);
    act(() => { vi.advanceTimersByTime(200); });
    expect(line()).toBe(en.talk.commander.intro);
    // The next press goes on to the answer menu.
    fireEvent.click(screen.getByRole("button", { name: /Next/ }));
    screen.getByRole("button", { name: en.talk.ask.bye });
  });
});

describe("CrewTalk on the Moon: Moon lines and Moon lore", () => {
  beforeEach(() => { HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) { this.removeAttribute("open"); }; });
  afterEach(() => { useMission.setState({ setup: undefined }); });
  const line = () => document.querySelector(".crew-talk__line")!.childNodes[0].textContent;
  const next = () => fireEvent.click(screen.getByRole("button", { name: /Next/ }));
  const speakers = ["commander", "engineer", "scientist", "drone"] as const;

  it.each(speakers)("%s greets you with a Moon line, and tells two Moon facts", (speaker) => {
    useMission.setState({ setup: campaignMission("moon", 1) });
    render(<CrewTalk speaker={speaker} onClose={() => {}} />);
    const talk = en.talk[speaker] as Record<string, string>;
    expect(line()).toBe(talk.intro_moon);
    next();
    fireEvent.click(screen.getByRole("button", { name: en.talk.ask.lore }));
    expect(line()).toBe(talk.lore_moon);
    next();
    expect(line()).toBe(talk.lore2_moon);
    next();
    // Back to the answers afterwards.
    expect(screen.getByRole("button", { name: en.talk.ask.lore })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: en.talk.ask.who }));
    expect(line()).toBe(talk.who_moon);
  });

  it("keeps the Mars lines on Mars, with no Moon facts", () => {
    render(<CrewTalk speaker="engineer" onClose={() => {}} />);
    expect(line()).toBe(en.talk.engineer.intro);
    next();
    expect(screen.queryByRole("button", { name: en.talk.ask.lore })).toBeNull();
  });

  it("the airlock and greenhouse talk about the Moon too", () => {
    useMission.setState({ setup: campaignMission("moon", 1) });
    render(<CrewTalk speaker="airlock" onClose={() => {}} />);
    expect(line()).toBe(en.dialogue.airlock.hello_moon);
  });
});
