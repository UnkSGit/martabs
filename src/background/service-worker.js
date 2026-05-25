import { getBrowserApi } from "../shared/browser-api.js";
import { buildBookmarkIndex } from "../shared/bookmarks.js";
import { mergeTags } from "../shared/tags.js";
import {
  getLinkHealth,
  getManualTags,
  getSettings,
  STORAGE_KEYS,
  saveBookmarkIndex
} from "../shared/storage.js";

const api = getBrowserApi();

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
      requestRebuild("settings");
    }
  });
}

listenToBookmarkChanges();
listenToSettingsChanges();

requestRebuild("initial");
