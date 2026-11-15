import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import i18n from "./i18n";
import { audio, type MusicIntent } from "./game/audio";
import { START, useNav } from "./state/screen";
import { useGame } from "./state/game";
import { useMission } from "./state/mission";
import { useSession } from "./game/session";

const t = i18n.t.bind(i18n);
let calls: MusicIntent[] = [];
beforeEach(() => {
  window.history.replaceState({}, "", "/?demo=1");
  useNav.setState(START); useGame.getState().reset();
  useMission.setState({ status: "idle", setup: undefined });
  useSession.setState({ position: { x: 320, y: 212, facing: "back" }, draft: {}, before: undefined });
  calls = [];
  vi.spyOn(audio, "setMusic").mockImplementation((i) => { calls.push(i); });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
const last = () => calls[calls.length - 1];

describe("App drives the music from one place", () => {
  it("menu → Settings (no restart) → base → console (same song keeps going) → home", async () => {
    render(<App />);
    await screen.findByRole("button", { name: t("title.start") });
    expect(last()).toEqual({ scene: "menu", storm: false });
    const before = calls.length;
    fireEvent.click(screen.getByRole("button", { name: t("menu.settings") }));
    fireEvent.click(screen.getByRole("button", { name: t("dataSources.back") }));
    fireEvent.click(screen.getByRole("button", { name: t("teacher.open") })); // an App overlay replaces the menu
    fireEvent.click(screen.getByRole("button", { name: t("teacher.back") }));
    expect(calls.slice(before).every((c) => c.scene === "menu")).toBe(true);
    expect(calls.length).toBe(before); // nothing new asked: the lobby loop is never restarted

    fireEvent.click(screen.getByRole("button", { name: t("title.start") }));
    await waitFor(() => expect(last()).toEqual({ scene: "base", storm: false })); // ?demo=1 has no dust storm
    const inBase = calls.length;
    useNav.getState().go("console");
    await screen.findByRole("heading", { name: t("morning.heading", { sol: 1 }) });
    useNav.getState().go("hub");
    await screen.findByRole("button", { name: /Open mission console/ });
    expect(calls.length).toBe(inBase); // hub ↔ console is the same scene: the song plays on

    fireEvent.click(screen.getByRole("button", { name: new RegExp(t("world.menu")) }));
    await waitFor(() => expect(last()).toEqual({ scene: "menu", storm: false }));
  });
});
