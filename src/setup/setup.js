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
const previewCapture = document.querySelector("#preview-capture");
const defaultModeSelect = document.querySelector("#default-mode-select");
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

function renderFolders(folders, selectedFolderIds, folderModes = {}, collapsedFolders = {}) {
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
    controlsWrap.style.marginLeft = "auto";
    controlsWrap.style.display = "flex";
    controlsWrap.style.gap = "8px";
    controlsWrap.style.alignItems = "center";

    const modeSelect = document.createElement("select");
    modeSelect.className = "folder-mode-select";
    modeSelect.dataset.folderId = folder.id;
    modeSelect.innerHTML = `
      <option value="default">Predeterminado</option>
      <option value="list">Lista completa</option>
      <option value="compact">Lista compacta</option>
      <option value="icons">Grilla de iconos</option>
      <option value="quicklinks">Quicklinks</option>
    `;
    modeSelect.value = folderModes[folder.id] || "default";
    
    // Stop drag when interacting with select
    modeSelect.addEventListener("mousedown", (e) => e.stopPropagation());

    const collapsedCheck = document.createElement("label");
    collapsedCheck.style.fontSize = "12px";
    collapsedCheck.style.display = "flex";
    collapsedCheck.style.alignItems = "center";
    collapsedCheck.style.gap = "4px";
    
    const collapsedInput = document.createElement("input");
    collapsedInput.type = "checkbox";
    collapsedInput.className = "folder-collapsed-check";
    collapsedInput.dataset.folderId = folder.id;
    collapsedInput.checked = !!collapsedFolders[folder.id];
    
    // Stop drag when interacting with checkbox
    collapsedInput.addEventListener("mousedown", (e) => e.stopPropagation());
    
    collapsedCheck.append(collapsedInput, "Colapsado");
    
    controlsWrap.append(modeSelect, collapsedCheck);
    
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
  previewCapture.checked = currentSettings.previewCaptureEnabled;
  themeSelect.value = currentSettings.theme || "system";
  defaultModeSelect.value = currentSettings.defaultFolderMode || "list";

  applyTheme(themeSelect.value);

  const folders = getFolderOptions(tree);
  renderFolders(folders, currentSettings.selectedFolderIds, currentSettings.folderModes || {}, currentSettings.collapsedFolders || {});
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
    const collapsedFolders = {};
    
    folderList.querySelectorAll(".folder-mode-select").forEach(select => {
      if (select.value !== "default") {
        folderModes[select.dataset.folderId] = select.value;
      }
    });
    
    folderList.querySelectorAll(".folder-collapsed-check").forEach(check => {
      if (check.checked) {
        collapsedFolders[check.dataset.folderId] = true;
      }
    });

    await saveSettings(api, {
      selectedFolderIds,
      automaticTagsEnabled: automaticTags.checked,
      manualTagsEnabled: manualTags.checked,
      showPinnedFolder: showPinnedFolder.checked,
      linkHealthEnabled: linkHealthEnabled,
      previewCaptureEnabled: previewCaptureEnabled,
      theme: themeSelect.value,
      defaultFolderMode: defaultModeSelect.value,
      folderModes,
      collapsedFolders,
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
