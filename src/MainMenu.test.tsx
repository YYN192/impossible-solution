import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import i18n from "./i18n";
import MainMenu from "./MainMenu";

const t = i18n.t.bind(i18n);
const menu = () =>
  render(<MainMenu ready resume={false} onPlay={vi.fn()} onSources={vi.fn()} onTeacher={vi.fn()} onChooseSun={onChooseSun} />);
const onChooseSun = vi.fn();
afterEach(() => {
  window.history.replaceState({}, "", "/");
  onChooseSun.mockReset();
});

describe("Main menu: no dead buttons", () => {
  it("has no Quit button (a tab cannot be closed from the page)", () => {
    menu();
    expect(screen.queryByRole("button", { name: /^(Quit|Изход)$/ })).toBeNull();
  });
});

describe("Main menu: which Sun to play (#8)", () => {
  it("offers today's real Sun and the May 2024 storm; May 2024 is the default", () => {
    menu();
    expect(screen.getByRole("button", { name: t("menu.sunMay") }).getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: t("menu.sunToday") }));
    expect(onChooseSun).toHaveBeenCalledWith(true);
  });

  it("shows today's Sun as chosen with ?sun=today", () => {
    window.history.replaceState({}, "", "/?sun=today");
    menu();
    expect(screen.getByRole("button", { name: t("menu.sunToday") }).getAttribute("aria-pressed")).toBe("true");
  });

  it("hides the choice offline (?offline=1 / ?demo=1): there is no live Sun without the network", () => {
    window.history.replaceState({}, "", "/?offline=1");
    menu();
    expect(screen.queryByRole("button", { name: t("menu.sunToday") })).toBeNull();
  });
});
