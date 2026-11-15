// One adapter per data source. Each returns an envelope for writeSnapshot (or writes extra files itself).
// group: 'history' = fixed past events (fetch once, keep forever)
//        'recent'  = changes daily (refreshed by the scheduled GitHub Action)
//        'curated' = picked by hand, checked by the script
import { readFile } from 'node:fs/promises'
import { checkLink, daysAgo, fetchBytes, fetchJson, NASA_KEY, writePublic, ymd } from './lib.mjs'
import { apodEntry, imageItem, osdrCard, pickCme, pickSim, radlabStorm, summarizeSpaceWeather, trekTile, weatherWeek } from './normalize.mjs'

const DONKI_ATTR = 'NASA CCMC Space Weather Database Of Notifications, Knowledge, Information (DONKI)'
const NASA_LICENSE = 'NASA open data; not copyrighted in the US (NASA media usage guidelines)'

// ---------- DONKI: CCMC first (no key), then api.nasa.gov ----------

const CCMC = 'https://kauai.ccmc.gsfc.nasa.gov/DONKI/WS/get'
const GATEWAY = 'https://api.nasa.gov/DONKI'
let ccmcDown = false

async function donki(path) {
  if (!ccmcDown) {
    try {
      return { data: await fetchJson(CCMC + path, { timeoutMs: 15_000, retries: 0 }), source: CCMC + path }
    } catch (e) {
      ccmcDown = true // skip it for the rest of this run
      console.warn(`    CCMC unreachable (${e.message}), using api.nasa.gov`)
    }
  }
  const sep = path.includes('?') ? '&' : '?'
  return { data: await fetchJson(`${GATEWAY}${path}${sep}api_key=${NASA_KEY}`), source: GATEWAY + path }
}

const range = (days, now = new Date()) => `startDate=${ymd(daysAgo(days, now))}&endDate=${ymd(now)}`

export const SOURCES = [
  {
    name: 'cme-2024-05-20',
    group: 'history',
    async run() {
      const r = await donki('/CME?startDate=2024-05-20&endDate=2024-05-20')
      return {
        source: r.source,
        attribution: DONKI_ATTR,
        license: NASA_LICENSE,
        about: 'The far-side solar eruption of 20 May 2024. Curiosity RAD measured 8.1 mGy on the Mars surface from its particle burst.',
        data: r.data.filter((c) => c.activityID?.startsWith('2024-05-20T05:36')).map(pickCme),
      }
    },
  },
  {
    name: 'enlil-mars-2024-05',
    group: 'history',
    async run() {
      const r = await donki('/WSAEnlilSimulations?startDate=2024-05-19&endDate=2024-05-24')
      return {
        source: r.source,
        attribution: DONKI_ATTR,
        license: NASA_LICENSE,
        about: 'WSA-Enlil model runs 19–24 May 2024. The CME of 23 May was forecast to reach Mars on 28 May; the 20 May CME was not forecast to hit Mars.',
        data: r.data.map(pickSim).filter((s) => s.impactList.length > 0),
      }
    },
  },
  {
    name: 'enlil-mars-recent',
    group: 'recent',
    async run() {
      const r = await donki(`/WSAEnlilSimulations?${range(30)}`)
      return {
        source: r.source,
        attribution: DONKI_ATTR,
        license: NASA_LICENSE,
        about: 'Fallback for "Today\'s Sun": the latest WSA-Enlil runs that forecast a CME reaching Mars (last 30 days before the snapshot date).',
        data: r.data.map(pickSim).filter((s) => s.impactList.some((i) => i.location === 'Mars')),
      }
    },
  },
  {
    name: 'space-weather-recent',
    group: 'recent',
    async run() {
      const now = new Date()
      const q = range(30, now)
      // Each part on its own: one broken endpoint (FLR answered 404 on 14 Nov 2026) must not sink the rest.
      const parts = { flr: `/FLR?${q}`, sep: `/SEP?${q}`, cme: `/CME?${q}`, gst: `/GST?${q}`, notifications: `/notifications?${q}&type=all` }
      const got = {}
      const missing = []
      let src = null
      for (const [k, path] of Object.entries(parts)) {
        try {
          const r = await donki(path)
          got[k] = r.data
          src ??= r.source
        } catch (e) {
          console.warn(`    ${k} unavailable: ${e.message}`)
          missing.push(k)
        }
      }
      if (missing.includes('cme') || missing.length > 2) throw new Error(`too many DONKI parts missing: ${missing.join(', ')}`)
      return {
        source: `${src.split('/', 4).slice(0, 4).join('/')}/{FLR,SEP,CME,GST,notifications}?${q}`,
        attribution: DONKI_ATTR,
        license: NASA_LICENSE,
        about: 'What the Sun did in the last 30 days, as seen from near Earth: flares, particle events, CMEs, geomagnetic storms. Context only — most of these never reach Mars.',
        data: summarizeSpaceWeather(got, { start: ymd(daysAgo(30, now)), end: ymd(now) }, { missing }),
      }
    },
  },

  {
    name: 'space-weather-week',
    group: 'recent',
    async run() {
      const now = new Date()
      const q = range(7, now)
      const parts = { flr: `/FLR?${q}`, sep: `/SEP?${q}`, cme: `/CME?${q}`, gst: `/GST?${q}` }
      const got = {}
      const missing = []
      let src = null
      for (const [k, path] of Object.entries(parts)) {
        try {
          const r = await donki(path)
          got[k] = r.data
          src ??= r.source
        } catch (e) {
          console.warn(`    ${k} unavailable: ${e.message}`)
          missing.push(k)
        }
      }
      if (missing.includes('cme') || missing.length > 2) throw new Error(`too many DONKI parts missing: ${missing.join(', ')}`)
      return {
        source: `${src.split('/', 4).slice(0, 4).join('/')}/{FLR,SEP,CME,GST}?${q}`,
        attribution: DONKI_ATTR,
        license: NASA_LICENSE,
        about: 'Fallback for the radar strip: every flare, CME, particle event and geomagnetic storm DONKI listed in the 7 days before the snapshot date. Seen from near Earth; Mars only where a WSA-Enlil run forecast it.',
        data: weatherWeek(got, { start: ymd(daysAgo(7, now)), end: ymd(now) }, { missing }),
      }
    },
  },

  // ---------- RadLab: Curiosity RAD on the Mars surface, 15–25 May 2024 ----------
  {
    name: 'radlab-msl-2024-05',
    group: 'history',
    async run() {
      const base = 'https://visualization.osdr.nasa.gov/radlab/api/'
      const q = '?instrument_id=MSL-RAD-Surface&absorbed_dose_rate&timestamp>=2024-05-15&timestamp<2024-05-26&format=json'
      const raw = await fetchJson(base + q, { timeoutMs: 120_000 })
      const cols = raw.columns ?? []
      if (cols[2] !== 'absorbed_dose_rate') throw new Error(`RadLab: unexpected columns ${cols.join(',')}`)
      return {
        source: base + q,
        attribution: 'NASA Open Science Data Repository (OSDR) RadLab — Curiosity Radiation Assessment Detector (MSL RAD), surface',
        license: NASA_LICENSE,
        about: 'Absorbed dose rate in silicon (µGy per hour) measured by Curiosity on the Mars surface around the 20 May 2024 solar storm.',
        data: { instrument: 'MSL-RAD-Surface', stormStart: '2024-05-20T05:30:00', ...radlabStorm(raw.data, { stormStart: '2024-05-20T05:30:00', bucketHours: 1 }) },
      }
    },
  },

  // ---------- OSDR: curated studies ----------
  {
    name: 'osdr-studies',
    group: 'curated',
    async run() {
      const picks = [
        { id: 'OSD-267', topic: 'food' }, // Veggie lettuce on the ISS
        { id: 'OSD-772', topic: 'food' }, // chile peppers on the ISS
        { id: 'OSD-766', topic: 'food' }, // tomatoes in Veggie
        { id: 'OSD-658', topic: 'radiation' }, // plants under simulated cosmic rays
      ]
      const cards = []
      for (const p of picks) {
        const n = p.id.replace('OSD-', '')
        cards.push(osdrCard(await fetchJson(`https://osdr.nasa.gov/osdr/data/osd/meta/${n}`), p.id, p))
      }
      const search = await fetchJson('https://osdr.nasa.gov/osdr/data/search?term=Veggie&type=cgene&size=1')
      return {
        source: 'https://osdr.nasa.gov/osdr/data/osd/meta/{267,772,766,658} + /osdr/data/search?term=Veggie',
        attribution: 'NASA Open Science Data Repository (OSDR)',
        license: NASA_LICENSE,
        about: 'Real space-biology studies behind the greenhouse and the space-ray meter. Picked by hand; titles and links from OSDR.',
        data: { cards, veggieStudies: Number(search?.hits?.total?.value ?? search?.hits?.total ?? 0) || null },
      }
    },
  },

  // ---------- NASA Image and Video Library: curated pictures, saved locally for offline ----------
  {
    name: 'mission-images',
    group: 'curated',
    async run() {
      const picks = [
        { id: 'PIA25287', use: 'dust' }, // InSight's final, dusty selfie
        { id: 'PIA26302', use: 'storm' }, // Curiosity's camera speckled by the 20 May 2024 storm
        { id: 'PIA16058', use: 'site' }, // Gale Crater around Curiosity
      ]
      const items = []
      for (const p of picks) {
        const r = await fetchJson(`https://images-api.nasa.gov/search?nasa_id=${p.id}`)
        const it = imageItem(r?.collection?.items?.[0])
        const file = `img/${p.id}.jpg`
        await writePublic(file, await fetchBytes(it.remoteImage))
        items.push({ ...it, use: p.use, image: `data/${file}` })
      }
      return {
        source: 'https://images-api.nasa.gov/search?nasa_id={PIA25287,PIA26302,PIA16058}',
        attribution: 'NASA Image and Video Library',
        license: NASA_LICENSE,
        about: 'Real pictures for the dust, storm and landing-site facts. Small copies saved in public/data/img/ so they show offline.',
        data: items,
      }
    },
  },

  // ---------- APOD (new endpoint; the old api.nasa.gov/planetary/apod goes offline 1 Dec 2026) ----------
  {
    name: 'apod-recent',
    group: 'recent',
    async run() {
      const url = 'https://science.nasa.gov/wp-json/wp/v2/apod-basic?per_page=7'
      const raw = await fetchJson(url)
      return {
        source: url,
        attribution: 'Astronomy Picture of the Day (NASA / Michigan Tech). Each picture has its own credit and copyright.',
        license: 'Per picture — most APODs are third-party copyrighted. We only link and show the credit; we never copy the picture.',
        about: 'The last 7 Astronomy Pictures of the Day, as links for the "explore more" list.',
        data: (Array.isArray(raw) ? raw : []).map(apodEntry),
      }
    },
  },

  // ---------- Mars Trek: 2×2 map tiles around Gale Crater ----------
  {
    name: 'mars-trek-gale',
    group: 'curated',
    async run() {
      const layer = 'Mars_Viking_MDIM21_ClrMosaic_global_232m'
      const site = { name: 'Gale Crater', lat: -5.4, lon: 137.8 }
      const zoom = 6
      const c = trekTile({ ...site, zoom })
      const tiles = []
      for (const row of [c.row, c.row + 1]) {
        for (const col of [c.col, c.col + 1]) {
          const remote = `https://trek.nasa.gov/tiles/Mars/EQ/${layer}/1.0.0/default/default028mm/${zoom}/${row}/${col}.jpg`
          const file = `trek/${zoom}_${row}_${col}.jpg`
          await writePublic(file, await fetchBytes(remote))
          tiles.push({ row, col, image: `data/${file}`, remote })
        }
      }
      return {
        source: `https://trek.nasa.gov/tiles/Mars/EQ/${layer}/1.0.0/WMTSCapabilities.xml`,
        attribution: 'NASA Mars Trek (NASA/JPL-Caltech, USGS) — Viking MDIM 2.1 colour mosaic',
        license: NASA_LICENSE,
        about: 'A map of the area around Gale Crater, where Curiosity measured the 20 May 2024 storm. Our pretend base sits here.',
        data: { layer, site, zoom, tiles, explore: 'https://trek.nasa.gov/mars/' },
      }
    },
  },

  // ---------- CSA: hand-picked educator links (we link, we don't copy) ----------
  {
    name: 'csa-resources',
    group: 'curated',
    async run() {
      const items = JSON.parse(await readFile(new URL('./curated/csa.json', import.meta.url), 'utf8'))
      for (const url of items.flatMap((it) => [it.url, ...(it.links ?? []).map((l) => l.url)])) {
        const status = await checkLink(url)
        if (status !== 200) throw new Error(`CSA link ${url} answered ${status}`)
      }
      return {
        source: 'https://www.asc-csa.gc.ca/eng/youth-educators/',
        attribution: 'Canadian Space Agency (CSA)',
        license: 'Linked only, not reproduced. CSA terms: https://www.asc-csa.gc.ca/eng/terms.asp#copyright',
        about: 'Canadian Space Agency activities for teachers and families who want to go further after the game.',
        data: items,
      }
    },
  },
]
