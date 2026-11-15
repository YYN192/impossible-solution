import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import App from "./App";
import i18n from "./i18n";
import { tRun } from "./i18n/dynamic";
import { useSession } from "./game/session";
import { useGame } from "./state/game";
import { useMission } from "./state/mission";
import { useProgress } from "./state/progress";
import { START, useNav } from "./state/screen";

const t = i18n.t.bind(i18n) as unknown as (k: string, o?: Record<string, unknown>) => string;

beforeEach(() => {
  window.history.replaceState({}, "", "/?campaign=storm&seed=3");
  useNav.setState(START);
  useMission.setState({ status: "idle", setup: undefined });
  useGame.getState().reset();
  useProgress.setState({ done: [], teacher: true }); // teacher mode: every base is open
  useSession.setState({ position: { x: 320, y: 330, facing: "front" }, draft: {}, before: undefined }); // at the airlock
});
afterEach(() => { cleanup(); useProgress.setState({ done: [], teacher: false }); });

describe("fast travel from the airlock (#106)", () => {
  it("picking the Moon on the map starts its mission at sol 1, in the Moon station, with the link updated", async () => {
    render(<App />);
    fireEvent.click(await screen.findByRole("button", { name: t("title.start") }));
    await screen.findByText(t("world.near.airlock")); // the canvas loop noticed the airlock next to us
    act(() => { fireEvent.keyDown(window, { key: "e" }); });
    const map = await screen.findByRole("dialog", { name: t("siteMap.title") });
    fireEvent.click(within(screen.getByTestId("site-moon")).getByRole("button"));
    fireEvent.click(within(map).getByRole("button", { name: t("siteMap.travel") }));

    await waitFor(() => expect(useMission.getState().setup?.campaignId).toBe("moon"));
    expect(useNav.getState()).toMatchObject({ screen: "morning", sol: 1, place: "hub" });
    expect(new URLSearchParams(window.location.search).get("campaign")).toBe("moon");
    expect(await screen.findByRole("heading", { level: 1, name: tRun("world.name", {}, "moon") })).toBeTruthy();
    expect(screen.queryByRole("dialog", { name: t("siteMap.title") })).toBeNull();
  });
});
