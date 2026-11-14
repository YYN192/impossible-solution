// Every step of the player flow lives HERE. When the game flow changes, edit this file only.
// mode: "mouse" (click), "touch" (tap), "kbd" (Tab/Shift+Tab/Enter/Space/arrows/E only).
import { readFileSync } from "node:fs";

export const EN = JSON.parse(readFileSync(new URL("../../src/i18n/en.json", import.meta.url), "utf8"));
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
export const fmt = (s, v = {}) => s.replace(/\{\{(\w+)\}\}/g, (_, k) => v[k]);
/** Role+name locators. exact for plain names, prefix for names with an arrow/key hint. */
export const button = (page, name, { prefix = false } = {}) =>
  page.getByRole("button", prefix ? { name: new RegExp("^" + esc(name)) } : { name, exact: true }).first();
export const heading = (page, text) => page.getByRole("heading", { name: new RegExp("^" + esc(text)) }).first();
const wait = { timeout: 8000 };

/** Hook: the keyboard check sets page.__onTab to audit every Tab stop. */
export async function tabTo(page, loc, max = 150) {
  const handle = await loc.elementHandle(wait);
  for (let i = 0; i < max; i++) {
    if (await page.evaluate((el) => document.activeElement === el, handle)) return;
    await page.keyboard.press("Tab");
    await page.__onTab?.();
  }
  throw new Error(`keyboard cannot reach ${await handle.evaluate((e) => e.tagName + " " + (e.getAttribute("aria-label") || e.textContent || "").trim().slice(0, 30))}`);
}
/** One activation of a button in the given input mode. */
export async function press(page, loc, mode) {
  await loc.waitFor({ state: "visible", ...wait });
  if (mode === "touch") return loc.tap(wait);
  if (mode === "kbd") { await tabTo(page, loc); return page.keyboard.press("Enter"); }
  return loc.click(wait);
}
const btn = (page, name, mode, opts) => press(page, button(page, name, opts), mode);

export async function openMenu(page, flags = "demo=1", base = page.__base) {
  await page.goto(base + (flags ? "?" + flags : ""));
  await button(page, EN.title.start).waitFor({ state: "visible", ...wait });
  await page.waitForFunction((n) => [...document.querySelectorAll("button")].some((b) => b.textContent.includes(n) && !b.disabled), EN.title.start, wait);
}
export const startMission = (page, mode = "mouse") => btn(page, EN.title.start, mode).then(() => page.locator("canvas").waitFor(wait));
export const skipToConsole = (page, mode = "mouse") => btn(page, EN.world.goConsole, mode, { prefix: true }).then(() => button(page, EN.morning.goPlan).waitFor(wait));
export const toPlan = (page, mode = "mouse") => btn(page, EN.morning.goPlan, mode).then(() => heading(page, fmt(EN.plan.heading, { sol: "" }).trim()).waitFor(wait));
/** Give every awake astronaut the first free, affordable job. */
export async function assignAll(page, mode = "mouse") {
  for (let n = 1; n <= 3; n++) {
    const crew = button(page, fmt(EN.crew.name, { n }));
    if (!(await crew.isEnabled())) continue;
    await press(page, crew, mode);
    for (const id of Object.keys(EN.jobs)) {
      const job = button(page, EN.jobs[id]);
      if ((await job.isEnabled()) && (await job.getAttribute("aria-pressed")) !== "true") { await press(page, job, mode); break; }
    }
  }
}
/** End the sol (confirming idle crew if asked) and wait for the night screen or the final screen. */
export async function endSol(page, mode = "mouse") {
  await btn(page, EN.plan.endSol, mode, { prefix: true });
  const confirm = button(page, EN.play.confirmEnd, { prefix: true });
  if (await confirm.isVisible().catch(() => false)) await press(page, confirm, mode);
  await page.getByRole("heading", { name: /^(Night falls|Mission over)/ }).first().waitFor(wait);
}
/** From the night screen: next morning, or the final screen. */
export const nextFromNight = async (page, mode = "mouse") => {
  await press(page, page.getByRole("button", { name: new RegExp(`^(${esc(EN.endSol.nextMorning)}|${esc(EN.endSol.seeResults)})`) }).first(), mode);
};
export const atFinal = (page) => heading(page, EN.final.heading).isVisible().catch(() => false);
/** From the console morning screen to the final screen. */
export async function playToFinal(page, mode = "mouse") {
  for (let i = 0; i < 12 && !(await atFinal(page)); i++) {
    await page.waitForTimeout(150);
    if (await button(page, EN.morning.goPlan).isVisible()) { await toPlan(page, mode); await assignAll(page, mode); await endSol(page, mode); }
    else if (await page.getByRole("button", { name: new RegExp(`^(${esc(EN.endSol.nextMorning)}|${esc(EN.endSol.seeResults)})`) }).first().isVisible()) await nextFromNight(page, mode);
  }
  await heading(page, EN.final.heading).waitFor(wait);
}
export const openSources = (page, mode = "mouse") => btn(page, EN.dataSources.open, mode).then(() => heading(page, EN.dataSources.title).waitFor(wait));
export const openTeacher = (page, mode = "mouse") => btn(page, EN.teacher.open, mode).then(() => heading(page, EN.teacher.title).waitFor(wait));
export const closeOverlay = (page, mode = "mouse") => btn(page, EN.teacher.back, mode);
export const restart = (page, mode = "mouse") => btn(page, EN.final.tryAgain, mode);

/** Talk to the commander. mouse/touch: tap him on the canvas (the player walks over). kbd: walk with arrows, press E. */
export async function openDialogue(page, mode = "mouse") {
  const canvas = page.locator("canvas");
  if (mode === "kbd") {
    await canvas.focus();
    const interact = button(page, EN.world.interact, { prefix: true });
    await page.keyboard.down("ArrowLeft"); await page.waitForTimeout(550); await page.keyboard.up("ArrowLeft");
    for (let i = 0; i < 25 && !(await interact.isEnabled()); i++) {
      await page.keyboard.down("ArrowUp"); await page.waitForTimeout(90); await page.keyboard.up("ArrowUp");
    }
    await page.keyboard.press("e");
  } else {
    const b = await canvas.boundingBox();
    const at = { x: (224 / 640) * b.width, y: (184 / 384) * b.height }; // commander, world coords
    await (mode === "touch" ? canvas.tap({ position: at }) : canvas.click({ position: at }));
  }
  await page.locator("dialog[open]").waitFor(wait);
}
export const closeDialogue = async (page, mode = "mouse") => {
  await btn(page, EN.help.close, mode);
  await page.locator("dialog[open]").waitFor({ state: "detached", ...wait });
};

/** Named screens for the layout / a11y checks. Each starts from a fresh page. */
export const SCREENS = {
  menu: async (page) => openMenu(page),
  hub: async (page) => { await openMenu(page); await startMission(page); },
  hubDialogue: async (page) => { await openMenu(page); await startMission(page); await openDialogue(page); },
  morning: async (page) => { await openMenu(page); await startMission(page); await skipToConsole(page); },
  plan: async (page) => { await openMenu(page); await startMission(page); await skipToConsole(page); await toPlan(page); },
  endSol: async (page) => { await SCREENS.plan(page); await assignAll(page); await endSol(page); },
  final: async (page) => { await openMenu(page); await startMission(page); await skipToConsole(page); await playToFinal(page); },
  dataSources: async (page) => { await openMenu(page); await openSources(page); },
  teacherCard: async (page) => { await openMenu(page); await openTeacher(page); },
};
