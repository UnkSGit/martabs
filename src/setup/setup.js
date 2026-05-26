import { getBrowserApi } from "../shared/browser-api.js";
import { getFolderOptions } from "../shared/bookmarks.js";
import { getSettings, saveSettings } from "../shared/storage.js";

const api = getBrowserApi();
const folderList = document.querySelector("#folder-list");
const saveButton = document.querySelector("#save");
const status = document.querySelector("#status");
const automaticTags = document.querySelector("#automatic-tags");
const manualTags = document.querySelector("#manual-tags");
const showPinnedFolder = document.querySelector("#show-pinned-folder");
const linkHealth = document.querySelector("#link-health");
const previewEnabled = document.querySelector("#preview-enabled");
const previewCapture = document.querySelector("#preview-capture");
const defaultModeSelect = document.querySelector("#default-mode-select");
const defaultSortSelect = document.querySelector("#default-sort-select");
const themeSelect = document.querySelector("#theme-select");
const linkHealthPermissions = {
  origins: ["http://*/*", "https://*/*"]
};
const previewCapturePermissions = {
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
    
    label.append(checkbox, document.createTextNode(folder.path), controlsWrap);
    folderList.append(label);
  }
}

function getSelectedFolderIds() {
  return [...folderList.querySelectorAll("input:checked")].map((input) => input.value);
}

async function requestLinkHealthPermission() {
  if (!api.permissions?.request) {
    return false;
  }

  try {
    return await api.permissions.request(linkHealthPermissions);
  } catch {
    return false;
  }
}

async function requestPreviewCapturePermission() {
  if (!api.permissions?.request) {
    return false;
  }

  try {
    return await api.permissions.request(previewCapturePermissions);
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
  const [tree, currentSettings] = await Promise.all([api.bookmarks.getTree(), getSettings(api)]);
  
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
}

themeSelect.addEventListener("change", () => {
  applyTheme(themeSelect.value);
});

saveButton.addEventListener("click", async () => {
  try {
    const selectedFolderIds = getSelectedFolderIds();
    if (selectedFolderIds.length === 0) {
      status.textContent = "Selecciona al menos una carpeta.";
      return;
    }

    const linkHealthRequested = linkHealth.checked;
    const linkHealthEnabled = linkHealthRequested
      ? await requestLinkHealthPermission()
      : false;
    const previewCaptureRequested = previewCapture.checked;
    const previewCaptureEnabled = previewCaptureRequested
      ? await requestPreviewCapturePermission()
      : false;

    if (!linkHealthRequested) {
      await removePermission(linkHealthPermissions);
    }

    if (!previewCaptureRequested) {
      await removePermission(previewCapturePermissions);
    }

    if (!linkHealthEnabled) {
      linkHealth.checked = false;
    }

    if (!previewCaptureEnabled) {
      previewCapture.checked = false;
    }

    const folderModes = {};
    const folderSorts = {};
    
    folderList.querySelectorAll(".folder-mode-select").forEach(select => {
      if (select.value !== "default") {
        folderModes[select.dataset.folderId] = select.value;
      }
    });

    folderList.querySelectorAll(".folder-sort-select").forEach(select => {
      if (select.value !== "default") {
        folderSorts[select.dataset.folderId] = select.value;
      }
    });

    await saveSettings(api, {
      selectedFolderIds,
      automaticTagsEnabled: automaticTags.checked,
      manualTagsEnabled: manualTags.checked,
      showPinnedFolder: showPinnedFolder.checked,
      linkHealthEnabled: linkHealthEnabled,
      previewEnabled: previewEnabled.checked,
      previewCaptureEnabled: previewCaptureEnabled,
      theme: themeSelect.value,
      defaultFolderMode: defaultModeSelect.value,
      defaultFolderSort: defaultSortSelect.value,
      folderModes,
      folderSorts,
      setupComplete: true
    });

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
