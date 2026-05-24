import { getBrowserApi } from "../shared/browser-api.js";
import { searchBookmarks } from "../shared/search.js";
import { getBookmarkIndex, getSettings } from "../shared/storage.js";
import { el, formatDate } from "../shared/render.js";
import { shouldShowLinkWarning } from "../shared/link-health.js";

const api = getBrowserApi();
const statusLine = document.querySelector("#status-line");
const searchInput = document.querySelector("#search");
const content = document.querySelector("#content");
const settingsButton = document.querySelector("#settings");
const reviewLinks = document.querySelector("#review-links");

let bookmarks = [];

function faviconLabel(bookmark) {
  return (bookmark.domain || bookmark.title || "?").slice(0, 1).toUpperCase();
}

function renderTags(bookmark) {
  const children = [];
  const manual = bookmark.manualTags || [];
  const automatic = bookmark.automaticTags || [];
  
  for (const tag of manual) {
    children.push(el("span", { class: "tag tag-manual", text: tag }));
  }
  
  const manualSet = new Set(manual.map(t => t.toLowerCase()));
  for (const tag of automatic) {
    if (!manualSet.has(tag.toLowerCase())) {
      children.push(el("span", { class: "tag tag-auto", text: tag }));
    }
  }

  return el("div", { class: "tags" }, children.slice(0, 4));
}

function renderBookmark(bookmark, rich = false) {
  const details = [
    bookmark.domain,
    rich && bookmark.folderPath,
    rich && formatDate(bookmark.dateAdded)
  ].filter(Boolean).join(" · ");

  return el("a", { class: "bookmark", href: bookmark.url }, [
    el("span", { class: "favicon", text: faviconLabel(bookmark) }),
    el("div", { class: "bookmark-details" }, [
      el("span", { class: "title", text: bookmark.title }),
      el("span", { class: "domain", text: details }),
      renderTags(bookmark)
    ])
  ]);
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
  content.classList.remove("results");
  content.innerHTML = "";
  for (const [folder, folderBookmarks] of groupByFolder(items)) {
    content.append(
      el("article", { class: "group" }, [
        el("h2", { text: folder }),
        ...folderBookmarks.map((bookmark) => renderBookmark(bookmark))
      ])
    );
  }
}

function renderResults(items) {
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

function renderReviewLinks(items) {
  const warnings = items.filter((bookmark) => shouldShowLinkWarning(bookmark.linkHealth));
  reviewLinks.hidden = warnings.length === 0;
  reviewLinks.innerHTML = warnings.length
    ? `<strong>Revisar enlaces</strong><p>${warnings.length} marcador(es) fallan hace al menos 10 días.</p>`
    : "";
}

function render() {
  const query = searchInput.value;
  const results = searchBookmarks(bookmarks, query);
  statusLine.textContent = `${bookmarks.length} marcador(es) monitoreados`;
  renderReviewLinks(bookmarks);
  if (query.trim()) renderResults(results);
  else renderDashboard(bookmarks);
}

async function init() {
  const settings = await getSettings(api);
  if (!settings.setupComplete) {
    statusLine.textContent = "Configura tus carpetas para empezar.";
    content.innerHTML = "";
    content.append(el("p", { class: "empty", text: "Abre Configurar y elige una o más carpetas." }));
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

init().catch((error) => {
  statusLine.textContent = `No se pudieron cargar los marcadores: ${error.message}`;
});
