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
