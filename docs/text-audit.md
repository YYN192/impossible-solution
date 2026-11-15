# Text audit (#67): keep, shorten, replace or remove

Every screen and each block of text on it, with a decision and the reason for it. The rule comes from the kid playtest (#21) and the team's kid-design research ([`kid-design-research/`](kid-design-research/)): kids aged 7–12 skip text that repeats the picture. The [show-don't-tell checklist](show-dont-tell.md) (#64) covers what each screen shows instead of telling.

**Decisions:**
- **Keep:** the text is needed.
- **Shorten:** same idea, fewer words.
- **Replace:** a better word or line, or an icon instead.
- **Remove:** nothing is lost.

Every change is made in EN and BG together, and both files keep the same keys (`src/i18n/en.copy.test.ts`, `bg.copy.test.ts`). The #67 rules are checked by `src/i18n/textAudit.test.ts`.

## Changes made (with before/after)

Screenshots are in [`qa/67/`](qa/67/) at 1280×800, named `before-<screen>-<en|bg>.jpg` and `after-<screen>-<en|bg>.jpg`.

| # | Screen | Text (key) | Decision | Reason | Screenshots |
|---|---|---|---|---|---|
| 1 | Plan, first-play guide | "Tap an astronaut first." (`guide.step.crew`) | Replace → "Choose an astronaut first." | Keyboard and mouse players do not tap (audit A6). | `plan-guide` |
| 2 | Base, first-play guide | "Walk to the glowing console, or just tap it." (`guide.step.walk`) | Shorten → "Walk to the glowing console." | Drop the "tap" half; the glowing frame shows where to go. | `hub-guide` |
| 3 | Mission 1 sol 2, build | "…Or tap a part, then tap its spot." (`handsOn.build.hint`) | Replace → "…Or pick a part, then its spot." | Works for mouse, keys and touch. | `build` |
| 4 | Radar | "Tap or point at a day…" (`radar.pick`) and Pip's radar line (`dialogue.radar.advice`) | Replace → "Point at or choose a day…" / "Choose a day with marks…" | Not "tap". | `radar` |
| 5 | Airlock map (fast travel) | "Open: tap to travel there" (`siteMap.state.open`) | Replace → "Open: choose it to travel there" | Not "tap". | `map` |
| 6 | Dust Season sol 2, wipe | "Tap a panel to wipe it…" (`wipeUi.rule`) | Replace → "Choose a panel to wipe it…" | Not "tap". | `dust-wipe` |
| 7 | South Pole Outpost, ice mini-game and Amara's practice | "Tap the ice to melt it…" (`miniGame.moon.greenhouse.lead`, `talk.scientist.drillIntro_moon`) | Replace → "Press the ice to melt it…" | Not "tap". | `moon-ice-game` |
| 8 | Dust storm alarm | "In October 2022 … about 275 watt-hours a sol instead of 425 (a watt-hour is a small amount of electricity)…" (`hubStorm.real.insight2022`) | Shorten → "In 2022, dust hit NASA's InSight lander. It made one third less power." | It was 34 words with a unit kids do not know. The same fact in 2 short sentences; the source link stays. | `dust-alarm` |
| 9 | Dust storm alarm | The Opportunity 2018 version (`hubStorm.real.opportunity2018`) | Shorten → "In 2018, dust covered all of Mars. Opportunity sent its last message." | Same rule: 2 sentences of 12 words or fewer. | (seed-dependent) |
| 10 | South Pole Outpost, site choice | "Each one lacks something." / "На всяко нещо липсва." (`beat.siteMoon.text`) | Replace → "Each has sun, ice or Earth, never all three." | The BG read awkwardly, and both now say what the trade-off is. | `moon-site` |
| 11 | End of sol, real storm | "NASA event number: {{id}}" (`storm.id`) | Replace → "NASA's name for this storm: {{id}}" | The raw ID was not explained (audit storm 9); it stays because it is the real data. | `endsol-event-id` |
| 12 | Final | "Mission over" (`final.heading`) | Replace → "Mission complete! {{count}} of 3 stars" | "Over" at every score reads as failure and teaches nothing (audit storm 8). | `final` |
| 13 | Final | "N stars out of 3" under the heading (`final.stars`) | Remove (keys deleted) | Repeats the heading; the 3 star icons stay. | `final` |
| 14 | Final | — (new) | Add one "Next time: …" tip for the first missed goal (`final.next.*`) | Gives the kid one concrete thing to try (audit storm 8). | `final` |
| 15 | Every BG screen with power | "ток" in 49 BG strings: dominoes, beat choices, rules, crew skills, crew talk, the dust storm, rover, Data Sources (e.g. "Панелите дадоха малко ток", "+1 ток", "Няма ток!") | Replace → "енергия", with feminine agreement ("пълна енергия", "енергията", "Без нея") | One word per resource (audit shared 4): the meter says "Енергия", so the text must too. | `final` (domino), `plan-guide` (crew skill), `dust-wipe`, `build` |

The QA flow that waited for "Mission over" (`scripts/qa/flows.mjs`) now waits for "Mission complete" or "Mission ended early".

## Findings already fixed on main (checked, no change needed)

- **"Tap" → "Choose" / "Press":** first fixed in 99a05b6. It came back in 9 strings added later (rows 1–7 above). `textAudit.test.ts` now fails if "tap" or "докосни" comes back.
- **One word per resource (EN):**
  - Pip and the crew say "space rays", and the meter is the "Space-ray meter".
  - "dose" appears only on the grown-up Data Sources page, where it is the scientific word.
  - In BG, "ток" was **not** gone (49 strings): see row 15. `textAudit.test.ts` checks both languages.
- **The BG dust-alarm source line** is translated through `sourceText.ts`.
- **"Wh":** gone with row 8.

## BG grammar: "сол"

The handoff suggested the feminine "тази сол". The game keeps the **masculine** forms it already uses everywhere ("Край на сола", "5 сола", "След този сол", "солове"): they are consistent, and the feminine "солта" / "соли" read as "the salt" / "salts". Decision by the copy owner, 15 Nov 2026.

## Every screen

**Keep** means the text was read in context and stays as it is, for the reason given.

### Start screen (`title`, `menu`, `campaign`, `run`)
| Text | Decision | Reason |
|---|---|---|
| Title and tagline | Keep | The name and one line; the picture does the rest. |
| Mission card: name, place, length, level, one-line hook | Keep | The facts a kid needs to choose; the hook is one question. |
| Locked card: "Finish X to open this." | Keep | Says exactly what to do. |
| Start mission, quiet links (Settings, sources, teachers) | Keep | Labels. |
| Mission brief (`campaign.*.brief`) | Keep | 2–3 short sentences, the story before the first action. |

### Base / hub (`world`, `talk`, `dialogue`, `hubStorm`, `siteMap`, `radar`, `engineering`, `guide`)
| Text | Decision | Reason |
|---|---|---|
| Goal line ("Walk to the glowing console…") | Keep | One sentence; the glowing console frame shows it too. |
| Interaction hint ("Commander Nova", Interact E) | Keep | Names what is near; the key hint is a label. |
| Crew talk lines (`talk.*`) | Keep | Typed out one at a time, ≤12 words a sentence (#57); kids choose to hear them. |
| Dust alarm: title, lead, to-do list | Keep | Short; the to-do list has icons. |
| Dust alarm: real storm (`hubStorm.real.*`) | **Shorten** (rows 8–9) | See above. |
| Airlock map: lead, site states | Keep, except "Open" (**Replace**, row 5) | One lead line; the states are one word each, with icons. |
| Radar: lead, row names, size words | Keep, except the pick hint (**Replace**, row 4) | The size words are the kid version of the data. |
| Engineering bay captions | Keep | One caption per graph, with the source. |
| First-play guide (`guide.step.*`) | Keep, except 2 steps (**Replace / Shorten**, rows 1–2) | One sentence per step by design (#64). |

### Morning (`morning`, `earth`, `notice`, `event`)
| Text | Decision | Reason |
|---|---|---|
| "Good morning! Sol N" | Keep | The heading. |
| What happened overnight (one line per event) | Keep | Each one says what changed, with an icon. |
| "Why?" (cause, behind a button) | Keep | Opt-in; hidden until asked. |
| Space watch strip (#64) | Keep | One warning before a storm. |
| Earth radio message | Keep | It is the reward for asking Earth. |
| Mission brief on sol 1 | Keep | Read once; the guide shows the goal with icons next to it. |

### Beats (`beat`, `beatUi`, `exploreUi`, `handsOn`, `wipeUi`, `rule`, `fx`)
| Text | Decision | Reason |
|---|---|---|
| Beat title and one lead line | Keep | Sets the scene in one sentence. |
| Option labels | Keep | Each is the choice itself. |
| Cost chips (+/−) | Keep | Numbers with icons; that is the "show". |
| "Real NASA data" lines on options | Keep | The point of the game; short, and with the source. |
| Result line after a choice (#64) | Keep | The consequence of the choice. |
| Rover: battery, samples, cost, legend | Keep (cost legend: see [show-dont-tell](show-dont-tell.md)) | The cost rules may become an icon legend later (audit storm 3). |
| Hands-on hints (`handsOn.*`) | Keep, except the build hint (**Replace**, row 3) | One line each. |
| Dust Season wipe rule (`wipeUi.rule`) | **Replace** (row 6) | Not "tap". |
| South Pole site lead | **Replace** (row 10) | Clearer trade-off. |

### Plan (`plan`, `play`, `jobs`, `jobInfo`, `crew`, `planHelp`, `bars`, `help`)
| Text | Decision | Reason |
|---|---|---|
| "Choose an astronaut. Then choose a job." | Keep | The one instruction; already fixed from "Tap" in 99a05b6. |
| Crew name and skill | Keep | Short, with a portrait. |
| Job name, one-line effect, cost | Keep | Name leads (bold), the effect is one line. |
| "What happens to skipped jobs?" | Keep | Opt-in (folded). |
| Meter labels, safe zones, power equation | Keep | Numbers and ticks; the words are labels. |
| "?" help topics (`help.*`) | Keep | Opt-in; each opens one short explanation. |
| Mini-game titles, leads, key hints (`miniGame.*`) | Keep, except the Moon ice game (**Replace**, row 7) | One lead and one key hint each. |

### End of sol (`endSol`, `domino`, `storm`, `chip`)
| Text | Decision | Reason |
|---|---|---|
| "Night falls on sol N" | Keep | The heading. |
| Changes popping in one by one (#65) | Keep | Numbers and icons. |
| Domino texts | Keep | One short line per cause; they make the chain. |
| Storm card and its data chip | Keep | The real storm, with its source. |
| NASA event ID | **Replace** (row 11) | Explain what it is. |

### Final (`final`, `run`)
| Text | Decision | Reason |
|---|---|---|
| Heading | **Replace** (row 12) | "Mission complete! N of 3 stars". |
| Star count line | **Remove** (row 13) | Repeated the heading. |
| Goal list (3 goals with star icons) | Keep | The icons show which were earned; "(got it)" / "(missed)" stay for screen readers only. |
| "Next time: …" | **Add** (row 14) | One tip. |
| Cause chain intro and dominoes | Keep | The point of the final screen. |
| "What real mission teams do" | Keep | One real-world line per mission. |
| Run number | Keep | For replaying the same run; it is small. |

### Grown-up pages (`dataSources`, `moreData`, `simplifies`, `teacher`, `data`, `comfort`)
| Text | Decision | Reason |
|---|---|---|
| Data Sources: every number, source and simplification | Keep | Text on purpose: judges, teachers and parents read it. |
| For teachers | Keep | Text on purpose (grown-ups). |
| Settings labels (`comfort.*`) | Keep | Labels next to switches. |
| Live / saved badges (`data.badge.*`) | Keep | One or two words. |

## Not changed, and why

- **Moon text that still says Mars and sol** is tracked in #76.
- **Rover cost rules as an icon legend** is a design change (#59, audit storm 3), listed in [show-dont-tell](show-dont-tell.md).
