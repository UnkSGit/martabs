import { getBrowserApi } from "../shared/browser-api.js";
import { searchBookmarks } from "../shared/search.js";
import { getBookmarkIndex, getSettings, STORAGE_KEYS } from "../shared/storage.js";
import { el, formatDate } from "../shared/render.js";

const api = getBrowserApi();
const statusLine = document.querySelector("#status-line");
const searchInput = document.querySelector("#search");
const content = document.querySelector("#content");
const settingsButton = document.querySelector("#settings");
const previewCard = document.querySelector("#preview-card");

let bookmarks = [];
let currentSettings = null;
let hoverTimeout = null;
let hideTimeout = null;

function applyTheme(theme) {
  const root = document.documentElement;
  root.classList.remove("theme-light", "theme-dark");
  if (theme === "light") {
    root.classList.add("theme-light");
  } else if (theme === "dark") {
    root.classList.add("theme-dark");
  }
}

function faviconLabel(bookmark) {
  return (bookmark.domain || bookmark.title || "?").slice(0, 1).toUpperCase();
}

function getFaviconUrl(url) {
  if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.id) {
    return `chrome-extension://${chrome.runtime.id}/_favicon/?pageUrl=${encodeURIComponent(url)}&size=32`;
  }
  return "";
}

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
  const faviconUrl = getFaviconUrl(bookmark.url);
  const contentNode = faviconUrl
    ? el("img", { class: "favicon-img", src: faviconUrl, alt: "" })
    : el("span", { class: "favicon-fallback", text: faviconLabel(bookmark) });
  const faviconContainer = el("div", { class: "favicon-container" }, [contentNode]);

  if (contentNode.tagName === "IMG") {
    contentNode.onerror = () => {
      contentNode.replaceWith(el("span", { class: "favicon-fallback", text: faviconLabel(bookmark) }));
    };
  }

  if (bookmark.linkHealth && bookmark.linkHealth.consecutiveFailures > 0) {
    faviconContainer.append(el("div", { class: "health-dot-indicator" }));
  }

  return faviconContainer;
}

function renderBookmark(bookmark, rich = false) {
  const details = [
    bookmark.domain,
    rich && bookmark.folderPath,
    rich && formatDate(bookmark.dateAdded)
  ].filter(Boolean).join(" - ");

  const isBroken = bookmark.linkHealth && bookmark.linkHealth.consecutiveFailures > 0;
  const bookmarkElement = el(
    "a",
    {
      class: `bookmark${isBroken ? " is-broken" : ""}`,
      href: bookmark.url,
      title: isBroken
        ? "Este enlace no respondio correctamente en la ultima comprobacion."
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
  previewCard.innerHTML = "";

  const thumbnailContainer = el("div", { class: "preview-thumbnail-container" }, [
    el("span", { class: "preview-local-mark", text: faviconLabel(bookmark) }),
    el("span", { class: "preview-local-label", text: "Vista rapida local" })
  ]);

  const isBroken = bookmark.linkHealth && bookmark.linkHealth.consecutiveFailures > 0;
  const statusText = isBroken
    ? `Inaccesible (Codigo: ${bookmark.linkHealth.lastStatus || "Error"})`
    : "Enlace accesible";

  const healthDetails = el("div", { class: "preview-health" }, [
    el("div", { class: `health-dot ${isBroken ? "broken" : "ok"}` }),
    el("span", { class: "health-status-text", text: statusText })
  ]);

  const detailsContainer = el("div", { class: "preview-details" }, [
    el("div", { class: "preview-title", text: bookmark.title }),
    el("div", { class: "preview-domain", text: bookmark.domain || "Sin dominio" }),
    bookmark.folderPath ? el("div", { class: "preview-domain", text: bookmark.folderPath }) : null,
    bookmark.dateAdded ? el("div", { class: "preview-domain", text: `Agregado: ${formatDate(bookmark.dateAdded)}` }) : null,
    healthDetails,
    renderTags(bookmark)
  ].filter(Boolean));

  previewCard.append(thumbnailContainer, detailsContainer);

  const rect = anchorElement.getBoundingClientRect();
  const cardWidth = 280;
  let left = rect.left + rect.width + 12;
  if (left + cardWidth > window.innerWidth) {
    left = rect.left - cardWidth - 12;
  }
  if (left < 0) left = 12;

  previewCard.style.left = `${left}px`;
  previewCard.style.top = `${rect.top + window.scrollY - 10}px`;
  previewCard.hidden = false;
  requestAnimationFrame(() => previewCard.classList.add("visible"));
}

function hidePreviewCard() {
  previewCard.classList.remove("visible");
  previewCard.hidden = true;
}

function groupByFolder(items) {
  return Map.groupBy
    ? Map.groupBy(items, (bookmark) => bookmark.folderPath || "Sin carpeta")
    : items.reduce((map, bookmark) => {
        const key = bookmark.folderPath || "Sin carpeta";
        map.set(key, [...(map.get(key) || []), bookmark]);
        return map;
      }, new Map());
}

function renderDashboard(items) {
  content.classList.remove("results", "layout-single", "layout-columns", "layout-grid");
  content.innerHTML = "";

  const folders = groupByFolder(items);
  const count = folders.size;

  if (count === 1) {
    content.classList.add("layout-single");
  } else if (count >= 2 && count <= 4) {
    content.classList.add("layout-columns");
  } else if (count > 4) {
    content.classList.add("layout-grid");
  }

  for (const [folder, folderBookmarks] of folders) {
    const isSingle = count === 1;
    const hasMany = folderBookmarks.length > 8;
    const folderBrokenBookmarks = currentSettings?.linkHealthEnabled
      ? folderBookmarks.filter((bookmark) => bookmark.linkHealth && bookmark.linkHealth.consecutiveFailures > 0)
      : [];

    const headerChildren = [el("h2", { text: folder })];
    if (folderBrokenBookmarks.length > 0) {
      const reviewButton = el("button", { class: "review-button", type: "button", text: "Revisar" });
      reviewButton.addEventListener("click", (event) => {
        event.preventDefault();
        renderBrokenLinks(folderBrokenBookmarks, folder);
      });
      headerChildren.push(reviewButton);
    }

    const bookmarkListClass = `bookmark-list${isSingle && hasMany ? " single-grid" : ""}`;
    content.append(
      el("article", { class: "group" }, [
        el("div", { class: "group-header" }, headerChildren),
        el("div", { class: bookmarkListClass }, folderBookmarks.map((bookmark) => renderBookmark(bookmark)))
      ])
    );
  }
}

function renderResults(items) {
  content.classList.remove("layout-single", "layout-columns", "layout-grid", "review-results");
  content.classList.add("results");
  content.innerHTML = "";
  if (items.length === 0) {
    content.append(el("p", { class: "empty", text: "No hay resultados." }));
    return;
  }
  for (const bookmark of items) {
    content.append(el("article", { class: "result" }, [renderBookmark(bookmark, true)]));
  }
}

function getFailedBookmarks(items) {
  return items.filter((bookmark) => bookmark.linkHealth && bookmark.linkHealth.consecutiveFailures > 0);
}

function renderBrokenLinks(items, folderName = "") {
  content.classList.remove("layout-single", "layout-columns", "layout-grid");
  content.classList.add("results", "review-results");
  content.innerHTML = "";

  const backButton = el("button", { class: "link-action-button", type: "button", text: "Volver" });
  backButton.addEventListener("click", () => {
    searchInput.value = "";
    render();
  });

  content.append(
    el("div", { class: "results-toolbar" }, [
      el("div", {}, [
        el("strong", { text: folderName ? `Fallos en ${folderName}` : "Enlaces con fallos" }),
        el("p", { text: `${items.length} marcador(es) para revisar.` })
      ]),
      backButton
    ])
  );

  if (items.length === 0) {
    content.append(el("p", { class: "empty", text: "No hay enlaces con fallos registrados." }));
    return;
  }

  for (const bookmark of items) {
    const removeButton = el("button", { class: "danger-button", type: "button", text: "Eliminar" });
    removeButton.addEventListener("click", async (event) => {
      event.preventDefault();
      const confirmed = window.confirm(`Eliminar el marcador "${bookmark.title}"?`);
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
  statusLine.textContent = `${bookmarks.length} marcador(es) monitoreados`;
  if (query.trim()) renderResults(results);
  else renderDashboard(bookmarks);
}

async function init() {
  const settings = await getSettings(api);
  currentSettings = settings;
  applyTheme(settings.theme || "system");
  if (!settings.setupComplete) {
    statusLine.textContent = "Configura tus carpetas para empezar.";
    content.innerHTML = "";
    content.append(el("p", { class: "empty", text: "Abre Configurar y elige una o mas carpetas." }));
    return;
  }
  bookmarks = await getBookmarkIndex(api);
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

settingsButton.addEventListener("click", () => api.runtime.openOptionsPage());

if (api.storage && api.storage.onChanged) {
  api.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "local") {
      if (changes[STORAGE_KEYS.settings]) {
        const newSettings = changes[STORAGE_KEYS.settings].newValue || {};
        currentSettings = { ...(currentSettings || {}), ...newSettings };
        applyTheme(newSettings.theme || "system");
        render();
      }
      if (changes[STORAGE_KEYS.bookmarkIndex]) {
        bookmarks = changes[STORAGE_KEYS.bookmarkIndex].newValue || [];
        render();
      }
    }
  });
}

init().catch((error) => {
  statusLine.textContent = `No se pudieron cargar los marcadores: ${error.message}`;
});
