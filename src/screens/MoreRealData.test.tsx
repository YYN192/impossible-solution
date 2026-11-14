import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
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
