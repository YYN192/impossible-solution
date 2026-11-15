import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import MainMenu from "../MainMenu";
import { WhatsThis } from "./WhatsThis";

describe("WhatsThis tooltip", () => {
  it("is closed at first and has a clear name for screen readers", () => {
    render(<WhatsThis topic="sol" />);
    const button = screen.getByRole("button", { name: "What's this? Sol" });
    expect(button.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByRole("note")).toBeNull();
  });

  it("opens on tap and shows the kid explanation", () => {
    render(<WhatsThis topic="askEarth" />);
    fireEvent.click(screen.getByRole("button", { name: /What's this\?/ }));
    expect(screen.getByRole("note").textContent).toContain("about 12 minutes to reach Earth");
  });

  it("closes with Escape and gives focus back to the ? button", () => {
    render(<WhatsThis topic="dose" />);
    const button = screen.getByRole("button", { name: /What's this\?/ });
    fireEvent.click(button);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("note")).toBeNull();
    expect(document.activeElement).toBe(button);
  });

  it("closes with the Got it button", () => {
    render(<WhatsThis topic="dust" />);
    fireEvent.click(screen.getByRole("button", { name: /What's this\?/ }));
    fireEvent.click(screen.getByRole("button", { name: "Got it" }));
    expect(screen.queryByRole("note")).toBeNull();
  });

  // #56: the start screen's sol help sits just above the footer, so it must open upward and never cover it.
  it("placement up always opens above the ?", () => {
    render(<WhatsThis topic="sol" placement="up" />);
    fireEvent.click(screen.getByRole("button", { name: "What's this? Sol" }));
    expect(screen.getByRole("note").className).toContain("whats-this__bubble--up");
  });

  it("on the start screen the sol help opens above the ?, away from the footer", () => {
    render(<MainMenu ready resume={false} campaignId="storm" onPlay={vi.fn()} onSources={vi.fn()} onTeacher={vi.fn()} onChoose={vi.fn()} onNew={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "What's this? Sol" }));
    expect(screen.getByRole("note").className).toContain("whats-this__bubble--up");
  });

  it("flips up by itself when it would run off the bottom of the screen", () => {
    const spy = vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({ top: window.innerHeight - 20, bottom: window.innerHeight + 120, left: 100, right: 300, width: 200, height: 140, x: 100, y: window.innerHeight - 20, toJSON: () => ({}) } as DOMRect);
    render(<WhatsThis topic="sol" />);
    fireEvent.click(screen.getByRole("button", { name: "What's this? Sol" }));
    expect(screen.getByRole("note").className).toContain("whats-this__bubble--up");
    spy.mockRestore();
  });
});
