import fs from 'fs';
import path from 'path';
import os from 'os';
import { test, expect } from '../fixtures/extension.fixture.mjs';
import { SetupPage } from '../pages/setup.page.mjs';
import { createTestFolder, clearTestBookmarks } from '../helpers/bookmarks.helper.mjs';

test.describe('HU-Backup: Importar y Exportar Configuración', () => {
  let testFolder;
  let tmpFilePath;

  test.beforeEach(async ({ page, extensionId, extensionProtocol, browserName }) => {
    if (browserName === 'firefox') test.skip(true, 'Firefox no soportado por inestabilidad de runner MV3');
    
    // Navegar a la página de setup para tener contexto de extensión
    await page.goto(`${extensionProtocol}${extensionId}/setup/setup.html`);
    
    // Esperar que la página cargue completamente (folder-tree-container se puebla)
    await page.locator('#folder-tree-container').waitFor({ state: 'visible' });
    
    // Crear datos de prueba
    testFolder = await createTestFolder(page, 'E2E Backup Folder');
    
    // Recargar para que setup lea el árbol de marcadores actualizado
    await page.reload();
    await page.locator('#folder-tree-container').waitFor({ state: 'visible' });
  });

  test.afterEach(async ({ page }) => {
    if (testFolder && testFolder.id) {
      try {
        // Asegurar que estamos en la página de setup antes de limpiar
        const url = page.url();
        if (!url.includes('setup.html')) {
          // La página puede haber cambiado, no intentar limpiar
          return;
        }
        await clearTestBookmarks(page, testFolder.id);
      } catch {
        // Si falla la limpieza (ej: página cerrada), ignorar
      }
    }
    if (tmpFilePath && fs.existsSync(tmpFilePath)) {
      fs.unlinkSync(tmpFilePath);
    }
  });

  test('Exportar genera un JSON con la estructura correcta', async ({ page, extensionId, extensionProtocol }) => {
    const setupPage = new SetupPage(page, extensionProtocol + extensionId);
    
    // Estamos en la sección Carpetas por defecto - seleccionar la carpeta
    await setupPage.selectFolder(testFolder.id);
    await setupPage.save();
    await expect(setupPage.statusText).toContainText('Configuración guardada');

    // Navegar a la sección Avanzado para exportar
    await setupPage.navigateToSection('advanced');
    await setupPage.exportBtn.waitFor({ state: 'visible' });
    
    const download = await setupPage.exportarConfiguracion();
    expect(download.suggestedFilename()).toMatch(/martabs-config-.*\.json/);

    const downloadPath = await download.path();
    const content = fs.readFileSync(downloadPath, 'utf8');
    const json = JSON.parse(content);

    // Verificaciones de la estructura (E2E mínimo)
    expect(json.version).toBe(1);
    expect(json.exportedAt).toBeDefined();
    expect(json.settings).toBeDefined();
    expect(json.settings.selectedFolderIds).toContain(testFolder.id);
    expect(json.refs).toBeDefined();
    
    // Validar que no hay propiedades prohibidas
    expect(json.bookmarkIndex).toBeUndefined();
    expect(json.linkHealth).toBeUndefined();
    expect(json.capturedPreviews).toBeUndefined();
  });

  test('Importar archivo válido muestra resumen y aplica cambios', async ({ page, extensionId, extensionProtocol }) => {
    const setupPage = new SetupPage(page, extensionProtocol + extensionId);
    
    // 1. Seleccionar carpeta y guardar para que el export contenga refs válidos
    await setupPage.selectFolder(testFolder.id);
    await setupPage.save();
    await expect(setupPage.statusText).toContainText('Configuración guardada');
    
    // 2. Ir a Avanzado y exportar para obtener las refs correctas
    await setupPage.navigateToSection('advanced');
    await setupPage.exportBtn.waitFor({ state: 'visible' });
    const download = await setupPage.exportarConfiguracion();
    const jsonStr = fs.readFileSync(await download.path(), 'utf8');
    const exportedJson = JSON.parse(jsonStr);
    
    // 3. Volver a Carpetas para desmarcar
    await setupPage.navigateToSection('folders');
    await setupPage.selectFolder('1'); // Seleccionar una carpeta extra para poder guardar
    await setupPage.deselectFolder(testFolder.id);
    await setupPage.save();
    await expect(setupPage.statusText).toContainText('Configuración guardada');

    // 4. Crear JSON de importación usando el ref exportado
    const mockData = {
      version: 1,
      settings: {
        selectedFolderIds: [testFolder.id]
      },
      refs: {
        folders: {
          [testFolder.id]: exportedJson.refs.folders[testFolder.id]
        }
      }
    };
    
    tmpFilePath = path.join(os.tmpdir(), `mock-export-${Date.now()}.json`);
    fs.writeFileSync(tmpFilePath, JSON.stringify(mockData));

    // 5. Ir a Avanzado e importar
    await setupPage.navigateToSection('advanced');
    await setupPage.importBtn.waitFor({ state: 'visible' });
    await setupPage.importarConfiguracion(tmpFilePath);
    
    // 6. Verificar resumen
    const summary = await setupPage.getImportSummary();
    expect(summary).toContain('1 carpetas');
    
    // 7. Confirmar importación (esto recarga la página después de 2s)
    await setupPage.confirmarImportacion();
    
    // Verificar status antes del reload
    const status = await setupPage.getStatusMessage();
    expect(status).toContain('importada exitosamente');
    
    // 8. Esperar el reload automático y verificar que se aplicó
    await page.waitForURL(/setup\.html/);
    await page.locator('#folder-tree-container').waitFor({ state: 'visible' });
    const checkbox = setupPage.getFolderCheckbox(testFolder.id);
    await checkbox.waitFor({ state: 'visible' });
    expect(await checkbox.isChecked()).toBeTruthy();
  });
  
  test('Cancelar importación no aplica cambios', async ({ page, extensionId, extensionProtocol }) => {
    const setupPage = new SetupPage(page, extensionProtocol + extensionId);
    
    // 1. Seleccionar carpeta y guardar para tener refs válidos
    await setupPage.selectFolder(testFolder.id);
    await setupPage.save();
    await expect(setupPage.statusText).toContainText('Configuración guardada');
    
    // 2. Ir a Avanzado y exportar para obtener las refs
    await setupPage.navigateToSection('advanced');
    await setupPage.exportBtn.waitFor({ state: 'visible' });
    const download = await setupPage.exportarConfiguracion();
    const jsonStr = fs.readFileSync(await download.path(), 'utf8');
    const exportedJson = JSON.parse(jsonStr);

    // 3. Volver a Carpetas y desmarcar
    await setupPage.navigateToSection('folders');
    await setupPage.selectFolder('1'); // Seleccionar una carpeta extra
    await setupPage.deselectFolder(testFolder.id);
    await setupPage.save();
    await expect(setupPage.statusText).toContainText('Configuración guardada');
    
    // 4. Crear JSON de importación
    const mockData = {
      version: 1,
      settings: {
        selectedFolderIds: [testFolder.id]
      },
      refs: {
        folders: {
          [testFolder.id]: exportedJson.refs.folders[testFolder.id]
        }
      }
    };
    
    tmpFilePath = path.join(os.tmpdir(), `mock-export-cancel-${Date.now()}.json`);
    fs.writeFileSync(tmpFilePath, JSON.stringify(mockData));

    // 5. Ir a Avanzado e importar
    await setupPage.navigateToSection('advanced');
    await setupPage.importBtn.waitFor({ state: 'visible' });
    await setupPage.importarConfiguracion(tmpFilePath);
    
    // 6. Cancelar
    await setupPage.cancelarImportacion();
    
    // 7. Verificar que el resumen desapareció
    await expect(setupPage.importSummary).toBeHidden();
    
    // 8. Recargar y comprobar que sigue desmarcada
    await setupPage.goto();
    await page.locator('#folder-tree-container').waitFor({ state: 'visible' });
    const checkbox = setupPage.getFolderCheckbox(testFolder.id);
    await checkbox.waitFor({ state: 'visible' });
    expect(await checkbox.isChecked()).toBeFalsy();
  });
});
