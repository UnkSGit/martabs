import { getBrowserApi } from "../shared/browser-api.js";
import { getFolderOptions } from "../shared/bookmarks.js";
import { getSettings, saveSettings, setStoredValue, STORAGE_KEYS } from "../shared/storage.js";
import { generateExportData, parseAndRemapImport } from "../shared/sync.js";
import { localizeHtml, t, initI18n, normalizeLanguageCode } from "../shared/i18n-helper.js";

const api = getBrowserApi();
const folderList = document.querySelector("#folder-list");
const toggleAllFoldersBtn = document.querySelector("#toggle-all-folders");
const openBrowserBookmarksBtn = document.querySelector("#open-browser-bookmarks");
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

const topSitesPermissions = { permissions: ["topSites"] };

const urlPermissions = {
  origins: ["<all_urls>"]
};

function applyTheme(theme) {
  const root = document.documentElement;
  root.classList.remove("theme-light", "theme-dark");
  if (theme === "light") {
    root.classList.add("theme-light");
  } else if (theme === "dark") {
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
    ...section.querySelectorAll(".setting-row, .switch-row, .advanced-action, .folder-list label")
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

function renderFolders(folders, selectedFolderIds, folderModes = {}, folderSorts = {}) {
  folderList.innerHTML = "";

  const orderedFolders = [];
  const unselectedFolders = [];

  for (const folder of folders) {
    if (!selectedFolderIds.includes(folder.id)) {
      unselectedFolders.push(folder);
    }
  }

  for (const id of selectedFolderIds) {
    const f = folders.find(f => f.id === id);
    if (f) orderedFolders.push(f);
  }
  
  const finalFolders = [...orderedFolders, ...unselectedFolders];

  let draggedItem = null;

  for (const folder of finalFolders) {
    const label = document.createElement("label");
    label.draggable = true;
    label.dataset.search = `${folder.path} carpeta vista orden predeterminado manual lista compacta iconos quicklinks`;
    
    label.addEventListener("dragstart", function() {
      draggedItem = this;
      setTimeout(() => this.classList.add("is-dragging"), 0);
    });

    label.addEventListener("dragend", function() {
      draggedItem = null;
      this.classList.remove("is-dragging");
      saveButton.disabled = false;
    });

    label.addEventListener("dragover", function(e) {
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

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = folder.id;
    checkbox.checked = selectedFolderIds.includes(folder.id);

    const folderName = document.createElement("span");
    folderName.className = "folder-name";
    
    const nameText = document.createElement("span");
    const overrideName = (currentSettings.folderNameOverrides || {})[folder.id];
    nameText.textContent = overrideName || folder.path;
    nameText.title = overrideName || folder.path;
    
    nameText.addEventListener("dblclick", () => {
      nameText.setAttribute("contenteditable", "true");
      nameText.focus();
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(nameText);
      selection.removeAllRanges();
      selection.addRange(range);
    });

    const saveNewName = () => {
      if (!nameText.hasAttribute("contenteditable")) return;
      nameText.removeAttribute("contenteditable");
      const newName = nameText.textContent.trim();
      const currentOverride = (currentSettings.folderNameOverrides || {})[folder.id];
      const displayName = currentOverride || folder.path;
      
      if (newName !== displayName) {
        const overrides = { ...(currentSettings.folderNameOverrides || {}) };
        if (!newName || newName === folder.path) {
          delete overrides[folder.id];
        } else {
          overrides[folder.id] = newName;
        }
        currentSettings.folderNameOverrides = overrides;
        if (typeof status !== "undefined" && status) {
          status.textContent = t(api, "unsavedChanges");
        }
      } else {
        nameText.textContent = displayName;
      }
    };

    nameText.addEventListener("blur", saveNewName);
    nameText.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        saveNewName();
        saveButton.disabled = false;
      } else if (e.key === "Escape") {
        const overrideName = (currentSettings.folderNameOverrides || {})[folder.id];
        nameText.textContent = overrideName || folder.path;
        nameText.removeAttribute("contenteditable");
      }
    });

    folderName.append(checkbox, nameText);
    
    const controlsWrap = document.createElement("div");
    controlsWrap.className = "folder-controls";

    const modeSelect = document.createElement("select");
    modeSelect.className = "folder-mode-select";
    modeSelect.dataset.folderId = folder.id;
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
    modeSelect.value = folderModes[folder.id] || "default";
    
    // Stop drag when interacting with select
    modeSelect.addEventListener("mousedown", (e) => e.stopPropagation());

    const sortSelect = document.createElement("select");
    sortSelect.className = "folder-sort-select";
    sortSelect.dataset.folderId = folder.id;
    getSortOptions().forEach(opt => {
      const o = document.createElement("option");
      o.value = opt.value;
      o.textContent = opt.text;
      sortSelect.appendChild(o);
    });
    sortSelect.value = folderSorts[folder.id] || "default";
    sortSelect.addEventListener("mousedown", (e) => e.stopPropagation());

    controlsWrap.append(modeSelect, sortSelect);
    
    label.append(folderName, controlsWrap);
    folderList.append(label);
  }
}

function getSelectedFolderIds() {
  return [...folderList.querySelectorAll("input:checked")].map((input) => input.value);
}

function getFolderModes() {
  const folderModes = {};

  folderList.querySelectorAll(".folder-mode-select").forEach(select => {
    if (select.value !== "default") {
      folderModes[select.dataset.folderId] = select.value;
    }
  });

  return folderModes;
}

function getFolderSorts() {
  const folderSorts = {};

  folderList.querySelectorAll(".folder-sort-select").forEach(select => {
    if (select.value !== "default") {
      folderSorts[select.dataset.folderId] = select.value;
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
  
  localizeHtml(api);
  
  const version = api.runtime.getManifest().version;
  if (sidebarVersion) sidebarVersion.textContent = `v${version}`;
  if (advancedVersion) advancedVersion.textContent = version;
  
  automaticTags.checked = currentSettings.automaticTagsEnabled !== false;
  manualTags.checked = currentSettings.manualTagsEnabled !== false;
  showPinnedFolder.checked = currentSettings.showPinnedFolder !== false;
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
  applySettingsSearch();
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

async function resetLocalOrganization() {
  const confirmed = window.confirm(
    t(api, "confirmResetLocalOrg")
  );
  if (!confirmed) return;

  currentSettings = {
    ...currentSettings,
    bookmarkFolderOverrides: {},
    folderBookmarkOrders: {},
    folderNameOverrides: {}
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
    const checkboxes = folderList.querySelectorAll("input[type='checkbox']");
    const allChecked = [...checkboxes].every(cb => cb.checked);
    const newState = !allChecked;
    checkboxes.forEach((cb) => {
      cb.checked = newState;
    });
    saveButton.disabled = false;
  });
}

if (openBrowserBookmarksBtn) {
  openBrowserBookmarksBtn.addEventListener("click", () => {
    if (navigator.userAgent.includes("Firefox")) {
      alert(t(api, "firefoxBookmarksNotice"));
    } else {
      api.tabs.create({ url: "chrome://bookmarks/" }).catch(err => {
        console.error("No se pudo abrir el administrador de marcadores:", err);
      });
    }
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

    currentSettings = collectSettingsFromForm(linkHealthEnabled, previewCaptureEnabled, showTopSitesFolder, localStatsRequested);
    if (localStatsRequested) renderStatistics();
    await saveSettings(api, currentSettings);

    await initI18n(api, currentSettings.language);
    localizeHtml(api);
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
  if (!key) return "Ninguno";
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
    catcher.textContent = "Presiona...";
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
    statsChart.innerHTML = `<p data-i18n="emptyResults">${t(api, "emptyResults")}</p>`;
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
    
    statsChart.innerHTML = `<div role="list" style="display: flex; flex-direction: column; gap: 12px; margin-top: 8px;">` + 
      sorted.map(([id, count]) => {
        const percentage = (count / maxCount) * 100;
        let domain = "";
        try { domain = new URL(urls[id]).hostname; } catch(e) {}
        const faviconUrl = domain ? `https://s2.googleusercontent.com/s2/favicons?domain=${domain}&sz=32` : "";
        const faviconImg = faviconUrl 
          ? `<img src="${faviconUrl}" alt="" style="width: 16px; height: 16px; border-radius: 2px;">` 
          : `<div style="width: 16px; height: 16px; border-radius: 2px; background: var(--surface-border);"></div>`;
        const visitsText = t(api, count === 1 ? "visitsCountSingular" : "visitsCountPlural", [String(count)]);

        return `
          <div role="listitem" style="display: flex; align-items: center; gap: 12px;">
            <div style="display: flex; align-items: center; gap: 8px; width: 140px; min-width: 140px; overflow: hidden;">
              ${faviconImg}
              <span style="font-size: 13px; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${titles[id]}">${titles[id]}</span>
            </div>
            <div style="width: 80px; min-width: 80px; font-size: 12px; color: var(--text-secondary); text-align: end;">
              ${visitsText || (count + " aperturas")}
            </div>
            <div aria-hidden="true" style="flex: 1; height: 14px; display: flex; align-items: center;">
              <div style="width: ${percentage}%; height: 100%; background-color: var(--primary); border-radius: 3px; min-width: 4px;"></div>
            </div>
          </div>
        `;
      }).join("") + `</div>`;
  }
  try {
    const allStorage = await api.storage.local.get(null);
    let totalBytes = 0;
    for (const [key, value] of Object.entries(allStorage)) {
      const size = new Blob([JSON.stringify(value)]).size;
      totalBytes += size;
      storageAudit.innerHTML += `
        <div style="display: flex; justify-content: space-between; padding: 8px; background-color: var(--surface-strong); border-radius: 6px; border: 1px solid var(--surface-border);">
          <span style="font-size: 13px;">${key}</span>
          <span style="font-size: 13px; color: var(--text-secondary); font-variant-numeric: tabular-nums;">${(size / 1024).toFixed(1)} KB</span>
        </div>
      `;
    }
    storageAudit.innerHTML += `
      <div style="display: flex; justify-content: space-between; padding: 8px; background-color: var(--primary-soft); border-radius: 6px; border: 1px solid var(--surface-border); font-weight: 500;">
        <span style="font-size: 13px;">Total</span>
        <span style="font-size: 13px; font-variant-numeric: tabular-nums;">${(totalBytes / 1024).toFixed(1)} KB</span>
      </div>
    `;
  } catch (e) {
    storageAudit.innerHTML = `<p>Error loading storage.</p>`;
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
    const privacyBtn = document.querySelector('.setup-nav-button[data-section="privacy"]');
    if (privacyBtn) privacyBtn.click();
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
