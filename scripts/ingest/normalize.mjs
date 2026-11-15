// Pure functions: raw NASA/CSA responses → the small shapes the game ships with.
// No network, no files — unit-tested in normalize.test.mjs.

const list = (v) => (Array.isArray(v) ? v : []);
const byTimeDesc = (key) => (a, b) =>
  String(b[key] ?? "").localeCompare(String(a[key] ?? ""));

// ---------- DONKI ----------

export const pickCme = (c) => ({
  activityID: c.activityID,
  startTime: c.startTime,
  note: c.note,
  link: c.link,
  analyses: list(c.cmeAnalyses)
    .filter((a) => a.isMostAccurate)
    .map((a) => ({ speed: a.speed, type: a.type, halfAngle: a.halfAngle })),
});

export const pickSim = (s) => ({
  simulationID: s.simulationID,
  modelCompletionTime: s.modelCompletionTime,
  link: s.link,
  cmeIDs: list(s.cmeInputs).map((c) => c.cmeStartTime),
  cmeId: list(s.cmeInputs)[0]?.CMEID ?? null,
  speed: list(s.cmeInputs)[0]?.speed ?? null,
  impactList: list(s.impactList).map((i) => ({
    location: i.location,
    arrivalTime: i.arrivalTime,
    isGlancingBlow: i.isGlancingBlow,
  })),
});

const FLARE_RANK = { A: 0, B: 1, C: 2, M: 3, X: 4 };
/** "X2.0" → 42.0, "M1.2" → 31.2; unknown → -1. Sorts flares by strength. */
export function flareStrength(classType) {
  const m = /^([ABCMX])(\d+(?:\.\d+)?)/.exec(String(classType ?? ""));
  return m ? FLARE_RANK[m[1]] * 10 + Math.min(Number(m[2]), 9.99) : -1;
}

/** Last-30-days space weather, summarised for a kid card. Message bodies are dropped (long, technical). */
/** `missing`: parts that did not answer (e.g. ["flr"]); their counts are null, never 0. */
export function summarizeSpaceWeather(raw, window, { missing = [] } = {}) {
  const gone = (k) => missing.includes(k)
  const flr = list(raw.flr);
  const sep = list(raw.sep);
  const cme = list(raw.cme);
  const gst = list(raw.gst);
  const notes = list(raw.notifications);

  const strongest = [...flr].sort(
    (a, b) => flareStrength(b.classType) - flareStrength(a.classType),
  )[0];
  const newestCme = [...cme].sort(byTimeDesc("startTime"))[0];
  const kps = gst
    .flatMap((g) => list(g.allKpIndex).map((k) => Number(k.kpIndex)))
    .filter(Number.isFinite);

  return {
    window,
    counts: {
      flares: gone('flr') ? null : flr.length,
      bigFlares: gone('flr') ? null : flr.filter((f) => flareStrength(f.classType) >= 30).length,
      particleEvents: gone('sep') ? null : sep.length,
      cmes: gone('cme') ? null : cme.length,
      geomagneticStorms: gone('gst') ? null : gst.length,
    },
    strongestFlare: strongest
      ? {
          classType: strongest.classType,
          peakTime: strongest.peakTime,
          link: strongest.link,
        }
      : null,
    latestCme: newestCme
      ? {
          id: newestCme.activityID,
          startTime: newestCme.startTime,
          speedKmS:
            list(newestCme.cmeAnalyses).find((a) => a.isMostAccurate)?.speed ??
            null,
          link: newestCme.link,
        }
      : null,
    strongestStormKp: kps.length ? Math.max(...kps) : null,
    missing: [...missing],
    notifications: [...notes]
      .sort(byTimeDesc("messageIssueTime"))
      .slice(0, 5)
      .map((n) => ({
        type: n.messageType,
        issueTime: n.messageIssueTime,
        url: n.messageURL,
      })),
  };
}

/**
 * The radar's space weather strip (#60): one row per event type, one entry per event in `window`
 * (dates, inclusive), oldest first. A part in `missing` did not answer: its events are null, never [].
 * `marsForecast` only when a DONKI WSA-Enlil run lists Mars (the #8 rule: we never guess a Mars hit).
 */
export function weatherWeek(raw, window, { missing = [] } = {}) {
  const inWindow = (t) => typeof t === "string" && t.slice(0, 10) >= window.start && t.slice(0, 10) <= window.end;
  const rowOf = (type, events) => ({
    type,
    events: missing.includes(type)
      ? null
      : events.filter((e) => inWindow(e.time)).sort((a, b) => a.time.localeCompare(b.time)),
  });
  const mars = (c) =>
    list(c.cmeAnalyses).some((a) => list(a.enlilList).some((e) => list(e.impactList).some((i) => i.location === "Mars")));
  const kps = (g) => list(g.allKpIndex).map((k) => Number(k.kpIndex)).filter(Number.isFinite);
  const link = (e) => (typeof e.link === "string" ? { link: e.link } : {});
  return {
    window,
    rows: [
      rowOf("flr", list(raw.flr).map((f) => ({ id: String(f.flrID ?? f.peakTime ?? ""), time: f.peakTime ?? f.beginTime, flareClass: f.classType ?? null, marsForecast: false, ...link(f) }))),
      rowOf("cme", list(raw.cme).map((c) => ({ id: String(c.activityID ?? c.startTime ?? ""), time: c.startTime, speedKmS: list(c.cmeAnalyses).find((a) => a.isMostAccurate)?.speed ?? null, marsForecast: mars(c), ...link(c) }))),
      rowOf("sep", list(raw.sep).map((s) => ({ id: String(s.sepID ?? s.eventTime ?? ""), time: s.eventTime, marsForecast: false, ...link(s) }))),
      rowOf("gst", list(raw.gst).map((g) => ({ id: String(g.gstID ?? g.startTime ?? ""), time: g.startTime, kp: kps(g).length ? Math.max(...kps(g)) : null, marsForecast: false, ...link(g) }))),
    ],
  };
}

// ---------- RadLab (OSDR) ----------

const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

/**
 * Curiosity RAD dose-rate rows [timestamp, instrument_id, absorbed_dose_rate (µGy/h)] around a storm.
 * normal = median before the storm; extra dose = ∫ max(0, rate − normal) dt after storm start (trapezoid).
 * The series is averaged into `bucketHours` buckets so the snapshot stays small.
 */
export function radlabStorm(rows, { stormStart, bucketHours = 3 }) {
  const pts = rows
    .filter((r) => typeof r[2] === "number" && Number.isFinite(r[2]))
    .map((r) => ({ time: r[0], rate: r[2] }))
    .sort((a, b) => a.time.localeCompare(b.time));
  const before = pts.filter((p) => p.time < stormStart);
  if (before.length === 0)
    throw new Error(
      'RadLab: no readings before the storm, cannot tell what "normal" is',
    );
  const after = pts.filter((p) => p.time >= stormStart);
  if (after.length === 0)
    throw new Error("RadLab: no readings after the storm start");

  const normalRate = median(before.map((p) => p.rate));
  const peak = after.reduce((a, b) => (b.rate > a.rate ? b : a));

  let extra = 0;
  for (let i = 1; i < after.length; i++) {
    const h =
      (Date.parse(after[i].time + "Z") - Date.parse(after[i - 1].time + "Z")) /
      3.6e6;
    const y0 = Math.max(0, after[i - 1].rate - normalRate);
    const y1 = Math.max(0, after[i].rate - normalRate);
    extra += ((y0 + y1) / 2) * h;
  }

  const buckets = new Map();
  for (const p of pts) {
    const t = Date.parse(p.time + "Z");
    const k = Math.floor(t / (bucketHours * 3.6e6)) * bucketHours * 3.6e6;
    const b = buckets.get(k) ?? { sum: 0, n: 0 };
    b.sum += p.rate;
    b.n += 1;
    buckets.set(k, b);
  }
  const series = [...buckets.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([k, b]) => ({
      time: new Date(k).toISOString().slice(0, 19),
      rate: Math.round((b.sum / b.n) * 100) / 100,
    }));

  return {
    unit: "µGy/h",
    normalRate: Math.round(normalRate * 100) / 100,
    peak: { time: peak.time, rate: peak.rate },
    peakTimesNormal: peak.rate / normalRate,
    extraDoseMicroGy: Math.round(extra),
    readings: pts.length,
    series,
  };
}

// ---------- OSDR ----------

const clip = (s, n) => {
  const t = String(s ?? "")
    .replace(/\s+/g, " ")
    .trim();
  return t.length <= n ? t : t.slice(0, n - 1).replace(/\s+\S*$/, "") + "…";
};

export function osdrCard(meta, id, { topic }) {
  const study = meta?.study?.[id]?.studies?.[0];
  if (!study?.title) throw new Error(`OSDR: no metadata for ${id}`);
  return {
    id,
    topic,
    title: study.title,
    description: clip(study.description, 300),
    organism: list(study.materials?.sources)[0]?.name ?? null,
    released: study.publicReleaseDate ?? null,
    url: `https://osdr.nasa.gov/bio/repo/data/studies/${id}`,
  };
}

// ---------- NASA Image and Video Library ----------

export function imageItem(item) {
  const d = item?.data?.[0];
  if (!d?.nasa_id) throw new Error("Image Library: item without nasa_id");
  const imgs = list(item.links).filter((l) => l.render === "image");
  const small =
    imgs.find((l) => /~small\./.test(l.href)) ??
    imgs.find((l) => /~medium\./.test(l.href)) ??
    imgs[0];
  if (!small) throw new Error(`Image Library: no image link for ${d.nasa_id}`);
  return {
    nasaId: d.nasa_id,
    title: d.title,
    description: clip(d.description_508 || d.description, 300),
    date: String(d.date_created ?? "").slice(0, 10),
    credit:
      d.secondary_creator ||
      d.photographer ||
      `NASA/${d.center ?? ""}`.replace(/\/$/, ""),
    page: `https://images.nasa.gov/details/${d.nasa_id}`,
    remoteImage: small.href,
  };
}

// ---------- APOD (science.nasa.gov) ----------

export function stripHtml(s) {
  return String(s ?? "")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

/** We link to APOD and show its credit; we never copy the picture (most APODs are third-party copyrighted). */
export function apodEntry(raw) {
  if (!raw?.date || !raw?.title)
    throw new Error("APOD: entry without date/title");
  return {
    date: raw.date,
    title: stripHtml(raw.title),
    page: raw.permalink ?? raw.url,
    mediaType: raw.media_type,
    credit: stripHtml(raw.copyright || raw.credit) || "NASA",
    copyrighted: Boolean(stripHtml(raw.copyright)),
    alt: stripHtml(raw.alt),
  };
}

// ---------- Mars Trek WMTS (equirectangular, default028mm) ----------

/** Level z has 2^(z+1) columns × 2^z rows; row 0 starts at 90°N, col 0 at 180°W. */
export function trekTile({ lat, lon, zoom }) {
  const cols = 2 ** (zoom + 1);
  const rows = 2 ** zoom;
  const clamp = (v, n) => Math.min(n - 1, Math.max(0, v));
  return {
    zoom,
    row: clamp(Math.floor(((90 - lat) / 180) * rows), rows),
    col: clamp(Math.floor(((lon + 180) / 360) * cols), cols),
  };
}
