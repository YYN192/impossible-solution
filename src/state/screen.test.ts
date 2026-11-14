import { beforeEach, describe, expect, it } from "vitest";
import { createGame } from "../sim/engine";
import { useGame } from "./game";
import { nextNav, START, type Nav, useNav } from "./screen";

describe("nextNav", () => {
  it("walks title → 3 × (morning → plan → endSol) → final", () => {
    const path: Nav[] = [START];
    while (path.at(-1)!.screen !== "final") path.push(nextNav(path.at(-1)!, 3));
    expect(
      path.map((n) => `${n.screen}${n.screen === "title" ? "" : n.sol}`),
    ).toEqual([
      "title",
      "morning1",
      "plan1",
      "endSol1",
      "morning2",
      "plan2",
      "endSol2",
      "morning3",
      "plan3",
      "endSol3",
      "final3",
    ]);
  });

  it("final → sol 1 morning (try again, same start)", () => {
    expect(nextNav({ screen: "final", sol: 3 })).toEqual({
      screen: "morning",
      sol: 1,
    });
  });
});

describe("navigation lifecycle", () => {
  beforeEach(() => {
    useGame.getState().reset();
    useNav.setState(START);
  });

  it("does not reset the game during ordinary in-mission navigation", () => {
    useGame.getState().endSol({});
    const progressed = useGame.getState().state;
    useNav.setState({ screen: "morning", sol: 2 });

    useNav.getState().next();
    useNav.getState().next();

    expect(useNav.getState()).toMatchObject({ screen: "endSol", sol: 2 });
    expect(useGame.getState().state).toBe(progressed);
  });

  it("home preserves the current run until Start mission is pressed", () => {
    useGame.getState().endSol({});
    const progressed = useGame.getState().state;
    useNav.setState({ screen: "plan", sol: 2 });

    useNav.getState().home();

    expect(useNav.getState()).toMatchObject(START);
    expect(useGame.getState().state).toBe(progressed);

    useNav.getState().next();
    expect(useNav.getState()).toMatchObject({ screen: "morning", sol: 1 });
    expect(useGame.getState()).toMatchObject({ state: createGame(), fell: [] });
  });

  it("final next and restart each begin a fresh run at morning sol 1", () => {
    for (const action of ["next", "restart"] as const) {
      useGame.getState().endSol({});
      useNav.setState({ screen: "final", sol: 3 });

      useNav.getState()[action]();

      expect(useNav.getState()).toMatchObject({ screen: "morning", sol: 1 });
      expect(useGame.getState()).toMatchObject({
        state: createGame(),
        fell: [],
      });
    }
  });

  it("endEarly preserves the current sol for the final screen", () => {
    useNav.setState({ screen: "plan", sol: 2 });

    useNav.getState().endEarly();

    expect(useNav.getState()).toMatchObject({ screen: "final", sol: 2 });
  });
});
