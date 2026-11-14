import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import "../i18n";
import { RAD_STORM } from "../data/sources";
import { DataChip } from "./DataChip";

it("a 'Real NASA number' chip shows the number itself", () => {
  render(<DataChip source={RAD_STORM} />);
  const chip = screen.getByText(/Real NASA number/).closest(".chip");
  expect(RAD_STORM.value).toMatch(/8\.1 mGy/);
  expect(chip?.textContent).toContain(RAD_STORM.value);
});
