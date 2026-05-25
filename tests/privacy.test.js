import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("new tab does not call third-party preview or icon services", async () => {
  const js = await readFile("src/newtab/newtab.js", "utf8");
  const css = await readFile("src/newtab/newtab.css", "utf8");
  const setupCss = await readFile("src/setup/setup.css", "utf8");

  assert.doesNotMatch(js, /image\.thum\.io|duckduckgo/i);
  assert.doesNotMatch(css, /fonts\.googleapis/i);
  assert.doesNotMatch(setupCss, /fonts\.googleapis/i);
});

test("link health checks run from the new tab page, not the service worker", async () => {
  const worker = await readFile("src/background/service-worker.js", "utf8");
  const js = await readFile("src/newtab/newtab.js", "utf8");

  // Service worker no longer handles health checks
  assert.doesNotMatch(worker, /runInitialHealthCheck/);
  assert.doesNotMatch(worker, /runLinkHealthCheck/);
  assert.doesNotMatch(worker, /checkUrl/);
  assert.doesNotMatch(worker, /selectedFoldersChanged/);
  assert.doesNotMatch(worker, /alarms/);

  // New tab page owns the health check logic
  assert.match(js, /async function checkUrl/);
  assert.match(js, /async function reviewFolderHealth/);
  assert.match(js, /applyLinkCheckResult/);
  assert.match(js, /saveLinkHealth/);
});

test("firefox manifest does not inherit chrome-only favicon permission", async () => {
  const base = JSON.parse(await readFile("src/manifest.base.json", "utf8"));
  const chrome = JSON.parse(await readFile("src/manifest.chrome.json", "utf8"));

  assert.deepEqual(base.permissions, ["bookmarks", "storage"]);
  assert.deepEqual(chrome.permissions, ["bookmarks", "storage", "favicon"]);
  assert.ok(!base.optional_permissions, "base manifest should not declare optional alarms");
});
