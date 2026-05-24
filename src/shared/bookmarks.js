import { generateAutomaticTags } from "./tags.js";

function isFolder(node) {
  return Boolean(node.children);
}

function isBookmark(node) {
  return Boolean(node.url);
}

function getDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function walkFolders(nodes, path = [], output = []) {
  for (const node of nodes) {
    const nextPath = node.title ? [...path, node.title] : path;
    if (isFolder(node) && node.title) {
      output.push({
        id: node.id,
        title: node.title,
        path: nextPath.join(" / ")
      });
    }
    if (node.children) {
      walkFolders(node.children, nextPath, output);
    }
  }
  return output;
}

function walkBookmarks(nodes, selectedFolderIds, path = [], insideSelected = false, output = []) {
  for (const node of nodes) {
    const nextPath = node.title && isFolder(node) ? [...path, node.title] : path;
    const selected = insideSelected || selectedFolderIds.includes(node.id);

    if (isBookmark(node) && selected) {
      const bookmark = {
        id: node.id,
        parentId: node.parentId || "",
        title: node.title || node.url,
        url: node.url,
        domain: getDomain(node.url),
        dateAdded: node.dateAdded || null,
        folderPath: path.join(" / "),
        automaticTags: [],
        manualTags: [],
        preview: null,
        linkHealth: null
      };
      bookmark.automaticTags = generateAutomaticTags(bookmark);
      output.push(bookmark);
    }

    if (node.children) {
      walkBookmarks(node.children, selectedFolderIds, nextPath, selected, output);
    }
  }
  return output;
}

export function getFolderOptions(bookmarkTree) {
  return walkFolders(bookmarkTree);
}

export function buildBookmarkIndex(bookmarkTree, selectedFolderIds) {
  return walkBookmarks(bookmarkTree, selectedFolderIds);
}
