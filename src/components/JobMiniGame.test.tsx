import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "../i18n";
import bg from "../i18n/bg.json";
import { TICK_MS } from "../game/miniGames";
import { JOBS, type JobId } from "../sim/types";
import { JobMiniGame } from "./JobMiniGame";
import { useComfort } from "../state/comfort";

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

/** The first press starts the clock (#77); any button on the board does it. */
const startClock = () => fireEvent.click(document.querySelector(".mini-board button:not(:disabled)")!);
/** Plays the mini game through its buttons, a tick at a time, the way a kid would. */
function playThrough(job: JobId) {
  startClock();
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

  it("dropping the block at the wrong moment is a gentle miss (the very first press drops it)", () => {
    render(<JobMiniGame job="shelter" seed={SEED} onClose={() => {}} />);
    expect(screen.queryByText(t("miniGame.shelter.now"))).toBeNull();
    fireEvent.click(btn(t("miniGame.shelter.drop")));
    expect(screen.getByText(t("miniGame.shelter.oops"))).toBeTruthy();
  });

  it("Shelter: the block slides as soon as the game opens; no press needed to start it", () => {
    render(<JobMiniGame job="shelter" seed={SEED} onClose={() => {}} />);
    expect(screen.queryByText(t("miniGame.start"))).toBeNull();
    btn(t("miniGame.pause")); // the clock is already running, so it can be paused
    const where = () => document.querySelector(".mini-board")!.innerHTML;
    const before = where();
    wait(2);
    expect(where()).not.toBe(before); // the block moved by itself
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
    startClock();
    const clock = start.mock.results.at(-1)?.value;
    expect(clock).toBeDefined();
    unmount();
    expect(stop).toHaveBeenCalledWith(clock);
  });

  it("#77: the clock waits for the first press, pauses, and runs at half speed in slow mode", () => {
    const start = vi.spyOn(globalThis, "setInterval");
    const ticking = () => start.mock.calls.filter(([, ms]) => ms === TICK_MS || ms === TICK_MS * 2).length;
    render(<JobMiniGame job="panels" seed={SEED} onClose={() => {}} />);
    screen.getByText(t("miniGame.start"));
    expect(ticking()).toBe(0);
    startClock();
    expect(ticking()).toBe(1);
    const stop = vi.spyOn(globalThis, "clearInterval");
    fireEvent.click(btn(t("miniGame.pause")));
    expect(stop).toHaveBeenCalled();
    screen.getByText(t("miniGame.paused"));
    const before = ticking();
    fireEvent.click(btn(t("miniGame.resume")));
    expect(ticking()).toBe(before + 1);
    act(() => { useComfort.setState({ slowMiniGames: true }); });
    expect(start.mock.calls.at(-1)?.[1]).toBe(TICK_MS * 2);
    act(() => { useComfort.setState({ slowMiniGames: false }); });
  });

  it("#77: \"Great job!\" shows for 1 s, then goes back to the plan by itself", () => {
    const onClose = vi.fn();
    render(<JobMiniGame job="panels" seed={SEED} onClose={onClose} />);
    playThrough("panels");
    expect(won()).toBe(true);
    act(() => { vi.advanceTimersByTime(999); });
    expect(onClose).not.toHaveBeenCalled();
    act(() => { vi.advanceTimersByTime(1); });
    expect(onClose).toHaveBeenCalledWith(true);
  });

  it("speaks Bulgarian when the game is in Bulgarian", async () => {
    await act(() => i18n.changeLanguage("bg"));
    render(<JobMiniGame job="shelter" seed={SEED} onClose={() => {}} />);
    expect(screen.getByRole("heading", { name: bg.miniGame.shelter.title })).toBeTruthy();
    expect(btn(bg.miniGame.skip)).toBeTruthy();
  });
});

// #63: every mini-game can be played with the keyboard, by physical key (works on Bulgarian layouts too).
describe("mini-games with the keyboard (#63)", () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });
  const key = (code: string, k = "") => fireEvent.keyDown(document.querySelector("dialog.mini-game")!, { code, key: k });

  it("Ask Earth: arrows / A-D aim the dish, Space sends", () => {
    render(<JobMiniGame job="askEarth" seed={SEED} onClose={vi.fn()} />);
    const start = column(".dish-here");
    key(start > 0 ? "ArrowLeft" : "ArrowRight");
    expect(column(".dish-here")).toBe(start > 0 ? start - 1 : start + 1);
    key(start > 0 ? "KeyD" : "KeyA", start > 0 ? "в" : "ф"); // Bulgarian letters, same physical keys
    expect(column(".dish-here")).toBe(start);
  });

  it("Ask Earth: quick presses all count, and a press never undoes the clock's move", () => {
    render(<JobMiniGame job="askEarth" seed={SEED} onClose={vi.fn()} />);
    const start = column(".dish-here");
    const code = start > 0 ? "ArrowLeft" : "ArrowRight", by = start > 0 ? -1 : 1;
    const press = () => window.dispatchEvent(new KeyboardEvent("keydown", { code, key: code, bubbles: true }));
    // Two presses before React re-renders (a fast double tap or a held key): both must move the dish.
    act(() => { press(); press(); });
    expect(column(".dish-here")).toBe(start + 2 * by);
    // A clock tick lands between React's render and the next press: Earth must not jump back.
    act(() => { vi.advanceTimersByTime(TICK_MS * 3); });
    const earth = column(".mini-sky .earth");
    act(() => { vi.advanceTimersByTime(TICK_MS); press(); });
    const earthAfter = column(".mini-sky .earth");
    act(() => { vi.advanceTimersByTime(0); });
    expect(column(".mini-sky .earth")).toBe(earthAfter);
    expect(earthAfter === earth || Math.abs(earthAfter - earth) === 1).toBe(true);
  });

  it("Shelter: Space drops the block", () => {
    render(<JobMiniGame job="shelter" seed={SEED} onClose={vi.fn()} />);
    const status = () => document.querySelector(".storm-left")!.textContent;
    const before = status();
    key("Space", " ");
    expect(status()).not.toBe(before); // either a block is placed (progress) or "oops" (a miss)
  });

  it("grid games: arrow keys move between tiles", () => {
    render(<JobMiniGame job="panels" seed={SEED} onClose={vi.fn()} />);
    const tiles = [...document.querySelectorAll<HTMLButtonElement>(".mini-tile")];
    tiles[0].focus();
    fireEvent.keyDown(tiles[0], { code: "ArrowRight", key: "ArrowRight" });
    expect(document.activeElement).toBe(tiles[1]);
    fireEvent.keyDown(tiles[1], { code: "ArrowLeft", key: "ArrowLeft" });
    expect(document.activeElement).toBe(tiles[0]);
  });

  it("shows which keys to use", () => {
    render(<JobMiniGame job="askEarth" seed={SEED} onClose={vi.fn()} />);
    screen.getByText(t("miniGame.keys.askEarth"));
  });
});

describe("JobMiniGame and the music", () => {
  afterEach(() => { vi.useRealTimers(); });
  it("tells the music coordinator it is open for exactly as long as it is on screen (rapid open/close)", async () => {
    const { musicDebug } = await import("../game/audio");
    const first = render(<JobMiniGame job="panels" seed={SEED} onClose={() => {}} />);
    expect(musicDebug.miniGames()).toBe(1);
    first.unmount();
    expect(musicDebug.miniGames()).toBe(0);
    for (const job of jobIds) render(<JobMiniGame job={job} seed={SEED} onClose={() => {}} />).unmount();
    expect(musicDebug.miniGames()).toBe(0);
  });
});

describe("Dust and Moon mini games and the music", () => {
  it("also report open/close to the music coordinator", async () => {
    const { musicDebug } = await import("../game/audio");
    const { DustMiniGame } = await import("./DustMiniGame");
    const { MoonMiniGame } = await import("./MoonMiniGame");
    const { DUST_JOBS } = await import("../game/dustMiniGames");
    const dust = render(<DustMiniGame job={DUST_JOBS[0]} seed={SEED} onClose={() => {}} />);
    expect(musicDebug.miniGames()).toBe(1);
    dust.unmount();
    const moon = render(<MoonMiniGame job="panels" seed={SEED} onClose={() => {}} />);
    expect(musicDebug.miniGames()).toBe(1);
    moon.unmount();
    expect(musicDebug.miniGames()).toBe(0);
  });
});
