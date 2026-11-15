import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { campaignMission } from "../data/mission";
import i18n from "../i18n";
import { DOSE } from "../sim/types";
import { WipeBeat } from "./WipeBeat";

const t = i18n.t.bind(i18n) as unknown as (k: string, o?: object) => string;
const beat = campaignMission("dust", 7).beats[2];
const panels = () => screen.queryAllByRole("button", { pressed: false });

describe("#98 hands-on wipe: the kid wipes panels by hand", () => {
  it("starts with 6 dusty panels and no extra rays; wiping shows the dose rising", () => {
    render(<WipeBeat beat={beat} onDone={vi.fn()} />);
    expect(panels()).toHaveLength(6);
    screen.getByText(t("wipeUi.now", { choice: t("beat.wipe.none.label") }));
    screen.getByText(t("wipeUi.dose", { n: 0 }));
    for (let i = 0; i < 3; i++) fireEvent.click(panels()[0]);
    screen.getByText(t("wipeUi.now", { choice: t("beat.wipe.half.label") }));
    screen.getByText(t("wipeUi.dose", { n: DOSE.outsideExtra }));
  });

  it("works with the keyboard (Enter on a panel) and ends in the beat's own option", () => {
    const onDone = vi.fn();
    render(<WipeBeat beat={beat} onDone={onDone} />);
    while (panels().length) fireEvent.click(panels()[0]); // a <button>: Enter and Space click it
    screen.getByText(t("wipeUi.dose", { n: 2 * DOSE.outsideExtra }));
    fireEvent.click(screen.getByRole("button", { name: t("hubStorm.backInside") }));
    expect(onDone).toHaveBeenCalledWith(beat.options.find((o) => o.id === "all")!.action);
  });

  it("going back in without wiping picks 'leave the dust'", () => {
    const onDone = vi.fn();
    render(<WipeBeat beat={beat} onDone={onDone} />);
    fireEvent.click(screen.getByRole("button", { name: t("hubStorm.backInside") }));
    expect(onDone).toHaveBeenCalledWith(beat.options.find((o) => o.id === "none")!.action);
  });
});
