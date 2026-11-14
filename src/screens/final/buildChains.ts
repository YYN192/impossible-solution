import type { Domino } from "../../sim/types";

/**
 * Pure: one chain per problem, each running from the problem back to its first cause.
 *
 * A "problem" is a domino that has a cause but did not knock over anything later (the end of a
 * chain). From there we follow the first causeId each step, the same rule the morning report
 * uses, until we reach a domino with no cause (what the player skipped). Unknown ids and loops
 * stop the walk instead of crashing. Newest problem first.
 */
export function buildChains(all: Domino[]): Domino[][] {
  const byId = new Map(all.map((d) => [d.id, d]));
  const isCause = new Set(all.flatMap((d) => d.causeIds));

  const problems = all.filter(
    (d) => d.causeIds.length > 0 && !isCause.has(d.id),
  );

  return problems.reverse().map((problem) => {
    const chain = [problem];
    const seen = new Set([problem.id]);
    let current = problem;
    for (;;) {
      const cause = current.causeIds
        .map((id) => byId.get(id))
        .find((d) => d !== undefined && !seen.has(d.id));
      if (!cause) break;
      chain.push(cause);
      seen.add(cause.id);
      current = cause;
    }
    return chain;
  });
}
