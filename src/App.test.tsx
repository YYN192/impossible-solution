import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import App from "./App";
import i18n from "./i18n";
import { TitleScreen } from "./screens/TitleScreen";
import { useMission } from "./state/mission";
import { START, useNav } from "./state/screen";

const click = (name: string) =>
  fireEvent.click(screen.getByRole("button", { name }));
const heading = () => screen.getByRole("heading", { level: 1 });
const t = i18n.t.bind(i18n);

describe("App shell", () => {
  beforeEach(() => {
    useNav.setState(START);
    useMission.setState({ status: "idle", setup: undefined });
  });
  afterEach(cleanup);

  it("title screen shows the name, the sol line and Start", () => {
    render(<App />);
    expect(heading().textContent).toBe("The Impossible SOLution");
    screen.getByText("A sol is one day on Mars.");
    screen.getByRole("button", { name: "Start mission" });
    expect(document.documentElement.lang).toBe("en");
  });

  it("keeps Start disabled until the mission setup is ready", () => {
    useMission.setState({ status: "loading", setup: undefined });
    render(<TitleScreen />);

    const start = screen.getByRole("button", { name: t("title.start") });
    expect(start.hasAttribute("disabled")).toBe(true);
    fireEvent.click(start);
    expect(useNav.getState()).toMatchObject(START);
  });

  it("plays a full 3-sol loop to the final screen and back", async () => {
    render(<App />);
    await waitFor(() =>
      expect(
        screen
          .getByRole("button", { name: t("title.start") })
          .hasAttribute("disabled"),
      ).toBe(false),
    );
    click(t("title.start"));
    for (let sol = 1; sol <= 3; sol++) {
      expect(heading().textContent).toBe(t("morning.heading", { sol }));
      expect(document.activeElement).toBe(heading()); // focus moved for keyboard users
      click(t("morning.goPlan"));
      click(t("plan.endSol"));
      click(sol < 3 ? t("endSol.nextMorning") : t("endSol.seeResults"));
    }
    expect(heading().textContent).toBe(t("final.heading"));
    click(t("final.tryAgain"));
    expect(heading().textContent).toBe(t("morning.heading", { sol: 1 }));
  });

  it("en.json keys resolve and unknown keys are reported missing", () => {
    expect(i18n.exists("title.solLine")).toBe(true);
    expect(i18n.exists("title.doesNotExist" as never)).toBe(false);
  });
});

describe("Title 'What's this?' (#16)", () => {
  beforeEach(() => useNav.setState(START));
  afterEach(cleanup);
  it("explains what a sol is", () => {
    render(<App />);
    click("What's this? Sol");
    screen.getByText(/40 minutes longer than an Earth day/);
  });
});

describe("Teacher card link (#18)", () => {
  beforeEach(() => useNav.setState(START));
  afterEach(cleanup);
  it("opens from the top bar and Back returns to the game", () => {
    render(<App />);
    click(t("teacher.open"));
    expect(document.activeElement?.textContent).toBe(t("teacher.title"));
    click(t("teacher.back"));
    expect(heading().textContent).toBe("The Impossible SOLution");
  });
});
