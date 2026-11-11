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
  const mapButton = html.match(/<button\\b[^>]*\\bid=["']map-open["'][^>]*>[\\s\\S]*?<\\/button>/)?.[0];
  const nestButton = html.match(/<button\\b[^>]*\\bid=["']nest-open["'][^>]*>[\\s\\S]*?<\\/button>/)?.[0];
  assert.ok(mapButton && /<svg\\b/.test(mapButton), "map navigation needs an inline SVG icon");
  assert.ok(nestButton && /<svg\\b/.test(nestButton), "anthill navigation needs an inline SVG icon");
  assert.match(mapButton, /aria-hidden=["']true["']/);
  assert.match(nestButton, /aria-hidden=["']true["']/);
  assert.equal(mapButton.includes("🗺️"), false);
  assert.equal(nestButton.includes("🏡"), false);
});

test("KT-074 forest plaque styling stays dark and includes icon sizing", async () => {
  const styles = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");
  assert.match(styles, /KT-074 — home hub cards/);
  assert.match(styles, /\\.hub-location-icon svg/);
  assert.match(styles, /background:linear-gradient\\(145deg,#30483a 0%,#263c30/);
});
