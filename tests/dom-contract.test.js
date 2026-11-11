import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [app, html, readme] = await Promise.all([
  readFile(new URL("../src/app.js", import.meta.url), "utf8"),
  readFile(new URL("../index.html", import.meta.url), "utf8"),
  readFile(new URL("../README.md", import.meta.url), "utf8"),
]);

test("every literal app.js DOM lookup has a matching HTML id", () => {
  const htmlIds = new Set([...html.matchAll(/\bid=["']([^"']+)["']/g)].map((match) => match[1]));
  const lookups = [...app.matchAll(/\$\(["']([^"']+)["']\)/g)].map((match) => match[1]);
  const missing = [...new Set(lookups.filter((id) => !htmlIds.has(id)))].sort();
  assert.deepEqual(missing, [], "Missing DOM ids referenced by src/app.js: " + missing.join(", "));
});

test("the save-status live region exists and is announced politely", () => {
  const match = html.match(/<[^>]*\bid=["']save-status["'][^>]*>/);
  assert.ok(match, "index.html must provide #save-status");
  assert.match(match[0], /aria-live=["']polite["']/);
  assert.match(match[0], /role=["']status["']/);
});


test("the home illustration hooks match the styled markup and contain no stray escape text", async () => {
  assert.match(html, /class=["']menu-garden-art["']/);
  assert.match(html, /class=["']pixel-ant["']/);
  assert.match(html, /viewBox=["']0 0 640 300["']/);
  const styles = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");
  assert.match(styles, /\.menu-garden-art/);
  assert.match(styles, /pixel-ant-breathe/);
  assert.equal(html.includes(String.raw`\n    <p id="save-status"`), false);
});

test("the pixel diorama is not covered by legacy garden overlays", async () => {
  const styles = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");
  assert.match(styles, /\.menu-garden::before,\.menu-garden::after\{content:none\}/);
});


test("the home help disclosure exposes its controlled panel and expanded state", () => {
  const button = html.match(/<button\b[^>]*\bid=["']how-to-play["'][^>]*>/)?.[0];
  const panel = html.match(/<div\b[^>]*\bid=["']how-panel["'][^>]*>/)?.[0];
  assert.ok(button, "index.html must provide #how-to-play");
  assert.match(button, /aria-controls=["']how-panel["']/);
  assert.match(button, /aria-expanded=["']false["']/);
  assert.ok(panel && /\bhidden\b/.test(panel), "#how-panel must start collapsed");
  assert.match(app, /button\.setAttribute\(["']aria-expanded["'],\s*String\(!panel\.hidden\)\)/);
});

test("README feature list uses real line breaks instead of literal escape text", () => {
  assert.equal(readme.includes("\\n- Текущее состояние поля"), false);
});



test("home navigation uses authored forest SVG icons instead of platform map/home emoji", () => {
  const mapStart = html.indexOf('id="map-open"');
  const nestStart = html.indexOf('id="nest-open"');
  const mapButton = html.slice(html.lastIndexOf("<button", mapStart), html.indexOf("</button>", mapStart) + 9);
  const nestButton = html.slice(html.lastIndexOf("<button", nestStart), html.indexOf("</button>", nestStart) + 9);
  assert.ok(mapStart >= 0 && /<svg\b/.test(mapButton), "map navigation needs an inline SVG icon");
  assert.ok(nestStart >= 0 && /<svg\b/.test(nestButton), "anthill navigation needs an inline SVG icon");
  assert.match(mapButton, /aria-hidden=["']true["']/);
  assert.match(nestButton, /aria-hidden=["']true["']/);
  assert.equal(mapButton.includes("🗺️"), false);
  assert.equal(nestButton.includes("🏡"), false);
});

test("KT-074 forest plaque styling stays dark and includes icon sizing", async () => {
  const styles = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");
  assert.ok(styles.includes("KT-074 — home hub cards"));
  assert.ok(styles.includes(".hub-location-icon svg"));
  assert.ok(styles.includes("background:linear-gradient(145deg,#30483a 0%,#263c30"));
});


test("KT-075 main menu ties the title and diorama together with a forest scene label", () => {
  const menuStart = html.indexOf('<section id="main-menu"');
  const menuEnd = html.indexOf('<header class="topbar"', menuStart);
  const menu = html.slice(menuStart, menuEnd);
  assert.ok(menu.includes('<span class="garden-stamp">ЛЕСНАЯ ПОЛЯНКА</span>'));
  assert.ok(menu.indexOf('class="menu-brand"') < menu.indexOf('class="menu-garden"'));
  assert.ok(menu.indexOf('class="menu-garden"') < menu.indexOf('class="menu-progress-card"'));
});

test("KT-075 keeps the home menu compact and its scene label legible", async () => {
  const styles = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");
  assert.ok(styles.includes("KT-075 — unify the menu title, diorama and navigation"));
  assert.ok(styles.includes(".garden-stamp::before"));
  assert.ok(styles.includes("@media(max-height:700px)"));
  assert.ok(styles.includes("background:#1c3029b8"));
});


test("KT-076 freezes ant, pickup and crate animation time while the page is hidden", async () => {
  const source = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(html, /app-version" content="KT-\d+"/);
  assert.ok(source.includes('document.addEventListener("visibilitychange"'));
  assert.ok(source.includes("animationClock.pause()"));
  assert.ok(source.includes("animationClock.resume()"));
  assert.equal(source.split("animationClock.fromFrame(timestamp)").length - 1, 3);
  assert.ok(source.includes("startTime:animationClock.now()"));
  assert.equal(source.split("performance.now()").length - 1, 1);
});


test("KT-077 gives the forest diorama layered foreground and staggered fireflies", async () => {
  const styles = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");
  assert.match(html, /class=["']firefly firefly-a["']/);
  assert.match(html, /class=["']firefly firefly-b["']/);
  assert.match(html, /class=["']firefly firefly-c["']/);
  assert.match(html, /class=["']garden-foreground["']/);
  assert.match(html, /garden-leaf-left/);
  assert.ok(styles.includes("KT-077 — add quiet foreground depth"));
  assert.ok(styles.includes("@keyframes meadow-leaf-sway"));
  assert.match(styles, /prefers-reduced-motion:reduce[\s\S]*garden-leaf-sway\{animation:none/);
});


test("KT-078 maps the campaign as a dotted forest trail and keeps all map and nest surfaces dark", async () => {
  const styles = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");
  assert.ok(styles.includes("KT-078 — map trails and anthill architecture"));
  assert.ok(styles.includes("radial-gradient(circle at 34% 28%"));
  assert.ok(styles.includes(".map-levels .campaign-level:not(:last-child)::after"));
  assert.ok(styles.includes(".map-chapter{"));
  assert.ok(styles.includes(".nest-scene::before"));
  assert.ok(styles.includes("@keyframes nest-lamp-glow"));
  assert.ok(styles.includes("background:linear-gradient(145deg,#344b3a,#263a2e)"));
  assert.ok(styles.includes("prefers-reduced-motion:reduce"));
  assert.equal(/\.map-summary\s*\{[^}]*background:\s*#fff/i.test(styles), false);
  assert.equal(/\.nest-progress-wrap\s*,?\s*\.nest-stats>div\s*\{[^}]*background:\s*#fff/i.test(styles), false);
});


test("KT-079 samples each ant trail position and heading once per rendered ant", async () => {
  const source = await readFile(new URL("../src/app.js", import.meta.url), "utf8");
  assert.match(source, /getTrailPose\(trail,phase\.progress\)/);
  assert.match(source, /drawAnt\(antCtx,pose,ant\.move\.color,phase\.returningNow,workerId,pose\.angle,clockTime\)/);
  assert.equal(source.includes("function trailPoint("), false);
  assert.equal(source.includes("trailPoint("), false);
});


test("KT-080 gives the menu, map and anthill a shared forest detail and restrained arrivals", async () => {
  const styles = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");
  assert.match(styles, /\.main-menu::after,\.map-card::after,\.nest-card::after/);
  assert.match(styles, /@keyframes woodland-overlay-arrive/);
  assert.match(styles, /@keyframes woodland-card-arrive/);
  assert.match(styles, /\.nest-overlay:not\(\[hidden\]\)>\.nest-card/);
  assert.match(styles, /prefers-reduced-motion:reduce[\s\S]*woodland-menu-arrive/);
  assert.match(styles, /#d0b879/);
});


test("KT-081 gives controls and progress indicators one accessible woodland treatment", async () => {
  const styles = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");
  assert.ok(styles.includes("KT-081 — one tactile language for controls, labels and progress"));
  assert.match(styles, /button:focus-visible\s*\{[^}]*outline:2px solid #d8bd78/);
  assert.match(styles, /\.menu-secondary,\.nest-close,\.nest-buy,\.icon-button,\.restart-button/);
  assert.match(styles, /\.menu-progress-track,\.map-summary-track,\.map-chapter-track,[\s\S]*?\.nest-progress-track,\.level-progress/);
  assert.match(styles, /linear-gradient\(90deg,#829e69 0%,#a5ad72 72%,#c2a96c 100%\)/);
  assert.match(styles, /prefers-reduced-motion:reduce[\s\S]*?\.level-progress span\s*\{\s*transition:none/);
});


test("KT-082 gives the live arena HUD a unified dark woodland hierarchy", async () => {
  const styles = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");
  assert.ok(styles.includes("KT-082 — a calmer, unified visual hierarchy for the live arena HUD"));
  assert.match(styles, /\.level-kicker::before/);
  assert.match(styles, /\.slots-section,\.choices-section\s*\{[^}]*background:linear-gradient\(155deg,#263d31dd,#20352bdf\)/);
  assert.match(styles, /\.slots\s*\{[^}]*background:linear-gradient\(180deg,#1d3026,#192b23\)/);
  assert.match(styles, /@media\(prefers-reduced-motion:reduce\)[\s\S]*?\.slot,\.choice-card,\.topbar,\.level-heading\{transition:none\}/);
  assert.equal(/\.slots-section,\.choices-section\s*\{[^}]*background:\s*#fff/i.test(styles), false);
});

test("KT-083 makes the home screen campaign-first and restores compact one-screen play sizing", async () => {
 const styles=await readFile(new URL("../src/styles.css",import.meta.url),"utf8");
 const markup=await readFile(new URL("../index.html",import.meta.url),"utf8");
 const source=await readFile(new URL("../src/app.js",import.meta.url),"utf8");
 assert.ok(markup.includes('id="menu-current-level" hidden'));
 assert.ok(markup.includes('id="start-game" class="menu-primary" type="button" hidden'));
 assert.ok(markup.includes('aria-label="Открыть кампанию и выбрать полянку"'));
 assert.ok(markup.includes("<strong>Кампания</strong><small>Выбрать полянку</small>"));
 assert.ok(styles.includes("KT-083 — compact campaign-first home and restore the one-screen play layout"));
 assert.ok(styles.includes(".menu-brand::after{content:none;display:none}"));
 assert.ok(styles.includes(".slots-section,.choices-section{padding:3px 4px"));
 assert.ok(styles.includes(".board-wrap{width:min(100%,22dvh,220px)"));
 assert.ok(source.includes("menu-progress-count"));
});

test("KT-084 keeps every numbered queue preview on the dark woodland surface", async () => {
 const styles=await readFile(new URL("../src/styles.css",import.meta.url),"utf8");
 assert.ok(styles.includes("KT-084 — remove the legacy pale second-step queue plaque"));
 assert.match(styles,/\.queue-peek\[data-queue-step="2"\]:not\(\.empty\):not\(\.sealed-peek\)\s*\{[^}]*background:linear-gradient\(105deg,#304738 0%,#263b30 100%\)/);
 assert.match(styles,/\.queue-peek\[data-queue-step="2"\]:not\(\.empty\):not\(\.sealed-peek\)\s*\{[^}]*border-color:#455f49/);
});

test("KT-085 keeps the mobile arena inside the dynamic viewport", async () => {
 const styles=await readFile(new URL("../src/styles.css",import.meta.url),"utf8");
 const markup=await readFile(new URL("../index.html",import.meta.url),"utf8");
 assert.match(styles,/height:100svh;min-height:0;max-height:100svh;overflow:hidden/);
 assert.match(styles,/@supports\(height:100dvh\)\{\.app-shell\{height:100dvh;max-height:100dvh\}\}/);
 assert.ok(markup.includes('id="board"'));
});


test("KT-087 restores mobile vertical rhythm and prevents queue overlap", async () => {
 const styles=await readFile(new URL("../src/styles.css",import.meta.url),"utf8");
 const markup=await readFile(new URL("../index.html",import.meta.url),"utf8");
 assert.ok(styles.includes("KT-087 — restore vertical rhythm and prevent mobile queue overlap"));
 assert.match(styles,/justify-content:space-between/);
 assert.match(styles,/height:auto;max-height:none;min-height:0/);
 assert.ok(styles.includes("width:100%;height:auto;min-height:58px"));
 assert.match(styles,/grid-auto-rows:clamp\(14px,2.1dvh,18px\)/);
 assert.match(styles,/max-height:620px/);
 assert.match(markup,/content="KT-0(87|88|89|90|91)"/);
});


test("KT-088 restores useful mobile feedback and improves arena touch/readability", async () => {
 const styles=await readFile(new URL("../src/styles.css",import.meta.url),"utf8");
 const source=await readFile(new URL("../src/app.js",import.meta.url),"utf8");
 const markup=await readFile(new URL("../index.html",import.meta.url),"utf8");
 assert.ok(styles.includes("KT-088 — make the live arena readable, tactile and calmer to play"));
 assert.match(styles,/grid-auto-rows:clamp\(18px,2\.5dvh,22px\)/);
 assert.match(styles,/\.message\s*\{[\s\S]*?min-height:30px;height:auto;max-height:42px/);
 assert.match(styles,/\.queue-lane\s*\{[\s\S]*?border:1px solid #3b5543/);
 assert.ok(source.includes('slot.setAttribute("aria-label"'));
 assert.match(markup,/content="KT-0(88|89|90|91)"/);
 assert.ok(markup.includes('id="slots" class="slots" role="group"'));
});


test("KT-089 gives the lower HUD a clear slots-conveyor-queue order and larger touch targets", async () => {
 const styles=await readFile(new URL("../src/styles.css",import.meta.url),"utf8");
 const markup=await readFile(new URL("../index.html",import.meta.url),"utf8");
 assert.ok(styles.includes("KT-089 — rebalance the lower HUD around slots, conveyor and queue"));
 assert.match(styles,/\.slots-section\{order:2/);
 assert.match(styles,/\.conveyor-section\{order:3/);
 assert.match(styles,/\.choices-section\{order:4/);
 assert.match(styles,/\.choice-card\{min-height:68px/);
 assert.match(styles,/grid-auto-rows:clamp\(20px,2\.8dvh,24px\)/);
 assert.match(markup,/content="KT-0(89|90|91)"/);
});


test("KT-090 keeps desktop arena order and woodland HUD styling in sync with mobile", async () => {
 const styles=await readFile(new URL("../src/styles.css",import.meta.url),"utf8");
 const markup=await readFile(new URL("../index.html",import.meta.url),"utf8");
 assert.ok(styles.includes("KT-090 — bring the desktop arena into the same woodland HUD composition as mobile"));
 assert.match(styles,/@media\(min-width:600px\)\{[\s\S]*?\.slots-section\{order:2/);
 assert.match(styles,/@media\(min-width:600px\)\{[\s\S]*?\.conveyor-section\{order:3/);
 assert.match(styles,/@media\(min-width:600px\)\{[\s\S]*?\.choices-section\{order:4/);
 assert.match(styles,/\.queue-lane\{gap:5px;padding:5px;border:1px solid #3b5543/);
 assert.match(markup,/content="KT-0(90|91)"/);
});


test("KT-091 gives desktop the same vertical arena order with roomier desktop sizing", async () => {
 const styles=await readFile(new URL("../src/styles.css",import.meta.url),"utf8");
 const markup=await readFile(new URL("../index.html",import.meta.url),"utf8");
 assert.ok(styles.includes("KT-091 — make desktop use the same centered, vertical arena rhythm as mobile"));
 assert.match(styles,/@media\(min-width:600px\)\{[\s\S]*?\.slots-section\{order:3/);
 assert.match(styles,/@media\(min-width:600px\)\{[\s\S]*?\.conveyor-section\{order:4/);
 assert.match(styles,/@media\(min-width:600px\)\{[\s\S]*?\.choices-section\{order:5/);
 assert.match(styles,/width:min\(100%,600px\)/);
 assert.match(styles,/grid-template-columns:repeat\(3,minmax\(0,1fr\)\);grid-template-rows:auto;gap:8px/);
 assert.ok(markup.includes('content="KT-091"'));
});
