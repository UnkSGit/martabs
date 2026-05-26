import { getBrowserApi } from "../shared/browser-api.js";
import { getFolderOptions } from "../shared/bookmarks.js";
import { getSettings, saveSettings, setStoredValue, STORAGE_KEYS } from "../shared/storage.js";

const api = getBrowserApi();
const folderList = document.querySelector("#folder-list");
const toggleAllFoldersBtn = document.querySelector("#toggle-all-folders");
const saveButton = document.querySelector("#save");
const status = document.querySelector("#status");
const setupContent = document.querySelector(".setup-content");
const settingsSearch = document.querySelector("#settings-search");
const navButtons = document.querySelectorAll(".setup-nav-button");
const sections = document.querySelectorAll(".setup-section");
const automaticTags = document.querySelector("#automatic-tags");
const manualTags = document.querySelector("#manual-tags");
const showPinnedFolder = document.querySelector("#show-pinned-folder");
const linkHealth = document.querySelector("#link-health");
const previewEnabled = document.querySelector("#preview-enabled");
const previewCapture = document.querySelector("#preview-capture");
const defaultModeSelect = document.querySelector("#default-mode-select");
const defaultSortSelect = document.querySelector("#default-sort-select");
const themeSelect = document.querySelector("#theme-select");
const resetLocalOrganizationButton = document.querySelector("#reset-local-organization");
const clearPreviewCacheButton = document.querySelector("#clear-preview-cache");
let currentSettings = null;

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
  return `
    <option value="default">Predeterminado</option>
    <option value="browser">Orden original</option>
    <option value="manual">Manual</option>
    <option value="title-asc">Titulo A-Z</option>
    <option value="date-newest">Mas nuevos primero</option>
    <option value="domain-asc">Dominio A-Z</option>
    <option value="health-broken-first">Fallidos primero</option>
  `;
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
    folderName.append(checkbox, document.createTextNode(folder.path));
    
    const controlsWrap = document.createElement("div");
    controlsWrap.className = "folder-controls";

    const modeSelect = document.createElement("select");
    modeSelect.className = "folder-mode-select";
    modeSelect.dataset.folderId = folder.id;
    modeSelect.innerHTML = `
      <option value="default">Predeterminado</option>
      <option value="list">Lista completa</option>
      <option value="compact">Lista compacta</option>
      <option value="icons">Grilla de iconos</option>
      <option value="icons-large">Grilla de iconos (grande)</option>
      <option value="quicklinks">Quicklinks</option>
    `;
    modeSelect.value = folderModes[folder.id] || "default";
    
    // Stop drag when interacting with select
    modeSelect.addEventListener("mousedown", (e) => e.stopPropagation());

    const sortSelect = document.createElement("select");
    sortSelect.className = "folder-sort-select";
    sortSelect.dataset.folderId = folder.id;
    sortSelect.innerHTML = getSortOptions();
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

function collectSettingsFromForm(linkHealthEnabled, previewCaptureEnabled) {
  return {
    ...currentSettings,
    selectedFolderIds: getSelectedFolderIds(),
    automaticTagsEnabled: automaticTags.checked,
    manualTagsEnabled: manualTags.checked,
    showPinnedFolder: showPinnedFolder.checked,
    linkHealthEnabled: linkHealthEnabled,
    previewEnabled: previewEnabled.checked,
    previewCaptureEnabled: previewCaptureEnabled,
    theme: themeSelect.value,
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
  const message = "Configuracion guardada. Abre una nueva pestana para usar martabs.";
  if (linkHealthRequested && !linkHealthEnabled) {
    return `${message} No se pudo activar la revision de enlaces porque falta el permiso necesario.`;
  }
  if (previewCaptureRequested && !previewCaptureEnabled) {
    return `${message} No se pudo activar la captura de previews porque falta el permiso necesario.`;
  }
  return message;
}

async function init() {
  const [tree, settings] = await Promise.all([api.bookmarks.getTree(), getSettings(api)]);
  currentSettings = settings;
  
  automaticTags.checked = currentSettings.automaticTagsEnabled;
  manualTags.checked = currentSettings.manualTagsEnabled;
  showPinnedFolder.checked = currentSettings.showPinnedFolder !== false;
  linkHealth.checked = currentSettings.linkHealthEnabled;
  previewEnabled.checked = currentSettings.previewEnabled;
  previewCapture.checked = currentSettings.previewCaptureEnabled;
  themeSelect.value = currentSettings.theme || "system";
  defaultModeSelect.value = currentSettings.defaultFolderMode || "list";
  defaultSortSelect.value = currentSettings.defaultFolderSort || "browser";

  applyTheme(themeSelect.value);

  const folders = getFolderOptions(tree);
  renderFolders(
    folders,
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
    "Restablecer todos los movimientos locales y ordenes manuales? No se modifican los marcadores reales del navegador."
  );
  if (!confirmed) return;

  currentSettings = {
    ...currentSettings,
    bookmarkFolderOverrides: {},
    folderBookmarkOrders: {}
  };

  await saveSettings(api, currentSettings);
  status.textContent = "Organizacion local restablecida.";
}

async function clearPreviewCache() {
  const confirmed = window.confirm("Limpiar todas las previews locales cacheadas?");
  if (!confirmed) return;

  await setStoredValue(api, STORAGE_KEYS.capturedPreviews, {});
  await setStoredValue(api, STORAGE_KEYS.pendingPreviewCaptures, {});
  status.textContent = "Previews cacheadas eliminadas.";
}

if (toggleAllFoldersBtn) {
  toggleAllFoldersBtn.addEventListener("click", () => {
    const checkboxes = folderList.querySelectorAll("input[type='checkbox']");
    const anyUnchecked = [...checkboxes].some(cb => !cb.checked);
    checkboxes.forEach(cb => cb.checked = anyUnchecked);
  });
}

resetLocalOrganizationButton.addEventListener("click", () => {
  resetLocalOrganization().catch((error) => {
    status.textContent = `No se pudo restablecer la organizacion local: ${error.message}`;
  });
});

clearPreviewCacheButton.addEventListener("click", () => {
  clearPreviewCache().catch((error) => {
    status.textContent = `No se pudieron limpiar las previews: ${error.message}`;
  });
});

saveButton.addEventListener("click", async () => {
  try {
    const selectedFolderIds = getSelectedFolderIds();
    if (selectedFolderIds.length === 0) {
      status.textContent = "Selecciona al menos una carpeta.";
      return;
    }

    const linkHealthRequested = linkHealth.checked;
    const previewCaptureRequested = previewCapture.checked;
    const urlPermissionGranted = needsUrlPermission(linkHealthRequested, previewCaptureRequested)
      ? await requestUrlPermission()
      : false;
    const linkHealthEnabled = linkHealthRequested && urlPermissionGranted;
    const previewCaptureEnabled = previewCaptureRequested && urlPermissionGranted;

    if (!needsUrlPermission(linkHealthRequested, previewCaptureRequested)) {
      await removePermission(urlPermissions);
    }

    if (!linkHealthEnabled) {
      linkHealth.checked = false;
    }

    if (!previewCaptureEnabled) {
      previewCapture.checked = false;
    }

    currentSettings = collectSettingsFromForm(linkHealthEnabled, previewCaptureEnabled);
    await saveSettings(api, currentSettings);

    applyTheme(themeSelect.value);
    status.textContent = getSuccessMessage(
      linkHealthRequested,
      linkHealthEnabled,
      previewCaptureRequested,
      previewCaptureEnabled
    );
  } catch (error) {
    status.textContent = `No se pudo guardar la configuracion: ${error.message}`;
  }
});

init().catch((error) => {
  status.textContent = `No se pudieron cargar las carpetas: ${error.message}`;
});
