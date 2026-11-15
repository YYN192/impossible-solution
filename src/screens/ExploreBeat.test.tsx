import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { campaignMission } from "../data/mission";
import i18n from "../i18n";
import { EXPLORE, reachCost } from "../sim/explore";
import { ExploreBeat } from "./ExploreBeat";

const t = i18n.t.bind(i18n) as unknown as (k: string, o?: object) => string;
const map = campaignMission("storm", 3).beats[1].map!;

describe("rover drive on the map", () => {
  it("draws the real-colour map with the base, the rover and the samples", () => {
    render(<ExploreBeat map={map} onDone={vi.fn()} />);
    expect(document.querySelectorAll(".explore-cell")).toHaveLength(map.cols * map.rows);
    expect((document.querySelector(".explore-cell") as HTMLElement).style.backgroundColor).not.toBe("");
    expect(document.querySelectorAll(".explore-cell[data-sample]")).toHaveLength(3);
    screen.getByText(t("exploreUi.battery", { n: EXPLORE.battery, max: EXPLORE.battery }));
    screen.getByText(t("exploreUi.home"));
  });

  it("drives with the arrow keys and with the on-screen buttons; every move spends battery", () => {
    render(<ExploreBeat map={map} onDone={vi.fn()} />);
    const cost = reachCost(map);
    // Pick a direction whose square is open.
    const open = ([["ArrowRight", "right", 1, 0], ["ArrowLeft", "left", -1, 0], ["ArrowDown", "down", 0, 1], ["ArrowUp", "up", 0, -1]] as const)
      .filter(([, , dx, dy]) => Number.isFinite(cost[(map.base.y + dy) * map.cols + map.base.x + dx]));
    const [key, name] = open[0];
    fireEvent.keyDown(screen.getByRole("application"), { key });
    screen.getByText(t("exploreUi.away"));
    expect(screen.queryByText(t("exploreUi.battery", { n: EXPLORE.battery, max: EXPLORE.battery }))).toBeNull();
    const back = { right: "left", left: "right", up: "down", down: "up" }[name];
    fireEvent.click(screen.getByRole("button", { name: t(`exploreUi.${back}`) }));
    screen.getByText(t("exploreUi.home"));
  });

  it("ending the drive hands one engine action to the beat screen", () => {
    const onDone = vi.fn();
    render(<ExploreBeat map={map} onDone={onDone} />);
    fireEvent.click(screen.getByRole("button", { name: t("exploreUi.finish") }));
    expect(onDone).toHaveBeenCalledWith(expect.objectContaining({ id: "explore-home0" }));
  });
});

describe("rover drive pad lights up with the keyboard", () => {
  it("lights the pad button for the held arrow / WASD key and turns it off on release", () => {
    render(<ExploreBeat map={map} onDone={vi.fn()} />);
    const left = screen.getByRole("button", { name: t("exploreUi.left") });
    fireEvent.keyDown(screen.getByRole("application"), { key: "a" });
    expect(left.hasAttribute("data-pressed")).toBe(true);
    fireEvent.keyUp(screen.getByRole("application"), { key: "a" });
    expect(left.hasAttribute("data-pressed")).toBe(false);
  });
});

describe("rover screen shows the cost up front (#66)", () => {
  it("shows the live power cost and the lab limit", () => {
    render(<ExploreBeat map={map} onDone={vi.fn()} />);
    screen.getByText(t("exploreUi.cost", { n: 0 }));
  });
});
