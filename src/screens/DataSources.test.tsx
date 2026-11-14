import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { REAL_FACTS, SIMPLIFICATIONS } from "../data/sources";
import { DataSources } from "./DataSources";

describe("DataSources screen", () => {
  it("lists every real fact with a working-looking source link", () => {
    render(<DataSources />);
    for (const f of REAL_FACTS) {
      expect(screen.getAllByText(f.what).length).toBeGreaterThan(0);
      const links = screen.getAllByRole("link", { name: f.ref.label });
      expect(links[0].getAttribute("href")).toMatch(/^https:\/\//);
    }
  });
  it("shows the 'What this game simplifies' card", () => {
    render(<DataSources />);
    for (const s of SIMPLIFICATIONS) expect(screen.getByText(s)).toBeTruthy();
  });
  it("labels saved data honestly", () => {
    render(<DataSources />);
    expect(screen.getByRole("status").textContent).toContain("SAVED DATA");
  });
});

describe("DataSources game numbers (#7)", () => {
  it("lists every job's power cost from the engine table, labelled as a game number", async () => {
    const { JOBS } = await import("../sim/types");
    render(<DataSources />);
    const section = screen.getByRole("region", { name: /game numbers/i });
    for (const [id, job] of Object.entries(JOBS)) {
      const row = section.querySelector(`[data-job="${id}"]`);
      expect(row, `row for ${id}`).not.toBeNull();
      expect(row!.textContent).toContain(`${job.powerCost} power`);
    }
    expect(section.textContent).toMatch(/game number/i);
  });

  it("shows the nightly air-machine cost and that the dose scale is a game unit", async () => {
    const { NIGHT } = await import("../sim/types");
    render(<DataSources />);
    const section = screen.getByRole("region", { name: /game numbers/i });
    expect(section.textContent).toContain(`${NIGHT.airMachinePower} power`);
    expect(section.textContent).toMatch(/space-ray meter/i);
  });
});
