import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import App from "./App";
import { DEMO_CHAIN_IDS } from "./data/demo";
import i18n from "./i18n";
import { useGame } from "./state/game";
import { useMission } from "./state/mission";
import { START, useNav } from "./state/screen";

const t = i18n.t.bind(i18n);

describe("?demo=1 recording path (#6)", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/?demo=1&offline=1");
    useNav.setState(START);
    useMission.setState({ status: "idle", setup: undefined });
    useGame.getState().reset();
  });
  afterEach(() => window.history.replaceState({}, "", "/"));

  async function playThroughUi() {
    const view = render(<App />);
    await screen.findByRole("status");
    fireEvent.click(screen.getByRole("button", { name: t("title.start") }));

    for (let sol = 1; sol <= 3; sol++) {
      fireEvent.click(
        screen.getByRole("button", { name: t("morning.goPlan") }),
      );
      fireEvent.click(screen.getByRole("button", { name: t("plan.endSol") }));
      fireEvent.click(
        screen.getByRole("button", {
          name: sol === 3 ? t("endSol.seeResults") : t("endSol.nextMorning"),
        }),
      );
    }

    const state = structuredClone(useGame.getState().state);
    view.unmount();
    return state;
  }

  it("drives the real UI to the same saved storm, start, and causal chain twice", async () => {
    const first = await playThroughUi();

    useNav.setState(START);
    useMission.setState({ status: "idle", setup: undefined });
    useGame.getState().reset();
    const second = await playThroughUi();

    expect(second).toEqual(first);
    expect(first.over).toBe(true);
    const byId = new Map(first.dominoes.map((domino) => [domino.id, domino]));
    expect(DEMO_CHAIN_IDS.every((id) => byId.has(id))).toBe(true);
    for (let i = 1; i < DEMO_CHAIN_IDS.length; i++) {
      expect(byId.get(DEMO_CHAIN_IDS[i])?.causeIds).toContain(
        DEMO_CHAIN_IDS[i - 1],
      );
    }
  });
});
