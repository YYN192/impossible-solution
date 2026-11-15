import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ICON_BADGES, ICON_NAMES } from "../sim/icons";
import { iconsOf } from "../test/icons";
import { Icon, Icons } from "./Icon";

/** Every PNG in src/assets/pixel/icons/, by name. */
const pngs = Object.keys(import.meta.glob("../assets/pixel/icons/*.png")).map((p) =>
  p.replace(/^.*\/(.+)\.png$/, "$1"),
);
const names = new Set<string>(ICON_NAMES);
const badges = new Set<string>(ICON_BADGES);

/** Engine and data source code, to find every icon string a domino or choice can carry. */
const sources = import.meta.glob<string>(["../sim/*.ts", "../data/*.ts", "!**/*.test.ts"], {
  eager: true, query: "?raw", import: "default",
});
const usedIcons = Object.values(sources).flatMap((code) =>
  [...code.matchAll(/icon:\s*(?:[^"\n,]*\?\s*)?"([^"]+)"(?:\s*:\s*"([^"]+)")?/g)].flatMap((m) =>
    [m[1], m[2]].filter((s): s is string => Boolean(s)),
  ),
);

describe("pixel icons (#50)", () => {
  it("every icon name and badge has a PNG, and every PNG has a name", () => {
    expect([...names, ...badges].filter((n) => !pngs.includes(n))).toEqual([]);
    expect(pngs.filter((p) => !names.has(p) && !badges.has(p))).toEqual([]);
  });

  it("every icon the engine and data use is made of real icon names", () => {
    expect(usedIcons.length).toBeGreaterThan(15);
    for (const icon of usedIcons) {
      const parts = icon.split(" ");
      expect(names.has(parts[0]), icon).toBe(true); // a badge never comes first
      for (const part of parts) expect(names.has(part) || badges.has(part), icon).toBe(true);
    }
  });

  it("puts a badge on the icon before it", () => {
    const { container } = render(<Icons icon="food power x" />);
    expect(iconsOf(container)).toBe("food power x");
    const stack = container.querySelector(".px-stack");
    expect(iconsOf(stack)).toBe("power x");
    expect(stack?.querySelector(".px-badge")?.getAttribute("data-icon")).toBe("x");
  });

  it("is decoration only: no alt text, hidden from screen readers", () => {
    const { container } = render(<Icon name="power" />);
    const img = container.querySelector("img");
    expect(img?.getAttribute("alt")).toBe("");
    expect(img?.getAttribute("aria-hidden")).toBe("true");
  });

  it("shows nothing for an unknown name (e.g. an emoji from an old saved run)", () => {
    const { container } = render(<Icons icon="🧽✗ power" />);
    expect(iconsOf(container)).toBe("power");
  });
});
