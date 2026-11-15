import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import en from "../i18n/en.json";
import { CrewTalk } from "./CrewTalk";

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

describe("CrewTalk practice", () => {
  it("'Let's practise!' comes first and opens the real mission mini-game on top; Skip returns to the menu", () => {
    HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) { this.removeAttribute("open"); };
    render(<CrewTalk speaker="engineer" onClose={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: /Next/ }));
    const answers = screen.getAllByRole("button").filter((b) => b.closest(".crew-talk__menu"));
    expect(answers[0].textContent).toBe(en.talk.ask.drill);
    fireEvent.click(answers[0]);
    fireEvent.click(screen.getByRole("button", { name: /Next/ }));
    screen.getByRole("heading", { name: en.miniGame.panels.title });
    fireEvent.click(screen.getByRole("button", { name: en.miniGame.skip }));
    screen.getByRole("button", { name: en.talk.ask.mission });
  });
});
