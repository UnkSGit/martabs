import { getBrowserApi } from "../shared/browser-api.js";
import { buildBookmarkIndex } from "../shared/bookmarks.js";
import { mergeTags } from "../shared/tags.js";
import { applyLinkCheckResult } from "../shared/link-health.js";
import {
  getBookmarkIndex,
  getLinkHealth,
  getManualTags,
  getSettings,
  STORAGE_KEYS,
  saveBookmarkIndex,
  saveLinkHealth
} from "../shared/storage.js";

const api = getBrowserApi();
const LINK_HEALTH_ALARM = "bookmark-home-link-health";
const BATCH_SIZE = 5;
const TIMEOUT_MS = 8000;

let rebuildInProgress = false;
let rebuildRequested = false;

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

  const index = buildBookmarkIndex(tree, settings.selectedFolderIds).map((bookmark) => {
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

async function checkUrl(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    let response = await fetch(url, {
      method: "HEAD",
      cache: "no-store",
      signal: controller.signal
    });
    if (response.status === 405 || response.status === 403) {
      response = await fetch(url, {
        method: "GET",
        cache: "no-store",
        signal: controller.signal
      });
    }
    return {
      ok: response.ok || (response.status >= 300 && response.status < 400),
      status: response.status,
      checkedAt: Date.now()
    };
  } catch {
    return {
      ok: false,
      status: "network-error",
      checkedAt: Date.now()
    };
  } finally {
    clearTimeout(timeout);
  }
}

function pickHealthBatch(bookmarks, linkHealth, checkAll = false) {
  const sortedBookmarks = [...bookmarks].sort((a, b) => {
    const aChecked = linkHealth[a.id]?.lastCheckedAt || 0;
    const bChecked = linkHealth[b.id]?.lastCheckedAt || 0;
    return aChecked - bChecked;
  });

  return checkAll ? sortedBookmarks : sortedBookmarks.slice(0, BATCH_SIZE);
}

function selectedFoldersChanged(previousSettings = {}, nextSettings = {}) {
  const previous = previousSettings.selectedFolderIds || [];
  const next = nextSettings.selectedFolderIds || [];
  if (previous.length !== next.length) return true;

  const previousSet = new Set(previous);
  return next.some((folderId) => !previousSet.has(folderId));
}

async function runLinkHealthCheck({ checkAll = false } = {}) {
  const settings = await getSettings(api);
  if (!settings.linkHealthEnabled) {
    return { checked: 0, skipped: true };
  }

  const [bookmarks, linkHealth] = await Promise.all([getBookmarkIndex(api), getLinkHealth(api)]);
  const batch = pickHealthBatch(bookmarks, linkHealth, checkAll);

  for (const bookmark of batch) {
    const result = await checkUrl(bookmark.url);
    linkHealth[bookmark.id] = applyLinkCheckResult(linkHealth[bookmark.id], result);
  }

  await saveLinkHealth(api, linkHealth);
  requestRebuild("link-health");
  return { checked: batch.length, skipped: false, full: checkAll };
}

async function syncLinkHealthAlarm() {
  const settings = await getSettings(api);
  if (!api.alarms) return;
  if (settings.linkHealthEnabled) {
    await api.alarms.create(LINK_HEALTH_ALARM, { periodInMinutes: 24 * 60 });
  } else {
    await api.alarms.clear(LINK_HEALTH_ALARM);
  }
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
      const previousSettings = changes[STORAGE_KEYS.settings].oldValue || {};
      const nextSettings = changes[STORAGE_KEYS.settings].newValue || {};
      handleSettingsChange(previousSettings, nextSettings).catch((error) =>
        console.error("Settings change handling failed", error)
      );
    }
  });
}

async function handleSettingsChange(previousSettings, nextSettings) {
  await syncLinkHealthAlarm();
  await rebuildIndex();

  const shouldCheckSelectedFolders =
    nextSettings.linkHealthEnabled &&
    (!previousSettings.linkHealthEnabled || selectedFoldersChanged(previousSettings, nextSettings));

  if (shouldCheckSelectedFolders) {
    await runLinkHealthCheck({ checkAll: true });
  }
}

listenToBookmarkChanges();
listenToSettingsChanges();

if (api.alarms) {
  api.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === LINK_HEALTH_ALARM) {
      runLinkHealthCheck().catch((error) => console.error("Link health check failed", error));
    }
  });
}

requestRebuild("initial");
syncLinkHealthAlarm().catch((error) => console.error("Link health alarm setup failed", error));
