/**
 * Balance of the classic 3-sol mission (P1-4), for every place the real burst can land (sol 1, 2 or 3).
 * 1,000 seeded random missions per variant + a brute force over every plan.
 * If these fail, tune the GAME NUMBERS (ENGINE, DOSE, NIGHT), not the tests.
 */
import { describe, expect, it } from "vitest";
import { createGame, stars, step } from "./engine";
import { pick, rng } from "./rng";
import type { CrewId, DataRef, GameState, JobId, Plan, StormEvent } from "./types";

const ref: DataRef = { label: "test", url: "https://example.org", mode: "constant" };
const CHOICES: (JobId | undefined)[] = [undefined, "panels", "greenhouse", "shelter", "askEarth", "science"];
const CREW: CrewId[] = ["a1", "a2", "a3"];

/** The burst on `sol`, the slower storm cloud the sol after (if the mission is still running). */
function variant(sol: number): StormEvent[] {
  return [
    { sol, kind: "particleBurst", captionKey: "x", source: ref },
    ...(sol < 3 ? [{ sol: sol + 1, kind: "stormCloud" as const, captionKey: "x", source: ref }] : []),
  ];
}
const VARIANTS = [1, 2, 3].map(variant);

function play(plans: Plan[], events: StormEvent[]): GameState {
  let g = createGame();
  for (const p of plans) {
    if (g.over) break;
    // Jobs go to astronauts who are awake first.
    const awake = [...CREW.filter((c) => !g.tired.includes(c)), ...CREW.filter((c) => g.tired.includes(c))];
    const fair: Plan = {};
    Object.values(p).forEach((j, n) => (fair[awake[n]] = j));
    g = step(g, fair, events).state;
  }
  return g;
}

function solPlans(): Plan[] {
  const out: Plan[] = [];
  for (let i = 0; i < CHOICES.length; i++)
    for (let j = i; j < CHOICES.length; j++)
      for (let k = j; k < CHOICES.length; k++) {
        const p: Plan = {};
        [CHOICES[i], CHOICES[j], CHOICES[k]].forEach((job, n) => job && (p[CREW[n]] = job));
        out.push(p);
      }
  return out;
}
const PLANS = solPlans();

/** Index triples of every 3★ mission for one variant. */
function threeStar(events: StormEvent[]): Set<string> {
  const out = new Set<string>();
  PLANS.forEach((a, i) =>
    PLANS.forEach((b, j) =>
      PLANS.forEach((c, k) => {
        if (stars(play([a, b, c], events)).count === 3) out.add(`${i}-${j}-${k}`);
      }),
    ),
  );
  return out;
}
const WINNERS = VARIANTS.map(threeStar);

describe.each([1, 2, 3])("burst on sol %i", (burstSol) => {
  const events = VARIANTS[burstSol - 1];

  it("1,000 random missions: most miss a star, a few get 2★, 3★ is rare", () => {
    const next = rng(2026_11_15 + burstSol);
    const counts = [0, 0, 0, 0];
    for (let n = 0; n < 1000; n++) {
      const plans = [0, 1, 2].map(() => {
        const p: Plan = {};
        for (const c of CREW) {
          const job = pick(next, CHOICES);
          if (job) p[c] = job;
        }
        return p;
      });
      counts[stars(play(plans, events)).count]++;
    }
    console.log(`burst sol ${burstSol}: random stars`, counts, "3★ plans:", WINNERS[burstSol - 1].size);
    expect(counts[3]).toBeLessThanOrEqual(30);
    expect(counts[2] + counts[3]).toBeLessThanOrEqual(350);
    expect(counts[2]).toBeGreaterThan(0);
    expect(counts[0] + counts[1]).toBeGreaterThanOrEqual(650);
  });

  it("doing nothing cannot earn 2★", () => {
    expect(stars(play([{}, {}, {}], events)).count).toBeLessThan(2);
  });

  it("3★ is possible", () => {
    expect(WINNERS[burstSol - 1].size).toBeGreaterThan(0);
  });

  it("a careful first run without asking Earth lands 1–2★", () => {
    const careful: Plan = { a1: "greenhouse", a2: "panels", a3: "science" };
    const count = stars(play([careful, careful, careful], events)).count;
    console.log(`burst sol ${burstSol}: careful blind plan`, count);
    expect(count).toBeGreaterThanOrEqual(1);
    expect(count).toBeLessThanOrEqual(2);
  });
});

describe("the winning plan changes with the storm", () => {
  it("no single plan earns 3★ wherever the burst lands: you have to anticipate it", () => {
    const everywhere = [...WINNERS[0]].filter((k) => WINNERS[1].has(k) && WINNERS[2].has(k));
    expect(everywhere).toEqual([]);
  });
});
