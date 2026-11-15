import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "../i18n";
import { TICK_MS } from "../game/miniGames";
import { JOBS, type JobId } from "../sim/types";
import { MoonMiniGame } from "./MoonMiniGame";

const t = i18n.t.bind(i18n);
const jobIds = Object.keys(JOBS) as JobId[];
const btn = (name: string) => screen.getByRole("button", { name });
const wait = (ticks = 1) => act(() => { vi.advanceTimersByTime(TICK_MS * ticks); });
const won = () => screen.queryByText(t("miniGame.won")) !== null;
const column = (selector: string) => {
  const cell = document.querySelector(selector)?.closest(".mini-row > span");
  return cell ? [...cell.parentElement!.children].indexOf(cell) : -1;
};

/** Plays a Moon mini game through its buttons, a tick at a time, the way a kid would. */
function playThrough(job: JobId) {
  // The clock waits for the first press (#81, like the Mars games): tap the board once to start.
  fireEvent.click(document.querySelector<HTMLButtonElement>(".mini-board button")!);
  for (let i = 0; i < 400 && !won(); i++) {
    switch (job) {
      case "panels": {
        const sun = column(".mini-sky .moon-sun"), aim = column(".mini-sky.dish .panel-here");
        if (sun !== aim) fireEvent.click(btn(t(sun > aim ? "miniGame.moon.panels.right" : "miniGame.moon.panels.left")));
        break;
      }
      case "greenhouse":
        for (const b of screen.queryAllByRole("button", { name: new RegExp(`${t("miniGame.moon.greenhouse.frozen")}|${t("miniGame.moon.greenhouse.melting")}`) })) fireEvent.click(b);
        break;
      case "shelter":
        fireEvent.click(btn(t("miniGame.moon.shelter.pour")));
        break;
      case "askEarth": {
        const send = btn(t("miniGame.moon.askEarth.send")), read = btn(t("miniGame.moon.askEarth.read"));
        if (!(read as HTMLButtonElement).disabled) fireEvent.click(read);
        else if (!(send as HTMLButtonElement).disabled) fireEvent.click(send);
        break;
      }
      case "science":
        for (const b of screen.queryAllByRole("button", { name: new RegExp(t("miniGame.moon.science.ice")) })) fireEvent.click(b);
        break;
    }
    if (!won()) wait();
  }
}

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); void i18n.changeLanguage("en"); });

describe("MoonMiniGame", () => {
  it.each(jobIds)("%s: a Moon game with its own title, can be played to the end, then back to the plan", (job) => {
    const onClose = vi.fn();
    render(<MoonMiniGame job={job} seed={4} onClose={onClose} />);
    const title = t(`miniGame.moon.${job}.title`);
    expect(title).not.toBe(t(`miniGame.${job}.title`));
    expect(screen.getByRole("heading", { name: title })).toBeTruthy();
    expect(screen.getByText(t(`jobs.${job}`))).toBeTruthy();
    expect(screen.getByText(t(`miniGame.moon.${job}.fact`))).toBeTruthy();
    playThrough(job);
    expect(won()).toBe(true);
    fireEvent.click(btn(t("miniGame.finish")));
    expect(onClose).toHaveBeenCalledWith(true);
  });

  it("is drawn in pixel sprites, with no emoji", () => {
    for (const job of jobIds) {
      const { unmount, container } = render(<MoonMiniGame job={job} seed={2} onClose={vi.fn()} />);
      expect(container.ownerDocument.querySelectorAll(".mini-board img.pixel").length, job).toBeGreaterThan(0);
      expect(container.ownerDocument.querySelector(".mini-game")!.textContent, job).not.toMatch(/\p{Extended_Pictographic}/u);
      unmount();
    }
  });

  it("can be skipped, and plays with the keyboard", () => {
    const onClose = vi.fn();
    render(<MoonMiniGame job="shelter" seed={1} onClose={onClose} />);
    const dialog = screen.getByRole("dialog");
    fireEvent.keyDown(dialog, { key: " ", code: "Space" });
    expect(screen.getByText(t("miniGame.progress", { done: 1, total: 10 }))).toBeTruthy();
    fireEvent.click(btn(t("miniGame.skip")));
    expect(onClose).toHaveBeenCalledWith(false);
  });

  it("speaks Bulgarian too", async () => {
    await act(async () => { await i18n.changeLanguage("bg"); });
    render(<MoonMiniGame job="askEarth" seed={1} onClose={vi.fn()} />);
    expect(screen.getByRole("heading", { name: t("miniGame.moon.askEarth.title") }).textContent).toMatch(/\p{Script=Cyrillic}/u);
  });
});

describe("MoonMiniGame timing (#81, WCAG 2.2.1)", () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it("waits for the first press, and Pause stops the clock", () => {
    render(<MoonMiniGame job="science" seed={1} onClose={vi.fn()} />);
    const board = () => document.querySelector(".mini-board")!.innerHTML;
    const still = board();
    wait(30);
    expect(board()).toBe(still); // the lamp does not sweep before the kid starts
    expect(screen.getByText(t("miniGame.start"))).toBeTruthy();
    fireEvent.click(document.querySelector<HTMLButtonElement>(".mini-board button")!);
    const started = board();
    wait(30);
    expect(board()).not.toBe(started);
    fireEvent.click(btn(t("miniGame.pause")));
    const paused = board();
    wait(30);
    expect(board()).toBe(paused);
  });
});
