import { getBrowserApi } from "../shared/browser-api.js";
import { getFolderOptions } from "../shared/bookmarks.js";
import { getSettings, saveSettings, setStoredValue, STORAGE_KEYS } from "../shared/storage.js";
import { generateExportData, parseAndRemapImport } from "../shared/sync.js";
import { localizeHtml, t, initI18n, normalizeLanguageCode } from "../shared/i18n-helper.js";

const api = getBrowserApi();
const folderTreeContainer = document.querySelector("#folder-tree-container");
const selectedFoldersList = document.querySelector("#selected-folders-list");
const folderTreeSearchInput = document.querySelector("#folder-tree-search");
const toggleAllFoldersBtn = document.querySelector("#toggle-all-folders");
const collapseAllBtn = document.querySelector("#collapse-all-btn");
const openBrowserBookmarksBtn = document.querySelector("#open-browser-bookmarks");
const firefoxBookmarksNotice = document.querySelector("#firefox-bookmarks-notice");
const sortColumnsBtn = document.querySelector("#sort-columns-btn");
const backToTreeBtn = document.querySelector("#back-to-tree-btn");
const foldersTreeWrapper = document.querySelector("#folders-tree-wrapper");
const foldersSortWrapper = document.querySelector("#folders-sort-wrapper");
const foldersSortActions = document.querySelector("#folders-sort-actions");
const saveButton = document.querySelector("#save");
const backButton = document.querySelector("#back-to-dashboard");
const status = document.querySelector("#status");
const setupContent = document.querySelector(".setup-content");
const settingsSearch = document.querySelector("#settings-search");
const navButtons = document.querySelectorAll(".setup-nav-button");
const sections = document.querySelectorAll(".setup-section");
const automaticTags = document.querySelector("#automatic-tags");
const manualTags = document.querySelector("#manual-tags");
const showPinnedFolder = document.querySelector("#show-pinned-folder");
const showViewButton = document.querySelector("#show-view-button");
const showSortButton = document.querySelector("#show-sort-button");
const linkHealth = document.querySelector("#link-health");
const previewEnabled = document.querySelector("#preview-enabled");
const previewCapture = document.querySelector("#preview-capture");
const cleanFolderNames = document.querySelector("#clean-folder-names");
const enablePinnedShortcuts = document.querySelector("#enable-pinned-shortcuts");
const pinnedShortcutCatcher1 = document.querySelector("#pinned-shortcut-catcher-1");
const pinnedShortcutCatcher2 = document.querySelector("#pinned-shortcut-catcher-2");
let currentShortcutModifiers = ["Alt", ""];
const frequentSites = document.querySelector("#frequent-sites");
const topsitesLimit = document.querySelector("#topsites-limit");
const resetTopsitesBlacklistBtn = document.querySelector("#reset-topsites-blacklist");
const localStats = document.querySelector("#local-stats");
const statisticsDisabledMsg = document.querySelector("#statistics-disabled-msg");
const statisticsContent = document.querySelector("#statistics-content");
const goToPrivacyStatsBtn = document.querySelector("#go-to-privacy-stats");
const statsChart = document.querySelector("#stats-chart");
const storageAudit = document.querySelector("#storage-audit");
const resetStatsBtn = document.querySelector("#reset-stats");
const downloadStatsBtn = document.querySelector("#download-stats");
const defaultModeSelect = document.querySelector("#default-mode-select");
const defaultSortSelect = document.querySelector("#default-sort-select");
const themeSelect = document.querySelector("#theme-select");
const languageSelect = document.querySelector("#language-select");
const resetLocalOrganizationButton = document.querySelector("#reset-local-organization");
const clearPreviewCacheButton = document.querySelector("#clear-preview-cache");
const exportConfigButton = document.querySelector("#export-config");
const importConfigButton = document.querySelector("#import-config");
const importConfigFile = document.querySelector("#import-config-file");
const importSummary = document.querySelector("#import-summary");
const sidebarVersion = document.querySelector("#sidebar-version");
const advancedVersion = document.querySelector("#advanced-version");
let currentSettings = null;
let currentFolders = [];
let rawBookmarkTree = null;

const topSitesPermissions = { permissions: ["topSites"] };

const urlPermissions = {
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

function normalizeSearchText(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function getSearchableItems(section) {
  return [
    ...section.querySelectorAll(".setting-row, .switch-row, .advanced-action")
  ];
}

function itemMatchesSearch(item, query) {
  const text = normalizeSearchText(`${item.textContent} ${item.dataset.search || ""}`);
  return text.includes(query);
}

function sectionMatchesSearch(section, query) {
  if (!query) return true;

  const sectionText = normalizeSearchText(`${section.textContent} ${section.dataset.search || ""}`);
  return sectionText.includes(query);
}

function syncSetupContentHeight() {
  if (!setupContent) return;

  const hiddenItems = [...setupContent.querySelectorAll(".is-search-hidden")];
  hiddenItems.forEach((item) => item.classList.remove("is-search-hidden"));
  sections.forEach((section) => section.classList.add("is-measuring"));
  const maxHeight = Math.max(
    0,
    ...[...sections].map((section) => section.scrollHeight)
  );
  sections.forEach((section) => section.classList.remove("is-measuring"));
  hiddenItems.forEach((item) => item.classList.add("is-search-hidden"));

  setupContent.style.setProperty("--setup-content-min-height", `${maxHeight}px`);
}

function updateActiveSearchItems(query) {
  sections.forEach((section) => {
    const isActive = section.classList.contains("is-active");
    getSearchableItems(section).forEach((item) => {
      item.classList.toggle("is-search-hidden", Boolean(query && isActive && !itemMatchesSearch(item, query)));
    });
  });
}

function showSection(sectionId) {
  navButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.section === sectionId);
  });

  sections.forEach((section) => {
    section.classList.toggle("is-active", section.dataset.section === sectionId);
  });

  if (sectionId === "folders" && foldersTreeWrapper && foldersSortWrapper) {
    foldersTreeWrapper.style.display = "flex";
    foldersSortWrapper.style.display = "none";
    if (foldersSortActions) foldersSortActions.style.display = "none";
    if (firefoxBookmarksNotice) firefoxBookmarksNotice.style.display = "none";
    if (sortColumnsBtn) sortColumnsBtn.style.display = "";
    if (collapseAllBtn) collapseAllBtn.style.display = "";
    if (toggleAllFoldersBtn) toggleAllFoldersBtn.style.display = "";
    if (openBrowserBookmarksBtn) openBrowserBookmarksBtn.style.display = "";
  }

  updateActiveSearchItems(normalizeSearchText(settingsSearch.value));
  syncSetupContentHeight();
}

function applySettingsSearch() {
  const query = normalizeSearchText(settingsSearch.value);
  const sectionMatches = new Map();

  sections.forEach((section) => {
    const matches = sectionMatchesSearch(section, query);
    sectionMatches.set(section.dataset.section, matches);
  });

  navButtons.forEach((button) => {
    button.classList.toggle("has-search-match", Boolean(query && sectionMatches.get(button.dataset.section)));
  });

  const activeSection = [...sections].find((section) => section.classList.contains("is-active"));
  const activeMatches = activeSection && sectionMatches.get(activeSection.dataset.section);
  const firstMatch = [...sections].find((section) => sectionMatches.get(section.dataset.section));

  if (query && firstMatch && !activeMatches) {
    showSection(firstMatch.dataset.section);
  } else {
    updateActiveSearchItems(query);
    syncSetupContentHeight();
  }
}

function getSortOptions() {
  return [
    { value: "default", text: t(api, "sortDefault") },
    { value: "browser", text: t(api, "sortBrowser") },
    { value: "manual", text: t(api, "sortManual") },
    { value: "title-asc", text: t(api, "sortTitleAsc") },
    { value: "date-newest", text: t(api, "sortDateNewest") },
    { value: "domain-asc", text: t(api, "sortDomainAsc") },
    { value: "health-broken-first", text: t(api, "sortHealthBrokenFirst") }
  ];
}

function renderFolderTree(nodes, selectedFolderIds) {
  treeContainerClear();
  
  function hasSelectedDescendant(node, ids) {
    if (!node.children) return false;
    for (const child of node.children) {
      if (ids.includes(child.id)) return true;
      if (hasSelectedDescendant(child, ids)) return true;
    }
    return false;
  }
  
  function walk(node, parentPath = []) {
    const isFolderNode = node.children && !node.url;
    if (!isFolderNode) return null;

    const nextPath = node.title ? [...parentPath, node.title] : parentPath;
    const hasChildFolders = node.children.some(child => child.children && !child.url);

    if (!node.title || node.id === "0") {
      const fragment = document.createDocumentFragment();
      for (const child of node.children) {
        const el = walk(child, nextPath);
        if (el) fragment.appendChild(el);
      }
      return fragment;
    }

    const nodeEl = document.createElement("div");
    nodeEl.className = "folder-tree-node";
    nodeEl.dataset.folderId = node.id;

    const rowEl = document.createElement("div");
    rowEl.className = "folder-tree-row";

    const isExpandedByDefault = parentPath.length === 0 || hasSelectedDescendant(node, selectedFolderIds);

    const leftEl = document.createElement("div");
    leftEl.className = "folder-tree-row-left";

    if (hasChildFolders) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "folder-toggle-btn";
      btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>`;
      btn.setAttribute("aria-label", `${t(api, "expandCollapse")} ${node.title}`);
      btn.setAttribute("aria-expanded", isExpandedByDefault ? "true" : "false");
      
      btn.addEventListener("click", () => {
        const expanded = btn.getAttribute("aria-expanded") === "true";
        btn.setAttribute("aria-expanded", !expanded ? "true" : "false");
        childrenEl.classList.toggle("is-collapsed", expanded);
      });
      leftEl.appendChild(btn);
    } else {
      const spacer = document.createElement("div");
      spacer.className = "folder-toggle-spacer";
      leftEl.appendChild(spacer);
    }

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = node.id;
    checkbox.checked = selectedFolderIds.includes(node.id);
    checkbox.id = `folder-cb-${node.id}`;
    
    if (checkbox.checked) {
      rowEl.classList.add("is-selected");
    }
    
    const fullPathString = nextPath.join(" / ");
    checkbox.setAttribute("aria-label", `${t(api, "selectFolder")} ${fullPathString}`);

    checkbox.addEventListener("change", () => {
      rowEl.classList.toggle("is-selected", checkbox.checked);
      handleCheckboxChange(node.id, checkbox.checked);
    });

    leftEl.appendChild(checkbox);

    const nameSpan = document.createElement("span");
    nameSpan.className = "folder-title-text";
    
    const overrideName = (currentSettings.folderNameOverrides || {})[node.id];
    nameSpan.textContent = overrideName || node.title;
    nameSpan.title = overrideName || node.title;

    nameSpan.addEventListener("dblclick", (e) => {
      e.stopPropagation();
      nameSpan.setAttribute("contenteditable", "true");
      nameSpan.focus();
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(nameSpan);
      selection.removeAllRanges();
      selection.addRange(range);
    });

    const saveNewName = () => {
      if (!nameSpan.hasAttribute("contenteditable")) return;
      nameSpan.removeAttribute("contenteditable");
      const newName = nameSpan.textContent.trim();
      const currentOverride = (currentSettings.folderNameOverrides || {})[node.id];
      const displayName = currentOverride || node.title;

      if (newName !== displayName) {
        const overrides = { ...(currentSettings.folderNameOverrides || {}) };
        if (!newName || newName === node.title) {
          delete overrides[node.id];
        } else {
          overrides[node.id] = newName;
        }
        currentSettings.folderNameOverrides = overrides;
        saveButton.disabled = false;
        if (typeof status !== "undefined" && status) {
          status.textContent = t(api, "unsavedChanges");
        }
        const updatedPath = [...nextPath.slice(0, -1), newName || node.title].join(" / ");
        checkbox.setAttribute("aria-label", `${t(api, "selectFolder")} ${updatedPath}`);
        renderSelectedFolders();
      } else {
        nameSpan.textContent = displayName;
      }
    };

    nameSpan.addEventListener("blur", saveNewName);
    nameSpan.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        saveNewName();
      } else if (e.key === "Escape") {
        const overrideName = (currentSettings.folderNameOverrides || {})[node.id];
        nameSpan.textContent = overrideName || node.title;
        nameSpan.removeAttribute("contenteditable");
      }
    });

    leftEl.appendChild(nameSpan);
    rowEl.appendChild(leftEl);

    // Controles inline (Modo y Orden) que se muestran dinámicamente
    const inlineControls = document.createElement("div");
    inlineControls.className = "folder-tree-inline-controls";

    const modeSelect = document.createElement("select");
    modeSelect.className = "folder-mode-select";
    modeSelect.dataset.folderId = node.id;
    modeSelect.setAttribute("aria-label", `${t(api, "modeDescription")} - ${overrideName || node.title}`);
    [
      { value: "default", text: t(api, "modeDefault") },
      { value: "list", text: t(api, "modeList") },
      { value: "compact", text: t(api, "modeCompact") },
      { value: "icons", text: t(api, "modeIcons") },
      { value: "icons-large", text: t(api, "modeIconsLarge") },
      { value: "quicklinks", text: t(api, "modeQuicklinks") }
    ].forEach(opt => {
      const o = document.createElement("option");
      o.value = opt.value;
      o.textContent = opt.text;
      modeSelect.appendChild(o);
    });
    modeSelect.value = (currentSettings.folderModes || {})[node.id] || "default";
    modeSelect.addEventListener("mousedown", (e) => e.stopPropagation());
    modeSelect.addEventListener("change", () => {
      const modes = { ...(currentSettings.folderModes || {}) };
      if (modeSelect.value === "default") {
        delete modes[node.id];
      } else {
        modes[node.id] = modeSelect.value;
      }
      currentSettings.folderModes = modes;
      saveButton.disabled = false;
      if (typeof status !== "undefined" && status) {
        status.textContent = t(api, "unsavedChanges");
      }
    });

    const sortSelect = document.createElement("select");
    sortSelect.className = "folder-sort-select";
    sortSelect.dataset.folderId = node.id;
    sortSelect.setAttribute("aria-label", `${t(api, "sortDescription")} - ${overrideName || node.title}`);
    getSortOptions().forEach(opt => {
      const o = document.createElement("option");
      o.value = opt.value;
      o.textContent = opt.text;
      sortSelect.appendChild(o);
    });
    sortSelect.value = (currentSettings.folderSorts || {})[node.id] || "default";
    sortSelect.addEventListener("mousedown", (e) => e.stopPropagation());
    sortSelect.addEventListener("change", () => {
      const sorts = { ...(currentSettings.folderSorts || {}) };
      if (sortSelect.value === "default") {
        delete sorts[node.id];
      } else {
        sorts[node.id] = sortSelect.value;
      }
      currentSettings.folderSorts = sorts;
      saveButton.disabled = false;
      if (typeof status !== "undefined" && status) {
        status.textContent = t(api, "unsavedChanges");
      }
    });

    inlineControls.append(modeSelect, sortSelect);
    rowEl.appendChild(inlineControls);
    nodeEl.appendChild(rowEl);

    let childrenEl = null;
    if (node.children && node.children.length > 0) {
      childrenEl = document.createElement("div");
      childrenEl.className = "folder-tree-children" + (isExpandedByDefault ? "" : " is-collapsed");
      
      let childCount = 0;
      for (const child of node.children) {
        const el = walk(child, nextPath);
        if (el) {
          childrenEl.appendChild(el);
          childCount++;
        }
      }
      
      if (childCount > 0) {
        nodeEl.appendChild(childrenEl);
      }
    }

    return nodeEl;
  }

  const fragment = document.createDocumentFragment();
  for (const node of nodes) {
    const el = walk(node);
    if (el) fragment.appendChild(el);
  }
  folderTreeContainer.appendChild(fragment);
}

function treeContainerClear() {
  if (folderTreeContainer) {
    folderTreeContainer.innerHTML = "";
  }
}

function handleCheckboxChange(folderId, isChecked) {
  let selectedIds = [...(currentSettings.selectedFolderIds || [])];
  if (isChecked) {
    if (!selectedIds.includes(folderId)) {
      selectedIds.push(folderId);
    }
  } else {
    selectedIds = selectedIds.filter(id => id !== folderId);
  }
  currentSettings.selectedFolderIds = selectedIds;
  saveButton.disabled = false;
  if (typeof status !== "undefined" && status) {
    status.textContent = t(api, "unsavedChanges");
  }
  renderSelectedFolders();
}

function renderSelectedFolders() {
  if (!selectedFoldersList) return;
  selectedFoldersList.innerHTML = "";

  const selectedFolderIds = currentSettings.selectedFolderIds || [];
  
  if (selectedFolderIds.length === 0) {
    const emptyMsg = document.createElement("div");
    emptyMsg.style.padding = "24px 12px";
    emptyMsg.style.textAlign = "center";
    emptyMsg.style.color = "var(--text-secondary)";
    emptyMsg.style.fontSize = "13px";
    emptyMsg.textContent = t(api, "noFoldersSelected");
    selectedFoldersList.appendChild(emptyMsg);
    return;
  }

  let draggedItem = null;

  selectedFolderIds.forEach(id => {
    const folder = currentFolders.find(f => f.id === id);
    if (!folder) return;

    const itemEl = document.createElement("div");
    itemEl.className = "selected-folder-item";
    itemEl.draggable = true;
    itemEl.dataset.folderId = id;

    itemEl.addEventListener("dragstart", function(e) {
      draggedItem = this;
      setTimeout(() => this.classList.add("is-dragging"), 0);
    });

    itemEl.addEventListener("dragend", function() {
      draggedItem = null;
      this.classList.remove("is-dragging");
      
      const newOrder = [...selectedFoldersList.querySelectorAll(".selected-folder-item")].map(el => el.dataset.folderId);
      currentSettings.selectedFolderIds = newOrder;
      saveButton.disabled = false;
      if (typeof status !== "undefined" && status) {
        status.textContent = t(api, "unsavedChanges");
      }
    });

    itemEl.addEventListener("dragover", function(e) {
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

    const dragHandle = document.createElement("div");
    dragHandle.className = "drag-handle";
    dragHandle.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="9" y1="5" x2="15" y2="5"></line><line x1="9" y1="9" x2="15" y2="9"></line><line x1="9" y1="13" x2="15" y2="13"></line><line x1="9" y1="17" x2="15" y2="17"></line></svg>`;
    
    const srSpan = document.createElement("span");
    srSpan.className = "sr-only";
    srSpan.textContent = t(api, "dragToReorder");
    dragHandle.appendChild(srSpan);
    itemEl.appendChild(dragHandle);

    const infoEl = document.createElement("div");
    infoEl.className = "selected-folder-info";

    const nameEl = document.createElement("div");
    nameEl.className = "selected-folder-name";
    const overrideName = (currentSettings.folderNameOverrides || {})[id];
    nameEl.textContent = overrideName || folder.title;
    nameEl.title = overrideName || folder.title;

    const pathEl = document.createElement("div");
    pathEl.className = "selected-folder-path";
    const pathParts = folder.path.split(" / ");
    if (pathParts.length > 1) {
      pathEl.textContent = pathParts.slice(0, -1).join(" / ");
      pathEl.title = folder.path;
    } else {
      pathEl.textContent = folder.path;
      pathEl.title = folder.path;
    }

    infoEl.append(nameEl, pathEl);
    itemEl.appendChild(infoEl);
    const orderActions = document.createElement("div");
    orderActions.className = "item-order-actions";

    const upBtn = document.createElement("button");
    upBtn.type = "button";
    upBtn.className = "order-btn up-btn";
    // "send to top" icon: horizontal bar + chevron up
    upBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="4" x2="19" y2="4"></line><polyline points="18 11 12 5 6 11"></polyline></svg>`;
    upBtn.setAttribute("aria-label", `${t(api, "moveToTop")} - ${overrideName || folder.title}`);
    upBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const firstItem = selectedFoldersList.querySelector(".selected-folder-item");
      if (firstItem && firstItem !== itemEl) {
        selectedFoldersList.prepend(itemEl);
        const newOrder = [...selectedFoldersList.querySelectorAll(".selected-folder-item")].map(el => el.dataset.folderId);
        currentSettings.selectedFolderIds = newOrder;
        saveButton.disabled = false;
        if (typeof status !== "undefined" && status) {
          status.textContent = t(api, "unsavedChanges");
        }
      }
    });

    const downBtn = document.createElement("button");
    downBtn.type = "button";
    downBtn.className = "order-btn down-btn";
    // "send to bottom" icon: chevron down + horizontal bar
    downBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 13 12 19 18 13"></polyline><line x1="5" y1="20" x2="19" y2="20"></line></svg>`;
    downBtn.setAttribute("aria-label", `${t(api, "moveToBottom")} - ${overrideName || folder.title}`);
    downBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const lastItem = selectedFoldersList.querySelector(".selected-folder-item:last-child");
      if (lastItem && lastItem !== itemEl) {
        selectedFoldersList.append(itemEl);
        const newOrder = [...selectedFoldersList.querySelectorAll(".selected-folder-item")].map(el => el.dataset.folderId);
        currentSettings.selectedFolderIds = newOrder;
        saveButton.disabled = false;
        if (typeof status !== "undefined" && status) {
          status.textContent = t(api, "unsavedChanges");
        }
      }
    });

    orderActions.append(upBtn, downBtn);
    itemEl.appendChild(orderActions);

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "folder-remove-btn";
    removeBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
    removeBtn.setAttribute("aria-label", `${t(api, "removeFolder")} ${overrideName || folder.title}`);

    removeBtn.addEventListener("click", () => {
      const checkbox = document.querySelector(`#folder-cb-${id}`);
      if (checkbox) {
        checkbox.checked = false;
        checkbox.dispatchEvent(new Event("change"));
      } else {
        handleCheckboxChange(id, false);
      }
    });

    itemEl.appendChild(removeBtn);
    selectedFoldersList.appendChild(itemEl);
  });
}

function applyFolderTreeSearch() {
  if (!folderTreeSearchInput) return;
  const query = normalizeSearchText(folderTreeSearchInput.value);
  const allNodes = document.querySelectorAll("#folder-tree-container .folder-tree-node");
  const allChildren = document.querySelectorAll("#folder-tree-container .folder-tree-children");
  const allToggleBtns = document.querySelectorAll("#folder-tree-container .folder-toggle-btn");

  if (!query) {
    allNodes.forEach(node => {
      node.style.display = "";
    });
    allChildren.forEach(children => {
      const wasCollapsed = children.getAttribute("data-was-collapsed") === "true";
      children.classList.toggle("is-collapsed", wasCollapsed);
      children.removeAttribute("data-was-collapsed");
      
      const parentNode = children.closest(".folder-tree-node");
      if (parentNode) {
        const toggleBtn = parentNode.querySelector(":scope > .folder-tree-row > .folder-toggle-btn");
        if (toggleBtn) {
          toggleBtn.setAttribute("aria-expanded", wasCollapsed ? "false" : "true");
        }
      }
    });
    return;
  }

  let hasStoredState = false;
  for (const children of allChildren) {
    if (children.hasAttribute("data-was-collapsed")) {
      hasStoredState = true;
      break;
    }
  }
  if (!hasStoredState) {
    allChildren.forEach(children => {
      const isCollapsed = children.classList.contains("is-collapsed");
      children.setAttribute("data-was-collapsed", isCollapsed ? "true" : "false");
    });
  }

  allNodes.forEach(node => {
    node.style.display = "none";
  });
  allChildren.forEach(children => {
    children.classList.add("is-collapsed");
  });
  allToggleBtns.forEach(btn => {
    btn.setAttribute("aria-expanded", "false");
  });

  const matchingRows = [];
  document.querySelectorAll("#folder-tree-container .folder-tree-row").forEach(row => {
    const titleTextEl = row.querySelector(".folder-title-text");
    if (titleTextEl) {
      const titleText = normalizeSearchText(titleTextEl.textContent);
      if (titleText.includes(query)) {
        matchingRows.push(row);
      }
    }
  });

  matchingRows.forEach(row => {
    let current = row.closest(".folder-tree-node");
    if (!current) return;
    
    current.style.display = "flex";
    
    current.querySelectorAll(".folder-tree-node").forEach(childNode => {
      childNode.style.display = "flex";
    });

    let parent = current.parentElement.closest(".folder-tree-node");
    while (parent) {
      parent.style.display = "flex";
      
      const childrenContainer = parent.querySelector(":scope > .folder-tree-children");
      if (childrenContainer) {
        childrenContainer.classList.remove("is-collapsed");
      }
      const toggleBtn = parent.querySelector(":scope > .folder-tree-row > .folder-toggle-btn");
      if (toggleBtn) {
        toggleBtn.setAttribute("aria-expanded", "true");
      }
      
      parent = parent.parentElement.closest(".folder-tree-node");
    }
  });
}

function renderFolders(folders, selectedFolderIds, folderModes = {}, folderSorts = {}) {
  if (rawBookmarkTree) {
    renderFolderTree(rawBookmarkTree, selectedFolderIds);
  }
  renderSelectedFolders();
}

function getSelectedFolderIds() {
  if (!selectedFoldersList) return [];
  return [...selectedFoldersList.querySelectorAll(".selected-folder-item")].map(el => el.dataset.folderId);
}

function getFolderModes() {
  const folderModes = {};
  const selectedIds = getSelectedFolderIds();
  selectedIds.forEach(id => {
    const select = document.querySelector(`.folder-mode-select[data-folder-id="${id}"]`);
    if (select && select.value !== "default") {
      folderModes[id] = select.value;
    }
  });
  return folderModes;
}

function getFolderSorts() {
  const folderSorts = {};
  const selectedIds = getSelectedFolderIds();
  selectedIds.forEach(id => {
    const select = document.querySelector(`.folder-sort-select[data-folder-id="${id}"]`);
    if (select && select.value !== "default") {
      folderSorts[id] = select.value;
    }
  });
  return folderSorts;
}

function collectSettingsFromForm(linkHealthEnabled, previewCaptureEnabled, showTopSitesFolder, localStatsEnabled) {
  return {
    ...currentSettings,
    selectedFolderIds: getSelectedFolderIds(),
    automaticTagsEnabled: automaticTags.checked,
    manualTagsEnabled: manualTags.checked,
    showPinnedFolder: showPinnedFolder.checked,
    showViewButton: showViewButton.checked,
    showSortButton: showSortButton.checked,
    linkHealthEnabled: linkHealthEnabled,
    previewEnabled: previewEnabled.checked,
    previewCaptureEnabled: previewCaptureEnabled,
    showTopSitesFolder: showTopSitesFolder,
    topSitesLimit: Number(topsitesLimit.value),
    localStatsEnabled: localStats.checked,
    cleanFolderNames: cleanFolderNames.checked,
    enablePinnedShortcuts: enablePinnedShortcuts.checked,
    pinnedShortcutModifier: currentShortcutModifiers,
    theme: themeSelect.value,
    language: languageSelect.value,
    defaultFolderMode: defaultModeSelect.value,
    defaultFolderSort: defaultSortSelect.value,
    folderModes: getFolderModes(),
    folderSorts: getFolderSorts(),
    setupComplete: true
  };
}

function needsUrlPermission(linkHealthRequested, previewCaptureRequested) {
  return linkHealthRequested || previewCaptureRequested;
}

async function requestTopSitesPermission() {
  if (!api.permissions?.request) return false;
  try { return await api.permissions.request(topSitesPermissions); } catch { return false; }
}

async function requestUrlPermission() {
  if (!api.permissions?.request) {
    return false;
  }

  try {
    return await api.permissions.request(urlPermissions);
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
  if (linkHealthRequested && !linkHealthEnabled) {
    return t(api, "saveErrorNoPermissionsHealth");
  }
  if (previewCaptureRequested && !previewCaptureEnabled) {
    return t(api, "saveErrorNoPermissionsCapture");
  }
  return t(api, "saveSuccess");
}

async function init() {
  const settings = await getSettings(api);
  currentSettings = settings;

  // Apply theme immediately to minimize theme visual transition delay
  themeSelect.value = currentSettings.theme || "system";
  applyTheme(themeSelect.value);

  // Load tree and i18n concurrently
  const [tree] = await Promise.all([
    api.bookmarks.getTree(),
    initI18n(api, settings.language)
  ]);
  rawBookmarkTree = tree;
  
  localizeHtml(api);
  
  const version = api.runtime.getManifest().version;
  if (sidebarVersion) sidebarVersion.textContent = `v${version}`;
  if (advancedVersion) advancedVersion.textContent = version;
  
  automaticTags.checked = currentSettings.automaticTagsEnabled !== false;
  manualTags.checked = currentSettings.manualTagsEnabled !== false;
  showPinnedFolder.checked = currentSettings.showPinnedFolder !== false;
  showViewButton.checked = currentSettings.showViewButton !== false;
  showSortButton.checked = currentSettings.showSortButton !== false;
  linkHealth.checked = currentSettings.linkHealthEnabled;
  previewEnabled.checked = currentSettings.previewEnabled;
  previewCapture.checked = currentSettings.previewCaptureEnabled;
  cleanFolderNames.checked = currentSettings.cleanFolderNames !== false;
  enablePinnedShortcuts.checked = currentSettings.enablePinnedShortcuts !== false;
  let mods = currentSettings.pinnedShortcutModifier;
  if (!Array.isArray(mods)) {
    mods = mods === "ctrlShift" ? ["Control", "Shift"] 
           : mods === "ctrl" ? ["Control", ""] 
           : ["Alt", ""];
  } else {
    // legacy migration if they had ["ctrl"]
    mods = mods.map(m => m === "ctrl" ? "Control" : m === "alt" ? "Alt" : m === "shift" ? "Shift" : (m || ""));
  }
  while(mods.length < 2) mods.push("");
  currentShortcutModifiers = mods.slice(0, 2);
  updateShortcutCatcherLabel();
  frequentSites.checked = currentSettings.showTopSitesFolder;
  topsitesLimit.value = settings.topSitesLimit || 8;
  
  if (currentSettings.topSitesBlacklist && currentSettings.topSitesBlacklist.length > 0) {
    resetTopsitesBlacklistBtn.style.display = "block";
  } else {
    resetTopsitesBlacklistBtn.style.display = "none";
  }

  localStats.checked = settings.localStatsEnabled !== false;

  renderStatistics();
  languageSelect.value = normalizeLanguageCode(currentSettings.language) || "system";
  defaultModeSelect.value = currentSettings.defaultFolderMode || "list";
  defaultSortSelect.value = currentSettings.defaultFolderSort || "browser";

  currentFolders = getFolderOptions(tree);
  renderFolders(
    currentFolders,
    currentSettings.selectedFolderIds,
    currentSettings.folderModes || {},
    currentSettings.folderSorts || {}
  );
  applySettingsSearch();
}

navButtons.forEach((button) => {
  button.addEventListener("click", () => {
    showSection(button.dataset.section);
  });
});

themeSelect.addEventListener("change", () => {
  applyTheme(themeSelect.value);
});

settingsSearch.addEventListener("input", applySettingsSearch);
window.addEventListener("resize", syncSetupContentHeight);

async function resetLocalOrganization() {
  const confirmed = window.confirm(
    t(api, "confirmResetLocalOrg")
  );
  if (!confirmed) return;

  currentSettings = {
    ...currentSettings,
    bookmarkFolderOverrides: {},
    folderBookmarkOrders: {},
    folderNameOverrides: {}
  };

  await saveSettings(api, currentSettings);
  status.textContent = t(api, "resetLocalOrgSuccess");
}

async function clearPreviewCache() {
  const confirmed = window.confirm(t(api, "confirmClearPreviews"));
  if (!confirmed) return;

  await setStoredValue(api, STORAGE_KEYS.capturedPreviews, {});
  await setStoredValue(api, STORAGE_KEYS.pendingPreviewCaptures, {});
  status.textContent = t(api, "clearPreviewsSuccess");
}

if (toggleAllFoldersBtn) {
  toggleAllFoldersBtn.addEventListener("click", () => {
    if (!folderTreeContainer) return;
    const checkboxes = folderTreeContainer.querySelectorAll("input[type='checkbox']");
    const allChecked = [...checkboxes].every(cb => cb.checked);
    const newState = !allChecked;
    
    let selectedIds = [...(currentSettings.selectedFolderIds || [])];
    checkboxes.forEach((cb) => {
      cb.checked = newState;
      if (newState) {
        if (!selectedIds.includes(cb.value)) {
          selectedIds.push(cb.value);
        }
      } else {
        selectedIds = selectedIds.filter(id => id !== cb.value);
      }
    });
    currentSettings.selectedFolderIds = selectedIds;
    saveButton.disabled = false;
    if (typeof status !== "undefined" && status) {
      status.textContent = t(api, "unsavedChanges");
    }
    renderSelectedFolders();
  });
}

if (collapseAllBtn) {
  collapseAllBtn.addEventListener("click", () => {
    if (!folderTreeContainer) return;
    const allChildren = folderTreeContainer.querySelectorAll(".folder-tree-children");
    allChildren.forEach(children => {
      children.classList.add("is-collapsed");
    });
    const allToggleBtns = folderTreeContainer.querySelectorAll(".folder-toggle-btn");
    allToggleBtns.forEach(btn => {
      btn.setAttribute("aria-expanded", "false");
    });
  });
}

if (folderTreeSearchInput) {
  folderTreeSearchInput.addEventListener("input", applyFolderTreeSearch);
}

if (openBrowserBookmarksBtn) {
  openBrowserBookmarksBtn.addEventListener("click", () => {
    if (navigator.userAgent.includes("Firefox")) {
      if (firefoxBookmarksNotice) {
        const isHidden = firefoxBookmarksNotice.style.display === "none" || !firefoxBookmarksNotice.style.display;
        firefoxBookmarksNotice.style.display = isHidden ? "block" : "none";
      }
    } else {
      api.tabs.create({ url: "chrome://bookmarks/" }).catch(err => {
        console.error("No se pudo abrir el administrador de marcadores:", err);
      });
    }
  });
}

if (sortColumnsBtn && backToTreeBtn && foldersTreeWrapper && foldersSortWrapper) {
  sortColumnsBtn.addEventListener("click", () => {
    foldersTreeWrapper.style.display = "none";
    foldersSortWrapper.style.display = "flex";
    if (foldersSortActions) foldersSortActions.style.display = "flex";
    if (firefoxBookmarksNotice) firefoxBookmarksNotice.style.display = "none";
    
    // Hide standard folder action buttons
    sortColumnsBtn.style.display = "none";
    if (collapseAllBtn) collapseAllBtn.style.display = "none";
    if (toggleAllFoldersBtn) toggleAllFoldersBtn.style.display = "none";
    if (openBrowserBookmarksBtn) openBrowserBookmarksBtn.style.display = "none";
    
    renderSelectedFolders();
  });
  
  backToTreeBtn.addEventListener("click", () => {
    foldersTreeWrapper.style.display = "flex";
    foldersSortWrapper.style.display = "none";
    if (foldersSortActions) foldersSortActions.style.display = "none";
    
    // Show standard folder action buttons
    sortColumnsBtn.style.display = "";
    if (collapseAllBtn) collapseAllBtn.style.display = "";
    if (toggleAllFoldersBtn) toggleAllFoldersBtn.style.display = "";
    if (openBrowserBookmarksBtn) openBrowserBookmarksBtn.style.display = "";
  });
}

resetLocalOrganizationButton.addEventListener("click", () => {
  resetLocalOrganization().catch((error) => {
    status.textContent = t(api, "resetLocalOrgError", [error.message]);
  });
});

clearPreviewCacheButton.addEventListener("click", () => {
  clearPreviewCache().catch((error) => {
    status.textContent = t(api, "clearPreviewsError", [error.message]);
  });
});

const importSummaryContainer = document.querySelector("#import-summary-container");
const importSummaryText = document.querySelector("#import-summary-text");
const importConfirmBtn = document.querySelector("#import-confirm-btn");
const importCancelBtn = document.querySelector("#import-cancel-btn");

let pendingImportResult = null;

exportConfigButton.addEventListener("click", async () => {
  try {
    const data = await api.storage.local.get([STORAGE_KEYS.manualTags, STORAGE_KEYS.pinnedBookmarks, STORAGE_KEYS.bookmarkIndex]);
    const tree = await api.bookmarks.getTree();
    const currentFolderOptions = getFolderOptions(tree);
    
    // Use current UI state for settings, fallback to currentSettings for permissions
    const settingsToExport = collectSettingsFromForm(
      currentSettings?.linkHealthEnabled || false, 
      currentSettings?.previewCaptureEnabled || false
    );

    const exportData = generateExportData(
      settingsToExport,
      data[STORAGE_KEYS.manualTags] || {},
      data[STORAGE_KEYS.pinnedBookmarks] || [],
      data[STORAGE_KEYS.bookmarkIndex] || {},
      currentFolderOptions
    );
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `martabs-config-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    status.textContent = t(api, "exportSuccess");
  } catch (error) {
    status.textContent = t(api, "exportError", [error.message]);
  }
});

importConfigButton.addEventListener("click", () => {
  importConfigFile.click();
});

importConfigFile.addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const text = await file.text();
    const json = JSON.parse(text);
    
    const data = await api.storage.local.get([STORAGE_KEYS.bookmarkIndex]);
    const tree = await api.bookmarks.getTree();
    const currentFolderOptions = getFolderOptions(tree);
    const result = parseAndRemapImport(json, data[STORAGE_KEYS.bookmarkIndex] || {}, currentFolderOptions);
    
    // Validar permisos requeridos
    if (result.settings.linkHealthEnabled || result.settings.previewCaptureEnabled) {
      if (api.permissions?.contains) {
        const hasUrlPerms = await api.permissions.contains(urlPermissions);
        if (!hasUrlPerms) {
          result.settings.linkHealthEnabled = false;
          result.settings.previewCaptureEnabled = false;
        }
      } else {
        result.settings.linkHealthEnabled = false;
        result.settings.previewCaptureEnabled = false;
      }
    }

    pendingImportResult = result;
    importSummaryContainer.style.display = "block";
    importSummaryText.textContent = t(api, "importSummary", [
      result.stats.mappedFolders,
      result.stats.mappedTags,
      result.stats.mappedPinned,
      result.stats.unmappedItems
    ]);
  } catch (error) {
    let errorMsg = error.message;
    if (error.code === "INVALID_FORMAT") {
      errorMsg = t(api, "importErrorParse");
    } else if (error.code === "INVALID_VERSION") {
      errorMsg = t(api, "importErrorVersion");
    }
    status.textContent = t(api, "importErrorProcess", [errorMsg]);
  }
  importConfigFile.value = "";
});

importConfirmBtn.addEventListener("click", async () => {
  if (!pendingImportResult) return;
  
  try {
    importSummaryContainer.style.display = "none";
    status.textContent = t(api, "importSaving");
    
    await setStoredValue(api, STORAGE_KEYS.settings, pendingImportResult.settings);
    await setStoredValue(api, STORAGE_KEYS.manualTags, pendingImportResult.manualTags);
    await setStoredValue(api, STORAGE_KEYS.pinnedBookmarks, pendingImportResult.pinnedBookmarks);
    
    pendingImportResult = null;
    status.textContent = t(api, "importSuccess");
    setTimeout(() => window.location.reload(), 2000);
  } catch (error) {
    status.textContent = t(api, "importErrorSave", [error.message]);
  }
});

importCancelBtn.addEventListener("click", () => {
  pendingImportResult = null;
  importSummaryContainer.style.display = "none";
  importConfigFile.value = "";
});

saveButton.addEventListener("click", async () => {
  try {
    const selectedFolderIds = getSelectedFolderIds();
    if (selectedFolderIds.length === 0) {
      status.textContent = t(api, "selectFolderWarning");
      return;
    }

    const linkHealthRequested = linkHealth.checked;
    const previewCaptureRequested = previewCapture.checked;
    const frequentSitesRequested = frequentSites.checked;
    const localStatsRequested = localStats.checked;

    // Start permission requests concurrently in the synchronous turn of the user gesture.
    // In Firefox, any await in the event handler ends the user gesture context,
    // which prevents requesting other optional permissions (like topSites) afterwards.
    const urlPermissionPromise = needsUrlPermission(linkHealthRequested, previewCaptureRequested)
      ? requestUrlPermission()
      : Promise.resolve(false);
    const topSitesPermissionPromise = frequentSitesRequested
      ? requestTopSitesPermission()
      : Promise.resolve(false);

    const urlPermissionGranted = needsUrlPermission(linkHealthRequested, previewCaptureRequested)
      ? await urlPermissionPromise
      : false;
    const linkHealthEnabled = linkHealthRequested && urlPermissionGranted;
    const previewCaptureEnabled = previewCaptureRequested && urlPermissionGranted;
    const topSitesPermissionGranted = frequentSitesRequested ? await topSitesPermissionPromise : false;
    const showTopSitesFolder = frequentSitesRequested && topSitesPermissionGranted;

    if (!needsUrlPermission(linkHealthRequested, previewCaptureRequested)) {
      await removePermission(urlPermissions);
    }

    if (!linkHealthEnabled) {
      linkHealth.checked = false;
    }

    if (!previewCaptureEnabled) {
      previewCapture.checked = false;
    }
    if (!showTopSitesFolder) {
      frequentSites.checked = false;
    }

    currentSettings = collectSettingsFromForm(linkHealthEnabled, previewCaptureEnabled, showTopSitesFolder, localStatsRequested);
    if (localStatsRequested) renderStatistics();
    await saveSettings(api, currentSettings);

    await initI18n(api, currentSettings.language);
    localizeHtml(api);
    renderFolders(
      currentFolders,
      currentSettings.selectedFolderIds,
      currentSettings.folderModes || {},
      currentSettings.folderSorts || {}
    );

    applyTheme(themeSelect.value);
    status.textContent = getSuccessMessage(
      linkHealthRequested,
      linkHealthEnabled,
      previewCaptureRequested,
      previewCaptureEnabled
    );
    saveButton.disabled = true;
  } catch (error) {
    status.textContent = t(api, "saveError", [error.message]);
  }
});

const handleSettingsChange = (e) => {
  if (e.target.id !== "import-config" && e.target.id !== "export-config" && e.target.id !== "settings-search" && e.target.id !== "toggle-all-folders") {
    saveButton.disabled = false;
  }
};
document.querySelector(".setup-content").addEventListener("change", handleSettingsChange);
localStats.addEventListener("change", () => {
    renderStatistics();
});
document.querySelector(".setup-content").addEventListener("input", handleSettingsChange);

backButton.addEventListener("click", () => {
  if (!saveButton.disabled) {
    const message = t(api, "unsavedChangesWarning") || "Tienes cambios sin guardar. ¿Seguro que quieres salir?";
    if (!window.confirm(message)) {
      return;
    }
  }
  window.location.href = "../newtab/newtab.html";
});

init().then(() => {
  saveButton.disabled = true;
}).catch((error) => {
  status.textContent = t(api, "loadError", [error.message]);
});

function formatKeyName(key) {
  if (!key) return "Ninguno";
  if (key === " ") return "Space";
  return key.charAt(0).toUpperCase() + key.slice(1);
}

function updateShortcutCatcherLabel() {
  if (pinnedShortcutCatcher1) pinnedShortcutCatcher1.textContent = formatKeyName(currentShortcutModifiers[0]);
  if (pinnedShortcutCatcher2) pinnedShortcutCatcher2.textContent = formatKeyName(currentShortcutModifiers[1]);
}

let activeCatcherIndex = -1;

function bindCatcher(catcher, index) {
  if (!catcher) return;
  catcher.addEventListener("click", () => {
    activeCatcherIndex = index;
    catcher.textContent = "Presiona...";
    catcher.focus();
  });

  catcher.addEventListener("keydown", (e) => {
    if (activeCatcherIndex !== index) return;
    e.preventDefault();
    if (e.key === "Escape" || e.key === "Enter") {
      activeCatcherIndex = -1;
      catcher.blur();
      return;
    }
    if (e.key === "Backspace" || e.key === "Delete") {
      currentShortcutModifiers[index] = "";
      updateShortcutCatcherLabel();
      saveButton.disabled = false;
      return;
    }

    currentShortcutModifiers[index] = e.key === "Control" ? "Control" : e.key;
    updateShortcutCatcherLabel();
    saveButton.disabled = false;
    
    // Auto blur after receiving a valid key
    activeCatcherIndex = -1;
    catcher.blur();
  });

  catcher.addEventListener("blur", () => {
    if (activeCatcherIndex === index) {
      activeCatcherIndex = -1;
      updateShortcutCatcherLabel();
    }
  });
}

bindCatcher(pinnedShortcutCatcher1, 0);
bindCatcher(pinnedShortcutCatcher2, 1);

async function renderStatistics() {
  if (!statsChart || !storageAudit) return;
  
  if (!localStats.checked) {
    statisticsDisabledMsg.style.display = "block";
    statisticsContent.style.display = "none";
    return;
  } else {
    statisticsDisabledMsg.style.display = "none";
    statisticsContent.style.display = "";
  }
  
  statsChart.innerHTML = "";
  storageAudit.innerHTML = "";
  const data = await api.storage.local.get(STORAGE_KEYS.clickStats);
  const clickStats = data[STORAGE_KEYS.clickStats] || [];
  if (clickStats.length === 0) {
    statsChart.innerHTML = `<p data-i18n="emptyResults">${t(api, "emptyResults")}</p>`;
  } else {
    const counts = {};
    const titles = {};
    const urls = {};
    clickStats.forEach(stat => {
      counts[stat.bookmarkId] = (counts[stat.bookmarkId] || 0) + 1;
      titles[stat.bookmarkId] = stat.title || stat.url || "Unknown";
      urls[stat.bookmarkId] = stat.url;
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10);
    const maxCount = sorted[0][1];
    
    statsChart.innerHTML = `<div role="list" style="display: flex; flex-direction: column; gap: 12px; margin-top: 8px;">` + 
      sorted.map(([id, count]) => {
        const percentage = (count / maxCount) * 100;
        let domain = "";
        try { domain = new URL(urls[id]).hostname; } catch(e) {}
        const faviconUrl = domain ? `https://s2.googleusercontent.com/s2/favicons?domain=${domain}&sz=32` : "";
        const faviconImg = faviconUrl 
          ? `<img src="${faviconUrl}" alt="" style="width: 16px; height: 16px; border-radius: 2px;">` 
          : `<div style="width: 16px; height: 16px; border-radius: 2px; background: var(--surface-border);"></div>`;
        const visitsText = t(api, count === 1 ? "visitsCountSingular" : "visitsCountPlural", [String(count)]);

        return `
          <div role="listitem" style="display: flex; align-items: center; gap: 12px;">
            <div style="display: flex; align-items: center; gap: 8px; width: 140px; min-width: 140px; overflow: hidden;">
              ${faviconImg}
              <span style="font-size: 13px; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${titles[id]}">${titles[id]}</span>
            </div>
            <div style="width: 80px; min-width: 80px; font-size: 12px; color: var(--text-secondary); text-align: end;">
              ${visitsText || (count + " aperturas")}
            </div>
            <div aria-hidden="true" style="flex: 1; height: 14px; display: flex; align-items: center;">
              <div style="width: ${percentage}%; height: 100%; background-color: var(--primary); border-radius: 3px; min-width: 4px;"></div>
            </div>
          </div>
        `;
      }).join("") + `</div>`;
  }
  try {
    const allStorage = await api.storage.local.get(null);
    let totalBytes = 0;
    for (const [key, value] of Object.entries(allStorage)) {
      const size = new Blob([JSON.stringify(value)]).size;
      totalBytes += size;
      storageAudit.innerHTML += `
        <div style="display: flex; justify-content: space-between; padding: 8px; background-color: var(--surface-strong); border-radius: 6px; border: 1px solid var(--surface-border);">
          <span style="font-size: 13px;">${key}</span>
          <span style="font-size: 13px; color: var(--text-secondary); font-variant-numeric: tabular-nums;">${(size / 1024).toFixed(1)} KB</span>
        </div>
      `;
    }
    storageAudit.innerHTML += `
      <div style="display: flex; justify-content: space-between; padding: 8px; background-color: var(--primary-soft); border-radius: 6px; border: 1px solid var(--surface-border); font-weight: 500;">
        <span style="font-size: 13px;">Total</span>
        <span style="font-size: 13px; font-variant-numeric: tabular-nums;">${(totalBytes / 1024).toFixed(1)} KB</span>
      </div>
    `;
  } catch (e) {
    storageAudit.innerHTML = `<p>Error loading storage.</p>`;
  }
}

if (resetStatsBtn) {
  resetStatsBtn.addEventListener("click", async () => {
    if (confirm(t(api, "confirmResetStats"))) {
      await api.storage.local.set({ [STORAGE_KEYS.clickStats]: [] });
      renderStatistics();
    }
  });

  goToPrivacyStatsBtn.addEventListener("click", () => {
    const privacyBtn = document.querySelector('.setup-nav-button[data-section="privacy"]');
    if (privacyBtn) privacyBtn.click();
  });

  resetTopsitesBlacklistBtn.addEventListener("click", async () => {
    const nextSettings = { ...currentSettings, topSitesBlacklist: [] };
    currentSettings = nextSettings;
    await setStoredValue(api, STORAGE_KEYS.settings, nextSettings);
    resetTopsitesBlacklistBtn.style.display = "none";
    status.textContent = t(api, "saveSuccess");
    status.classList.add("visible");
    setTimeout(() => {
      status.classList.remove("visible");
    }, 3000);
  });
}

if (downloadStatsBtn) {
  downloadStatsBtn.addEventListener("click", async () => {
    const data = await api.storage.local.get(STORAGE_KEYS.clickStats);
    const clickStats = data[STORAGE_KEYS.clickStats] || [];
    const blob = new Blob([JSON.stringify(clickStats, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "martabs_click_stats.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
}
