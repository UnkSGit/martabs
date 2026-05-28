const fs = require('fs');
let content = fs.readFileSync('src/newtab/newtab.js', 'utf8');

// 1. Add topSites to state
content = content.replace(
  'let isDragging = false;',
  'let isDragging = false;\nlet topSites = [];'
);

// 2. Fetch topSites in init()
content = content.replace(
  'const pendingCaptures = data[STORAGE_KEYS.pendingPreviewCaptures] || {};',
  'const pendingCaptures = data[STORAGE_KEYS.pendingPreviewCaptures] || {};\n  \n  if (currentSettings.showTopSitesFolder && api.topSites) {\n    try {\n      const sites = await api.topSites.get();\n      const blacklist = currentSettings.topSitesBlacklist || [];\n      topSites = sites\n        .filter(site => !blacklist.includes(site.url))\n        .slice(0, currentSettings.topSitesLimit || 8)\n        .map(site => ({\n          id: "topsite_" + site.url,\n          url: site.url,\n          title: site.title,\n          parentId: "__martabs_topsites__",\n          isTopSite: true\n        }));\n    } catch (e) { console.error("Failed to fetch top sites", e); }\n  }'
);

// 3. Add to folders in renderDashboard
content = content.replace(
  'folders.unshift([PINNED_FOLDER_KEY, pinnedItems]);\n  }',
  'folders.unshift([PINNED_FOLDER_KEY, pinnedItems]);\n  }\n  if (topSites.length > 0) {\n    folders.unshift(["__martabs_topsites__", topSites]);\n  }'
);

// 4. Handle folder properties in renderDashboard
content = content.replace(
  'const isPinnedFolder = folder === PINNED_FOLDER_KEY;\n    const folderId = isPinnedFolder ? "pinned" : items[0]?.parentId;\n    const folderSort = isPinnedFolder ? "browser" : getFolderSort(folderId);',
  'const isPinnedFolder = folder === PINNED_FOLDER_KEY;\n    const isTopSitesFolder = folder === "__martabs_topsites__";\n    const folderId = isPinnedFolder ? "pinned" : (isTopSitesFolder ? "__martabs_topsites__" : items[0]?.parentId);\n    const folderSort = (isPinnedFolder || isTopSitesFolder) ? "browser" : getFolderSort(folderId);'
);

content = content.replace(
  'const folderTitleText = isPinnedFolder\n      ? t(api, "pinnedFolderTitle")\n      : getFolderName(folder, folderId);',
  'const folderTitleText = isPinnedFolder\n      ? t(api, "pinnedFolderTitle")\n      : isTopSitesFolder\n      ? t(api, "frequentSites")\n      : getFolderName(folder, folderId);'
);

// 5. Update openBookmarkFromMartabs with clickStats
content = content.replace(
  'async function openBookmarkFromMartabs(bookmark) {',
  `async function openBookmarkFromMartabs(bookmark) {
  if (currentSettings.localStatsEnabled) {
    try {
      const data = await api.storage.local.get(STORAGE_KEYS.clickStats);
      let clickStats = data[STORAGE_KEYS.clickStats] || [];
      const ninetyDaysAgo = Date.now() - (90 * 24 * 60 * 60 * 1000);
      clickStats = clickStats.filter(stat => stat.openedAt > ninetyDaysAgo);
      clickStats.push({
        bookmarkId: bookmark.id,
        url: bookmark.url,
        title: bookmark.title,
        folderId: bookmark.parentId,
        openedAt: Date.now()
      });
      await api.storage.local.set({ [STORAGE_KEYS.clickStats]: clickStats });
    } catch (e) { console.error("Error saving click stats", e); }
  }`
);

// 6. Disable drag and pin/edit for topSites in renderBookmark
content = content.replace(
  'bookmarkElement.append(actionsContainer);',
  `
  if (bookmark.isTopSite) {
    bookmarkElement.draggable = false;
    const hideBtn = el("button", { class: "icon-button bookmark-action-btn", title: t(api, "hideSite"), "aria-label": t(api, "hideSite") }, svgDelete);
    hideBtn.addEventListener("click", async (event) => {
      event.preventDefault();
      event.stopPropagation();
      const blacklist = currentSettings.topSitesBlacklist || [];
      if (!blacklist.includes(bookmark.url)) {
        blacklist.push(bookmark.url);
        currentSettings.topSitesBlacklist = blacklist;
        await setStoredValue(api, STORAGE_KEYS.settings, currentSettings);
        topSites = topSites.filter(site => site.url !== bookmark.url);
        render();
      }
    });
    const topSiteActions = el("div", { class: "bookmark-actions" }, [hideBtn]);
    bookmarkElement.append(topSiteActions);
  } else {
    bookmarkElement.append(actionsContainer);
  }
  `
);

// 7. Prevent dropping into topSites folder
content = content.replace(
  'const isPinnedFolder = listElement.id === "bookmark-list-pinned";',
  'const isPinnedFolder = listElement.id === "bookmark-list-pinned";\n    const isTopSitesFolder = listElement.id === "bookmark-list-__martabs_topsites__";\n    if (isTopSitesFolder) return; // Cannot drop into topsites'
);

// 8. Add frequent tag in search
content = content.replace(
  'const tagsStr = autoTags.concat(manTags).join(" ");',
  'const tagsStr = autoTags.concat(manTags).join(" ") + (bookmark.isTopSite ? " " + (t(api, "frequentTag") || "frecuente").toLowerCase() : "");'
);

content = content.replace(
  'if (autoTags.length > 0 || manTags.length > 0) {',
  'if (autoTags.length > 0 || manTags.length > 0 || bookmark.isTopSite) {'
);

content = content.replace(
  'metaContainer.append(tagsWrapper);\n    }',
  'if (bookmark.isTopSite) {\n        const topSiteTag = el("span", { class: "bookmark-tag manual-tag" }, t(api, "frequentTag") || "Frecuente");\n        tagsWrapper.append(topSiteTag);\n      }\n      metaContainer.append(tagsWrapper);\n    }'
);

fs.writeFileSync('src/newtab/newtab.js', content, 'utf8');
console.log('newtab.js updated.');
