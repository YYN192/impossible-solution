import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "./i18n";
import MainMenu from "./MainMenu";
import { useProgress } from "./state/progress";

const t = i18n.t.bind(i18n);
const onChoose = vi.fn();
/** A campaign card: its name comes first (a locked card of another campaign may mention it later). */
const card = (id: "storm" | "dust" | "moon") => new RegExp(`^\\s*${t(`campaign.${id}.name`)}`);
const menu = (resume = false, onNew = vi.fn()) =>
  render(<MainMenu ready resume={resume} campaignId="storm" onPlay={vi.fn()} onSources={vi.fn()} onTeacher={vi.fn()} onChoose={onChoose} onNew={onNew} />);
beforeEach(() => useProgress.setState({ done: [], teacher: false }));
afterEach(() => {
  window.history.replaceState({}, "", "/");
  onChoose.mockReset();
});

describe("Main menu: mission picker", () => {
  it("shows every campaign as a card; the classic is chosen and the others are locked at first", () => {
    menu();
    const storm = screen.getByRole("button", { name: card("storm") });
    expect(storm.getAttribute("aria-pressed")).toBe("true");
    const dust = screen.getByRole("button", { name: card("dust") }) as HTMLButtonElement;
    expect(dust.disabled).toBe(true);
    expect(dust.textContent).toContain(t("run.locked", { name: t("campaign.storm.name") }));
    expect(screen.getByRole("button", { name: card("moon") })).toBeTruthy();
  });

  it("a finished campaign opens the next one; tapping it chooses it", () => {
    useProgress.setState({ done: ["storm"] });
    menu();
    const dust = screen.getByRole("button", { name: card("dust") });
    expect(dust.textContent).toContain(t("campaign.dust.hook"));
    expect(dust.textContent).toContain("InSight");
    fireEvent.click(dust);
    expect(onChoose).toHaveBeenCalledWith({ campaign: "dust" });
  });

  it("the teacher's key opens every locked campaign; tapping the last one chooses it", () => {
    useProgress.getState().setTeacher(true);
    menu();
    for (const id of ["dust", "moon"] as const) {
      const c = screen.getByRole("button", { name: card(id) }) as HTMLButtonElement;
      expect(c.disabled, id).toBe(false);
      expect(c.textContent).toContain(t(`campaign.${id}.hook`));
    }
    fireEvent.click(screen.getByRole("button", { name: card("moon") }));
    expect(onChoose).toHaveBeenCalledWith({ campaign: "moon" });
  });

  it("offers today's real Sun", () => {
    menu();
    fireEvent.click(screen.getByRole("button", { name: t("menu.sunToday") }));
    expect(onChoose).toHaveBeenLastCalledWith({ today: true });
  });

  it("has no Daily mission or Surprise me buttons", () => {
    menu();
    expect(screen.queryByRole("button", { name: t("run.daily") })).toBeNull();
    expect(screen.queryByRole("button", { name: t("run.surprise") })).toBeNull();
  });

  it("hides today's real Sun offline (?offline=1 / ?demo=1): there is no live Sun without the network", () => {
    window.history.replaceState({}, "", "/?offline=1");
    menu();
    expect(screen.queryByRole("button", { name: t("menu.sunToday") })).toBeNull();
  });

  it("has no Quit button: a web page cannot close its own tab", () => {
    menu();
    expect(screen.queryByRole("button", { name: /quit/i })).toBeNull();
  });

  it("a mission in progress shows Continue and New mission instead of the picker", () => {
    const onNew = vi.fn();
    menu(true, onNew);
    expect(screen.getByRole("button", { name: new RegExp(t("menu.resume")) })).toBeTruthy();
    expect(screen.queryByRole("group", { name: t("run.pick") })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: t("run.newMission") }));
    expect(onNew).toHaveBeenCalled();
  });
});
