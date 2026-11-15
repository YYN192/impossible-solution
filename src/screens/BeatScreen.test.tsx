import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { campaignMission } from "../data/mission";
import i18n from "../i18n";
import { useGame } from "../state/game";
import { useMission } from "../state/mission";
import { START, useNav } from "../state/screen";
import { BeatScreen } from "./BeatScreen";

const t = i18n.t.bind(i18n) as unknown as (k: string, o?: object) => string;

function open(campaign: string, sol: number) {
  useNav.setState(START);
  useMission.setState({ status: "ready", setup: campaignMission(campaign, 7) });
  useNav.getState().next();
  useGame.setState({ state: { ...useGame.getState().state, sol } });
  useNav.setState({ screen: "beat", sol });
  return render(<BeatScreen />);
}

describe("beat screen: one interaction per sol, through the engine", () => {
  beforeEach(() => sessionStorage.clear());

  it("shows the site choice with every option and its real fact", () => {
    open("dust", 1);
    screen.getByRole("heading", { name: t("beat.siteMars.title") });
    for (const id of ["gale", "elysium", "meridiani"]) {
      const button = screen.getByRole("button", { name: new RegExp(t(`beat.siteMars.${id}.label`)) });
      expect(button.textContent).toContain(t(`beat.siteMars.${id}.real`));
    }
  });

  it("a choice changes the game, shows what was chosen, then continues to the plan", () => {
    open("dust", 1);
    fireEvent.click(screen.getByRole("button", { name: new RegExp(t("beat.siteMars.gale.label")) }));
    expect(useGame.getState().state.rules?.heater).toBe(2);
    expect(useGame.getState().state.dominoes.map((d) => d.id)).toEqual(["sol1-siteMars-gale"]);
    screen.getByText(t("beat.chose", { choice: t("beat.siteMars.gale.label") }));
    fireEvent.click(screen.getByRole("button", { name: new RegExp(t("beatUi.continue")) }));
    expect(useNav.getState()).toMatchObject({ screen: "plan", sol: 1 });
  });

  it("a choice the base cannot pay for is switched off and says why", () => {
    open("dust", 3);
    fireEvent.click(screen.getByRole("button", { name: t("handsOn.cards") })); // the upgrade opens hands-on (#59); check the plain cards
    act(() => useGame.setState({ state: { ...useGame.getState().state, bars: { power: 1, air: 5, dose: 0 } } }));
    const brush = screen.getByRole("button", { name: new RegExp(t("beat.upgrade.brush.label")) }) as HTMLButtonElement;
    expect(brush.disabled).toBe(true);
    expect(brush.textContent).toContain(t("beatUi.cannot"));
    expect((screen.getByRole("button", { name: new RegExp(t("beat.upgrade.none.label")) }) as HTMLButtonElement).disabled).toBe(false);
  });

  it("the radio beat shows the light delay and where it came from; a saved reading is never called today's", () => {
    open("dust", 4);
    screen.getByText(t("beatUi.delayMarsSaved", { minutes: 11 }));
    expect(screen.queryByText(/today/)).toBeNull();
    expect(screen.getByText(/Deep Space Network/)).toBeTruthy();
  });

  it("on the Moon the radio answers at once", () => {
    open("moon", 2);
    screen.getByText(t("beatUi.delayMoon"));
    fireEvent.click(screen.getByRole("button", { name: new RegExp(t("beat.radioMoon.call.label")) }));
    expect(useGame.getState().state.earthAnswer).toBeDefined();
    screen.getByText(new RegExp(t("earth.risk.low")));
  });
});
