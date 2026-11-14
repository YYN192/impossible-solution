/**
 * Every snapshot file the game ships with must match its schema. This runs in CI before every deploy,
 * so a scheduled refresh that brings back a strange answer fails the build and the last good site stays up.
 */
import { describe, expect, it } from "vitest";
import { SCHEMAS } from "./datasets";

const files = import.meta.glob("./snapshots/*.json", {
  eager: true,
  import: "default",
}) as Record<string, unknown>;
const nameOf = (p: string) =>
  p.replace("./snapshots/", "").replace(".json", "");

describe("snapshot files", () => {
  it("every file has a schema, and every required schema has a file", () => {
    const names = Object.keys(files).map(nameOf);
    for (const n of names) expect(SCHEMAS, `schema for ${n}`).toHaveProperty(n);
    for (const [n, s] of Object.entries(SCHEMAS))
      if (s.required) expect(names, `file for ${n}`).toContain(n);
  });

  for (const [path, json] of Object.entries(files)) {
    const name = nameOf(path);
    it(`${name} matches its schema and names its source`, () => {
      const entry = SCHEMAS[name as keyof typeof SCHEMAS];
      const r = entry.schema.safeParse(json);
      expect(
        r.success,
        r.success ? "" : JSON.stringify(r.error.issues.slice(0, 3)),
      ).toBe(true);
    });
    it(`${name} never contains an API key`, () => {
      expect(JSON.stringify(json)).not.toMatch(/api_key=/i);
    });
  }
});
