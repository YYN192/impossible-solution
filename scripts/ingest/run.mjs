// Downloads the real NASA / CSA data the game ships with, so it works with no network at play time.
//
//   npm run ingest                        every source
//   npm run ingest -- --group=recent      only the ones that change daily (what the scheduled Action runs)
//   npm run ingest -- --only=radlab-msl-2024-05,osdr-studies
//   npm run ingest -- --strict            exit 1 if any source failed (default: warn, keep old files)
//
// Output: src/data/snapshots/<name>.json (bundled into the game) and public/data/{img,trek}/ (pictures).
// A failed source keeps its last good file. NASA_API_KEY comes from the environment; it is never written.
// Local runs: read NASA_API_KEY from app/.env if it exists (Node 20.12+). The value is never printed.
try {
  process.loadEnvFile?.(new URL('../../.env', import.meta.url))
} catch {
  /* no .env: DEMO_KEY (30 requests/hour per IP) */
}
const { readSnapshot, writeSnapshot } = await import('./lib.mjs')
const { SOURCES } = await import('./sources.mjs')

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v = 'true'] = a.replace(/^--/, '').split('=')
    return [k, v]
  }),
)
const only = args.only?.split(',')
const groups = args.group?.split(',')

const picked = SOURCES.filter((s) => (!only || only.includes(s.name)) && (!groups || groups.includes(s.group)))
if (picked.length === 0) {
  console.error(`No sources match. Known: ${SOURCES.map((s) => `${s.name} (${s.group})`).join(', ')}`)
  process.exit(2)
}

const failed = []
for (const s of picked) {
  console.log(`→ ${s.name} [${s.group}]`)
  try {
    const out = await writeSnapshot(s.name, await s.run())
    const n = Array.isArray(out.data) ? `${out.data.length} records` : 'ok'
    console.log(`✔ ${s.name}: ${n}`)
  } catch (e) {
    failed.push(s.name)
    const prev = await readSnapshot(s.name)
    console.error(`✘ ${s.name}: ${e.message}`)
    console.error(prev ? `  kept the last good snapshot from ${prev.fetchedAt}` : '  no earlier snapshot exists')
  }
}

console.log(`\n${picked.length - failed.length}/${picked.length} sources refreshed${failed.length ? `; kept old data for: ${failed.join(', ')}` : ''}`)
if (failed.length && args.strict) process.exitCode = 1
