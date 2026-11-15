import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "../i18n";
import bg from "../i18n/bg.json";
import { TICK_MS } from "../game/miniGames";
import { JOBS, type JobId } from "../sim/types";
import { JobMiniGame } from "./JobMiniGame";

const t = i18n.t.bind(i18n);
const jobIds = Object.keys(JOBS) as JobId[];
const btn = (name: string) => screen.getByRole("button", { name });
const SEED = 4;
const wait = (ticks = 1) => act(() => { vi.advanceTimersByTime(TICK_MS * ticks); });
const won = () => screen.queryByText(t("miniGame.won")) !== null;
/** Column of the element with this class in a 5-cell row (the sky or the dish row). */
const column = (selector: string) => {
  const cell = document.querySelector(selector)?.closest(".mini-row > span");
  return cell ? [...cell.parentElement!.children].indexOf(cell) : -1;
};

/** Plays the mini game through its buttons, a tick at a time, the way a kid would. */
function playThrough(job: JobId) {
  for (let i = 0; i < 300 && !won(); i++) {
    switch (job) {
      case "panels":
        for (const b of screen.queryAllByRole("button", { name: new RegExp(t("miniGame.panels.dusty")) })) fireEvent.click(b);
        break;
      case "greenhouse":
        for (const b of screen.queryAllByRole("button", { name: new RegExp(t("miniGame.greenhouse.thirsty")) })) fireEvent.click(b);
        break;
      case "shelter":
        if (screen.queryByText(t("miniGame.shelter.now"))) fireEvent.click(btn(t("miniGame.shelter.drop")));
        break;
      case "askEarth": {
        const earth = column(".mini-sky .earth"), aim = column(".mini-sky.dish .dish-here");
        if (earth === aim) fireEvent.click(btn(t("miniGame.askEarth.send")));
        else fireEvent.click(btn(t(earth > aim ? "miniGame.askEarth.right" : "miniGame.askEarth.left")));
        break;
      }
      case "science":
        for (const b of screen.queryAllByRole("button", { name: new RegExp(t("miniGame.science.shiny")) })) fireEvent.click(b);
        break;
    }
    if (!won()) wait();
  }
}

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); void i18n.changeLanguage("en"); });

describe("JobMiniGame", () => {
  it.each(jobIds)("%s: names the job, can be played to the end, then goes back to the plan", (job) => {
    const onClose = vi.fn();
    render(<JobMiniGame job={job} seed={SEED} onClose={onClose} />);
    expect(screen.getByRole("heading", { name: t(`miniGame.${job}.title`) })).toBeTruthy();
    expect(screen.getByText(t(`jobs.${job}`))).toBeTruthy();
    expect(won()).toBe(false);
    playThrough(job);
    expect(won()).toBe(true);
    fireEvent.click(btn(t("miniGame.finish")));
    expect(onClose).toHaveBeenCalledWith(true);
  });

  it.each(jobIds)("%s is drawn with pixel sprites, not emoji", (job) => {
    render(<JobMiniGame job={job} seed={SEED} onClose={() => {}} />);
    wait(4);
    const dialog = screen.getByRole("dialog");
    expect(dialog.textContent).not.toMatch(/\p{Extended_Pictographic}/u);
    const sprites = [...dialog.querySelectorAll<HTMLImageElement>(".mini-board img")];
    expect(sprites.length).toBeGreaterThan(0);
    for (const img of sprites) expect(img.classList.contains("pixel")).toBe(true);
  });

  it("moves by itself: the dust blows back onto a clean panel", () => {
    render(<JobMiniGame job="panels" seed={SEED} onClose={() => {}} />);
    fireEvent.click(btn(t("miniGame.panels.panel", { n: 1, state: t("miniGame.panels.dusty") })));
    expect(btn(t("miniGame.panels.panel", { n: 1, state: t("miniGame.panels.clean") }))).toBeTruthy();
    wait(10);
    expect(btn(t("miniGame.panels.panel", { n: 1, state: t("miniGame.panels.dusty") }))).toBeTruthy();
  });

  it("dropping the block at the wrong moment is a gentle miss", () => {
    render(<JobMiniGame job="shelter" seed={SEED} onClose={() => {}} />);
    expect(screen.queryByText(t("miniGame.shelter.now"))).toBeNull();
    fireEvent.click(btn(t("miniGame.shelter.drop")));
    expect(screen.getByText(t("miniGame.shelter.oops"))).toBeTruthy();
  });

  it("the dish only sends while it points at Earth", () => {
    render(<JobMiniGame job="askEarth" seed={SEED} onClose={() => {}} />);
    expect((btn(t("miniGame.askEarth.send")) as HTMLButtonElement).disabled).toBe(true);
  });

  it("can always be skipped: the job stays assigned, the game is just for fun", () => {
    const onClose = vi.fn();
    render(<JobMiniGame job="panels" seed={SEED} onClose={onClose} />);
    fireEvent.click(btn(t("miniGame.skip")));
    expect(onClose).toHaveBeenCalledWith(false);
  });

  it("stops the clock when closed (no timer left running)", () => {
    const start = vi.spyOn(globalThis, "setInterval");
    const stop = vi.spyOn(globalThis, "clearInterval");
    const { unmount } = render(<JobMiniGame job="science" seed={SEED} onClose={() => {}} />);
    const clock = start.mock.results.at(-1)?.value;
    expect(clock).toBeDefined();
    unmount();
    expect(stop).toHaveBeenCalledWith(clock);
  });

  it("speaks Bulgarian when the game is in Bulgarian", async () => {
    await act(() => i18n.changeLanguage("bg"));
    render(<JobMiniGame job="shelter" seed={SEED} onClose={() => {}} />);
    expect(screen.getByRole("heading", { name: bg.miniGame.shelter.title })).toBeTruthy();
    expect(btn(bg.miniGame.skip)).toBeTruthy();
  });
});
