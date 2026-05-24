const IGNORED_FOLDER_NAMES = new Set([
  "bookmarks bar",
  "other bookmarks",
  "mobile bookmarks",
  "barra de marcadores",
  "otros marcadores",
  "marcadores moviles"
]);

function normalizeTag(tag) {
  return String(tag || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export function generateAutomaticTags(bookmark) {
  const folderTags = String(bookmark.folderPath || "")
    .split("/")
    .map(normalizeTag)
    .filter(Boolean)
    .filter((tag) => !IGNORED_FOLDER_NAMES.has(tag));

  const domainTag = normalizeTag(bookmark.domain);
  return [...new Set([...folderTags, domainTag].filter(Boolean))];
}

export function mergeTags(automaticTags, manualTags) {
  return [...new Set([...automaticTags, ...manualTags].map(normalizeTag).filter(Boolean))];
}
