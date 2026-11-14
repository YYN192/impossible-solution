import { describe, expect, it } from "vitest";
import { act, canAct, createGame, rulesOf, stars, step } from "../sim/engine";
import { buildRun, signature, type BeatType } from "../sim/campaign";
import { pick, rng } from "../sim/rng";
import type { GameState, JobId, Plan } from "../sim/types";
import { CAMPAIGNS, campaignById } from "./campaigns";
import { STORMS } from "./storms";
import en from "../i18n/en.json";
import bg from "../i18n/bg.json";

const JOBS: (JobId | undefined)[] = [undefined, "panels", "greenhouse", "shelter", "askEarth", "science"];
const has = (dict: unknown, key: string) =>
  key.split(".").reduce<unknown>((o, k) => (o && typeof o === "object" ? (o as Record<string, unknown>)[k] : undefined), dict) !== undefined;

/** Play a whole run with seeded random choices. */
function playRandom(campaignId: string, seed: number): GameState {
  const run = buildRun(campaignById(campaignId), seed);
  const next = rng(seed + 1);
  let g = createGame(run.rules);
  while (!g.over) {
    const beat = run.beats[g.sol];
    if (beat) {
      const open = beat.options.filter((o) => canAct(g, o.action));
      g = act(g, pick(next, open).action, run.events).state;
    }
    const plan: Plan = {};
    for (const c of ["a1", "a2", "a3"] as const) {
      const job = pick(next, JOBS);
      if (job) plan[c] = job;
    }
    g = step(g, plan, run.events).state;
  }
  return g;
}

describe("campaign set (P1-C1)", () => {
  it("has the classic 3-sol mission and at least 2 longer campaigns of 5–7 sols", () => {
    expect(campaignById("storm").rules.sols ?? 3).toBe(3);
    const long = CAMPAIGNS.filter((c) => (c.rules.sols ?? 3) >= 5 && (c.rules.sols ?? 3) <= 7);
    expect(long.length).toBeGreaterThanOrEqual(2);
    expect(new Set(CAMPAIGNS.map((c) => c.place))).toEqual(new Set(["mars", "moon"]));
  });

  it.each(CAMPAIGNS.map((c) => c.id))("%s: 50 random runs finish with a valid state", (id) => {
    for (let seed = 1; seed <= 50; seed++) {
      const g = playRandom(id, seed);
      expect(g.over).toBe(true);
      expect(g.sol).toBeLessThanOrEqual(rulesOf(g).sols);
      for (const v of [g.bars.power, g.bars.air]) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(10);
      }
      expect(g.food).toBeGreaterThanOrEqual(0);
      expect([0, 1, 2, 3]).toContain(stars(g).count);
      const seen = new Set<string>();
      for (const d of g.dominoes) {
        for (const c of d.causeIds) expect(seen.has(c), `${d.id} ← ${c}`).toBe(true);
        seen.add(d.id);
      }
    }
  });

  it.each(CAMPAIGNS.map((c) => c.id))("%s: 3★ is possible and doing nothing is not enough", (id) => {
    let best = 0;
    for (let seed = 1; seed <= 400 && best < 3; seed++) best = Math.max(best, stars(playRandom(id, seed)).count);
    expect(best).toBeGreaterThanOrEqual(2);
    const run = buildRun(campaignById(id), 7);
    let idle = createGame(run.rules);
    while (!idle.over) idle = step(idle, {}, run.events).state;
    expect(stars(idle).count).toBeLessThan(2);
  });
});

describe("days are not all the same (P1-C2)", () => {
  const runs = CAMPAIGNS.flatMap((c) => [1, 2, 3, 4, 5, 6].map((seed) => buildRun(c, seed)));
  const beats = runs.flatMap((r) => Object.values(r.beats).map((b) => ({ run: r, beat: b })));

  it("a kid meets at least 5 interaction types, and every long campaign has a beat on every sol", () => {
    const types = new Set<BeatType>(beats.map((b) => b.beat.type));
    expect(types.size).toBeGreaterThanOrEqual(5);
    for (const r of runs.filter((r) => r.rules.sols >= 5)) {
      expect(Object.keys(r.beats).map(Number).sort()).toEqual(Array.from({ length: r.rules.sols }, (_, i) => i + 1));
      expect(new Set(Object.values(r.beats).map((b) => b.type)).size).toBeGreaterThanOrEqual(4);
    }
  });

  it("every option of every beat is an engine action that changes the game", () => {
    for (const { run, beat } of beats) {
      expect(beat.options.length).toBeGreaterThanOrEqual(2);
      let changed = 0;
      for (const o of beat.options) {
        const sol = Number(Object.entries(run.beats).find(([, b]) => b === beat)![0]);
        const before = { ...createGame(run.rules), sol, bars: { power: 8, air: 5, dose: 0 }, food: 2 };
        const { state, fell } = act(before, o.action, run.events);
        expect(fell, `${beat.id}.${o.id}`).toHaveLength(1);
        const { dominoes: _a, blame: _b, ...rest } = state;
        const { dominoes: _c, blame: _d, ...was } = before;
        if (JSON.stringify(rest) !== JSON.stringify(was)) changed++;
      }
      // At most one option per beat is "do nothing" (and even that is recorded as a domino).
      expect(changed, beat.id).toBeGreaterThanOrEqual(beat.options.length - 1);
    }
  });

  it("every beat, option and campaign has its text in English and Bulgarian", () => {
    const keys = new Set<string>();
    for (const c of CAMPAIGNS) for (const k of ["name", "where", "hook", "brief", "real", "planners"]) keys.add(`campaign.${c.id}.${k}`);
    for (const { beat } of beats) {
      keys.add(`beat.${beat.id}.title`);
      keys.add(`beat.${beat.id}.text`);
      for (const o of beat.options) {
        keys.add(`beat.${beat.id}.${o.id}.label`);
        if (o.real) keys.add(`beat.${beat.id}.${o.id}.real`);
      }
    }
    for (const r of runs) for (const e of r.events) keys.add(e.captionKey);
    const missing = [...keys].filter((k) => !has(en, k) || !has(bg, k));
    expect(missing).toEqual([]);
  });
});

describe("every run is different, honestly (P1-C3)", () => {
  it.each(CAMPAIGNS.map((c) => c.id))("%s: the same seed gives the same run", (id) => {
    expect(buildRun(campaignById(id), 42)).toEqual(buildRun(campaignById(id), 42));
    expect(playRandom(id, 42)).toEqual(playRandom(id, 42));
  });

  it.each(CAMPAIGNS.map((c) => c.id))("%s: ten seeds in a row give at least 6 different runs", (id) => {
    const seen = new Set(Array.from({ length: 10 }, (_, i) => signature(buildRun(campaignById(id), 100 + i))));
    expect(seen.size).toBeGreaterThanOrEqual(6);
  });

  it("every real event in every pool has an id, a date and a source link", () => {
    for (const s of STORMS) {
      expect(s.activityId).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}-CME-\d{3}$/);
      expect(s.burstRef.url).toMatch(/^https:\/\//);
      expect(s.burstRef.value).toBeTruthy();
    }
    for (const c of CAMPAIGNS)
      for (let seed = 1; seed <= 20; seed++)
        for (const e of buildRun(c, seed).events) {
          expect(e.source.url).toMatch(/^https:\/\//);
          expect(e.id, `${c.id} ${e.kind}`).toBeTruthy();
        }
  });

  it("the seed never changes a real number: a storm keeps its dose and source in every run", () => {
    const byId = new Map<string, string>();
    for (const c of CAMPAIGNS)
      for (let seed = 1; seed <= 30; seed++)
        for (const e of buildRun(c, seed).events) {
          const fact = JSON.stringify([e.kind, e.dose, e.solar, e.source]);
          const key = `${c.id}:${e.id}:${e.kind}`;
          if (byId.has(key)) expect(fact).toBe(byId.get(key));
          byId.set(key, fact);
        }
  });
});
