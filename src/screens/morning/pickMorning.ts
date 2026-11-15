import type { Domino, EarthAnswer, StormEvent } from "../../sim/types";

export interface MorningInput {
  sol: number;
  /** Dominoes that fell last night (StepResult.fell). */
  fell: Domino[];
  /** Every domino so far (GameState.dominoes), to look up causes. */
  all: Domino[];
  /** Outside events; only the one for `sol` is shown. */
  events: StormEvent[];
  earthAnswer?: EarthAnswer;
}

export type Extra =
  { kind: "event"; event: StormEvent } | { kind: "earth"; answer: EarthAnswer };

export interface MorningReport {
  /** The domino to show first, or none (first morning / nothing broke). */
  headline?: Domino;
  /** What made the headline fall (its first cause), if known. */
  cause?: Domino;
  /** At most one more sentence: today's event wins over Earth's answer. */
  extra?: Extra;
}

/**
 * Pure: decide what the morning report shows.
 * Headline = the newest fallen domino that has a cause (a consequence beats a plain
 * "you skipped X"), else the newest fallen domino.
 */
export function pickMorning(input: MorningInput): MorningReport {
  const { sol, fell, all, events, earthAnswer } = input;

  const withCause = fell.filter((d) => d.causeIds.length > 0);
  const headline = withCause.at(-1) ?? fell.at(-1);
  const cause = headline?.causeIds
    .map((id) => all.find((d) => d.id === id))
    .find((d) => d !== undefined);

  const event = events.find((e) => e.sol === sol);
  const extra: Extra | undefined = event
    ? { kind: "event", event }
    : earthAnswer
      ? { kind: "earth", answer: earthAnswer }
      : undefined;

  return { headline, cause, extra };
}

/**
 * #64 "Space watch": the morning of a space-ray burst and the morning before, the Sun "looks busy".
 * A vague hint, never the exact sol: real forecasters see busy sunspots, not the moment particles arrive.
 */
export const spaceWatch = (sol: number, events: StormEvent[]) =>
  events.some((e) => e.kind === "particleBurst" && (e.sol === sol || e.sol === sol + 1));
