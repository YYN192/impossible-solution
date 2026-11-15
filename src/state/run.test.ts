/** Navigation with beats, beat choices through the engine, save/restore on reload, campaign unlocks. */
import { beforeEach, describe, expect, it } from "vitest";
import { campaignMission, demoMission } from "../data/mission";
import { useSession } from "../game/session";
import { useGame } from "./game";
import { useMission } from "./mission";
import { RUN_KEY, restoreRun, saveRun } from "./persist";
import { DONE_KEY, isOpen, useProgress } from "./progress";
import { nextNav, START, useNav, type Nav } from "./screen";
import { CAMPAIGNS, campaignById } from "../data/campaigns";

function reset() {
  sessionStorage.clear();
  localStorage.clear();
  useNav.setState(START);
  useMission.setState({ status: "idle", setup: undefined });
  useGame.getState().reset();
  useSession.setState({ draft: {}, before: undefined });
  useProgress.setState({ done: [], teacher: false });
}

describe("navigation with beats", () => {
  it("a sol with a beat goes morning → beat → plan → night", () => {
    const hasBeat = (sol: number) => sol === 2;
    const path: Nav[] = [{ screen: "morning", sol: 1 }];
    while (path.at(-1)!.screen !== "final") path.push(nextNav(path.at(-1)!, 2, hasBeat));
    expect(path.map((n) => `${n.screen}${n.sol}`)).toEqual(
      ["morning1", "plan1", "endSol1", "morning2", "beat2", "plan2", "endSol2", "final2"],
    );
  });

  it("the store follows the loaded campaign: its length and its beats", () => {
    reset();
    useMission.setState({ status: "ready", setup: campaignMission("dust", 7) });
    useNav.getState().next(); // title → morning 1
    useNav.getState().next();
    expect(useNav.getState()).toMatchObject({ screen: "beat", sol: 1 });
    useNav.setState({ screen: "endSol", sol: 3 });
    useNav.getState().next();
    expect(useNav.getState()).toMatchObject({ screen: "morning", sol: 4 });
    useNav.setState({ screen: "endSol", sol: 6 });
    useNav.getState().next();
    expect(useNav.getState().screen).toBe("final");
  });

  it("a new game uses the campaign's rules", () => {
    reset();
    useMission.setState({ status: "ready", setup: campaignMission("moon", 3) });
    useNav.getState().next();
    expect(useGame.getState().state.rules?.sols).toBe(5);
    expect(useGame.getState().state.bars.power).toBe(5);
  });

  it("a beat choice runs through the engine and stays in the domino list", () => {
    reset();
    const setup = campaignMission("dust", 7);
    useMission.setState({ status: "ready", setup });
    useNav.getState().next();
    const option = setup.beats[1].options[0];
    useGame.getState().choose(option.action);
    const { state } = useGame.getState();
    expect(state.dominoes.map((d) => d.id)).toEqual([`sol1-${option.action.id}`]);
    expect(state.rules).toMatchObject(option.action.rules!);
  });
});

describe("no reload loses a mission (P0-8)", () => {
  beforeEach(reset);

  function playABit() {
    useMission.setState({ status: "ready", setup: campaignMission("dust", 7) });
    useNav.getState().next();
    useGame.getState().endSol({ a1: "greenhouse" });
    useNav.setState({ screen: "plan", sol: 2, place: "console" });
    useSession.getState().assign("a2", "panels");
  }

  it("saves the run and restores it exactly after a reload", () => {
    playABit();
    saveRun();
    const before = {
      nav: { screen: useNav.getState().screen, sol: useNav.getState().sol, place: useNav.getState().place },
      game: structuredClone(useGame.getState().state),
      draft: useSession.getState().draft,
      setup: structuredClone(useMission.getState().setup),
    };
    // "Reload": every store starts empty again.
    useNav.setState(START);
    useMission.setState({ status: "idle", setup: undefined });
    useGame.getState().reset();
    useSession.setState({ draft: {} });

    expect(restoreRun("")).toBe(true);
    expect(useNav.getState()).toMatchObject(before.nav);
    expect(useGame.getState().state).toEqual(before.game);
    expect(useSession.getState().draft).toEqual(before.draft);
    expect(useMission.getState()).toMatchObject({ status: "ready", setup: before.setup });
  });

  it("?demo=1 ignores a saved run: the recording always starts fresh", () => {
    playABit();
    saveRun();
    useNav.setState(START);
    expect(restoreRun("?demo=1")).toBe(false);
    expect(useNav.getState().screen).toBe("title");
  });

  it("a link to another run (?seed= or ?campaign=) wins over the saved one", () => {
    playABit();
    saveRun();
    useNav.setState(START);
    expect(restoreRun("?campaign=moon")).toBe(false);
    expect(restoreRun("?seed=8")).toBe(false);
    expect(restoreRun("?campaign=dust&seed=7")).toBe(true);
  });

  it("nothing saved, a mission that is over at the menu, or broken storage: start fresh", () => {
    expect(restoreRun("")).toBe(false);
    sessionStorage.setItem(RUN_KEY, "{not json");
    expect(restoreRun("")).toBe(false);
    useMission.setState({ status: "ready", setup: demoMission() });
    saveRun(); // still on the title screen
    expect(restoreRun("")).toBe(false);
  });
});

describe("campaign unlocks", () => {
  beforeEach(reset);

  it("the classic is open; each next campaign opens when the one before is finished", () => {
    expect(CAMPAIGNS.filter((c) => isOpen(c, useProgress.getState())).map((c) => c.id)).toEqual(["storm"]);
    useProgress.getState().finish("storm");
    expect(isOpen(campaignById("dust"), useProgress.getState())).toBe(true);
    expect(isOpen(campaignById("moon"), useProgress.getState())).toBe(false);
    expect(JSON.parse(localStorage.getItem(DONE_KEY)!)).toEqual(["storm"]);
  });

  it("teacher mode opens everything", () => {
    useProgress.getState().setTeacher(true);
    expect(CAMPAIGNS.every((c) => isOpen(c, useProgress.getState()))).toBe(true);
  });
});
