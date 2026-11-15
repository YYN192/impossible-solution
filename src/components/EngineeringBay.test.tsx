import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import i18n from "../i18n";
import EngineeringBay from "./EngineeringBay";

const t = i18n.t.bind(i18n) as unknown as (
  k: string,
  o?: Record<string, unknown>,
) => string;
afterEach(() =>
  act(() => {
    void i18n.changeLanguage("en");
  }),
);

describe("Engineering bay", () => {
  it("shows three graphs with a caption and a saved-data source each", () => {
    render(<EngineeringBay onClose={vi.fn()} />);
    expect(
      screen.getByRole("dialog", { name: t("engineering.title") }),
    ).toBeTruthy();
    for (const id of ["power", "cold", "rays"]) {
      expect(screen.getByTestId(`graph-${id}`).textContent).toContain(
        t(`engineering.${id}.caption`),
      );
    }
    expect(screen.getAllByText(/InSight/).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("img", { name: "425 Wh" })).toHaveLength(1);
    expect(document.querySelector('.chip[data-mode="live"]')).toBeNull();
  });
  it("closes with the X", () => {
    const onClose = vi.fn();
    render(<EngineeringBay onClose={onClose} />);
    fireEvent.click(
      screen.getByRole("button", { name: t("engineering.close") }),
    );
    expect(onClose).toHaveBeenCalled();
  });
});
