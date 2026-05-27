import { test, expect } from '../fixtures/extension.fixture.mjs';
import { SetupPage } from '../pages/setup.page.mjs';
import { NewTabPage } from '../pages/newtab.page.mjs';
import { createTestFolder, createTestBookmark, clearTestBookmarks } from '../helpers/bookmarks.helper.mjs';

test.describe('HU: Drag and Drop marcadores', () => {
  let testFolder;

  test.beforeEach(async ({ page, extensionId, extensionProtocol, browserName }) => {
    if (browserName === 'firefox') test.skip(true, 'Firefox no soportado por inestabilidad de runner MV3');
    await page.goto(`${extensionProtocol}${extensionId}/setup/setup.html`);

    testFolder = await createTestFolder(page, 'E2E Drag Drop Folder');
    await createTestBookmark(page, 'Bookmark 1', 'https://example.com/1', testFolder.id);
    await createTestBookmark(page, 'Bookmark 2', 'https://example.com/2', testFolder.id);

    const setupPage = new SetupPage(page, `${extensionProtocol}${extensionId}`);
    await setupPage.goto();
    await expect(setupPage.getFolderCheckbox(testFolder.id)).toBeVisible();
    await setupPage.selectFolder(testFolder.id);
    await setupPage.save();
  });

  test.afterEach(async ({ page, browserName }) => {
    if (browserName === 'firefox') return;
    if (testFolder && testFolder.id) {
      await clearTestBookmarks(page, testFolder.id);
    }
  });

  test('T-01: Se pueden reordenar los marcadores arrastrándolos', async ({ page, extensionId, extensionProtocol }) => {
    const newTabPage = new NewTabPage(page, `${extensionProtocol}${extensionId}`);
    await newTabPage.goto();

    const bookmarks = page.locator('.bookmark');
    await expect(bookmarks).toHaveCount(2);

    await expect(bookmarks.nth(0)).toContainText('Bookmark 1');
    await expect(bookmarks.nth(1)).toContainText('Bookmark 2');

    await page.evaluate(() => {
      const marks = document.querySelectorAll('.bookmark');
      const source = marks[1];
      const target = marks[0];
      const dataTransfer = new DataTransfer();
      
      const dragStart = new DragEvent('dragstart', { dataTransfer, bubbles: true });
      source.dispatchEvent(dragStart);
      
      // En Playwright el DataTransfer sintético puede no retener datos entre eventos,
      // los seteamos explícitamente para asegurar que el evento 'drop' los reciba.
      dataTransfer.setData('application/x-martabs-id', source.dataset.bookmarkId);
      dataTransfer.setData('application/x-martabs-folder', target.closest('.group').dataset.folderId);
      
      const rect = target.getBoundingClientRect();
      const clientY = rect.top + (rect.height / 4); // Place before
      
      const dragOver = new DragEvent('dragover', { dataTransfer, bubbles: true, clientY });
      target.dispatchEvent(dragOver);
      
      const drop = new DragEvent('drop', { dataTransfer, bubbles: true, clientY });
      target.dispatchEvent(drop);
    });
    await expect(bookmarks.nth(0)).toContainText('Bookmark 2');
    await expect(bookmarks.nth(1)).toContainText('Bookmark 1');

    // Recargar la página para verificar que el cambio persistió
    await page.reload();
    await expect(bookmarks.nth(0)).toContainText('Bookmark 2');
    await expect(bookmarks.nth(1)).toContainText('Bookmark 1');
  });
});
