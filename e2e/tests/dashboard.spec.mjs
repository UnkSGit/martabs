import { test, expect } from '../fixtures/extension.fixture.mjs';
import { SetupPage } from '../pages/setup.page.mjs';
import { NewTabPage } from '../pages/newtab.page.mjs';
import { createTestFolder, createTestBookmark, clearTestBookmarks } from '../helpers/bookmarks.helper.mjs';

test.describe('HU-2: Tablero principal', () => {
  let testFolder;

  test.beforeEach(async ({ page, extensionId, extensionProtocol, browserName }) => {
    if (browserName === 'firefox') test.skip(true, 'Firefox no soportado por inestabilidad de runner MV3');
    // Navegar a la extensión para tener acceso a la API chrome.*
    await page.goto(`${extensionProtocol}${extensionId}/setup/setup.html`);

    // Crear datos de prueba
    testFolder = await createTestFolder(page, 'E2E Dashboard Folder');
    await createTestBookmark(page, 'E2E GitHub', 'https://github.com', testFolder.id);
    await createTestBookmark(page, 'E2E MDN', 'https://developer.mozilla.org', testFolder.id);

    // Configurar la extensión para mostrar la carpeta de prueba
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

  test('T-01: La nueva pestaña renderiza carpetas con marcadores', async ({ page, extensionId, extensionProtocol }) => {
    const newTabPage = new NewTabPage(page, `${extensionProtocol}${extensionId}`);
    await newTabPage.goto();

    const groups = newTabPage.getFolderGroups();
    await expect(groups).toHaveCount(1);
    
    const title = groups.first().locator('h2');
    await expect(title).toContainText('E2E Dashboard Folder');
    
    const bookmarks = newTabPage.getBookmarks();
    await expect(bookmarks).toHaveCount(2);
  });

  test('T-02: Cada marcador muestra título', async ({ page, extensionId, extensionProtocol }) => {
    const newTabPage = new NewTabPage(page, `${extensionProtocol}${extensionId}`);
    await newTabPage.goto();

    const titles = newTabPage.getVisibleBookmarkTitles();
    await expect(titles).toHaveCount(2);
    
    // Verify specific titles
    const textContents = await titles.allTextContents();
    expect(textContents).toContain('E2E GitHub');
    expect(textContents).toContain('E2E MDN');
  });

  test('T-03: Screenshot del tablero con marcadores cargados', async ({ page, extensionId, extensionProtocol }) => {
    const newTabPage = new NewTabPage(page, `${extensionProtocol}${extensionId}`);
    await newTabPage.goto();

    // Esperar a que se rendericen los marcadores
    await expect(newTabPage.getBookmarks()).toHaveCount(2);
    
    await expect(page).toHaveScreenshot('dashboard-page.png', { maxDiffPixelRatio: 0.02 });
  });
});
