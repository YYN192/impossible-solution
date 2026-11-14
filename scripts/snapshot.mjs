// Downloads the real NASA DONKI records the game ships with (works with no network at play time).
// Run: npm run snapshot
// Tries the CCMC DONKI server first (no key, no rate limit), then api.nasa.gov with NASA_API_KEY from .env
// (or DEMO_KEY: 30 requests/hour per IP). The key is never written into the snapshot files.
// Output: src/data/snapshots/*.json — bundled into the game, committed to git.
import { mkdir, writeFile } from 'node:fs/promises'

const CCMC = 'https://kauai.ccmc.gsfc.nasa.gov/DONKI/WS/get'
const GATEWAY = 'https://api.nasa.gov/DONKI'
const KEY = process.env.NASA_API_KEY || 'DEMO_KEY'
const OUT = new URL('../src/data/snapshots/', import.meta.url)

async function getOnce(url) {
  const r = await fetch(url, { signal: AbortSignal.timeout(45_000), headers: { Accept: 'application/json' } })
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  return r.json()
}

/** path like "/CME?startDate=..." → tries CCMC, then the api.nasa.gov gateway. Returns { data, source } with no key in source. */
async function get(path) {
  try {
    return { data: await getOnce(CCMC + path), source: CCMC + path }
  } catch (e) {
    console.warn(`  CCMC failed (${e.cause?.code ?? e.message}), trying api.nasa.gov…`)
    const sep = path.includes('?') ? '&' : '?'
    return { data: await getOnce(`${GATEWAY}${path}${sep}api_key=${KEY}`), source: GATEWAY + path }
  }
}

const pickCme = (c) => ({
  activityID: c.activityID,
  startTime: c.startTime,
  note: c.note,
  link: c.link,
  analyses: (c.cmeAnalyses ?? []).filter((a) => a.isMostAccurate).map((a) => ({ speed: a.speed, type: a.type, halfAngle: a.halfAngle })),
})
const pickSim = (s) => ({
  simulationID: s.simulationID,
  modelCompletionTime: s.modelCompletionTime,
  link: s.link,
  cmeIDs: (s.cmeInputs ?? []).map((c) => c.cmeStartTime),
  impactList: (s.impactList ?? []).map((i) => ({ location: i.location, arrivalTime: i.arrivalTime, isGlancingBlow: i.isGlancingBlow })),
})

const targets = [
  {
    name: 'cme-2024-05-20',
    about: 'The far-side solar eruption of 20 May 2024. Curiosity RAD measured 8.1 mGy on the Mars surface from its particle burst.',
    path: `/CME?startDate=2024-05-20&endDate=2024-05-20`,
    shape: (d) => d.filter((c) => c.activityID?.startsWith('2024-05-20T05:36')).map(pickCme),
  },
  {
    name: 'enlil-mars-2024-05',
    about: 'WSA-Enlil model runs 19–24 May 2024. The CME of 23 May was forecast to reach Mars on 28 May; the 20 May CME was not forecast to hit Mars.',
    path: `/WSAEnlilSimulations?startDate=2024-05-19&endDate=2024-05-24`,
    shape: (d) => d.map(pickSim).filter((s) => s.impactList.length > 0),
  },
  {
    name: 'enlil-mars-recent',
    about: 'Fallback for "Today\'s Sun": the latest WSA-Enlil runs that forecast a CME reaching Mars (last 30 days before the snapshot date).',
    path: (() => {
      const end = new Date()
      const start = new Date(end.getTime() - 30 * 864e5)
      const d = (x) => x.toISOString().slice(0, 10)
      return `/WSAEnlilSimulations?startDate=${d(start)}&endDate=${d(end)}`
    })(),
    shape: (d) => d.map(pickSim).filter((s) => s.impactList.some((i) => i.location === 'Mars')),
  },
]

await mkdir(OUT, { recursive: true })
for (const t of targets) {
  try {
    const res = await get(t.path)
    const data = t.shape(res.data)
    if (data.length === 0) throw new Error('no matching records — refusing to write an empty snapshot')
    const out = { fetchedAt: new Date().toISOString(), source: res.source, attribution: 'NASA CCMC Space Weather Database Of Notifications, Knowledge, Information (DONKI)', about: t.about, data }
    await writeFile(new URL(`${t.name}.json`, OUT), JSON.stringify(out, null, 2) + '\n')
    console.log(`✔ ${t.name}: ${data.length} records`)
  } catch (e) {
    console.error(`✘ ${t.name}: ${e.message}`)
    process.exitCode = 1
  }
}
