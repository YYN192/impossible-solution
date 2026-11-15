import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import i18n from "./i18n";
import PlanScreen from "./PlanScreen";
import { useSession } from "./game/session";
import { may2024Mission } from "./data/mission";
import { createGame, step } from "./sim/engine";
import { DOSE, JOBS, type JobId, type Plan } from "./sim/types";
import { useGame } from "./state/game";
import { useMission } from "./state/mission";
import { iconsOf } from "./test/icons";

const t = i18n.t.bind(i18n);
const jobIds = Object.keys(JOBS) as JobId[];
const btn = (name: string) => screen.getByRole("button", { name });
const power = () =>
  Number(
    screen
      .getByRole("meter", { name: t("bars.power") })
      .getAttribute("aria-valuenow"),
  );
const preview = (plan: Plan) => step(useGame.getState().state, plan, []);
const skipList = () => screen.getByRole("list", { name: t("play.leftBehind") });

beforeEach(() => {
  useGame.getState().reset();
  useMission.setState({ status: "idle", setup: undefined });
  useSession.setState({ draft: {}, before: undefined });
});

describe("PlanScreen (#9)", () => {
  it("the preview hides a storm the kid was not warned about (no leak past Ask Earth)", () => {
    const setup = may2024Mission();
    const sol2 = step(
      createGame(),
      { a1: "greenhouse" },
      setup.events,
      setup.forecasts,
    ).state;
    useGame.setState({ state: sol2 });
    useMission.setState({ status: "ready", setup });
    useSession.setState({ draft: { a1: "science" } });
    render(<PlanScreen />);
    const dose = Number(
      screen
        .getByRole("meter", { name: t("bars.dose") })
        .getAttribute("aria-valuenow"),
    );
    expect(dose).toBeCloseTo(step(sol2, { a1: "science" }, []).state.bars.dose);
    // The space-ray meter goes up to DOSE.meterMax, so a real storm never hits the top.
    expect(
      screen
        .getByRole("meter", { name: t("bars.dose") })
        .getAttribute("aria-valuemax"),
    ).toBe(String(DOSE.meterMax));
  });

  it("tells the player to pick an astronaut when a job is tapped first", () => {
    render(<PlanScreen />);
    fireEvent.click(btn(t("jobs.panels")));
    expect(screen.getAllByText(t("play.pickCrewFirst")).length).toBeGreaterThan(0);
    expect(useSession.getState().draft).toEqual({});
  });

  it("disables a tired astronaut", () => {
    useGame.setState({ state: { ...useGame.getState().state, tired: ["a1"] } });
    render(<PlanScreen />);
    expect((btn(t("crew.name", { n: 1 })) as HTMLButtonElement).disabled).toBe(
      true,
    );
    expect((btn(t("crew.name", { n: 2 })) as HTMLButtonElement).disabled).toBe(
      false,
    );
  });

  it("works keyboard-only: focus moves astronaut → job → next astronaut → End sol", () => {
    useMission.setState({ status: "ready", setup: { events: [] } as never });
    render(<PlanScreen />);
    for (const [i, job] of (
      ["greenhouse", "panels", "shelter"] as JobId[]
    ).entries()) {
      const crew = btn(t("crew.name", { n: i + 1 }));
      expect(document.activeElement === crew || i === 0).toBe(true);
      crew.focus();
      fireEvent.click(crew); // Enter/Space on a focused native button fires click
      expect(document.activeElement).toBe(btn(t(`jobs.${jobIds[0]}`)));
      btn(t(`jobs.${job}`)).focus();
      fireEvent.click(btn(t(`jobs.${job}`)));
      // The job's mini game opens; skipping it sends focus on to the next astronaut.
      fireEvent.click(btn(t("miniGame.skip")));
    }
    expect(useSession.getState().draft).toEqual({
      a1: "greenhouse",
      a2: "panels",
      a3: "shelter",
    });
    expect(document.activeElement).toBe(btn(`${t("plan.endSol")} →`));
  });
});

describe("PlanScreen mini games", () => {
  it("assigning a job opens that job's mini game; closing it keeps the job", () => {
    render(<PlanScreen />);
    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.click(btn(t("crew.name", { n: 2 })));
    fireEvent.click(btn(t("jobs.askEarth")));
    expect(useSession.getState().draft).toEqual({ a2: "askEarth" });
    expect(screen.getByRole("heading", { name: t("miniGame.askEarth.title") })).toBeTruthy();
    fireEvent.click(btn(t("miniGame.skip")));
    expect(screen.queryByRole("heading", { name: t("miniGame.askEarth.title") })).toBeNull();
    expect(useSession.getState().draft).toEqual({ a2: "askEarth" });
  });

  it("has a mini game for every job in the list", () => {
    render(<PlanScreen />);
    for (const [i, job] of jobIds.slice(0, 3).entries()) {
      fireEvent.click(btn(t("crew.name", { n: i + 1 })));
      fireEvent.click(btn(t(`jobs.${job}`)));
      expect(screen.getByRole("heading", { name: t(`miniGame.${job}.title`) })).toBeTruthy();
      fireEvent.click(btn(t("miniGame.skip")));
    }
    for (const job of jobIds.slice(3)) {
      fireEvent.click(btn(t("crew.name", { n: 1 })));
      fireEvent.click(btn(t(`jobs.${job}`)));
      expect(screen.getByRole("heading", { name: t(`miniGame.${job}.title`) })).toBeTruthy();
      fireEvent.click(btn(t("miniGame.skip")));
    }
  });
});

describe("PlanScreen preview (#10)", () => {
  it("changes the bars before End sol", () => {
    render(<PlanScreen />);
    expect(power()).toBe(preview({}).state.bars.power);
    fireEvent.click(btn(t("crew.name", { n: 1 })));
    fireEvent.click(btn(t("jobs.greenhouse")));
    const after = preview({ a1: "greenhouse" }).state.bars.power;
    expect(after).not.toBe(preview({}).state.bars.power);
    expect(power()).toBe(after);
    expect(useGame.getState().state.sol).toBe(1);
  });

  it("shows a visible icon domino for every skipped job, effects from the engine", () => {
    render(<PlanScreen />);
    const items = within(skipList()).getAllByRole("listitem");
    expect(items).toHaveLength(jobIds.length);
    const { fell } = preview({});
    for (const [i, id] of jobIds.entries()) {
      expect(items[i].textContent).toContain(t(`jobInfo.${id}.skipped`));
      const skip = fell.find((d) => d.id === `sol1-${id}-skipped`);
      if (skip) expect(iconsOf(items[i])).toContain(skip.icon);
      for (const effect of fell.filter(
        (d) => skip && d.causeIds.includes(skip.id),
      )) {
        expect(iconsOf(items[i])).toContain(effect.icon);
        if (effect.sol > 1)
          expect(items[i].textContent).toContain(t("play.tomorrow"));
      }
    }
    // With the greenhouse using power, skipping panels → less power tomorrow (engine decides).
    expect(iconsOf(items[0])).not.toContain("power down");
    fireEvent.click(btn(t("crew.name", { n: 1 })));
    fireEvent.click(btn(t("jobs.greenhouse")));
    expect(preview({ a1: "greenhouse" }).fell.map((d) => d.id)).toContain(
      "sol2-power-low",
    );
    const panelsRow = within(skipList()).getAllByRole("listitem")[0];
    expect(iconsOf(panelsRow)).toMatch(/wipe x.*power down/);
    expect(panelsRow.textContent).toContain(t("play.tomorrow"));

    fireEvent.click(btn(t("crew.name", { n: 2 })));
    fireEvent.click(btn(t("jobs.panels")));
    const left = within(skipList()).getAllByRole("listitem");
    expect(left).toHaveLength(jobIds.length - 2);
    expect(
      left.some((li) => li.textContent?.includes(t("jobInfo.panels.skipped"))),
    ).toBe(false);
  });
});
