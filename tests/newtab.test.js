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
  assert.match(html, /id="content"/);
  assert.match(html, /id="preview-card" class="preview-card"/);
  assert.match(html, /<dialog id="edit-modal" class="edit-modal">/);
  assert.match(html, /id="edit-form" class="edit-form"/);
  assert.match(html, /class="logo-wrap"/);
  assert.match(html, /<script type="module" src="\.\/newtab\.js"><\/script>/);
  assert.doesNotMatch(html, /id="review-links"/);
  assert.doesNotMatch(html, /Ã|Â/);
});

test("newtab stylesheet contains modern layout definitions", async () => {
  const css = await readFile("src/newtab/newtab.css", "utf8");

  assert.match(css, /\.app-shell\s*{/);
  assert.match(css, /\.topbar\s*{/);
  assert.match(css, /\.search-wrap\s*{/);
  assert.match(css, /\.content\s*{/);
  assert.match(css, /\.group\s*{/);
  assert.match(css, /\.bookmark\s*{/);
  assert.match(css, /\.bookmark-edit-btn[,\s]/);
  assert.match(css, /\.bookmark-edit-btn::before\s*{/);
  assert.match(css, /\.edit-modal\s*{/);
  assert.match(css, /padding-right:\s*76px/);
  assert.match(css, /padding:\s*34px;\s*gap:\s*20px;/);
  assert.match(css, /\.edit-actions\s+\.link-action-button/);
  assert.match(css, /\.edit-actions\s+\.danger-button/);
  assert.match(css, /\.primary-button\s*{/);
  assert.match(css, /prefers-color-scheme: dark/);
  assert.match(css, /\.preview-card\s*{/);
  assert.match(css, /\.health-dot-indicator\s*{/);
  assert.match(css, /\.logo-wrap\s*{/);
  assert.match(css, /grid-auto-rows:\s*max-content/);
  assert.match(css, /align-content:\s*start/);
  assert.match(css, /overflow-y:\s*auto\s*!important/);
  assert.match(css, /\.results-toolbar\s*{/);
  assert.match(css, /\.link-action-button\s*{/);
  assert.match(css, /\.review-button\s*{/);
  assert.match(css, /\.review-progress\s*{/);
  assert.match(css, /\.preview-capture-img\s*{/);
  assert.doesNotMatch(css, /\.review-links/);
  assert.doesNotMatch(css, /fonts\.googleapis/);
});

test("newtab controller imports correct shared modules", async () => {
  const js = await readFile("src/newtab/newtab.js", "utf8");

  assert.match(js, /import { getBrowserApi } from "\.\.\/shared\/browser-api\.js";/);
  assert.match(js, /import { searchBookmarks } from "\.\.\/shared\/search\.js";/);
  assert.match(js, /getCapturedPreviews/);
  assert.match(js, /import { el, formatDate } from "\.\.\/shared\/render\.js";/);
  assert.match(js, /import { applyLinkCheckResult } from "\.\.\/shared\/link-health\.js";/);
  assert.match(js, /searchInput\.addEventListener\("input",/);
  assert.match(js, /api\.runtime\.openOptionsPage\(\)/);
  assert.match(js, /api\.storage\.onChanged\.addListener/);
  assert.match(js, /showPreviewCard/);
  assert.match(js, /layout-masonry/);
  assert.match(js, /masonry-1/);
  assert.match(js, /masonry-max/);
  assert.match(js, /async function checkUrl/);
  assert.match(js, /async function reviewFolderHealth/);
  assert.match(js, /text:\s*"Volver"/);
  assert.match(js, /class:\s*"link-action-button"/);
  assert.match(js, /No comprobado/);
  assert.match(js, /if \(!bookmark\.linkHealth\?\.lastCheckedAt\)/);
  assert.match(js, /const healthDetails = !health/);
  assert.match(js, /capturedPreviews\[bookmark\.id\]/);
  assert.match(js, /function openBookmarkFromMartabs/);
  assert.match(js, /CAPTURE_OPENED_BOOKMARK/);
  assert.match(js, /api\.runtime\.sendMessage/);
  assert.match(js, /function showEditModal/);
  assert.match(js, /bookmark\.manualTags/);
  assert.match(js, /api\.bookmarks\.update\(bookmark\.id/);
  assert.match(js, /editSave\.disabled = true/);
  assert.match(js, /editSave\.disabled = false/);
  assert.match(js, /No se pudo guardar/);
  assert.doesNotMatch(js, /function renderReviewLinks/);
  assert.doesNotMatch(js, /runManualLinkCheck/);
  assert.doesNotMatch(js, /CHECK_LINK_HEALTH_NOW/);
  assert.doesNotMatch(js, /image\.thum\.io/);
  assert.doesNotMatch(js, /icons\.duckduckgo/);
  assert.doesNotMatch(js, /Ã|Â/);
});
