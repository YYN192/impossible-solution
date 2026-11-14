import { describe, expect, it } from "vitest";
import { dataClient, publicUrl } from "./client";

describe("dataClient (saved NASA/CSA data)", () => {
  it("radiation storm: real Curiosity readings, labelled as saved data with a date", async () => {
    const r = await dataClient.getRadiationStorm();
    expect(r).not.toBeNull();
    expect(r!.source).toBe("snapshot");
    expect(r!.fetchedAt).toBeGreaterThan(Date.parse("2026-11-01"));
    expect(r!.data.unit).toBe("µGy/h");
    expect(r!.data.peak.rate).toBeGreaterThan(r!.data.normalRate);
    expect(r!.attribution).toMatch(/RadLab/);
  });

  it("science cards can be filtered by topic", async () => {
    const all = await dataClient.getScienceCards();
    const food = await dataClient.getScienceCards("food");
    expect(food!.data.length).toBeGreaterThan(0);
    expect(food!.data.every((c) => c.topic === "food")).toBe(true);
    expect(all!.data.length).toBeGreaterThan(food!.data.length);
  });

  it("pictures and map tiles point at local copies (they work offline)", async () => {
    const imgs = await dataClient.getMissionImages();
    const site = await dataClient.getMarsSite();
    for (const i of imgs!.data) expect(i.image).toMatch(/^data\/img\//);
    expect(site!.data.tiles).toHaveLength(4);
    expect(publicUrl("data/trek/x.jpg")).toBe(
      `${import.meta.env.BASE_URL}data/trek/x.jpg`,
    );
  });

  it("returns null (never throws) for a dataset that has not been downloaded yet", async () => {
    await expect(
      dataClient.load("does-not-exist" as never),
    ).resolves.toBeNull();
  });

  it("APOD entries are links with a credit, never a copied picture", async () => {
    const a = await dataClient.getApod();
    expect(a!.data.page).toMatch(/^https:\/\//);
    expect(a!.data.credit.length).toBeGreaterThan(0);
    expect(a!.data).not.toHaveProperty("image");
  });

  it("CSA resources are links only, credited to the Canadian Space Agency", async () => {
    const c = await dataClient.getLearningResources();
    expect(c!.attribution).toMatch(/Canadian Space Agency/);
    for (const r of c!.data)
      expect(r.url).toMatch(/^https:\/\/www\.asc-csa\.gc\.ca\//);
  });
});
