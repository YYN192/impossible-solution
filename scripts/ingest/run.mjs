// Downloads the real NASA / CSA data the game ships with, so it works with no network at play time.
//
//   npm run ingest                        every source
//   npm run ingest -- --group=recent      only the ones that change daily (what the scheduled Action runs)
//   npm run ingest -- --only=radlab-msl-2024-05,osdr-studies
//   npm run ingest -- --strict            exit 1 if any source failed (default: warn, keep old files)
//
// Output: src/data/snapshots/<name>.json (bundled into the game) and public/data/{img,trek}/ (pictures).
// A failed source keeps its last good file. NASA_API_KEY comes from the environment; it is never written.
// Local runs: NASA_API_KEY from app/.env, or from the team repo's .env one folder up. The value is never printed.
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
const envFiles = ['../../.env', '../../../.env'].map((p) => fileURLToPath(new URL(p, import.meta.url)))
let envUsed = null
if (!process.env.NASA_API_KEY) {
  for (const f of envFiles) {
    if (!existsSync(f)) continue
    try {
      process.loadEnvFile(f)
    } catch (e) {
      console.warn(`! could not read ${f}: ${e.message}`)
      continue
    }
    if (process.env.NASA_API_KEY) {
      envUsed = f
      break
    }
  }
}
{
  const k = process.env.NASA_API_KEY
  const who = !k || k === 'DEMO_KEY' ? 'DEMO_KEY (30 requests/hour per IP)' : `personal key (${k.length} characters)`
  console.log(`NASA key: ${who}${envUsed ? ` from ${envUsed}` : k ? ' from the environment' : ''}`)
  if (k && /^["'\s]|["'\s]$/.test(k)) console.warn('! NASA_API_KEY starts or ends with a quote or space — remove it')
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
