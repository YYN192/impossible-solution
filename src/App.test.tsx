import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import App from "./App";
import i18n from "./i18n";
import { START, useNav } from "./state/screen";

const click = (name: string) =>
  fireEvent.click(screen.getByRole("button", { name }));
const heading = () => screen.getByRole("heading", { level: 1 });
const t = i18n.t.bind(i18n);

describe("App shell", () => {
  beforeEach(() => useNav.setState(START));
  afterEach(cleanup);

  it("title screen shows the name, the sol line and Start", () => {
    render(<App />);
    expect(heading().textContent).toBe("The Impossible SOLution");
    screen.getByText("A sol is one day on Mars.");
    screen.getByRole("button", { name: "Start mission" });
    expect(document.documentElement.lang).toBe("en");
  });

  it("plays a full 3-sol loop to the final screen and back", () => {
    render(<App />);
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
