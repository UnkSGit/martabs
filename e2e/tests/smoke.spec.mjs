import { test, expect } from '../fixtures/extension.fixture.mjs';
import { createTestFolder, createTestBookmark, clearTestBookmarks } from '../helpers/bookmarks.helper.mjs';

test.describe('Smoke Test - Infraestructura', () => {

  test.beforeEach(async ({ browserName }) => {
    if (browserName === 'firefox') test.skip(true, 'Firefox no soportado por inestabilidad de runner MV3');
  });
  
  test('La extensión carga y la página de setup es accesible', async ({ page, extensionId, extensionProtocol }) => {
    // 1. Navegar a la página de setup de la extensión
    const setupUrl = `${extensionProtocol}${extensionId}/setup/setup.html`;
    await page.goto(setupUrl);

    // 2. Verificar que la página carga
    await expect(page).toHaveTitle(/Configurar martabs/);
    
    // 3. Crear carpeta y marcador de prueba usando el helper (inyecta via chrome.bookmarks)
    const testFolder = await createTestFolder(page, 'E2E Test Folder');
    expect(testFolder).toBeDefined();
    expect(testFolder.id).toBeDefined();

    const testBookmark = await createTestBookmark(page, 'E2E Google', 'https://google.com', testFolder.id);
    expect(testBookmark).toBeDefined();

    // 4. Limpiar los marcadores de prueba
    await clearTestBookmarks(page, testFolder.id);
  });

});
