import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("newtab page loads required HTML structures and selectors", async () => {
  const html = await readFile("src/newtab/newtab.html", "utf8");

  assert.match(html, /<html lang="es">/);
  assert.match(html, /<link rel="stylesheet" href="\.\/newtab\.css">/);
  assert.match(html, /id="status-line"/);
  assert.match(html, /id="settings"/);
  assert.match(html, /id="search"/);
  assert.match(html, /id="review-links"/);
  assert.match(html, /id="content"/);
  assert.match(html, /id="preview-card" class="preview-card"/);
  assert.match(html, /<script type="module" src="\.\/newtab\.js"><\/script>/);
});

test("newtab stylesheet contains modern layout definitions", async () => {
  const css = await readFile("src/newtab/newtab.css", "utf8");

  assert.match(css, /\.app-shell\s*{/);
  assert.match(css, /\.topbar\s*{/);
  assert.match(css, /\.search-wrap\s*{/);
  assert.match(css, /\.content\s*{/);
  assert.match(css, /\.group\s*{/);
  assert.match(css, /\.bookmark\s*{/);
  assert.match(css, /prefers-color-scheme: dark/);
  assert.match(css, /\.preview-card\s*{/);
  assert.match(css, /\.health-dot-indicator\s*{/);
});

test("newtab controller imports correct shared modules", async () => {
  const js = await readFile("src/newtab/newtab.js", "utf8");

  assert.match(js, /import { getBrowserApi } from "\.\.\/shared\/browser-api\.js";/);
  assert.match(js, /import { searchBookmarks } from "\.\.\/shared\/search\.js";/);
  assert.match(js, /import { getBookmarkIndex, getSettings, STORAGE_KEYS } from "\.\.\/shared\/storage\.js";/);
  assert.match(js, /import { el, formatDate } from "\.\.\/shared\/render\.js";/);
  assert.match(js, /import { shouldShowLinkWarning } from "\.\.\/shared\/link-health\.js";/);
  assert.match(js, /searchInput\.addEventListener\("input",/);
  assert.match(js, /api\.runtime\.openOptionsPage\(\)/);
  assert.match(js, /api\.storage\.onChanged\.addListener/);
  assert.match(js, /showPreviewCard/);
});
