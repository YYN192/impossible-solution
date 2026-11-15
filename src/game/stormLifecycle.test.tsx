import { act, cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { audio, type MusicIntent } from "./audio";
import { useMusicDirector } from "./musicDirector";
import { campaignMission } from "../data/mission";
import { greenhouseAction, hubStormFor, panelsAction } from "../data/hubStorm";
import { useMission } from "../state/mission";
import { useNav } from "../state/screen";
import { useGame } from "../state/game";
import { createGame } from "../sim/engine";

function Director() { useMusicDirector("hub"); return null; }
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("storm music follows the store: warning → repairs → all clear", () => {
  it("stays on when the alarm is closed, ends exactly when both repairs are in the engine", () => {
    let setup, sol = 0;
    for (let seed = 1; !sol; seed++) { setup = campaignMission("classic", seed); for (let s = 2; s <= 3; s++) if (!sol && hubStormFor(setup, s)) sol = s; }
    const calls: MusicIntent[] = [];
    vi.spyOn(audio, "setMusic").mockImplementation((i) => { calls.push(i); });
    useMission.setState({ setup });
    useNav.setState({ screen: "morning", sol, place: "hub" });
    useGame.setState({ state: { ...createGame(setup!.rules), sol }, fell: [] });
    render(<Director />);
    expect(calls.at(-1)).toEqual({ scene: "base", storm: true });
    act(() => { useNav.setState({ screen: "plan" }); }); // alarm closed, still broken
    expect(calls.at(-1)?.storm).toBe(true);
    const storm = hubStormFor(setup, sol)!;
    act(() => { useGame.getState().choose(panelsAction(storm)); });
    expect(calls.at(-1)?.storm).toBe(true); // half fixed
    act(() => { useGame.getState().choose(greenhouseAction(useGame.getState().state)); });
    expect(calls.at(-1)).toEqual({ scene: "base", storm: false }); // all clear
  });
});
