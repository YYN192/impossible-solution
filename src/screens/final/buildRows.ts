import type { Domino } from "../../sim/types";
import { buildChains } from "./buildChains";

export interface RowLink {
  domino: Domino;
  /** Every sol this link happened on (more than one when stories were merged). */
  sols: number[];
}
export interface Row {
  /** First cause first, result last. */
  links: RowLink[];
  /** How many times this same story happened. */
  count: number;
}

/**
 * Pure: the final screen's domino rows. One row per story, from the first cause to the result.
 * Stories that read the same on other sols are merged into one row ("×2"), so a long campaign
 * shows a few clear rows instead of a wall of near-identical cards.
 */
export function buildRows(all: Domino[]): Row[] {
  const rows: (Row & { key: string })[] = [];
  for (const chain of buildChains(all)) {
    const links = [...chain].reverse();
    const key = links.map((d) => d.textKey).join(">");
    const same = rows.find((r) => r.key === key);
    if (same) {
      same.count++;
      links.forEach((d, i) => same.links[i].sols.push(d.sol));
    } else rows.push({ key, count: 1, links: links.map((domino) => ({ domino, sols: [domino.sol] })) });
  }
  return rows.map(({ links, count }) => ({ count, links: links.map((l) => ({ ...l, sols: [...l.sols].sort((a, b) => a - b) })) }));
}
