import { test, expect } from '../fixtures/extension.fixture.mjs';
import { SetupPage } from '../pages/setup.page.mjs';
import { NewTabPage } from '../pages/newtab.page.mjs';
import { createTestFolder, createTestBookmark, clearTestBookmarks } from '../helpers/bookmarks.helper.mjs';

test.describe('HU-3: Búsqueda', () => {
  let testFolder;

  test.beforeEach(async ({ page, extensionId, extensionProtocol, browserName }) => {
    if (browserName === 'firefox') test.skip(true, 'Firefox no soportado por inestabilidad de runner MV3');
    // Navegar a la extensión para tener acceso a la API chrome.*
    await page.goto(`${extensionProtocol}${extensionId}/setup/setup.html`);

    // Crear datos de prueba
    testFolder = await createTestFolder(page, 'E2E Search Folder');
    await createTestBookmark(page, 'E2E Playwright', 'https://playwright.dev', testFolder.id);
    await createTestBookmark(page, 'E2E Selenium', 'https://selenium.dev', testFolder.id);
    await createTestBookmark(page, 'E2E Cypress', 'https://cypress.io', testFolder.id);

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

  test('B-01: Escribir texto filtra marcadores en tiempo real', async ({ page, extensionId, extensionProtocol }) => {
    const newTabPage = new NewTabPage(page, `${extensionProtocol}${extensionId}`);
    await newTabPage.goto();

    await expect(newTabPage.getBookmarks()).toHaveCount(3);
    
    await newTabPage.search('Playwright');
    
    await expect(newTabPage.getBookmarks()).toHaveCount(1);
    await expect(newTabPage.getVisibleBookmarkTitles().first()).toHaveText('E2E Playwright');
  });

  test('B-02: Limpiar la búsqueda restaura el tablero original', async ({ page, extensionId, extensionProtocol }) => {
    const newTabPage = new NewTabPage(page, `${extensionProtocol}${extensionId}`);
    await newTabPage.goto();

    await expect(newTabPage.getBookmarks()).toHaveCount(3);
    
    await newTabPage.search('Selenium');
    await expect(newTabPage.getBookmarks()).toHaveCount(1);
    
    await newTabPage.clearSearch();
    await expect(newTabPage.getBookmarks()).toHaveCount(3);
    await expect(newTabPage.searchInput).toHaveValue('');
  });
});
