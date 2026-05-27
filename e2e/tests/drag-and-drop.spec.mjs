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
    
    // Configurar la carpeta en modo manual para habilitar el Drag & Drop
    const sortSelect = page.locator(`.folder-sort-select[data-folder-id="${testFolder.id}"]`);
    await sortSelect.selectOption('manual');
    
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

    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
    
    await page.evaluate(() => {
      const marks = document.querySelectorAll('.bookmark');
      const source = marks[1];
      const target = marks[0];
      
      const rect = target.getBoundingClientRect();
      const clientY = rect.top + (rect.height / 4); // Place before
      
      const fakeDataTransfer = {
        getData: (format) => {
          if (format === 'application/x-martabs-id') return source.dataset.bookmarkId;
          if (format === 'application/x-martabs-folder') return target.closest('.group').dataset.folderId;
          return '';
        },
        setData: () => {},
        dropEffect: 'move',
        effectAllowed: 'move'
      };

      const dragStart = new DragEvent('dragstart', { bubbles: true });
      Object.defineProperty(dragStart, 'dataTransfer', { value: fakeDataTransfer });
      source.dispatchEvent(dragStart);
      
      const dragOver = new DragEvent('dragover', { bubbles: true, clientY });
      Object.defineProperty(dragOver, 'dataTransfer', { value: fakeDataTransfer });
      target.dispatchEvent(dragOver);
      
      const drop = new DragEvent('drop', { bubbles: true, clientY });
      Object.defineProperty(drop, 'dataTransfer', { value: fakeDataTransfer });
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
