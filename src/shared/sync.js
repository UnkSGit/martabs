export function generateExportData(settings, manualTags, pinnedBookmarks, bookmarkIndex) {
  const refs = {
    bookmarks: {},
    folders: {}
  };
  
  // Extraer referencias de manualTags
  Object.keys(manualTags || {}).forEach(id => {
    if (bookmarkIndex[id]) refs.bookmarks[id] = bookmarkIndex[id].url;
  });
  
  // Extraer referencias de pinnedBookmarks
  (pinnedBookmarks || []).forEach(id => {
    if (bookmarkIndex[id]) refs.bookmarks[id] = bookmarkIndex[id].url;
  });

  // Extraer referencias de carpetas seleccionadas
  (settings.selectedFolderIds || []).forEach(id => {
    if (bookmarkIndex[id]) refs.folders[id] = bookmarkIndex[id].folderPath || bookmarkIndex[id].title || "";
  });
  
  // Extraer referencias de modos, ordenamientos y nombres personalizados
  ["folderModes", "folderSorts", "folderNameOverrides"].forEach(key => {
    Object.keys(settings[key] || {}).forEach(id => {
      if (bookmarkIndex[id]) refs.folders[id] = bookmarkIndex[id].folderPath || bookmarkIndex[id].title || "";
    });
  });

  // Extraer referencias de reordenamientos manuales (carpetas y sus marcadores)
  Object.keys(settings.folderBookmarkOrders || {}).forEach(id => {
    if (bookmarkIndex[id]) refs.folders[id] = bookmarkIndex[id].folderPath || bookmarkIndex[id].title || "";
    (settings.folderBookmarkOrders[id] || []).forEach(bId => {
      if (bookmarkIndex[bId]) refs.bookmarks[bId] = bookmarkIndex[bId].url;
    });
  });

  // Extraer referencias de overrides (drag and drop local)
  Object.keys(settings.bookmarkFolderOverrides || {}).forEach(bId => {
    if (bookmarkIndex[bId]) refs.bookmarks[bId] = bookmarkIndex[bId].url;
    const fId = settings.bookmarkFolderOverrides[bId];
    if (bookmarkIndex[fId]) refs.folders[fId] = bookmarkIndex[fId].folderPath || bookmarkIndex[fId].title || "";
  });

  return {
    version: 1,
    settings,
    manualTags,
    pinnedBookmarks,
    refs
  };
}

export function parseAndRemapImport(jsonData, currentBookmarkIndex) {
  if (jsonData.version !== 1) {
    throw new Error("Versión de archivo JSON no soportada o inválida.");
  }

  // Diccionarios inversos de la sesión actual
  const currentUrlToId = {};
  const currentPathToId = {};
  
  Object.values(currentBookmarkIndex).forEach(item => {
    if (item.url) {
      currentUrlToId[item.url] = item.id;
    } else {
      const path = item.folderPath || item.title || "";
      if (path) currentPathToId[path] = item.id;
    }
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
  
  // Permitir solo propiedades conocidas y de tipo seguro
  const booleanSettings = [
    "automaticTagsEnabled", "manualTagsEnabled", "showPinnedFolder", 
    "linkHealthEnabled", "previewEnabled", "previewCaptureEnabled", "setupComplete"
  ];
  const stringSettings = ["theme", "defaultFolderMode", "defaultFolderSort"];
  
  booleanSettings.forEach(key => {
    if (typeof oldSettings[key] === "boolean") newSettings[key] = oldSettings[key];
  });
  stringSettings.forEach(key => {
    if (typeof oldSettings[key] === "string") newSettings[key] = oldSettings[key];
  });
  
  if (typeof oldSettings.customFavicons === "object" && !Array.isArray(oldSettings.customFavicons)) {
    newSettings.customFavicons = oldSettings.customFavicons; // Los favicons se asocian por dominio, no por ID
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

  const mapFolderObject = (oldObj) => {
    const newObj = {};
    if (!oldObj || typeof oldObj !== "object" || Array.isArray(oldObj)) return newObj;
    Object.entries(oldObj).forEach(([oldId, val]) => {
      const newId = oldToNewFolders[oldId];
      if (newId) newObj[newId] = val;
    });
    return newObj;
  };

  newSettings.folderModes = mapFolderObject(oldSettings.folderModes);
  newSettings.folderSorts = mapFolderObject(oldSettings.folderSorts);
  newSettings.folderNameOverrides = mapFolderObject(oldSettings.folderNameOverrides);

  newSettings.folderBookmarkOrders = {};
  if (oldSettings.folderBookmarkOrders && typeof oldSettings.folderBookmarkOrders === "object") {
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

  newSettings.bookmarkFolderOverrides = {};
  if (oldSettings.bookmarkFolderOverrides && typeof oldSettings.bookmarkFolderOverrides === "object") {
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
