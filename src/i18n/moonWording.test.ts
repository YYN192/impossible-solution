import { describe, expect, it } from "vitest";
import i18n from "./index";
import { tRun } from "./dynamic";

// #76: what a Moon run shows must not say Mars or sol.
const KEYS: [string, Record<string, unknown>][] = [
  ["world.name", {}], ["world.canvas", {}], ["world.explore", {}], ["morning.firstDay", {}],
  ["earth.dustStorm", { count: 1 }], ["earth.dustStorm", { count: 2 }], ["final.sol", { sol: 3 }],
  ["morning.heading", { sol: 2 }], ["plan.heading", { sol: 2 }], ["endSol.heading", { sol: 2 }], ["common.solOf", { sol: 2, total: 5 }],
];

describe("Moon wording (#76)", () => {
  for (const lng of ["en", "bg"]) it(`no Mars or sol on the Moon (${lng})`, async () => {
    await i18n.changeLanguage(lng);
    for (const [key, opts] of KEYS) {
      const text = tRun(key, opts, "moon");
      expect(text, key).not.toMatch(/Mars|Марс|\bsols?\b|\bсол/i);
      expect(text, key).not.toBe(key);
    }
    await i18n.changeLanguage("en");
  });
});
