import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "../../i18n";
import { solChanges } from "./changes";
import { SolChanges } from "./SolChanges";

const t = i18n.t.bind(i18n) as unknown as (k: string, o?: object) => string;
const changes = solChanges({ power: 5, air: 6, dose: 1, food: 3, science: 0 }, { power: 7, air: 5, dose: 1, food: 3, science: 1 });
const badges = () => [...document.querySelectorAll(".sol-change")].map((li) => li.className.replace("sol-change ", ""));
const motion = (reduce: boolean) =>
  (window.matchMedia = vi.fn((query: string) => ({ matches: reduce && query.includes("reduced-motion"), media: query, addEventListener: vi.fn(), removeEventListener: vi.fn() })) as never);

describe("end-of-sol changes pop in (#65)", () => {
  const before = window.matchMedia;
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => { vi.useRealTimers(); window.matchMedia = before; });

  it("reveals one change after another, bad news first, and each number counts up to its new value", () => {
    motion(false);
    render(<SolChanges changes={changes} />);
    expect(badges()).toEqual([]);
    act(() => { vi.advanceTimersByTime(400); });
    expect(badges()).toEqual(["bad"]); // air went down
    act(() => { vi.advanceTimersByTime(700); });
    expect(badges()).toEqual(["bad", "good"]); // then power up
    const power = document.querySelectorAll(".sol-change b")[1];
    expect(power.textContent).toBe("5"); // counting starts from the old value
    act(() => { vi.advanceTimersByTime(600); });
    expect(power.textContent).toBe("7");
    act(() => { vi.advanceTimersByTime(700); });
    expect(badges()).toEqual(["bad", "good", "good"]); // science
    expect(screen.queryByRole("button", { name: t("endSol.changes.showAll") })).toBeNull(); // nothing left to show
  });

  it("Show all shows every change at once with its final number", () => {
    motion(false);
    render(<SolChanges changes={changes} />);
    fireEvent.click(screen.getByRole("button", { name: t("endSol.changes.showAll") }));
    expect(badges()).toEqual(["bad", "good", "good"]);
    expect([...document.querySelectorAll(".sol-change b")].map((b) => b.textContent)).toEqual(["5", "7", "1"]);
  });

  it("with reduced motion everything is there at once, and the meaning is in words, not colour alone", () => {
    motion(true);
    render(<SolChanges changes={changes} />);
    expect(badges()).toEqual(["bad", "good", "good"]);
    screen.getByText(t("endSol.changes.sr", { name: t("bars.air"), from: "6", to: "5", verdict: t("endSol.changes.bad") }));
    expect(screen.getAllByText(t("endSol.changes.good"))).toHaveLength(2);
    expect(document.querySelector(".sol-change.bad .sol-change__diff")!.textContent).toBe("−1");
  });

  it("shows nothing when nothing changed", () => {
    const { container } = render(<SolChanges changes={[]} />);
    expect(container.innerHTML).toBe("");
  });
});
