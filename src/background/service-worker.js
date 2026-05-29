import { getBrowserApi } from "../shared/browser-api.js";
import { buildBookmarkIndex } from "../shared/bookmarks.js";
import { mergeTags } from "../shared/tags.js";
import {
  getCapturedPreviews,
  getLinkHealth,
  getManualTags,
  getPendingPreviewCaptures,
  getSettings,
  STORAGE_KEYS,
  saveBookmarkIndex,
  saveCapturedPreviews,
  savePendingPreviewCaptures
} from "../shared/storage.js";

const api = getBrowserApi();
const CAPTURE_OPENED_BOOKMARK = "CAPTURE_OPENED_BOOKMARK";
const MAX_CAPTURED_PREVIEWS = 20;
export let CAPTURE_DELAY_MS = 1440;
export function setCaptureDelayMs(ms) {
  CAPTURE_DELAY_MS = ms;
}
const PENDING_CAPTURE_TTL_MS = 30000;

function isSameHost(url1, url2) {
  try {
    const u1 = new URL(url1);
    const u2 = new URL(url2);
    let h1 = u1.hostname.toLowerCase();
    let h2 = u2.hostname.toLowerCase();
    if (h1.startsWith("www.")) h1 = h1.slice(4);
    if (h2.startsWith("www.")) h2 = h2.slice(4);
    return h1 === h2;
  } catch {
    return false;
  }
}

let rebuildInProgress = false;
let rebuildRequested = false;

function trimCapturedPreviews(previews) {
  return Object.fromEntries(
    Object.entries(previews)
      .sort(([, a], [, b]) => (b.capturedAt || 0) - (a.capturedAt || 0))
      .slice(0, MAX_CAPTURED_PREVIEWS)
  );
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function armPreviewCapture({ bookmarkId, url, tabId, windowId }) {
  if (!bookmarkId || !tabId || !windowId || !/^https?:\/\//i.test(url || "")) {
    return false;
  }

  const settings = await getSettings(api);
  if (!settings.previewCaptureEnabled) {
    return false;
  }

  const pendingPreviewCaptures = await getPendingPreviewCaptures(api);
  pendingPreviewCaptures[String(tabId)] = {
    bookmarkId,
    url,
    windowId,
    armedAt: Date.now()
  };
  await savePendingPreviewCaptures(api, pendingPreviewCaptures);
  return true;
}

async function handleCompletedPreviewCapture(tabId, tab) {
  const pendingPreviewCaptures = await getPendingPreviewCaptures(api);
  const pending = pendingPreviewCaptures[String(tabId)];
  if (!pending) return;

  // Clean pending immediately to prevent duplicate runs/clutter
  delete pendingPreviewCaptures[String(tabId)];
  await savePendingPreviewCaptures(api, pendingPreviewCaptures);

  if (Date.now() - pending.armedAt > PENDING_CAPTURE_TTL_MS) return;

  await wait(CAPTURE_DELAY_MS);

  try {
    const currentTab = await api.tabs.get(tabId);
    if (!currentTab || !currentTab.active || currentTab.windowId !== pending.windowId) {
      return;
    }

    if (!isSameHost(currentTab.url, pending.url)) {
      return;
    }

    const image = await api.tabs.captureVisibleTab(pending.windowId, {
      format: "jpeg",
      quality: 35
    });

    if (!image) return;

    const previews = await getCapturedPreviews(api);
    previews[pending.bookmarkId] = {
      image,
      url: pending.url,
      sourceUrl: currentTab.url || pending.url,
      capturedAt: Date.now(),
      source: "opened-from-martabs"
    };
    await saveCapturedPreviews(api, trimCapturedPreviews(previews));
  } catch (error) {
    // Fail silently
  }
}

async function rebuildIndex() {
  const settings = await getSettings(api);
  if (!settings.setupComplete || settings.selectedFolderIds.length === 0) {
    await saveBookmarkIndex(api, []);
    return [];
  }

  const [tree, manualTags, linkHealth] = await Promise.all([
    api.bookmarks.getTree(),
    getManualTags(api),
    getLinkHealth(api)
  ]);

  const index = buildBookmarkIndex(tree, settings.selectedFolderIds, settings.bookmarkFolderOverrides || {}).map((bookmark) => {
    const bookmarkManualTags = manualTags[bookmark.id] || [];
    return {
      ...bookmark,
      manualTags: bookmarkManualTags,
      allTags: mergeTags(bookmark.automaticTags, bookmarkManualTags),
      linkHealth: linkHealth[bookmark.id] || null
    };
  });

  await saveBookmarkIndex(api, index);
  return index;
}

function requestRebuild(reason) {
  rebuildRequested = true;
  if (rebuildInProgress) return;

  rebuildInProgress = true;
  queueMicrotask(async () => {
    try {
      while (rebuildRequested) {
        rebuildRequested = false;
        await rebuildIndex();
      }
    } catch (error) {
      console.error(`Bookmark index rebuild failed (${reason})`, error);
    } finally {
      rebuildInProgress = false;
      if (rebuildRequested) requestRebuild("queued");
    }
  });
}

function listenToBookmarkChanges() {
  const scheduleRebuild = () => requestRebuild("bookmarks");

  api.bookmarks.onCreated.addListener(scheduleRebuild);
  api.bookmarks.onChanged.addListener(scheduleRebuild);
  api.bookmarks.onMoved.addListener(scheduleRebuild);
  api.bookmarks.onRemoved.addListener(scheduleRebuild);
}

function listenToSettingsChanges() {
  api.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "local" && changes[STORAGE_KEYS.settings]) {
      const oldSettings = changes[STORAGE_KEYS.settings].oldValue || {};
      const newSettings = changes[STORAGE_KEYS.settings].newValue || {};
      
      const rebuildAffectingKeys = ["selectedFolderIds", "setupComplete", "bookmarkFolderOverrides"];
      let needsRebuild = false;
      for (const key of rebuildAffectingKeys) {
        if (JSON.stringify(oldSettings[key]) !== JSON.stringify(newSettings[key])) {
          needsRebuild = true;
          break;
        }
      }
      if (needsRebuild) {
        requestRebuild("settings");
      }
    }
  });
}

listenToBookmarkChanges();
listenToSettingsChanges();

if (api.runtime?.onMessage) {
  api.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.type !== CAPTURE_OPENED_BOOKMARK) return false;

    armPreviewCapture({
      bookmarkId: message.bookmarkId,
      url: message.url,
      tabId: sender.tab?.id,
      windowId: sender.tab?.windowId
    })
      .then((armed) => sendResponse({ armed }))
      .catch((error) => {
        console.error("Could not arm opened bookmark preview capture", error);
        sendResponse({ armed: false });
      });

    return true;
  });
}

if (api.tabs?.onUpdated) {
  api.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status !== "complete") return;
    handleCompletedPreviewCapture(tabId, tab).catch(() => {});
  });
}

if (api.tabs?.onRemoved) {
  api.tabs.onRemoved.addListener(async (tabId) => {
    try {
      const pendingPreviewCaptures = await getPendingPreviewCaptures(api);
      if (pendingPreviewCaptures[String(tabId)]) {
        delete pendingPreviewCaptures[String(tabId)];
        await savePendingPreviewCaptures(api, pendingPreviewCaptures);
      }
    } catch {
      // Fail silently
    }
  });
}

requestRebuild("initial");
