import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import App from "./App";
import i18n from "./i18n";
import { START, useNav } from "./state/screen";
import { useGame } from "./state/game";
import { useMission } from "./state/mission";
import { useSession } from "./game/session";
import { step } from "./sim/engine";
import type { JobId } from "./sim/types";
const t = i18n.t.bind(i18n);
const click = (name: string | RegExp) => fireEvent.click(screen.getByRole("button", { name }));
beforeEach(() => {
  window.history.replaceState({}, "", "/?demo=1");
  useNav.setState(START); useGame.getState().reset();
  useMission.setState({ status: "idle", setup: undefined });
  useSession.setState({ position: { x: 320, y: 212, facing: "back" }, draft: {}, before: undefined });
});
afterEach(cleanup);
async function launch() {
  render(<App />);
  fireEvent.click(await screen.findByRole("button", { name: t("title.start") }));
  const consoleButton = await screen.findByRole("button", { name: /Open mission console/ });
  await waitFor(() => expect((consoleButton as HTMLButtonElement).disabled).toBe(false));
  fireEvent.click(consoleButton);
  await screen.findByRole("heading", { name: t("morning.heading", { sol: 1 }) });
}
describe("complete expedition", () => {
  it("shows the title, short introduction, tooltip and data entry", async () => {
    render(<App />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(t("app.name"));
    await screen.findByRole("button", { name: t("title.start") });
    click("What's this? Sol"); screen.getByText(/40 minutes longer/);
    click(t("teacher.open")); screen.getByRole("heading", { name: t("teacher.title") });
    click(t("teacher.back")); screen.getByRole("heading", { name: t("app.name") });
    expect(document.documentElement.lang).toBe("en");
  });
  it("plays three actual plans, shows earned Earth answer and causal sources, then replays the same start", async () => {
    await launch();
    const setup = useMission.getState().setup!;
    const start = useGame.getState().state;
    // Skipping shelter on sol 1 lets the sol 2 particle burst raise the dose, so the final chain
    // carries a real-data source. Nobody gets tired, so every crew button stays clickable.
    const plans: JobId[][] = [["greenhouse", "panels", "askEarth"], ["panels", "greenhouse", "science"], ["panels", "greenhouse", "shelter"]];
    for (let sol = 1; sol <= 3; sol++) {
      expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(t("morning.heading", { sol }));
      if (sol === 2) screen.getByRole("button", { name: new RegExp(t("morning.radio")) });
      click(t("morning.goPlan"));
      for (const [i, job] of plans[sol - 1].entries()) { click(t("crew.name", { n: i + 1 })); click(t(`jobs.${job}`)); }
      const before = useGame.getState().state;
      const expected = step(before, useSession.getState().draft, setup.events, setup.forecasts).state;
      expect(Number(screen.getByRole("meter", { name: t("bars.power") }).getAttribute("aria-valuenow"))).toBe(expected.bars.power);
      click(/End sol/);
      expect(useGame.getState().state).toEqual(expected);
      click(sol < 3 ? t("endSol.nextMorning") : t("endSol.seeResults"));
    }
    screen.getByRole("heading", { name: t("final.heading") });
    expect(document.querySelectorAll(".chain").length).toBeGreaterThan(0);
    expect(document.querySelectorAll(".chain .chip a").length).toBeGreaterThan(0);
    click(t("final.tryAgain"));
    expect(useGame.getState().state).toEqual(start);
    expect(useMission.getState().setup).toBe(setup);
    screen.getByRole("heading", { name: t("morning.heading", { sol: 1 }) });
  });
  it("keeps a draft and the player's position while leaving the console", async () => {
    await launch(); click(t("morning.goPlan"));
    const start = useGame.getState().state;
    click(t("crew.name", { n: 1 })); click(t("jobs.greenhouse"));
    const position = useSession.getState().position;
    click(/Return to station/);
    await waitFor(() => expect((screen.getByRole("button", { name: /Open mission console/ }) as HTMLButtonElement).disabled).toBe(false));
    click(/Open mission console/);
    await screen.findByRole("heading", { name: t("plan.heading", { sol: 1 }) });
    expect(useSession.getState().draft).toEqual({ a1: "greenhouse" });
    expect(useSession.getState().position).toEqual(position);
    expect(useGame.getState().state).toEqual(start);
  });
  it("lets children leave crew idle deliberately and disables tired crew", async () => {
    await launch(); click(t("morning.goPlan")); click(/End sol/);
    screen.getByRole("alert"); click(new RegExp(t("play.confirmEnd"))); click(t("endSol.nextMorning")); click(t("morning.goPlan"));
    expect((screen.getByRole("button", { name: t("crew.name", { n: 1 }) }) as HTMLButtonElement).disabled).toBe(true);
    expect(useGame.getState().state.tired).toEqual(["a1"]);
  });
});
