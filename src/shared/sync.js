export function generateExportData(settings, manualTags, pinnedBookmarks, bookmarkIndex, folderOptions) {
  const refs = {
    bookmarks: {},
    folders: {}
  };

  // Construir lookup rápido de marcadores por ID
  const bookmarkById = {};
  if (Array.isArray(bookmarkIndex)) {
    bookmarkIndex.forEach(b => { bookmarkById[b.id] = b; });
  } else if (bookmarkIndex && typeof bookmarkIndex === "object") {
    Object.values(bookmarkIndex).forEach(b => { if (b && b.id) bookmarkById[b.id] = b; });
  }

  // Construir lookup de carpetas por ID
  const folderById = {};
  (folderOptions || []).forEach(f => { folderById[f.id] = f.path; });
  
  // Extraer referencias de manualTags
  Object.keys(manualTags || {}).forEach(id => {
    if (bookmarkById[id]) refs.bookmarks[id] = bookmarkById[id].url;
  });
  
  // Extraer referencias de pinnedBookmarks
  (pinnedBookmarks || []).forEach(id => {
    if (bookmarkById[id]) refs.bookmarks[id] = bookmarkById[id].url;
  });

  // Extraer referencias de favicons personalizados
  Object.keys(settings.customFavicons || {}).forEach(id => {
    if (bookmarkById[id]) refs.bookmarks[id] = bookmarkById[id].url;
  });
  Object.keys(settings.brokenCustomFavicons || {}).forEach(id => {
    if (bookmarkById[id]) refs.bookmarks[id] = bookmarkById[id].url;
  });

  // Extraer referencias de carpetas seleccionadas
  (settings.selectedFolderIds || []).forEach(id => {
    if (folderById[id]) refs.folders[id] = folderById[id];
  });
  
  // Extraer referencias de modos, ordenamientos y nombres personalizados
  ["folderModes", "folderSorts", "folderNameOverrides"].forEach(key => {
    Object.keys(settings[key] || {}).forEach(id => {
      if (folderById[id]) refs.folders[id] = folderById[id];
    });
  });

  // The folder-to-tab map is keyed by browser folder IDs as well.
  Object.keys(settings.folderTabs || {}).forEach(id => {
    if (folderById[id]) refs.folders[id] = folderById[id];
  });

  // Extraer referencias de reordenamientos manuales (carpetas y sus marcadores)
  Object.keys(settings.folderBookmarkOrders || {}).forEach(id => {
    if (folderById[id]) refs.folders[id] = folderById[id];
    (settings.folderBookmarkOrders[id] || []).forEach(bId => {
      if (bookmarkById[bId]) refs.bookmarks[bId] = bookmarkById[bId].url;
    });
  });

  // Extraer referencias de overrides (drag and drop local)
  Object.keys(settings.bookmarkFolderOverrides || {}).forEach(bId => {
    if (bookmarkById[bId]) refs.bookmarks[bId] = bookmarkById[bId].url;
    const fId = settings.bookmarkFolderOverrides[bId];
    if (folderById[fId]) refs.folders[fId] = folderById[fId];
  });

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    settings,
    manualTags,
    pinnedBookmarks,
    refs
  };
}

export function parseAndRemapImport(jsonData, bookmarkIndex, folderOptions) {
  if (!jsonData || typeof jsonData !== "object") {
    const err = new Error("INVALID_FORMAT: El archivo de configuracion no tiene un formato valido.");
    err.code = "INVALID_FORMAT";
    throw err;
  }
  if (jsonData.version !== 1) {
    const err = new Error("INVALID_VERSION: Version de archivo JSON no soportada o invalida.");
    err.code = "INVALID_VERSION";
    throw err;
  }

  // Diccionarios inversos de la sesión actual
  const currentUrlToId = {};
  const currentPathToId = {};

  // Construir lookup de marcadores por URL
  if (Array.isArray(bookmarkIndex)) {
    bookmarkIndex.forEach(item => {
      if (item.url) currentUrlToId[item.url] = item.id;
    });
  } else if (bookmarkIndex && typeof bookmarkIndex === "object") {
    Object.values(bookmarkIndex).forEach(item => {
      if (item && item.url) currentUrlToId[item.url] = item.id;
    });
  }

  // Construir lookup de carpetas por path
  (folderOptions || []).forEach(f => {
    if (f.path) currentPathToId[f.path] = f.id;
  });

  // Mapas de traducción de ID viejo -> ID nuevo
  const oldToNewBookmarks = {};
  const oldToNewFolders = {};
  const oldRefs = jsonData.refs || { bookmarks: {}, folders: {} };
  
  Object.entries(oldRefs.bookmarks || {}).forEach(([oldId, url]) => {
    if (currentUrlToId[url]) oldToNewBookmarks[oldId] = currentUrlToId[url];
  });
  
  Object.entries(oldRefs.folders || {}).forEach(([oldId, path]) => {
    if (currentPathToId[path]) oldToNewFolders[oldId] = currentPathToId[path];
  });

  const stats = {
    mappedFolders: 0,
    mappedTags: 0,
    mappedPinned: 0,
    unmappedItems: 0
  };

  const oldSettings = jsonData.settings || {};
  const newSettings = {};
  
  // Keep this schema explicit: imported settings are untrusted JSON.
  const booleanSettings = [
    "automaticTagsEnabled", "manualTagsEnabled", "showPinnedFolder", 
    "linkHealthEnabled", "previewEnabled", "previewCaptureEnabled", "setupComplete",
    "showTopSitesFolder", "localStatsEnabled", "cleanFolderNames", "enablePinnedShortcuts",
    "customWallpaperEnabled", "customWallpaperRotate", "hideAllTab", "showViewButton", "showSortButton"
  ];
  const stringSettings = ["theme", "language", "defaultFolderMode", "defaultFolderSort", "activeTabId", "customWallpaperType", "customWallpaperTheme"];
  const numberSettings = [
    "topSitesLimit", "customWallpaperActiveSlot", "customWallpaperBrightness",
    "customWallpaperFolderOpacity", "customWallpaperHeaderOpacity", "customWallpaperLegibility"
  ];
  const arraySettings = ["selectedFolderIds", "topSitesBlacklist", "pinnedShortcutModifier", "customWallpaperSlots"];
  
  booleanSettings.forEach(key => {
    if (typeof oldSettings[key] === "boolean") newSettings[key] = oldSettings[key];
  });
  stringSettings.forEach(key => {
    if (typeof oldSettings[key] === "string") newSettings[key] = oldSettings[key];
  });
  numberSettings.forEach(key => {
    if (typeof oldSettings[key] === "number" && Number.isFinite(oldSettings[key])) newSettings[key] = oldSettings[key];
  });
  arraySettings.forEach(key => {
    if (!Array.isArray(oldSettings[key])) return;
    const valid = key === "customWallpaperSlots"
      ? oldSettings[key].every(item => Number.isInteger(item))
      : oldSettings[key].every(item => typeof item === "string");
    if (valid) newSettings[key] = oldSettings[key].slice();
  });

  const isPlainObject = value => value && typeof value === "object" && !Array.isArray(value);
  const copyPlainObject = (value, validate = () => true) => {
    if (!isPlainObject(value)) return undefined;
    const result = {};
    Object.entries(value).forEach(([key, item]) => {
      if (validate(key, item)) result[key] = item;
    });
    return result;
  };

  // These maps contain local IDs and are remapped below where applicable.
  if (isPlainObject(oldSettings.folderTabs)) {
    newSettings.folderTabs = {};
    Object.entries(oldSettings.folderTabs).forEach(([oldId, tabId]) => {
      const newId = oldToNewFolders[oldId];
      if (newId && typeof tabId === "string") newSettings.folderTabs[newId] = tabId;
    });
  }

  if (Array.isArray(oldSettings.tabs)) {
    newSettings.tabs = oldSettings.tabs.filter(tab => isPlainObject(tab) && typeof tab.id === "string" && typeof tab.name === "string")
      .map(tab => ({ id: tab.id, name: tab.name }));
  }

  if (isPlainObject(oldSettings.customWallpaperThemes)) {
    newSettings.customWallpaperThemes = copyPlainObject(oldSettings.customWallpaperThemes, (key, value) => /^\d+$/.test(key) && typeof value === "string");
  }
  if (isPlainObject(oldSettings.customWallpaperGradientConfig)) {
    const gradient = oldSettings.customWallpaperGradientConfig;
    const allowedGradient = ["type", "colorA", "colorB", "angle", "presetId", "animated"];
    newSettings.customWallpaperGradientConfig = {};
    allowedGradient.forEach(key => {
      const value = gradient[key];
      if ((key === "animated" && typeof value === "boolean") ||
          (key === "angle" && typeof value === "number" && Number.isFinite(value)) ||
          (["type", "colorA", "colorB", "presetId"].includes(key) && typeof value === "string")) {
        newSettings.customWallpaperGradientConfig[key] = value;
      }
    });
  }

  if (isPlainObject(oldSettings.widgets)) {
    const widgets = oldSettings.widgets;
    const safeWidgets = {};
    ["enabled", "collapsed"].forEach(key => { if (typeof widgets[key] === "boolean") safeWidgets[key] = widgets[key]; });
    if (typeof widgets.style === "string") safeWidgets.style = widgets.style;
    if (Array.isArray(widgets.layout)) safeWidgets.layout = widgets.layout.filter(item => typeof item === "string");
    if (Array.isArray(widgets.order)) safeWidgets.order = widgets.order.filter(item => typeof item === "string");
    ["clock", "notes", "checklist", "weather", "sports"].forEach(name => {
      if (!isPlainObject(widgets[name])) return;
      const source = widgets[name];
      const target = {};
      const fields = {
        clock: ["enabled", "format"], notes: ["enabled"], checklist: ["enabled"],
        weather: ["enabled", "locationLabel", "locationQuery", "latitude", "longitude", "countryCode", "timezone", "verifiedAt", "units"],
        sports: ["enabled", "mode", "league"]
      }[name];
      const booleanFields = new Set(["enabled"]);
      const numericFields = new Set(name === "weather" ? ["latitude", "longitude", "verifiedAt"] : []);
      const stringFields = new Set(fields.filter(key => !booleanFields.has(key) && !numericFields.has(key)));
      fields.forEach(key => {
        const value = source[key];
        if ((booleanFields.has(key) && typeof value === "boolean") ||
            (numericFields.has(key) && ((typeof value === "number" && Number.isFinite(value)) || value === null)) ||
            (stringFields.has(key) && typeof value === "string")) target[key] = value;
      });
      if (name === "sports" && Array.isArray(source.favorites)) {
        target.favorites = source.favorites.filter(item => typeof item === "string" || isPlainObject(item)).map(item => {
          if (typeof item === "string") return item;
          const favorite = {};
          ["sport", "league", "leagueLabel", "teamId", "teamName", "teamAbbreviation", "verifiedQuery", "verifiedAt"].forEach(key => {
            if (typeof item[key] === "string" || typeof item[key] === "number") favorite[key] = item[key];
          });
          return favorite;
        });
      }
      safeWidgets[name] = target;
    });
    newSettings.widgets = safeWidgets;
  }
  
  if (oldSettings.customFavicons && typeof oldSettings.customFavicons === "object" && !Array.isArray(oldSettings.customFavicons)) {
    newSettings.customFavicons = {};
    Object.entries(oldSettings.customFavicons).forEach(([oldBId, faviconUrl]) => {
      const newBId = oldToNewBookmarks[oldBId];
      if (newBId && typeof faviconUrl === "string") {
        newSettings.customFavicons[newBId] = faviconUrl;
      } else {
        stats.unmappedItems++;
      }
    });
  }
  if (isPlainObject(oldSettings.brokenCustomFavicons)) {
    newSettings.brokenCustomFavicons = {};
    Object.entries(oldSettings.brokenCustomFavicons).forEach(([oldBId, broken]) => {
      const newBId = oldToNewBookmarks[oldBId];
      if (newBId && typeof broken === "boolean") newSettings.brokenCustomFavicons[newBId] = broken;
    });
  }
  
  // Remapear carpetas seleccionadas
  if (Array.isArray(oldSettings.selectedFolderIds)) {
    newSettings.selectedFolderIds = [];
    oldSettings.selectedFolderIds.forEach(oldId => {
      const newId = oldToNewFolders[oldId];
      if (newId) { newSettings.selectedFolderIds.push(newId); stats.mappedFolders++; }
      else stats.unmappedItems++;
    });
  }

  const mapFolderObject = (oldObj, validate = value => typeof value === "string") => {
    const newObj = {};
    if (!oldObj || typeof oldObj !== "object" || Array.isArray(oldObj)) return newObj;
    Object.entries(oldObj).forEach(([oldId, val]) => {
      const newId = oldToNewFolders[oldId];
      if (newId && validate(val)) newObj[newId] = val;
    });
    return newObj;
  };

  if (Object.prototype.hasOwnProperty.call(oldSettings, "folderModes")) newSettings.folderModes = mapFolderObject(oldSettings.folderModes, value => ["list", "compact", "icons", "icons-large", "quicklinks"].includes(value));
  if (Object.prototype.hasOwnProperty.call(oldSettings, "folderSorts")) newSettings.folderSorts = mapFolderObject(oldSettings.folderSorts, value => ["browser", "date-newest", "domain-asc", "health-broken-first", "manual", "title-asc"].includes(value));
  if (Object.prototype.hasOwnProperty.call(oldSettings, "folderNameOverrides")) newSettings.folderNameOverrides = mapFolderObject(oldSettings.folderNameOverrides);

  if (Object.prototype.hasOwnProperty.call(oldSettings, "folderBookmarkOrders") && oldSettings.folderBookmarkOrders && typeof oldSettings.folderBookmarkOrders === "object") {
    newSettings.folderBookmarkOrders = {};
    Object.entries(oldSettings.folderBookmarkOrders).forEach(([oldFId, arr]) => {
      const newFId = oldToNewFolders[oldFId];
      if (newFId && Array.isArray(arr)) {
        const newArr = [];
        arr.forEach(oldBId => {
          const newBId = oldToNewBookmarks[oldBId];
          if (newBId) newArr.push(newBId);
        });
        newSettings.folderBookmarkOrders[newFId] = newArr;
      }
    });
  }

  if (Object.prototype.hasOwnProperty.call(oldSettings, "bookmarkFolderOverrides") && oldSettings.bookmarkFolderOverrides && typeof oldSettings.bookmarkFolderOverrides === "object") {
    newSettings.bookmarkFolderOverrides = {};
    Object.entries(oldSettings.bookmarkFolderOverrides).forEach(([oldBId, oldFId]) => {
      const newBId = oldToNewBookmarks[oldBId];
      const newFId = oldToNewFolders[oldFId];
      if (newBId && newFId) {
        newSettings.bookmarkFolderOverrides[newBId] = newFId;
      }
    });
  }

  // Remapear tags manuales
  const newManualTags = {};
  if (jsonData.manualTags && typeof jsonData.manualTags === "object" && !Array.isArray(jsonData.manualTags)) {
    Object.entries(jsonData.manualTags).forEach(([oldBId, tags]) => {
      const newBId = oldToNewBookmarks[oldBId];
      if (newBId && Array.isArray(tags)) {
        if (!tags.every(tag => typeof tag === "string")) {
          stats.unmappedItems++;
          return;
        }
        newManualTags[newBId] = tags;
        stats.mappedTags++;
      } else {
        stats.unmappedItems++;
      }
    });
  }

  // Remapear marcadores fijados
  const newPinned = [];
  if (Array.isArray(jsonData.pinnedBookmarks)) {
    jsonData.pinnedBookmarks.forEach(oldBId => {
      const newBId = oldToNewBookmarks[oldBId];
      if (newBId) {
        newPinned.push(newBId);
        stats.mappedPinned++;
      } else {
        stats.unmappedItems++;
      }
    });
  }

  return {
    settings: newSettings,
    manualTags: newManualTags,
    pinnedBookmarks: newPinned,
    stats
  };
}

// Apply a validated import without dropping settings introduced by a newer version.
export function mergeImportedSettings(currentSettings, importedSettings) {
  const isObject = value => value && typeof value === "object" && !Array.isArray(value);
  const replaceObjectKeys = new Set([
    "folderModes", "folderSorts", "folderNameOverrides", "folderBookmarkOrders",
    "bookmarkFolderOverrides", "folderTabs", "customFavicons", "brokenCustomFavicons",
    "customWallpaperThemes"
  ]);
  const merge = (current, imported) => {
    if (!isObject(current) || !isObject(imported)) return imported === undefined ? current : imported;
    const result = { ...current };
    Object.entries(imported).forEach(([key, value]) => {
      result[key] = isObject(value) && isObject(current[key]) && !replaceObjectKeys.has(key)
        ? merge(current[key], value) : value;
    });
    return result;
  };
  return merge(currentSettings || {}, importedSettings || {});
}
