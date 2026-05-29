import { test, expect } from '../fixtures/extension.fixture.mjs';
import { SetupPage } from '../pages/setup.page.mjs';
import { Buffer } from 'buffer';

test.describe('HU: Fondo de pantalla personalizado (v0.9.7)', () => {
  test.beforeEach(async ({ page, extensionId, extensionProtocol, browserName }) => {
    if (browserName === 'firefox') test.skip(true, 'Firefox no soportado por inestabilidad de runner MV3');
    await page.goto(`${extensionProtocol}${extensionId}/setup/setup.html`);
  });

  test('W-01: Controles de fondo de pantalla están presentes y son accesibles', async ({ page }) => {
    // Navegar a la sección Fondo de pantalla
    await page.click('.setup-nav-button[data-section="wallpaper"]');

    // Verificar que los slots y sliders existan en el DOM
    await expect(page.locator('.wallpaper-slots-grid')).toBeVisible();
    await expect(page.locator('.wallpaper-slot[data-slot="1"]')).toBeVisible();
    await expect(page.locator('.wallpaper-slot[data-slot="2"]')).toBeVisible();
    await expect(page.locator('.wallpaper-slot[data-slot="3"]')).toBeVisible();

    // Sliders y checkbox de rotación
    await expect(page.locator('#wallpaper-rotate-checkbox')).toBeAttached();
    await expect(page.locator('#wallpaper-brightness-slider')).toBeAttached();
    await expect(page.locator('#wallpaper-folder-opacity-slider')).toBeAttached();
    await expect(page.locator('#wallpaper-header-opacity-slider')).toBeAttached();
  });

  test('W-02: Subir un fondo personalizado deshabilita el selector de tema y muestra la nota de advertencia', async ({ page }) => {
    // 1. Verificar estado inicial del selector de tema (Habilitado y sin nota)
    await page.click('.setup-nav-button[data-section="appearance"]');
    const themeSelect = page.locator('#theme-select');
    const helperNote = page.locator('#theme-select-helper-note');
    await expect(themeSelect).toBeEnabled();
    await expect(helperNote).not.toBeVisible();

    // 2. Ir a Fondo de pantalla y simular la subida de una imagen
    await page.click('.setup-nav-button[data-section="wallpaper"]');
    
    // Crear un buffer de imagen dummy (1x1 transparente)
    const dummyPng = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
      'base64'
    );
    
    // Subir archivo a través del input de archivo oculto
    const fileInput = page.locator('#wallpaper-file-input');
    await fileInput.setInputFiles({
      name: 'dummy.png',
      mimeType: 'image/png',
      buffer: dummyPng
    });

    // Esperar a que la imagen se procese y se muestre en el slot
    const slotImg = page.locator('#wallpaper-slot-img-1');
    await expect(slotImg).toBeVisible();

    // 3. Verificar que el selector de tema se deshabilita y se muestra la advertencia
    await page.click('.setup-nav-button[data-section="appearance"]');
    await expect(themeSelect).toBeDisabled();
    await expect(helperNote).toBeVisible();

    // 4. Volver a fondo de pantalla y eliminar la imagen
    await page.click('.setup-nav-button[data-section="wallpaper"]');
    const removeBtn = page.locator('.wallpaper-slot-remove[data-slot="1"]');
    
    // Hacer click en el botón quitar
    await removeBtn.click();
    await expect(slotImg).not.toBeVisible();

    // 5. Verificar que el selector de tema se vuelve a habilitar y la advertencia se oculta
    await page.click('.setup-nav-button[data-section="appearance"]');
    await expect(themeSelect).toBeEnabled();
    await expect(helperNote).not.toBeVisible();
  });
});
