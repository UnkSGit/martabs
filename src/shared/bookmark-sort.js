export const SORT_MODES = [
  "browser",
  "manual",
  "title-asc",
  "date-newest",
  "domain-asc",
  "health-broken-first"
];

function compareText(a, b) {
  return String(a || "").localeCompare(String(b || ""), "es", { sensitivity: "base" });
}

function compareMissingLast(aMissing, bMissing) {
  if (aMissing && bMissing) return 0;
  if (aMissing) return 1;
  if (bMissing) return -1;
  return null;
}

function compareByMode(a, b, sortMode, manualOrderIds = []) {
  if (sortMode === "manual") {
    const orderMap = new Map(manualOrderIds.map((id, index) => [id, index]));
    const aIndex = orderMap.has(a.id) ? orderMap.get(a.id) : Number.POSITIVE_INFINITY;
    const bIndex = orderMap.has(b.id) ? orderMap.get(b.id) : Number.POSITIVE_INFINITY;
    if (aIndex !== bIndex) return aIndex - bIndex;
  }

  if (sortMode === "title-asc") {
    return compareText(a.title, b.title);
  }

  if (sortMode === "date-newest") {
    const missing = compareMissingLast(!a.dateAdded, !b.dateAdded);
    if (missing !== null) return missing;
    return b.dateAdded - a.dateAdded;
  }

  if (sortMode === "domain-asc") {
    const missing = compareMissingLast(!a.domain, !b.domain);
    if (missing !== null) return missing;
    return compareText(a.domain, b.domain);
  }

  if (sortMode === "health-broken-first") {
    const aBroken = (a.linkHealth?.consecutiveFailures || 0) > 0;
    const bBroken = (b.linkHealth?.consecutiveFailures || 0) > 0;
    if (aBroken !== bBroken) return aBroken ? -1 : 1;
  }

  return 0;
}

export function sortBookmarks(bookmarks, sortMode = "browser", pinnedIds = [], manualOrderIds = []) {
  const pinnedSet = new Set(pinnedIds);
  const mode = SORT_MODES.includes(sortMode) ? sortMode : "browser";

  return bookmarks
    .map((bookmark, index) => ({ bookmark, index }))
    .sort((a, b) => {
      const aPinned = pinnedSet.has(a.bookmark.id);
      const bPinned = pinnedSet.has(b.bookmark.id);
      if (aPinned !== bPinned) return aPinned ? -1 : 1;

      const byMode = compareByMode(a.bookmark, b.bookmark, mode, manualOrderIds);
      if (byMode !== 0) return byMode;

      return a.index - b.index;
    })
    .map(({ bookmark }) => bookmark);
}
