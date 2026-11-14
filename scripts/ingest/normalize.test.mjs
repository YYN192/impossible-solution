// Tests for the pure parts of the ingestion pipeline: raw NASA/CSA responses → our trimmed shapes.
// Written before normalize.mjs (TDD). Fixtures are cut-down copies of real responses (14 Nov 2026).
import { describe, expect, it } from "vitest";
import {
  apodEntry,
  imageItem,
  osdrCard,
  radlabStorm,
  stripHtml,
  summarizeSpaceWeather,
  trekTile,
} from "./normalize.mjs";

describe("summarizeSpaceWeather (DONKI FLR/SEP/CME/GST/notifications)", () => {
  const raw = {
    flr: [
      {
        flrID: "F1",
        classType: "M1.2",
        peakTime: "2026-11-02T10:00Z",
        link: "https://x/F1",
      },
      {
        flrID: "F2",
        classType: "X2.0",
        peakTime: "2026-11-05T08:00Z",
        link: "https://x/F2",
      },
      {
        flrID: "F3",
        classType: "C9.9",
        peakTime: "2026-11-06T08:00Z",
        link: "https://x/F3",
      },
    ],
    sep: [
      { sepID: "S1", eventTime: "2026-11-05T12:00Z", link: "https://x/S1" },
    ],
    cme: [
      {
        activityID: "C1",
        startTime: "2026-11-01T00:00Z",
        link: "https://x/C1",
        cmeAnalyses: [{ isMostAccurate: true, speed: 500 }],
      },
      {
        activityID: "C2",
        startTime: "2026-11-07T00:00Z",
        link: "https://x/C2",
        cmeAnalyses: null,
      },
    ],
    gst: [
      {
        gstID: "G1",
        startTime: "2026-11-08T00:00Z",
        allKpIndex: [{ kpIndex: 5 }, { kpIndex: 7.33 }],
        link: "https://x/G1",
      },
    ],
    notifications: [
      {
        messageType: "Report",
        messageIssueTime: "2026-11-09T00:00Z",
        messageURL: "https://x/N1",
        messageBody: "long…",
      },
      {
        messageType: "FLR",
        messageIssueTime: "2026-11-10T00:00Z",
        messageURL: "https://x/N2",
        messageBody: "long…",
      },
    ],
  };
  const s = summarizeSpaceWeather(raw, {
    start: "2026-10-15",
    end: "2026-11-14",
  });

  it("counts each event type", () => {
    expect(s.counts).toEqual({
      flares: 3,
      bigFlares: 2,
      particleEvents: 1,
      cmes: 2,
      geomagneticStorms: 1,
    });
  });
  it("picks the strongest flare by class (X beats M beats C)", () => {
    expect(s.strongestFlare).toMatchObject({
      classType: "X2.0",
      link: "https://x/F2",
    });
  });
  it("picks the newest CME and its best speed (null when unknown)", () => {
    expect(s.latestCme).toEqual({
      id: "C2",
      startTime: "2026-11-07T00:00Z",
      speedKmS: null,
      link: "https://x/C2",
    });
  });
  it("keeps the strongest Kp of a geomagnetic storm", () => {
    expect(s.strongestStormKp).toBe(7.33);
  });
  it("keeps only short notification headers, newest first, without message bodies", () => {
    expect(s.notifications[0]).toEqual({
      type: "FLR",
      issueTime: "2026-11-10T00:00Z",
      url: "https://x/N2",
    });
    expect(JSON.stringify(s)).not.toContain("messageBody");
  });
  it('survives empty / null answers (DONKI returns "" or null when nothing happened)', () => {
    const q = summarizeSpaceWeather(
      { flr: "", sep: null, cme: [], gst: undefined, notifications: [] },
      { start: "a", end: "b" },
    );
    expect(q.counts.flares).toBe(0);
    expect(q.strongestFlare).toBeNull();
    expect(q.latestCme).toBeNull();
  });
});

describe("radlabStorm (RadLab MSL-RAD-Surface rows)", () => {
  // [timestamp, instrument_id, absorbed_dose_rate µGy/h]
  const rows = [
    ["2024-05-19T00:00:00", "MSL-RAD-Surface", 4],
    ["2024-05-19T12:00:00", "MSL-RAD-Surface", 5],
    ["2024-05-19T23:00:00", "MSL-RAD-Surface", 4.5],
    ["2024-05-20T06:00:00", "MSL-RAD-Surface", 60],
    ["2024-05-20T12:00:00", "MSL-RAD-Surface", 92],
    ["2024-05-20T18:00:00", "MSL-RAD-Surface", 40],
    ["2024-05-21T06:00:00", "MSL-RAD-Surface", null],
    ["2024-05-22T06:00:00", "MSL-RAD-Surface", 5],
  ];
  const s = radlabStorm(rows, { stormStart: "2024-05-20T05:00:00" });

  it('uses the median before the storm as "normal"', () => {
    expect(s.normalRate).toBe(4.5);
  });
  it("finds the peak and how many times normal it is", () => {
    expect(s.peak).toEqual({ time: "2024-05-20T12:00:00", rate: 92 });
    expect(s.peakTimesNormal).toBeCloseTo(92 / 4.5, 5);
  });
  it("integrates the extra dose above normal (trapezoid, µGy)", () => {
    // segments after storm start, rate − normal, clipped at 0; nulls skipped
    expect(s.extraDoseMicroGy).toBeGreaterThan(0);
    expect(s.extraDoseMicroGy).toBeLessThan(92 * 48);
  });
  it("drops nulls from the series and keeps it in time order", () => {
    expect(s.series.every((p) => typeof p.rate === "number")).toBe(true);
    expect(s.series.map((p) => p.time)).toEqual(
      [...s.series.map((p) => p.time)].sort(),
    );
  });
  it("refuses data with no reading before the storm", () => {
    expect(() =>
      radlabStorm(rows.slice(3), { stormStart: "2024-05-20T05:00:00" }),
    ).toThrow(/before/);
  });
});

describe("osdrCard (OSDR study metadata)", () => {
  const meta = {
    hits: 1,
    study: {
      "OSD-267": {
        studies: [
          {
            identifier: "OSD-267",
            title:
              "Microbiological and nutritional analysis of lettuce crops grown on the International Space Station-VEG01A",
            description:
              "The ability to grow safe, fresh food… " + "x".repeat(800),
            publicReleaseDate: "21-Feb-2020",
            materials: {
              sources: [{ name: "VEG-01A Lactuca sativa cv. Outredgeous" }],
            },
          },
        ],
      },
    },
  };
  it("makes a short card with a link to the OSDR study page", () => {
    const c = osdrCard(meta, "OSD-267", { topic: "food" });
    expect(c).toMatchObject({
      id: "OSD-267",
      topic: "food",
      url: "https://osdr.nasa.gov/bio/repo/data/studies/OSD-267",
      released: "21-Feb-2020",
    });
    expect(c.title).toMatch(/lettuce/);
    expect(c.description.length).toBeLessThanOrEqual(301);
  });
  it("throws when the study is missing (never writes an empty card)", () => {
    expect(() =>
      osdrCard({ hits: 0, study: {} }, "OSD-1", { topic: "food" }),
    ).toThrow();
  });
});

describe("imageItem (NASA Image and Video Library)", () => {
  const item = {
    data: [
      {
        nasa_id: "PIA25287",
        title: "InSight's Final Selfie",
        center: "JPL",
        date_created: "2022-05-23T00:00:00Z",
        description_508: "Dusty lander.",
        description: "Long text",
        secondary_creator: "NASA/JPL-Caltech",
        media_type: "image",
      },
    ],
    links: [
      {
        href: "https://images-assets.nasa.gov/image/PIA25287/PIA25287~medium.jpg",
        render: "image",
        width: 1280,
      },
      {
        href: "https://images-assets.nasa.gov/image/PIA25287/PIA25287~small.jpg",
        render: "image",
        width: 640,
      },
      {
        href: "https://images-assets.nasa.gov/image/PIA25287/PIA25287~thumb.jpg",
        render: "image",
        width: 100,
      },
    ],
  };
  it("keeps the credit, the details page and the small image", () => {
    expect(imageItem(item)).toEqual({
      nasaId: "PIA25287",
      title: "InSight's Final Selfie",
      description: "Dusty lander.",
      date: "2022-05-23",
      credit: "NASA/JPL-Caltech",
      page: "https://images.nasa.gov/details/PIA25287",
      remoteImage:
        "https://images-assets.nasa.gov/image/PIA25287/PIA25287~small.jpg",
    });
  });
  it('falls back to "NASA/<center>" when there is no creator', () => {
    const i = structuredClone(item);
    delete i.data[0].secondary_creator;
    expect(imageItem(i).credit).toBe("NASA/JPL");
  });
});

describe("apodEntry (new APOD at science.nasa.gov)", () => {
  const raw = {
    date: "2026-11-13",
    title: "NGC 206",
    permalink: "https://science.nasa.gov/image-article/apod-x",
    media_type: "image",
    credit: '<a href="https://example.com">David Cruz</a>',
    copyright: '<a href="https://example.com">David Cruz</a>',
    alt: "Close up of NGC 206.",
    hdurl: "https://assets.science.nasa.gov/x.jpg",
  };
  it("strips HTML from the credit and never embeds a copyrighted image", () => {
    expect(apodEntry(raw)).toEqual({
      date: "2026-11-13",
      title: "NGC 206",
      page: "https://science.nasa.gov/image-article/apod-x",
      mediaType: "image",
      credit: "David Cruz",
      copyrighted: true,
      alt: "Close up of NGC 206.",
    });
  });
  it("stripHtml decodes simple entities", () => {
    expect(stripHtml("A &amp; <b>B</b>&nbsp;C")).toBe("A & B C");
  });
});

describe("trekTile (Mars Trek WMTS, equirectangular)", () => {
  it("finds the tile that holds Gale Crater", () => {
    // zoom 6: 128 × 64 tiles of 2.8125°
    expect(trekTile({ lat: -5.4, lon: 137.8, zoom: 6 })).toEqual({
      zoom: 6,
      row: 33,
      col: 112,
    });
  });
  it("handles the edges of the map", () => {
    expect(trekTile({ lat: 90, lon: -180, zoom: 0 })).toEqual({
      zoom: 0,
      row: 0,
      col: 0,
    });
    expect(trekTile({ lat: -90, lon: 180, zoom: 0 })).toEqual({
      zoom: 0,
      row: 0,
      col: 1,
    });
  });
});

describe('summarizeSpaceWeather with a part missing (e.g. DONKI FLR answering 404)', () => {
  const s = summarizeSpaceWeather(
    { flr: undefined, sep: [], cme: [{ activityID: 'C1', startTime: '2026-11-01T00:00Z' }], gst: [], notifications: [] },
    { start: 'a', end: 'b' },
    { missing: ['flr'] },
  )
  it('says "unknown" (null) instead of claiming 0 flares', () => {
    expect(s.counts.flares).toBeNull()
    expect(s.counts.bigFlares).toBeNull()
    expect(s.strongestFlare).toBeNull()
    expect(s.missing).toEqual(['flr'])
  })
  it('still counts the parts that answered', () => {
    expect(s.counts.cmes).toBe(1)
  })
  it('lists nothing as missing when every part answered', () => {
    expect(summarizeSpaceWeather({ flr: [], sep: [], cme: [], gst: [], notifications: [] }, { start: 'a', end: 'b' }).missing).toEqual([])
  })
})
