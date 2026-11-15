import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { campaignMission } from "../data/mission";
import { audio } from "../game/audio";
import i18n from "../i18n";
import { createGame } from "../sim/engine";
import type { StormEvent } from "../sim/types";
import { useGame } from "../state/game";
import { useMission } from "../state/mission";
import { useNav } from "../state/screen";
import { EndOfSolScreen } from "./EndOfSolScreen";

const t = i18n.t.bind(i18n) as unknown as (k: string, o?: object) => string;
const show = (campaign: string, seed: number, pick: (e: StormEvent) => boolean, bars?: Partial<ReturnType<typeof createGame>["bars"]>) => {
  const setup = campaignMission(campaign, seed);
  const event = setup.events.find(pick)!;
  useMission.setState({ setup });
  useNav.setState({ screen: "endSol", sol: event.sol });
  const game = createGame(setup.rules);
  useGame.setState({ state: { ...game, sol: event.sol + 1, bars: { ...game.bars, ...bars } }, fell: [] });
  render(<EndOfSolScreen />);
  return { setup, event };
};
const text = () => document.body.textContent ?? "";

describe("End of sol (#73, #74)", () => {
  afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); });

  // #73: the story text and the data card must describe the same real storm.
  it("a storm-pool burst in Dust Season tells the story of that storm, not of May 2024", () => {
    for (let seed = 1; seed < 40; seed++) {
      const setup = campaignMission("dust", seed);
      const burst = setup.events.find((e) => e.kind === "particleBurst");
      if (!burst || burst.id === "2024-05-20T05:36:00-CME-001") continue;
      show("dust", seed, (e) => e === burst || (e.kind === "particleBurst" && e.id === burst.id));
      expect(text()).not.toContain("20 May 2024");
      expect(text()).not.toContain(t("storm.fact.may2024"));
      return;
    }
    throw new Error("no dust run with a small storm-pool burst found");
  });

  // #73: a game event is never presented as real NASA data.
  it("the Moon's shadow day is labelled a game event: no \"It's real!\", no NASA event number", () => {
    for (let seed = 1; seed < 40; seed++) {
      if (!campaignMission("moon", seed).events.some((e) => e.id === "shadow-day")) continue;
      show("moon", seed, (e) => e.id === "shadow-day");
      expect(text()).not.toContain(t("storm.real"));
      expect(text()).not.toContain("shadow-day");
      expect(text()).toContain(t("storm.gameEvent"));
      return;
    }
    throw new Error("no moon run with a shadow day found");
  });

  // #74: the storm sound used to be dead code after the effect's return.
  it("plays the storm sound on a storm sol", () => {
    vi.useFakeTimers();
    const play = vi.spyOn(audio, "playSfx");
    show("storm", 3, (e) => e.kind === "particleBurst");
    act(() => { vi.advanceTimersByTime(2000); });
    expect(play.mock.calls.map((c) => c[0])).toContain("particle-burst");
  });

  // #74: a warning sound always comes with words on screen.
  it("a warning sound has a visible line", () => {
    show("storm", 3, (e) => e.kind === "particleBurst", { air: 2 });
    expect(screen.getByRole("alert").textContent).toContain(t("endSol.warn.air", { n: 2 }));
  });
});
