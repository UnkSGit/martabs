const DEFAULT_SETTINGS = {
  selectedFolderIds: [],
  automaticTagsEnabled: true,
  manualTagsEnabled: true,
  linkHealthEnabled: false,
  previewEnabled: true,
  previewCaptureEnabled: false,
  showPinnedFolder: true,
  theme: "system",
  language: "system",
  setupComplete: false,
  defaultFolderMode: "list",
  folderModes: {},
  defaultFolderSort: "browser",
  folderSorts: {},
  folderBookmarkOrders: {},
  bookmarkFolderOverrides: {},
  folderNameOverrides: {},
  customFavicons: {},
  brokenCustomFavicons: {}
};

export const STORAGE_KEYS = {
  settings: "settings",
  bookmarkIndex: "bookmarkIndex",
  manualTags: "manualTags",
  linkHealth: "linkHealth",
  capturedPreviews: "capturedPreviews",
  pendingPreviewCaptures: "pendingPreviewCaptures",
  pinnedBookmarks: "pinnedBookmarks"
};

export async function getSettings(api) {
  const data = await api.storage.local.get(STORAGE_KEYS.settings);
  return { ...DEFAULT_SETTINGS, ...(data[STORAGE_KEYS.settings] || {}) };
}

export async function saveSettings(api, settings) {
  await api.storage.local.set({
    [STORAGE_KEYS.settings]: { ...DEFAULT_SETTINGS, ...settings }
  });
}

export async function getBookmarkIndex(api) {
  return getStoredValue(api, STORAGE_KEYS.bookmarkIndex, []);
}

export async function saveBookmarkIndex(api, bookmarkIndex) {
  await setStoredValue(api, STORAGE_KEYS.bookmarkIndex, bookmarkIndex);
}

export async function getManualTags(api) {
  return getStoredValue(api, STORAGE_KEYS.manualTags, {});
}

export async function getLinkHealth(api) {
  return getStoredValue(api, STORAGE_KEYS.linkHealth, {});
}

export async function saveLinkHealth(api, linkHealth) {
  await setStoredValue(api, STORAGE_KEYS.linkHealth, linkHealth);
}

export async function getCapturedPreviews(api) {
  return getStoredValue(api, STORAGE_KEYS.capturedPreviews, {});
}

export async function saveCapturedPreviews(api, capturedPreviews) {
  await setStoredValue(api, STORAGE_KEYS.capturedPreviews, capturedPreviews);
}

export async function getPendingPreviewCaptures(api) {
  return getStoredValue(api, STORAGE_KEYS.pendingPreviewCaptures, {});
}

export async function savePendingPreviewCaptures(api, pendingPreviewCaptures) {
  await setStoredValue(api, STORAGE_KEYS.pendingPreviewCaptures, pendingPreviewCaptures);
}

export async function getStoredValue(api, key, fallback) {
  const data = await api.storage.local.get(key);
  return data[key] ?? fallback;
}

export async function setStoredValue(api, key, value) {
  await api.storage.local.set({ [key]: value });
}
