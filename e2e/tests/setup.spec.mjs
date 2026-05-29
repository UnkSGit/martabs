import { test, expect } from '../fixtures/extension.fixture.mjs';
import { SetupPage } from '../pages/setup.page.mjs';
import { createTestFolder, createTestBookmark, clearTestBookmarks } from '../helpers/bookmarks.helper.mjs';

test.describe('HU-1: Primer uso (Setup)', () => {
  let testFolder;

  test.beforeEach(async ({ page, extensionId, extensionProtocol, browserName }) => {
    if (browserName === 'firefox') test.skip(true, 'Firefox no soportado por inestabilidad de runner MV3');
    // Navegar a la extensión para tener acceso a la API chrome.*
    await page.goto(`${extensionProtocol}${extensionId}/setup/setup.html`);

    // Crear datos de prueba limpios
    testFolder = await createTestFolder(page, 'E2E Setup Folder');
    await createTestBookmark(page, 'E2E Google', 'https://google.com', testFolder.id);
  });

  test.afterEach(async ({ page, browserName }) => {
    if (browserName === 'firefox') return;
    if (testFolder && testFolder.id) {
      await clearTestBookmarks(page, testFolder.id);
    }
  });

  test('S-01: La página de setup carga con secciones y nav lateral', async ({ page, extensionId, extensionProtocol }) => {
    const setupPage = new SetupPage(page, `${extensionProtocol}${extensionId}`);
    await setupPage.goto();

    await expect(page.locator('nav button')).toHaveCount(7); // Carpetas, Apariencia, Privacidad, Estadísticas, Etiquetas, Accesibilidad, Avanzado
    await expect(page.locator('#section-folders')).toBeVisible();
  });

  test('S-02: Las carpetas del navegador se listan con checkboxes', async ({ page, extensionId, extensionProtocol }) => {
    const setupPage = new SetupPage(page, `${extensionProtocol}${extensionId}`);
    await setupPage.goto();

    // Verificamos que la carpeta de prueba creada aparece
    const checkbox = setupPage.getFolderCheckbox(testFolder.id);
    await expect(checkbox).toBeVisible();
  });

  test('S-03: Seleccionar carpetas y guardar persiste la configuración', async ({ page, extensionId, extensionProtocol }) => {
    const setupPage = new SetupPage(page, `${extensionProtocol}${extensionId}`);
    await setupPage.goto();

    await setupPage.selectFolder(testFolder.id);
    await setupPage.save();

    await expect(setupPage.statusText).toHaveText('Configuración guardada.');
  });

  test('S-04: "Marcar/desmarcar todas" alterna todos los checkboxes', async ({ page, extensionId, extensionProtocol }) => {
    const setupPage = new SetupPage(page, `${extensionProtocol}${extensionId}`);
    await setupPage.goto();

    await setupPage.toggleAllFolders();
    const checkbox = setupPage.getFolderCheckbox(testFolder.id);
    // Asumiendo que por defecto están desmarcadas (si es instalación nueva)
    await expect(checkbox).toBeChecked();
    
    await setupPage.toggleAllFolders();
    await expect(checkbox).not.toBeChecked();
  });

  test('S-05: Screenshot de la pantalla de setup completa', async ({ page, extensionId, extensionProtocol }) => {
    test.skip(!!process.env.CI, 'Snapshots are OS-specific, skipping in CI');
    const setupPage = new SetupPage(page, `${extensionProtocol}${extensionId}`);
    await setupPage.goto();
    
    // Wait for folders to load
    await expect(setupPage.getFolderCheckbox(testFolder.id)).toBeVisible();

    await expect(page).toHaveScreenshot('setup-page.png', { maxDiffPixelRatio: 0.02 });
  });

  test('S-06: El botón de guardar está deshabilitado sin cambios y se habilita al modificar', async ({ page, extensionId, extensionProtocol }) => {
    const setupPage = new SetupPage(page, `${extensionProtocol}${extensionId}`);
    await setupPage.goto();

    const saveButton = page.locator('#save');
    await expect(saveButton).toBeDisabled();

    // Modificar un checkbox para habilitar
    await setupPage.toggleAllFolders();
    await expect(saveButton).toBeEnabled();

    // Guardar para que se vuelva a deshabilitar
    await setupPage.save();
    await expect(saveButton).toBeDisabled();
  });
});
