import { test, expect } from '../fixtures/extension.fixture.mjs';
import { createTestFolder, createTestBookmark, clearTestBookmarks } from '../helpers/bookmarks.helper.mjs';
import { SetupPage } from '../pages/setup.page.mjs';

test.describe('Folder Header Buttons and Sorting', () => {
  let testFolder;

  test.beforeEach(async ({ page, extensionId, extensionProtocol, browserName }) => {
    if (browserName === 'firefox') test.skip(true, 'Firefox no soportado');
    await page.goto(`${extensionProtocol}${extensionId}/setup/setup.html`);
    testFolder = await createTestFolder(page, 'E2E Buttons Folder');
    await createTestBookmark(page, 'E2E Dummy', 'https://example.com', testFolder.id);
  });

  test.afterEach(async ({ page, browserName }) => {
    if (browserName === 'firefox') return;
    if (testFolder && testFolder.id) {
      await clearTestBookmarks(page, testFolder.id);
    }
  });

  test('Buttons are visible by default and can toggle sort mode', async ({ page, extensionId, extensionProtocol }) => {
    const setupPage = new SetupPage(page, `${extensionProtocol}${extensionId}`);
    await setupPage.goto();
    await setupPage.selectFolder(testFolder.id);
    await setupPage.save();

    await page.goto(`${extensionProtocol}${extensionId}/newtab/newtab.html`);
    await page.waitForLoadState('networkidle');

    const folderContainer = page.locator('.group').filter({ hasText: 'E2E Buttons Folder' });
    await expect(folderContainer).toBeVisible({ timeout: 10000 });
    
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
    const setupPage = new SetupPage(page, `${extensionProtocol}${extensionId}`);
    await setupPage.goto();
    await setupPage.selectFolder(testFolder.id);
    await setupPage.navigateToSection('appearance');
    await page.locator('#show-view-button').uncheck();
    await page.locator('#show-sort-button').uncheck();
    await setupPage.save();

    await page.goto(`${extensionProtocol}${extensionId}/newtab/newtab.html`);
    await page.waitForLoadState('networkidle');

    const folderContainer = page.locator('.group').filter({ hasText: 'E2E Buttons Folder' });
    await expect(folderContainer).toBeVisible({ timeout: 10000 });

    const viewBtn = folderContainer.locator('.review-button').first();
    const sortBtn = folderContainer.locator('.review-button').nth(1);
    
    await expect(sortBtn).toHaveCount(0);
    await expect(viewBtn).toHaveCount(0);
  });
});
