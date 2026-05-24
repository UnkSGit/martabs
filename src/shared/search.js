function normalize(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function searchableText(bookmark) {
  return normalize([
    bookmark.title,
    bookmark.url,
    bookmark.domain,
    bookmark.folderPath,
    ...(bookmark.automaticTags || []),
    ...(bookmark.manualTags || [])
  ].join(" "));
}

function scoreBookmark(bookmark, terms) {
  const title = normalize(bookmark.title);
  const text = searchableText(bookmark);
  let score = 0;

  for (const term of terms) {
    if (!text.includes(term)) {
      return 0;
    }
    score += title.includes(term) ? 3 : 1;
  }

  return score;
}

export function searchBookmarks(bookmarks, query) {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  if (terms.length === 0) {
    return bookmarks;
  }

  return bookmarks
    .map((bookmark) => ({ bookmark, score: scoreBookmark(bookmark, terms) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.bookmark.title.localeCompare(b.bookmark.title))
    .map((item) => item.bookmark);
}
