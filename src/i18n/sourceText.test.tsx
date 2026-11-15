import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { CAMPAIGN_FACTS } from "../data/campaignFacts";
import { ARTEMIS_REGIONS, CRATER_MAY2024, GALE_MAP, INSIGHT_POWER, INSIGHT_SAND, MOON_DELAY, OPPORTUNITY_2018, REMS_NIGHT, WIND_CLEANING } from "../data/campaigns";
import { DONKI_CME_MAY20, DONKI_ENLIL_MAY23, earthAnswerRef, INSIGHT_DUST, LIGHT_DELAY, RAD_BASELINE, RAD_STORM, REAL_FACTS } from "../data/sources";
import { STORMS } from "../data/storms";
import { DataChip } from "../screens/DataChip";
import { DataSources } from "../screens/DataSources";
import type { DataRef } from "../sim/types";
import i18n from "./index";
import { BG_FACTS, hasBulgarian, localFact, localText } from "./sourceText";

/** Bulgarian for the data layer's real-data text (#19): facts, source labels and chip values. */

const FACTS = [...REAL_FACTS, ...CAMPAIGN_FACTS];
const REFS: DataRef[] = [
  RAD_STORM, RAD_BASELINE, INSIGHT_DUST, LIGHT_DELAY, DONKI_CME_MAY20, DONKI_ENLIL_MAY23,
  INSIGHT_POWER, INSIGHT_SAND, OPPORTUNITY_2018, WIND_CLEANING, REMS_NIGHT, ARTEMIS_REGIONS, MOON_DELAY, CRATER_MAY2024, GALE_MAP,
  ...STORMS.flatMap((s) => [s.burstRef, ...(s.cloud ? [s.cloud.ref] : [])]),
  ...FACTS.map((f) => f.ref),
];

/** Numbers and dates must survive translation unchanged ("5,000" and "5 000" both give 5, 000). */
const numbers = (s: string) => (s.match(/\d+/g) ?? []).sort();
const cyrillic = /\p{Script=Cyrillic}/u;

afterEach(async () => {
  await act(() => i18n.changeLanguage("en"));
  localStorage.clear();
});

describe("Bulgarian real-data text", () => {
  it("translates every fact on the Data Sources screen, keeping every number and date", () => {
    for (const f of FACTS) {
      const bg = BG_FACTS[f.id];
      expect(bg, `missing Bulgarian for fact ${f.id}`).toBeDefined();
      for (const field of ["what", "value", "usedFor"] as const) {
        expect(bg[field], `${f.id}.${field}`).toMatch(cyrillic);
        expect(numbers(bg[field]), `${f.id}.${field}`).toEqual(numbers(f[field]));
      }
    }
    expect(Object.keys(BG_FACTS).sort()).toEqual(FACTS.map((f) => f.id).sort());
  });

  it("translates every source label and value a chip or the Data Sources screen can show", () => {
    for (const ref of REFS) {
      expect(hasBulgarian(ref.label), `label: ${ref.label}`).toBe(true);
      expect(numbers(localText(ref.label, "bg")!), ref.label).toEqual(numbers(ref.label));
      // Values with words need Bulgarian; "−71 °C" or "8.1 mGy"-style units alone may stay as they are.
      if (ref.value && /[a-z]{3,}/.test(ref.value.replace(/mGy|µGy|Wh/g, ""))) {
        expect(hasBulgarian(ref.value), `value: ${ref.value}`).toBe(true);
        expect(numbers(localText(ref.value, "bg")!), ref.value).toEqual(numbers(ref.value));
      }
    }
    expect(hasBulgarian("Mission Control on Earth")).toBe(true); // sim/engine.ts EARTH_REF
  });

  it("translates labels the game builds at runtime", () => {
    const cases = [
      "NASA's Deep Space Network, radio link to Perseverance at Mars, 2026-11-14 09:30 UTC",
      "NASA's space weather forecast: a storm cloud reaching Mars on 2026-11-20",
      earthAnswerRef(DONKI_ENLIL_MAY23).label,
      "11 min each way",
    ];
    for (const text of cases) {
      const bg = localText(text, "bg")!;
      expect(bg, text).toMatch(cyrillic);
      expect(bg, text).not.toMatch(/forecast|radio link|each way|game number/i);
      expect(numbers(bg), text).toEqual(numbers(text));
    }
  });

  it("leaves English untouched", () => {
    expect(localText(RAD_STORM.label, "en")).toBe(RAD_STORM.label);
    expect(localFact(REAL_FACTS[0], "en").what).toBe(REAL_FACTS[0].what);
    expect(localText(undefined, "bg")).toBeUndefined();
  });

  it("shows a Bulgarian chip when the game is in Bulgarian", async () => {
    await act(() => i18n.changeLanguage("bg"));
    render(<DataChip source={RAD_STORM} />);
    expect(screen.getByText(/Марсоход \(Curiosity\) измери тази слънчева буря/)).toBeTruthy();
    expect(screen.getByText(/8,1 mGy/)).toBeTruthy();
  });

  it("shows every fact on the Data Sources screen in Bulgarian", async () => {
    await act(() => i18n.changeLanguage("bg"));
    const { container } = render(<DataSources />);
    const cells = [...container.querySelectorAll(".sources__what, .sources__value")];
    expect(cells.length).toBe(FACTS.length * 2);
    for (const cell of cells) expect(cell.textContent, cell.textContent ?? "").toMatch(cyrillic);
  });
});
