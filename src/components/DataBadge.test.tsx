import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DataBadge } from "./DataBadge";

describe("DataBadge", () => {
  it("says LIVE for freshly fetched data", () => {
    render(<DataBadge source="network" fetchedAt={Date.now()} />);
    expect(screen.getByRole("status").textContent).toContain("LIVE");
  });
  it("never says LIVE for a snapshot or stale cache", () => {
    for (const source of ["snapshot", "stale-cache"] as const) {
      const { unmount } = render(<DataBadge source={source} fetchedAt={Date.parse("2026-11-14T09:00:00Z")} />);
      const text = screen.getByRole("status").textContent ?? "";
      expect(text).toContain("SAVED DATA");
      expect(text).not.toContain("LIVE");
      unmount();
    }
  });
});
