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

function walkBookmarks(nodes, selectedFolderIds, path = [], parentFolderId = null, output = []) {
  for (const node of nodes) {
    const nextPath = node.title && isFolder(node) ? [...path, node.title] : path;
    const isNodeFolder = isFolder(node);
    const selected = !isNodeFolder && selectedFolderIds.includes(parentFolderId);

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
      walkBookmarks(node.children, selectedFolderIds, nextPath, isNodeFolder ? node.id : parentFolderId, output);
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
