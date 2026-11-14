import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
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
});
