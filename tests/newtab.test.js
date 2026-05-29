import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("newtab page loads required HTML structures and selectors", async () => {
  const html = await readFile("src/newtab/newtab.html", "utf8");

  assert.match(html, /<html/);
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
  assert.match(css, /--surface-bg:\s*rgba\(255, 255, 255, 0\.225\);/);
  assert.match(css, /--surface-bg:\s*rgba\(24, 30, 40, 0\.72\);/);
  assert.match(css, /\.topbar\s*{/);
  assert.match(css, /\.search-wrap\s*{/);
  assert.match(css, /\.content\s*{/);
  assert.match(css, /\.group\s*{/);
  assert.match(css, /\.group\.is-view-focus\s*{/);
  assert.match(css, /@keyframes\s+view-focus-pulse/);
  assert.match(css, /\.bookmark\s*{/);
  assert.match(css, /\.bookmark\.is-manual-sortable\s*{/);
  assert.match(css, /\.bookmark\.is-dragging\s*{/);
  assert.match(css, /\.bookmark-edit-btn[,\s]/);
  assert.match(css, /\.bookmark-edit-btn::before\s*{/);
  assert.match(css, /\.edit-modal\s*{/);
  assert.match(css, /padding-inline-end:\s*76px/);
  assert.match(css, /padding:\s*34px;\s*gap:\s*20px;/);
  assert.match(css, /\.edit-actions\s+\.link-action-button/);
  assert.match(css, /\.edit-actions\s+\.danger-button/);
  assert.match(css, /\.primary-button\s*{/);
  assert.match(css, /prefers-color-scheme: dark/);
  assert.match(css, /\.preview-card\s*{/);
  assert.match(css, /\.health-dot-indicator\s*{/);
  assert.match(css, /\.logo-wrap\s*{/);
  assert.match(css, /background:\s*transparent;/);
  assert.match(css, /border:\s*0;/);
  assert.match(css, /border-radius:\s*0;/);
  assert.match(css, /box-shadow:\s*none;/);
  assert.match(css, /box-shadow:\s*none;/);
  assert.match(css, /backdrop-filter:\s*none;/);
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
  assert.doesNotMatch(css, /Ã|Â/);
});

test("newtab controller imports correct shared modules", async () => {
  const js = await readFile("src/newtab/newtab.js", "utf8");

  assert.match(js, /import { getBrowserApi } from "\.\.\/shared\/browser-api\.js";/);
  assert.match(js, /import { searchBookmarks } from "\.\.\/shared\/search\.js";/);
  assert.match(js, /import { sortBookmarks/);
  assert.match(js, /getCapturedPreviews/);
  assert.match(js, /import { el, formatDate } from "\.\.\/shared\/render\.js";/);
  assert.match(js, /import { applyLinkCheckResult } from "\.\.\/shared\/link-health\.js";/);
  assert.match(js, /searchInput\.addEventListener\("input",/);
  assert.match(js, /api\.storage\.onChanged\.addListener/);
  assert.match(js, /showPreviewCard/);
  assert.match(js, /layout-masonry/);
  assert.match(js, /masonry-1/);
  assert.match(js, /masonry-max/);
  assert.match(js, /pendingViewFocusFolderId/);
  assert.match(js, /function focusPendingViewFolder/);
  assert.match(js, /function getFolderSort/);
  assert.match(js, /const pinnedItems = pinnedBookmarks\s*\.map/);
  assert.match(js, /const isPinnedFolder = folder ===/);
  assert.match(js, /const folderSort = isPinnedFolder \? "browser" : getFolderSort\(folderId\)/);
  assert.match(js, /currentSettings\?\.folderBookmarkOrders/);
  assert.match(js, /sortBookmarks\(items, folderSort, pinnedBookmarks, manualOrder\)/);
  assert.match(js, /draggable = true/);
  assert.match(js, /dataTransfer/);
  assert.match(js, /folderBookmarkOrders/);
  assert.match(js, /\[sourceFolderId\]: "manual"/);
  assert.doesNotMatch(js, /Cambiar orden/);
  assert.match(js, /scrollIntoView\(\{\s*behavior:\s*"smooth"/);
  assert.match(js, /classList\.add\("is-view-focus"\)/);
  assert.match(js, /data-folder-id/);
  assert.match(js, /async function checkUrl/);
  assert.match(js, /async function reviewFolderHealth/);
  assert.match(js, /textContent = t\(api, "reviewing"\)/);
  assert.match(js, /text:\s*t\(api,\s*"back"\)/);
  assert.match(js, /text:\s*t\(api,\s*"delete"\)/);
  assert.match(js, /class:\s*"link-action-button"/);
  assert.match(js, /healthUnchecked/);
  assert.match(js, /if \(!bookmark\.linkHealth\?\.lastCheckedAt\)/);
  assert.match(js, /const healthDetails = !health/);
  assert.match(js, /function isFirefoxRuntime/);
  assert.match(js, /function getBrowserFaviconUrl/);
  assert.match(js, /function getRootFaviconUrl/);
  assert.match(js, /getRootFaviconUrl\(url\)/);
  assert.match(js, /dataset\.faviconFallbackIndex/);
  assert.match(js, /capturedPreviews\[bookmark\.id\]/);
  assert.match(js, /function openBookmarkFromMartabs/);
  assert.match(js, /CAPTURE_OPENED_BOOKMARK/);
  assert.match(js, /api\.runtime\.sendMessage/);
  assert.match(js, /function showEditModal/);
  assert.match(js, /bookmark\.manualTags/);
  assert.match(js, /api\.bookmarks\.update\(bookmark\.id/);
  assert.match(js, /editSave\.disabled = true/);
  assert.match(js, /editSave\.disabled = false/);
  assert.match(js, /usingCustomFavicon/);
  assert.match(js, /dataset\.faviconSource/);
  assert.match(js, /contentNode\.onload = null/);
  assert.match(js, /brokenCustomFavicons/);
  assert.match(js, /const faviconWasBroken/);
  assert.match(js, /saveBookmarkError/);
  assert.doesNotMatch(js, /function renderReviewLinks/);
  assert.doesNotMatch(js, /"Revisando\.\.\."/);
  assert.doesNotMatch(js, /text:\s*"Eliminar"/);
  assert.doesNotMatch(js, /"Sin carpeta"/);
  assert.doesNotMatch(js, /ðŸ/);
  assert.doesNotMatch(js, /runManualLinkCheck/);
  assert.doesNotMatch(js, /CHECK_LINK_HEALTH_NOW/);
  assert.doesNotMatch(js, /image\.thum\.io/);
  assert.doesNotMatch(js, /icons\.duckduckgo/);
  assert.doesNotMatch(js, /Ã|Â/);
});

test("newtab folder mode change updates DOM in-place without full redraw", async () => {
  const js = await readFile("src/newtab/newtab.js", "utf8");

  assert.match(js, /function applyFolderModeClass/);
  assert.match(js, /function onlyFolderModesChanged/);

  const modeBtnIndex = js.indexOf("modeBtn.addEventListener");
  assert.ok(modeBtnIndex !== -1, "modeBtn click listener should be registered");

  const clickHandlerBlock = js.substring(modeBtnIndex, modeBtnIndex + 700);
  assert.doesNotMatch(clickHandlerBlock, /\brender\(\)/, "modeBtn click handler should not trigger render()");
  assert.match(clickHandlerBlock, /applyFolderModeClass/, "modeBtn click handler should apply folder mode class in-place");
  assert.match(clickHandlerBlock, /setStoredValue/, "modeBtn click handler should save settings");
});


test("newtab fetches topSites when enabled and filters them correctly", async () => {
  const js = await readFile("src/newtab/newtab.js", "utf8");
  assert.match(js, /if \(currentSettings\.showTopSitesFolder && api\.topSites\) {/);
  assert.match(js, /api\.topSites\.get\(\)/);
  assert.match(js, /topSites = sites/);
  assert.match(js, /\.filter\(site => !blacklist\.includes\(site\.url\)\)/);
  assert.match(js, /\.slice\(0, currentSettings\.topSitesLimit/);
});

test("newtab excludes topSites from review and hover previews", async () => {
  const js = await readFile("src/newtab/newtab.js", "utf8");
  assert.match(js, /if \(currentSettings\?\.linkHealthEnabled && !isPinnedFolder && !isTopSitesFolder\)/);
  assert.match(js, /if \(!bookmark\.isTopSite\) {[^}]*bookmarkElement\.addEventListener\("mouseenter"/);
});
