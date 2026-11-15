// Plays every campaign start to finish in headless Chrome (touch phone + laptop) and reports:
// beat types met, horizontal overflow, console errors, foreign requests, reload on the plan screen.
//   node scripts/qa/campaigns.mjs [--base=http://localhost:5190/impossible-solution/] [--shots]
import { chromium } from "playwright-core";
import { readFileSync } from "node:fs";

const EN = JSON.parse(readFileSync(new URL("../../src/i18n/en.json", import.meta.url), "utf8"));
const base = (process.argv.find((a) => a.startsWith("--base=")) ?? "--base=http://localhost:5190/impossible-solution/").slice(7);
const shots = process.argv.includes("--shots");
const VIEWS = [
  { name: "390", viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true },
  { name: "1366", viewport: { width: 1366, height: 768 } },
];
const RUNS = [["classic", 3], ["storm", 3], ["storm", 7], ["dust", 7], ["dust", 12], ["moon", 3], ["moon", 8]];
const findings = [];
const types = new Set();
const shot = new Set();
let browser;
try {
  browser = await chromium.launch({ channel: "chrome", headless: true }); // never headed
  for (const view of VIEWS) {
    for (const [campaign, seed] of RUNS) {
      const tag = `${campaign}#${seed}@${view.name}`;
      const context = await browser.newContext(view);
      const page = await context.newPage();
      page.on("console", (m) => m.type() === "error" && findings.push(`${tag}: console error: ${m.text().slice(0, 140)}`));
      page.on("pageerror", (e) => findings.push(`${tag}: page error: ${String(e).slice(0, 140)}`));
      page.on("request", (r) => {
        const u = new URL(r.url());
        if (u.origin !== new URL(base).origin || u.pathname.includes("/api/")) findings.push(`${tag}: network request with ?offline=1: ${u.origin}${u.pathname}`);
      });
      const click = (loc) => (view.hasTouch ? loc.tap() : loc.click());
      const overflow = async (where) => {
        const wide = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        if (wide > 1) findings.push(`${tag}: horizontal overflow ${wide}px on ${where}`);
      };
      await page.goto(`${base}?teacher=1&offline=1&campaign=${campaign}&seed=${seed}`);
      await overflow("menu");
      if (shots && campaign === "storm" && seed === 3) await page.screenshot({ path: `docs/qa/campaign-menu-${view.name}.png`, fullPage: true });
      const start = page.getByRole("button", { name: new RegExp(EN.title.start) });
      await start.waitFor({ timeout: 8000 });
      await page.waitForFunction((n) => [...document.querySelectorAll("button")].some((b) => b.textContent.includes(n) && !b.disabled), EN.title.start);
      await click(start);
      await click(page.getByRole("button", { name: new RegExp("^" + EN.world.goConsole) }).first());
      let reloaded = false;
      let done = false;
      for (let i = 0; i < 110 && !done; i++) {
        await page.waitForTimeout(120);
        if (await page.locator(".stars").count()) { done = true; break; }
        if (await page.locator(".dust-alarm").count()) {
          // A dust storm calls the crew back to the base: wipe the panels (airlock), fix the greenhouse, back to the console.
          types.add("dust storm");
          await overflow("dust storm");
          await click(page.locator(".dust-alarm .primary"));
          const box = await page.locator("canvas").boundingBox();
          const tapAt = (x, y) => (view.hasTouch ? page.touchscreen.tap : page.mouse.click).call(view.hasTouch ? page.touchscreen : page.mouse, box.x + box.width * x / 640, box.y + box.height * y / 384);
          await page.waitForTimeout(400);
          await tapAt(320, 350);
          if (!(await page.locator(".storm-panels").waitFor({ timeout: 5000 }).then(() => true, () => false))) await click(page.locator(".interaction-guide .primary"));
          await page.locator(".storm-panels").waitFor({ timeout: 4000 });
          for (const b of await page.locator(".storm-panels button").all()) await click(b);
          await click(page.locator(".storm-dialog .primary"));
          await page.waitForTimeout(400); // the closing dialog keeps the canvas inert for a moment
          await tapAt(208, 300);
          // Tap-to-walk normally opens it on arrival; otherwise press Interact, like a kid would.
          if (!(await page.locator(".storm-steps").waitFor({ timeout: 5000 }).then(() => true, () => false))) await click(page.locator(".interaction-guide .primary"));
          await page.locator(".storm-steps").waitFor({ timeout: 4000 });
          for (let s = 0; s < 3; s++) await click(page.locator(".storm-steps button:not(:disabled)").first());
          await click(page.locator(".storm-dialog .primary"));
          await click(page.getByRole("button", { name: new RegExp("^" + EN.world.goConsole) }).first());
          continue;
        }
        if (await page.locator(".explore-map").count()) {
          types.add("explore");
          await overflow("beat explore");
          // Drive two squares out and back with the keys (laptop) or the on-screen buttons (phone).
          for (const dir of ["right", "down", "up", "left", "left", "right"]) {
            if (view.hasTouch) await click(page.locator(`.explore-pad [data-dir="${dir}"]`));
            else { await page.locator(".explore-map").focus(); await page.keyboard.press({ right: "ArrowRight", left: "ArrowLeft", up: "ArrowUp", down: "ArrowDown" }[dir]); }
          }
          if (shots && !shot.has("explore" + view.name)) { shot.add("explore" + view.name); await page.screenshot({ path: `docs/qa/beat-explore-${view.name}.png`, fullPage: true }); }
          if (seed % 2) { await click(page.locator(".explore-switch")); continue; } // odd seeds: let Pip drive (plain choices)
          await click(page.locator(".explore .primary"));
          await click(page.locator(".beat-result .primary"));
          continue;
        }
        if (await page.locator(".beat-options").count()) {
          const type = await page.locator(".beat-options").getAttribute("data-type");
          types.add(type);
          await overflow(`beat ${type}`);
          if (shots && view.name === "390" && !shot.has(type)) { shot.add(type); await page.screenshot({ path: `docs/qa/beat-${type}-390.png`, fullPage: true }); }
          const open = page.locator(".beat-options button.beat-option:not(:disabled)");
          if (!(await open.count())) { findings.push(`${tag}: beat ${type} has no option the base can pay for`); break; }
          await click(open.nth((i + seed) % (await open.count())));
          await click(page.locator(".beat-result .primary"));
          continue;
        }
        if (await page.locator(".end-sol").count()) {
          await overflow("plan");
          const crew = page.locator(".crew-tile > button:not(:disabled):not(.unassign)");
          const n = await crew.count();
          for (let c = 0; c < n; c++) {
            await click(page.locator(".crew-tile > button:not(:disabled):not(.unassign)").nth(c));
            await click(page.locator(".job-choice").nth((c + i) % 5));
          }
          if (!reloaded && i > 6) {
            reloaded = true;
            const before = await page.locator("h1").first().textContent();
            await page.reload();
            await page.waitForTimeout(400);
            const after = await page.locator("h1").first().textContent().catch(() => "(none)");
            if (before !== after) findings.push(`${tag}: reload on the plan screen lost the mission ("${before}" → "${after}")`);
            continue;
          }
          await click(page.locator(".end-sol"));
          if (await page.locator(".end-sol").count()) await click(page.locator(".end-sol"));
          continue;
        }
        const primary = page.locator(".screen .actions .primary").first();
        if (await primary.count()) { await overflow("report"); await click(primary); }
      }
      if (!done) findings.push(`${tag}: never reached the final screen`);
      else {
        await overflow("final");
        if (!(await page.getByText(new RegExp(String(seed))).count())) findings.push(`${tag}: run number ${seed} not shown on the final screen`);
        if (shots && campaign === "dust" && seed === 7) await page.waitForTimeout(2500); // let the dominoes fall
        if (shots && campaign === "dust" && seed === 7) await page.screenshot({ path: `docs/qa/campaign-final-${view.name}.png`, fullPage: true });
      }
      await context.close();
    }
  }
} finally {
  await browser?.close();
}
for (const f of findings) console.log(f);
console.log(`beat types met: ${[...types].sort().join(", ")} (${types.size})`);
if (types.size < 8) findings.push("fewer than 8 beat types met");
console.log(findings.length ? `FAIL campaigns (${findings.length} findings)` : "PASS campaigns");
process.exit(findings.length ? 1 : 0);
