import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import i18n from "../i18n";
import { BEST_KEY, useBest } from "../state/best";
import { useNav } from "../state/screen";
import { FAKE_DOMINOES } from "./fakeGame";
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

describe("Final screen", () => {
  beforeEach(() => {
    localStorage.clear();
    useBest.setState({ best: 0 });
    useNav.setState({ screen: "final", sol: 3 });
  });
  afterEach(cleanup);

  it("shows the chain from the problem back to its first cause", () => {
    render(<FinalScreen />);
    expect(chainTexts()).toEqual([
      "One astronaut is too tired to work.",
      "The food ran out.",
      "Nobody ran the greenhouse lights.",
      "Power is low today.",
      "Nobody cleaned the solar panels.",
    ]);
    // Every link after the first says "because"; each shows its sol.
    expect(document.querySelectorAll(".chain .because")).toHaveLength(4);
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
    screen.getByText("2 stars out of 3");
    expect(document.querySelectorAll(".star-goals .won")).toHaveLength(2);
    expect(
      document.querySelector(".star-goals .missed")?.textContent,
    ).toContain(t("final.goal.science"));
  });

  it("Best keeps the highest score and survives a reload", () => {
    render(<FinalView dominoes={[]} stars={stars(2)} />);
    screen.getByText("Best: 2★");
    cleanup();
    render(<FinalView dominoes={[]} stars={stars(1)} />);
    screen.getByText("1 star out of 3");
    screen.getByText("Best: 2★");
    expect(localStorage.getItem(BEST_KEY)).toBe("2");
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
