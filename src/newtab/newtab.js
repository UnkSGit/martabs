import { getBrowserApi } from "../shared/browser-api.js";
import { searchBookmarks } from "../shared/search.js";
import { sortBookmarks, SORT_MODES } from "../shared/bookmark-sort.js";
import {
  getBookmarkIndex,
  getCapturedPreviews,
  getSettings,
  getLinkHealth,
  saveLinkHealth,
  STORAGE_KEYS,
  getStoredValue,
  setStoredValue
} from "../shared/storage.js";
import { el, formatDate } from "../shared/render.js";
import { applyLinkCheckResult } from "../shared/link-health.js";
import { localizeHtml, t, initI18n } from "../shared/i18n-helper.js";
import { mergeTags } from "../shared/tags.js";

const api = getBrowserApi();
const CAPTURE_OPENED_BOOKMARK = "CAPTURE_OPENED_BOOKMARK";
const statusLine = document.querySelector("#status-line");
const searchInput = document.querySelector("#search");
const content = document.querySelector("#content");
const settingsButton = document.querySelector("#settings");
const previewCard = document.querySelector("#preview-card");
const editModal = document.querySelector("#edit-modal");
const editForm = document.querySelector("#edit-form");
const editTitle = document.querySelector("#edit-title");
const editUrl = document.querySelector("#edit-url");
const editTags = document.querySelector("#edit-tags");
const editDelete = document.querySelector("#edit-delete");
const editCancel = document.querySelector("#edit-cancel");
const editSave = document.querySelector("#edit-save");
const editFavicon = document.querySelector("#edit-favicon");
const editFaviconError = document.querySelector("#edit-favicon-error");
const PINNED_FOLDER_KEY = "__martabs_pinned__";

let bookmarks = [];
let currentSettings = null;
let capturedPreviews = {};
let pinnedBookmarks = [];
let hoverTimeout = null;
let hideTimeout = null;
let pendingViewFocusFolderId = null;
let pendingViewFocusTimer = null;

const TIMEOUT_MS = 8000;

// --- Theme ---

function applyTheme(theme) {
  const root = document.documentElement;
  root.classList.remove("theme-light", "theme-dark");
  if (theme === "light") {
    root.classList.add("theme-light");
  } else if (theme === "dark") {
    root.classList.add("theme-dark");
  }
}

// --- Link health check (runs in the new tab page) ---

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
    return { ok: false, status: "network-error", checkedAt: Date.now() };
  } finally {
    clearTimeout(timeout);
  }
}

async function reviewFolderHealth(folderBookmarks, reviewButton, progressEl) {
  reviewButton.disabled = true;
  reviewButton.textContent = t(api, "reviewing");
  const total = folderBookmarks.length;

  const linkHealth = await getLinkHealth(api);

  for (let i = 0; i < folderBookmarks.length; i++) {
    const bookmark = folderBookmarks[i];
    progressEl.textContent = `${i + 1}/${total}`;

    const result = await checkUrl(bookmark.url);
    linkHealth[bookmark.id] = applyLinkCheckResult(linkHealth[bookmark.id], result);

    // Update in-memory bookmark so render() reflects latest state
    const idx = bookmarks.findIndex((b) => b.id === bookmark.id);
    if (idx !== -1) {
      bookmarks[idx] = { ...bookmarks[idx], linkHealth: linkHealth[bookmark.id] };
    }
  }

  await saveLinkHealth(api, linkHealth);
  render();
}

// --- Favicon ---

function faviconLabel(bookmark) {
  return (bookmark.domain || bookmark.title || "?").slice(0, 1).toUpperCase();
}

function isFirefoxRuntime() {
  return typeof navigator !== "undefined" && /Firefox/i.test(navigator.userAgent);
}

function getBrowserFaviconUrl(url, size = 64) {
  if (!isFirefoxRuntime() && typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.id) {
    return `chrome-extension://${chrome.runtime.id}/_favicon/?pageUrl=${encodeURIComponent(url)}&size=${size}`;
  }
  return "";
}

function getRootFaviconUrl(url) {
  try {
    return `${new URL(url).origin}/favicon.ico`;
  } catch {
    return "";
  }
}

function getFaviconUrl(url) {
  return getBrowserFaviconUrl(url, 32) || getRootFaviconUrl(url);
}

function getFaviconCandidates(url) {
  return [getBrowserFaviconUrl(url), getRootFaviconUrl(url)].filter(Boolean);
}

function getDefaultFaviconUrl(url) {
  const [faviconUrl] = getFaviconCandidates(url);
  return faviconUrl || "";
}

function renderFaviconFallback(bookmark) {
  return el("span", { class: "favicon-fallback", text: faviconLabel(bookmark) });
}

function applyNextDefaultFavicon(contentNode, fallbackUrls, bookmark) {
  const nextIndex = Number(contentNode.dataset.faviconFallbackIndex || 0) + 1;
  const nextUrl = fallbackUrls[nextIndex];
  if (!nextUrl) {
    contentNode.replaceWith(renderFaviconFallback(bookmark));
    return;
  }

  contentNode.dataset.faviconSource = "default";
  contentNode.dataset.faviconFallbackIndex = String(nextIndex);
  contentNode.src = nextUrl;
}

function applyFirstDefaultFavicon(contentNode, fallbackUrls, bookmark) {
  const fallbackUrl = fallbackUrls[0];
  if (!fallbackUrl) {
    contentNode.replaceWith(renderFaviconFallback(bookmark));
    return;
  }

  contentNode.dataset.faviconSource = "default";
  contentNode.dataset.faviconFallbackIndex = "0";
  contentNode.src = fallbackUrl;
}

function markCustomFaviconBroken(bookmark) {
  currentSettings.brokenCustomFavicons = currentSettings.brokenCustomFavicons || {};
  if (currentSettings.brokenCustomFavicons[bookmark.id]) {
    return;
  }

  currentSettings.brokenCustomFavicons[bookmark.id] = true;
  setStoredValue(api, STORAGE_KEYS.settings, currentSettings).catch(console.error);
}

function clearCustomFaviconBroken(bookmark) {
  if (!currentSettings?.brokenCustomFavicons?.[bookmark.id]) {
    return;
  }

  delete currentSettings.brokenCustomFavicons[bookmark.id];
  setStoredValue(api, STORAGE_KEYS.settings, currentSettings).catch(console.error);
}

function handleFaviconError(contentNode, bookmark, fallbackUrls) {
  if (contentNode.dataset.faviconSource === "custom") {
    markCustomFaviconBroken(bookmark);
    contentNode.onload = null;
    applyFirstDefaultFavicon(contentNode, fallbackUrls, bookmark);
    return;
  }

  applyNextDefaultFavicon(contentNode, fallbackUrls, bookmark);
}

function handleFaviconLoad(contentNode, bookmark) {
  if (contentNode.dataset.faviconSource === "custom") {
    clearCustomFaviconBroken(bookmark);
  }
}

function createFaviconImage(src, source, fallbackIndex = "") {
  const image = el("img", { class: "favicon-img", src, alt: "" });
  image.dataset.faviconSource = source;
  image.dataset.faviconFallbackIndex = fallbackIndex;
  return image;
}

// --- Rendering helpers ---

function renderTags(bookmark) {
  const children = [];
  const manual = bookmark.manualTags || [];
  const automatic = bookmark.automaticTags || [];

  for (const tag of manual) {
    children.push(el("span", { class: "tag tag-manual", text: tag }));
  }

  const manualSet = new Set(manual.map((tag) => tag.toLowerCase()));
  for (const tag of automatic) {
    if (!manualSet.has(tag.toLowerCase())) {
      children.push(el("span", { class: "tag tag-auto", text: tag }));
    }
  }

  return el("div", { class: "tags" }, children.slice(0, 4));
}

function renderFavicon(bookmark) {
  const customFavicon = currentSettings?.customFavicons?.[bookmark.id];
  const isBroken = currentSettings?.brokenCustomFavicons?.[bookmark.id];
  const usingCustomFavicon = Boolean(customFavicon && !isBroken);
  const fallbackUrls = getFaviconCandidates(bookmark.url);
  const faviconUrl = usingCustomFavicon ? customFavicon : getDefaultFaviconUrl(bookmark.url);

  const contentNode = faviconUrl
    ? createFaviconImage(faviconUrl, usingCustomFavicon ? "custom" : "default", usingCustomFavicon ? "" : "0")
    : renderFaviconFallback(bookmark);
  const faviconContainer = el("div", { class: "favicon-container" }, [contentNode]);

  if (contentNode.tagName === "IMG") {
    contentNode.onerror = () => handleFaviconError(contentNode, bookmark, fallbackUrls);
    contentNode.onload = () => handleFaviconLoad(contentNode, bookmark);
  }

  if (currentSettings?.linkHealthEnabled && bookmark.linkHealth && bookmark.linkHealth.consecutiveFailures > 0) {
    faviconContainer.append(el("div", { class: "health-dot-indicator" }));
  }

  return faviconContainer;
}

function getBookmarkHealth(bookmark) {
  if (!currentSettings?.linkHealthEnabled) {
    return null;
  }

  if (!bookmark.linkHealth?.lastCheckedAt) {
    return {
      state: "unchecked",
      text: t(api, "healthUnchecked")
    };
  }

  if (bookmark.linkHealth.consecutiveFailures > 0) {
    return {
      state: "broken",
      text: t(api, "healthBroken", [bookmark.linkHealth.lastStatus || "Error"])
    };
  }

  return {
    state: "ok",
    text: t(api, "healthOk")
  };
}

async function openBookmarkFromMartabs(bookmark) {
  try {
    await api.runtime.sendMessage({
      type: CAPTURE_OPENED_BOOKMARK,
      bookmarkId: bookmark.id,
      url: bookmark.url
    });
  } catch {
    // Opening the bookmark is more important than capturing the preview.
  } finally {
    window.location.href = bookmark.url;
  }
}

function renderBookmark(bookmark, rich = false) {
  const details = [
    bookmark.domain,
    rich && bookmark.folderPath,
    rich && formatDate(bookmark.dateAdded)
  ].filter(Boolean).join(" - ");

  const isBroken =
    currentSettings?.linkHealthEnabled &&
    bookmark.linkHealth &&
    bookmark.linkHealth.consecutiveFailures > 0;
  const bookmarkElement = el(
    "a",
    {
      class: `bookmark${isBroken ? " is-broken" : ""}`,
      href: bookmark.url,
      title: isBroken
        ? t(api, "linkHealthBrokenTitle")
        : bookmark.title
    },
    [
      renderFavicon(bookmark),
      el("div", { class: "bookmark-details" }, [
        el("span", { class: "title", text: bookmark.title }),
        rich ? el("span", { class: "domain", text: details }) : null,
        rich ? renderTags(bookmark) : null
      ].filter(Boolean))
    ]
  );

  const editBtn = el("button", { class: "bookmark-edit-btn", title: t(api, "bookmarkEditBtn"), type: "button" });
  
  editBtn.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    showEditModal(bookmark);
  });
  
  const isPinned = pinnedBookmarks.includes(bookmark.id);
  const pinBtn = el("button", { class: `bookmark-pin-btn${isPinned ? " is-pinned" : ""}`, title: isPinned ? t(api, "bookmarkUnpinBtn") : t(api, "bookmarkPinBtn"), type: "button" });
  
  const svgDoc = new DOMParser().parseFromString(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${isPinned ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14">
    <line x1="12" y1="17" x2="12" y2="22"></line><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 11.2V6a3 3 0 0 0-6 0v5.2a2 2 0 0 1-1.11 1.35l-1.78.9A2 2 0 0 0 5 15.24Z"></path>
  </svg>`, "image/svg+xml");
  pinBtn.appendChild(svgDoc.documentElement);
  
  pinBtn.addEventListener("click", async (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (isPinned) {
      pinnedBookmarks = pinnedBookmarks.filter(id => id !== bookmark.id);
    } else {
      pinnedBookmarks.push(bookmark.id);
    }
    await setStoredValue(api, STORAGE_KEYS.pinnedBookmarks, pinnedBookmarks);
    render();
  });
  
  const actionsContainer = el("div", { class: "bookmark-actions" }, [pinBtn, editBtn]);
  bookmarkElement.append(actionsContainer);

  bookmarkElement.addEventListener("click", (event) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    event.preventDefault();
    openBookmarkFromMartabs(bookmark);
  });

  bookmarkElement.addEventListener("mouseenter", () => {
    clearTimeout(hoverTimeout);
    clearTimeout(hideTimeout);
    hoverTimeout = setTimeout(() => showPreviewCard(bookmark, bookmarkElement), 350);
  });

  bookmarkElement.addEventListener("mouseleave", () => {
    clearTimeout(hoverTimeout);
    hideTimeout = setTimeout(hidePreviewCard, 100);
  });

  return bookmarkElement;
}

function showPreviewCard(bookmark, anchorElement) {
  if (currentSettings?.previewEnabled === false) return;

  previewCard.innerHTML = "";

  const capturedPreview = capturedPreviews[bookmark.id];
  const thumbnailContainer = capturedPreview?.image
    ? el("div", { class: "preview-thumbnail-container has-capture" }, [
        el("img", { class: "preview-capture-img", src: capturedPreview.image, alt: "" }),
        el("span", { class: "preview-local-label", text: t(api, "previewLabelLocal") })
      ])
    : el("div", { class: "preview-thumbnail-container" }, [
        el("span", { class: "preview-local-mark", text: faviconLabel(bookmark) }),
        el("span", { class: "preview-local-label", text: t(api, "previewLabelQuick") })
      ]);

  const health = getBookmarkHealth(bookmark);
  const healthDetails = !health
    ? null
    : el("div", { class: "preview-health" }, [
        el("div", { class: `health-dot ${health.state}` }),
        el("span", { class: "health-status-text", text: health.text })
      ]);

  const detailsContainer = el("div", { class: "preview-details" }, [
    el("div", { class: "preview-title", text: bookmark.title }),
    el("div", { class: "preview-domain", text: bookmark.domain || t(api, "domainNone") }),
    bookmark.folderPath ? el("div", { class: "preview-domain", text: bookmark.folderPath }) : null,
    bookmark.dateAdded ? el("div", { class: "preview-domain", text: t(api, "dateAdded", [formatDate(bookmark.dateAdded)]) }) : null,
    healthDetails,
    renderTags(bookmark)
  ].filter(Boolean));

  previewCard.append(thumbnailContainer, detailsContainer);

  previewCard.hidden = false;
  
  const rect = anchorElement.getBoundingClientRect();
  const cardWidth = 280;
  const cardHeight = previewCard.offsetHeight;

  let left = rect.left + rect.width + 12;
  if (left + cardWidth > window.innerWidth) {
    left = rect.left - cardWidth - 12;
  }
  if (left < 0) left = 12;

  let top = rect.top + window.scrollY - 10;
  // If card overflows bottom of viewport, adjust it upwards
  if (rect.top - 10 + cardHeight > window.innerHeight) {
    top = window.scrollY + window.innerHeight - cardHeight - 12;
  }
  // Ensure it doesn't go above the top of the document
  if (top < window.scrollY + 12) {
    top = window.scrollY + 12;
  }

  previewCard.style.left = `${left}px`;
  previewCard.style.top = `${top}px`;
  requestAnimationFrame(() => previewCard.classList.add("visible"));
}

function hidePreviewCard() {
  previewCard.classList.remove("visible");
  previewCard.hidden = true;
}

// --- Layout ---

function groupByFolder(items) {
  return Map.groupBy
    ? Map.groupBy(items, (bookmark) => bookmark.folderPath || t(api, "noFolder"))
    : items.reduce((map, bookmark) => {
        const key = bookmark.folderPath || t(api, "noFolder");
        map.set(key, [...(map.get(key) || []), bookmark]);
        return map;
      }, new Map());
}

function scheduleViewFocus(folderId) {
  pendingViewFocusFolderId = String(folderId);
  clearTimeout(pendingViewFocusTimer);
  pendingViewFocusTimer = setTimeout(() => {
    if (pendingViewFocusFolderId === String(folderId)) {
      pendingViewFocusFolderId = null;
    }
  }, 1200);
}

function focusPendingViewFolder() {
  if (!pendingViewFocusFolderId) return;
  const folderId = pendingViewFocusFolderId;

  requestAnimationFrame(() => {
    const group = Array.from(content.querySelectorAll(".group"))
      .find((node) => node.getAttribute("data-folder-id") === folderId);
    if (!group) return;

    group.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
    group.classList.add("is-view-focus");
    setTimeout(() => {
      group.classList.remove("is-view-focus");
    }, 900);
  });
}

function applyFolderModeClass(folderId, mode) {
  const groupEl = content.querySelector(`article.group[data-folder-id="${folderId}"]`);
  if (!groupEl) return;
  const listEl = groupEl.querySelector(".bookmark-list");
  if (!listEl) return;

  const targetClass = mode !== "list" ? `mode-${mode}` : "";
  const modes = ["mode-compact", "mode-icons", "mode-icons-large", "mode-quicklinks"];
  const hasTargetClass = targetClass ? listEl.classList.contains(targetClass) : !modes.some((m) => listEl.classList.contains(m));

  if (hasTargetClass) {
    return;
  }

  listEl.classList.remove(...modes);
  if (targetClass) {
    listEl.classList.add(targetClass);
  }
}

function onlyFolderModesChanged(oldSettings, newSettings) {
  const allKeys = new Set([...Object.keys(oldSettings), ...Object.keys(newSettings)]);
  for (const key of allKeys) {
    if (key === "folderModes") continue;
    const oldVal = oldSettings[key];
    const newVal = newSettings[key];
    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      return false;
    }
  }
  return true;
}

function getFolderSort(folderId) {
  return currentSettings?.folderSorts?.[folderId] || currentSettings?.defaultFolderSort || "browser";
}

function getFolderManualOrder(folderId) {
  return currentSettings?.folderBookmarkOrders?.[folderId] || [];
}

function moveBookmarkId(order, draggedId, targetId, placeAfterTarget) {
  const nextOrder = order.filter((id) => id !== draggedId);
  const targetIndex = nextOrder.indexOf(targetId);
  if (targetIndex === -1) {
    nextOrder.push(draggedId);
    return nextOrder;
  }

  nextOrder.splice(targetIndex + (placeAfterTarget ? 1 : 0), 0, draggedId);
  return nextOrder;
}

function enableBookmarkDragAndDrop(bookmarkElement, bookmark, sourceFolderId, folderBookmarks) {
  bookmarkElement.draggable = true;
  bookmarkElement.dataset.bookmarkId = bookmark.id;
  bookmarkElement.classList.add("is-draggable");

  bookmarkElement.addEventListener("dragstart", (event) => {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("application/x-martabs-id", bookmark.id);
    event.dataTransfer.setData("application/x-martabs-folder", sourceFolderId);
    bookmarkElement.classList.add("is-dragging");
  });

  bookmarkElement.addEventListener("dragend", () => {
    bookmarkElement.classList.remove("is-dragging");
  });

  bookmarkElement.addEventListener("dragover", (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  });

  bookmarkElement.addEventListener("drop", async (event) => {
    event.preventDefault();
    event.stopPropagation(); // Prevent group-level drop
    const draggedId = event.dataTransfer.getData("application/x-martabs-id");
    const draggedSourceFolder = event.dataTransfer.getData("application/x-martabs-folder");
    console.log("DROP BOOKMARK", bookmark.id, draggedId, draggedSourceFolder);
    
    if (!draggedId || draggedId === bookmark.id) return;

    if (draggedSourceFolder !== sourceFolderId) {
      // Cross-folder drop ON a bookmark
      currentSettings.bookmarkFolderOverrides = {
        ...(currentSettings.bookmarkFolderOverrides || {}),
        [draggedId]: sourceFolderId
      };
      scheduleViewFocus(sourceFolderId);
      await setStoredValue(api, STORAGE_KEYS.settings, currentSettings);
      render();
      return;
    }

    // Same-folder drop: only do manual sort if mode is manual
    const currentSort = currentSettings.folderSorts?.[sourceFolderId] || currentSettings.defaultFolderSort;
    if (currentSort !== "manual") {
      return;
    }

    const rect = bookmarkElement.getBoundingClientRect();
    const placeAfterTarget = event.clientY > rect.top + rect.height / 2;
    const visibleOrder = folderBookmarks.map((item) => item.id);
    const nextOrder = moveBookmarkId(visibleOrder, draggedId, bookmark.id, placeAfterTarget);

    currentSettings.folderBookmarkOrders = {
      ...(currentSettings.folderBookmarkOrders || {}),
      [sourceFolderId]: nextOrder
    };
    currentSettings.folderSorts = {
      ...(currentSettings.folderSorts || {}),
      [sourceFolderId]: "manual"
    };

    scheduleViewFocus(sourceFolderId);
    await setStoredValue(api, STORAGE_KEYS.settings, currentSettings);
    render();
  });
}

function renderDashboard(items) {
  content.classList.remove("results", "review-results");
  content.innerHTML = "";

  const foldersMap = groupByFolder(items);
  let folders = Array.from(foldersMap.entries());

  if (currentSettings?.selectedFolderIds) {
    folders.sort((a, b) => {
      const idA = a[1][0]?.parentId;
      const idB = b[1][0]?.parentId;
      const indexA = currentSettings.selectedFolderIds.indexOf(idA);
      const indexB = currentSettings.selectedFolderIds.indexOf(idB);
      const rankA = indexA === -1 ? 9999 : indexA;
      const rankB = indexB === -1 ? 9999 : indexB;
      return rankA - rankB;
    });
  }
  
  const bookmarksById = new Map(items.map((bookmark) => [bookmark.id, bookmark]));
  const pinnedItems = pinnedBookmarks
    .map((id) => bookmarksById.get(id))
    .filter(Boolean);
  
  if (pinnedItems.length > 0 && currentSettings?.showPinnedFolder !== false) {
    folders.unshift([PINNED_FOLDER_KEY, pinnedItems]);
  }
  
  const count = folders.length;
  const masonryWrapper = el("div", { class: "layout-masonry" });
  if (count === 1) {
    masonryWrapper.classList.add("masonry-1");
  } else if (count === 2) {
    masonryWrapper.classList.add("masonry-2");
  } else if (count === 3) {
    masonryWrapper.classList.add("masonry-3");
  } else {
    masonryWrapper.classList.add("masonry-max");
  }

  content.append(masonryWrapper);

  for (const [folder, items] of folders) {
    const isPinnedFolder = folder === PINNED_FOLDER_KEY;
    const folderId = isPinnedFolder ? "pinned" : items[0]?.parentId;
    const folderSort = isPinnedFolder ? "browser" : getFolderSort(folderId);
    const manualOrder = getFolderManualOrder(folderId);
    const folderBookmarks = isPinnedFolder
      ? sortBookmarks(items, "browser")
      : sortBookmarks(items, folderSort, pinnedBookmarks, manualOrder);

    const isSingle = count === 1;
    const hasMany = folderBookmarks.length > 8;

    const headerButtons = [];

    if (isPinnedFolder) {
      const toggleBtn = el("button", { class: "review-button", type: "button", title: t(api, "hidePinnedFolder") });
      const svgDoc = new DOMParser().parseFromString(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14" style="vertical-align: middle; margin-right: 4px;"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`, "image/svg+xml");
      toggleBtn.append(svgDoc.documentElement, document.createTextNode(t(api, "hide")));
      toggleBtn.addEventListener("click", async () => {
        const newSettings = { ...currentSettings, showPinnedFolder: false };
        await setStoredValue(api, STORAGE_KEYS.settings, newSettings);
        currentSettings = newSettings;
        render();
      });
      headerButtons.push(toggleBtn);
    }

    if (currentSettings?.linkHealthEnabled && !isPinnedFolder) {
      const progressEl = el("span", { class: "review-progress" });
      const reviewButton = el("button", { class: "review-button", type: "button", text: t(api, "review") });
      reviewButton.addEventListener("click", () => {
        reviewFolderHealth(folderBookmarks, reviewButton, progressEl);
      });
      headerButtons.push(progressEl, reviewButton);
    }

    const folderBrokenBookmarks = currentSettings?.linkHealthEnabled
      ? folderBookmarks.filter((bookmark) => bookmark.linkHealth && bookmark.linkHealth.consecutiveFailures > 0)
      : [];

    const mode = currentSettings?.folderModes?.[folderId] || currentSettings?.defaultFolderMode || "list";

    if (folderBrokenBookmarks.length > 0) {
      const failuresText = folderBrokenBookmarks.length === 1
        ? t(api, "failuresCountSingular", [folderBrokenBookmarks.length])
        : t(api, "failuresCountPlural", [folderBrokenBookmarks.length]);
      const viewButton = el("button", { class: "review-button review-button--danger", type: "button", text: failuresText });
      viewButton.addEventListener("click", (event) => {
        event.preventDefault();
        renderBrokenLinks(folderBrokenBookmarks, folder);
      });
      headerButtons.push(viewButton);
    }

    const MODES = ["list", "compact", "icons", "icons-large", "quicklinks"];
    const modeBtn = el("button", { class: "review-button", type: "button", title: t(api, "changeView") });
    modeBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>`;
    modeBtn.style.padding = "0 6px"; // Make it square-ish
    
    modeBtn.addEventListener("click", async () => {
      const currentMode = currentSettings?.folderModes?.[folderId] || currentSettings?.defaultFolderMode || "list";
      const currentIndex = MODES.indexOf(currentMode);
      const nextMode = MODES[(currentIndex + 1) % MODES.length];
      
      const newModes = { ...(currentSettings.folderModes || {}) };
      newModes[folderId] = nextMode;
      
      const nextSettings = {
        ...currentSettings,
        folderModes: newModes
      };
      
      applyFolderModeClass(folderId, nextMode);
      currentSettings = nextSettings;
      scheduleViewFocus(folderId);
      
      await setStoredValue(api, STORAGE_KEYS.settings, nextSettings);
    });
    
    if (currentSettings.showSortButton !== false) {
      if (!isPinnedFolder) {
        const currentSort = currentSettings?.folderSorts?.[folderId] || "browser";
        
        const getSortIcon = (sort) => {
          const icons = {
            "browser": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M11 5h10"></path><path d="M11 9h7"></path><path d="M11 13h4"></path><path d="M3 17l3 3 3-3"></path><path d="M6 18V4"></path></svg>`,
            "manual": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/></svg>`,
            "title-asc": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/></svg>`,
            "date-newest": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`,
            "domain-asc": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>`,
            "health-broken-first": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>`
          };
          return icons[sort] || icons["browser"];
        };

        const getSortTooltipText = (sort) => {
          const keyMap = {
            "browser": "sortBrowser",
            "manual": "sortManual",
            "title-asc": "sortTitleAsc",
            "date-newest": "sortDateNewest",
            "domain-asc": "sortDomainAsc",
            "health-broken-first": "sortHealthBrokenFirst"
          };
          const baseTitle = t(api, "sortBookmarks") || "Ordenar marcadores";
          const currentModeStr = t(api, keyMap[sort]) || sort;
          return `${baseTitle} (${currentModeStr})`;
        };

        const sortBtn = el("button", { class: "review-button", type: "button", title: getSortTooltipText(currentSort) });
        sortBtn.innerHTML = getSortIcon(currentSort);
        sortBtn.style.padding = "0 6px";
        sortBtn.addEventListener("click", async () => {
          const activeSort = currentSettings?.folderSorts?.[folderId] || "browser";
          const currentIndex = SORT_MODES.indexOf(activeSort);
          const nextSort = SORT_MODES[(currentIndex + 1) % SORT_MODES.length];
          
          const newSorts = { ...(currentSettings.folderSorts || {}) };
          newSorts[folderId] = nextSort;
          
          const nextSettings = {
            ...currentSettings,
            folderSorts: newSorts
          };
          
          currentSettings = nextSettings;
          await setStoredValue(api, STORAGE_KEYS.settings, nextSettings);
          render(); // Re-render everything to apply new sorting
        });
        headerButtons.push(sortBtn);
      }
    }
    
    if (currentSettings.showViewButton !== false) {
      headerButtons.push(modeBtn);
    }

    const folderDisplayName = isPinnedFolder
      ? t(api, "pinnedFolderTitle")
      : (currentSettings.folderNameOverrides || {})[folderId] || folder;
    const h2 = el("h2", { text: folderDisplayName, title: folderDisplayName });
    
    if (!isPinnedFolder) {
      h2.addEventListener("dblclick", () => {
        h2.setAttribute("contenteditable", "true");
        h2.focus();
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(h2);
        selection.removeAllRanges();
        selection.addRange(range);
      });

      const saveNewName = async () => {
        if (!h2.hasAttribute("contenteditable")) return;
        h2.removeAttribute("contenteditable");
        const newName = h2.textContent.trim();
        if (newName !== folderDisplayName) {
          const overrides = { ...(currentSettings.folderNameOverrides || {}) };
          if (!newName || newName === folder) {
            delete overrides[folderId];
          } else {
            overrides[folderId] = newName;
          }
          currentSettings.folderNameOverrides = overrides;
          await setStoredValue(api, STORAGE_KEYS.settings, currentSettings);
          render();
        } else {
          h2.textContent = folderDisplayName;
        }
      };

      h2.addEventListener("blur", saveNewName);
      h2.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          saveNewName();
        } else if (e.key === "Escape") {
          h2.textContent = folderDisplayName;
          h2.removeAttribute("contenteditable");
        }
      });
    }

    const headerChildren = [h2];
    if (headerButtons.length > 0) {
      headerChildren.push(el("div", { class: "group-header-actions" }, headerButtons));
    }

    const modeClass = mode !== "list" ? ` mode-${mode}` : "";
    const bookmarkListClass = `bookmark-list${isSingle && hasMany ? " single-grid" : ""}${modeClass}`;
    const bookmarkNodes = folderBookmarks.map((bookmark) => {
      const bookmarkElement = renderBookmark(bookmark);
      if (!isPinnedFolder) {
        enableBookmarkDragAndDrop(bookmarkElement, bookmark, folderId, folderBookmarks);
      }
      return bookmarkElement;
    });
    
    const groupElement = el("article", { class: "group", "data-folder-id": folderId }, [
      el("div", { class: "group-header" }, headerChildren),
      el("div", { class: bookmarkListClass }, bookmarkNodes)
    ]);
    
    if (!isPinnedFolder) {
      groupElement.addEventListener("dragover", (event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
      });
    groupElement.addEventListener("drop", async (event) => {
      event.preventDefault();
      const draggedId = event.dataTransfer.getData("application/x-martabs-id");
      const draggedSourceFolder = event.dataTransfer.getData("application/x-martabs-folder");
      console.log("DROP GROUP", folderId, draggedId, draggedSourceFolder);
      if (!draggedId || draggedSourceFolder === folderId) return;
      
      currentSettings.bookmarkFolderOverrides = {
        ...(currentSettings.bookmarkFolderOverrides || {}),
        [draggedId]: folderId
      };
      scheduleViewFocus(folderId);
      await setStoredValue(api, STORAGE_KEYS.settings, currentSettings);
      render();
    });
    }

    masonryWrapper.append(groupElement);
  }

  focusPendingViewFolder();
}

function renderResults(items) {
  content.classList.remove("review-results");
  content.classList.add("results");
  content.innerHTML = "";
  if (items.length === 0) {
    content.append(el("p", { class: "empty", text: t(api, "emptyResults") }));
    return;
  }
  for (const bookmark of items) {
    content.append(el("article", { class: "result" }, [renderBookmark(bookmark, true)]));
  }
}

function getFailedBookmarks(items) {
  if (!currentSettings?.linkHealthEnabled) {
    return [];
  }

  return items.filter((bookmark) => bookmark.linkHealth && bookmark.linkHealth.consecutiveFailures > 0);
}

function renderBrokenLinks(items, folderName = "") {
  content.classList.remove("layout-single", "layout-columns", "layout-grid");
  content.classList.add("results", "review-results");
  content.innerHTML = "";

  const backButton = el("button", { class: "link-action-button", type: "button", text: t(api, "back") });
  backButton.addEventListener("click", () => {
    searchInput.value = "";
    render();
  });

  const deleteAllButton = items.length > 0
    ? el("button", { class: "danger-button", type: "button", text: t(api, "deleteAllCount", [items.length]) })
    : null;

  if (deleteAllButton) {
    deleteAllButton.addEventListener("click", async () => {
      const folderScope = folderName || t(api, "allFolders");
      const confirmed = window.confirm(
        t(api, "confirmDeleteAllFailures", [items.length, folderScope])
      );
      if (!confirmed) return;
      for (const bookmark of items) {
        await api.bookmarks.remove(bookmark.id);
        bookmarks = bookmarks.filter((item) => item.id !== bookmark.id);
      }
      renderBrokenLinks([], folderName);
    });
  }

  const reviewText = items.length === 1
    ? t(api, "bookmarksToReviewSingular", [items.length])
    : t(api, "bookmarksToReviewPlural", [items.length]);

  content.append(
    el("div", { class: "results-toolbar" }, [
      el("div", {}, [
        el("strong", { text: folderName ? t(api, "failuresIn", [folderName]) : t(api, "brokenLinksTitle") }),
        el("p", { text: reviewText })
      ]),
      el("div", { class: "results-toolbar-actions" }, [deleteAllButton, backButton].filter(Boolean))
    ])
  );

  if (items.length === 0) {
    content.append(el("p", { class: "empty", text: t(api, "noFailuresRegistered") }));
    return;
  }

  for (const bookmark of items) {
    const removeButton = el("button", { class: "danger-button", type: "button", text: t(api, "delete") });
    removeButton.addEventListener("click", async (event) => {
      event.preventDefault();
      const confirmed = window.confirm(t(api, "confirmDeleteBookmark", [bookmark.title]));
      if (!confirmed) return;
      await api.bookmarks.remove(bookmark.id);
      bookmarks = bookmarks.filter((item) => item.id !== bookmark.id);
      renderBrokenLinks(
        folderName
          ? getFailedBookmarks(bookmarks).filter((item) => item.folderPath === folderName)
          : getFailedBookmarks(bookmarks),
        folderName
      );
    });

    content.append(
      el("article", { class: "result result-with-action" }, [
        renderBookmark(bookmark, true),
        removeButton
      ])
    );
  }
}

function render() {
  const query = searchInput.value;
  const results = searchBookmarks(bookmarks, query);
  const monitoredText = bookmarks.length === 1
    ? t(api, "monitoredBookmarksCountSingular", [bookmarks.length])
    : t(api, "monitoredBookmarksCountPlural", [bookmarks.length]);
  statusLine.textContent = monitoredText;
  if (query.trim()) renderResults(results);
  else renderDashboard(bookmarks);
}

async function init() {
  const settings = await getSettings(api);
  currentSettings = settings;
  await initI18n(api, settings.language);
  localizeHtml(api);
  applyTheme(settings.theme || "system");
  if (!settings.setupComplete) {
    statusLine.textContent = t(api, "setupEmptyStateTitle");
    content.innerHTML = "";
    content.append(el("p", { class: "empty", text: t(api, "setupEmptyStateDescription") }));
    return;
  }
  [bookmarks, capturedPreviews, pinnedBookmarks] = await Promise.all([
    getBookmarkIndex(api),
    getCapturedPreviews(api),
    getStoredValue(api, STORAGE_KEYS.pinnedBookmarks, [])
  ]);
  render();
  searchInput.focus();
}

searchInput.addEventListener("input", render);
searchInput.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    searchInput.value = "";
    render();
  }
  if (event.key === "Enter") {
    const [first] = searchBookmarks(bookmarks, searchInput.value);
    if (first) location.href = first.url;
  }
});


settingsButton.addEventListener("click", () => {
  window.location.href = "../setup/setup.html";
});

function showEditModal(bookmark) {
  editTitle.value = bookmark.title;
  editUrl.value = bookmark.url;
  editTags.value = (bookmark.manualTags || []).join(", ");
  editFavicon.value = currentSettings?.customFavicons?.[bookmark.id] || "";
  if (currentSettings?.brokenCustomFavicons?.[bookmark.id]) {
    editFaviconError.style.display = "block";
  } else {
    editFaviconError.style.display = "none";
  }
  editSave.disabled = false;
  
  const cleanup = () => {
    editCancel.removeEventListener("click", onCancel);
    editDelete.removeEventListener("click", onDelete);
    editForm.removeEventListener("submit", onSubmit);
  };
  
  const onCancel = () => {
    editModal.close();
    cleanup();
  };
  
  const onDelete = async () => {
    if (confirm(t(api, "confirmDeleteBookmarkPermanent", [bookmark.title]))) {
      await api.bookmarks.remove(bookmark.id);
      bookmarks = bookmarks.filter(b => b.id !== bookmark.id);
      editModal.close();
      cleanup();
      // Wait for background to rebuild index, then update our UI
      render();
    }
  };
  
  const onSubmit = async (e) => {
    e.preventDefault();
    editSave.disabled = true;
    const newTitle = editTitle.value.trim();
    const newUrl = editUrl.value.trim();
    const newTagsStr = editTags.value;

    try {
      await api.bookmarks.update(bookmark.id, { title: newTitle, url: newUrl });

      const newTags = newTagsStr.split(",").map(t => t.trim()).filter(Boolean);
      const manualTagsDict = await getStoredValue(api, STORAGE_KEYS.manualTags, {});
      manualTagsDict[bookmark.id] = newTags;
      await setStoredValue(api, STORAGE_KEYS.manualTags, manualTagsDict);

      const newFavicon = editFavicon.value.trim();
      const customFavicons = { ...(currentSettings.customFavicons || {}) };
      const faviconWasBroken = Boolean(currentSettings.brokenCustomFavicons?.[bookmark.id]);
      let changedFavicon = false;
      if (newFavicon) {
        if (customFavicons[bookmark.id] !== newFavicon || faviconWasBroken) {
          customFavicons[bookmark.id] = newFavicon;
          changedFavicon = true;
        }
      } else {
        if (customFavicons[bookmark.id] || faviconWasBroken) {
          delete customFavicons[bookmark.id];
          changedFavicon = true;
        }
      }
      
      if (changedFavicon) {
        currentSettings.customFavicons = customFavicons;
        if (currentSettings.brokenCustomFavicons) {
          delete currentSettings.brokenCustomFavicons[bookmark.id];
        }
        await setStoredValue(api, STORAGE_KEYS.settings, currentSettings);
      }

      bookmark.title = newTitle;
      bookmark.url = newUrl;
      try {
        bookmark.domain = new URL(newUrl).hostname.replace(/^www\./, "");
      } catch {
        bookmark.domain = "";
      }
      bookmark.manualTags = newTags;
      bookmark.allTags = mergeTags(bookmark.automaticTags, newTags);

      editModal.close();
      cleanup();
      render();
    } catch (error) {
      statusLine.textContent = t(api, "saveBookmarkError", [error.message]);
      editSave.disabled = false;
    }
  };
  
  editCancel.addEventListener("click", onCancel);
  editDelete.addEventListener("click", onDelete);
  editForm.addEventListener("submit", onSubmit);
  
  editModal.showModal();
}

if (api.storage && api.storage.onChanged) {
  api.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "local") {
      if (changes[STORAGE_KEYS.settings]) {
        const oldSettings = changes[STORAGE_KEYS.settings].oldValue || {};
        const newSettings = changes[STORAGE_KEYS.settings].newValue || {};
        if (onlyFolderModesChanged(oldSettings, newSettings)) {
          const defaultMode = newSettings.defaultFolderMode || "list";
          const folderIds = new Set([
            ...Object.keys(oldSettings.folderModes || {}),
            ...Object.keys(newSettings.folderModes || {})
          ]);
          for (const folderId of folderIds) {
            const oldMode = oldSettings.folderModes?.[folderId] || defaultMode;
            const newMode = newSettings.folderModes?.[folderId] || defaultMode;
            if (oldMode !== newMode) {
              applyFolderModeClass(folderId, newMode);
            }
          }
          currentSettings = { ...(currentSettings || {}), ...newSettings };
          applyTheme(newSettings.theme || "system");
        } else {
          currentSettings = { ...(currentSettings || {}), ...newSettings };
          applyTheme(newSettings.theme || "system");
          render();
        }
      }
      if (changes[STORAGE_KEYS.bookmarkIndex]) {
        bookmarks = changes[STORAGE_KEYS.bookmarkIndex].newValue || [];
        render();
      }
      if (changes[STORAGE_KEYS.capturedPreviews]) {
        capturedPreviews = changes[STORAGE_KEYS.capturedPreviews].newValue || {};
        render();
      }
      if (changes[STORAGE_KEYS.pinnedBookmarks]) {
        pinnedBookmarks = changes[STORAGE_KEYS.pinnedBookmarks].newValue || [];
        render();
      }
    }
  });
}

init().catch((error) => {
  statusLine.textContent = t(api, "loadBookmarksError", [error.message]);
});
