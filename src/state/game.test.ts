import { cleanup, render } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createGame, stars } from "../sim/engine";
import { MISSION_SOLS } from "../sim/types";
import { FinalScreen } from "../screens/FinalScreen";
import { MorningScreen } from "../screens/MorningScreen";
import { useGame } from "./game";
import { useMission } from "./mission";
import { START, useNav } from "./screen";

const dominoTexts = (sel: string) =>
  [...document.querySelectorAll(sel)].map((d) => d.textContent);

describe("game store (real engine)", () => {
  beforeEach(() => {
    useGame.getState().reset();
    useMission.setState({ status: "idle", setup: undefined });
    useNav.setState(START);
  });
  afterEach(cleanup);

  it("endSol runs one engine step and keeps what fell for the morning", () => {
    const state = useGame.getState().endSol({ a1: "greenhouse" });
    expect(state.sol).toBe(2);
    const ids = useGame.getState().fell.map((d) => d.id);
    expect(ids).toContain("sol1-panels-skipped");
    expect(ids).toContain("sol2-power-low");
    expect(useGame.getState().state.dominoes.map((d) => d.id)).toEqual(ids);
  });

  it("the morning report shows the engine's domino and its cause", () => {
    useGame.getState().endSol({ a1: "greenhouse" }); // nobody cleans the panels
    useNav.setState({ screen: "morning", sol: 2 });
    render(createElement(MorningScreen));
    expect(dominoTexts(".domino")).toEqual([
      "⚡↓Power is low today.",
      "🧽✗Nobody cleaned the solar panels.",
    ]);
  });

  it("the final screen shows the engine's stars and chain", () => {
    for (let sol = 1; sol <= MISSION_SOLS; sol++)
      useGame.getState().endSol({ a1: "greenhouse" });
    const { state } = useGame.getState();
    expect(state.over).toBe(true);
    useNav.setState({ screen: "final", sol: MISSION_SOLS });
    render(createElement(FinalScreen));
    expect(document.querySelector(".stars-count")?.textContent).toContain(
      "★".repeat(stars(state).count),
    );
    expect(dominoTexts(".chain .domino-text")).toContain(
      "Nobody cleaned the solar panels.",
    );
  });

  it("Start mission and Try a different plan both start a fresh game", () => {
    useGame.getState().endSol({});
    useNav.getState().next(); // title → morning sol 1
    expect(useGame.getState().state).toEqual(createGame());

    useGame.getState().endSol({});
    useNav.setState({ screen: "final", sol: MISSION_SOLS });
    useNav.getState().restart();
    expect(useGame.getState()).toMatchObject({ state: createGame(), fell: [] });
  });

  it("uses the mission's storm events once they are loaded", () => {
    useMission.setState({
      status: "ready",
      setup: {
        events: [
          {
            sol: 1,
            kind: "particleBurst",
            captionKey: "event.burst.may2024",
            source: { label: "x", url: "https://example.org", mode: "snapshot" },
          },
        ],
        forecasts: {},
      } as never,
    });
    useGame.getState().endSol({});
    expect(useGame.getState().fell.map((d) => d.id)).toContain("sol1-dose-high");
  });
});
