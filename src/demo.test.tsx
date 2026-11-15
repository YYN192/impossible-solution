import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import App from "./App";
import { DEMO_CHAIN_IDS, demoPlanForSol } from "./data/demo";
import { useSession } from "./game/session";
import { buildChains } from "./screens/final/buildChains";
import i18n from "./i18n";
import type { CrewId } from "./sim/types";
import { useGame } from "./state/game";
import { useMission } from "./state/mission";
import { START, useNav } from "./state/screen";

const t = i18n.t.bind(i18n);
const crewNumber: Record<CrewId, number> = { a1: 1, a2: 2, a3: 3 };
const click = (name: string | RegExp) =>
  fireEvent.click(screen.getByRole("button", { name }));

function resetStores() {
  useNav.setState(START);
  useMission.setState({ status: "idle", setup: undefined });
  useGame.getState().reset();
  useSession.setState({
    position: { x: 320, y: 212, facing: "back" },
    draft: {},
    before: undefined,
  });
}

describe("?demo=1 recording path (#6)", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/?demo=1&offline=1");
    resetStores();
  });
  afterEach(() => window.history.replaceState({}, "", "/"));

  async function playThroughUi() {
    const view = render(<App />);
    const start = await screen.findByRole("button", { name: t("title.start") });
    await waitFor(() =>
      expect((start as HTMLButtonElement).disabled).toBe(false),
    );
    fireEvent.click(start);
    const consoleButton = await screen.findByRole("button", {
      name: /Open mission console/,
    });
    await waitFor(() =>
      expect((consoleButton as HTMLButtonElement).disabled).toBe(false),
    );
    fireEvent.click(consoleButton);

    for (let sol = 1; sol <= 3; sol++) {
      await screen.findByRole("heading", {
        name: t("morning.heading", { sol }),
      });
      click(t("morning.goPlan"));
      for (const [crew, job] of Object.entries(demoPlanForSol(sol))) {
        click(t("crew.name", { n: crewNumber[crew as CrewId] }));
        click(t(`jobs.${job}`));
      }
      click(/End sol/);
      // Leaving a crew member idle on purpose asks for a second click.
      if (screen.queryByRole("button", { name: new RegExp(t("play.confirmEnd")) })) click(new RegExp(t("play.confirmEnd")));
      click(sol === 3 ? t("endSol.seeResults") : t("endSol.nextMorning"));
    }

    const state = structuredClone(useGame.getState().state);
    view.unmount();
    return state;
  }

  it("drives the real UI to the same saved storm, start, and causal chain twice", async () => {
    const first = await playThroughUi();

    resetStores();
    const second = await playThroughUi();

    expect(second).toEqual(first);
    expect(first.over).toBe(true);
    const byId = new Map(first.dominoes.map((domino) => [domino.id, domino]));
    expect(
      DEMO_CHAIN_IDS.every((id) => byId.has(id)),
      `missing demo chain from: ${[...byId.keys()].join(", ")}`,
    ).toBe(true);
    for (let i = 1; i < DEMO_CHAIN_IDS.length; i++) {
      expect(byId.get(DEMO_CHAIN_IDS[i])?.causeIds).toContain(
        DEMO_CHAIN_IDS[i - 1],
      );
    }
    // The final screen leads with the 5-link story, repeats no root, and shows a real-data chip.
    const chains = buildChains(first.dominoes);
    expect(chains[0].map((d) => d.id)).toEqual([...DEMO_CHAIN_IDS].reverse());
    expect(
      chains.flat().filter((d) => d.id === "sol1-panels-skipped"),
    ).toHaveLength(1);
    expect(chains.flat().some((d) => d.source)).toBe(true);
  }, 20_000); // plays the whole demo twice: slower CI machines need more than the 5 s default
});
