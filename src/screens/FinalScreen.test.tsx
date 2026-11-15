import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import i18n from "../i18n";
import { BEST_KEY, useBest } from "../state/best";
import { useNav } from "../state/screen";
import { FAKE_DOMINOES, loadFakeGame } from "../test/fixtures/fakeGame";
import { FinalScreen, FinalView, type Stars } from "./FinalScreen";

const t = i18n.t.bind(i18n);
const stars = (count: Stars["count"]): Stars => ({
  crewSafe: count >= 1,
  baseRunning: count >= 2,
  science: count >= 3,
  count,
});
const chainTexts = () =>
  [...document.querySelectorAll(".chain .domino-text")].map(
    (d) => d.textContent,
  );

describe("Final screen wording (#67)", () => {
  beforeEach(() => { localStorage.clear(); useBest.setState({ best: 0 }); });
  afterEach(cleanup);
  const tt = t as unknown as (k: string, o?: object) => string;

  it('says "Mission complete! N of 3 stars" and gives one tip for the first goal it missed', () => {
    render(<FinalView dominoes={[]} stars={stars(1)} />);
    screen.getByRole("heading", { name: tt("final.heading", { count: 1 }) });
    const tips = document.querySelectorAll(".next-time");
    expect(tips).toHaveLength(1);
    expect(tips[0].textContent!.trim()).toBe(tt("final.next.baseRunning"));
  });

  it("no tip when every star was earned", () => {
    render(<FinalView dominoes={[]} stars={stars(3)} />);
    screen.getByRole("heading", { name: tt("final.heading", { count: 3 }) });
    expect(document.querySelectorAll(".next-time")).toHaveLength(0);
  });

  it("does not repeat the star count under the heading (the star icons stay)", () => {
    render(<FinalView dominoes={[]} stars={stars(2)} />);
    expect(document.querySelector(".stars-count")!.textContent!.trim()).toBe("");
    expect(document.querySelectorAll(".stars-count .px-icon").length).toBe(3);
  });

  it("a mission that ended early still says what to try next time", () => {
    render(<FinalView dominoes={[]} stars={stars(0)} endedEarly />);
    screen.getByRole("heading", { name: tt("final.endedEarly") });
    expect(document.querySelector(".next-time")!.textContent!.trim()).toBe(tt("final.next.crewSafe"));
  });
});

describe("Final screen", () => {
  beforeEach(() => {
    localStorage.clear();
    useBest.setState({ best: 0 });
    loadFakeGame(3, { final: true });
    useNav.setState({ screen: "final", sol: 3 });
  });
  afterEach(cleanup);

  it("shows one row of dominoes from the first cause to the result", () => {
    render(<FinalScreen />);
    expect(chainTexts()).toEqual([
      "Nobody cleaned the solar panels.",
      "Power is low today.",
      "Nobody ran the greenhouse lights.",
      "The food ran out.",
      "One astronaut is too tired to work.",
    ]);
    // Every link after the first is joined by an arrow ("so" for screen readers); each shows its sol.
    expect(document.querySelectorAll(".chain .domino-arrow")).toHaveLength(4);
    expect(document.querySelectorAll(".chain")).toHaveLength(1);
    screen.getByText("Sol 3");
    screen.getAllByText("Sol 2");
    screen.getByText("Sol 1");
  });

  it("every domino in the chain uses the fall effect, one after another", () => {
    render(<FinalScreen />);
    const items = [...document.querySelectorAll<HTMLElement>(".chain li")];
    expect(
      items.map((li) => li.style.getPropertyValue("--fall-delay")),
    ).toEqual(["0ms", "250ms", "500ms", "750ms", "1000ms"]);
    expect(document.querySelectorAll(".chain .domino-fall")).toHaveLength(5);
  });

  it("shows the stars and which goals were reached", () => {
    render(<FinalView dominoes={FAKE_DOMINOES} stars={stars(2)} />);
    screen.getByRole("heading", { name: "Mission complete! 2 of 3 stars" }); // #67: the count is in the heading
    expect(document.querySelectorAll(".star-goals .won")).toHaveLength(2);
    expect(
      document.querySelector(".star-goals .missed")?.textContent,
    ).toContain(t("final.goal.science"));
  });

  it("Best keeps the highest score and survives a reload", () => {
    render(<FinalView dominoes={[]} stars={stars(2)} />);
    screen.getByText("Best: 2 stars");
    cleanup();
    render(<FinalView dominoes={[]} stars={stars(1)} />);
    screen.getByRole("heading", { name: "Mission complete! 1 of 3 stars" });
    screen.getByText("Best: 2 stars");
    expect(localStorage.getItem(BEST_KEY)).toBe("2");
  });

  it("?demo=1 never shows or saves a Best score (the recording stays the same)", () => {
    localStorage.setItem(BEST_KEY, "3");
    useBest.setState({ best: 3 });
    window.history.replaceState({}, "", "/?demo=1");
    render(<FinalView dominoes={[]} stars={stars(2)} />);
    window.history.replaceState({}, "", "/");
    expect(document.body.textContent).not.toContain("Best");
  });

  it("no chain when nothing fell", () => {
    render(<FinalView dominoes={[]} stars={stars(3)} />);
    screen.getByText(t("final.noChain"));
    expect(document.querySelector(".chain")).toBeNull();
  });

  it("ended early says so", () => {
    render(<FinalView dominoes={FAKE_DOMINOES} stars={stars(0)} endedEarly />);
    screen.getByRole("heading", { name: t("final.endedEarly") });
  });

  it("'Try a different plan' restarts on sol 1 with the same start", () => {
    render(<FinalScreen />);
    fireEvent.click(screen.getByRole("button", { name: t("final.tryAgain") }));
    expect(useNav.getState()).toMatchObject({ screen: "morning", sol: 1 });
  });
});
