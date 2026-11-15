#!/usr/bin/env node
// QA harness. Usage: node scripts/qa/run.mjs [layout resize network reload keyboard touch a11y ...] [--base=URL] [--shots]
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";
import { EN, SCREENS, openMenu, startMission, skipToConsole, toPlan, assignAll, endSol, nextFromNight, playToFinal,
  openSources, closeOverlay, openDialogue, closeDialogue, restart, button, heading, fmt, press } from "./flows.mjs";

const args = process.argv.slice(2);
const opt = (k) => args.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3);
const BASE = (opt("base") ?? "http://localhost:5191/impossible-solution/").replace(/\/?$/, "/");
const SHOTS = args.includes("--shots");
const VIEWPORTS = [[320, 568], [360, 640], [390, 844], [844, 390], [768, 1024], [1024, 768], [1280, 720], [1366, 768], [1920, 1080], [2560, 1440]];
const PHONES = new Set(["320x568", "360x640", "390x844"]);
const SHOT_SIZES = new Set(["320x568", "844x390", "1366x768"]);
const ALL = {};
const check = (name, fn) => (ALL[name] = fn);

let browser;
async function newPage(w, h, ctxOpts = {}) {
  const context = await browser.newContext({ viewport: { width: w, height: h }, ...ctxOpts });
  const page = await context.newPage();
  page.__base = BASE;
  page.setDefaultTimeout(8000);
  return page;
}
const done = (page) => page.context().close().catch(() => {});

// ---- in-page audits (serialised into the browser) ----
function audit({ touch, rules }) {
  const out = [];
  const SEL = 'button, a[href], input, select, textarea, [role=button], [tabindex]:not([tabindex="-1"])';
  const name = (e) => (e.getAttribute("aria-label") || e.textContent || e.id || "").trim().replace(/\s+/g, " ").slice(0, 32);
  const label = (e) => `<${e.tagName.toLowerCase()}${e.className && typeof e.className === "string" ? "." + e.className.split(" ")[0] : ""}> "${name(e)}"`;
  const visible = (e) => {
    const r = e.getBoundingClientRect(), s = getComputedStyle(e);
    return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none" && !e.closest("[inert],[hidden]") && !(e.closest("details:not([open])") && !e.closest("summary"));
  };
  if (rules.includes("a") && document.documentElement.scrollWidth > innerWidth)
    out.push(["FAIL", `[a] horizontal scroll: scrollWidth ${document.documentElement.scrollWidth} > ${innerWidth}`]);
  const modal = document.querySelector("dialog[open]");
  const els = [...document.querySelectorAll(SEL)].filter((e) => visible(e) && (!modal || modal.contains(e)));
  const min = touch ? 48 : 44;
  for (const e of els) {
    const r = e.getBoundingClientRect();
    if (rules.includes("b") && (r.left < -0.5 || r.right > innerWidth + 0.5))
      out.push(["FAIL", `[b] ${label(e)} outside viewport (left ${Math.round(r.left)}, right ${Math.round(r.right)} of ${innerWidth})`]);
    if (rules.includes("c") && (r.width < min - 0.5 || r.height < min - 0.5) && e.tagName !== "CANVAS")
      out.push(["FAIL", `[c] ${label(e)} is ${Math.round(r.width)}x${Math.round(r.height)} (min ${min})`]);
  }
  if (rules.includes("b")) {
    const y = scrollY, x = scrollX;
    for (const e of els) {
      e.scrollIntoView({ block: "center", inline: "center" });
      const r = e.getBoundingClientRect();
      if (r.left < -0.5 || r.right > innerWidth + 0.5) continue; // already reported
      const px = Math.min(Math.max(r.left + r.width / 2, 1), innerWidth - 1), py = Math.min(Math.max(r.top + r.height / 2, 1), innerHeight - 1);
      const top = document.elementFromPoint(px, py);
      if (r.bottom < 0 || r.top > innerHeight) out.push(["FAIL", `[b] ${label(e)} unreachable: outside scrollable area`]);
      else if (!top || !(top === e || e.contains(top) || top.contains(e)))
        out.push(["FAIL", `[b] ${label(e)} covered by ${label(top ?? document.body)}`]);
    }
    scrollTo(x, y);
  }
  if (rules.includes("d")) {
    const seen = new Set();
    for (const e of document.querySelectorAll("body *")) {
      if (!visible(e) || ![...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
      const size = parseFloat(getComputedStyle(e).fontSize);
      const key = `${e.tagName}.${e.className}`;
      if (size < 12 && !seen.has(key)) { seen.add(key); out.push(["WARN", `[d] text ${size.toFixed(1)}px in ${label(e)}`]); }
    }
  }
  return out;
}
const auditPage = (page, touch, rules) => page.evaluate(audit, { touch, rules });

/** Cap noisy output: at most 6 lines per group, the rest summarised. Returns the finding count. */
function emit(prefix, list, kind = "FAIL") {
  let fails = 0;
  const byRule = {};
  for (const [k, msg] of list) {
    if (k === kind || k === "WARN") { /* keep */ }
    const g = (byRule[k + msg.slice(0, 3)] ??= []);
    g.push([k, msg]);
  }
  for (const g of Object.values(byRule)) {
    g.slice(0, 6).forEach(([k, m]) => console.log(`${k} ${prefix} ${m}`));
    if (g.length > 6) console.log(`${g[0][0]} ${prefix} ...and ${g.length - 6} more ${g[0][1].slice(0, 3)}`);
    if (g[0][0] === "FAIL") fails += g.length;
  }
  return fails;
}

// ---- 1. layout ----
check("layout", async () => {
  let fails = 0;
  mkdirSync("docs/qa", { recursive: true });
  for (const [w, h] of VIEWPORTS) {
    const size = `${w}x${h}`, phone = PHONES.has(size);
    for (const screen of Object.keys(SCREENS)) {
      const page = await newPage(w, h, { reducedMotion: "reduce", ...(phone ? { hasTouch: true, isMobile: true } : {}) });
      try {
        await SCREENS[screen](page);
        await page.waitForTimeout(300);
        fails += emit(`layout ${size} ${screen}`, await auditPage(page, phone, ["a", "b", "c", "d"]));
        if (SHOTS && SHOT_SIZES.has(size)) await page.screenshot({ path: `docs/qa/layout-${screen}-${size}.png` });
      } catch (e) { console.log(`FAIL layout ${size} ${screen} could not reach screen: ${String(e.message).split("\n")[0]}`); fails++; }
      await done(page);
    }
  }
  return fails;
});

// ---- 2. resize ----
const RESIZE_STEPS = [[1366, 768], [390, 844], [844, 390], [320, 568], [1920, 1080]];
const resizeActions = {
  hub: async (page) => { await button(page, EN.world.goConsole, { prefix: true }).click(); await button(page, EN.morning.goPlan).waitFor(); },
  hubDialogue: async (page) => { await closeDialogue(page); },
  plan: async (page) => {
    const c = button(page, EN.crew.who[1]); await c.click();
    if ((await c.getAttribute("aria-pressed")) !== "true") throw new Error("crew button did not select");
  },
  final: async (page) => { await restart(page); await heading(page, fmt(EN.morning.heading, { sol: 1 }).replace(/ 1$/, "")).waitFor(); },
};
check("resize", async () => {
  let fails = 0;
  for (const screen of Object.keys(resizeActions)) {
    const page = await newPage(1366, 768);
    try {
      await SCREENS[screen](page);
      for (const [w, h] of RESIZE_STEPS) {
        await page.setViewportSize({ width: w, height: h });
        await page.waitForTimeout(250);
        fails += emit(`resize ${screen} ->${w}x${h}`, await auditPage(page, false, ["a", "b"]));
      }
      await resizeActions[screen](page);
    } catch (e) { console.log(`FAIL resize ${screen} input after resize: ${String(e.message).split("\n")[0]}`); fails++; }
    await done(page);
  }
  // Held movement must stop when the window is rotated/blurred (key-up events get lost).
  const page = await newPage(1366, 768);
  // The world is a canvas, so spy on drawImage: the last "astronaut" sprite drawn is the player.
  // Only x: the test walks left, and the idle bounce lifts a standing astronaut 1 px up and down.
  await page.addInitScript(() => {
    const draw = CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage = function (img, ...a) {
      if (img?.src?.includes("astronaut")) window.__player = String(a[0]);
      return draw.call(this, img, ...a);
    };
  });
  try {
    await openMenu(page); await startMission(page);
    await page.locator("canvas").focus();
    const at = () => page.evaluate(() => window.__player);
    await page.keyboard.down("ArrowLeft");
    const a = await at(); await page.waitForTimeout(300); const moving = (await at()) !== a;
    await page.setViewportSize({ width: 768, height: 1366 });
    await page.evaluate(() => { for (const n of ["orientationchange", "resize", "blur"]) window.dispatchEvent(new Event(n)); });
    await page.waitForTimeout(250);
    const b = await at(); await page.waitForTimeout(400); const c = await at();
    // No keyboard.up on purpose: the key-up was "lost", only our held-key set could keep moving.
    if (!moving) { console.log("FAIL resize held-key: player never moved while key held (test cannot assert)"); fails++; }
    else if (b !== c) { console.log("FAIL resize held-key: player still moving after rotate/blur"); fails++; }
  } catch (e) { console.log(`FAIL resize held-key: ${String(e.message).split("\n")[0]}`); fails++; }
  await done(page);
  return fails;
});

// ---- 3. network ----
check("network", async () => {
  let fails = 0;
  for (const flag of ["offline=1", "demo=1"]) {
    const page = await newPage(1280, 720);
    const bad = new Set();
    const origin = new URL(BASE).origin;
    page.on("request", (r) => {
      const u = new URL(r.url());
      if (u.protocol === "data:" || u.protocol === "blob:" || u.protocol === "about:") return;
      if (u.origin !== origin) bad.add(`external ${r.method()} ${u.origin}${u.pathname}`);
      else if (u.pathname.startsWith("/api/") || u.pathname.startsWith(new URL(BASE).pathname + "api/")) bad.add(`api ${r.method()} ${u.pathname}`);
    });
    try {
      await openMenu(page, flag); await openSources(page); await closeOverlay(page);
      await startMission(page); await skipToConsole(page); await playToFinal(page);
    } catch (e) { console.log(`FAIL network ${flag} flow broke: ${String(e.message).split("\n")[0]}`); fails++; }
    for (const b of bad) { console.log(`FAIL network ${flag} ${b}`); fails++; }
    await done(page);
  }
  return fails;
});

// ---- 4. reload (persistence; expected to fail until the lead lands it) ----
check("reload", async () => {
  let fails = 0;
  const solOnScreen = (page) => page.getByRole("heading", { name: /^Plan sol \d/ }).first().textContent();
  for (const flag of ["offline=1", "demo=1"]) {
    const page = await newPage(1280, 720);
    try {
      await openMenu(page, flag); await startMission(page); await skipToConsole(page);
      await toPlan(page); await assignAll(page); await endSol(page); await nextFromNight(page);
      await toPlan(page);
      const before = await solOnScreen(page);
      await button(page, EN.crew.who[1]).click(); // crew.name is "$t(crew.who.N)", resolved by i18next, not by this script
      await page.reload();
      if (flag === "demo=1") {
        const fresh = await button(page, EN.title.start).waitFor({ timeout: 6000 }).then(() => true, () => false);
        if (!fresh) { console.log("FAIL reload demo=1: reload did not start fresh"); fails++; }
      } else {
        await page.waitForTimeout(800);
        const after = await solOnScreen(page).catch(() => null);
        if (after !== before) { console.log(`FAIL reload ${flag}: expected "${before}", got ${JSON.stringify(after)}`); fails++; }
      }
    } catch (e) { console.log(`FAIL reload ${flag}: ${String(e.message).split("\n")[0]}`); fails++; }
    await done(page);
  }
  return fails;
});

// ---- 5. keyboard ----
const FOCUS_JS = () => {
  const e = document.activeElement;
  if (!e || e === document.body || e === document.documentElement) return null;
  const pick = (s) => `${s.outlineStyle}|${s.outlineWidth}|${s.outlineColor}|${s.boxShadow}`;
  const on = pick(getComputedStyle(e));
  e.blur(); const off = pick(getComputedStyle(e)); e.focus();
  const s = getComputedStyle(e);
  const ring = (s.outlineStyle !== "none" && parseFloat(s.outlineWidth) > 0) || on !== off;
  return { ring, name: (e.getAttribute("aria-label") || e.textContent || e.tagName).trim().slice(0, 30) };
};
check("keyboard", async () => {
  let fails = 0;
  const page = await newPage(1280, 720);
  const noRing = new Set();
  page.__onTab = async () => {
    const f = await page.evaluate(FOCUS_JS);
    if (f && !f.ring) noRing.add(f.name);
  };
  const activeIsBody = () => page.evaluate(() => !document.activeElement || document.activeElement === document.body);
  const step = async (label, fn) => { // a failed step is reported; flow errors abort, focus errors (FocusError) do not
    try { await fn(); } catch (e) {
      console.log(`FAIL keyboard ${label}: ${String(e.message).split("\n")[0]}`); fails++;
      if (!e.focus) throw e;
    }
  };
  const focusError = (m) => Object.assign(new Error(m), { focus: true });
  try {
    await openMenu(page);
    await step("tooltip", async () => {
      const q = page.getByRole("button", { name: new RegExp("^" + EN.help.whatsThis) }).first();
      await press(page, q, "kbd"); await page.keyboard.press("Escape");
      if (!(await q.evaluate((e) => document.activeElement === e))) throw focusError("focus not returned to the ? button after closing the tooltip");
    });
    await step("menu: start", () => startMission(page, "kbd"));
    await step("hub: dialogue", async () => {
      await openDialogue(page, "kbd");
      if (!(await page.locator("dialog[open]").evaluate((d) => d.contains(document.activeElement))))
        throw focusError("focus did not move into the dialogue");
      await closeDialogue(page, "kbd");
      const onCanvas = await page.evaluate(() => document.activeElement === document.querySelector("canvas"));
      if (!onCanvas) throw focusError(`focus after closing the dialogue is ${(await activeIsBody()) ? "<body>" : "not the canvas"}`);
    });
    await step("hub: skip", () => skipToConsole(page, "kbd"));
    await step("play to final", () => playToFinal(page, "kbd"));
    await step("final: restart", () => restart(page, "kbd"));
  } catch { /* reported */ }
  for (const n of noRing) { console.log(`FAIL keyboard no visible focus indicator on "${n}"`); fails++; }
  await done(page);
  return fails;
});

// ---- 6. touch ----
check("touch", async () => {
  let fails = 0;
  const page = await newPage(390, 844, { hasTouch: true, isMobile: true });
  try {
    await openMenu(page); await startMission(page, "touch");
    await openDialogue(page, "touch"); await closeDialogue(page, "touch");
    await skipToConsole(page, "touch"); await playToFinal(page, "touch"); await restart(page, "touch");
  } catch (e) { console.log(`FAIL touch: ${String(e.message).split("\n")[0]}`); fails++; }
  await done(page);
  return fails;
});

// ---- 7. a11y ----
function a11yAudit({ lang }) {
  const out = [];
  const SEL = 'button, a[href], input, select, textarea, [role=button], [tabindex]:not([tabindex="-1"]), canvas';
  const text = (e) => {
    if (e.getAttribute("aria-label")?.trim()) return e.getAttribute("aria-label");
    const by = e.getAttribute("aria-labelledby");
    if (by) return by.split(" ").map((i) => document.getElementById(i)?.textContent ?? "").join(" ");
    if (e.alt?.trim()) return e.alt;
    if (e.labels?.length) return [...e.labels].map((l) => l.textContent).join(" ");
    if (e.title?.trim()) return e.title;
    return (e.textContent ?? "").replace(/[​]/g, "");
  };
  const desc = (e) => `<${e.tagName.toLowerCase()}${typeof e.className === "string" && e.className ? "." + e.className.split(" ")[0] : ""}>`;
  const vis = (e) => { const r = e.getBoundingClientRect(), s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none"; };
  for (const e of document.querySelectorAll(SEL)) if (vis(e) && !text(e).trim()) out.push(`[name] ${desc(e)} has no accessible name`);
  for (const d of document.querySelectorAll("dialog, [role=dialog]"))
    if ((d.open ?? true) && vis(d) && !d.getAttribute("aria-label") && !d.getAttribute("aria-labelledby")) out.push(`[dialog] ${desc(d)} has no aria-label/aria-labelledby`);
  if (document.documentElement.lang !== lang) out.push(`[lang] <html lang="${document.documentElement.lang}"> but the language is "${lang}"`);
  const canvas = document.querySelector("canvas");
  if (canvas) {
    const dby = canvas.getAttribute("aria-describedby");
    if (!canvas.getAttribute("aria-label")?.trim()) out.push("[canvas] canvas has no accessible name");
    if (!(dby && document.getElementById(dby)?.textContent.trim().length > 20)) out.push("[canvas] hub has no text alternative (aria-describedby to a text describing what is on screen)");
  }
  return out;
}
const MOTION_JS = () => {
  const out = [], seen = new Set();
  for (const a of document.getAnimations()) if (a.playState === "running") {
    const k = `${a.constructor.name} ${a.animationName ?? a.transitionProperty}`;
    if (!seen.has(k)) { seen.add(k); out.push(`[motion] running ${k}`); }
  }
  const list = (v) => v.split(",").map((s) => s.trim());
  const secs = (v) => parseFloat(v) * (v.endsWith("ms") ? 0.001 : 1);
  for (const e of document.querySelectorAll("*")) for (const p of [null, "::before", "::after"]) {
    const s = getComputedStyle(e, p);
    const who = `${e.tagName.toLowerCase()}${typeof e.className === "string" && e.className ? "." + e.className.split(" ")[0] : ""}${p ?? ""}`;
    const names = list(s.animationName), durs = list(s.animationDuration);
    names.forEach((n, i) => { if (n !== "none" && secs(durs[i % durs.length]) > 0.01 && !seen.has(who + n)) { seen.add(who + n); out.push(`[motion] ${who} animation ${n}`); } });
    const props = list(s.transitionProperty), tds = list(s.transitionDuration);
    props.forEach((pr, i) => { if (/^(all|transform|opacity)$/.test(pr) && secs(tds[i % tds.length]) > 0.01 && !seen.has(who + pr)) { seen.add(who + pr); out.push(`[motion] ${who} transition ${pr} ${tds[i % tds.length]}`); } });
  }
  return out;
};
check("a11y", async () => {
  let fails = 0;
  for (const screen of Object.keys(SCREENS)) {
    const page = await newPage(1280, 720, { reducedMotion: "reduce" });
    try {
      await SCREENS[screen](page);
      await page.waitForTimeout(400);
      const found = [...(await page.evaluate(a11yAudit, { lang: "en" })), ...(await page.evaluate(MOTION_JS))];
      for (const f of [...new Set(found)].slice(0, 12)) { console.log(`FAIL a11y ${screen} ${f}`); fails++; }
    } catch (e) { console.log(`FAIL a11y ${screen} could not reach screen: ${String(e.message).split("\n")[0]}`); fails++; }
    await done(page);
  }
  // <html lang> follows the language toggle.
  const page = await newPage(1280, 720);
  try {
    await openMenu(page);
    await page.getByRole("button", { name: EN.lang.bg === "Български" ? "Български" : EN.lang.bg, exact: true }).click();
    const lang = await page.evaluate(() => document.documentElement.lang);
    if (lang !== "bg") { console.log(`FAIL a11y lang after switching to Bulgarian is "${lang}"`); fails++; }
  } catch (e) { console.log(`FAIL a11y language toggle: ${String(e.message).split("\n")[0]}`); fails++; }
  await done(page);
  return fails;
});

// ---- 8. labels: text on every control must look right, in English and Bulgarian ----
function labelAudit({ touch }) {
  const out = [];
  const SEL = 'button, [role=button], a[href], summary, input:not([type=range]), select';
  const vis = (e) => { const r = e.getBoundingClientRect(), s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none"; };
  const modal = document.querySelector("dialog[open]");
  const els = [...document.querySelectorAll(SEL)].filter((e) => vis(e) && (!modal || modal.contains(e)));
  const nm = (e) => `<${e.tagName.toLowerCase()}${typeof e.className === "string" && e.className ? "." + e.className.split(" ")[0] : ""}> "${(e.getAttribute("aria-label") || e.textContent || "").trim().replace(/\s+/g, " ").slice(0, 28)}"`;
  const min = touch ? 48 : 44;
  for (const e of els) {
    const r = e.getBoundingClientRect(), who = nm(e), bad = [];
    if (r.width < min - 0.5 || r.height < min - 0.5) bad.push(`target ${Math.round(r.width)}x${Math.round(r.height)} < ${min}`);
    const nodes = [e, ...e.querySelectorAll("*")].filter((n) => n.clientWidth > 0 || n === e);
    for (const n of nodes) {
      const s = getComputedStyle(n);
      if (n.scrollWidth > n.clientWidth + 1 || n.scrollHeight > n.clientHeight + 1) { if (s.overflow !== "visible" || n === e || n.scrollWidth > n.clientWidth + 1) bad.push(`clipped (${n.scrollWidth}x${n.scrollHeight} in ${n.clientWidth}x${n.clientHeight})`); }
      if (s.textOverflow === "ellipsis" && (n.scrollWidth > n.clientWidth)) bad.push("ellipsis hides text");
    }
    const walker = document.createTreeWalker(e, NodeFilter.SHOW_TEXT);
    for (let t; (t = walker.nextNode());) {
      if (!t.textContent.trim() || t.parentElement.closest("[aria-hidden=true]") && !t.parentElement.closest("[aria-hidden=true]").contains(e)) continue;
      const p = t.parentElement, s = getComputedStyle(p), fs = parseFloat(s.fontSize);
      const rg = document.createRange(); rg.selectNodeContents(t);
      const tr = rg.getBoundingClientRect();
      if (!tr.width) continue;
      const lh = s.lineHeight === "normal" ? fs * 1.2 : parseFloat(s.lineHeight);
      if (fs < 14) bad.push(`font ${fs.toFixed(1)}px < 14`);
      if (lh < fs * 1.15 - 0.1) bad.push(`line-height ${(lh / fs).toFixed(2)} < 1.15`);
      // long source titles are citations, not button labels
      if (Math.round(tr.height / lh) > 3 && !e.closest(".sources__item")) bad.push(`${Math.round(tr.height / lh)} lines > 3`);
      if (tr.left < r.left - 1 || tr.right > r.right + 1 || tr.top < r.top - 1 || tr.bottom > r.bottom + 1) bad.push("label outside the control box");
    }
    for (const b of new Set(bad)) out.push(`${who} ${b}`);
  }
  // siblings in one row: same height and padding
  const parents = new Set(els.map((e) => e.parentElement));
  for (const p of parents) {
    const kids = els.filter((e) => e.parentElement === p && !e.matches("input,summary"));
    for (const a of kids) for (const b of kids) {
      if (a >= b && a !== b) continue;
      if (a === b) continue;
      const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
      if (Math.abs(ra.top - rb.top) > 4 || ra.left >= rb.left) continue;
      const sa = getComputedStyle(a), sb = getComputedStyle(b);
      if (Math.abs(ra.height - rb.height) > 1.5 || sa.paddingTop !== sb.paddingTop || sa.paddingBottom !== sb.paddingBottom)
        out.push(`row mismatch ${nm(a)} (${Math.round(ra.height)}px, pad ${sa.paddingTop}) vs ${nm(b)} (${Math.round(rb.height)}px, pad ${sb.paddingTop})`);
    }
  }
  return out;
}
const LABEL_VIEWPORTS = [[360, 640], [390, 844], [844, 390], [768, 1024], [1366, 768]];
check("labels", async () => {
  let fails = 0;
  mkdirSync("docs/qa", { recursive: true });
  const stage = opt("shots-prefix"); // e.g. --shots-prefix=before: screenshots at 390 and 1366 only
  for (const lang of ["en", "bg"]) for (const [w, h] of LABEL_VIEWPORTS) {
    const phone = w < 500 || h < 500;
    for (const screen of ["menu", "hub", "morning", "plan", "endSol", "final", "dataSources", "teacherCard"]) {
      const page = await newPage(w, h, { reducedMotion: "reduce", ...(phone ? { hasTouch: true, isMobile: true } : {}) });
      try {
        await SCREENS[screen](page);
        if (lang === "bg") { await page.getByRole("button", { name: "Български", exact: true }).click(); await page.waitForTimeout(250); }
        await page.waitForTimeout(250);
        if (stage && (w === 390 || w === 1366) && h !== 390) await page.screenshot({ path: `docs/qa/labels-${stage}-${screen}-${lang}-${w}.png` });
        fails += emit(`labels ${lang} ${w}x${h} ${screen}`, (await page.evaluate(labelAudit, { touch: phone })).map((m) => ["FAIL", m]));
      } catch (e) { console.log(`FAIL labels ${lang} ${w}x${h} ${screen}: ${String(e.message).split("\n")[0]}`); fails++; }
      await done(page);
    }
  }
  return fails;
});

// ---- dust: text contrast while the dust storm covers the base (#75) ----
/** In the page: WCAG contrast of one rendered text, from two screenshots of it (as shown, and with its text made
 *  transparent). Pixels that change are the text; pixels that stay are what is behind it, dust included. */
async function contrastOf([shown, hidden]) {
  const load = async (b64) => {
    const img = await createImageBitmap(await (await fetch(`data:image/png;base64,${b64}`)).blob());
    const c = new OffscreenCanvas(img.width, img.height), x = c.getContext("2d");
    x.drawImage(img, 0, 0);
    return x.getImageData(0, 0, img.width, img.height).data;
  };
  const [p, q] = [await load(shown), await load(hidden)];
  const lin = (v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  const lum = (d, i) => 0.2126 * lin(d[i]) + 0.7152 * lin(d[i + 1]) + 0.0722 * lin(d[i + 2]);
  const text = [], back = [];
  for (let i = 0; i < p.length; i += 4) {
    const diff = Math.abs(p[i] - q[i]) + Math.abs(p[i + 1] - q[i + 1]) + Math.abs(p[i + 2] - q[i + 2]);
    if (diff > 120) text.push([diff, lum(p, i)]);
    else if (diff < 8) back.push(lum(q, i));
  }
  if (text.length < 4 || back.length < 4) return null;
  // The text colour: the most-changed third of its pixels (edges are blended with the background).
  text.sort((a, b) => b[0] - a[0]);
  const core = text.slice(0, Math.ceil(text.length / 3)).map(([, l]) => l).sort((a, b) => a - b);
  const fg = core[Math.floor(core.length / 2)];
  // The background: its worst tenth (the pixels closest to the text colour), so blotchy dust cannot hide a problem.
  const ratios = back.map((l) => (Math.max(l, fg) + 0.05) / (Math.min(l, fg) + 0.05)).sort((a, b) => a - b);
  return ratios[Math.floor(ratios.length / 10)];
}
check("dust", async () => {
  let fails = 0;
  const AREAS = ".mission-status-bar, .station-header, .storm-objective, .interaction-guide";
  for (const [w, h] of [[390, 844], [1366, 768], [1920, 1080]]) {
    const phone = w < 500;
    const page = await newPage(w, h, { reducedMotion: "reduce", ...(phone ? { hasTouch: true, isMobile: true } : {}) });
    const tag = `dust ${w}x${h}`;
    try {
      // Classic mission, seed 1: the dust storm reaches the base on the morning of sol 2.
      await openMenu(page, "campaign=classic&seed=1");
      await startMission(page); await skipToConsole(page); await toPlan(page); await assignAll(page); await endSol(page); await nextFromNight(page);
      await page.locator(".dust-alarm").waitFor();
      await page.locator(".dust-alarm .primary").click();
      await page.locator(".dust-cover.in-world").waitFor();
      await page.waitForTimeout(300);
      // Every visible element with its own text inside the areas a player reads during the storm.
      const count = await page.evaluate((sel) => {
        let n = 0;
        for (const area of document.querySelectorAll(sel)) for (const e of [area, ...area.querySelectorAll("*")]) {
          const r = e.getBoundingClientRect(), s = getComputedStyle(e);
          const own = [...e.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim());
          if (own && r.width > 2 && r.height > 2 && s.visibility !== "hidden" && s.display !== "none" && s.position !== "absolute") e.dataset.qaText = String(n++);
        }
        return n;
      }, AREAS);
      if (!count) { console.log(`FAIL ${tag}: no text found in ${AREAS}`); fails++; }
      const found = [];
      for (let i = 0; i < count; i++) {
        const el = page.locator(`[data-qa-text="${i}"]`);
        await el.scrollIntoViewIfNeeded();
        const info = await el.evaluate((e) => {
          const s = getComputedStyle(e), size = parseFloat(s.fontSize), bold = Number(s.fontWeight) >= 700;
          // Only the text's own box (+2 px), never the button border or padding around it.
          let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
          for (const c of e.childNodes) if (c.nodeType === 3 && c.textContent.trim()) {
            const range = document.createRange(); range.selectNodeContents(c);
            for (const r of range.getClientRects()) { x0 = Math.min(x0, r.left); y0 = Math.min(y0, r.top); x1 = Math.max(x1, r.right); y1 = Math.max(y1, r.bottom); }
          }
          return { name: (e.textContent || "").trim().replace(/\s+/g, " ").slice(0, 36), large: size >= 24 || (bold && size >= 18.66), box: { x0: x0 - 2, y0: y0 - 2, x1: x1 + 2, y1: y1 + 2 } };
        });
        const b = info.box;
        if (!(b.x1 > b.x0)) continue;
        const clip = { x: Math.max(0, b.x0), y: Math.max(0, b.y0), width: Math.min(b.x1, w) - Math.max(0, b.x0), height: Math.min(b.y1, h) - Math.max(0, b.y0) };
        if (clip.width < 3 || clip.height < 3) continue;
        const shown = (await page.screenshot({ clip })).toString("base64");
        await el.evaluate((e) => { for (const c of [e, ...e.querySelectorAll("*")]) c.style.setProperty("color", "transparent", "important"); });
        const hidden = (await page.screenshot({ clip })).toString("base64");
        await el.evaluate((e) => { for (const c of [e, ...e.querySelectorAll("*")]) c.style.removeProperty("color"); });
        const ratio = await page.evaluate(contrastOf, [shown, hidden]);
        const need = info.large ? 3 : 4.5;
        if (ratio !== null && ratio < need) found.push(["FAIL", `"${info.name}" contrast ${ratio.toFixed(2)}:1 under the dust (need ${need}:1)`]);
      }
      fails += emit(tag, found);
      if (SHOTS) await page.screenshot({ path: `docs/qa/dust-${w}x${h}.png` });
    } catch (e) { console.log(`FAIL ${tag}: ${String(e.message).split("\n")[0]}`); fails++; }
    await done(page);
  }
  return fails;
});

// ---- main ----
const wanted = args.filter((a) => !a.startsWith("--"));
const names = wanted.length ? wanted : Object.keys(ALL);
const unknown = names.filter((n) => !ALL[n]);
if (unknown.length) { console.log(`unknown check: ${unknown.join(", ")} (have: ${Object.keys(ALL).join(", ")})`); process.exit(2); }
let failed = 0;
browser = await chromium.launch({ channel: "chrome", headless: true }); // never headed
try {
  for (const n of names) {
    let count;
    try { count = await ALL[n](); } catch (e) { console.log(`FAIL ${n} crashed: ${String(e.message).split("\n")[0]}`); count = 1; }
    console.log(count ? `FAIL ${n} (${count} findings)` : `PASS ${n}`);
    if (count) failed++;
  }
} finally { await browser.close(); }
process.exit(failed ? 1 : 0);
