/**
 * TEST FIXTURE: a fixed demo game for the report screen tests (the app itself runs the engine
 * through useGame). It follows the demo chain from docs/concept.md:
 *   sol 1 skip panels → sol 2 power low (+ the 20 May 2024 burst) → sol 3 astronaut too tired.
 */
import { may2024Mission, type MissionSetup } from "../../data/mission";
import { createGame } from "../../sim/engine";
import type { DataRef, Domino, EarthAnswer, StormEvent } from "../../sim/types";
import { useGame } from "../../state/game";
import { useMission } from "../../state/mission";
import type { MorningInput } from "../../screens/morning/pickMorning";

// Placeholder provenance. The data layer replaces these with snapshot DataRefs (url + fetched date).
const DONKI = "https://kauai.ccmc.gsfc.nasa.gov/DONKI/";
const burstSource: DataRef = {
  label: "A Mars rover measured this storm on 20 May 2024.",
  url: DONKI,
  mode: "snapshot",
  fetched: "2026-11-14",
};
const forecastSource: DataRef = {
  label: "NASA forecast a storm cloud reaching Mars on 28 May 2024.",
  url: DONKI,
  mode: "snapshot",
  fetched: "2026-11-14",
};

const d = (
  id: string,
  sol: number,
  icon: string,
  key: string,
  causeIds: string[] = [],
): Domino => ({
  id,
  sol,
  icon,
  textKey: `domino.${key}`,
  causeIds,
});

export const FAKE_DOMINOES: Domino[] = [
  d("sol1-panels-skipped", 1, "🧽✗", "panelsSkipped"),
  d("sol2-power-low", 2, "⚡↓", "powerLow", ["sol1-panels-skipped"]),
  d("sol2-greenhouse-skipped", 2, "🥬✗", "greenhouseSkipped", [
    "sol2-power-low",
  ]),
  d("sol2-food-empty", 2, "🥬0", "foodEmpty", ["sol2-greenhouse-skipped"]),
  d("sol3-crew-tired", 3, "😴", "crewTired", ["sol2-food-empty"]),
];

/** Which dominoes have fallen by the morning of each sol (what StepResult.fell would hold). */
const FELL_BY_MORNING: Record<number, string[]> = {
  1: [],
  2: ["sol1-panels-skipped", "sol2-power-low"],
  3: ["sol2-greenhouse-skipped", "sol2-food-empty", "sol3-crew-tired"],
};

export const FAKE_EVENTS: StormEvent[] = [
  {
    sol: 2,
    kind: "particleBurst",
    captionKey: "event.burst.may2024",
    source: burstSource,
  },
];

const EARTH_ANSWER_SOL3: EarthAnswer = {
  dustTomorrow: "dusty",
  stormCloudInSols: 1,
  source: forecastSource,
};

const byId = (id: string) => FAKE_DOMINOES.find((x) => x.id === id)!;

/** What the morning report would get on `sol`. */
export function fakeMorning(sol: number): MorningInput {
  const fell = (FELL_BY_MORNING[sol] ?? []).map(byId);
  const fallenIds = new Set(
    Object.entries(FELL_BY_MORNING)
      .filter(([s]) => Number(s) <= sol)
      .flatMap(([, ids]) => ids),
  );
  return {
    sol,
    fell,
    all: FAKE_DOMINOES.filter((x) => fallenIds.has(x.id)),
    events: FAKE_EVENTS,
    earthAnswer: sol === 3 ? EARTH_ANSWER_SOL3 : undefined,
  };
}

/**
 * Put the demo game into the stores as it stands on the morning of `sol` (or, with `final`, after
 * the last sol), so a screen test can render the real MorningScreen / FinalScreen.
 */
export function loadFakeGame(sol: number, { final = false } = {}) {
  const m = fakeMorning(sol);
  useGame.setState({
    state: {
      ...createGame(),
      sol,
      dominoes: final ? FAKE_DOMINOES : m.all,
      earthAnswer: m.earthAnswer,
      over: final,
    },
    fell: m.fell,
  });
  useMission.setState({
    status: "ready",
    setup: { ...may2024Mission(), events: FAKE_EVENTS, forecasts: {} } satisfies MissionSetup,
  });
}
