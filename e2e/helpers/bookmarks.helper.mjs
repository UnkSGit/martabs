/**
 * Helper para manipular marcadores usando la API de la extensión desde Playwright
 */

export async function createTestFolder(page, title, parentId = '1') {
  return await page.evaluate(async ({ title, parentId }) => {
    // Necesitamos ejecutar esto en el contexto de la extensión (ej. setup.html)
    return await new Promise((resolve) => {
      // @ts-ignore - chrome API is available in extension context
      chrome.bookmarks.create({ title, parentId }, (result) => {
        resolve(result);
      });
    });
  }, { title, parentId });
}

export async function createTestBookmark(page, title, url, parentId) {
  return await page.evaluate(async ({ title, url, parentId }) => {
    return await new Promise((resolve) => {
      // @ts-ignore
      chrome.bookmarks.create({ title, url, parentId }, (result) => {
        resolve(result);
      });
    });
  }, { title, url, parentId });
}

export async function clearTestBookmarks(page, folderId) {
  return await page.evaluate(async ({ folderId }) => {
    return await new Promise((resolve) => {
      // @ts-ignore
      chrome.bookmarks.removeTree(folderId, () => resolve(true));
    });
  }, { folderId });
}
