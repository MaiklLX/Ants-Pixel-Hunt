import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [app, html] = await Promise.all([
  readFile(new URL("../src/app.js", import.meta.url), "utf8"),
  readFile(new URL("../index.html", import.meta.url), "utf8"),
]);

test("every literal app.js DOM lookup has a matching HTML id", () => {
  const htmlIds = new Set([...html.matchAll(/\\bid=["']([^"']+)["']/g)].map((match) => match[1]));
  const lookups = [...app.matchAll(/\\$\\(["']([^"']+)["']\\)/g)].map((match) => match[1]);
  const missing = [...new Set(lookups.filter((id) => !htmlIds.has(id)))].sort();
  assert.deepEqual(missing, [], `Missing DOM ids referenced by src/app.js: ${missing.join(", ")}`);
});

test("the save-status live region exists and is announced politely", () => {
  const match = html.match(/<[^>]*\\bid=["']save-status["'][^>]*>/);
  assert.ok(match, "index.html must provide #save-status");
  assert.match(match[0], /aria-live=["']polite["']/);
  assert.match(match[0], /role=["']status["']/);
});
