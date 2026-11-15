import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "../i18n";
import { useProgress } from "../state/progress";
import SiteMap from "./SiteMap";

const t = i18n.t.bind(i18n) as unknown as (k: string, o?: Record<string, unknown>) => string;
const site = (id: string) => screen.getByTestId(`site-${id}`);

beforeEach(() => useProgress.setState({ done: [], teacher: false }));
afterEach(() => act(() => { void i18n.changeLanguage("en"); }));

describe("airlock map: opening and closing", () => {
  it("is a labelled modal dialog", () => {
    render(<SiteMap current="storm" onClose={vi.fn()} />);
    expect(screen.getByRole("dialog", { name: t("siteMap.title") })).toBeTruthy();
  });

  it("closes with Esc", () => {
    const onClose = vi.fn();
    render(<SiteMap current="storm" onClose={onClose} />);
    fireEvent(screen.getByRole("dialog"), new Event("cancel", { cancelable: true }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes with the X button (mouse and touch tap the same button)", () => {
    const onClose = vi.fn();
    render(<SiteMap current="storm" onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: t("siteMap.close") }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes with the interact key E, but not on a held-down repeat", () => {
    const onClose = vi.fn();
    render(<SiteMap current="storm" onClose={onClose} />);
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "e", repeat: true });
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "E" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("keeps one E listener while the hub re-renders (a listener swapped mid-key-press is skipped by real browsers)", () => {
    const add = vi.spyOn(window, "addEventListener"), remove = vi.spyOn(window, "removeEventListener");
    try {
      const { rerender } = render(<SiteMap current="storm" onClose={vi.fn()} />);
      const keydowns = () => [add, remove].map((s) => s.mock.calls.filter(([type]) => type === "keydown").length);
      const before = keydowns();
      const latest = vi.fn();
      rerender(<SiteMap current="storm" onClose={latest} />);
      expect(keydowns()).toEqual(before);
      fireEvent.keyDown(window, { key: "e" });
      expect(latest).toHaveBeenCalledTimes(1);
    } finally {
      add.mockRestore(); remove.mockRestore();
    }
  });

  it("E closes it on a Bulgarian keyboard layout too (the physical key, #53)", () => {
    const onClose = vi.fn();
    render(<SiteMap current="storm" onClose={onClose} />);
    fireEvent.keyDown(window, { key: "е", code: "KeyE" }); // Cyrillic е on the E key
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("starts with keyboard focus on the X button", () => {
    render(<SiteMap current="storm" onClose={vi.fn()} />);
    expect(document.activeElement).toBe(screen.getByRole("button", { name: t("siteMap.close") }));
  });
});

describe("airlock map: mission sites", () => {
  it("shows each site's name and state in words", () => {
    useProgress.setState({ done: ["storm"] });
    render(<SiteMap current="dust" onClose={vi.fn()} />);
    expect(within(site("storm")).getByText(t("campaign.storm.name"))).toBeTruthy();
    expect(within(site("storm")).getByText(t("siteMap.state.done"))).toBeTruthy();
    expect(within(site("dust")).getByText(t("siteMap.state.here"))).toBeTruthy();
    expect(within(site("moon")).getByText(t("siteMap.locked", { name: t("campaign.dust.name") }))).toBeTruthy();
  });

  it("marks an open site that is not being played", () => {
    render(<SiteMap current="classic" onClose={vi.fn()} />);
    expect(within(site("storm")).getByText(t("siteMap.state.open"))).toBeTruthy();
    expect(site("storm").dataset.state).toBe("open");
  });

  it("shows the base on Mars when the mission being played is not a menu site (the quick mission)", () => {
    render(<SiteMap current="classic" onClose={vi.fn()} />);
    expect(within(site("base")).getByText(t("world.name"))).toBeTruthy();
    expect(within(site("base")).getByText(t("siteMap.state.here"))).toBeTruthy();
  });

  it("shows no separate base when a site already says 'You are here'", () => {
    render(<SiteMap current="storm" onClose={vi.fn()} />);
    expect(screen.queryByTestId("site-base")).toBeNull();
  });

  it("is view only: sites are not buttons", () => {
    render(<SiteMap current="storm" onClose={vi.fn()} />);
    expect(screen.getAllByRole("button")).toHaveLength(1); // just the X
  });

  it("names the sites in Bulgarian too", async () => {
    await act(async () => { await i18n.changeLanguage("bg"); });
    render(<SiteMap current="storm" onClose={vi.fn()} />);
    expect(within(site("storm")).getByText(t("campaign.storm.name"))).toBeTruthy();
    expect(t("campaign.storm.name")).toBe("Сезонът на бурите");
    expect(screen.getByRole("dialog", { name: t("siteMap.title") })).toBeTruthy();
  });
});
