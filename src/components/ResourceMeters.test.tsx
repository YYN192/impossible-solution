import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import "../i18n";
import { ENGINE } from "../sim/engine";
import { DOSE } from "../sim/types";
import { ResourceMeters } from "./ResourceMeters";

// #64: every meter shows its safe zone as a number and a mark on the bar.
describe("ResourceMeters safe zones", () => {
  afterEach(cleanup);
  it("says the safe number and marks it on the bar", () => {
    render(<ResourceMeters bars={{ power: 5, air: 5, dose: 1 }} />);
    screen.getByText(`Safe: ${ENGINE.lowPowerToday} or more`);
    screen.getByText(`Goal: ${ENGINE.airReady} or more`);
    screen.getByText(`Safe: under ${ENGINE.doseLimit}`);
    const marks = [...document.querySelectorAll<HTMLElement>(".meter-safe")].map((m) => m.style.left);
    expect(marks).toEqual([`${ENGINE.lowPowerToday * 10}%`, `${ENGINE.airReady * 10}%`, `${(ENGINE.doseLimit * 100) / DOSE.meterMax}%`]);
  });
  it("flags a meter outside its safe zone", () => {
    render(<ResourceMeters bars={{ power: 0, air: 0, dose: 5 }} />);
    expect([...document.querySelectorAll(".resource-meter.unsafe")].map((m) => m.className.match(/meter-(\w+)/)?.[1])).toEqual(["power", "dose"]);
  });
});
