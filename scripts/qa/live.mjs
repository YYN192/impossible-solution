// Live checks in headless Chrome: (1) the radio beat shows today's Deep Space Network delay from /api/dsn/mars,
// (2) the storm alarm on the demo path, with and without reduced motion (screenshot of the first).
//   node scripts/qa/live.mjs [--base=https://impossible-solution.vercel.app/]
import { chromium } from "playwright-core";
import { readFileSync } from "node:fs";

const EN = JSON.parse(readFileSync(new URL("../../src/i18n/en.json", import.meta.url), "utf8"));
const base = (process.argv.find((a) => a.startsWith("--base=")) ?? "--base=https://impossible-solution.vercel.app/").slice(7);
const out = [];
let browser;

async function open(context, query) {
  const page = await context.newPage();
  await page.goto(base + query);
  await page.waitForFunction((n) => [...document.querySelectorAll("button")].some((b) => b.textContent.includes(n) && !b.disabled), EN.title.start, { timeout: 15000 });
  await page.getByRole("button", { name: new RegExp(EN.title.start) }).click();
  await page.getByRole("button", { name: new RegExp("^" + EN.world.goConsole) }).first().click();
  return page;
}
/** Advance one screen; returns what it saw. Stops (returns the name) at `stopAt`. */
async function advance(page, stopAt) {
  for (let i = 0; i < 60; i++) {
    await page.waitForTimeout(150);
    for (const [name, sel] of [["final", ".stars"], ["alarm", ".storm-alarm"], ["beat", ".beat-options"]])
      if (name === stopAt && (await page.locator(sel).count())) return name === "beat" ? await page.locator(sel).getAttribute("data-type") : name;
    // Hands-on beats (#59): switch to the plain cards, which this script knows how to play.
    if ((await page.locator(".hands-on-switch").count()) && !(await page.locator(".beat-options").count())) { await page.locator(".hands-on-switch").click(); continue; }
    if (await page.locator(".beat-options").count()) {
      const type = await page.locator(".beat-options").getAttribute("data-type");
      if (stopAt === type) return type;
      await page.locator(".beat-options button:not(:disabled)").last().click();
      await page.locator(".beat-result .primary").click();
    } else if (await page.locator(".end-sol").count()) {
      await page.locator(".end-sol").click();
      if (await page.locator(".end-sol").count()) await page.locator(".end-sol").click();
    } else if (await page.locator(".screen .actions .primary").count()) await page.locator(".screen .actions .primary").first().click();
  }
  return "timeout";
}

try {
  browser = await chromium.launch({ channel: "chrome", headless: true }); // never headed
  // 0. What does "Today's real Sun" do right now?
  let ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  {
    const page = await ctx.newPage();
    await page.goto(base);
    const sun = page.getByRole("button", { name: EN.menu.sunToday });
    await sun.waitFor({ timeout: 15000 });
    await sun.click();
    await page.waitForTimeout(6000);
    const note = await page.locator(".availability-note").innerText().catch(() => "(no notice)");
    const pressed = await page.$$eval(".mission-picker button", (els) => els.map((e) => `${e.textContent.slice(0, 18)}=${e.getAttribute("aria-pressed")}`).join(" | "));
    const badge = await page.locator(".data-badge").first().innerText().catch(() => "");
    out.push(`sun today: notice="${note}"; badge="${badge.replace(/\s+/g, " ")}"; buttons: ${pressed}`);
  }
  await ctx.close();
  // 1. Live light delay, on a phone and a laptop.
  for (const [w, h] of [[390, 844], [1366, 768]]) {
  ctx = await browser.newContext({ viewport: { width: w, height: h } });
  const api = [];
  ctx.on("response", (r) => r.url().includes("/api/dsn/mars") && api.push(r.status()));
  const page = await open(ctx, "?teacher=1&campaign=dust&seed=7");
  const got = await advance(page, "radio");
  const delay = got === "radio" ? await page.locator(".beat-delay").textContent() : "(radio beat not reached: " + got + ")";
  const chip = page.locator(".chip", { hasText: "Deep Space Network" }).first();
  if (got === "radio") await page.screenshot({ path: `docs/qa/radio-live-${w}.png` });
  out.push(`dsn@${w}: /api/dsn/mars responses ${JSON.stringify(api)}; beat says "${delay}"; chip mode=${await chip.getAttribute("data-mode").catch(() => "none")}; chip="${(await chip.textContent().catch(() => "")).slice(0, 150)}"`);
  await ctx.close();
  }
  // 2. Storm alarm on the demo path.
  for (const [reducedMotion, w, h] of [["no-preference", 390, 844], ["no-preference", 1366, 768], ["reduce", 390, 844]]) {
    ctx = await browser.newContext({ viewport: { width: w, height: h }, reducedMotion });
    const page = await open(ctx, "?demo=1");
    const saw = await advance(page, "alarm");
    const anim = saw === "alarm" ? await page.locator(".storm-alarm").evaluate((el) => getComputedStyle(el).animationName) : "(no alarm: " + saw + ")";
    const text = saw === "alarm" ? (await page.locator(".storm-alarm").innerText()).replace(/\s+/g, " ").slice(0, 420) : "";
    out.push(`alarm@${w} (${reducedMotion}): animation=${anim}; text="${text.slice(0, 200)}"`);
    if (saw === "alarm" && reducedMotion === "no-preference") { await page.waitForTimeout(2200); await page.screenshot({ path: `docs/qa/storm-alarm-${w}.png` }); }
    await ctx.close();
  }
} finally {
  await browser?.close();
}
console.log(out.join("\n"));
