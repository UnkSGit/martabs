import { getBrowserApi } from "../shared/browser-api.js";
import { getFolderOptions, getFolderSelectionIds, getFolderSelectionScope, getNextFolderSelectionScope } from "../shared/bookmarks.js";
import { getSettings, saveSettings, setStoredValue, STORAGE_KEYS } from "../shared/storage.js";
import { generateExportData, parseAndRemapImport } from "../shared/sync.js";
import { localizeHtml, t, initI18n, normalizeLanguageCode } from "../shared/i18n-helper.js";
import { saveWallpaper, getWallpaper, deleteWallpaper } from "../shared/db.js";

const api = getBrowserApi();
const folderTreeContainer = document.querySelector("#folder-tree-container");
const selectedFoldersList = document.querySelector("#selected-folders-list");
const folderTreeSearchInput = document.querySelector("#folder-tree-search");
const toggleAllFoldersBtn = document.querySelector("#toggle-all-folders");
const collapseAllBtn = document.querySelector("#collapse-all-btn");
const openBrowserBookmarksBtn = document.querySelector("#open-browser-bookmarks");
const firefoxBookmarksNotice = document.querySelector("#firefox-bookmarks-notice");
const sortColumnsBtn = document.querySelector("#sort-columns-btn");
const backToTreeBtn = document.querySelector("#back-to-tree-btn");
const foldersTreeWrapper = document.querySelector("#folders-tree-wrapper");
const foldersSortWrapper = document.querySelector("#folders-sort-wrapper");
const tabsList = document.querySelector("#tabs-list");
const tabsFolderTreeContainer = document.querySelector("#tabs-folder-tree-container");
const tabsDropzonesList = document.querySelector("#tabs-dropzones-list");
const newTabNameInput = document.querySelector("#new-tab-name");
const addTabBtn = document.querySelector("#add-tab-btn");
const tabsCollapseAllBtn = document.querySelector("#tabs-collapse-all-btn");

const wallpaperDropzone = document.querySelector("#wallpaper-dropzone");
const wallpaperFileInput = document.querySelector("#wallpaper-file-input");
const wallpaperUploadText = document.querySelector("#wallpaper-upload-text");
const wallpaperPreviewContainer = document.querySelector("#wallpaper-preview-container");
const wallpaperPreviewImg = document.querySelector("#wallpaper-preview-img");
const removeWallpaperBtn = document.querySelector("#remove-wallpaper-btn");
const wallpaperErrorMessage = document.querySelector("#wallpaper-error-message");
const wallpaperLegibilityRow = document.querySelector("#wallpaper-legibility-row");
const wallpaperLegibilitySlider = document.querySelector("#wallpaper-legibility-slider");
const wallpaperLegibilityValue = document.querySelector("#wallpaper-legibility-value");
const wallpaperThemeRow = document.querySelector("#wallpaper-theme-row");
const wallpaperThemeSelect = document.querySelector("#wallpaper-theme-select");

const wallpaperTypeSelect = document.querySelector("#wallpaper-type-select");
const wallpaperTypeButtons = document.querySelectorAll(".wallpaper-type-option");
const wallpaperImageContainer = document.querySelector("#wallpaper-image-container");
const wallpaperGradientContainer = document.querySelector("#wallpaper-gradient-container");

const gradientColorA = document.querySelector("#gradient-color-a");
const gradientColorB = document.querySelector("#gradient-color-b");
const gradientPreviewCanvas = document.querySelector("#gradient-preview-canvas");
const gradientTypeSelect = document.querySelector("#gradient-type-select");
const gradientAngleRow = document.querySelector("#gradient-angle-row");
const gradientAngleSlider = document.querySelector("#gradient-angle-slider");
const gradientAngleValue = document.querySelector("#gradient-angle-value");
const gradientAnimateCheckbox = document.querySelector("#gradient-animate-checkbox");

// New wallpaper controls selectors
const wallpaperRotateCheckbox = document.querySelector("#wallpaper-rotate-checkbox");
const wallpaperBrightnessSlider = document.querySelector("#wallpaper-brightness-slider");
const wallpaperBrightnessValue = document.querySelector("#wallpaper-brightness-value");
const wallpaperFolderOpacitySlider = document.querySelector("#wallpaper-folder-opacity-slider");
const wallpaperFolderOpacityValue = document.querySelector("#wallpaper-folder-opacity-value");
const wallpaperHeaderOpacitySlider = document.querySelector("#wallpaper-header-opacity-slider");
const wallpaperHeaderOpacityValue = document.querySelector("#wallpaper-header-opacity-value");
const themeSelectHelperNote = document.querySelector("#theme-select-helper-note");

let customWallpaperObjectUrl = null;
let customWallpaperObjectUrls = { 1: null, 2: null, 3: null };
const folderTreeExpandedIds = new Set();
const folderTreeCollapsedIds = new Set();
const tabsFolderTreeExpandedIds = new Set();
const tabsFolderTreeCollapsedIds = new Set();
const foldersSortActions = document.querySelector("#folders-sort-actions");
const saveButton = document.querySelector("#save");
const backButton = document.querySelector("#back-to-dashboard");
const status = document.querySelector("#status");
const setupContent = document.querySelector(".setup-content");
const settingsSearch = document.querySelector("#settings-search");
const navButtons = document.querySelectorAll(".setup-nav-button");
const sections = document.querySelectorAll(".setup-section");
const automaticTags = document.querySelector("#automatic-tags");
const manualTags = document.querySelector("#manual-tags");
const showPinnedFolder = document.querySelector("#show-pinned-folder");
const hideAllTabInput = document.querySelector("#hide-all-tab");
const showViewButton = document.querySelector("#show-view-button");
const showSortButton = document.querySelector("#show-sort-button");
const linkHealth = document.querySelector("#link-health");
const previewEnabled = document.querySelector("#preview-enabled");
const previewCapture = document.querySelector("#preview-capture");
const cleanFolderNames = document.querySelector("#clean-folder-names");
const enablePinnedShortcuts = document.querySelector("#enable-pinned-shortcuts");
const pinnedShortcutCatcher1 = document.querySelector("#pinned-shortcut-catcher-1");
const pinnedShortcutCatcher2 = document.querySelector("#pinned-shortcut-catcher-2");
let currentShortcutModifiers = ["Alt", ""];
const frequentSites = document.querySelector("#frequent-sites");
const topsitesLimit = document.querySelector("#topsites-limit");
const resetTopsitesBlacklistBtn = document.querySelector("#reset-topsites-blacklist");
const localStats = document.querySelector("#local-stats");
const statisticsDisabledMsg = document.querySelector("#statistics-disabled-msg");
const statisticsContent = document.querySelector("#statistics-content");
const goToPrivacyStatsBtn = document.querySelector("#go-to-privacy-stats");
const statsChart = document.querySelector("#stats-chart");
const storageAudit = document.querySelector("#storage-audit");
const resetStatsBtn = document.querySelector("#reset-stats");
const downloadStatsBtn = document.querySelector("#download-stats");
const defaultModeSelect = document.querySelector("#default-mode-select");
const defaultSortSelect = document.querySelector("#default-sort-select");
const themeSelect = document.querySelector("#theme-select");
const languageSelect = document.querySelector("#language-select");
const resetLocalOrganizationButton = document.querySelector("#reset-local-organization");
const clearPreviewCacheButton = document.querySelector("#clear-preview-cache");
const exportConfigButton = document.querySelector("#export-config");
const importConfigButton = document.querySelector("#import-config");
const importConfigFile = document.querySelector("#import-config-file");
const importSummary = document.querySelector("#import-summary");
const sidebarVersion = document.querySelector("#sidebar-version");
const advancedVersion = document.querySelector("#advanced-version");
let currentSettings = null;
let currentFolders = [];
let rawBookmarkTree = null;
const widgetsEnabled = document.querySelector("#widgets-enabled");
const widgetsStyle = document.querySelector("#widgets-style");
const widgetsConfigContainer = document.querySelector("#widgets-config-container");
const widgetClockEnabled = document.querySelector("#widget-clock-enabled");
const widgetClockConfig = document.querySelector("#widget-clock-config");
const widgetClockFormat = document.querySelector("#widget-clock-format");
const widgetNotesEnabled = document.querySelector("#widget-notes-enabled");
const widgetChecklistEnabled = document.querySelector("#widget-checklist-enabled");
const widgetWeatherEnabled = document.querySelector("#widget-weather-enabled");
const widgetWeatherConfig = document.querySelector("#widget-weather-config");
const widgetWeatherLabel = document.querySelector("#widget-weather-label");
const widgetWeatherQuery = document.querySelector("#widget-weather-query");
const widgetWeatherUnits = document.querySelector("#widget-weather-units");
const weatherVerifyBtn = document.querySelector("#weather-verify-btn");
const weatherValidationStatus = document.querySelector("#weather-validation-status");
const widgetSportsEnabled = document.querySelector("#widget-sports-enabled");
const widgetSportsConfig = document.querySelector("#widget-sports-config");
const widgetSportsLeague = document.querySelector("#widget-sports-league");
const widgetSportsMode = document.querySelector("#widget-sports-mode");
const widgetSportsTeamsVerification = document.querySelector("#widget-sports-teams-verification");
const widgetSportsTeamInput = document.querySelector("#widget-sports-team-input");
const widgetSportsVerifyBtn = document.querySelector("#widget-sports-verify-btn");
const sportsValidationStatus = document.querySelector("#sports-validation-status");
const sportsVerifiedList = document.querySelector("#sports-verified-list");

const SPORTS_LEAGUES = [
  { id: "soccer-esp-1", sport: "soccer", league: "esp.1", label: "Spanish LaLiga" },
  { id: "soccer-eng-1", sport: "soccer", league: "eng.1", label: "English Premier League" },
  { id: "soccer-uefa-champions", sport: "soccer", league: "uefa.champions", label: "UEFA Champions League" },
  { id: "soccer-ita-1", sport: "soccer", league: "ita.1", label: "Italian Serie A" },
  { id: "soccer-fifa-world", sport: "soccer", league: "fifa.world", label: "FIFA World Cup" },
  { id: "soccer-uefa-euro", sport: "soccer", league: "uefa.euro", label: "UEFA Euro" },
  { id: "soccer-copa-america", sport: "soccer", league: "copa.america", label: "Copa Am├®rica" },
  { id: "basketball-nba", sport: "basketball", league: "nba", label: "NBA" },
  { id: "football-nfl", sport: "football", league: "nfl", label: "NFL" }
];

let verifiedWeatherData = { verified: false };
let verifiedSportsFavorites = [];

const WIDGET_ORDER_IDS = ["clock", "notes", "checklist", "weather", "sports"];
const WIDGET_CHECKBOXES = {
  clock: widgetClockEnabled,
  notes: widgetNotesEnabled,
  checklist: widgetChecklistEnabled,
  weather: widgetWeatherEnabled,
  sports: widgetSportsEnabled
};

function normalizeWidgetOrder(order = [], widgets = {}) {
  const savedOrder = Array.isArray(order) ? order : [];
  const enabledIds = WIDGET_ORDER_IDS.filter((id) => widgets[id]?.enabled || WIDGET_CHECKBOXES[id]?.checked);
  return [
    ...savedOrder.filter((id) => enabledIds.includes(id)),
    ...enabledIds.filter((id) => !savedOrder.includes(id))
  ];
}

function updateWidgetOrderBadges() {
  const order = normalizeWidgetOrder(currentSettings?.widgets?.order || [], currentSettings?.widgets || {});
  WIDGET_ORDER_IDS.forEach((id) => {
    const checkbox = WIDGET_CHECKBOXES[id];
    const row = checkbox?.closest(".switch-row");
    if (!row) return;
    const existingBadge = row.querySelector(".widget-order-badge");
    const orderIndex = checkbox.checked ? order.indexOf(id) : -1;

    if (orderIndex < 0) {
      existingBadge?.remove();
      row.classList.remove("has-widget-order");
      return;
    }

    const badge = existingBadge || document.createElement("span");
    badge.className = "widget-order-badge";
    badge.setAttribute("aria-label", `Widget order ${orderIndex + 1}`);
    
    // Clear content safely
    badge.textContent = "";

    // Create SVG element
    const svgNS = "http://www.w3.org/2000/svg";
    const svgEl = document.createElementNS(svgNS, "svg");
    svgEl.setAttribute("class", "order-badge-icon");
    svgEl.setAttribute("viewBox", "0 0 24 24");
    svgEl.setAttribute("fill", "none");
    svgEl.setAttribute("stroke", "currentColor");
    svgEl.setAttribute("stroke-width", "2.5");
    svgEl.setAttribute("stroke-linecap", "round");
    svgEl.setAttribute("stroke-linejoin", "round");

    const lines = [
      { x1: "8", y1: "6", x2: "21", y2: "6" },
      { x1: "8", y1: "12", x2: "21", y2: "12" },
      { x1: "8", y1: "18", x2: "21", y2: "18" }
    ];
    lines.forEach(l => {
      const line = document.createElementNS(svgNS, "line");
      line.setAttribute("x1", l.x1);
      line.setAttribute("y1", l.y1);
      line.setAttribute("x2", l.x2);
      line.setAttribute("y2", l.y2);
      svgEl.appendChild(line);
    });

    const circles = [
      { cx: "3", cy: "6" },
      { cx: "3", cy: "12" },
      { cx: "3", cy: "18" }
    ];
    circles.forEach(c => {
      const circle = document.createElementNS(svgNS, "circle");
      circle.setAttribute("cx", c.cx);
      circle.setAttribute("cy", c.cy);
      circle.setAttribute("r", "1");
      svgEl.appendChild(circle);
    });

    const numberSpan = document.createElement("span");
    numberSpan.className = "order-badge-number";
    numberSpan.textContent = String(orderIndex + 1);

    badge.appendChild(svgEl);
    badge.appendChild(numberSpan);

    if (!existingBadge) {
      row.appendChild(badge);
    }
    row.classList.add("has-widget-order");
  });
}

function handleWidgetOrderChange(widgetId, checkbox) {
  if (!currentSettings.widgets) currentSettings.widgets = {};
  const existingOrder = Array.isArray(currentSettings.widgets.order) ? currentSettings.widgets.order : [];

  if (checkbox.checked) {
    currentSettings.widgets.order = existingOrder.includes(widgetId)
      ? normalizeWidgetOrder(existingOrder, currentSettings.widgets)
      : normalizeWidgetOrder([...existingOrder, widgetId], currentSettings.widgets);
  } else {
    currentSettings.widgets.order = existingOrder.filter((id) => id !== widgetId);
  }

  updateWidgetOrderBadges();
}

let warningTimeout = null;
function showWidgetsLimitWarning() {
  const banner = document.querySelector("#widgets-limit-banner");
  if (!banner) return;
  
  banner.classList.add("show");
  
  clearTimeout(warningTimeout);
  warningTimeout = setTimeout(() => {
    banner.classList.remove("show");
  }, 4000);
}

function updateWidgetLimitState() {
  const checkboxes = [
    widgetClockEnabled,
    widgetNotesEnabled,
    widgetChecklistEnabled,
    widgetWeatherEnabled,
    widgetSportsEnabled
  ].filter(Boolean);
  
  const checkedCount = checkboxes.filter(cb => cb.checked).length;
  
  // Update the text counter badge
  const counterBadge = document.querySelector("#widgets-counter-badge");
  if (counterBadge) {
    const activeText = t(api, "widgetsActiveCount") || "widgets activos";
    counterBadge.textContent = `${checkedCount}/4 ${activeText}`;
    if (checkedCount === 4) {
      counterBadge.classList.add("limit-reached");
    } else {
      counterBadge.classList.remove("limit-reached");
    }
  }

  // Update disabled state for checkboxes and switch-rows
  checkboxes.forEach(cb => {
    const row = cb.closest(".switch-row");
    if (checkedCount >= 4 && !cb.checked) {
      cb.disabled = true;
      if (row) {
        row.classList.add("switch-row-disabled");
        const tooltipText = t(api, "widgetsLimitReachedTooltip") || "Límite alcanzado";
        row.setAttribute("title", tooltipText);
      }
    } else {
      cb.disabled = false;
      if (row) {
        row.classList.remove("switch-row-disabled");
        row.removeAttribute("title");
      }
    }
  });
}

function enforceWidgetLimit(changedCheckbox) {
  if (!changedCheckbox.checked) {
    updateWidgetLimitState();
    return true;
  }
  const checkboxes = [
    widgetClockEnabled,
    widgetNotesEnabled,
    widgetChecklistEnabled,
    widgetWeatherEnabled,
    widgetSportsEnabled
  ].filter(Boolean);
  const checkedCount = checkboxes.filter(cb => cb.checked).length;
  if (checkedCount > 4) {
    changedCheckbox.checked = false;
    showWidgetsLimitWarning();
    updateWidgetLimitState();
    return false;
  }
  updateWidgetLimitState();
  return true;
}

function normalizeString(str) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function markChanged() {
  if (saveButton) {
    saveButton.disabled = false;
  }
  if (status) {
    status.textContent = t(api, "unsavedChanges");
  }
}

const topSitesPermissions = { permissions: ["topSites"] };

const urlPermissions = {
  origins: ["<all_urls>"]
};

function applyTheme(theme) {
  let resolvedTheme = theme;
  const wallpaperType = currentSettings?.customWallpaperType || (currentSettings?.customWallpaperEnabled ? "image" : "none");
  const isGradient = wallpaperType === "gradient";
  const hasImage = wallpaperType === "image" && currentSettings?.customWallpaperSlots?.length > 0;

  if (currentSettings?.customWallpaperEnabled && (hasImage || isGradient)) {
    let activeSlot = currentSettings.customWallpaperActiveSlot || 1;
    if (wallpaperType === "image" && currentSettings.customWallpaperRotate && currentSettings.customWallpaperSlots && currentSettings.customWallpaperSlots.length > 0) {
      let storedSlot = sessionStorage.getItem("selectedWallpaperSlot");
      if (storedSlot && currentSettings.customWallpaperSlots.includes(Number(storedSlot))) {
        activeSlot = Number(storedSlot);
      }
    }
    resolvedTheme = currentSettings.customWallpaperThemes?.[activeSlot] || "dark";
    if (resolvedTheme === "system") {
      resolvedTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
  }
  const root = document.documentElement;
  root.classList.remove("theme-light", "theme-dark");
  if (resolvedTheme === "light") {
    root.classList.add("theme-light");
  } else if (resolvedTheme === "dark") {
    root.classList.add("theme-dark");
  }
}

function normalizeSearchText(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function getSearchableItems(section) {
  return [
    ...section.querySelectorAll(".setting-row, .switch-row, .advanced-action")
  ];
}

function itemMatchesSearch(item, query) {
  const text = normalizeSearchText(`${item.textContent} ${item.dataset.search || ""}`);
  return text.includes(query);
}

function sectionMatchesSearch(section, query) {
  if (!query) return true;

  const sectionText = normalizeSearchText(`${section.textContent} ${section.dataset.search || ""}`);
  return sectionText.includes(query);
}

function syncSetupContentHeight() {
  if (!setupContent) return;

  const hiddenItems = [...setupContent.querySelectorAll(".is-search-hidden")];
  hiddenItems.forEach((item) => item.classList.remove("is-search-hidden"));
  sections.forEach((section) => section.classList.add("is-measuring"));
  const maxHeight = Math.max(
    0,
    ...[...sections].map((section) => section.scrollHeight)
  );
  sections.forEach((section) => section.classList.remove("is-measuring"));
  hiddenItems.forEach((item) => item.classList.add("is-search-hidden"));

  setupContent.style.setProperty("--setup-content-min-height", `${maxHeight}px`);
}

function updateActiveSearchItems(query) {
  sections.forEach((section) => {
    const isActive = section.classList.contains("is-active");
    getSearchableItems(section).forEach((item) => {
      item.classList.toggle("is-search-hidden", Boolean(query && isActive && !itemMatchesSearch(item, query)));
    });
  });
}

function showSection(sectionId) {
  navButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.section === sectionId);
  });

  sections.forEach((section) => {
    section.classList.toggle("is-active", section.dataset.section === sectionId);
  });

  if (sectionId === "dashboard" && foldersTreeWrapper && foldersSortWrapper) {
    foldersTreeWrapper.style.display = "flex";
    foldersSortWrapper.style.display = "none";
    if (foldersSortActions) foldersSortActions.style.display = "none";
    if (firefoxBookmarksNotice) firefoxBookmarksNotice.style.display = "none";
    if (sortColumnsBtn) sortColumnsBtn.style.display = "";
    if (collapseAllBtn) collapseAllBtn.style.display = "";
    if (toggleAllFoldersBtn) toggleAllFoldersBtn.style.display = "";
    if (openBrowserBookmarksBtn) openBrowserBookmarksBtn.style.display = "";
  }

  updateActiveSearchItems(normalizeSearchText(settingsSearch.value));
  syncSetupContentHeight();
}

function applySettingsSearch() {
  const query = normalizeSearchText(settingsSearch.value);
  const sectionMatches = new Map();

  sections.forEach((section) => {
    const matches = sectionMatchesSearch(section, query);
    sectionMatches.set(section.dataset.section, matches);
  });

  navButtons.forEach((button) => {
    button.classList.toggle("has-search-match", Boolean(query && sectionMatches.get(button.dataset.section)));
  });

  const activeSection = [...sections].find((section) => section.classList.contains("is-active"));
  const activeMatches = activeSection && sectionMatches.get(activeSection.dataset.section);
  const firstMatch = [...sections].find((section) => sectionMatches.get(section.dataset.section));

  if (query && firstMatch && !activeMatches) {
    showSection(firstMatch.dataset.section);
  } else {
    updateActiveSearchItems(query);
    syncSetupContentHeight();
  }
}

function getSortOptions() {
  return [
    { value: "default", text: t(api, "sortDefault") },
    { value: "browser", text: t(api, "sortBrowser") },
    { value: "manual", text: t(api, "sortManual") },
    { value: "title-asc", text: t(api, "sortTitleAsc") },
    { value: "date-newest", text: t(api, "sortDateNewest") },
    { value: "domain-asc", text: t(api, "sortDomainAsc") },
    { value: "health-broken-first", text: t(api, "sortHealthBrokenFirst") }
  ];
}

function renderFolderTree(nodes, selectedFolderIds) {
  treeContainerClear();
  
  function hasSelectedDescendant(node, ids) {
    if (!node.children) return false;
    for (const child of node.children) {
      if (ids.includes(child.id)) return true;
      if (hasSelectedDescendant(child, ids)) return true;
    }
    return false;
  }
  
  function walk(node, parentPath = []) {
    const isFolderNode = node.children && !node.url;
    if (!isFolderNode) return null;

    const nextPath = node.title ? [...parentPath, node.title] : parentPath;
    const hasChildFolders = node.children.some(child => child.children && !child.url);

    if (!node.title || node.id === "0") {
      const fragment = document.createDocumentFragment();
      for (const child of node.children) {
        const el = walk(child, nextPath);
        if (el) fragment.appendChild(el);
      }
      return fragment;
    }

    const nodeEl = document.createElement("div");
    nodeEl.className = "folder-tree-node";
    nodeEl.dataset.folderId = node.id;

    const rowEl = document.createElement("div");
    rowEl.className = "folder-tree-row";

    const defaultExpanded = parentPath.length === 0 || hasSelectedDescendant(node, selectedFolderIds);
    const isExpandedByDefault = folderTreeCollapsedIds.has(node.id)
      ? false
      : folderTreeExpandedIds.has(node.id) || defaultExpanded;

    const leftEl = document.createElement("div");
    leftEl.className = "folder-tree-row-left";

    if (hasChildFolders) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "folder-toggle-btn";
      btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>`;
      btn.setAttribute("aria-label", `${t(api, "expandCollapse")} ${node.title}`);
      btn.setAttribute("aria-expanded", isExpandedByDefault ? "true" : "false");

      btn.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        const expanded = btn.getAttribute("aria-expanded") === "true";
        const nextExpanded = !expanded;
        if (nextExpanded) {
          folderTreeExpandedIds.add(node.id);
          folderTreeCollapsedIds.delete(node.id);
        } else {
          folderTreeCollapsedIds.add(node.id);
          folderTreeExpandedIds.delete(node.id);
        }
        btn.setAttribute("aria-expanded", nextExpanded ? "true" : "false");
        childrenEl.classList.toggle("is-collapsed", expanded);
      });
      leftEl.appendChild(btn);
    } else {
      const spacer = document.createElement("div");
      spacer.className = "folder-toggle-spacer";
      leftEl.appendChild(spacer);
    }

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = node.id;
    checkbox.checked = selectedFolderIds.includes(node.id);
    checkbox.id = `folder-cb-${node.id}`;
    const selectionScope = getFolderSelectionScope(
      rawBookmarkTree || [],
      node.id,
      selectedFolderIds,
      currentSettings.folderSelectionScopes || {}
    );
    checkbox.indeterminate = checkbox.checked && (selectionScope === "branch" || selectionScope === "children");
    
    if (checkbox.checked) {
      rowEl.classList.add("is-selected");
    }
    rowEl.dataset.selectionScope = selectionScope;
    
    const fullPathString = nextPath.join(" / ");
    checkbox.setAttribute("aria-label", `${t(api, "selectFolder")} ${fullPathString}`);

    checkbox.addEventListener("click", (event) => {
      event.stopPropagation();
    });

    checkbox.addEventListener("change", () => {
      handleCheckboxChange(node.id);
    });

    leftEl.appendChild(checkbox);

    const nameSpan = document.createElement("span");
    nameSpan.className = "folder-title-text";
    
    const overrideName = (currentSettings.folderNameOverrides || {})[node.id];
    nameSpan.textContent = overrideName || node.title;
    nameSpan.title = overrideName || node.title;
    
    const scopeBadge = document.createElement("span");
    scopeBadge.className = "folder-selection-scope-badge";
    scopeBadge.textContent = getFolderScopeLabel(selectionScope);
    scopeBadge.hidden = !checkbox.checked;

    nameSpan.addEventListener("dblclick", (e) => {
      e.stopPropagation();
      nameSpan.setAttribute("contenteditable", "true");
      nameSpan.focus();
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(nameSpan);
      selection.removeAllRanges();
      selection.addRange(range);
    });

    const saveNewName = () => {
      if (!nameSpan.hasAttribute("contenteditable")) return;
      nameSpan.removeAttribute("contenteditable");
      const newName = nameSpan.textContent.trim();
      const currentOverride = (currentSettings.folderNameOverrides || {})[node.id];
      const displayName = currentOverride || node.title;

      if (newName !== displayName) {
        const overrides = { ...(currentSettings.folderNameOverrides || {}) };
        if (!newName || newName === node.title) {
          delete overrides[node.id];
        } else {
          overrides[node.id] = newName;
        }
        currentSettings.folderNameOverrides = overrides;
        saveButton.disabled = false;
        if (typeof status !== "undefined" && status) {
          status.textContent = t(api, "unsavedChanges");
        }
        const updatedPath = [...nextPath.slice(0, -1), newName || node.title].join(" / ");
        checkbox.setAttribute("aria-label", `${t(api, "selectFolder")} ${updatedPath}`);
        renderSelectedFolders();
      } else {
        nameSpan.textContent = displayName;
      }
    };

    nameSpan.addEventListener("blur", saveNewName);
    nameSpan.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        saveNewName();
      } else if (e.key === "Escape") {
        const overrideName = (currentSettings.folderNameOverrides || {})[node.id];
        nameSpan.textContent = overrideName || node.title;
        nameSpan.removeAttribute("contenteditable");
      }
    });

    leftEl.appendChild(nameSpan);
    leftEl.appendChild(scopeBadge);
    rowEl.appendChild(leftEl);

    // Controles inline (Modo y Orden) que se muestran dinámicamente
    const inlineControls = document.createElement("div");
    inlineControls.className = "folder-tree-inline-controls";

    const modeSelect = document.createElement("select");
    modeSelect.className = "folder-mode-select";
    modeSelect.dataset.folderId = node.id;
    modeSelect.setAttribute("aria-label", `${t(api, "modeDescription")} - ${overrideName || node.title}`);
    [
      { value: "default", text: t(api, "modeDefault") },
      { value: "list", text: t(api, "modeList") },
      { value: "compact", text: t(api, "modeCompact") },
      { value: "icons", text: t(api, "modeIcons") },
      { value: "icons-large", text: t(api, "modeIconsLarge") },
      { value: "quicklinks", text: t(api, "modeQuicklinks") }
    ].forEach(opt => {
      const o = document.createElement("option");
      o.value = opt.value;
      o.textContent = opt.text;
      modeSelect.appendChild(o);
    });
    modeSelect.value = (currentSettings.folderModes || {})[node.id] || "default";
    modeSelect.addEventListener("mousedown", (e) => e.stopPropagation());
    modeSelect.addEventListener("change", () => {
      const modes = { ...(currentSettings.folderModes || {}) };
      if (modeSelect.value === "default") {
        delete modes[node.id];
      } else {
        modes[node.id] = modeSelect.value;
      }
      currentSettings.folderModes = modes;
      saveButton.disabled = false;
      if (typeof status !== "undefined" && status) {
        status.textContent = t(api, "unsavedChanges");
      }
    });

    const sortSelect = document.createElement("select");
    sortSelect.className = "folder-sort-select";
    sortSelect.dataset.folderId = node.id;
    sortSelect.setAttribute("aria-label", `${t(api, "sortDescription")} - ${overrideName || node.title}`);
    getSortOptions().forEach(opt => {
      const o = document.createElement("option");
      o.value = opt.value;
      o.textContent = opt.text;
      sortSelect.appendChild(o);
    });
    sortSelect.value = (currentSettings.folderSorts || {})[node.id] || "default";
    sortSelect.addEventListener("mousedown", (e) => e.stopPropagation());
    sortSelect.addEventListener("change", () => {
      const sorts = { ...(currentSettings.folderSorts || {}) };
      if (sortSelect.value === "default") {
        delete sorts[node.id];
      } else {
        sorts[node.id] = sortSelect.value;
      }
      currentSettings.folderSorts = sorts;
      saveButton.disabled = false;
      if (typeof status !== "undefined" && status) {
        status.textContent = t(api, "unsavedChanges");
      }
    });

    inlineControls.append(modeSelect, sortSelect);
    rowEl.appendChild(inlineControls);
    nodeEl.appendChild(rowEl);

    let childrenEl = null;
    if (node.children && node.children.length > 0) {
      childrenEl = document.createElement("div");
      childrenEl.className = "folder-tree-children" + (isExpandedByDefault ? "" : " is-collapsed");

      let childCount = 0;
      for (const child of node.children) {
        const el = walk(child, nextPath);
        if (el) {
          childrenEl.appendChild(el);
          childCount++;
        }
      }

      if (childCount > 0) {
        nodeEl.appendChild(childrenEl);
      }
    }

    return nodeEl;
  }

  const fragment = document.createDocumentFragment();
  for (const node of nodes) {
    const el = walk(node);
    if (el) fragment.appendChild(el);
  }
  folderTreeContainer.appendChild(fragment);
}

function treeContainerClear() {
  if (folderTreeContainer) {
    folderTreeContainer.innerHTML = "";
  }
}

function getFolderScopeLabel(scope) {
  if (scope === "branch") return t(api, "folderSelectionScopeBranch") || "Rama";
  if (scope === "children") return t(api, "folderSelectionScopeChildren") || "Hijos";
  if (scope === "self") return t(api, "folderSelectionScopeSelf") || "Solo";
  return "";
}

function captureFolderTreeExpansionState() {
  if (!folderTreeContainer) return;

  folderTreeContainer.querySelectorAll(".folder-tree-node").forEach(node => {
    const folderId = node.dataset.folderId;
    const toggle = node.querySelector(":scope > .folder-tree-row .folder-toggle-btn");
    if (!folderId || !toggle) return;

    const isExpanded = toggle.getAttribute("aria-expanded") === "true";
    if (isExpanded) {
      folderTreeExpandedIds.add(folderId);
      folderTreeCollapsedIds.delete(folderId);
    } else {
      folderTreeCollapsedIds.add(folderId);
      folderTreeExpandedIds.delete(folderId);
    }
  });
}

function replaceFolderSelectionScope(folderId, nextScope) {
  const selectedIds = new Set(currentSettings.selectedFolderIds || []);
  const affectedIds = getFolderSelectionIds(rawBookmarkTree || [], folderId, "branch");
  const nextIds = getFolderSelectionIds(rawBookmarkTree || [], folderId, nextScope);
  const scopes = { ...(currentSettings.folderSelectionScopes || {}) };

  affectedIds.forEach(id => selectedIds.delete(id));
  nextIds.forEach(id => selectedIds.add(id));

  if (nextScope === "none") {
    delete scopes[folderId];
  } else {
    scopes[folderId] = nextScope;
  }

  currentSettings.folderSelectionScopes = scopes;
  currentSettings.selectedFolderIds = [...selectedIds];
}

function handleCheckboxChange(folderId, isChecked) {
  captureFolderTreeExpansionState();
  const nextScope = getNextFolderSelectionScope(
    rawBookmarkTree || [],
    folderId,
    currentSettings.selectedFolderIds || [],
    currentSettings.folderSelectionScopes || {}
  );
  replaceFolderSelectionScope(folderId, nextScope);
  saveButton.disabled = false;
  if (typeof status !== "undefined" && status) {
    status.textContent = t(api, "unsavedChanges");
  }
  renderFolders(
    currentFolders,
    currentSettings.selectedFolderIds,
    currentSettings.folderModes || {},
    currentSettings.folderSorts || {}
  );
  renderSelectedFolders();
}

function renderSelectedFolders() {
  if (!selectedFoldersList) return;
  selectedFoldersList.innerHTML = "";

  const selectedFolderIds = currentSettings.selectedFolderIds || [];
  
  if (selectedFolderIds.length === 0) {
    const emptyMsg = document.createElement("div");
    emptyMsg.style.padding = "24px 12px";
    emptyMsg.style.textAlign = "center";
    emptyMsg.style.color = "var(--text-secondary)";
    emptyMsg.style.fontSize = "13px";
    emptyMsg.textContent = t(api, "noFoldersSelected");
    selectedFoldersList.appendChild(emptyMsg);
    return;
  }

  let draggedItem = null;

  selectedFolderIds.forEach(id => {
    const folder = currentFolders.find(f => f.id === id);
    if (!folder) return;

    const itemEl = document.createElement("div");
    itemEl.className = "selected-folder-item";
    itemEl.draggable = true;
    itemEl.dataset.folderId = id;

    itemEl.addEventListener("dragstart", function(e) {
      draggedItem = this;
      setTimeout(() => this.classList.add("is-dragging"), 0);
    });

    itemEl.addEventListener("dragend", function() {
      draggedItem = null;
      this.classList.remove("is-dragging");

      const newOrder = [...selectedFoldersList.querySelectorAll(".selected-folder-item")].map(el => el.dataset.folderId);
      currentSettings.selectedFolderIds = newOrder;
      saveButton.disabled = false;
      if (typeof status !== "undefined" && status) {
        status.textContent = t(api, "unsavedChanges");
      }
    });

    itemEl.addEventListener("dragover", function(e) {
      e.preventDefault();
      if (draggedItem && this !== draggedItem) {
        const bounding = this.getBoundingClientRect();
        const offset = bounding.y + (bounding.height / 2);
        if (e.clientY - offset > 0) {
          this.after(draggedItem);
        } else {
          this.before(draggedItem);
        }
      }
    });

    const dragHandle = document.createElement("div");
    dragHandle.className = "drag-handle";
    dragHandle.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="9" y1="5" x2="15" y2="5"></line><line x1="9" y1="9" x2="15" y2="9"></line><line x1="9" y1="13" x2="15" y2="13"></line><line x1="9" y1="17" x2="15" y2="17"></line></svg>`;
    
    const srSpan = document.createElement("span");
    srSpan.className = "sr-only";
    srSpan.textContent = t(api, "dragToReorder");
    dragHandle.appendChild(srSpan);
    itemEl.appendChild(dragHandle);

    const infoEl = document.createElement("div");
    infoEl.className = "selected-folder-info";

    const nameEl = document.createElement("div");
    nameEl.className = "selected-folder-name";
    const overrideName = (currentSettings.folderNameOverrides || {})[id];
    nameEl.textContent = overrideName || folder.title;
    nameEl.title = overrideName || folder.title;

    const pathEl = document.createElement("div");
    pathEl.className = "selected-folder-path";
    const pathParts = folder.path.split(" / ");
    if (pathParts.length > 1) {
      pathEl.textContent = pathParts.slice(0, -1).join(" / ");
      pathEl.title = folder.path;
    } else {
      pathEl.textContent = folder.path;
      pathEl.title = folder.path;
    }

    infoEl.append(nameEl, pathEl);
    itemEl.appendChild(infoEl);
    const orderActions = document.createElement("div");
    orderActions.className = "item-order-actions";

    const upBtn = document.createElement("button");
    upBtn.type = "button";
    upBtn.className = "order-btn up-btn";
    // "send to top" icon: horizontal bar + chevron up
    upBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="4" x2="19" y2="4"></line><polyline points="18 11 12 5 6 11"></polyline></svg>`;
    upBtn.setAttribute("aria-label", `${t(api, "moveToTop")} - ${overrideName || folder.title}`);
    upBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const firstItem = selectedFoldersList.querySelector(".selected-folder-item");
      if (firstItem && firstItem !== itemEl) {
        selectedFoldersList.prepend(itemEl);
        const newOrder = [...selectedFoldersList.querySelectorAll(".selected-folder-item")].map(el => el.dataset.folderId);
        currentSettings.selectedFolderIds = newOrder;
        saveButton.disabled = false;
        if (typeof status !== "undefined" && status) {
          status.textContent = t(api, "unsavedChanges");
        }
      }
    });

    const downBtn = document.createElement("button");
    downBtn.type = "button";
    downBtn.className = "order-btn down-btn";
    // "send to bottom" icon: chevron down + horizontal bar
    downBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 13 12 19 18 13"></polyline><line x1="5" y1="20" x2="19" y2="20"></line></svg>`;
    downBtn.setAttribute("aria-label", `${t(api, "moveToBottom")} - ${overrideName || folder.title}`);
    downBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const lastItem = selectedFoldersList.querySelector(".selected-folder-item:last-child");
      if (lastItem && lastItem !== itemEl) {
        selectedFoldersList.append(itemEl);
        const newOrder = [...selectedFoldersList.querySelectorAll(".selected-folder-item")].map(el => el.dataset.folderId);
        currentSettings.selectedFolderIds = newOrder;
        saveButton.disabled = false;
        if (typeof status !== "undefined" && status) {
          status.textContent = t(api, "unsavedChanges");
        }
      }
    });

    orderActions.append(upBtn, downBtn);
    itemEl.appendChild(orderActions);

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "folder-remove-btn";
    removeBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
    removeBtn.setAttribute("aria-label", `${t(api, "removeFolder")} ${overrideName || folder.title}`);

    removeBtn.addEventListener("click", () => {
      replaceFolderSelectionScope(id, "none");
      saveButton.disabled = false;
      if (typeof status !== "undefined" && status) {
        status.textContent = t(api, "unsavedChanges");
      }
      renderFolders(
        currentFolders,
        currentSettings.selectedFolderIds,
        currentSettings.folderModes || {},
        currentSettings.folderSorts || {}
      );
      renderSelectedFolders();
    });

    itemEl.appendChild(removeBtn);
    selectedFoldersList.appendChild(itemEl);
  });
  renderFolderTabMapping();
}

function applyFolderTreeSearch() {
  if (!folderTreeSearchInput) return;
  const query = normalizeSearchText(folderTreeSearchInput.value);
  const allNodes = document.querySelectorAll("#folder-tree-container .folder-tree-node");
  const allChildren = document.querySelectorAll("#folder-tree-container .folder-tree-children");
  const allToggleBtns = document.querySelectorAll("#folder-tree-container .folder-toggle-btn");

  if (!query) {
    allNodes.forEach(node => {
      node.style.display = "";
    });
    allChildren.forEach(children => {
      const wasCollapsed = children.getAttribute("data-was-collapsed") === "true";
      children.classList.toggle("is-collapsed", wasCollapsed);
      children.removeAttribute("data-was-collapsed");
      
      const parentNode = children.closest(".folder-tree-node");
      if (parentNode) {
        const toggleBtn = parentNode.querySelector(":scope > .folder-tree-row > .folder-toggle-btn");
        if (toggleBtn) {
          toggleBtn.setAttribute("aria-expanded", wasCollapsed ? "false" : "true");
        }
      }
    });
    return;
  }

  let hasStoredState = false;
  for (const children of allChildren) {
    if (children.hasAttribute("data-was-collapsed")) {
      hasStoredState = true;
      break;
    }
  }
  if (!hasStoredState) {
    allChildren.forEach(children => {
      const isCollapsed = children.classList.contains("is-collapsed");
      children.setAttribute("data-was-collapsed", isCollapsed ? "true" : "false");
    });
  }

  allNodes.forEach(node => {
    node.style.display = "none";
  });
  allChildren.forEach(children => {
    children.classList.add("is-collapsed");
  });
  allToggleBtns.forEach(btn => {
    btn.setAttribute("aria-expanded", "false");
  });

  const matchingRows = [];
  document.querySelectorAll("#folder-tree-container .folder-tree-row").forEach(row => {
    const titleTextEl = row.querySelector(".folder-title-text");
    if (titleTextEl) {
      const titleText = normalizeSearchText(titleTextEl.textContent);
      if (titleText.includes(query)) {
        matchingRows.push(row);
      }
    }
  });

  matchingRows.forEach(row => {
    let current = row.closest(".folder-tree-node");
    if (!current) return;
    
    current.style.display = "flex";
    
    current.querySelectorAll(".folder-tree-node").forEach(childNode => {
      childNode.style.display = "flex";
    });

    let parent = current.parentElement.closest(".folder-tree-node");
    while (parent) {
      parent.style.display = "flex";
      
      const childrenContainer = parent.querySelector(":scope > .folder-tree-children");
      if (childrenContainer) {
        childrenContainer.classList.remove("is-collapsed");
      }
      const toggleBtn = parent.querySelector(":scope > .folder-tree-row > .folder-toggle-btn");
      if (toggleBtn) {
        toggleBtn.setAttribute("aria-expanded", "true");
      }
      
      parent = parent.parentElement.closest(".folder-tree-node");
    }
  });
}

function renderFolders(folders, selectedFolderIds, folderModes = {}, folderSorts = {}) {
  if (rawBookmarkTree) {
    renderFolderTree(rawBookmarkTree, selectedFolderIds);
  }
  renderSelectedFolders();
}

function renderTabs() {
  if (!tabsList) return;
  tabsList.innerHTML = "";

  const tabs = currentSettings.tabs || [];

  if (tabs.length === 0) {
    const emptyMsg = document.createElement("div");
    emptyMsg.style.padding = "16px";
    emptyMsg.style.textAlign = "center";
    emptyMsg.style.color = "var(--text-secondary)";
    emptyMsg.style.fontSize = "13px";
    emptyMsg.textContent = t(api, "noTabsConfigured", "No tienes pestañas configuradas. Las carpetas se mostrarán juntas.");
    tabsList.appendChild(emptyMsg);
    return;
  }

  tabs.forEach((tab, index) => {
    const itemEl = document.createElement("div");
    itemEl.className = "tab-item";

    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.className = "tab-item-input";
    nameInput.value = tab.name;
    nameInput.addEventListener("change", () => {
      const newName = nameInput.value.trim();
      if (newName) {
        tab.name = newName;
        saveButton.disabled = false;
        status.textContent = t(api, "unsavedChanges");
        renderFolderTabMapping(); // Update select options
      } else {
        nameInput.value = tab.name; // revert
      }
    });

    const actionsEl = document.createElement("div");
    actionsEl.className = "tab-actions";

    // Up button (moves left)
    const upBtn = document.createElement("button");
    upBtn.type = "button";
    upBtn.className = "tab-action-btn";
    upBtn.title = t(api, "moveUp") || "Subir";
    upBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>`;
    upBtn.disabled = index === 0;
    upBtn.addEventListener("click", () => {
      if (index > 0) {
        const temp = tabs[index];
        tabs[index] = tabs[index - 1];
        tabs[index - 1] = temp;
        saveButton.disabled = false;
        status.textContent = t(api, "unsavedChanges");
        renderTabs();
        renderFolderTabMapping();
      }
    });

    // Down button (moves right)
    const downBtn = document.createElement("button");
    downBtn.type = "button";
    downBtn.className = "tab-action-btn";
    downBtn.title = t(api, "moveDown") || "Bajar";
    downBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>`;
    downBtn.disabled = index === tabs.length - 1;
    downBtn.addEventListener("click", () => {
      if (index < tabs.length - 1) {
        const temp = tabs[index];
        tabs[index] = tabs[index + 1];
        tabs[index + 1] = temp;
        saveButton.disabled = false;
        status.textContent = t(api, "unsavedChanges");
        renderTabs();
        renderFolderTabMapping();
      }
    });

    // Delete button
    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "tab-action-btn delete";
    deleteBtn.title = t(api, "delete") || "Eliminar";
    deleteBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
    deleteBtn.addEventListener("click", () => {
      const tabName = tab.name || "";
      if (confirm(t(api, "confirmDeleteTab", [tabName]) || `¿Seguro que deseas eliminar la pestaña "${tabName}"?`)) {
        const tabId = tab.id;
        if (currentSettings.folderTabs) {
          Object.keys(currentSettings.folderTabs).forEach(fid => {
            if (currentSettings.folderTabs[fid] === tabId) {
              delete currentSettings.folderTabs[fid];
            }
          });
        }
        if (currentSettings.activeTabId === tabId) {
          currentSettings.activeTabId = "all";
        }
        currentSettings.tabs = tabs.filter(t => t.id !== tabId);
        saveButton.disabled = false;
        status.textContent = t(api, "unsavedChanges");
        renderTabs();
        renderFolderTabMapping();
      }
    });

    actionsEl.appendChild(upBtn);
    actionsEl.appendChild(downBtn);
    actionsEl.appendChild(deleteBtn);

    itemEl.appendChild(nameInput);
    itemEl.appendChild(actionsEl);
    tabsList.appendChild(itemEl);
  });
}

function getMonitoredDescendants(folderId, selectedFolderIds) {
  const result = [];
  if (!rawBookmarkTree) return result;

  function findNode(nodes, targetId) {
    for (const node of nodes) {
      if (node.id === targetId) return node;
      if (node.children) {
        const found = findNode(node.children, targetId);
        if (found) return found;
      }
    }
    return null;
  }

  const rootNode = findNode(rawBookmarkTree, folderId);
  if (!rootNode || !rootNode.children) return result;

  function collectMonitored(node) {
    if (node.children) {
      for (const child of node.children) {
        const isFolder = child.children && !child.url;
        if (isFolder) {
          if (selectedFolderIds.includes(child.id)) {
            result.push(child.id);
          }
          collectMonitored(child);
        }
      }
    }
  }

  collectMonitored(rootNode);
  return result;
}

function renderFolderTabMapping() {
  const selectedFolderIds = currentSettings ? (currentSettings.selectedFolderIds || []) : [];
  if (rawBookmarkTree) {
    renderTabsFolderTree(rawBookmarkTree, selectedFolderIds);
  }
  renderTabsDropzones();
}

function renderTabsFolderTree(nodes, selectedFolderIds) {
  if (!tabsFolderTreeContainer) return;
  tabsFolderTreeContainer.innerHTML = "";

  function hasSelectedDescendant(node, ids) {
    if (!node.children) return false;
    for (const child of node.children) {
      if (ids.includes(child.id)) return true;
      if (hasSelectedDescendant(child, ids)) return true;
    }
    return false;
  }

  function walk(node, parentPath = []) {
    const isFolderNode = node.children && !node.url;
    if (!isFolderNode) return null;

    const nextPath = node.title ? [...parentPath, node.title] : parentPath;
    const isMonitored = selectedFolderIds.includes(node.id);
    const hasMonitoredDescendant = hasSelectedDescendant(node, selectedFolderIds);

    if (!isMonitored && !hasMonitoredDescendant) {
      return null;
    }

    if (!node.title || node.id === "0") {
      const fragment = document.createDocumentFragment();
      for (const child of node.children) {
        const el = walk(child, nextPath);
        if (el) fragment.appendChild(el);
      }
      return fragment;
    }

    const nodeEl = document.createElement("div");
    nodeEl.className = "folder-tree-node";
    nodeEl.dataset.folderId = node.id;
    if (!isMonitored) {
      nodeEl.classList.add("is-structural");
    }

    const rowEl = document.createElement("div");
    rowEl.className = "folder-tree-row";

    if (isMonitored) {
      rowEl.setAttribute("draggable", "true");
      
      rowEl.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", node.id);
        e.dataTransfer.effectAllowed = "move";
        rowEl.classList.add("is-dragging");
      });

      rowEl.addEventListener("dragend", () => {
        rowEl.classList.remove("is-dragging");
        document.querySelectorAll(".tab-dropzone-body").forEach(body => {
          body.classList.remove("is-dragover");
        });
      });
    }

    const leftEl = document.createElement("div");
    leftEl.className = "folder-tree-row-left";

    const hasChildFolders = node.children.some(child => {
      const isChildFolder = child.children && !child.url;
      if (!isChildFolder) return false;
      return selectedFolderIds.includes(child.id) || hasSelectedDescendant(child, selectedFolderIds);
    });
    const isExpandedByDefault = tabsFolderTreeCollapsedIds.has(node.id)
      ? false
      : tabsFolderTreeExpandedIds.has(node.id) || true;

    if (hasChildFolders) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "folder-toggle-btn";
      btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>`;
      btn.setAttribute("aria-label", `${t(api, "expandCollapse")} ${node.title}`);
      btn.setAttribute("aria-expanded", isExpandedByDefault ? "true" : "false");

      btn.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        const expanded = btn.getAttribute("aria-expanded") === "true";
        const nextExpanded = !expanded;
        if (nextExpanded) {
          tabsFolderTreeExpandedIds.add(node.id);
          tabsFolderTreeCollapsedIds.delete(node.id);
        } else {
          tabsFolderTreeCollapsedIds.add(node.id);
          tabsFolderTreeExpandedIds.delete(node.id);
        }
        btn.setAttribute("aria-expanded", nextExpanded ? "true" : "false");
        childrenEl.classList.toggle("is-collapsed", expanded);
      });
      leftEl.appendChild(btn);
    } else {
      const spacer = document.createElement("div");
      spacer.className = "folder-toggle-spacer";
      leftEl.appendChild(spacer);
    }

    const iconEl = document.createElement("span");
    iconEl.className = "folder-icon";
    iconEl.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px; vertical-align: middle; color: ${isMonitored ? "var(--primary)" : "var(--text-muted)"}"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>`;
    leftEl.appendChild(iconEl);

    const nameSpan = document.createElement("span");
    nameSpan.className = "folder-title-text";
    const overrideName = (currentSettings.folderNameOverrides || {})[node.id];
    nameSpan.textContent = overrideName || node.title;
    nameSpan.title = overrideName || node.title;
    leftEl.appendChild(nameSpan);

    rowEl.appendChild(leftEl);
    nodeEl.appendChild(rowEl);

    let childrenEl = null;
    if (node.children && node.children.length > 0) {
      childrenEl = document.createElement("div");
      childrenEl.className = "folder-tree-children" + (isExpandedByDefault ? "" : " is-collapsed");

      let childCount = 0;
      for (const child of node.children) {
        const el = walk(child, nextPath);
        if (el) {
          childrenEl.appendChild(el);
          childCount++;
        }
      }

      if (childCount > 0) {
        nodeEl.appendChild(childrenEl);
      }
    }

    return nodeEl;
  }

  const fragment = document.createDocumentFragment();
  for (const node of nodes) {
    const el = walk(node);
    if (el) fragment.appendChild(el);
  }
  tabsFolderTreeContainer.appendChild(fragment);
}

function renderTabsDropzones() {
  if (!tabsDropzonesList) return;
  tabsDropzonesList.innerHTML = "";

  const selectedFolderIds = currentSettings ? (currentSettings.selectedFolderIds || []) : [];
  if (selectedFolderIds.length === 0) {
    const emptyMsg = document.createElement("div");
    emptyMsg.style.padding = "16px";
    emptyMsg.style.textAlign = "center";
    emptyMsg.style.color = "var(--text-secondary)";
    emptyMsg.style.fontSize = "13px";
    emptyMsg.textContent = t(api, "noFoldersSelected", "No has seleccionado carpetas monitoreadas.");
    tabsDropzonesList.appendChild(emptyMsg);
    return;
  }

  const tabs = currentSettings ? (currentSettings.tabs || []) : [];
  const folderTabs = currentSettings ? (currentSettings.folderTabs || {}) : {};

  function createDropzoneCard(tabId, tabName, isDeletable = true) {
    const cardEl = document.createElement("div");
    cardEl.className = "tab-dropzone-card";
    cardEl.dataset.tabId = tabId || "";
    if (!tabId) {
      cardEl.classList.add("is-unassigned");
    }

    const headerEl = document.createElement("div");
    headerEl.className = "tab-dropzone-header";

    if (!isDeletable) {
      const titleEl = document.createElement("h5");
      titleEl.className = "tab-dropzone-title";
      titleEl.textContent = tabName;
      headerEl.appendChild(titleEl);
    } else {
      const tabIndex = tabs.findIndex(t => t.id === tabId);
      const nameInput = document.createElement("input");
      nameInput.type = "text";
      nameInput.className = "tab-item-input";
      nameInput.value = tabName;
      nameInput.style.fontWeight = "700";
      nameInput.addEventListener("change", () => {
        const newName = nameInput.value.trim();
        if (newName) {
          const tabObj = tabs.find(t => t.id === tabId);
          if (tabObj) {
            tabObj.name = newName;
            saveButton.disabled = false;
            status.textContent = t(api, "unsavedChanges");
            renderTabs();
          }
        } else {
          nameInput.value = tabName;
        }
      });
      headerEl.appendChild(nameInput);

      const actionsEl = document.createElement("div");
      actionsEl.className = "tab-actions";

      const upBtn = document.createElement("button");
      upBtn.type = "button";
      upBtn.className = "tab-action-btn";
      upBtn.title = t(api, "moveUp", "Subir");
      upBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>`;
      upBtn.disabled = tabIndex === 0;
      upBtn.addEventListener("click", () => {
        if (tabIndex > 0) {
          const temp = tabs[tabIndex];
          tabs[tabIndex] = tabs[tabIndex - 1];
          tabs[tabIndex - 1] = temp;
          saveButton.disabled = false;
          status.textContent = t(api, "unsavedChanges");
          renderTabs();
          renderFolderTabMapping();
        }
      });

      const downBtn = document.createElement("button");
      downBtn.type = "button";
      downBtn.className = "tab-action-btn";
      downBtn.title = t(api, "moveDown", "Bajar");
      downBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>`;
      downBtn.disabled = tabIndex === tabs.length - 1;
      downBtn.addEventListener("click", () => {
        if (tabIndex < tabs.length - 1) {
          const temp = tabs[tabIndex];
          tabs[tabIndex] = tabs[tabIndex + 1];
          tabs[tabIndex + 1] = temp;
          saveButton.disabled = false;
          status.textContent = t(api, "unsavedChanges");
          renderTabs();
          renderFolderTabMapping();
        }
      });

      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "tab-action-btn delete";
      deleteBtn.title = t(api, "delete", "Eliminar");
      deleteBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`;
      deleteBtn.addEventListener("click", () => {
        if (confirm(t(api, "confirmDeleteTab", [tabName], `¿Seguro que deseas eliminar la pestaña "${tabName}"?`))) {
          if (currentSettings.folderTabs) {
            Object.keys(currentSettings.folderTabs).forEach(fid => {
              if (currentSettings.folderTabs[fid] === tabId) {
                delete currentSettings.folderTabs[fid];
              }
            });
          }
          if (currentSettings.activeTabId === tabId) {
            currentSettings.activeTabId = "all";
          }
          currentSettings.tabs = tabs.filter(t => t.id !== tabId);
          saveButton.disabled = false;
          status.textContent = t(api, "unsavedChanges");
          renderTabs();
          renderFolderTabMapping();
        }
      });

      actionsEl.appendChild(upBtn);
      actionsEl.appendChild(downBtn);
      actionsEl.appendChild(deleteBtn);
      headerEl.appendChild(actionsEl);
    }

    cardEl.appendChild(headerEl);

    const bodyEl = document.createElement("div");
    bodyEl.className = "tab-dropzone-body";
    bodyEl.dataset.tabId = tabId || "";

    bodyEl.addEventListener("dragover", (e) => {
      e.preventDefault();
      bodyEl.classList.add("is-dragover");
    });

    bodyEl.addEventListener("dragenter", (e) => {
      e.preventDefault();
      bodyEl.classList.add("is-dragover");
    });

    bodyEl.addEventListener("dragleave", () => {
      bodyEl.classList.remove("is-dragover");
    });

    bodyEl.addEventListener("drop", (e) => {
      e.preventDefault();
      bodyEl.classList.remove("is-dragover");
      const folderId = e.dataTransfer.getData("text/plain");
      if (folderId && selectedFolderIds.includes(folderId)) {
        if (tabId) {
          if (!currentSettings.folderTabs) currentSettings.folderTabs = {};
          currentSettings.folderTabs[folderId] = tabId;
          
          // Cascading assignment to monitored children
          const descendants = getMonitoredDescendants(folderId, selectedFolderIds);
          descendants.forEach(descId => {
            currentSettings.folderTabs[descId] = tabId;
          });
        } else {
          if (currentSettings.folderTabs) {
            delete currentSettings.folderTabs[folderId];
            
            // Cascading unassignment for monitored children
            const descendants = getMonitoredDescendants(folderId, selectedFolderIds);
            descendants.forEach(descId => {
              delete currentSettings.folderTabs[descId];
            });
          }
        }
        saveButton.disabled = false;
        status.textContent = t(api, "unsavedChanges");
        renderFolderTabMapping();
      }
    });

    const assignedFolders = selectedFolderIds.filter(fid => {
      const fidTabId = folderTabs[fid] || "";
      return fidTabId === (tabId || "");
    });

    if (assignedFolders.length === 0) {
      const placeholderEl = document.createElement("div");
      placeholderEl.className = "tab-dropzone-placeholder";
      placeholderEl.textContent = t(api, "dragFoldersHere", "Arrastra carpetas aquí");
      bodyEl.appendChild(placeholderEl);
    } else {
      assignedFolders.forEach(fid => {
        const folder = currentFolders.find(f => f.id === fid);
        if (!folder) return;

        const overrideName = (currentSettings.folderNameOverrides || {})[fid];
        const folderTitle = overrideName || folder.title;

        const pillEl = document.createElement("div");
        pillEl.className = "assigned-folder-pill";
        pillEl.textContent = folderTitle;
        pillEl.setAttribute("draggable", "true");
        pillEl.dataset.folderId = fid;

        pillEl.addEventListener("dragstart", (e) => {
          e.dataTransfer.setData("text/plain", fid);
          e.dataTransfer.effectAllowed = "move";
          pillEl.style.opacity = "0.5";
        });

        pillEl.addEventListener("dragend", () => {
          pillEl.style.opacity = "";
          document.querySelectorAll(".tab-dropzone-body").forEach(body => {
            body.classList.remove("is-dragover");
          });
        });

        const removeBtn = document.createElement("button");
        removeBtn.type = "button";
        removeBtn.className = "assigned-folder-remove-btn";
        removeBtn.title = t(api, "unassignedTab", "Quitar de pestaña");
        removeBtn.innerHTML = "×";
        removeBtn.addEventListener("click", () => {
          if (!tabId) {
            const msg = t(api, "confirmRemoveFolderSetup", [folderTitle], `¿Seguro que deseas dejar de monitorear la carpeta "${folderTitle}"?`);
            if (confirm(msg)) {
              const checkbox = document.querySelector(`#folder-cb-${fid}`);
              if (checkbox) {
                checkbox.checked = false;
                const rowEl = checkbox.closest(".folder-tree-row");
                if (rowEl) {
                  rowEl.classList.remove("is-selected");
                }
              }
              currentSettings.selectedFolderIds = (currentSettings.selectedFolderIds || []).filter(id => id !== fid);
              if (currentSettings.folderTabs) {
                delete currentSettings.folderTabs[fid];
              }
              saveButton.disabled = false;
              status.textContent = t(api, "unsavedChanges");
              renderFolderTabMapping();
              renderSelectedFolders();
            }
          } else {
            if (currentSettings.folderTabs) {
              delete currentSettings.folderTabs[fid];
            }
            saveButton.disabled = false;
            status.textContent = t(api, "unsavedChanges");
            renderFolderTabMapping();
          }
        });

        pillEl.appendChild(removeBtn);
        bodyEl.appendChild(pillEl);
      });
    }

    cardEl.appendChild(bodyEl);
    return cardEl;
  }

  const unassignedCard = createDropzoneCard("", t(api, "foldersUnassigned", "Carpetas sin pestaña"), false);
  tabsDropzonesList.appendChild(unassignedCard);

  tabs.forEach(tab => {
    const card = createDropzoneCard(tab.id, tab.name, true);
    tabsDropzonesList.appendChild(card);
  });
}

function getSelectedFolderIds() {
  if (!selectedFoldersList) return [];
  return [...selectedFoldersList.querySelectorAll(".selected-folder-item")].map(el => el.dataset.folderId);
}

function getFolderModes() {
  const folderModes = {};
  const selectedIds = getSelectedFolderIds();
  selectedIds.forEach(id => {
    const select = document.querySelector(`.folder-mode-select[data-folder-id="${id}"]`);
    if (select && select.value !== "default") {
      folderModes[id] = select.value;
    }
  });
  return folderModes;
}

function getFolderSorts() {
  const folderSorts = {};
  const selectedIds = getSelectedFolderIds();
  selectedIds.forEach(id => {
    const select = document.querySelector(`.folder-sort-select[data-folder-id="${id}"]`);
    if (select && select.value !== "default") {
      folderSorts[id] = select.value;
    }
  });
  return folderSorts;
}

function collectSettingsFromForm(linkHealthEnabled, previewCaptureEnabled, showTopSitesFolder, localStatsEnabled) {
  return {
    ...currentSettings,
    selectedFolderIds: getSelectedFolderIds(),
    automaticTagsEnabled: automaticTags.checked,
    manualTagsEnabled: manualTags.checked,
    showPinnedFolder: showPinnedFolder.checked,
    hideAllTab: hideAllTabInput ? hideAllTabInput.checked : false,
    showViewButton: showViewButton.checked,
    showSortButton: showSortButton.checked,
    linkHealthEnabled: linkHealthEnabled,
    previewEnabled: previewEnabled.checked,
    previewCaptureEnabled: previewCaptureEnabled,
    showTopSitesFolder: showTopSitesFolder,
    topSitesLimit: Number(topsitesLimit.value),
    localStatsEnabled: localStats.checked,
    cleanFolderNames: cleanFolderNames.checked,
    enablePinnedShortcuts: enablePinnedShortcuts.checked,
    pinnedShortcutModifier: currentShortcutModifiers,
    theme: themeSelect.value,
    language: languageSelect.value,
    defaultFolderMode: defaultModeSelect.value,
    defaultFolderSort: defaultSortSelect.value,
    folderModes: getFolderModes(),
    folderSorts: getFolderSorts(),
    customWallpaperEnabled: Boolean(currentSettings.customWallpaperEnabled),
    customWallpaperSlots: currentSettings.customWallpaperSlots || [],
    customWallpaperActiveSlot: Number(currentSettings.customWallpaperActiveSlot || 1),
    customWallpaperRotate: wallpaperRotateCheckbox ? wallpaperRotateCheckbox.checked : false,
    customWallpaperBrightness: wallpaperBrightnessSlider ? Number(wallpaperBrightnessSlider.value) : 0.8,
    customWallpaperFolderOpacity: wallpaperFolderOpacitySlider ? Number(wallpaperFolderOpacitySlider.value) : 0.45,
    customWallpaperHeaderOpacity: wallpaperHeaderOpacitySlider ? Number(wallpaperHeaderOpacitySlider.value) : 0.45,
    customWallpaperThemes: currentSettings.customWallpaperThemes || {},
    customWallpaperType: currentSettings.customWallpaperType || (currentSettings.customWallpaperEnabled ? "image" : "none"),
    customWallpaperGradientConfig: currentSettings.customWallpaperGradientConfig || {
      type: "linear",
      colorA: "#ff9a9e",
      colorB: "#fecfef",
      angle: 135,
      presetId: "sunset-breeze",
      animated: false
    },
    
    // Legacy support for backward compatibility/tests
    customWallpaperLegibility: wallpaperBrightnessSlider ? 1.0 - Number(wallpaperBrightnessSlider.value) : 0.2,
    customWallpaperTheme: currentSettings.customWallpaperThemes?.[currentSettings.customWallpaperActiveSlot || 1] || "dark",
    
    widgets: {
      enabled: widgetsEnabled.checked,
      collapsed: currentSettings.widgets?.collapsed || false,
      style: widgetsStyle ? widgetsStyle.value : "standard",
      layout: currentSettings.widgets?.layout || [],
      order: normalizeWidgetOrder(currentSettings.widgets?.order || [], currentSettings.widgets),
      clock: {
        enabled: widgetClockEnabled.checked,
        format: widgetClockFormat.value
      },
      notes: {
        enabled: widgetNotesEnabled.checked
      },
      checklist: {
        enabled: widgetChecklistEnabled.checked
      },
      weather: {
        enabled: widgetWeatherEnabled.checked,
        locationLabel: widgetWeatherLabel.value.trim(),
        locationQuery: widgetWeatherQuery.value.trim(),
        latitude: verifiedWeatherData?.latitude || null,
        longitude: verifiedWeatherData?.longitude || null,
        countryCode: verifiedWeatherData?.countryCode || "",
        timezone: verifiedWeatherData?.timezone || "",
        verifiedAt: verifiedWeatherData?.verifiedAt || null,
        units: widgetWeatherUnits.value
      },
      sports: {
        enabled: widgetSportsEnabled.checked,
        mode: widgetSportsMode ? widgetSportsMode.value : "teams",
        league: widgetSportsLeague ? widgetSportsLeague.value : "soccer-esp-1",
        favorites: verifiedSportsFavorites
      }
    },
    setupComplete: true
  };
}

function needsUrlPermission(linkHealthRequested, previewCaptureRequested) {
  return linkHealthRequested || previewCaptureRequested;
}

async function requestTopSitesPermission() {
  if (!api.permissions?.request) return false;
  try { return await api.permissions.request(topSitesPermissions); } catch { return false; }
}

async function requestUrlPermission() {
  if (!api.permissions?.request) {
    return false;
  }

  try {
    return await api.permissions.request(urlPermissions);
  } catch {
    return false;
  }
}

async function removePermission(permission) {
  if (!api.permissions?.remove) {
    return false;
  }

  try {
    return await api.permissions.remove(permission);
  } catch {
    return false;
  }
}

function getSuccessMessage(linkHealthRequested, linkHealthEnabled, previewCaptureRequested, previewCaptureEnabled) {
  if (linkHealthRequested && !linkHealthEnabled) {
    return t(api, "saveErrorNoPermissionsHealth");
  }
  if (previewCaptureRequested && !previewCaptureEnabled) {
    return t(api, "saveErrorNoPermissionsCapture");
  }
  return t(api, "saveSuccess");
}

async function init() {
  const settings = await getSettings(api);
  currentSettings = settings;

  // Apply theme immediately to minimize theme visual transition delay
  themeSelect.value = currentSettings.theme || "system";
  applyTheme(themeSelect.value);

  // Load tree and i18n concurrently
  const [tree] = await Promise.all([
    api.bookmarks.getTree(),
    initI18n(api, settings.language)
  ]);
  rawBookmarkTree = tree;
  
  localizeHtml(api);
  
  const version = api.runtime.getManifest().version;
  if (sidebarVersion) sidebarVersion.textContent = `v${version}`;
  if (advancedVersion) advancedVersion.textContent = version;
  
  automaticTags.checked = currentSettings.automaticTagsEnabled !== false;
  manualTags.checked = currentSettings.manualTagsEnabled !== false;
  showPinnedFolder.checked = currentSettings.showPinnedFolder !== false;
  if (hideAllTabInput) {
    hideAllTabInput.checked = currentSettings.hideAllTab === true;
  }
  showViewButton.checked = currentSettings.showViewButton !== false;
  showSortButton.checked = currentSettings.showSortButton !== false;
  linkHealth.checked = currentSettings.linkHealthEnabled;
  previewEnabled.checked = currentSettings.previewEnabled;
  previewCapture.checked = currentSettings.previewCaptureEnabled;
  cleanFolderNames.checked = currentSettings.cleanFolderNames !== false;
  enablePinnedShortcuts.checked = currentSettings.enablePinnedShortcuts !== false;
  let mods = currentSettings.pinnedShortcutModifier;
  if (!Array.isArray(mods)) {
    mods = mods === "ctrlShift" ? ["Control", "Shift"] 
           : mods === "ctrl" ? ["Control", ""] 
           : ["Alt", ""];
  } else {
    // legacy migration if they had ["ctrl"]
    mods = mods.map(m => m === "ctrl" ? "Control" : m === "alt" ? "Alt" : m === "shift" ? "Shift" : (m || ""));
  }
  while(mods.length < 2) mods.push("");
  currentShortcutModifiers = mods.slice(0, 2);
  updateShortcutCatcherLabel();
  frequentSites.checked = currentSettings.showTopSitesFolder;
  topsitesLimit.value = settings.topSitesLimit || 8;
  
  if (currentSettings.topSitesBlacklist && currentSettings.topSitesBlacklist.length > 0) {
    resetTopsitesBlacklistBtn.style.display = "block";
  } else {
    resetTopsitesBlacklistBtn.style.display = "none";
  }

  localStats.checked = settings.localStatsEnabled !== false;

  renderStatistics();
  languageSelect.value = normalizeLanguageCode(currentSettings.language) || "system";
  defaultModeSelect.value = currentSettings.defaultFolderMode || "list";
  defaultSortSelect.value = currentSettings.defaultFolderSort || "browser";

  currentFolders = getFolderOptions(tree);
  renderFolders(
    currentFolders,
    currentSettings.selectedFolderIds,
    currentSettings.folderModes || {},
    currentSettings.folderSorts || {}
  );
  
  // Initialize multi-slot wallpaper settings
  if (wallpaperRotateCheckbox) {
    wallpaperRotateCheckbox.checked = currentSettings.customWallpaperRotate ?? false;
  }
  if (wallpaperBrightnessSlider) {
    wallpaperBrightnessSlider.value = currentSettings.customWallpaperBrightness ?? 0.8;
  }
  if (wallpaperBrightnessValue) {
    wallpaperBrightnessValue.textContent = Math.round((currentSettings.customWallpaperBrightness ?? 0.8) * 100) + "%";
  }
  if (wallpaperFolderOpacitySlider) {
    wallpaperFolderOpacitySlider.value = currentSettings.customWallpaperFolderOpacity ?? 0.45;
  }
  if (wallpaperFolderOpacityValue) {
    wallpaperFolderOpacityValue.textContent = Math.round((currentSettings.customWallpaperFolderOpacity ?? 0.45) * 100) + "%";
  }
  if (wallpaperHeaderOpacitySlider) {
    wallpaperHeaderOpacitySlider.value = currentSettings.customWallpaperHeaderOpacity ?? 0.45;
  }
  if (wallpaperHeaderOpacityValue) {
    wallpaperHeaderOpacityValue.textContent = Math.round((currentSettings.customWallpaperHeaderOpacity ?? 0.45) * 100) + "%";
  }

  // Sync legacy controls to ensure tests and backward compatibility
  const legibility = currentSettings.customWallpaperLegibility ?? 0.2;
  if (wallpaperLegibilitySlider) {
    wallpaperLegibilitySlider.value = legibility;
  }
  if (wallpaperLegibilityValue) {
    wallpaperLegibilityValue.textContent = Math.round(legibility * 200) + "%";
  }
  if (wallpaperThemeSelect) {
    wallpaperThemeSelect.value = currentSettings.customWallpaperTheme || "system";
  }

  // Sync gradient config controls
  const gradientConfig = currentSettings.customWallpaperGradientConfig || {
    type: "linear",
    colorA: "#ff9a9e",
    colorB: "#fecfef",
    angle: 135,
    presetId: "sunset-breeze",
    animated: false
  };

  if (gradientColorA) gradientColorA.value = gradientConfig.colorA || "#ff9a9e";
  if (gradientColorB) gradientColorB.value = gradientConfig.colorB || "#fecfef";
  if (gradientTypeSelect) gradientTypeSelect.value = gradientConfig.type || "linear";
  if (gradientAngleSlider) {
    gradientAngleSlider.value = gradientConfig.angle ?? 135;
    if (gradientAngleValue) {
      gradientAngleValue.textContent = (gradientConfig.angle ?? 135) + "°";
    }
  }
  if (gradientAnimateCheckbox) {
    gradientAnimateCheckbox.checked = gradientConfig.animated || false;
  }
  setGradientAngleAvailability(gradientConfig.type);
  updateGradientPresetHighlights(gradientConfig.presetId);

  await loadWallpaperPreview();
  
  // Initialize tabs state in currentSettings
  if (!currentSettings.tabs) currentSettings.tabs = [];
  if (!currentSettings.folderTabs) currentSettings.folderTabs = {};

  renderTabs();
  renderFolderTabMapping();

  if (addTabBtn) {
    addTabBtn.addEventListener("click", () => {
      const name = newTabNameInput.value.trim();
      if (!name) return;
      
      const newTab = {
        id: "tab-" + Date.now() + "-" + Math.random().toString(36).substr(2, 9),
        name: name
      };
      
      currentSettings.tabs.push(newTab);
      newTabNameInput.value = "";
      saveButton.disabled = false;
      status.textContent = t(api, "unsavedChanges");
      
      renderTabs();
      renderFolderTabMapping();
    });
  }

  if (newTabNameInput) {
    newTabNameInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (addTabBtn) addTabBtn.click();
      }
    });
  }

  if (tabsCollapseAllBtn) {
    tabsCollapseAllBtn.addEventListener("click", () => {
      if (!tabsFolderTreeContainer) return;
      tabsFolderTreeExpandedIds.clear();
      const allChildren = tabsFolderTreeContainer.querySelectorAll(".folder-tree-children");
      allChildren.forEach(children => {
        children.classList.add("is-collapsed");
        const parentNode = children.closest(".folder-tree-node");
        if (parentNode?.dataset.folderId) {
          tabsFolderTreeCollapsedIds.add(parentNode.dataset.folderId);
        }
      });
      const allToggleBtns = tabsFolderTreeContainer.querySelectorAll(".folder-toggle-btn");
      allToggleBtns.forEach(btn => {
        btn.setAttribute("aria-expanded", "false");
      });
    });
  }

  // Initialize widgets controls
  const w = currentSettings.widgets || {};
  if (widgetsEnabled) {
    widgetsEnabled.checked = w.enabled || false;
    if (widgetsConfigContainer) {
      widgetsConfigContainer.style.display = widgetsEnabled.checked ? "flex" : "none";
    }
  }
  if (widgetsStyle) {
    widgetsStyle.value = w.style || "standard";
  }



  const clock = w.clock || {};
  const notes = w.notes || {};
  const checklist = w.checklist || {};
  const weather = w.weather || {};
  const sports = w.sports || {};

  let enabledCount = [
    !!clock.enabled,
    !!notes.enabled,
    !!checklist.enabled,
    !!weather.enabled,
    !!sports.enabled
  ].filter(Boolean).length;

  if (enabledCount > 4) {
    if (sports.enabled) { sports.enabled = false; enabledCount--; }
    if (enabledCount > 4 && weather.enabled) { weather.enabled = false; enabledCount--; }
    if (enabledCount > 4 && checklist.enabled) { checklist.enabled = false; enabledCount--; }
    if (enabledCount > 4 && notes.enabled) { notes.enabled = false; enabledCount--; }
    if (enabledCount > 4 && clock.enabled) { clock.enabled = false; enabledCount--; }
  }

  if (widgetClockEnabled) {
    widgetClockEnabled.checked = clock.enabled || false;
    if (widgetClockConfig) {
      widgetClockConfig.style.display = widgetClockEnabled.checked ? "flex" : "none";
    }
  }
  if (widgetClockFormat) {
    widgetClockFormat.value = clock.format || "locale";
  }

  if (widgetNotesEnabled) {
    widgetNotesEnabled.checked = notes.enabled || false;
  }
  if (widgetChecklistEnabled) {
    widgetChecklistEnabled.checked = checklist.enabled || false;
  }
  if (widgetWeatherEnabled) {
    widgetWeatherEnabled.checked = weather.enabled || false;
    if (widgetWeatherConfig) {
      widgetWeatherConfig.style.display = widgetWeatherEnabled.checked ? "flex" : "none";
    }
  }
  if (widgetWeatherLabel) {
    widgetWeatherLabel.value = weather.locationLabel || "";
  }
  if (widgetWeatherQuery) {
    widgetWeatherQuery.value = weather.locationQuery || "";
  }
  if (widgetWeatherUnits) {
    widgetWeatherUnits.value = weather.units || "metric";
  }

  if (weather.latitude && weather.longitude) {
    verifiedWeatherData = { ...weather, verified: true };
    if (weatherValidationStatus) {
      weatherValidationStatus.textContent = `OK - Ubicacion verificada: ${weather.locationQuery}`;
      weatherValidationStatus.style.color = "var(--success-text)";
    }
  } else {
    verifiedWeatherData = { verified: false };
    if (weatherValidationStatus) {
      weatherValidationStatus.textContent = "Pendiente de verificacion";
      weatherValidationStatus.style.color = "var(--warning-text)";
    }
  }

  if (widgetSportsEnabled) {
    widgetSportsEnabled.checked = sports.enabled || false;
    if (widgetSportsConfig) {
      widgetSportsConfig.style.display = widgetSportsEnabled.checked ? "flex" : "none";
    }
  }

  if (widgetSportsMode) {
    widgetSportsMode.value = sports.mode || "teams";
  }
  if (widgetSportsLeague) {
    widgetSportsLeague.value = sports.league || "soccer-esp-1";
  }
  if (widgetSportsTeamsVerification) {
    widgetSportsTeamsVerification.style.display = (widgetSportsEnabled && widgetSportsEnabled.checked && widgetSportsMode && widgetSportsMode.value === "teams") ? "flex" : "none";
  }

  verifiedSportsFavorites = Array.isArray(sports.favorites) ? sports.favorites : [];
  renderVerifiedSportsFavorites();
  updateWidgetOrderBadges();
  updateWidgetLimitState();
  applySettingsSearch();
}

// Widget event listeners
if (widgetsEnabled) {
  widgetsEnabled.addEventListener("change", () => {
    if (widgetsConfigContainer) {
      widgetsConfigContainer.style.display = widgetsEnabled.checked ? "flex" : "none";
    }
  });
}

if (widgetClockEnabled) {
  widgetClockEnabled.addEventListener("change", () => {
    if (!enforceWidgetLimit(widgetClockEnabled)) {
      if (widgetClockConfig) widgetClockConfig.style.display = "none";
      return;
    }
    handleWidgetOrderChange("clock", widgetClockEnabled);
    if (widgetClockConfig) {
      widgetClockConfig.style.display = widgetClockEnabled.checked ? "flex" : "none";
    }
  });
}

if (widgetNotesEnabled) {
  widgetNotesEnabled.addEventListener("change", () => {
    if (enforceWidgetLimit(widgetNotesEnabled)) {
      handleWidgetOrderChange("notes", widgetNotesEnabled);
    }
  });
}

if (widgetChecklistEnabled) {
  widgetChecklistEnabled.addEventListener("change", () => {
    if (enforceWidgetLimit(widgetChecklistEnabled)) {
      handleWidgetOrderChange("checklist", widgetChecklistEnabled);
    }
  });
}

async function handleWidgetPermissionRequest(checkbox, origins) {
  if (!checkbox.checked) return true;
  if (!api.permissions?.request) return true;
  try {
    const granted = await api.permissions.request({ origins });
    if (!granted) {
      checkbox.checked = false;
      return false;
    }
    return true;
  } catch (err) {
    console.error("Failed to request permission:", err);
    checkbox.checked = false;
    return false;
  }
}

if (widgetWeatherEnabled) {
  widgetWeatherEnabled.addEventListener("change", async () => {
    if (!enforceWidgetLimit(widgetWeatherEnabled)) {
      if (widgetWeatherConfig) widgetWeatherConfig.style.display = "none";
      return;
    }
    const success = await handleWidgetPermissionRequest(widgetWeatherEnabled, [
      "https://api.open-meteo.com/*",
      "https://geocoding-api.open-meteo.com/*"
    ]);
    if (!success) {
      handleWidgetOrderChange("weather", widgetWeatherEnabled);
      updateWidgetLimitState();
      if (widgetWeatherConfig) widgetWeatherConfig.style.display = "none";
      return;
    }
    handleWidgetOrderChange("weather", widgetWeatherEnabled);
    if (widgetWeatherConfig) {
      widgetWeatherConfig.style.display = widgetWeatherEnabled.checked && success ? "flex" : "none";
    }
  });
}

if (widgetSportsEnabled) {
  widgetSportsEnabled.addEventListener("change", async () => {
    if (!enforceWidgetLimit(widgetSportsEnabled)) {
      if (widgetSportsConfig) widgetSportsConfig.style.display = "none";
      return;
    }
    const success = await handleWidgetPermissionRequest(widgetSportsEnabled, ["https://site.api.espn.com/*"]);
    if (!success) {
      handleWidgetOrderChange("sports", widgetSportsEnabled);
      updateWidgetLimitState();
      if (widgetSportsConfig) widgetSportsConfig.style.display = "none";
      return;
    }
    handleWidgetOrderChange("sports", widgetSportsEnabled);
    if (widgetSportsConfig) {
      widgetSportsConfig.style.display = widgetSportsEnabled.checked && success ? "flex" : "none";
    }
  });
}

// Attach click listeners to all switch rows under #widgets-config-container to show the limit warning banner when clicking a disabled row
document.querySelectorAll("#widgets-config-container .switch-row").forEach(row => {
  row.addEventListener("click", (e) => {
    const cb = row.querySelector("input[type='checkbox']");
    if (cb && cb.disabled && !cb.checked) {
      e.preventDefault();
      showWidgetsLimitWarning();
    }
  });
});

// Weather Autocomplete
if (widgetWeatherQuery) {
  const weatherResults = document.querySelector("#weather-autocomplete-results");
  let debounceTimeout = null;

  widgetWeatherQuery.addEventListener("input", () => {
    clearTimeout(debounceTimeout);
    
    // Mark current location as unverified if they type manually
    if (verifiedWeatherData.verified && verifiedWeatherData.locationQuery !== widgetWeatherQuery.value.trim()) {
      verifiedWeatherData.verified = false;
      if (weatherValidationStatus) {
        weatherValidationStatus.textContent = "Pendiente de verificacion";
        weatherValidationStatus.style.color = "var(--warning-text)";
      }
      markChanged();
    }

    const query = widgetWeatherQuery.value.trim();
    if (query.length < 3) {
      if (weatherResults) {
        weatherResults.style.display = "none";
        weatherResults.innerHTML = "";
      }
      return;
    }

    debounceTimeout = setTimeout(async () => {
      try {
        const allowed = await api.permissions.contains({
          origins: ["https://geocoding-api.open-meteo.com/*"]
        });
        if (!allowed) return;

        const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`;
        const res = await fetch(url);
        const data = await res.json();
        if (!data.results || data.results.length === 0) {
          if (weatherResults) {
            weatherResults.innerHTML = `<div class="autocomplete-suggestion-item" style="color: var(--text-secondary); cursor: default;">No results found</div>`;
            weatherResults.style.display = "block";
          }
          return;
        }

        if (weatherResults) {
          weatherResults.innerHTML = "";
          data.results.forEach(item => {
            const country = item.country ? `, ${item.country}` : "";
            const admin1 = item.admin1 ? `, ${item.admin1}` : "";
            const displayText = `${item.name}${admin1}${country}`;
            const div = document.createElement("div");
            div.className = "autocomplete-suggestion-item";
            div.textContent = displayText;
            div.addEventListener("click", () => {
              widgetWeatherLabel.value = item.name;
              widgetWeatherQuery.value = displayText;
              weatherResults.style.display = "none";
              
              // Immediately mark as verified since it was selected from autocomplete
              verifiedWeatherData = {
                enabled: widgetWeatherEnabled.checked,
                locationQuery: displayText,
                locationLabel: item.name,
                latitude: item.latitude,
                longitude: item.longitude,
                countryCode: item.country_code || "",
                timezone: item.timezone || "Europe/London",
                verifiedAt: Date.now(),
                verified: true
              };
              if (weatherValidationStatus) {
                weatherValidationStatus.textContent = `OK - Ubicacion seleccionada: ${displayText}`;
                weatherValidationStatus.style.color = "var(--success-text)";
              }
              markChanged();
            });
            weatherResults.appendChild(div);
          });
          weatherResults.style.display = "block";
        }
      } catch (err) {
        console.error("Geocoding fetch failed", err);
      }
    }, 400);
  });

  document.addEventListener("click", (e) => {
    if (weatherResults && !widgetWeatherQuery.contains(e.target) && !weatherResults.contains(e.target)) {
      weatherResults.style.display = "none";
    }
  });
}

if (weatherVerifyBtn) {
  weatherVerifyBtn.addEventListener("click", async () => {
    const success = await handleWidgetPermissionRequest(widgetWeatherEnabled, [
      "https://api.open-meteo.com/*",
      "https://geocoding-api.open-meteo.com/*"
    ]);
    if (!success) return;

    const query = widgetWeatherQuery.value.trim();
    if (!query) {
      if (weatherValidationStatus) {
        weatherValidationStatus.textContent = "Escribe una ubicacion";
        weatherValidationStatus.style.color = "var(--warning-text)";
      }
      return;
    }
    if (weatherValidationStatus) {
      weatherValidationStatus.textContent = "Verificando ubicacion...";
      weatherValidationStatus.style.color = "var(--text-secondary)";
    }
    try {
      const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`;
      const res = await fetch(url);
      const data = await res.json();
      if (!data.results || data.results.length === 0) {
        if (weatherValidationStatus) {
          weatherValidationStatus.textContent = "Error - Ubicacion no encontrada";
          weatherValidationStatus.style.color = "var(--warning-text)";
        }
        verifiedWeatherData.verified = false;
        return;
      }
      const item = data.results[0];
      const country = item.country ? `, ${item.country}` : "";
      const admin1 = item.admin1 ? `, ${item.admin1}` : "";
      const fullName = `${item.name}${admin1}${country}`;
      
      verifiedWeatherData = {
        enabled: widgetWeatherEnabled.checked,
        locationQuery: query,
        locationLabel: widgetWeatherLabel.value.trim() || item.name,
        latitude: item.latitude,
        longitude: item.longitude,
        countryCode: item.country_code || "",
        timezone: item.timezone || "Europe/London",
        verifiedAt: Date.now(),
        verified: true
      };
      
      if (!widgetWeatherLabel.value.trim()) {
        widgetWeatherLabel.value = item.name;
      }
      
      if (weatherValidationStatus) {
        weatherValidationStatus.textContent = `OK - Ubicacion verificada: ${fullName}`;
        weatherValidationStatus.style.color = "var(--success-text)";
      }
      markChanged();
    } catch (err) {
      console.error(err);
      if (weatherValidationStatus) {
        weatherValidationStatus.textContent = "Error de conexion";
        weatherValidationStatus.style.color = "var(--warning-text)";
      }
    }
  });
}

if (widgetSportsVerifyBtn) {
  widgetSportsVerifyBtn.addEventListener("click", async () => {
    const success = await handleWidgetPermissionRequest(widgetSportsEnabled, ["https://site.api.espn.com/*"]);
    if (!success) return;

    const query = widgetSportsTeamInput.value.trim();
    if (!query) {
      if (sportsValidationStatus) {
        sportsValidationStatus.textContent = "Escribe el nombre de un equipo";
        sportsValidationStatus.style.color = "var(--warning-text)";
      }
      return;
    }
    
    const selectedLeagueId = widgetSportsLeague.value;
    const leagueInfo = SPORTS_LEAGUES.find(l => l.id === selectedLeagueId);
    if (!leagueInfo) return;
    
    if (sportsValidationStatus) {
      sportsValidationStatus.textContent = "Verificando equipo...";
      sportsValidationStatus.style.color = "var(--text-secondary)";
    }
    
    try {
      const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/${leagueInfo.sport}/${leagueInfo.league}/teams`);
      const data = await res.json();
      if (!data.sports || !data.sports[0] || !data.sports[0].leagues || !data.sports[0].leagues[0]) {
        if (sportsValidationStatus) {
          sportsValidationStatus.textContent = "Ô£ù Error al consultar ESPN";
          sportsValidationStatus.style.color = "var(--warning-text)";
        }
        return;
      }
      
      const teams = data.sports[0].leagues[0].teams || [];
      const cleanQuery = normalizeString(query);
      const matches = [];
      
      teams.forEach(t => {
        const team = t.team;
        if (!team) return;
        const name = normalizeString(team.name || "");
        const displayName = normalizeString(team.displayName || "");
        const shortDisplayName = normalizeString(team.shortDisplayName || "");
        const abbreviation = normalizeString(team.abbreviation || "");
        
        if (name === cleanQuery || displayName === cleanQuery || shortDisplayName === cleanQuery || abbreviation === cleanQuery) {
          matches.push(team);
        }
      });
      
      if (matches.length === 0) {
        teams.forEach(t => {
          const team = t.team;
          if (!team) return;
          const displayName = normalizeString(team.displayName || "");
          if (displayName.includes(cleanQuery)) {
            matches.push(team);
          }
        });
      }
      
      if (matches.length === 0) {
        if (sportsValidationStatus) {
          sportsValidationStatus.textContent = `Ô£ù Equipo no encontrado en ${leagueInfo.label}`;
          sportsValidationStatus.style.color = "var(--warning-text)";
        }
        return;
      }
      
      if (matches.length > 1) {
        if (sportsValidationStatus) {
          sportsValidationStatus.textContent = "Coincidencias m├║ltiples. S├® m├ís espec├¡fico.";
          sportsValidationStatus.style.color = "var(--warning-text)";
        }
        return;
      }
      
      const matchedTeam = matches[0];
      const exists = verifiedSportsFavorites.some(f => f.teamId === matchedTeam.id && f.league === leagueInfo.league);
      if (exists) {
        if (sportsValidationStatus) {
          sportsValidationStatus.textContent = "El equipo ya est├í en la lista.";
          sportsValidationStatus.style.color = "var(--warning-text)";
        }
        return;
      }
      
      verifiedSportsFavorites.push({
        sport: leagueInfo.sport,
        league: leagueInfo.league,
        leagueLabel: leagueInfo.label,
        teamId: matchedTeam.id,
        teamName: matchedTeam.displayName,
        teamAbbreviation: matchedTeam.abbreviation,
        verifiedQuery: query,
        verifiedAt: Date.now()
      });
      
      widgetSportsTeamInput.value = "";
      if (sportsValidationStatus) {
        sportsValidationStatus.textContent = `Ô£ô Equipo agregado: ${matchedTeam.displayName}`;
        sportsValidationStatus.style.color = "var(--success-text)";
      }
      
      renderVerifiedSportsFavorites();
      markChanged();
    } catch (err) {
      console.error(err);
      if (sportsValidationStatus) {
        sportsValidationStatus.textContent = "Error al conectar con ESPN API";
        sportsValidationStatus.style.color = "var(--warning-text)";
      }
    }
  });
}

function renderVerifiedSportsFavorites() {
  if (!sportsVerifiedList) return;
  sportsVerifiedList.innerHTML = "";
  verifiedSportsFavorites.forEach((fav, index) => {
    const badge = document.createElement("span");
    badge.className = "sports-team-badge";
    badge.textContent = `${fav.teamName} (${fav.leagueLabel || fav.league}) `;
    
    const removeBtn = document.createElement("span");
    removeBtn.className = "remove-btn";
    removeBtn.textContent = "Ô£ò";
    removeBtn.style.cursor = "pointer";
    removeBtn.style.marginLeft = "6px";
    removeBtn.style.fontWeight = "bold";
    removeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      verifiedSportsFavorites.splice(index, 1);
      renderVerifiedSportsFavorites();
      markChanged();
    });
    
    badge.appendChild(removeBtn);
    sportsVerifiedList.appendChild(badge);
  });
}

navButtons.forEach((button) => {
  button.addEventListener("click", () => {
    showSection(button.dataset.section);
  });
});

themeSelect.addEventListener("change", () => {
  applyTheme(themeSelect.value);
});

settingsSearch.addEventListener("input", applySettingsSearch);
window.addEventListener("resize", syncSetupContentHeight);

async function loadWallpaperPreview() {
  // Clear any existing object URLs to avoid memory leaks
  for (let s = 1; s <= 3; s++) {
    if (customWallpaperObjectUrls[s]) {
      URL.revokeObjectURL(customWallpaperObjectUrls[s]);
      customWallpaperObjectUrls[s] = null;
    }
    const imgEl = document.querySelector(`#wallpaper-slot-img-${s}`);
    const previewEl = document.querySelector(`#wallpaper-slot-preview-${s}`);
    if (imgEl && previewEl) {
      imgEl.src = "";
      imgEl.style.display = "none";
      const emptyEl = previewEl.querySelector(".wallpaper-slot-empty");
      if (emptyEl) emptyEl.style.display = "flex";
      previewEl.classList.remove("has-image");
    }
  }

  // Determine wallpaper type (fallback if undefined)
  if (!currentSettings.customWallpaperType) {
    currentSettings.customWallpaperType = currentSettings.customWallpaperEnabled ? "image" : "none";
  }

  const wallpaperType = currentSettings.customWallpaperType;

  if (wallpaperTypeSelect) {
    wallpaperTypeSelect.value = wallpaperType;
  }
  updateWallpaperTypeButtons(wallpaperType);

  const hasImageWallpaper = wallpaperType === "image" && currentSettings.customWallpaperSlots && currentSettings.customWallpaperSlots.length > 0;
  const isGradientWallpaper = wallpaperType === "gradient";
  const hasWallpaper = (currentSettings.customWallpaperEnabled && hasImageWallpaper) || isGradientWallpaper;

  if (hasImageWallpaper) {
    for (const slot of currentSettings.customWallpaperSlots) {
      try {
        const blob = await getWallpaper(slot);
        if (blob) {
          const url = URL.createObjectURL(blob);
          customWallpaperObjectUrls[slot] = url;
          
          const imgEl = document.querySelector(`#wallpaper-slot-img-${slot}`);
          const previewEl = document.querySelector(`#wallpaper-slot-preview-${slot}`);
          if (imgEl && previewEl) {
            imgEl.src = url;
            imgEl.style.display = "block";
            const emptyEl = previewEl.querySelector(".wallpaper-slot-empty");
            if (emptyEl) emptyEl.style.display = "none";
            previewEl.classList.add("has-image");
          }
          
          // Populating legacy element preview for slot 1 to satisfy tests
          if (slot === 1 && wallpaperPreviewImg) {
            wallpaperPreviewImg.src = url;
            if (wallpaperPreviewContainer) wallpaperPreviewContainer.style.display = "flex";
          }
        }
      } catch (err) {
        console.error(`Failed to load wallpaper preview for slot ${slot}`, err);
      }
    }
  }

  // Toggle container visibility
  if (wallpaperImageContainer) {
    wallpaperImageContainer.style.display = wallpaperType === "image" ? "grid" : "none";
  }
  if (wallpaperGradientContainer) {
    wallpaperGradientContainer.style.display = wallpaperType === "gradient" ? "grid" : "none";
  }
  updateGradientShowcase();

  if (hasWallpaper) {
    // Display our detailed options rows
    if (document.querySelector("#wallpaper-rotate-row")) {
      document.querySelector("#wallpaper-rotate-row").style.display = wallpaperType === "image" ? "flex" : "none";
    }
    if (document.querySelector("#wallpaper-brightness-row")) document.querySelector("#wallpaper-brightness-row").style.display = "flex";
    if (document.querySelector("#wallpaper-folder-opacity-row")) document.querySelector("#wallpaper-folder-opacity-row").style.display = "flex";
    if (document.querySelector("#wallpaper-header-opacity-row")) document.querySelector("#wallpaper-header-opacity-row").style.display = "flex";
    
    // Display legacy rows to satisfy tests
    if (wallpaperLegibilityRow) wallpaperLegibilityRow.style.display = "flex";
    if (wallpaperThemeRow) wallpaperThemeRow.style.display = "flex";
    if (wallpaperUploadText) wallpaperUploadText.textContent = t(api, "customWallpaperActive") || "Fondo personalizado activo";

    // Disable main Theme selector
    if (themeSelect) themeSelect.disabled = true;
    if (themeSelectHelperNote) themeSelectHelperNote.style.display = "block";
    
    // Sync theme select dropdown
    if (wallpaperThemeSelect) {
      const configSlot = currentSettings.customWallpaperActiveSlot || 1;
      wallpaperThemeSelect.value = currentSettings.customWallpaperThemes?.[configSlot] || "system";
    }
    
    // Update setup page theme
    let activeSlot = currentSettings.customWallpaperActiveSlot || 1;
    if (wallpaperType === "image" && currentSettings.customWallpaperRotate) {
      let storedSlot = sessionStorage.getItem("selectedWallpaperSlot");
      if (storedSlot && currentSettings.customWallpaperSlots.includes(Number(storedSlot))) {
        activeSlot = Number(storedSlot);
      }
    }
    const resolvedTheme = currentSettings.customWallpaperThemes?.[activeSlot] || "dark";
    applyTheme(resolvedTheme);
  } else {
    // Hide our detailed options rows
    if (document.querySelector("#wallpaper-rotate-row")) document.querySelector("#wallpaper-rotate-row").style.display = "none";
    if (document.querySelector("#wallpaper-brightness-row")) document.querySelector("#wallpaper-brightness-row").style.display = "none";
    if (document.querySelector("#wallpaper-folder-opacity-row")) document.querySelector("#wallpaper-folder-opacity-row").style.display = "none";
    if (document.querySelector("#wallpaper-header-opacity-row")) document.querySelector("#wallpaper-header-opacity-row").style.display = "none";
    
    // Hide legacy rows to satisfy tests
    if (wallpaperPreviewContainer) wallpaperPreviewContainer.style.display = "none";
    if (wallpaperLegibilityRow) wallpaperLegibilityRow.style.display = "none";
    if (wallpaperThemeRow) wallpaperThemeRow.style.display = "none";
    if (wallpaperUploadText) wallpaperUploadText.textContent = t(api, "uploadWallpaperText");

    // Enable main Theme selector
    if (themeSelect) themeSelect.disabled = false;
    if (themeSelectHelperNote) themeSelectHelperNote.style.display = "none";
    if (themeSelect) applyTheme(themeSelect.value);
  }
  
  updateSlotHighlights();
  applyLiveSetupPreview();
}

function updateSlotHighlights() {
  for (let s = 1; s <= 3; s++) {
    const previewEl = document.querySelector(`#wallpaper-slot-preview-${s}`);
    if (!previewEl) continue;
    
    previewEl.classList.remove("is-active");
    
    const hasImage = currentSettings.customWallpaperSlots && currentSettings.customWallpaperSlots.includes(s);
    if (hasImage) {
      if (currentSettings.customWallpaperRotate) {
        previewEl.classList.add("is-active");
      } else {
        if (currentSettings.customWallpaperActiveSlot === s) {
          previewEl.classList.add("is-active");
        }
      }
    }
  }
}

const GRADIENT_PRESETS = {
  "sunset-breeze": { type: "linear", colorA: "#ff9a9e", colorB: "#fecfef", angle: 135 },
  "deep-ocean": { type: "linear", colorA: "#00c6ff", colorB: "#0072ff", angle: 135 },
  "midnight-forest": { type: "linear", colorA: "#11998e", colorB: "#38ef7d", angle: 135 },
  "cosmic-violet": { type: "linear", colorA: "#7f00ff", colorB: "#e100ff", angle: 135 },
  "dark-glass": { type: "linear", colorA: "#1f1c2c", colorB: "#928dab", angle: 135 },
  "warm-sunrise": { type: "linear", colorA: "#f857a6", colorB: "#ff5858", angle: 135 }
};

function updateGradientPresetHighlights(presetId) {
  document.querySelectorAll(".gradient-preset-btn").forEach(btn => {
    if (btn.dataset.preset === presetId) {
      btn.classList.add("is-active");
    } else {
      btn.classList.remove("is-active");
    }
  });
}

function setGradientAngleAvailability(type) {
  if (!gradientAngleRow) return;
  const isRadial = type === "radial";
  gradientAngleRow.classList.toggle("is-hidden", isRadial);
  if (gradientAngleSlider) {
    gradientAngleSlider.disabled = isRadial;
  }
}

function buildGradientCss({ type = "linear", colorA = "#1f1c2c", colorB = "#928dab", angle = 135 } = {}) {
  if (type === "radial") {
    return `radial-gradient(circle at 50% 42%, ${colorA} 0%, ${colorB} 100%)`;
  }
  return `linear-gradient(${angle}deg, ${colorA} 0%, ${colorB} 100%)`;
}

function updateWallpaperTypeButtons(type) {
  wallpaperTypeButtons.forEach(button => {
    const isActive = button.dataset.wallpaperType === type;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function updateGradientShowcase() {
  if (!gradientPreviewCanvas) return;

  const config = currentSettings.customWallpaperGradientConfig || {};
  const type = gradientTypeSelect ? gradientTypeSelect.value : (config.type || "linear");
  const colorA = gradientColorA ? gradientColorA.value : (config.colorA || "#1f1c2c");
  const colorB = gradientColorB ? gradientColorB.value : (config.colorB || "#928dab");
  const angle = gradientAngleSlider ? Number(gradientAngleSlider.value) : (config.angle ?? 135);
  const animated = gradientAnimateCheckbox ? gradientAnimateCheckbox.checked : Boolean(config.animated);

  gradientPreviewCanvas.style.background = buildGradientCss({ type, colorA, colorB, angle });
  gradientPreviewCanvas.style.setProperty("--preview-gradient-color-a", colorA);
  gradientPreviewCanvas.style.setProperty("--preview-gradient-color-b", colorB);
  gradientPreviewCanvas.classList.toggle("is-animated", animated);
}

function getFirstAvailableSlot() {
  if (!currentSettings.customWallpaperSlots) {
    currentSettings.customWallpaperSlots = [];
  }
  for (let slot = 1; slot <= 3; slot++) {
    if (!currentSettings.customWallpaperSlots.includes(slot)) {
      return slot;
    }
  }
  return 1;
}

async function processAndSaveImage(file, slot = 1) {
  if (!wallpaperErrorMessage) return;
  wallpaperErrorMessage.style.display = "none";
  
  if (file.size > 12 * 1024 * 1024) {
    wallpaperErrorMessage.textContent = t(api, "wallpaperSizeError");
    wallpaperErrorMessage.style.display = "block";
    return;
  }
  
  if (!file.type.startsWith("image/")) {
    wallpaperErrorMessage.textContent = t(api, "wallpaperFormatError");
    wallpaperErrorMessage.style.display = "block";
    return;
  }
  
  try {
    let img;
    if (typeof createImageBitmap !== "undefined") {
      img = await createImageBitmap(file);
    } else {
      img = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const tempImg = new Image();
          tempImg.onload = () => resolve(tempImg);
          tempImg.onerror = (err) => reject(err);
          tempImg.src = e.target.result;
        };
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
      });
    }
    
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    
    let width = img.width || img.naturalWidth;
    let height = img.height || img.naturalHeight;
    
    const MAX_WIDTH = 2560;
    const MAX_HEIGHT = 1440;
    
    if (width > MAX_WIDTH || height > MAX_HEIGHT) {
      const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
    }
    
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(img, 0, 0, width, height);
    
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    let totalLuminance = 0;
    let samples = 0;
    
    for (let i = 0; i < data.length; i += 40) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
      totalLuminance += luminance;
      samples++;
    }
    
    const avgLuminance = totalLuminance / (samples || 1);
    const suggestedTheme = avgLuminance > 0.5 ? "light" : "dark";
    
    let format = "image/webp";
    let blob = await new Promise((resolve) => canvas.toBlob(resolve, format, 0.8));
    
    if (!blob) {
      format = "image/jpeg";
      blob = await new Promise((resolve) => canvas.toBlob(resolve, format, 0.8));
    }
    
    if (!blob) {
      throw new Error("Blob creation failed");
    }
    
    await saveWallpaper(slot, blob);
    
    currentSettings.customWallpaperEnabled = true;
    if (!currentSettings.customWallpaperSlots) {
      currentSettings.customWallpaperSlots = [];
    }
    if (!currentSettings.customWallpaperSlots.includes(slot)) {
      currentSettings.customWallpaperSlots.push(slot);
      currentSettings.customWallpaperSlots.sort();
    }
    
    if (!currentSettings.customWallpaperThemes) {
      currentSettings.customWallpaperThemes = {};
    }
    currentSettings.customWallpaperThemes[slot] = suggestedTheme;
    
    // Set this slot as active if no active slot is set
    if (!currentSettings.customWallpaperActiveSlot || !currentSettings.customWallpaperSlots.includes(currentSettings.customWallpaperActiveSlot)) {
      currentSettings.customWallpaperActiveSlot = slot;
    }
    
    saveButton.disabled = false;
    await loadWallpaperPreview();
    
  } catch (err) {
    console.error("Error processing image file", err);
    wallpaperErrorMessage.textContent = t(api, "wallpaperGenericError");
    wallpaperErrorMessage.style.display = "block";
  }
}

// Bind slot events
document.querySelectorAll(".wallpaper-slot-preview").forEach(preview => {
  const slot = Number(preview.closest(".wallpaper-slot").dataset.slot);
  
  preview.addEventListener("dragover", (e) => {
    e.preventDefault();
    preview.classList.add("dragover");
  });
  
  preview.addEventListener("dragleave", () => {
    preview.classList.remove("dragover");
  });
  
  preview.addEventListener("drop", (e) => {
    e.preventDefault();
    preview.classList.remove("dragover");
    const file = e.dataTransfer.files[0];
    if (file) {
      processAndSaveImage(file, slot);
    }
  });
  
  preview.addEventListener("click", (e) => {
    if (e.target.closest(".wallpaper-slot-remove")) return;
    
    const isFilled = currentSettings.customWallpaperSlots && currentSettings.customWallpaperSlots.includes(slot);
    if (!isFilled) {
      wallpaperFileInput.dataset.targetSlot = slot;
      wallpaperFileInput.click();
    } else {
      if (!currentSettings.customWallpaperRotate) {
        currentSettings.customWallpaperActiveSlot = slot;
        saveButton.disabled = false;
        updateSlotHighlights();
        const activeTheme = currentSettings.customWallpaperThemes?.[slot] || "dark";
        applyTheme(activeTheme);
        applyLiveSetupPreview();
      }
    }
  });
});

// Bind remove buttons
document.querySelectorAll(".wallpaper-slot-remove").forEach(btn => {
  btn.addEventListener("click", async (e) => {
    e.stopPropagation();
    const slot = Number(btn.dataset.slot);
    await deleteWallpaper(slot);
    
    if (currentSettings.customWallpaperSlots) {
      currentSettings.customWallpaperSlots = currentSettings.customWallpaperSlots.filter(s => s !== slot);
    }
    if (currentSettings.customWallpaperThemes) {
      delete currentSettings.customWallpaperThemes[slot];
    }
    
    if (!currentSettings.customWallpaperSlots || currentSettings.customWallpaperSlots.length === 0) {
      currentSettings.customWallpaperEnabled = false;
      currentSettings.customWallpaperActiveSlot = 1;
      currentSettings.customWallpaperRotate = false;
      themeSelect.disabled = false;
      themeSelectHelperNote.style.display = "none";
      applyTheme(themeSelect.value);
    } else {
      if (currentSettings.customWallpaperActiveSlot === slot) {
        currentSettings.customWallpaperActiveSlot = currentSettings.customWallpaperSlots[0];
      }
      if (!currentSettings.customWallpaperRotate) {
        const activeTheme = currentSettings.customWallpaperThemes?.[currentSettings.customWallpaperActiveSlot] || "dark";
        applyTheme(activeTheme);
      }
    }
    
    saveButton.disabled = false;
    await loadWallpaperPreview();
  });
});

// Sliders and rotate checkbox bindings
if (wallpaperRotateCheckbox) {
  wallpaperRotateCheckbox.addEventListener("change", () => {
    currentSettings.customWallpaperRotate = wallpaperRotateCheckbox.checked;
    saveButton.disabled = false;
    updateSlotHighlights();
    
    // Resolve visual theme immediately on toggle
    let activeSlot = currentSettings.customWallpaperActiveSlot || 1;
    if (currentSettings.customWallpaperRotate && currentSettings.customWallpaperSlots && currentSettings.customWallpaperSlots.length > 0) {
      let storedSlot = sessionStorage.getItem("selectedWallpaperSlot");
      if (storedSlot && currentSettings.customWallpaperSlots.includes(Number(storedSlot))) {
        activeSlot = Number(storedSlot);
      } else {
        activeSlot = currentSettings.customWallpaperSlots[0];
      }
    }
    const activeTheme = currentSettings.customWallpaperThemes?.[activeSlot] || "dark";
    applyTheme(activeTheme);
    applyLiveSetupPreview();
  });
}

if (wallpaperBrightnessSlider) {
  wallpaperBrightnessSlider.addEventListener("input", () => {
    const val = Number(wallpaperBrightnessSlider.value);
    if (wallpaperBrightnessValue) {
      wallpaperBrightnessValue.textContent = Math.round(val * 100) + "%";
    }
    // Sync to legacy controls to satisfy tests
    const legibility = 1.0 - val;
    if (wallpaperLegibilitySlider) {
      wallpaperLegibilitySlider.value = legibility;
    }
    if (wallpaperLegibilityValue) {
      wallpaperLegibilityValue.textContent = Math.round(legibility * 200) + "%";
    }
    saveButton.disabled = false;
    applyLiveSetupPreview();
  });
}

if (wallpaperFolderOpacitySlider) {
  wallpaperFolderOpacitySlider.addEventListener("input", () => {
    const val = Number(wallpaperFolderOpacitySlider.value);
    if (wallpaperFolderOpacityValue) {
      wallpaperFolderOpacityValue.textContent = Math.round(val * 100) + "%";
    }
    saveButton.disabled = false;
    applyLiveSetupPreview();
  });
}

if (wallpaperHeaderOpacitySlider) {
  wallpaperHeaderOpacitySlider.addEventListener("input", () => {
    const val = Number(wallpaperHeaderOpacitySlider.value);
    if (wallpaperHeaderOpacityValue) {
      wallpaperHeaderOpacityValue.textContent = Math.round(val * 100) + "%";
    }
    saveButton.disabled = false;
    applyLiveSetupPreview();
  });
}

// Keep legacy dropzone and input events active as fallback and for tests
if (wallpaperDropzone) {
  wallpaperDropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
    wallpaperDropzone.classList.add("dragover");
  });
  wallpaperDropzone.addEventListener("dragleave", () => {
    wallpaperDropzone.classList.remove("dragover");
  });
  wallpaperDropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    wallpaperDropzone.classList.remove("dragover");
    const file = e.dataTransfer.files[0];
    if (file) {
      processAndSaveImage(file, getFirstAvailableSlot());
    }
  });
}

if (wallpaperFileInput) {
  wallpaperFileInput.addEventListener("change", () => {
    const file = wallpaperFileInput.files[0];
    if (file) {
      const slot = Number(wallpaperFileInput.dataset.targetSlot) || getFirstAvailableSlot();
      processAndSaveImage(file, slot);
    }
  });
}

if (removeWallpaperBtn) {
  removeWallpaperBtn.addEventListener("click", async () => {
    // Programmatic/test removal: clears slot 1
    await deleteWallpaper(1);
    currentSettings.customWallpaperSlots = currentSettings.customWallpaperSlots.filter(s => s !== 1);
    if (currentSettings.customWallpaperThemes) {
      delete currentSettings.customWallpaperThemes[1];
    }
    if (currentSettings.customWallpaperSlots.length === 0) {
      currentSettings.customWallpaperEnabled = false;
      currentSettings.customWallpaperActiveSlot = 1;
      currentSettings.customWallpaperRotate = false;
      themeSelect.disabled = false;
      themeSelectHelperNote.style.display = "none";
      applyTheme(themeSelect.value);
    } else {
      if (currentSettings.customWallpaperActiveSlot === 1) {
        currentSettings.customWallpaperActiveSlot = currentSettings.customWallpaperSlots[0];
      }
      if (!currentSettings.customWallpaperRotate) {
        const activeTheme = currentSettings.customWallpaperThemes?.[currentSettings.customWallpaperActiveSlot] || "dark";
        applyTheme(activeTheme);
      }
    }
    saveButton.disabled = false;
    await loadWallpaperPreview();
  });
}

if (wallpaperLegibilitySlider) {
  wallpaperLegibilitySlider.addEventListener("input", () => {
    const value = Math.round(Number(wallpaperLegibilitySlider.value) * 200) + "%";
    if (wallpaperLegibilityValue) wallpaperLegibilityValue.textContent = value;
    // Reverse sync to new slider
    if (wallpaperBrightnessSlider) {
      wallpaperBrightnessSlider.value = 1.0 - Number(wallpaperLegibilitySlider.value);
      if (wallpaperBrightnessValue) {
        wallpaperBrightnessValue.textContent = Math.round(Number(wallpaperBrightnessSlider.value) * 100) + "%";
      }
    }
    saveButton.disabled = false;
  });
}

if (wallpaperThemeSelect) {
  wallpaperThemeSelect.addEventListener("change", () => {
    const slot = currentSettings.customWallpaperActiveSlot || 1;
    if (!currentSettings.customWallpaperThemes) {
      currentSettings.customWallpaperThemes = {};
    }
    currentSettings.customWallpaperThemes[slot] = wallpaperThemeSelect.value;
    if (!currentSettings.customWallpaperRotate) {
      applyTheme(wallpaperThemeSelect.value);
    }
    saveButton.disabled = false;
    applyLiveSetupPreview();
  });
}

function handleWallpaperTypeChange(nextType) {
  if (wallpaperTypeSelect) {
    wallpaperTypeSelect.value = nextType;
  }
  updateWallpaperTypeButtons(nextType);

  currentSettings.customWallpaperType = nextType;
  if (nextType === "none") {
      currentSettings.customWallpaperEnabled = false;
      themeSelect.disabled = false;
      themeSelectHelperNote.style.display = "none";
      applyTheme(themeSelect.value);
  } else if (nextType === "image") {
      // If image, enable custom wallpaper if we have slots uploaded
      currentSettings.customWallpaperEnabled = currentSettings.customWallpaperSlots && currentSettings.customWallpaperSlots.length > 0;
      if (currentSettings.customWallpaperEnabled) {
        themeSelect.disabled = true;
        themeSelectHelperNote.style.display = "block";
        const configSlot = currentSettings.customWallpaperActiveSlot || 1;
        applyTheme(currentSettings.customWallpaperThemes?.[configSlot] || "dark");
      } else {
        themeSelect.disabled = false;
        themeSelectHelperNote.style.display = "none";
        applyTheme(themeSelect.value);
      }
  } else if (nextType === "gradient") {
      currentSettings.customWallpaperEnabled = true;
      themeSelect.disabled = true;
      themeSelectHelperNote.style.display = "block";
      const activeTheme = currentSettings.customWallpaperThemes?.[currentSettings.customWallpaperActiveSlot || 1] || "dark";
      applyTheme(activeTheme);
  }
  saveButton.disabled = false;
  loadWallpaperPreview();
}

// Wallpaper Type Select change
if (wallpaperTypeSelect) {
  wallpaperTypeSelect.addEventListener("change", () => {
    handleWallpaperTypeChange(wallpaperTypeSelect.value);
  });
}

wallpaperTypeButtons.forEach(button => {
  button.addEventListener("click", () => {
    handleWallpaperTypeChange(button.dataset.wallpaperType || "none");
  });
});

// Preset buttons
document.querySelectorAll(".gradient-preset-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const presetId = btn.dataset.preset;
    const config = GRADIENT_PRESETS[presetId];
    if (config) {
      if (gradientColorA) gradientColorA.value = config.colorA;
      if (gradientColorB) gradientColorB.value = config.colorB;
      if (gradientTypeSelect) {
        gradientTypeSelect.value = config.type;
        setGradientAngleAvailability(config.type);
      }
      if (gradientAngleSlider) {
        gradientAngleSlider.value = config.angle;
        if (gradientAngleValue) gradientAngleValue.textContent = config.angle + "°";
      }

      currentSettings.customWallpaperGradientConfig = {
        ...currentSettings.customWallpaperGradientConfig,
        type: config.type,
        colorA: config.colorA,
        colorB: config.colorB,
        angle: config.angle,
        presetId: presetId
      };

      updateGradientPresetHighlights(presetId);
      updateGradientShowcase();
      saveButton.disabled = false;
      applyLiveSetupPreview();
    }
  });
});

// Custom builders inputs change
const handleCustomGradientChange = () => {
  const type = gradientTypeSelect ? gradientTypeSelect.value : "linear";
  const colorA = gradientColorA ? gradientColorA.value : "#ff9a9e";
  const colorB = gradientColorB ? gradientColorB.value : "#fecfef";
  const angle = gradientAngleSlider ? Number(gradientAngleSlider.value) : 135;
  const animated = gradientAnimateCheckbox ? gradientAnimateCheckbox.checked : false;

  setGradientAngleAvailability(type);

  // Determine if it matches any preset
  let matchedPresetId = "custom";
  for (const [presetId, preset] of Object.entries(GRADIENT_PRESETS)) {
    if (preset.type === type &&
        preset.colorA.toLowerCase() === colorA.toLowerCase() &&
        preset.colorB.toLowerCase() === colorB.toLowerCase() &&
        (type === "radial" || preset.angle === angle)) {
      matchedPresetId = presetId;
      break;
    }
  }

  currentSettings.customWallpaperGradientConfig = {
    type,
    colorA,
    colorB,
    angle,
    presetId: matchedPresetId,
    animated
  };

  updateGradientPresetHighlights(matchedPresetId);
  updateGradientShowcase();
  saveButton.disabled = false;
  applyLiveSetupPreview();
};

if (gradientColorA) gradientColorA.addEventListener("input", handleCustomGradientChange);
if (gradientColorB) gradientColorB.addEventListener("input", handleCustomGradientChange);
if (gradientTypeSelect) gradientTypeSelect.addEventListener("change", handleCustomGradientChange);
if (gradientAngleSlider) {
  gradientAngleSlider.addEventListener("input", () => {
    if (gradientAngleValue) gradientAngleValue.textContent = gradientAngleSlider.value + "°";
    handleCustomGradientChange();
  });
}
if (gradientAnimateCheckbox) gradientAnimateCheckbox.addEventListener("change", handleCustomGradientChange);

// Accordion customize toggle
const gradientCustomizeToggle = document.querySelector("#gradient-customize-toggle");
const gradientCustomizePanel = document.querySelector("#gradient-customize-panel");

if (gradientCustomizeToggle && gradientCustomizePanel) {
  gradientCustomizeToggle.addEventListener("click", () => {
    const isExpanded = gradientCustomizeToggle.classList.toggle("is-expanded");
    gradientCustomizePanel.style.display = isExpanded ? "flex" : "none";
  });
}

function applyLiveSetupPreview() {
  const bgEl = document.querySelector("#custom-wallpaper-bg");
  const overlayEl = document.querySelector("#custom-wallpaper-overlay");
  if (!bgEl || !overlayEl) return;

  const wallpaperType = wallpaperTypeSelect ? wallpaperTypeSelect.value : (currentSettings.customWallpaperType || "none");
  const hasImage = wallpaperType === "image" && currentSettings.customWallpaperSlots && currentSettings.customWallpaperSlots.length > 0;
  const hasGradient = wallpaperType === "gradient";
  const hasWallpaper = (wallpaperType === "image" && hasImage) || hasGradient;

  if (!hasWallpaper) {
    document.documentElement.classList.remove("has-custom-wallpaper");
    bgEl.style.backgroundImage = "";
    bgEl.innerHTML = "";
    bgEl.classList.remove("is-loaded");
    overlayEl.style.backgroundColor = "";
    document.documentElement.style.removeProperty("--custom-folder-opacity");
    document.documentElement.style.removeProperty("--custom-header-opacity");
    return;
  }

  // Get current opacity/brightness settings
  const folderOpacity = wallpaperFolderOpacitySlider ? Number(wallpaperFolderOpacitySlider.value) : (currentSettings.customWallpaperFolderOpacity ?? 0.45);
  const headerOpacity = wallpaperHeaderOpacitySlider ? Number(wallpaperHeaderOpacitySlider.value) : (currentSettings.customWallpaperHeaderOpacity ?? 0.45);
  document.documentElement.style.setProperty("--custom-folder-opacity", folderOpacity);
  document.documentElement.style.setProperty("--custom-header-opacity", headerOpacity);

  const brightness = wallpaperBrightnessSlider ? Number(wallpaperBrightnessSlider.value) : (currentSettings.customWallpaperBrightness ?? 0.8);
  const overlayOpacity = Math.max(0, Math.min(0.5, 1.0 - brightness));

  let resolvedTheme = "dark";

  if (wallpaperType === "image") {
    let activeSlot = currentSettings.customWallpaperActiveSlot || 1;
    if (currentSettings.customWallpaperRotate && currentSettings.customWallpaperSlots && currentSettings.customWallpaperSlots.length > 0) {
      let storedSlot = sessionStorage.getItem("selectedWallpaperSlot");
      if (storedSlot && currentSettings.customWallpaperSlots.includes(Number(storedSlot))) {
        activeSlot = Number(storedSlot);
      } else {
        activeSlot = currentSettings.customWallpaperSlots[0];
      }
    }

    resolvedTheme = currentSettings.customWallpaperThemes?.[activeSlot] || "dark";
    if (resolvedTheme === "system") {
      resolvedTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }

    const objectUrl = customWallpaperObjectUrls[activeSlot];
    if (objectUrl) {
      bgEl.style.backgroundImage = `url(${objectUrl})`;
      bgEl.innerHTML = "";
      bgEl.classList.add("is-loaded");
      document.documentElement.classList.add("has-custom-wallpaper");
    } else {
      bgEl.style.backgroundImage = "";
      bgEl.innerHTML = "";
      bgEl.classList.remove("is-loaded");
      document.documentElement.classList.remove("has-custom-wallpaper");
    }
  } else if (wallpaperType === "gradient") {
    const activeSlot = currentSettings.customWallpaperActiveSlot || 1;
    resolvedTheme = currentSettings.customWallpaperThemes?.[activeSlot] || "dark";
    if (resolvedTheme === "system") {
      resolvedTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }

    const type = gradientTypeSelect ? gradientTypeSelect.value : "linear";
    const colorA = gradientColorA ? gradientColorA.value : "#ff9a9e";
    const colorB = gradientColorB ? gradientColorB.value : "#fecfef";
    const angle = gradientAngleSlider ? Number(gradientAngleSlider.value) : 135;
    const animated = gradientAnimateCheckbox ? gradientAnimateCheckbox.checked : false;

    let backgroundStyle = "";
    if (type === "radial") {
      backgroundStyle = `radial-gradient(circle, ${colorA} 0%, ${colorB} 100%)`;
    } else {
      backgroundStyle = `linear-gradient(${angle}deg, ${colorA} 0%, ${colorB} 100%)`;
    }

    bgEl.style.backgroundImage = backgroundStyle;
    bgEl.classList.add("is-loaded");
    document.documentElement.classList.add("has-custom-wallpaper");

    // Handle Aurora Animation
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (animated && !prefersReducedMotion) {
      bgEl.style.setProperty("--aurora-color-1", colorA);
      bgEl.style.setProperty("--aurora-color-2", colorB);
      bgEl.style.setProperty("--aurora-color-3", `color-mix(in srgb, ${colorA} 35%, ${colorB})`);

      if (!bgEl.querySelector(".aurora-blob")) {
        bgEl.innerHTML = `
          <div class="aurora-blob aurora-blob-1"></div>
          <div class="aurora-blob aurora-blob-2"></div>
          <div class="aurora-blob aurora-blob-3"></div>
        `;
      }
    } else {
      bgEl.innerHTML = "";
    }
  }

  if (wallpaperType === "gradient") {
    overlayEl.style.backgroundColor = `rgba(0, 0, 0, ${overlayOpacity})`;
  } else if (resolvedTheme === "dark") {
    overlayEl.style.backgroundColor = `rgba(0, 0, 0, ${overlayOpacity})`;
  } else {
    overlayEl.style.backgroundColor = `rgba(255, 255, 255, ${overlayOpacity})`;
  }
}

async function resetLocalOrganization() {
  const confirmed = window.confirm(
    t(api, "confirmResetLocalOrg")
  );
  if (!confirmed) return;

  currentSettings = {
    ...currentSettings,
    bookmarkFolderOverrides: {},
    folderBookmarkOrders: {},
    folderNameOverrides: {},
    folderSelectionScopes: {}
  };

  await saveSettings(api, currentSettings);
  status.textContent = t(api, "resetLocalOrgSuccess");
}

async function clearPreviewCache() {
  const confirmed = window.confirm(t(api, "confirmClearPreviews"));
  if (!confirmed) return;

  await setStoredValue(api, STORAGE_KEYS.capturedPreviews, {});
  await setStoredValue(api, STORAGE_KEYS.pendingPreviewCaptures, {});
  status.textContent = t(api, "clearPreviewsSuccess");
}

if (toggleAllFoldersBtn) {
  toggleAllFoldersBtn.addEventListener("click", () => {
    if (!folderTreeContainer) return;
    captureFolderTreeExpansionState();
    const checkboxes = folderTreeContainer.querySelectorAll("input[type='checkbox']");
    const allChecked = [...checkboxes].every(cb => cb.checked);
    const newState = !allChecked;
    
    let selectedIds = [...(currentSettings.selectedFolderIds || [])];
    checkboxes.forEach((cb) => {
      cb.checked = newState;
      if (newState) {
        if (!selectedIds.includes(cb.value)) {
          selectedIds.push(cb.value);
        }
      } else {
        selectedIds = selectedIds.filter(id => id !== cb.value);
      }
    });
    currentSettings.selectedFolderIds = selectedIds;
    currentSettings.folderSelectionScopes = newState
      ? Object.fromEntries(selectedIds.map(id => [id, "self"]))
      : {};
    saveButton.disabled = false;
    if (typeof status !== "undefined" && status) {
      status.textContent = t(api, "unsavedChanges");
    }
    renderFolders(
      currentFolders,
      currentSettings.selectedFolderIds,
      currentSettings.folderModes || {},
      currentSettings.folderSorts || {}
    );
    renderSelectedFolders();
  });
}

if (collapseAllBtn) {
  collapseAllBtn.addEventListener("click", () => {
    if (!folderTreeContainer) return;
    folderTreeExpandedIds.clear();
    const allChildren = folderTreeContainer.querySelectorAll(".folder-tree-children");
    allChildren.forEach(children => {
      children.classList.add("is-collapsed");
      const parentNode = children.closest(".folder-tree-node");
      if (parentNode?.dataset.folderId) {
        folderTreeCollapsedIds.add(parentNode.dataset.folderId);
      }
    });
    const allToggleBtns = folderTreeContainer.querySelectorAll(".folder-toggle-btn");
    allToggleBtns.forEach(btn => {
      btn.setAttribute("aria-expanded", "false");
    });
  });
}

if (folderTreeSearchInput) {
  folderTreeSearchInput.addEventListener("input", applyFolderTreeSearch);
}

if (openBrowserBookmarksBtn) {
  openBrowserBookmarksBtn.addEventListener("click", () => {
    if (navigator.userAgent.includes("Firefox")) {
      if (firefoxBookmarksNotice) {
        const isHidden = firefoxBookmarksNotice.style.display === "none" || !firefoxBookmarksNotice.style.display;
        firefoxBookmarksNotice.style.display = isHidden ? "block" : "none";
      }
    } else {
      api.tabs.create({ url: "chrome://bookmarks/" }).catch(err => {
        console.error("No se pudo abrir el administrador de marcadores:", err);
      });
    }
  });
}

if (sortColumnsBtn && backToTreeBtn && foldersTreeWrapper && foldersSortWrapper) {
  sortColumnsBtn.addEventListener("click", () => {
    foldersTreeWrapper.style.display = "none";
    foldersSortWrapper.style.display = "flex";
    if (foldersSortActions) foldersSortActions.style.display = "flex";
    if (firefoxBookmarksNotice) firefoxBookmarksNotice.style.display = "none";
    
    // Hide standard folder action buttons
    sortColumnsBtn.style.display = "none";
    if (collapseAllBtn) collapseAllBtn.style.display = "none";
    if (toggleAllFoldersBtn) toggleAllFoldersBtn.style.display = "none";
    if (openBrowserBookmarksBtn) openBrowserBookmarksBtn.style.display = "none";
    
    renderSelectedFolders();
  });
  
  backToTreeBtn.addEventListener("click", () => {
    foldersTreeWrapper.style.display = "flex";
    foldersSortWrapper.style.display = "none";
    if (foldersSortActions) foldersSortActions.style.display = "none";
    
    // Show standard folder action buttons
    sortColumnsBtn.style.display = "";
    if (collapseAllBtn) collapseAllBtn.style.display = "";
    if (toggleAllFoldersBtn) toggleAllFoldersBtn.style.display = "";
    if (openBrowserBookmarksBtn) openBrowserBookmarksBtn.style.display = "";
  });
}

resetLocalOrganizationButton.addEventListener("click", () => {
  resetLocalOrganization().catch((error) => {
    status.textContent = t(api, "resetLocalOrgError", [error.message]);
  });
});

clearPreviewCacheButton.addEventListener("click", () => {
  clearPreviewCache().catch((error) => {
    status.textContent = t(api, "clearPreviewsError", [error.message]);
  });
});

const importSummaryContainer = document.querySelector("#import-summary-container");
const importSummaryText = document.querySelector("#import-summary-text");
const importConfirmBtn = document.querySelector("#import-confirm-btn");
const importCancelBtn = document.querySelector("#import-cancel-btn");

let pendingImportResult = null;

exportConfigButton.addEventListener("click", async () => {
  try {
    const data = await api.storage.local.get([STORAGE_KEYS.manualTags, STORAGE_KEYS.pinnedBookmarks, STORAGE_KEYS.bookmarkIndex]);
    const tree = await api.bookmarks.getTree();
    const currentFolderOptions = getFolderOptions(tree);
    
    // Use current UI state for settings, fallback to currentSettings for permissions
    const settingsToExport = collectSettingsFromForm(
      currentSettings?.linkHealthEnabled || false, 
      currentSettings?.previewCaptureEnabled || false
    );

    const exportData = generateExportData(
      settingsToExport,
      data[STORAGE_KEYS.manualTags] || {},
      data[STORAGE_KEYS.pinnedBookmarks] || [],
      data[STORAGE_KEYS.bookmarkIndex] || {},
      currentFolderOptions
    );
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `martabs-config-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    status.textContent = t(api, "exportSuccess");
  } catch (error) {
    status.textContent = t(api, "exportError", [error.message]);
  }
});

importConfigButton.addEventListener("click", () => {
  importConfigFile.click();
});

importConfigFile.addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const text = await file.text();
    const json = JSON.parse(text);
    
    const data = await api.storage.local.get([STORAGE_KEYS.bookmarkIndex]);
    const tree = await api.bookmarks.getTree();
    const currentFolderOptions = getFolderOptions(tree);
    const result = parseAndRemapImport(json, data[STORAGE_KEYS.bookmarkIndex] || {}, currentFolderOptions);
    
    // Validar permisos requeridos
    if (result.settings.linkHealthEnabled || result.settings.previewCaptureEnabled) {
      if (api.permissions?.contains) {
        const hasUrlPerms = await api.permissions.contains(urlPermissions);
        if (!hasUrlPerms) {
          result.settings.linkHealthEnabled = false;
          result.settings.previewCaptureEnabled = false;
        }
      } else {
        result.settings.linkHealthEnabled = false;
        result.settings.previewCaptureEnabled = false;
      }
    }

    pendingImportResult = result;
    importSummaryContainer.style.display = "block";
    importSummaryText.textContent = t(api, "importSummary", [
      result.stats.mappedFolders,
      result.stats.mappedTags,
      result.stats.mappedPinned,
      result.stats.unmappedItems
    ]);
  } catch (error) {
    let errorMsg = error.message;
    if (error.code === "INVALID_FORMAT") {
      errorMsg = t(api, "importErrorParse");
    } else if (error.code === "INVALID_VERSION") {
      errorMsg = t(api, "importErrorVersion");
    }
    status.textContent = t(api, "importErrorProcess", [errorMsg]);
  }
  importConfigFile.value = "";
});

importConfirmBtn.addEventListener("click", async () => {
  if (!pendingImportResult) return;
  
  try {
    importSummaryContainer.style.display = "none";
    status.textContent = t(api, "importSaving");
    
    await setStoredValue(api, STORAGE_KEYS.settings, pendingImportResult.settings);
    await setStoredValue(api, STORAGE_KEYS.manualTags, pendingImportResult.manualTags);
    await setStoredValue(api, STORAGE_KEYS.pinnedBookmarks, pendingImportResult.pinnedBookmarks);
    
    pendingImportResult = null;
    status.textContent = t(api, "importSuccess");
    setTimeout(() => window.location.reload(), 2000);
  } catch (error) {
    status.textContent = t(api, "importErrorSave", [error.message]);
  }
});

importCancelBtn.addEventListener("click", () => {
  pendingImportResult = null;
  importSummaryContainer.style.display = "none";
  importConfigFile.value = "";
});

saveButton.addEventListener("click", async () => {
  try {
    const selectedFolderIds = getSelectedFolderIds();
    if (selectedFolderIds.length === 0) {
      status.textContent = t(api, "selectFolderWarning");
      return;
    }

    const linkHealthRequested = linkHealth.checked;
    const previewCaptureRequested = previewCapture.checked;
    const frequentSitesRequested = frequentSites.checked;
    const localStatsRequested = localStats.checked;

    // Start permission requests concurrently in the synchronous turn of the user gesture.
    // In Firefox, any await in the event handler ends the user gesture context,
    // which prevents requesting other optional permissions (like topSites) afterwards.
    const urlPermissionPromise = needsUrlPermission(linkHealthRequested, previewCaptureRequested)
      ? requestUrlPermission()
      : Promise.resolve(false);
    const topSitesPermissionPromise = frequentSitesRequested
      ? requestTopSitesPermission()
      : Promise.resolve(false);

    const urlPermissionGranted = needsUrlPermission(linkHealthRequested, previewCaptureRequested)
      ? await urlPermissionPromise
      : false;
    const linkHealthEnabled = linkHealthRequested && urlPermissionGranted;
    const previewCaptureEnabled = previewCaptureRequested && urlPermissionGranted;
    const topSitesPermissionGranted = frequentSitesRequested ? await topSitesPermissionPromise : false;
    const showTopSitesFolder = frequentSitesRequested && topSitesPermissionGranted;

    if (!needsUrlPermission(linkHealthRequested, previewCaptureRequested)) {
      await removePermission(urlPermissions);
    }

    if (!linkHealthEnabled) {
      linkHealth.checked = false;
    }

    if (!previewCaptureEnabled) {
      previewCapture.checked = false;
    }
    if (!showTopSitesFolder) {
      frequentSites.checked = false;
    }

    if (widgetWeatherEnabled && widgetWeatherEnabled.checked) {
      if (!verifiedWeatherData || !verifiedWeatherData.verified || verifiedWeatherData.locationQuery !== widgetWeatherQuery.value.trim()) {
        alert("Por favor, verifica la ubicacion del clima antes de guardar.");
        return;
      }
    }

    currentSettings = collectSettingsFromForm(linkHealthEnabled, previewCaptureEnabled, showTopSitesFolder, localStatsRequested);
    await saveSettings(api, currentSettings);

    await initI18n(api, currentSettings.language);
    localizeHtml(api);

    updateShortcutCatcherLabel();
    renderTabs();
    renderFolderTabMapping();
    await renderStatistics();

    renderFolders(
      currentFolders,
      currentSettings.selectedFolderIds,
      currentSettings.folderModes || {},
      currentSettings.folderSorts || {}
    );

    applyTheme(themeSelect.value);
    status.textContent = getSuccessMessage(
      linkHealthRequested,
      linkHealthEnabled,
      previewCaptureRequested,
      previewCaptureEnabled
    );
    saveButton.disabled = true;
  } catch (error) {
    status.textContent = t(api, "saveError", [error.message]);
  }
});

const handleSettingsChange = (e) => {
  if (e.target.id !== "import-config" && e.target.id !== "export-config" && e.target.id !== "settings-search" && e.target.id !== "toggle-all-folders") {
    saveButton.disabled = false;
  }
};
document.querySelector(".setup-content").addEventListener("change", handleSettingsChange);
localStats.addEventListener("change", () => {
    renderStatistics();
});
document.querySelector(".setup-content").addEventListener("input", handleSettingsChange);

backButton.addEventListener("click", () => {
  if (!saveButton.disabled) {
    const message = t(api, "unsavedChangesWarning") || "Tienes cambios sin guardar. ¿Seguro que quieres salir?";
    if (!window.confirm(message)) {
      return;
    }
  }
  window.location.href = "../newtab/newtab.html";
});

init().then(() => {
  saveButton.disabled = true;
}).catch((error) => {
  status.textContent = t(api, "loadError", [error.message]);
});

function formatKeyName(key) {
  if (!key) return t(api, "none");
  if (key === " ") return "Space";
  return key.charAt(0).toUpperCase() + key.slice(1);
}

function updateShortcutCatcherLabel() {
  if (pinnedShortcutCatcher1) pinnedShortcutCatcher1.textContent = formatKeyName(currentShortcutModifiers[0]);
  if (pinnedShortcutCatcher2) pinnedShortcutCatcher2.textContent = formatKeyName(currentShortcutModifiers[1]);
}

let activeCatcherIndex = -1;

function bindCatcher(catcher, index) {
  if (!catcher) return;
  catcher.addEventListener("click", () => {
    activeCatcherIndex = index;
    catcher.textContent = t(api, "pressKey");
    catcher.focus();
  });

  catcher.addEventListener("keydown", (e) => {
    if (activeCatcherIndex !== index) return;
    e.preventDefault();
    if (e.key === "Escape" || e.key === "Enter") {
      activeCatcherIndex = -1;
      catcher.blur();
      return;
    }
    if (e.key === "Backspace" || e.key === "Delete") {
      currentShortcutModifiers[index] = "";
      updateShortcutCatcherLabel();
      saveButton.disabled = false;
      return;
    }

    currentShortcutModifiers[index] = e.key === "Control" ? "Control" : e.key;
    updateShortcutCatcherLabel();
    saveButton.disabled = false;
    
    // Auto blur after receiving a valid key
    activeCatcherIndex = -1;
    catcher.blur();
  });

  catcher.addEventListener("blur", () => {
    if (activeCatcherIndex === index) {
      activeCatcherIndex = -1;
      updateShortcutCatcherLabel();
    }
  });
}

bindCatcher(pinnedShortcutCatcher1, 0);
bindCatcher(pinnedShortcutCatcher2, 1);

async function renderStatistics() {
  if (!statsChart || !storageAudit) return;
  
  if (!localStats.checked) {
    statisticsDisabledMsg.style.display = "block";
    statisticsContent.style.display = "none";
    return;
  } else {
    statisticsDisabledMsg.style.display = "none";
    statisticsContent.style.display = "";
  }
  
  statsChart.innerHTML = "";
  storageAudit.innerHTML = "";
  const data = await api.storage.local.get(STORAGE_KEYS.clickStats);
  const clickStats = data[STORAGE_KEYS.clickStats] || [];
  if (clickStats.length === 0) {
    const empty = document.createElement("p");
    empty.dataset.i18n = "emptyResults";
    empty.textContent = t(api, "emptyResults");
    statsChart.appendChild(empty);
  } else {
    const counts = {};
    const titles = {};
    const urls = {};
    clickStats.forEach(stat => {
      counts[stat.bookmarkId] = (counts[stat.bookmarkId] || 0) + 1;
      titles[stat.bookmarkId] = stat.title || stat.url || "Unknown";
      urls[stat.bookmarkId] = stat.url;
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10);
    const maxCount = sorted[0][1];
    
    const list = document.createElement("div");
    list.setAttribute("role", "list");
    list.style.cssText = "display: flex; flex-direction: column; gap: 12px; margin-top: 8px;";

    sorted.forEach(([id, count]) => {
      const percentage = (count / maxCount) * 100;
      let domain = "";
      try { domain = new URL(urls[id]).hostname; } catch(e) {}
      const faviconUrl = domain ? `https://s2.googleusercontent.com/s2/favicons?domain=${domain}&sz=32` : "";
      let visitsText = t(api, count === 1 ? "visitsCountSingular" : "visitsCountPlural", [String(count)]);
      if (visitsText === "visitsCountSingular" || visitsText === "visitsCountPlural") {
        visitsText = String(count);
      }

      const item = document.createElement("div");
      item.setAttribute("role", "listitem");
      item.style.cssText = "display: flex; align-items: center; gap: 12px;";

      const label = document.createElement("div");
      label.style.cssText = "display: flex; align-items: center; gap: 8px; width: 140px; min-width: 140px; overflow: hidden;";

      if (faviconUrl) {
        const img = document.createElement("img");
        img.src = faviconUrl;
        img.alt = "";
        img.style.cssText = "width: 16px; height: 16px; border-radius: 2px;";
        label.appendChild(img);
      } else {
        const fallback = document.createElement("div");
        fallback.style.cssText = "width: 16px; height: 16px; border-radius: 2px; background: var(--surface-border);";
        label.appendChild(fallback);
      }

      const title = document.createElement("span");
      title.style.cssText = "font-size: 13px; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;";
      title.title = titles[id];
      title.textContent = titles[id];
      label.appendChild(title);

      const countEl = document.createElement("div");
      countEl.style.cssText = "width: 80px; min-width: 80px; font-size: 12px; color: var(--text-secondary); text-align: end;";
      countEl.textContent = visitsText || String(count);

      const barWrap = document.createElement("div");
      barWrap.setAttribute("aria-hidden", "true");
      barWrap.style.cssText = "flex: 1; height: 14px; display: flex; align-items: center;";

      const bar = document.createElement("div");
      bar.style.cssText = `width: ${percentage}%; height: 100%; background-color: var(--primary); border-radius: 3px; min-width: 4px;`;
      barWrap.appendChild(bar);

      item.append(label, countEl, barWrap);
      list.appendChild(item);
    });

    statsChart.appendChild(list);
  }
  try {
    const allStorage = await api.storage.local.get(null);
    let totalBytes = 0;
    for (const [key, value] of Object.entries(allStorage)) {
      const size = new Blob([JSON.stringify(value)]).size;
      totalBytes += size;
      const row = document.createElement("div");
      row.style.cssText = "display: flex; justify-content: space-between; padding: 8px; background-color: var(--surface-strong); border-radius: 6px; border: 1px solid var(--surface-border);";

      const keyEl = document.createElement("span");
      keyEl.style.cssText = "font-size: 13px;";
      keyEl.textContent = key;

      const sizeEl = document.createElement("span");
      sizeEl.style.cssText = "font-size: 13px; color: var(--text-secondary); font-variant-numeric: tabular-nums;";
      sizeEl.textContent = `${(size / 1024).toFixed(1)} KB`;

      row.append(keyEl, sizeEl);
      storageAudit.appendChild(row);
    }
    const totalRow = document.createElement("div");
    totalRow.style.cssText = "display: flex; justify-content: space-between; padding: 8px; background-color: var(--primary-soft); border-radius: 6px; border: 1px solid var(--surface-border); font-weight: 500;";

    const totalLabel = document.createElement("span");
    totalLabel.style.cssText = "font-size: 13px;";
    totalLabel.textContent = "Total";

    const totalSize = document.createElement("span");
    totalSize.style.cssText = "font-size: 13px; font-variant-numeric: tabular-nums;";
    totalSize.textContent = `${(totalBytes / 1024).toFixed(1)} KB`;

    totalRow.append(totalLabel, totalSize);
    storageAudit.appendChild(totalRow);
  } catch (e) {
    storageAudit.textContent = "";
    const error = document.createElement("p");
    error.textContent = "Error loading storage.";
    storageAudit.appendChild(error);
  }
}

if (resetStatsBtn) {
  resetStatsBtn.addEventListener("click", async () => {
    if (confirm(t(api, "confirmResetStats"))) {
      await api.storage.local.set({ [STORAGE_KEYS.clickStats]: [] });
      renderStatistics();
    }
  });

  goToPrivacyStatsBtn.addEventListener("click", () => {
    const dataBtn = document.querySelector('.setup-nav-button[data-section="data"]');
    if (dataBtn) dataBtn.click();
  });

  resetTopsitesBlacklistBtn.addEventListener("click", async () => {
    const nextSettings = { ...currentSettings, topSitesBlacklist: [] };
    currentSettings = nextSettings;
    await setStoredValue(api, STORAGE_KEYS.settings, nextSettings);
    resetTopsitesBlacklistBtn.style.display = "none";
    status.textContent = t(api, "saveSuccess");
    status.classList.add("visible");
    setTimeout(() => {
      status.classList.remove("visible");
    }, 3000);
  });
}

if (downloadStatsBtn) {
  downloadStatsBtn.addEventListener("click", async () => {
    const data = await api.storage.local.get(STORAGE_KEYS.clickStats);
    const clickStats = data[STORAGE_KEYS.clickStats] || [];
    const blob = new Blob([JSON.stringify(clickStats, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "martabs_click_stats.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
}
