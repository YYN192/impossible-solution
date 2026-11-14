import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import i18n from "./i18n";
import { may2024Mission } from "./data/mission";
import { useMission } from "./state/mission";
import { START, useNav } from "./state/screen";

const t = i18n.t.bind(i18n);
const h1 = () => screen.getByRole("heading", { level: 1 });

describe("App + data layer (#5, #7, #8)", () => {
  beforeEach(() => {
    useNav.setState(START);
    useMission.setState({ status: "idle", setup: undefined });
    window.history.replaceState({}, "", "/?demo=1");
  });
  afterEach(() => {
    window.history.replaceState({}, "", "/");
    vi.restoreAllMocks();
  });

  it("loads the mission on start and shows an honest SAVED DATA badge", async () => {
    render(<App />);
    const badge = await screen.findByRole("status");
    expect(badge.textContent).toContain(t("data.badge.saved"));
    expect(badge.textContent).not.toContain(t("data.badge.live"));
    expect(useMission.getState().setup?.kind).toBe("may2024");
  });

  it("opens Data Sources from any screen and goes back to the same screen", async () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: t("title.start") }));
    const morning = h1().textContent;
    fireEvent.click(screen.getByRole("button", { name: t("dataSources.open") }));
    const title = await screen.findByRole("heading", { name: t("dataSources.title") });
    expect(document.activeElement).toBe(title); // keyboard users land on the new screen
    fireEvent.click(screen.getByRole("button", { name: t("dataSources.back") }));
    expect(h1().textContent).toBe(morning);
  });

  it("shows the quiet-Sun notice when Today's Sun found no Mars-bound storm", async () => {
    render(<App />);
    act(() => useMission.setState({ status: "ready", setup: { ...may2024Mission(), noticeKey: "notice.sunQuiet" } }));
    expect(await screen.findByText(t("notice.sunQuiet"))).toBeTruthy();
  });

  it("all new text comes from en.json", () => {
    for (const k of ["data.badge.live", "data.badge.saved", "dataSources.open", "dataSources.title", "dataSources.back", "notice.sunQuiet"] as const) {
      expect(i18n.exists(k), k).toBe(true);
    }
  });
});
