# Data pipeline

```
NASA / CSA sources ──► scripts/ingest (Node, timeout + retry + validation)
                         ├─► src/data/snapshots/<name>.json   bundled into the game (works with ?offline=1)
                         └─► public/data/{img,trek}/          pictures and map tiles, served next to the app
                                    │
              src/data/datasets.ts (zod schemas, checked by npm test)
                                    │
              src/data/client.ts → dataClient.getX()  → screens (always labelled SAVED, with date)
```

Live data in the browser exists only for **"Today's Sun"** (`src/data/donki.ts`, DEMO_KEY, Mars-only WSA-Enlil, falls back to the snapshot). Everything else is saved data, never labelled live.

## Sources

| Snapshot               | Group   | Endpoint                                                                                      | Key?         | Feeds                                                       |
| ---------------------- | ------- | --------------------------------------------------------------------------------------------- | ------------ | ----------------------------------------------------------- |
| `cme-2024-05-20`       | history | DONKI `/CME` (CCMC, then api.nasa.gov)                                                        | gateway only | Storm on sol 2                                              |
| `enlil-mars-2024-05`   | history | DONKI `/WSAEnlilSimulations`                                                                  | gateway only | Ask Earth forecast, storm cloud sol 3                       |
| `enlil-mars-recent`    | recent  | DONKI `/WSAEnlilSimulations`, last 30 days, Mars only                                         | gateway only | "Today's Sun" fallback                                      |
| `space-weather-recent` | recent  | DONKI `/FLR /SEP /CME /GST /notifications`, last 30 days                                      | gateway only | "What the Sun did this month" (optional; hidden if missing) |
| `radlab-msl-2024-05`   | history | RadLab `?instrument_id=MSL-RAD-Surface&absorbed_dose_rate&timestamp>=…`                       | no           | Storm curve (peak vs normal)                                |
| `osdr-studies`         | curated | OSDR `/osdr/data/osd/meta/{id}` + `/osdr/data/search`                                         | no           | Space-plant cards                                           |
| `mission-images`       | curated | Image Library `/search?nasa_id=` + image download                                             | no           | Dust / storm / site pictures                                |
| `apod-recent`          | recent  | `science.nasa.gov/wp-json/wp/v2/apod-basic` (the old `/planetary/apod` shuts down 1 Dec 2026) | no           | Link + credit only                                          |
| `mars-trek-gale`       | curated | Trek WMTS `Mars_Viking_MDIM21_ClrMosaic_global_232m`, zoom 6, 2×2 tiles                       | no           | "Where is our base?" map                                    |
| `csa-resources`        | curated | `scripts/ingest/curated/csa.json`, every link checked for HTTP 200                            | no           | Teachers and families links                                 |

Mars Rover Photos API: archived, not used.

## Commands

```
npm run ingest                       # everything
npm run ingest -- --group=recent     # what the scheduled Action runs
npm run ingest -- --only=osdr-studies
npm run ingest -- --strict           # exit 1 on any failure
```

A failed source prints `✘` and **keeps its last good file**; empty answers are refused. `npm test` then checks every file against its schema and that no file contains `api_key=`.

## Schedule

`.github/workflows/deploy.yml`: on push → test, build, deploy. Every 3 h (cron `17 */3 * * *`) and on manual run → `npm run ingest -- --group=recent` first (`continue-on-error`), then test/build/deploy. Refreshed files are not committed; they live in that deploy. If the refresh brings strange data, the schema tests fail and the previous site stays up. History datasets (May 2024) are only changed by hand.

## The NASA key

- Local: `NASA_API_KEY=…` in `app/.env` (gitignored). `run.mjs` loads it itself; the value is never printed or written (`writeSnapshot` refuses a file containing it).
- CI: repository secret `NASA_API_KEY` (Settings → Secrets and variables → Actions, or `gh secret set NASA_API_KEY` typed in your own terminal).
- Never a `VITE_*` variable. The browser only ever uses `DEMO_KEY`.
- Rotate: get a new key at https://api.nasa.gov, replace the secret and `.env`; nothing else changes.
- Limits: personal key 1,000 requests/hour; DEMO_KEY 30/hour, 50/day **per IP** (exhausted at the venue on Sat 14 Nov). CCMC (`kauai.ccmc.gsfc.nasa.gov`) needs no key but was unreachable from the venue network.

## Open science questions (ask science-checker before using in kid text)

- RadLab's integrated extra dose for 20–25 May 2024 is ~1.6 mGy (silicon), while JPL reports 8.1 mGy for the storm. Different quantity/detector or integration window — **do not show the RadLab total**; we only show the peak-vs-normal ratio and the curve.
- RadLab "normal" in May 2024 (~4 µGy/h ≈ 0.1 mGy/day) is lower than the Hassler 2014 baseline (0.21 mGy/day); solar maximum lowers cosmic rays. The game keeps the cited Hassler value.
