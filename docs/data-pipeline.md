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

Live data in the browser: **"Today's Sun"** (`src/data/donki.ts`, DEMO_KEY, Mars-only WSA-Enlil, falls back to the snapshot). Everything else is saved data, never labelled live.

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

- Local: `NASA_API_KEY=…` in `app/.env` or the team repo's root `.env` (both gitignored). `run.mjs` loads it itself and prints `NASA key: personal key (40 characters)` or `DEMO_KEY`; the value is never printed or written (`writeSnapshot` refuses a file containing it).
- CI: repository secret `NASA_API_KEY` (Settings → Secrets and variables → Actions, or `gh secret set NASA_API_KEY` typed in your own terminal).
- Never a `VITE_*` variable. The browser only ever uses `DEMO_KEY`.
- Rotate: get a new key at https://api.nasa.gov, replace the secret and `.env`; nothing else changes.
- Limits: personal key 1,000 requests/hour; DEMO_KEY 30/hour, 50/day **per IP** (exhausted at the venue on Sat 14 Nov). CCMC (`kauai.ccmc.gsfc.nasa.gov`) needs no key but was unreachable from the venue network.

## Open science questions (ask science-checker before using in kid text)

- RadLab's integrated extra dose for 20–25 May 2024 is ~1.6 mGy (silicon), while JPL reports 8.1 mGy for the storm. Different quantity/detector or integration window — **do not show the RadLab total**; we only show the peak-vs-normal ratio and the curve.
- RadLab "normal" in May 2024 (~4 µGy/h ≈ 0.1 mGy/day) is lower than the Hassler 2014 baseline (0.21 mGy/day); solar maximum lowers cosmic rays. The game keeps the cited Hassler value.

## Live refresh in the browser (src/data/live.ts)

CORS checked 14 Nov 2026 with `Origin: https://yyn192.github.io`:

| API | Browser may call? | What we do |
|---|---|---|
| api.nasa.gov DONKI | yes (`*`) | `liveSpaceWeather()` refreshes "What the Sun did this month" |
| science.nasa.gov APOD | yes (reflects origin) | `liveApod()` refreshes "Space picture of the day" |
| images-api.nasa.gov, trek.nasa.gov | yes (`*`) | saved copies only — fixed history, no requests wasted |
| osdr.nasa.gov | no (`osdr.nasa.gov` only) | saved only |
| RadLab | no header | saved only |
| asc-csa.gc.ca | n/a | links only |

Saved data renders first; the live call runs in the background (timeout → retry/backoff on 429/5xx →
6 h localStorage cache → stale cache → saved snapshot). Two calls for the same URL at once share one
request (StrictMode). Each card shows LIVE or SAVED with the time. `?offline=1` and `npm test` never call out.
The browser uses DEMO_KEY only (public, 30 requests/hour per player IP; 5 DONKI calls per player per 6 h).

## Known outages

- **14 Nov 2026: `api.nasa.gov/DONKI/FLR` answers 404 for every date range** (backend path `/DONKI-API/get/FLR/`);
  SEP, CME, GST, IPS, HSS and notifications work. Each DONKI part is fetched separately; a missing part is
  recorded in `missing` and its counts are `null`, and the card says the flare list was not available
  instead of showing "0 flares". CME missing, or more than 2 parts missing → the whole refresh is refused.
- CCMC (`kauai.ccmc.gsfc.nasa.gov`) unreachable from the venue network; the gateway is used instead.

## Our backend (Vercel `api/`, added 14 Nov 2026)

The browser now asks **our backend first** when the build has `VITE_API_BASE` (Vercel: `/api`):

1. `/api/donki/...` → the function tries CCMC (keyless, 3 s), then `api.nasa.gov` with the server-only `NASA_API_KEY`
   (one retry on 429/5xx, Retry-After honoured), checks the shape with zod, and the Vercel CDN keeps it 1 h.
2. Backend unreachable or missing (GitHub Pages, `npm run dev`) → the old direct DEMO_KEY call.
   Backend says NASA is down (429/502/503/504) → **no** direct call (it would fail the same way) → stale cache → snapshot.
3. A failed refresh is remembered for 1 h (`failTtlMs`), so opening Data Sources again does not re-ask a broken endpoint (FLR).

Badge: **LIVE** only for an answer fetched now; **KEPT DATA** + date for an earlier real download (browser cache or the
backend's last good copy, `source: "cached"`); **SAVED DATA** + date for bundled snapshots.
Today's Sun: a Mars arrival that is already in the past is never shown as "heading for Mars" (`notice.sunPassed`).
Measured 14 Nov 2026 from the venue: DSN 0.7 s, OSDR search 0.9 s, DONKI gateway 429 on DEMO_KEY (venue IP locked out) → a personal key on Vercel is required for live DONKI.
