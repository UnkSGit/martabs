import { getBrowserApi } from "../shared/browser-api.js";
import { getFolderOptions } from "../shared/bookmarks.js";
import { getSettings, saveSettings } from "../shared/storage.js";

const api = getBrowserApi();
const folderList = document.querySelector("#folder-list");
const saveButton = document.querySelector("#save");
const status = document.querySelector("#status");
const automaticTags = document.querySelector("#automatic-tags");
const manualTags = document.querySelector("#manual-tags");
const linkHealth = document.querySelector("#link-health");
const previewCapture = document.querySelector("#preview-capture");
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

function renderFolders(folders, selectedFolderIds) {
  folderList.innerHTML = "";
  for (const folder of folders) {
    const label = document.createElement("label");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = folder.id;
    checkbox.checked = selectedFolderIds.includes(folder.id);
    label.append(checkbox, document.createTextNode(folder.path));
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
  const [tree, settings] = await Promise.all([api.bookmarks.getTree(), getSettings(api)]);
  applyTheme(settings.theme || "system");
  renderFolders(getFolderOptions(tree), settings.selectedFolderIds);
  automaticTags.checked = settings.automaticTagsEnabled;
  manualTags.checked = settings.manualTagsEnabled;
  linkHealth.checked = settings.linkHealthEnabled;
  previewCapture.checked = settings.previewCaptureEnabled;
  themeSelect.value = settings.theme || "system";
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

    await saveSettings(api, {
      selectedFolderIds,
      automaticTagsEnabled: automaticTags.checked,
      manualTagsEnabled: manualTags.checked,
      linkHealthEnabled: linkHealthEnabled,
      previewCaptureEnabled: previewCaptureEnabled,
      theme: themeSelect.value,
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
