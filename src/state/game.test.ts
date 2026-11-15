import { dominoView } from "../test/icons";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createGame, ENGINE, stars } from "../sim/engine";
import { MISSION_SOLS } from "../sim/types";
import { DEMO_CHAIN_IDS, DEMO_PLANS } from "../data/demo";
import { readFlags } from "../data/flags";
import { FinalScreen } from "../screens/FinalScreen";
import { MorningScreen } from "../screens/MorningScreen";
import { useGame } from "./game";
import { useMission } from "./mission";
import { START, useNav } from "./screen";

const dominoViews = (sel: string) => [...document.querySelectorAll(sel)].map(dominoView);
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
    fireEvent.click(screen.getByRole("button", { name: /Why\?/ }));
    expect(dominoViews(".domino")).toEqual([
      "power down|Power is low today.",
      "wipe x|Nobody cleaned the solar panels.",
    ]);
  });

  it("the final screen shows the engine's stars and chain", () => {
    for (let sol = 1; sol <= MISSION_SOLS; sol++)
      useGame.getState().endSol({ a1: "greenhouse" });
    const { state } = useGame.getState();
    expect(state.over).toBe(true);
    useNav.setState({ screen: "final", sol: MISSION_SOLS });
    render(createElement(FinalScreen));
    expect(document.querySelectorAll('.stars-count [data-icon="star"]')).toHaveLength(stars(state).count);
    expect(document.querySelectorAll('.stars-count [data-icon="star-empty"]')).toHaveLength(3 - stars(state).count);
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
            source: {
              label: "x",
              url: "https://example.org",
              mode: "snapshot",
            },
          },
        ],
        forecasts: {},
      } as never,
    });
    useGame.getState().endSol({});
    expect(useGame.getState().fell.map((d) => d.id)).toContain(
      "sol1-dose-high",
    );
  });

  it("can step safely before mission data has loaded", () => {
    useMission.setState({ status: "loading", setup: undefined });

    expect(() => useGame.getState().endSol({})).not.toThrow();
    expect(useGame.getState().state.sol).toBe(2);
  });

  it("?demo=1 replays the same real-engine chain every time, fully offline", async () => {
    const flags = readFlags("?demo=1&offline=1&sun=today");
    expect(flags).toEqual({ demo: true, offline: true, todaysSun: false });
    await useMission.getState().load(flags);

    const replay = () => {
      useGame.getState().reset();
      expect(Object.values(DEMO_PLANS[1])).not.toContain("greenhouse");
      for (const [index, plan] of DEMO_PLANS.entries()) {
        if (index === 1) {
          expect(useGame.getState().state.bars.power).toBeLessThan(
            ENGINE.lowPowerToday,
          );
        }
        useGame.getState().endSol(plan);
      }
      return structuredClone(useGame.getState().state);
    };

    const first = replay();
    const second = replay();
    expect(second).toEqual(first);

    const byId = new Map(first.dominoes.map((domino) => [domino.id, domino]));
    expect(DEMO_CHAIN_IDS.every((id) => byId.has(id))).toBe(true);
    for (let i = 1; i < DEMO_CHAIN_IDS.length; i++) {
      expect(byId.get(DEMO_CHAIN_IDS[i])?.causeIds).toContain(
        DEMO_CHAIN_IDS[i - 1],
      );
    }
    expect(first.over).toBe(true);
  });
});
