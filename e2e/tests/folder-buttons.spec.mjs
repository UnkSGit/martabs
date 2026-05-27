import { test, expect } from '../fixtures/extension.fixture.mjs';
import { createTestFolder, clearTestBookmarks } from '../helpers/bookmarks.helper.mjs';

test.describe('Folder Header Buttons and Sorting', () => {
  let testFolder;

  test.beforeEach(async ({ page, extensionId, extensionProtocol, browserName }) => {
    if (browserName === 'firefox') test.skip(true, 'Firefox no soportado');
    await page.goto(`${extensionProtocol}${extensionId}/setup/setup.html`);
    testFolder = await createTestFolder(page, 'E2E Buttons Folder');
  });

  test.afterEach(async ({ page, browserName }) => {
    if (browserName === 'firefox') return;
    if (testFolder && testFolder.id) {
      await clearTestBookmarks(page, testFolder.id);
    }
  });

  test('Buttons are visible by default and can toggle sort mode', async ({ page, extensionId, extensionProtocol }) => {
    await page.evaluate(async (id) => {
      return new Promise(resolve => {
        chrome.storage.local.get('martabs_settings', (data) => {
          const settings = data.martabs_settings || {};
          settings.selectedFolderIds = [id];
          settings.showViewButton = true;
          settings.showSortButton = true;
          chrome.storage.local.set({ martabs_settings: settings }, resolve);
        });
      });
    }, testFolder.id);

    await page.goto(`${extensionProtocol}${extensionId}/newtab/newtab.html`);
    await page.waitForLoadState('networkidle');

    const folderContainer = page.locator('.group').filter({ hasText: 'E2E Buttons Folder' });
    const sortBtn = folderContainer.locator('.review-button').first();
    const viewBtn = folderContainer.locator('.review-button').nth(1);
    
    await expect(sortBtn).toBeVisible();
    await expect(viewBtn).toBeVisible();

    const initialTitle = await sortBtn.getAttribute('title');
    await sortBtn.click();
    const newTitle = await sortBtn.getAttribute('title');
    expect(newTitle).not.toBe(initialTitle);
  });

  test('Buttons can be hidden via settings', async ({ page, extensionId, extensionProtocol }) => {
    await page.evaluate(async (id) => {
      return new Promise(resolve => {
        chrome.storage.local.get('martabs_settings', (data) => {
          const settings = data.martabs_settings || {};
          settings.selectedFolderIds = [id];
          settings.showViewButton = false;
          settings.showSortButton = false;
          chrome.storage.local.set({ martabs_settings: settings }, resolve);
        });
      });
    }, testFolder.id);

    await page.goto(`${extensionProtocol}${extensionId}/newtab/newtab.html`);
    await page.waitForLoadState('networkidle');

    const folderContainer = page.locator('.group').filter({ hasText: 'E2E Buttons Folder' });
    const sortBtn = folderContainer.locator('.review-button').first();
    const viewBtn = folderContainer.locator('.review-button').nth(1);
    
    await expect(sortBtn).toHaveCount(0);
    await expect(viewBtn).toHaveCount(0);
  });
});
