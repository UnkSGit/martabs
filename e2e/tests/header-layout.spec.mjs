import { test, expect } from '../fixtures/extension.fixture.mjs';
import { SetupPage } from '../pages/setup.page.mjs';
import { NewTabPage } from '../pages/newtab.page.mjs';
import { createTestFolder, createTestBookmark, clearTestBookmarks } from '../helpers/bookmarks.helper.mjs';

test.describe('Header Layout Tests', () => {
  let folderIds = [];

  test.beforeEach(async ({ page, extensionId, extensionProtocol, browserName }) => {
    if (browserName === 'firefox') test.skip(true, 'Firefox no soportado');
    await page.goto(`${extensionProtocol}${extensionId}/setup/setup.html`);

    folderIds = [];
    // Create 4 folders to allow multi-column/masonry-max rendering
    for (let i = 1; i <= 4; i++) {
      const folder = await createTestFolder(page, `Folder ${i}`);
      folderIds.push(folder.id);
      await createTestBookmark(page, `Bookmark ${i}`, `https://example.com/${i}`, folder.id);
    }
  });

  test.afterEach(async ({ page, browserName }) => {
    if (browserName === 'firefox') return;
    for (const folderId of folderIds) {
      await clearTestBookmarks(page, folderId);
    }
  });

  const viewports = [
    { width: 800, height: 600 },
    { width: 1280, height: 720 },
    { width: 1600, height: 900 },
    { width: 1920, height: 1080 }
  ];

  const folderSelections = [
    { count: 1, label: 'Single Folder' },
    { count: 4, label: 'Multiple Folders' }
  ];

  for (const vp of viewports) {
    for (const sel of folderSelections) {
      test(`Layout test at ${vp.width}x${vp.height} with ${sel.label}`, async ({ page, extensionId, extensionProtocol }) => {
        // Set viewport size
        await page.setViewportSize({ width: vp.width, height: vp.height });

        // Configure folders to display
        const setupPage = new SetupPage(page, `${extensionProtocol}${extensionId}`);
        await setupPage.goto();
        
        // Select folders based on current test selection count
        for (let i = 0; i < folderIds.length; i++) {
          const folderCheckbox = setupPage.getFolderCheckbox(folderIds[i]);
          await expect(folderCheckbox).toBeVisible();
          
          const isChecked = await folderCheckbox.isChecked();
          if (i < sel.count) {
            if (!isChecked) await folderCheckbox.check();
          } else {
            if (isChecked) await folderCheckbox.uncheck();
          }
        }
        await setupPage.save();

        const newTabPage = new NewTabPage(page, `${extensionProtocol}${extensionId}`);
        await newTabPage.goto();

        // Wait for folder groups to render
        const groups = newTabPage.getFolderGroups();
        await expect(groups).toHaveCount(sel.count);

        // Get bounding boxes
        const topbar = page.locator('.topbar');
        const searchSection = page.locator('.search-section');
        const content = page.locator('#content');
        const appShell = page.locator('.app-shell');
        const masonry = page.locator('.layout-masonry');

        const topbarBox = await topbar.boundingBox();
        const searchBox = await searchSection.boundingBox();
        const contentBox = await content.boundingBox();
        const appShellBox = await appShell.boundingBox();
        const masonryBox = await masonry.boundingBox();

        console.log(`\n--- TEST CASE: Viewport: ${vp.width}px, Folders: ${sel.count} ---`);
        console.log('App Shell Box:', appShellBox);
        console.log('Topbar Box   :', topbarBox);
        console.log('Search Box   :', searchBox);
        console.log('Masonry Box  :', masonryBox);

        // Assert centering
        const topbarCenterX = topbarBox.x + topbarBox.width / 2;
        const appShellCenterX = appShellBox.x + appShellBox.width / 2;
        const diff = Math.abs(topbarCenterX - appShellCenterX);
        console.log(`Centering diff: ${diff}px`);
        expect(diff).toBeLessThan(5);

        // Assert stacked vertical order
        expect(topbarBox.y + topbarBox.height).toBeLessThanOrEqual(searchBox.y);
        expect(searchBox.y + searchBox.height).toBeLessThanOrEqual(contentBox.y);

        // Check if topbar is next to/overlapping with content horizontally (same row)
        const isNextToFolders = (topbarBox.y < contentBox.y + contentBox.height) && (topbarBox.y + topbarBox.height > contentBox.y);
        expect(isNextToFolders).toBe(false);
      });
    }
  }
});

