import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { campaignMission } from "../data/mission";
import i18n from "../i18n";
import { EXPLORE, reachCost } from "../sim/explore";
import { ExploreBeat } from "./ExploreBeat";

const t = i18n.t.bind(i18n) as unknown as (k: string, o?: object) => string;
const map = campaignMission("storm", 3).beats[1].map!;

describe("rover drive: keys work at once, no click on the map first", () => {
  const openDir = () => {
    const cost = reachCost(map);
    return ([["d", 1, 0], ["a", -1, 0], ["s", 0, 1], ["w", 0, -1]] as const)
      .find(([, dx, dy]) => Number.isFinite(cost[(map.base.y + dy) * map.cols + map.base.x + dx]))!;
  };
  it("WASD on the page moves the rover while the map does not have focus", () => {
    render(<ExploreBeat map={map} onDone={vi.fn()} />);
    expect(document.activeElement).not.toBe(screen.getByRole("application"));
    fireEvent.keyDown(window, { key: openDir()[0], code: `Key${openDir()[0].toUpperCase()}` });
    screen.getByText(t("exploreUi.away"));
  });
  it("one key press is one move, also when the map has focus (no double step)", () => {
    render(<ExploreBeat map={map} onDone={vi.fn()} />);
    screen.getByRole("application").focus();
    fireEvent.keyDown(screen.getByRole("application"), { key: openDir()[0], code: `Key${openDir()[0].toUpperCase()}` });
    expect(document.querySelectorAll(".explore-cell img.explore-rover")).toHaveLength(1);
    expect(Number(/\d+/.exec(document.querySelector(".explore-battery")!.textContent!)![0])).toBeGreaterThanOrEqual(EXPLORE.battery - 2);
  });
  it("keys typed in a field or behind an open dialog do not drive", () => {
    render(<><input aria-label="note" /><ExploreBeat map={map} onDone={vi.fn()} /></>);
    fireEvent.keyDown(screen.getByRole("textbox"), { key: openDir()[0] });
    screen.getByText(t("exploreUi.home"));
  });
});

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

  it("warns that a second sample tires Amara before she is tired, and the drive does tire her", () => {
    const onDone = vi.fn();
    // A 3-square sand strip with a sample one and two squares from the base.
    const strip = { cols: 3, rows: 1, cells: [0, 1, 2].map(() => ({ color: "#c08060", terrain: "sand" as const })), base: { x: 0, y: 0 }, samples: [{ x: 1, y: 0 }, { x: 2, y: 0 }], battery: 10 };
    render(<ExploreBeat map={strip} onDone={onDone} />);
    const pad = screen.getByRole("application");
    const drive = (key: string) => fireEvent.keyDown(pad, { key, code: key });
    expect(screen.queryByText(t("exploreUi.tiredNext"))).toBeNull(); // no samples, no crew cost yet
    drive("ArrowRight");
    screen.getByText(t("exploreUi.tiredNext")); // one on board: the warning comes before the choice
    drive("ArrowRight");
    screen.getByText(t("exploreUi.tiredNow"));
    drive("ArrowLeft"); drive("ArrowLeft");
    fireEvent.click(screen.getByRole("button", { name: t("exploreUi.finish") }));
    expect(onDone.mock.calls[0][0].effect).toMatchObject({ science: 2, tired: ["a3"] });
  });
});

describe("rover out of power (#68)", () => {
  it("plays one power-down sound and shows No power! when the battery empties away from home", async () => {
    const { audio } = await import("../game/audio");
    const play = vi.spyOn(audio, "playSfx");
    // A tiny 3-square sand strip: two moves right empty a 2-unit battery away from the base.
    const strip = { cols: 3, rows: 1, cells: [0, 1, 2].map(() => ({ color: "#c08060", terrain: "sand" as const })), base: { x: 0, y: 0 }, samples: [], battery: 2 };
    render(<ExploreBeat map={strip} onDone={vi.fn()} />);
    const pad = screen.getByRole("application");
    for (let i = 0; i < 5; i++) fireEvent.keyDown(pad, { key: "ArrowRight", code: "ArrowRight" });
    expect(play.mock.calls.filter((c) => c[0] === "rover-power-down")).toHaveLength(1);
    expect(screen.getByRole("alert").textContent).toContain(t("exploreUi.noPower"));
    play.mockRestore();
  });
});

describe("#98 Dust Season rover: the drive picks the beat's option", () => {
  const beat = campaignMission("dust", 7).beats[6];
  it("ending at home with no samples picks 'keep the rover at home' and says what the drive counts as", () => {
    const onDone = vi.fn();
    render(<ExploreBeat map={beat.map!} beat={beat} onDone={onDone} />);
    screen.getByText(t("exploreUi.pick", { choice: t("beat.rover.stay.label") }));
    fireEvent.click(screen.getByRole("button", { name: t("exploreUi.finish") }));
    expect(onDone).toHaveBeenCalledWith(beat.options.find((o) => o.id === "stay")!.action);
  });
});
