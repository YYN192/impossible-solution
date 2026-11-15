import { describe, expect, it } from "vitest";
import i18n from "./index";
import { tRun } from "./dynamic";
import { DRILL, PORTRAIT, missionTalkKey, type Speaker } from "../game/talk";

// #83: every line a hub crew talk can show (crew: intro, menu answers, drill; places: hello, advice).
// The radar and the engineering bay open their own panels (MarsHub `interact`), never a talk.
const TALK = (Object.keys(PORTRAIT) as Speaker[]).filter((s) => s !== "radar" && s !== "engineering").flatMap((s) =>
  DRILL[s]
    ? [`talk.${s}.intro`, `talk.${s}.who`, `talk.${s}.drillIntro`, `talk.${s}.win`, missionTalkKey(s, "moon")]
    : [`dialogue.${s}.hello`, `dialogue.${s}.advice`],
);

// #76: what a Moon run shows must not say Mars or sol.
const KEYS: [string, Record<string, unknown>][] = [
  ["world.name", {}], ["world.canvas", {}], ["world.explore", {}], ["morning.firstDay", {}],
  ["earth.dustStorm", { count: 1 }], ["earth.dustStorm", { count: 2 }], ["final.sol", { sol: 3 }],
  ["morning.heading", { sol: 2 }], ["plan.heading", { sol: 2 }], ["endSol.heading", { sol: 2 }], ["common.solOf", { sol: 2, total: 5 }],
  ...TALK.map((k): [string, Record<string, unknown>] => [k, {}]),
];

describe("Moon wording (#76, #83)", () => {
  for (const lng of ["en", "bg"]) it(`no Mars, Gale, Ares or sol on the Moon (${lng})`, async () => {
    await i18n.changeLanguage(lng);
    for (const [key, opts] of KEYS) {
      const text = tRun(key, opts, "moon");
      // JS \b only knows ASCII letters, so the Bulgarian "сол" needs a Unicode lookbehind.
      expect(text, key).not.toMatch(/Mars|Марс|Gale|Гейл|Ares|Арес|\bsols?\b|(?<!\p{L})сол/iu);
      expect(text, key).not.toBe(key);
    }
    await i18n.changeLanguage("en");
  });
});
