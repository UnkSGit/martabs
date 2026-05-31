import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("setup page loads setup assets and required controls", async () => {
  const html = await readFile("src/setup/setup.html", "utf8");

  assert.match(html, /<html/);
  assert.match(html, /<link rel="stylesheet" href="\.\/setup\.css">/);
  assert.match(html, /class="setup-sidebar"/);
  assert.match(html, /id="settings-search"/);
  assert.match(html, /type="search"/);
  assert.match(html, /data-i18n-placeholder="searchSettingsPlaceholder"/);
  assert.match(html, /data-section="folders"/);
  assert.match(html, /data-section="appearance"/);
  assert.match(html, /data-section="privacy"/);
  assert.match(html, /data-section="tags"/);
  assert.match(html, /data-section="advanced"/);
  assert.match(html, /id="section-folders"/);
  assert.match(html, /id="section-appearance"/);
  assert.match(html, /id="section-privacy"/);
  assert.match(html, /id="section-tags"/);
  assert.match(html, /id="section-advanced"/);
  assert.match(html, /id="folders-tree-wrapper"/);
  assert.match(html, /id="folders-sort-wrapper"/);
  assert.match(html, /id="folder-tree-container"/);
  assert.match(html, /id="selected-folders-list"/);
  assert.match(html, /id="folder-tree-search"/);
  assert.match(html, /<input id="automatic-tags" type="checkbox" checked>/);
  assert.match(html, /<input id="manual-tags" type="checkbox" checked>/);
  assert.match(html, /<input id="show-view-button" type="checkbox" checked>/);
  assert.match(html, /<input id="show-sort-button" type="checkbox" checked>/);
  assert.match(html, /<input id="preview-enabled" type="checkbox" checked>/);
  assert.match(html, /<input id="link-health" type="checkbox">/);
  assert.match(html, /<input id="preview-capture" type="checkbox">/);
  assert.match(html, /id="default-sort-select"/);
  assert.match(html, /value="manual"/);
  assert.match(html, /id="reset-local-organization"/);
  assert.match(html, /id="clear-preview-cache"/);
  assert.match(html, /id="language-select"/);
  assert.match(html, /id="save"/);
  assert.match(html, /<script type="module" src="\.\/setup\.js"><\/script>/);
});

test("setup styles include the setup shell and folder list layout", async () => {
  const css = await readFile("src/setup/setup.css", "utf8");

  assert.match(css, /\.setup-shell\s*{/);
  assert.match(css, /--surface-bg:\s*rgba\(255, 255, 255, 0\.225\);/);
  assert.match(css, /--surface-bg:\s*rgba\(24, 30, 40, 0\.72\);/);
  assert.match(css, /place-items: start center;/);
  assert.match(css, /padding: 50px 24px 24px;/);
  assert.match(css, /\.setup-panel\s*{/);
  assert.match(css, /width: min\(1160px, calc\(100vw - 48px\)\);/);
  assert.match(css, /\.setup-search\s*{/);
  assert.match(css, /\.setup-content\s*{/);
  assert.match(css, /min-height: var\(--setup-content-min-height, 0px\);/);
  assert.match(css, /\.setup-sidebar\s*{/);
  assert.match(css, /\.setup-nav-button\s*{/);
  assert.match(css, /\.setup-section\s*{/);
  assert.match(css, /\.setup-section\.is-active\s*{/);
  assert.match(css, /#folders-tree-wrapper[,\s]/);
  assert.match(css, /#folders-sort-wrapper[,\s]/);
  assert.match(css, /\.folder-tree[,\s]/);
  assert.match(css, /\.selected-folders-list\s*{/);
  assert.match(css, /\.folder-tree-inline-controls\s*{/);
  assert.doesNotMatch(css, /min-height: calc\(100vh/);
  assert.match(css, /\.setting-row[,\s]/);
  assert.match(css, /@media \(max-width: 760px\)/);
  assert.doesNotMatch(css, /fonts\.googleapis/);
});

test("setup script saves selected folders and setup completion", async () => {
  const js = await readFile("src/setup/setup.js", "utf8");

  assert.match(js, /import { getBrowserApi } from "\.\.\/shared\/browser-api\.js";/);
  assert.match(js, /import { getFolderOptions } from "\.\.\/shared\/bookmarks\.js";/);
  assert.match(js, /import { getSettings, saveSettings, setStoredValue, STORAGE_KEYS } from "\.\.\/shared\/storage\.js";/);
  assert.match(js, /api\.bookmarks\.getTree\(\)/);
  assert.match(js, /function showSection/);
  assert.match(js, /settingsSearch/);
  assert.match(js, /function syncSetupContentHeight/);
  assert.match(js, /querySelectorAll\("\.is-search-hidden"\)/);
  assert.match(js, /function normalizeSearchText/);
  assert.match(js, /function applySettingsSearch/);
  assert.match(js, /settingsSearch\.addEventListener\("input"/);
  assert.match(js, /document\.querySelectorAll\("\.setup-nav-button"\)/);
  assert.match(js, /document\.querySelectorAll\("\.setup-section"\)/);
  assert.match(js, /\.\.\.currentSettings/);
  assert.match(js, /selectedFolderIds\.length === 0/);
  assert.match(js, /api\.permissions\?\.request/);
  assert.match(js, /origins:\s*\["<all_urls>"\]/);
  assert.match(js, /function needsUrlPermission/);
  assert.match(js, /function requestUrlPermission/);
  assert.match(js, /const urlPermissionGranted = needsUrlPermission/);
  assert.match(js, /linkHealthEnabled = linkHealthRequested && urlPermissionGranted/);
  assert.match(js, /previewCaptureEnabled = previewCaptureRequested && urlPermissionGranted/);
  assert.doesNotMatch(js, /requestLinkHealthPermission/);
  assert.doesNotMatch(js, /requestPreviewCapturePermission/);
  assert.match(js, /api\.permissions\?\.remove/);
  assert.match(js, /linkHealthEnabled: linkHealthEnabled/);
  assert.match(js, /previewEnabled: previewEnabled\.checked/);
  assert.match(js, /previewCaptureEnabled: previewCaptureEnabled/);
  assert.match(js, /showViewButton: showViewButton\.checked/);
  assert.match(js, /showSortButton: showSortButton\.checked/);
  assert.match(js, /language:\s*languageSelect\.value/);
  assert.match(js, /defaultFolderSort:\s*defaultSortSelect\.value/);
  assert.match(js, /folderSorts/);
  assert.match(js, /\.folder-sort-select/);
  assert.match(js, /resetLocalOrganization/);
  assert.match(js, /bookmarkFolderOverrides:\s*\{\}/);
  assert.match(js, /folderBookmarkOrders:\s*\{\}/);
  assert.match(js, /STORAGE_KEYS\.capturedPreviews/);
  assert.match(js, /setupComplete: true/);
  assert.match(js, /saveError/);
  assert.match(js, /saveErrorNoPermissionsHealth/);
  assert.match(js, /saveErrorNoPermissionsCapture/);
});

test("setup handles topSites and localStats UI features", async () => {
  const js = await readFile("src/setup/setup.js", "utf8");
  assert.match(js, /const frequentSites = document\.querySelector\("#frequent-sites"\)/);
  assert.match(js, /const localStats = document\.querySelector\("#local-stats"\)/);
  assert.match(js, /resetTopsitesBlacklistBtn\.style\.display = "block"/);
  assert.match(js, /statisticsDisabledMsg\.style\.display = "block"/);
  assert.match(js, /function renderStatistics\(\)/);
});

test("setup styles and scripts do not contain obsolete CSS variables", async () => {
  const css = await readFile("src/setup/setup.css", "utf8");
  const js = await readFile("src/setup/setup.js", "utf8");
  const html = await readFile("src/setup/setup.html", "utf8");

  const obsoleteVariables = ["--card-bg", "--border-color", "--text-color", "--accent-color", "--hover-color"];
  for (const variable of obsoleteVariables) {
    assert.doesNotMatch(css, new RegExp(variable));
    assert.doesNotMatch(js, new RegExp(variable));
    assert.doesNotMatch(html, new RegExp(variable));
  }
});

test("setup page has custom wallpaper layout and logic", async () => {
  const html = await readFile("src/setup/setup.html", "utf8");
  const css = await readFile("src/setup/setup.css", "utf8");
  const js = await readFile("src/setup/setup.js", "utf8");

  // HTML checks
  assert.match(html, /data-section="wallpaper"/);
  assert.match(html, /id="section-wallpaper"/);
  assert.match(html, /id="wallpaper-dropzone"/);
  assert.match(html, /id="wallpaper-file-input"/);
  assert.match(html, /id="wallpaper-legibility-slider"/);
  assert.match(html, /id="wallpaper-theme-select"/);
  
  // Multi-wallpaper and new controls checks
  assert.match(html, /id="wallpaper-rotate-checkbox"/);
  assert.match(html, /id="wallpaper-brightness-slider"/);
  assert.match(html, /id="wallpaper-folder-opacity-slider"/);
  assert.match(html, /id="wallpaper-header-opacity-slider"/);
  assert.match(html, /id="theme-select-helper-note"/);
  assert.match(html, /id="wallpaper-type-select"/);
  assert.match(html, /class="wallpaper-type-segment"/);
  assert.match(html, /id="wallpaper-gradient-container"/);
  assert.match(html, /class="gradient-showcase"/);
  assert.match(html, /id="gradient-preview-canvas"/);
  assert.match(html, /class="gradient-preview-logo-img" src="\.\.\/images\/newlogo\.png"/);
  assert.match(html, /class="gradient-preview-topbar"/);
  assert.match(html, /class="gradient-preview-folder"/);
  assert.match(html, /class="gradient-preview-status" data-i18n="loadingBookmarks"/);
  assert.match(html, /data-i18n="settingsBtn">Configurar/);
  assert.match(html, /data-i18n="searchPlaceholder">Buscar titulo, etiqueta, URL o carpeta/);
  assert.match(html, /class="gradient-preset-btn"/);
  assert.match(html, /class="gradient-preset-surface"/);
  assert.match(html, /id="gradient-color-a"/);
  assert.match(html, /id="gradient-color-b"/);
  assert.match(html, /id="gradient-type-select"/);
  assert.match(html, /id="gradient-angle-slider"/);
  assert.match(html, /id="gradient-animate-checkbox"/);

  // CSS checks
  assert.match(css, /\.wallpaper-dropzone\s*{/);
  assert.match(css, /\.wallpaper-preview-img\s*{/);
  assert.match(css, /\.wallpaper-slots-grid\s*{/);
  assert.match(css, /\.wallpaper-slot-preview\s*{/);
  assert.match(css, /\.wallpaper-type-segment\s*{/);
  assert.match(css, /\.gradient-showcase\s*{/);
  assert.match(css, /\.gradient-preview-canvas\s*{/);
  assert.match(css, /\.gradient-preview-logo-img\s*{/);
  assert.match(css, /\.gradient-preview-topbar\s*{/);
  assert.match(css, /\.gradient-preview-folder\s*{/);
  assert.match(css, /\.gradient-presets-grid\s*{/);
  assert.match(css, /\.gradient-preset-btn\s*{/);
  assert.match(css, /\.gradient-preset-surface\s*{/);
  assert.match(css, /#gradient-angle-row\.is-hidden\s*{/);
  assert.match(css, /\.theme-dark\.has-custom-wallpaper \.aurora-blob\s*{/);

  // JS checks
  assert.match(js, /import { saveWallpaper, getWallpaper, deleteWallpaper } from "\.\.\/shared\/db\.js";/);
  assert.match(js, /customWallpaperEnabled:/);
  assert.match(js, /customWallpaperLegibility:/);
  assert.match(js, /customWallpaperTheme:/);
  assert.match(js, /customWallpaperSlots:/);
  assert.match(js, /customWallpaperActiveSlot:/);
  assert.match(js, /customWallpaperRotate:/);
  assert.match(js, /customWallpaperBrightness:/);
  assert.match(js, /customWallpaperFolderOpacity:/);
  assert.match(js, /customWallpaperHeaderOpacity:/);
  assert.match(js, /customWallpaperType:/);
  assert.match(js, /customWallpaperGradientConfig:/);
  assert.match(js, /updateGradientPresetHighlights/);
  assert.match(js, /setGradientAngleAvailability/);
  assert.match(js, /wallpaperType === "gradient"/);
  assert.match(js, /overlayEl\.style\.backgroundColor = `rgba\(0, 0, 0,/);
  assert.match(js, /processAndSaveImage/);
  assert.match(js, /loadWallpaperPreview/);
});


