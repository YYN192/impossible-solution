import { render, screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import "../i18n";
import { MoreRealData } from "./MoreRealData";

const ready = () =>
  screen.findByRole("region", { name: /storm, measured on mars/i });

describe("MoreRealData (RadLab, Mars Trek, Image Library, OSDR, DONKI, APOD, CSA)", () => {
  it("shows the real Curiosity storm curve with its peak and normal level", async () => {
    render(<MoreRealData />);
    const storm = await ready();
    expect(
      within(storm).getByRole("img", { name: /radiation.*20 may 2024/i }),
    ).toBeTruthy();
    expect(storm.textContent).toMatch(/times/);
    expect(storm.textContent).toMatch(/RadLab/);
  });

  it("every picture is a local copy with its credit next to it", async () => {
    render(<MoreRealData />);
    await ready();
    const imgs = screen
      .getAllByRole("img")
      .filter((el) => el.tagName === "IMG");
    expect(imgs.length).toBeGreaterThanOrEqual(3);
    for (const img of imgs) {
      expect(img.getAttribute("src")).toMatch(/\/data\/(img|trek)\//);
      expect(img.getAttribute("alt")!.length).toBeGreaterThan(3);
      expect(
        img.closest("figure")?.querySelector("figcaption")?.textContent,
      ).toMatch(/NASA|Mars Trek/);
    }
  });

  it("shows where the base is on a Mars Trek map", async () => {
    render(<MoreRealData />);
    const site = await screen.findByRole("region", {
      name: /where is our base/i,
    });
    expect(site.textContent).toMatch(/Gale Crater/);
    expect(
      within(site)
        .getByRole("link", { name: /mars trek/i })
        .getAttribute("href"),
    ).toMatch(/^https:\/\/trek\.nasa\.gov/);
  });

  it("lists real space-plant studies from OSDR with links", async () => {
    render(<MoreRealData />);
    const plants = await screen.findByRole("region", {
      name: /plants grown in space/i,
    });
    const links = within(plants).getAllByRole("link");
    expect(links.length).toBeGreaterThan(0);
    for (const a of links)
      expect(a.getAttribute("href")).toMatch(/^https:\/\/osdr\.nasa\.gov\//);
  });

  it("has a teachers-and-families list with the CSA resources and the non-endorsement line", async () => {
    render(<MoreRealData />);
    const more = await screen.findByRole("region", {
      name: /teachers and families/i,
    });
    expect(
      within(more)
        .getAllByRole("link")
        .some((a) =>
          a.getAttribute("href")!.startsWith("https://www.asc-csa.gc.ca/"),
        ),
    ).toBe(true);
    expect(
      screen.getByText(
        /not affiliated with or endorsed by NASA or the Canadian Space Agency/i,
      ),
    ).toBeTruthy();
  });

  it("never adds a second LIVE/SAVED badge (the Data Sources screen has one)", async () => {
    render(<MoreRealData />);
    await ready();
    expect(screen.queryAllByRole("status")).toHaveLength(0);
  });
});

describe("MoreRealData live refresh (DONKI + APOD, saved data first)", () => {
  const server = setupServer();
  beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
  afterEach(() => {
    server.resetHandlers();
    localStorage.clear();
  });
  afterAll(() => server.close());

  const sun = (flares: unknown[]) => [
    http.get("https://api.nasa.gov/DONKI/FLR", () => HttpResponse.json(flares)),
    http.get("https://api.nasa.gov/DONKI/SEP", () => HttpResponse.json([])),
    http.get("https://api.nasa.gov/DONKI/CME", () => HttpResponse.json([])),
    http.get("https://api.nasa.gov/DONKI/GST", () => HttpResponse.json([])),
    http.get("https://api.nasa.gov/DONKI/notifications", () => HttpResponse.json([])),
    http.get("https://science.nasa.gov/wp-json/wp/v2/apod-basic", () =>
      HttpResponse.json([{ date: "2026-11-14", title: "Live picture", permalink: "https://science.nasa.gov/x", media_type: "image", credit: "Jo", copyright: "Jo", alt: "" }]),
    ),
  ];

  it("shows the Sun card from live DONKI with a LIVE label", async () => {
    server.use(...sun([{ classType: "M2.0", peakTime: "2026-11-10T00:00Z" }, { classType: "C1.0", peakTime: "2026-11-11T00:00Z" }]));
    render(<MoreRealData live />);
    const card = await screen.findByRole("region", { name: /what the sun did/i });
    await within(card).findByText(/LIVE/);
    expect(card.textContent).toMatch(/Solar flares: 2 \(big ones: 1\)/);
    expect(card.textContent).not.toMatch(/\b1 \w+s\b/); // no "1 storms"
  });

  it("APOD comes from the live site when it answers", async () => {
    server.use(...sun([]));
    render(<MoreRealData live />);
    const card = await screen.findByRole("region", { name: /space picture of the day/i });
    await within(card).findByText(/Live picture/);
    expect(within(card).getByText(/LIVE/)).toBeTruthy();
  });

  it("when NASA is down, sections keep the saved data and say SAVED", async () => {
    server.use(http.get("https://api.nasa.gov/DONKI/*", () => HttpResponse.error()), http.get("https://science.nasa.gov/*", () => HttpResponse.error()));
    render(<MoreRealData live />);
    const card = await screen.findByRole("region", { name: /space picture of the day/i });
    await waitFor(() => expect(card.textContent).toMatch(/SAVED/), { timeout: 4000 });
  });
});

describe("MoreRealData Sun card with the flare list missing", () => {
  const server = setupServer();
  beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
  afterEach(() => {
    server.resetHandlers();
    localStorage.clear();
  });
  afterAll(() => server.close());

  it("does not claim 0 flares; says the flare list was not available", async () => {
    server.use(
      http.get("https://api.nasa.gov/DONKI/FLR", () => new HttpResponse(null, { status: 404 })),
      http.get("https://api.nasa.gov/DONKI/CME", () => HttpResponse.json([{ activityID: "C1", startTime: "2026-11-01T00:00Z" }])),
      http.get("https://api.nasa.gov/DONKI/*", () => HttpResponse.json([])),
      http.get("https://science.nasa.gov/*", () => HttpResponse.error()),
    );
    render(<MoreRealData live />);
    const card = await screen.findByRole("region", { name: /what the sun did/i });
    await within(card).findByText(/LIVE/);
    expect(card.textContent).not.toMatch(/Solar flares:/);
    expect(card.textContent).toMatch(/Storm clouds \(CMEs\): 1/);
    expect(card.textContent).toMatch(/flare list was not available/i);
  });
});
