import { test, expect } from '../fixtures/extension.fixture.mjs';
import { SetupPage } from '../pages/setup.page.mjs';
import { createTestFolder, createTestBookmark, clearTestBookmarks } from '../helpers/bookmarks.helper.mjs';

test.describe('Tabs and Performance Optimization (v0.9.9)', () => {
  let folderWork;
  let folderPersonal;

  test.beforeEach(async ({ page, extensionId, extensionProtocol, browserName }) => {
    if (browserName === 'firefox') test.skip(true, 'Firefox no soportado por inestabilidad de runner MV3');
    
    // Navigate first to extension context
    await page.goto(`${extensionProtocol}${extensionId}/setup/setup.html`);

    // Create folders
    folderWork = await createTestFolder(page, 'E2E Work');
    folderPersonal = await createTestFolder(page, 'E2E Personal', folderWork.id);

    // Batch create 1 bookmark in Work, and 52 in Personal to test pagination in a single roundtrip
    await page.evaluate(async ({ workId, personalId }) => {
      const create = (title, url, parentId) => new Promise(r => chrome.bookmarks.create({ title, url, parentId }, r));
      await create('Work site 1', 'https://work1.com', workId);
      await create('Personal site 1', 'https://personal1.com', personalId);
      const promises = [];
      for (let i = 2; i <= 52; i++) {
        promises.push(create(`Personal site ${i}`, `https://personal${i}.com`, personalId));
      }
      await Promise.all(promises);
    }, { workId: folderWork.id, personalId: folderPersonal.id });
  });

  test.afterEach(async ({ page, browserName }) => {
    if (browserName === 'firefox') return;
    if (folderPersonal && folderPersonal.id) {
      try {
        await clearTestBookmarks(page, folderPersonal.id);
      } catch (e) {}
    }
    if (folderWork && folderWork.id) {
      try {
        await clearTestBookmarks(page, folderWork.id);
      } catch (e) {}
    }
  });

  test('T-01: Configuración de pestañas, asignación y renderizado selectivo', async ({ page, extensionId, extensionProtocol }) => {
    const setupPage = new SetupPage(page, `${extensionProtocol}${extensionId}`);
    await setupPage.goto();

    // Select both folders in setup
    await setupPage.selectFolder(folderWork.id);
    
    // Expand the parent folder E2E Work to make the child E2E Personal visible/checkable
    const parentToggleBtn = page.locator(`#folder-tree-container .folder-tree-node[data-folder-id="${folderWork.id}"] .folder-toggle-btn`);
    if (await parentToggleBtn.isVisible()) {
      await parentToggleBtn.click();
    }
    
    await setupPage.selectFolder(folderPersonal.id);
    await setupPage.save();

    // Go to Dashboard section where Tabs management is located
    await page.locator('nav button[data-section="dashboard"]').click();
    await expect(page.locator('#tabs-manager-container')).toBeVisible();

    // Add custom tab using Enter keypress
    await page.locator('#new-tab-name').fill('Trabajo');
    await page.keyboard.press('Enter');
    await expect(page.locator('#tabs-list .tab-item-input')).toHaveValue('Trabajo');

    // Drag and drop Work folder to "Trabajo" tab dropzone card using synthetic DragEvents to avoid coordinate flakiness in E2E
    await page.evaluate(({ folderId }) => {
      const srcEl = document.querySelector(`#tabs-folder-tree-container .folder-tree-node[data-folder-id="${folderId}"] .folder-tree-row`);
      const inputs = Array.from(document.querySelectorAll('.tab-dropzone-card input.tab-item-input'));
      const input = inputs.find(inp => inp.value === 'Trabajo');
      const card = input ? input.closest('.tab-dropzone-card') : null;
      const destEl = card ? card.querySelector('.tab-dropzone-body') : null;

      if (!srcEl || !destEl) {
        throw new Error(`Drag-and-drop elements not found: src=${!!srcEl}, dest=${!!destEl}`);
      }

      const dataStore = {};
      const dataTransfer = {
        setData(type, val) {
          dataStore[type] = val;
        },
        getData(type) {
          return dataStore[type];
        },
        effectAllowed: 'move',
        dropEffect: 'none'
      };

      const createEvent = (type) => {
        const ev = new DragEvent(type, { bubbles: true, cancelable: true });
        Object.defineProperty(ev, 'dataTransfer', { value: dataTransfer, configurable: true });
        return ev;
      };

      srcEl.dispatchEvent(createEvent('dragstart'));
      destEl.dispatchEvent(createEvent('dragenter'));
      destEl.dispatchEvent(createEvent('dragover'));
      destEl.dispatchEvent(createEvent('drop'));
      srcEl.dispatchEvent(createEvent('dragend'));
    }, { folderId: folderWork.id });

    const targetCard = page.locator('.tab-dropzone-card').filter({ has: page.locator('input.tab-item-input').filter({ hasValue: 'Trabajo' }) });
    const targetDropzone = targetCard.locator('.tab-dropzone-body');

    // Save debug screenshot of setup
    await page.screenshot({ path: 'setup-debug.png' });

    // Verify cascading assignment: both Work and Personal pills should be visible in the dropzone
    const pillWork = targetDropzone.locator('.assigned-folder-pill').filter({ hasText: 'E2E Work' });
    const pillPersonal = targetDropzone.locator('.assigned-folder-pill').filter({ hasText: 'E2E Personal' });
    await expect(pillWork).toBeVisible();
    await expect(pillPersonal).toBeVisible();

    // Manually extract E2E Personal folder from Trabajo tab using the "x" button
    await pillPersonal.locator('.assigned-folder-remove-btn').click();
    await expect(pillPersonal).not.toBeVisible();
    await expect(pillWork).toBeVisible();

    // Save changes
    await setupPage.save();

    // Navigate to newtab Dashboard
    await page.goto(`${extensionProtocol}${extensionId}/newtab/newtab.html`);
    await page.screenshot({ path: 'newtab-debug1.png' });

    // Verify tabs bar is visible and has "Todo" and "Trabajo" pills
    const tabsBar = page.locator('#tabs-bar');
    await expect(tabsBar).toBeVisible();
    await expect(tabsBar.locator('.tab-pill')).toHaveCount(2);

    // Default "Todo" tab is active. Verify both folders are rendered
    await expect(page.locator(`.group[data-folder-id="${folderWork.id}"]`)).toBeVisible();
    await expect(page.locator(`.group[data-folder-id="${folderPersonal.id}"]`)).toBeVisible();

    // Click "Trabajo" tab
    await tabsBar.locator('.tab-pill').filter({ hasText: 'Trabajo' }).click();

    // Verify only Work folder is visible
    await expect(page.locator(`.group[data-folder-id="${folderWork.id}"]`)).toBeVisible();
    await expect(page.locator(`.group[data-folder-id="${folderPersonal.id}"]`)).not.toBeVisible();
  });

  test('T-02: Paginación de marcadores y botón "Ver más"', async ({ page, extensionId, extensionProtocol }) => {
    const setupPage = new SetupPage(page, `${extensionProtocol}${extensionId}`);
    await setupPage.goto();

    // Expand the parent folder E2E Work to make the child E2E Personal visible/checkable
    const parentToggleBtn = page.locator(`.folder-tree-node[data-folder-id="${folderWork.id}"] .folder-toggle-btn`);
    if (await parentToggleBtn.isVisible()) {
      await parentToggleBtn.click();
    }
    
    // Select Personal folder and save
    await setupPage.selectFolder(folderPersonal.id);
    await setupPage.save();

    // Navigate to dashboard
    await page.goto(`${extensionProtocol}${extensionId}/newtab/newtab.html`);

    // Personal folder should be visible
    const personalGroup = page.locator(`.group[data-folder-id="${folderPersonal.id}"]`);
    await expect(personalGroup).toBeVisible();

    // It contains 52 bookmarks. Initial render should only render 50 bookmark elements.
    const initialBookmarksCount = await personalGroup.locator('.bookmark').count();
    expect(initialBookmarksCount).toBe(50);

    // Scroll the bookmark list of the folder to the bottom to trigger IntersectionObserver
    const bookmarkList = personalGroup.locator('.bookmark-list');
    await bookmarkList.evaluate(el => el.scrollTop = el.scrollHeight);

    // The load more button must be visible with correct text (remaining 2)
    const loadMoreBtn = personalGroup.locator('.load-more-btn');
    await expect(loadMoreBtn).toBeVisible();
    await expect(loadMoreBtn).toContainText('2');

    // Click "Ver más"
    await loadMoreBtn.click({ force: true });

    // Now all 52 bookmarks must be rendered and button is removed
    const finalBookmarksCount = await personalGroup.locator('.bookmark').count();
    expect(finalBookmarksCount).toBe(52);
    await expect(loadMoreBtn).not.toBeVisible();
  });

  test('T-03: Sanitización al eliminar pestaña activa y deselección desde Sin pestaña', async ({ page, extensionId, extensionProtocol }) => {
    const setupPage = new SetupPage(page, `${extensionProtocol}${extensionId}`);
    await setupPage.goto();

    // Select both Work and Personal folders
    await setupPage.selectFolder(folderWork.id);
    const parentToggleBtn = page.locator(`#folder-tree-container .folder-tree-node[data-folder-id="${folderWork.id}"] .folder-toggle-btn`);
    if (await parentToggleBtn.isVisible()) {
      await parentToggleBtn.click();
    }
    await setupPage.selectFolder(folderPersonal.id);
    await setupPage.save();

    // Go to Dashboard section
    await page.locator('nav button[data-section="dashboard"]').click();

    // Create a temp tab
    await page.locator('#new-tab-name').fill('TempTab');
    await page.keyboard.press('Enter');
    await expect(page.locator('#tabs-list .tab-item-input')).toHaveValue('TempTab');

    // Drag folderWork to TempTab
    await page.evaluate(({ folderId }) => {
      const srcEl = document.querySelector(`#tabs-folder-tree-container .folder-tree-node[data-folder-id="${folderId}"] .folder-tree-row`);
      const inputs = Array.from(document.querySelectorAll('.tab-dropzone-card input.tab-item-input'));
      const input = inputs.find(inp => inp.value === 'TempTab');
      const card = input ? input.closest('.tab-dropzone-card') : null;
      const destEl = card ? card.querySelector('.tab-dropzone-body') : null;

      if (!srcEl || !destEl) {
        throw new Error(`Elements not found: src=${!!srcEl}, dest=${!!destEl}`);
      }

      const dataStore = {};
      const dataTransfer = {
        setData(type, val) { dataStore[type] = val; },
        getData(type) { return dataStore[type]; },
        effectAllowed: 'move',
        dropEffect: 'none'
      };

      const createEvent = (type) => {
        const ev = new DragEvent(type, { bubbles: true, cancelable: true });
        Object.defineProperty(ev, 'dataTransfer', { value: dataTransfer, configurable: true });
        return ev;
      };

      srcEl.dispatchEvent(createEvent('dragstart'));
      destEl.dispatchEvent(createEvent('dragenter'));
      destEl.dispatchEvent(createEvent('dragover'));
      destEl.dispatchEvent(createEvent('drop'));
      srcEl.dispatchEvent(createEvent('dragend'));
    }, { folderId: folderWork.id });

    // Save
    await setupPage.save();

    // Go to newtab
    await page.goto(`${extensionProtocol}${extensionId}/newtab/newtab.html`);
    // Click TempTab
    const tabsBar = page.locator('#tabs-bar');
    await tabsBar.locator('.tab-pill').filter({ hasText: 'TempTab' }).click();
    // Verify only Work folder is visible
    await expect(page.locator(`.group[data-folder-id="${folderWork.id}"]`)).toBeVisible();

    // Go back to setup
    await page.goto(`${extensionProtocol}${extensionId}/setup/setup.html`);
    await page.locator('nav button[data-section="dashboard"]').click();

    // Let's delete TempTab.
    // Intercept confirm dialogs for deleting a tab
    page.once('dialog', async (dialog) => {
      expect(dialog.message()).toContain('¿Seguro que deseas eliminar la pestaña');
      await dialog.accept();
    });
    // Click delete btn on TempTab dropzone card
    const targetCard = page.locator('.tab-dropzone-card').filter({ has: page.locator('input.tab-item-input').filter({ hasValue: 'TempTab' }) });
    await targetCard.locator('.tab-action-btn.delete').click();
    
    // Now verify TempTab is gone
    await expect(targetCard).not.toBeVisible();

    // Now Work folder is in the unassigned card (Sin pestaña)
    const unassignedCard = page.locator('.tab-dropzone-card.is-unassigned');
    const pillWork = unassignedCard.locator('.assigned-folder-pill').filter({ hasText: 'E2E Work' });
    await expect(pillWork).toBeVisible();

    // Intercept confirm dialog for leaving folder monitoring
    page.once('dialog', async (dialog) => {
      expect(dialog.message()).toContain('¿Seguro que deseas dejar de monitorear la carpeta');
      await dialog.accept();
    });
    // Click "x" on Work folder pill
    await pillWork.locator('.assigned-folder-remove-btn').click();
    await expect(pillWork).not.toBeVisible();

    // Save settings
    await setupPage.save();

    // Go to newtab
    await page.goto(`${extensionProtocol}${extensionId}/newtab/newtab.html`);
    // The active tab should have fallen back to "Todo" (or first custom if Todo is hidden)
    // And because E2E Work is unmonitored, it should not render on the main page.
    await expect(page.locator(`.group[data-folder-id="${folderWork.id}"]`)).not.toBeVisible();
  });
});

