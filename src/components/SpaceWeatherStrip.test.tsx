import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { WeatherWeek } from "../data/datasets";
import type { Result } from "../data/http";
import i18n from "../i18n";
import SpaceWeatherStrip from "./SpaceWeatherStrip";

const t = i18n.t.bind(i18n) as unknown as (k: string, o?: Record<string, unknown>) => string;
const WEEK: WeatherWeek = {
  window: { start: "2026-11-08", end: "2026-11-14" },
  rows: [
    { type: "flr", events: null }, // DONKI did not answer
    { type: "cme", events: [
      { id: "c1", time: "2026-11-09T18:15Z", speedKmS: 726, marsForecast: true },
      { id: "c2", time: "2026-11-09T21:00Z", speedKmS: null, marsForecast: false },
      { id: "c3", time: "2026-11-14T22:15Z", speedKmS: 1200, marsForecast: false },
    ] },
    { type: "sep", events: [] },
    { type: "gst", events: [{ id: "g1", time: "2026-11-12T03:00Z", kp: 7, marsForecast: false }] },
  ],
};
const loaded = (source: Result<WeatherWeek>["source"] = "network") => () => Promise.resolve({ data: WEEK, source, fetchedAt: Date.parse("2026-11-15T10:00Z") });
const show = async (load = loaded(), onClose = vi.fn()) => {
  render(<SpaceWeatherStrip load={load} onClose={onClose} />);
  await screen.findByTestId("row-cme");
  return onClose;
};
const row = (type: string) => screen.getByTestId(`row-${type}`);
afterEach(() => act(() => { void i18n.changeLanguage("en"); }));

describe("radar: opening and closing", () => {
  it("is a labelled modal dialog that closes with Esc, the X and E", async () => {
    const onClose = await show();
    const dialog = screen.getByRole("dialog", { name: t("radar.title") });
    fireEvent(dialog, new Event("cancel", { cancelable: true }));
    fireEvent.click(screen.getByRole("button", { name: t("radar.close") }));
    fireEvent.keyDown(window, { key: "e" });
    fireEvent.keyDown(window, { key: "e", repeat: true });
    expect(onClose).toHaveBeenCalledTimes(3);
  });
});

describe("radar: one row per event type", () => {
  it("names each row and counts its events", async () => {
    await show();
    expect(within(row("cme")).getByText(t("radar.row.cme"))).toBeTruthy();
    expect(within(row("cme")).getByText(t("radar.count", { count: 3 }))).toBeTruthy();
    expect(within(row("gst")).getByText(t("radar.count", { count: 1 }))).toBeTruthy();
    expect(within(row("sep")).getByText(t("radar.count", { count: 0 }))).toBeTruthy();
  });

  it("a part NASA did not answer says so instead of showing 0", async () => {
    await show();
    expect(within(row("flr")).getByText(t("radar.noAnswer"))).toBeTruthy();
    expect(within(row("flr")).queryByText(t("radar.count", { count: 0 }))).toBeNull();
  });

  it("draws one mark per event, grouped in the day it happened", async () => {
    await show();
    const day = within(row("cme")).getByRole("button", { name: /9 Nov/ });
    expect(day.querySelectorAll(".radar-mark")).toHaveLength(2);
  });
});

describe("radar: tapping or pointing at a mark", () => {
  const detail = () => screen.getByTestId("radar-detail");

  it("tap: shows the date and the size in kid words, and the Mars forecast only when DONKI has one", async () => {
    await show();
    fireEvent.click(within(row("cme")).getByRole("button", { name: /9 Nov/ }));
    expect(detail().textContent).toContain(t("radar.size.cme.fast", { speed: 726 }));
    expect(detail().textContent).toContain(t("radar.size.cme.unknown"));
    expect(within(detail()).getAllByText(t("radar.mars"))).toHaveLength(1);
  });

  it("hover (mouse) and keyboard focus show it too", async () => {
    await show();
    fireEvent.pointerEnter(within(row("gst")).getByRole("button", { name: /12 Nov/ }));
    expect(detail().textContent).toContain(t("radar.size.gst.strong", { kp: 7 }));
    fireEvent.focus(within(row("cme")).getByRole("button", { name: /14 Nov/ }));
    expect(detail().textContent).toContain(t("radar.size.cme.veryFast", { speed: 1200 }));
    expect(detail().textContent).not.toContain(t("radar.mars"));
  });

  it("works in Bulgarian", async () => {
    await act(async () => { await i18n.changeLanguage("bg"); });
    await show();
    expect(screen.getByRole("dialog", { name: t("radar.title") })).toBeTruthy();
    fireEvent.click(within(row("gst")).getAllByRole("button")[0]);
    expect(detail().textContent).toContain(t("radar.size.gst.strong", { kp: 7 }));
    expect(t("radar.size.gst.strong", { kp: 7 })).not.toBe(i18n.getFixedT("en")("radar.size.gst.strong", { kp: 7 }));
  });
});

describe("radar: where the data came from", () => {
  it("live data is labelled LIVE", async () => {
    await show(loaded("network"));
    expect(screen.getByRole("status").textContent).toContain(t("data.badge.live"));
  });

  it("offline or after an API failure: the saved snapshot, labelled saved data", async () => {
    await show(loaded("snapshot"));
    expect(screen.getByRole("status").textContent).toContain(t("data.badge.saved"));
  });

  it("with nothing at all, says so instead of breaking", async () => {
    render(<SpaceWeatherStrip load={() => Promise.reject(new Error("offline"))} onClose={vi.fn()} />);
    expect(await screen.findByText(t("radar.failed"))).toBeTruthy();
  });
});
