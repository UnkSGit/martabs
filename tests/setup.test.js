import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("setup page loads setup assets and required controls", async () => {
  const html = await readFile("src/setup/setup.html", "utf8");

  assert.match(html, /<html/);
  assert.match(html, /<link rel="stylesheet" href="\.\/setup\.css">/);
  assert.match(html, /class="setup-sidebar"/);
  assert.match(html, /class="setup-header-brand"/);
  assert.match(html, /class="setup-logo-img" src="\.\.\/images\/newlogo\.png"/);
  assert.match(html, /class="setup-sidebar-heading"/);
  assert.match(html, /class="setup-nav-icon"/);
  assert.match(html, /class="setup-nav-copy"/);
  assert.match(html, /id="settings-search"/);
  assert.match(html, /type="search"/);
  assert.match(html, /data-i18n-placeholder="searchSettingsPlaceholder"/);
  assert.match(html, /data-section="dashboard"/);
  assert.match(html, /data-section="appearance"/);
  assert.match(html, /data-section="features"/);
  assert.match(html, /data-section="data"/);
  assert.match(html, /data-section="advanced"/);
  assert.match(html, /id="section-dashboard"/);
  assert.match(html, /id="section-appearance"/);
  assert.match(html, /id="section-features"/);
  assert.match(html, /id="section-data"/);
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
  assert.match(css, /width: min\(1280px, calc\(100vw - 64px\)\);/);
  assert.match(css, /--setup-panel-bg:/);
  assert.match(css, /--setup-header-bg:/);
  assert.match(css, /--setup-sidebar-bg:/);
  assert.match(css, /--setup-group-bg:/);
  assert.match(css, /--setup-nav-active-bg:/);
  assert.match(css, /\.setup-search\s*{/);
  assert.match(css, /\.setup-header-brand\s*{/);
  assert.match(css, /\.setup-logo-img\s*{/);
  assert.match(css, /\.setup-content\s*{/);
  assert.match(css, /min-height: var\(--setup-content-min-height, 0px\);/);
  assert.match(css, /\.setup-sidebar\s*{/);
  assert.match(css, /\.setup-sidebar-heading\s*{/);
  assert.match(css, /\.setup-nav-button\s*{/);
  assert.match(css, /\.setup-nav-icon\s*{/);
  assert.match(css, /\.setup-nav-copy\s*{/);
  assert.match(css, /\.setup-section\s*{/);
  assert.match(css, /\.setup-section\.is-active\s*{/);
  assert.match(css, /#folders-tree-wrapper[,\s]/);
  assert.match(css, /#folders-sort-wrapper[,\s]/);
  assert.match(css, /\.folder-tree[,\s]/);
  assert.match(css, /\.selected-folders-list\s*{/);
  assert.match(css, /\.folder-tree-inline-controls\s*{/);
  assert.match(css, /\.folder-selection-scope-badge\s*{/);
  assert.doesNotMatch(css, /min-height: calc\(100vh/);
  assert.match(css, /\.setting-row[,\s]/);
  assert.match(css, /\.settings-section-grid\s*{/);
  assert.match(css, /\.settings-two-column\s*{/);
  assert.match(css, /\.settings-group\s*{/);
  assert.match(css, /\.settings-group-header\s*{/);
  assert.match(css, /\.settings-group-body\s*{/);
  assert.match(css, /\.settings-side-panel\s*{/);
  assert.match(css, /\.compact-action-button\s*{/);
  assert.match(css, /\.settings-group-actions\s*{/);
  assert.match(css, /\.settings-inline-note\s*{/);
  assert.match(css, /@media \(max-width: 760px\)/);
  assert.doesNotMatch(css, /fonts\.googleapis/);

  // Assert style cleanup on setup.html elements
  const html = await readFile("src/setup/setup.html", "utf8");
  assert.doesNotMatch(html, /id="back-to-tree-btn"[^>]*style=/);
  assert.doesNotMatch(html, /id="import-confirm-btn"[^>]*style=/);
  assert.doesNotMatch(html, /id="import-cancel-btn"[^>]*style=/);
  assert.doesNotMatch(html, /data-i18n="tabsTreeInstructions"[^>]*style=/);
  assert.doesNotMatch(html, /data-i18n="tabsDropzonesInstructions"[^>]*style=/);
});

test("setup script saves selected folders and setup completion", async () => {
  const js = await readFile("src/setup/setup.js", "utf8");

  assert.match(js, /import { getBrowserApi } from "\.\.\/shared\/browser-api\.js";/);
  assert.match(js, /getFolderOptions, getFolderSelectionIds, getFolderSelectionScope, getNextFolderSelectionScope/);
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
  assert.match(js, /folderSelectionScopes/);
  assert.match(js, /function replaceFolderSelectionScope/);
  assert.match(js, /className = "folder-selection-scope-badge"/);
  assert.match(js, /folderTreeExpandedIds/);
  assert.match(js, /folderTreeCollapsedIds/);
  assert.match(js, /tabsFolderTreeExpandedIds/);
  assert.match(js, /tabsFolderTreeCollapsedIds/);
  assert.match(js, /function captureFolderTreeExpansionState/);
  assert.match(js, /captureFolderTreeExpansionState\(\);/);
  assert.match(js, /event\.stopPropagation\(\)/);
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
  assert.doesNotMatch(html, /data-section="wallpaper"/);
  assert.doesNotMatch(html, /id="section-wallpaper"/);
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

test("setup has tabs and mapping support", async () => {
  const html = await readFile("src/setup/setup.html", "utf8");
  const css = await readFile("src/setup/setup.css", "utf8");
  const js = await readFile("src/setup/setup.js", "utf8");

  // HTML checks
  assert.doesNotMatch(html, /data-section="tabs"/);
  assert.doesNotMatch(html, /id="section-tabs"/);
  assert.match(html, /id="tabs-manager-container"/);
  assert.match(html, /id="tabs-list"/);
  assert.match(html, /id="tabs-folder-tree-container"/);
  assert.match(html, /id="tabs-dropzones-list"/);
  assert.match(html, /class="settings-group-body tabs-settings-body"/);
  assert.match(html, /class="tabs-subsection"/);
  assert.match(html, /class="tabs-subsection tabs-assignment-subsection"/);
  assert.match(html, /class="tabs-pane-header"/);
  assert.doesNotMatch(html, /class="tab-creator-form" style=/);
  assert.doesNotMatch(html, /class="tabs-drag-split-layout" style=/);

  // CSS checks
  assert.match(css, /\.tabs-list\s*{/);
  assert.match(css, /\.tabs-settings-body\s*{/);
  assert.match(css, /\.tabs-subsection\s*{/);
  assert.match(css, /\.tab-creator-form\s*{/);
  assert.match(css, /\.tabs-pane-header\s*{/);
  assert.match(css, /\.tab-item\s*{/);
  assert.match(css, /\.tabs-drag-split-layout\s*{/);
  assert.match(css, /\.tab-dropzone-card\s*{/);
  assert.match(css, /\.assigned-folder-pill\s*{/);

  // JS checks
  assert.match(js, /function renderTabs\(\)/);
  assert.match(js, /function renderFolderTabMapping\(\)/);
  assert.match(js, /function renderTabsFolderTree\(/);
  assert.match(js, /function renderTabsDropzones\(\)/);
  assert.match(js, /currentSettings\.tabs\s*=\s*\[\]/);
  assert.match(js, /currentSettings\.folderTabs\s*=\s*\{\}/);
  assert.match(js, /addTabBtn\.addEventListener/);
});

test("setup keeps stable control IDs required by setup.js", async () => {
  const html = await readFile("src/setup/setup.html", "utf8");

  const requiredIds = [
    "settings-search",
    "save",
    "folder-tree-container",
    "selected-folders-list",
    "folder-tree-search",
    "sort-columns-btn",
    "back-to-tree-btn",
    "tabs-list",
    "tabs-folder-tree-container",
    "tabs-dropzones-list",
    "default-mode-select",
    "default-sort-select",
    "theme-select",
    "language-select",
    "show-pinned-folder",
    "clean-folder-names",
    "show-view-button",
    "show-sort-button",
    "preview-enabled",
    "wallpaper-type-select",
    "wallpaper-image-container",
    "wallpaper-gradient-container",
    "link-health",
    "preview-capture",
    "frequent-sites",
    "local-stats",
    "automatic-tags",
    "manual-tags",
    "enable-pinned-shortcuts",
    "reset-local-organization",
    "clear-preview-cache",
    "export-config",
    "import-config",
    "advanced-version"
  ];

  for (const id of requiredIds) {
    assert.match(html, new RegExp(`id="${id}"`), `Missing #${id}`);
  }
});

test("setup dashboard groups folder, tab, and default view controls", async () => {
  const html = await readFile("src/setup/setup.html", "utf8");

  const dashboard = html.slice(
    html.indexOf('id="section-dashboard"'),
    html.indexOf('id="section-appearance"')
  );

  assert.match(dashboard, /id="folder-tree-container"/);
  assert.match(dashboard, /id="selected-folders-list"/);
  assert.match(dashboard, /id="tabs-list"/);
  assert.match(dashboard, /id="tabs-dropzones-list"/);
  assert.match(dashboard, /id="default-mode-select"/);
  assert.match(dashboard, /id="default-sort-select"/);
  assert.match(dashboard, /id="show-pinned-folder"/);
  assert.match(dashboard, /id="clean-folder-names"/);
  assert.match(dashboard, /id="show-view-button"/);
  assert.match(dashboard, /id="show-sort-button"/);
});

test("setup appearance groups theme language preview and wallpaper controls", async () => {
  const html = await readFile("src/setup/setup.html", "utf8");

  const appearance = html.slice(
    html.indexOf('id="section-appearance"'),
    html.indexOf('id="section-features"')
  );

  assert.match(appearance, /id="theme-select"/);
  assert.match(appearance, /id="language-select"/);
  assert.match(appearance, /id="preview-enabled"/);
  assert.match(appearance, /id="wallpaper-type-select"/);
  assert.match(appearance, /id="wallpaper-image-container"/);
  assert.match(appearance, /id="wallpaper-gradient-container"/);
  assert.doesNotMatch(html, /id="section-wallpaper"/);
});

test("setup features groups optional feature controls", async () => {
  const html = await readFile("src/setup/setup.html", "utf8");

  const features = html.slice(
    html.indexOf('id="section-features"'),
    html.indexOf('id="section-data"')
  );

  assert.match(features, /id="link-health"/);
  assert.match(features, /id="preview-capture"/);
  assert.match(features, /id="frequent-sites"/);
  assert.match(features, /id="automatic-tags"/);
  assert.match(features, /id="manual-tags"/);
  assert.match(features, /id="enable-pinned-shortcuts"/);
  assert.doesNotMatch(html, /id="section-privacy"/);
  assert.doesNotMatch(html, /id="section-tags"/);
  assert.doesNotMatch(html, /id="section-accessibility"/);
});

test("setup data groups local statistics and import export controls", async () => {
  const html = await readFile("src/setup/setup.html", "utf8");

  const dataSection = html.slice(
    html.indexOf('id="section-data"'),
    html.indexOf('id="section-advanced"')
  );

  assert.match(dataSection, /id="local-stats"/);
  assert.match(dataSection, /id="statistics-disabled-msg"/);
  assert.match(dataSection, /id="statistics-content"/);
  assert.match(dataSection, /id="download-stats"/);
  assert.match(dataSection, /id="reset-stats"/);
  assert.match(dataSection, /id="export-config"/);
  assert.match(dataSection, /id="import-config"/);
});

test("setup advanced section contains only maintenance and version controls", async () => {
  const html = await readFile("src/setup/setup.html", "utf8");

  const advanced = html.slice(
    html.indexOf('id="section-advanced"')
  );

  assert.match(advanced, /id="reset-local-organization"/);
  assert.match(advanced, /id="clear-preview-cache"/);
  assert.match(advanced, /id="advanced-version"/);
  assert.doesNotMatch(advanced, /id="export-config"/);
  assert.doesNotMatch(advanced, /id="import-config"/);
});

test("setup widgets section contains widgets activation and sub-configuration controls", async () => {
  const html = await readFile("src/setup/setup.html", "utf8");
  const js = await readFile("src/setup/setup.js", "utf8");

  // HTML checks
  assert.match(html, /id="section-widgets"/);
  assert.match(html, /id="widgets-enabled"/);
  assert.match(html, /id="widgets-style"/);
  assert.match(html, /id="widgets-config-container"/);
  assert.match(html, /id="widget-clock-enabled"/);
  assert.match(html, /id="widget-clock-format"/);
  assert.match(html, /id="widget-notes-enabled"/);
  assert.match(html, /id="widget-checklist-enabled"/);
  assert.match(html, /id="widget-weather-enabled"/);
  assert.match(html, /id="widget-sports-enabled"/);
  assert.match(html, /id="widget-sports-mode"/);
  assert.match(html, /id="widget-sports-league"/);

  // JS checks
  assert.match(js, /widgetsEnabled = document\.querySelector\("#widgets-enabled"\)/);
  assert.match(js, /widgetsStyle = document\.querySelector\("#widgets-style"\)/);
  assert.match(js, /widgetSportsMode = document\.querySelector\("#widget-sports-mode"\)/);
  assert.match(js, /widgetSportsLeague = document\.querySelector\("#widget-sports-league"\)/);
  assert.match(js, /widgets:\s*\{/);
  assert.match(js, /style:\s*widgetsStyle/);
  assert.match(js, /clock:\s*\{/);
  assert.match(js, /notes:\s*\{/);
  assert.match(js, /checklist:\s*\{/);
  assert.match(js, /weather:\s*\{/);
  assert.match(js, /sports:\s*\{/);
  assert.match(js, /mode:\s*widgetSportsMode/);
  assert.match(js, /league:\s*widgetSportsLeague/);
});

test("setup widget initialization does not redeclare sports settings", async () => {
  const files = [
    "src/setup/setup.js",
    "dist/chrome/setup/setup.js",
    "dist/firefox/setup/setup.js"
  ];

  for (const file of files) {
    const js = await readFile(file, "utf8");
    const declarations = js.match(/const sports = w\.sports \|\| \{\};/g) || [];
    assert.equal(declarations.length, 1, `${file} should declare sports settings once`);
  }
});

test("setup widgets controls use compact card styling", async () => {
  const css = await readFile("src/setup/setup.css", "utf8");

  assert.match(css, /#widgets-style-row\s*{[\s\S]*?display:\s*none\s*!important/);
  assert.match(css, /\.widgets-config-container \.switch-row\s*{/);
  assert.match(css, /\.widgets-sub-config\s*{/);
  assert.match(css, /#widget-sports-config \.setting-row\s*{/);
  assert.match(css, /#widget-sports-teams-verification \.setting-row\s*{/);
  assert.match(css, /\.sports-team-badge\s*{/);
  assert.match(css, /\.validation-status\s*{/);
});

test("setup widgets expose visual order badges and persist selection order", async () => {
  const js = await readFile("src/setup/setup.js", "utf8");
  const css = await readFile("src/setup/setup.css", "utf8");

  assert.match(js, /const WIDGET_ORDER_IDS = \["clock", "notes", "checklist", "weather", "sports"\]/);
  assert.match(js, /function normalizeWidgetOrder\(order = \[\], widgets = \{\}\)/);
  assert.match(js, /function updateWidgetOrderBadges\(\)/);
  assert.match(js, /className = "widget-order-badge"/);
  assert.match(js, /function handleWidgetOrderChange\(widgetId, checkbox\)/);
  assert.match(js, /order:\s*normalizeWidgetOrder\(currentSettings\.widgets\?\.order \|\| \[\]/);
  assert.match(js, /handleWidgetOrderChange\("clock", widgetClockEnabled\)/);
  assert.match(js, /handleWidgetOrderChange\("sports", widgetSportsEnabled\)/);

  assert.match(css, /\.widget-order-badge\s*{/);
  assert.match(css, /\.widgets-config-container \.switch-row\.has-widget-order\s*{/);
});

test("setup widgets limit uses inline warning, counter, and disabled rows", async () => {
  const html = await readFile("src/setup/setup.html", "utf8");
  const js = await readFile("src/setup/setup.js", "utf8");
  const css = await readFile("src/setup/setup.css", "utf8");

  assert.match(html, /id="widgets-counter-badge"/);
  assert.match(html, /id="widgets-limit-banner"/);
  assert.match(js, /function showWidgetsLimitWarning\(\)/);
  assert.match(js, /function updateWidgetLimitState\(\)/);
  assert.match(js, /counterBadge\.textContent = `\$\{checkedCount\}\/4/);
  assert.match(js, /row\.classList\.add\("switch-row-disabled"\)/);
  assert.doesNotMatch(js, /alert\(t\(api, "widgetsLimitReached"\)/);
  assert.match(css, /\.widgets-limit-banner\s*{/);
  assert.match(css, /\.widgets-counter-badge\s*{/);
  assert.match(css, /\.switch-row\.switch-row-disabled\s*{/);
});

test("setup weather validation messages stay readable", async () => {
  const js = await readFile("src/setup/setup.js", "utf8");
  const css = await readFile("src/setup/setup.css", "utf8");

  assert.match(js, /OK - Ubicacion verificada/);
  assert.match(js, /Pendiente de verificacion/);
  assert.match(js, /Error - Ubicacion no encontrada/);
  assert.match(js, /Error de conexion/);
  assert.doesNotMatch(js, /weatherValidationStatus\.textContent[\s\S]{0,120}[\u00d4\u251c\u00c3]/);
  assert.match(css, /\.widgets-sub-config\s*{[\s\S]*?margin:\s*8px 18px 18px 44px/);
  assert.match(css, /\.widgets-sub-config\s*{[\s\S]*?clear:\s*both/);
  assert.match(css, /\.widgets-config-container \.switch-row:has\(\+ \.widgets-sub-config\)\s*{[\s\S]*?border-bottom:\s*0/);
  assert.match(css, /\.widgets-config-container \.widgets-sub-config \+ \.switch-row\s*{[\s\S]*?border-top:\s*1px solid var\(--surface-border\)/);
});

test("setup page contains version click Easter egg implementation", async () => {
  const js = await readFile("src/setup/setup.js", "utf8");
  const css = await readFile("src/setup/setup.css", "utf8");

  assert.match(js, /function initVersionEasterEgg\(\)/);
  assert.match(js, /function triggerVersionEasterEgg\(\)/);
  assert.match(js, /versionClicks\s*>=?\s*10/);
  assert.match(js, /initVersionEasterEgg\(\)/);

  assert.match(css, /\.release-celebration-overlay\s*{/);
  assert.match(css, /\.release-celebration-title\s*{/);
  assert.match(css, /\.celebration-firework\s*{/);
  assert.match(css, /@keyframes firework-explode\s*{/);
});
