import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "../i18n";
import { JobMiniGame } from "./JobMiniGame";
import { mistake } from "../game/feedback";

vi.mock("../game/feedback", () => ({ mistake: vi.fn(), shake: vi.fn() }));

const t = i18n.t.bind(i18n);
const SEED = 4;
/** Keys go to <body>, like a page where focus was lost. */
const key = (code: string) =>
  fireEvent.keyDown(document.body, { code, key: "" });
const column = (selector: string) => {
  const cell = document.querySelector(selector)?.closest(".mini-row > span");
  return cell ? [...cell.parentElement!.children].indexOf(cell) : -1;
};

describe("mini-game mistakes and Ask Earth keys", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(mistake).mockClear();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("A/D keep turning after the disabled edge button dropped focus, W sends", () => {
    render(<JobMiniGame job="askEarth" seed={SEED} onClose={vi.fn()} />);
    const start = column(".dish-here");
    const toEdge = start > 0 ? "KeyA" : "KeyD";
    for (let i = 0; i < 6; i++) key(toEdge); // press into the edge; the button there is disabled
    const edge = column(".dish-here");
    expect(edge === 0 || edge === 4).toBe(true);
    key(edge === 0 ? "KeyD" : "KeyA");
    expect(column(".dish-here")).toBe(edge === 0 ? 1 : 3);
    // W when not aimed is a mistake; once aimed, W sends.
    vi.mocked(mistake).mockClear();
    if (column(".dish-here") !== column(".mini-sky .earth")) {
      key("KeyW");
      expect(mistake).toHaveBeenCalledWith("small", expect.anything());
    }
    for (let i = 0; i < 6; i++) {
      if (column(".dish-here") === column(".mini-sky .earth")) break;
      key(column(".dish-here") < column(".mini-sky .earth") ? "KeyD" : "KeyA");
    }
    key("KeyW");
    expect(document.querySelector(".mini-meter .on")).not.toBeNull();
  });

  it("a missed block drop calls the mistake helper", () => {
    render(<JobMiniGame job="shelter" seed={SEED} onClose={vi.fn()} />);
    const drop = screen.getByRole("button", {
      name: t("miniGame.shelter.drop"),
    });
    fireEvent.click(drop); // starts the clock
    fireEvent.click(drop); // block is still at the edge: off-centre
    expect(mistake).toHaveBeenCalledWith("small", expect.anything());
  });

  it("a panel blown dusty again calls the mistake helper", () => {
    render(<JobMiniGame job="panels" seed={SEED} onClose={vi.fn()} />);
    fireEvent.click(document.querySelector<HTMLElement>(".mini-tile")!); // one clean panel: the wind dusts it
    act(() => {
      vi.advanceTimersByTime(300 * 4);
    });
    expect(mistake).toHaveBeenCalled();
  });
});
