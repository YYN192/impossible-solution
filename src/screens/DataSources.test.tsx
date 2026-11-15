import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GAME_NUMBERS } from "../data/gameNumbers";
import { REAL_FACTS, SIMPLIFICATION_KEYS } from "../data/sources";
import { DataSources } from "./DataSources";
import i18n from "../i18n";

describe("DataSources screen", () => {
  it("lists every real fact with a working-looking source link", () => {
    render(<DataSources />);
    for (const f of REAL_FACTS) {
      expect(screen.getAllByText(f.what).length).toBeGreaterThan(0);
      const links = screen.getAllByRole("link", { name: f.ref.label });
      expect(links[0].getAttribute("href")).toMatch(/^https:\/\//);
      const item = screen.getByText(f.what).closest("li")!;
      expect(item.textContent).toContain(f.value);
      expect(item.textContent).toContain("Source checked or data fetched");
      expect(
        item.querySelector(`time[datetime="${f.ref.fetched}"]`),
      ).not.toBeNull();
    }
  });
  it("shows the 'What this game simplifies' card", () => {
    render(<DataSources />);
    for (const key of SIMPLIFICATION_KEYS)
      expect(screen.getByText(i18n.t(key))).toBeTruthy();
  });
  it("labels saved data honestly", () => {
    render(<DataSources />);
    expect(screen.getByRole("status").textContent).toContain("SAVED DATA");
  });
});

describe("DataSources game numbers (#7)", () => {
  it("renders every engine-derived descriptor once, with a stable id and explicit label", () => {
    render(<DataSources />);
    const section = screen.getByRole("region", { name: /game numbers/i });
    expect(new Set(GAME_NUMBERS.map(({ id }) => id)).size).toBe(
      GAME_NUMBERS.length,
    );
    for (const descriptor of GAME_NUMBERS) {
      const rows = section.querySelectorAll(
        `[data-game-number="${descriptor.id}"]`,
      );
      expect(rows, `row for ${descriptor.id}`).toHaveLength(1);
      const row = rows[0];
      expect(row!.textContent).toMatch(/game number/i);
      expect(row!.textContent).toContain(String(descriptor.value));
    }
  });

  it("covers every current job, nightly, dose, engine, and demo mechanic", () => {
    const jobIds = ["panels", "greenhouse", "shelter", "askEarth", "science"];
    const expected = [
      ...jobIds.map((id) => `job-power-${id}`),
      "mission-sols",
      "night-air-power",
      "night-air-loss",
      "night-solar-power",
      "dose-normal",
      "dose-outside-extra",
      "dose-burst-outside",
      "dose-burst-inside",
      "dose-shelter-factor",
      "start-air",
      "start-food",
      "dust-factor",
      "low-power-threshold",
      "shelter-sols",
      "cloud-dose-inside",
      "cloud-dose-outside",
      "safe-dose-limit",
      "science-goal",
      "food-gain",
      "food-loss",
      "science-gain",
      "night-air-gain",
      "air-ready",
      "meter-max",
      "small-storm-factor",
      "moon-storm-factor",
      "skill-ask-earth",
      "skill-panels",
      "skill-greenhouse",
      "rover-battery",
      "rover-battery-per-power",
      "rover-max-science",
      "demo-start-food",
      "demo-start-panels",
    ];
    expect(GAME_NUMBERS.map(({ id }) => id)).toEqual(expected);
  });
});
