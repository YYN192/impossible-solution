/** #65: what changed overnight, in the order the end-of-sol wrap-up reveals it. */
export type Counts = { power: number; air: number; dose: number; food?: number; science?: number };
export type ChangeKey = "power" | "air" | "food" | "dose" | "science";
export type Change = { key: ChangeKey; from: number; to: number; good: boolean };

const ORDER: ChangeKey[] = ["power", "air", "food", "dose", "science"];
const shown = (n: number) => Math.round(n * 10) / 10; // meters show one decimal

/** Changed values only, bad news first (the kid must not miss it), each group in the meters' order. */
export function solChanges(before: Counts | undefined, after: Counts): Change[] {
  if (!before) return [];
  const changes = ORDER.flatMap((key): Change[] => {
    const from = before[key], to = after[key];
    if (from === undefined || to === undefined || shown(from) === shown(to)) return [];
    return [{ key, from, to, good: key === "dose" ? to < from : to > from }];
  });
  return [...changes.filter((c) => !c.good), ...changes.filter((c) => c.good)];
}
