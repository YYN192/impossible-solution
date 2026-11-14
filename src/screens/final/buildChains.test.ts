import { describe, expect, it } from "vitest";
import type { Domino } from "../../sim/types";
import { FAKE_DOMINOES } from "../../test/fixtures/fakeGame";
import { buildChains } from "./buildChains";

const d = (id: string, causeIds: string[] = [], sol = 1): Domino => ({
  id,
  sol,
  icon: "",
  textKey: `domino.${id}`,
  causeIds,
});
const ids = (chains: Domino[][]) => chains.map((c) => c.map((x) => x.id));

describe("buildChains", () => {
  it("demo chain: tired astronaut back to the skipped panels", () => {
    expect(ids(buildChains(FAKE_DOMINOES))).toEqual([
      [
        "sol3-crew-tired",
        "sol2-food-empty",
        "sol2-greenhouse-skipped",
        "sol2-power-low",
        "sol1-panels-skipped",
      ],
    ]);
  });

  it("no dominoes → no chains", () => {
    expect(buildChains([])).toEqual([]);
  });

  it("a skip that caused nothing is not a problem on its own", () => {
    expect(buildChains([d("skip")])).toEqual([]);
  });

  it("one chain per problem, newest problem first", () => {
    const all = [d("a"), d("b", ["a"]), d("c"), d("e", ["c"], 2)];
    expect(ids(buildChains(all))).toEqual([
      ["e", "c"],
      ["b", "a"],
    ]);
  });

  it("two problems can share a first cause", () => {
    const all = [d("root"), d("x", ["root"]), d("y", ["root"])];
    expect(ids(buildChains(all))).toEqual([
      ["y", "root"],
      ["x", "root"],
    ]);
  });

  it("a cause already shown in an earlier chain ends the later chain (shown once more as the joining link)", () => {
    const all = [
      d("root"),
      d("mid", ["root"]),
      d("endA", ["mid"]),
      d("endB", ["mid"]),
    ];
    expect(ids(buildChains(all))).toEqual([
      ["endB", "mid", "root"],
      ["endA", "mid"],
    ]);
  });

  it("follows the first known cause, skipping unknown ids", () => {
    const all = [d("a"), d("b"), d("c", ["missing", "b", "a"])];
    expect(ids(buildChains(all))).toEqual([["c", "b"]]);
  });

  it("stops on a loop instead of hanging", () => {
    const all = [d("a", ["b"]), d("b", ["a"]), d("end", ["a"])];
    expect(ids(buildChains(all))).toEqual([["end", "a", "b"]]);
  });
});
