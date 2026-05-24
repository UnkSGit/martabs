import { getBrowserApi } from "../shared/browser-api.js";
import { searchBookmarks } from "../shared/search.js";
import { getBookmarkIndex, getSettings, STORAGE_KEYS } from "../shared/storage.js";
import { el, formatDate } from "../shared/render.js";
import { shouldShowLinkWarning } from "../shared/link-health.js";

const api = getBrowserApi();
const statusLine = document.querySelector("#status-line");
const searchInput = document.querySelector("#search");
const content = document.querySelector("#content");
const settingsButton = document.querySelector("#settings");
const reviewLinks = document.querySelector("#review-links");
const previewCard = document.querySelector("#preview-card");

let bookmarks = [];
let hoverTimeout = null;
let hideTimeout = null;

function faviconLabel(bookmark) {
  return (bookmark.domain || bookmark.title || "?").slice(0, 1).toUpperCase();
}

function getFaviconUrl(url, domain) {
  if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.id) {
    return `chrome-extension://${chrome.runtime.id}/_favicon/?pageUrl=${encodeURIComponent(url)}&size=32`;
  }
  if (domain) {
    return `https://icons.duckduckgo.com/ip3/${domain}.ico`;
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

  // Favicon setup
  const faviconImg = el("img", {
    class: "favicon-img",
    src: getFaviconUrl(bookmark.url, bookmark.domain),
    alt: ""
  });
  
  const faviconContainer = el("div", { class: "favicon-container" }, [faviconImg]);
  
  faviconImg.onerror = () => {
    faviconImg.replaceWith(el("span", { class: "favicon-fallback", text: faviconLabel(bookmark) }));
  };

  const isBroken = bookmark.linkHealth && bookmark.linkHealth.consecutiveFailures > 0;
  
  // Non-invasive warning dot
  if (isBroken) {
    faviconContainer.append(el("div", { class: "health-dot-indicator" }));
  }

  const bookmarkElement = el(
    "a",
    {
      class: `bookmark${isBroken ? " is-broken" : ""}`,
      href: bookmark.url,
      title: isBroken
        ? "Este enlace no respondió correctamente en la última comprobación."
        : bookmark.title
    },
    [
      faviconContainer,
      el("div", { class: "bookmark-details" }, [
        el("span", { class: "title", text: bookmark.title }),
        rich ? el("span", { class: "domain", text: details }) : null,
        rich ? renderTags(bookmark) : null
      ])
    ]
  );

  // Hover card listeners
  bookmarkElement.addEventListener("mouseenter", () => {
    clearTimeout(hoverTimeout);
    clearTimeout(hideTimeout);
    
    hoverTimeout = setTimeout(() => {
      showPreviewCard(bookmark, bookmarkElement);
    }, 350);
  });

  bookmarkElement.addEventListener("mouseleave", () => {
    clearTimeout(hoverTimeout);
    hideTimeout = setTimeout(hidePreviewCard, 100);
  });

  return bookmarkElement;
}

function showPreviewCard(bookmark, anchorElement) {
  previewCard.innerHTML = "";
  
  const thumbnail = el("img", {
    class: "preview-thumbnail",
    src: `https://image.thum.io/get/width/280/crop/600/maxAge/24/${bookmark.url}`,
    alt: "Vista previa"
  });

  const loading = el("span", {
    class: "preview-loading",
    text: "Generando vista previa..."
  });

  thumbnail.onload = () => {
    loading.remove();
  };

  thumbnail.onerror = () => {
    loading.textContent = "Sin vista previa disponible";
  };

  const thumbnailContainer = el("div", { class: "preview-thumbnail-container" }, [
    loading,
    thumbnail
  ]);

  const isBroken = bookmark.linkHealth && bookmark.linkHealth.consecutiveFailures > 0;
  const statusText = isBroken
    ? `Inaccesible (Código: ${bookmark.linkHealth.lastStatus || "Error"})`
    : "Enlace accesible";

  const healthDetails = el("div", { class: "preview-health" }, [
    el("div", { class: `health-dot ${isBroken ? "broken" : "ok"}` }),
    el("span", { class: "health-status-text", text: statusText })
  ]);

  const detailsContainer = el("div", { class: "preview-details" }, [
    el("div", { class: "preview-title", text: bookmark.title }),
    el("div", { class: "preview-domain", text: bookmark.domain || "Sin dominio" }),
    healthDetails,
    renderTags(bookmark)
  ]);

  previewCard.append(thumbnailContainer, detailsContainer);

  // Position card adjacent to bookmark element
  const rect = anchorElement.getBoundingClientRect();
  const cardWidth = 280;
  
  let left = rect.left + rect.width + 12;
  // If card overflows viewport horizontally, place it to the left
  if (left + cardWidth > window.innerWidth) {
    left = rect.left - cardWidth - 12;
  }
  // Ensure card doesn't overflow left boundary of the window
  if (left < 0) left = 12;

  let top = rect.top + window.scrollY - 10;
  
  previewCard.style.left = `${left}px`;
  previewCard.style.top = `${top}px`;
  
  previewCard.hidden = false;
  // Trigger transition
  requestAnimationFrame(() => {
    previewCard.classList.add("visible");
  });
}

function hidePreviewCard() {
  previewCard.classList.remove("visible");
  // Hide element after opacity transition completes
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

// Real-time update listener when background checks finish
if (api.storage && api.storage.onChanged) {
  api.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "local" && changes[STORAGE_KEYS.bookmarkIndex]) {
      bookmarks = changes[STORAGE_KEYS.bookmarkIndex].newValue || [];
      render();
    }
  });
}

init().catch((error) => {
  statusLine.textContent = `No se pudieron cargar los marcadores: ${error.message}`;
});
