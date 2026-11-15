import { describe, expect, it } from "vitest";
import {
  CRACK_SPOTS,
  DUST_JOBS,
  GUST_SPOTS,
  PATCH_GOAL,
  dustProgress,
  dustTap,
  dustTick,
  dustWon,
  startDustGame,
  type DustGame,
} from "./dustMiniGames";

type Of<J extends DustGame["job"]> = Extract<DustGame, { job: J }>;
const ticks = <G extends DustGame>(game: G, n: number): G => {
  let g: DustGame = game;
  for (let i = 0; i < n; i++) g = dustTick(g);
  return g as G;
};

describe("Dust Season mini games", () => {
  it("has its own game for the panels and the greenhouse, seeded and not won at the start", () => {
    expect(DUST_JOBS).toEqual(["panels", "greenhouse"]);
    for (const job of DUST_JOBS) {
      const g = startDustGame(job, 5);
      expect(g.job).toBe(job);
      expect(dustWon(g)).toBe(false);
      expect(ticks(startDustGame(job, 5), 30)).toEqual(ticks(startDustGame(job, 5), 30));
      expect(dustWon(ticks(g, 500))).toBe(false); // waiting never wins, never loses
    }
  });
});

describe("panels: let the wind gust clean them (real: gusts cleaned Spirit's and Opportunity's panels)", () => {
  it("a panel only gets clean when the gust is over it", () => {
    let g = startDustGame("panels", 1) as Of<"panels">;
    const away = (g.gust + 2) % GUST_SPOTS;
    expect((dustTap(g, away) as Of<"panels">).clean[away]).toBe(false);
    expect((dustTap(g, away) as Of<"panels">).early).toBe(true);
    g = dustTap(g, g.gust) as Of<"panels">;
    expect(g.clean.filter(Boolean)).toHaveLength(1);
  });

  it("the gust visits every panel, and the game is won when all are clean", () => {
    let g: DustGame = startDustGame("panels", 3);
    const seen = new Set<number>();
    for (let i = 0; i < 300 && !dustWon(g); i++) {
      const p = g as Of<"panels">;
      seen.add(p.gust);
      g = dustTick(p.clean[p.gust] ? p : dustTap(p, p.gust));
    }
    expect(seen.size).toBe(GUST_SPOTS);
    expect(dustWon(g)).toBe(true);
  });
});

describe("greenhouse: patch the cracks before dust gets in", () => {
  it("cracks open by themselves; a tap patches one", () => {
    let g = startDustGame("greenhouse", 2) as Of<"greenhouse">;
    g = ticks(g, 6);
    const crack = g.cracks.findIndex(Boolean);
    expect(crack).toBeGreaterThanOrEqual(0);
    const patched = dustTap(g, crack) as Of<"greenhouse">;
    expect(patched.cracks[crack]).toBe(false);
    expect(patched.patched).toBe(1);
    // Tapping a whole pane does nothing.
    const whole = g.cracks.findIndex((c) => !c);
    expect(dustTap(g, whole)).toBe(g);
    expect(g.cracks).toHaveLength(CRACK_SPOTS);
  });

  it(`is won after ${PATCH_GOAL} patches`, () => {
    let g: DustGame = startDustGame("greenhouse", 9);
    for (let i = 0; i < 500 && !dustWon(g); i++) {
      const h = g as Of<"greenhouse">;
      const c = h.cracks.findIndex(Boolean);
      g = dustTick(c >= 0 ? dustTap(h, c) : h);
    }
    expect(dustWon(g)).toBe(true);
    expect(dustProgress(g)).toEqual({ done: PATCH_GOAL, total: PATCH_GOAL });
  });
});
