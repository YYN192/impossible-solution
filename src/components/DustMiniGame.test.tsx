import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "../i18n";
import { TICK_MS } from "../game/miniGames";
import { DUST_JOBS } from "../game/dustMiniGames";
import { DustMiniGame } from "./DustMiniGame";

const t = i18n.t.bind(i18n);
const btn = (name: string) => screen.getByRole("button", { name });
const won = () => screen.queryByText(t("miniGame.won")) !== null;

beforeEach(() => { vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); });

describe("DustMiniGame", () => {
  it.each(DUST_JOBS)("%s: its own Dust Season game, can be played to the end", (job) => {
    const onClose = vi.fn();
    render(<DustMiniGame job={job} seed={4} onClose={onClose} />);
    expect(screen.getByRole("heading", { name: t(`miniGame.dust.${job}.title`) })).toBeTruthy();
    expect(screen.getByText(t(`miniGame.dust.${job}.fact`))).toBeTruthy();
    // The clock waits for the first press (#81, like the Mars games): tap the board once to start.
    fireEvent.click(document.querySelector<HTMLButtonElement>(".mini-board button")!);
    for (let i = 0; i < 400 && !won(); i++) {
      if (job === "panels") { const b = document.querySelector<HTMLButtonElement>(".mini-tile.gust-here:not(.clean)"); if (b) fireEvent.click(b); }
      else for (const b of screen.queryAllByRole("button", { name: new RegExp(t("miniGame.dust.greenhouse.cracked")) })) fireEvent.click(b);
      if (!won()) act(() => { vi.advanceTimersByTime(TICK_MS); });
    }
    expect(won()).toBe(true);
    expect(document.querySelectorAll(".mini-board img.pixel").length).toBeGreaterThan(0);
    fireEvent.click(btn(t("miniGame.finish")));
    expect(onClose).toHaveBeenCalledWith(true);
  });
});

describe("DustMiniGame timing (#81, WCAG 2.2.1)", () => {
  it("waits for the first press, and Pause stops the clock", () => {
    render(<DustMiniGame job="panels" seed={4} onClose={vi.fn()} />);
    const board = () => document.querySelector(".mini-board")!.innerHTML;
    const ticks = (n: number) => act(() => { vi.advanceTimersByTime(TICK_MS * n); });
    const still = board();
    ticks(30);
    expect(board()).toBe(still); // nothing moves before the kid starts
    expect(screen.getByText(t("miniGame.start"))).toBeTruthy();
    fireEvent.click(document.querySelector<HTMLButtonElement>(".mini-board button")!);
    const started = board();
    ticks(30);
    expect(board()).not.toBe(started);
    fireEvent.click(btn(t("miniGame.pause")));
    const paused = board();
    ticks(30);
    expect(board()).toBe(paused);
    expect(screen.getByText(t("miniGame.paused"))).toBeTruthy();
  });
});
