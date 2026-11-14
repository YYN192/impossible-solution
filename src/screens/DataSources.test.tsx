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
