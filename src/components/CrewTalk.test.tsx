import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import en from "../i18n/en.json";
import { CrewTalk } from "./CrewTalk";

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
