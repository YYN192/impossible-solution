import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DataBadge } from "./DataBadge";

describe("DataBadge", () => {
  it("says LIVE for freshly fetched data", () => {
    render(<DataBadge source="network" fetchedAt={Date.now()} />);
    expect(screen.getByRole("status").textContent).toContain("LIVE");
  });
  it("never says LIVE for a snapshot or kept (cached) data, and shows its date", () => {
    for (const [source, label] of [["snapshot", "SAVED DATA"], ["stale-cache", "KEPT DATA"], ["cache", "KEPT DATA"]] as const) {
      const { unmount } = render(<DataBadge source={source} fetchedAt={Date.parse("2026-11-14T09:00:00Z")} />);
      const text = screen.getByRole("status").textContent ?? "";
      expect(text).toContain(label);
      expect(text).toContain("2026");
      expect(text).not.toContain("LIVE");
      unmount();
    }
  });
});
