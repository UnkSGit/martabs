import { test, expect } from '../fixtures/extension.fixture.mjs';
import { SetupPage } from '../pages/setup.page.mjs';
import { NewTabPage } from '../pages/newtab.page.mjs';
import { createTestFolder, createTestBookmark, clearTestBookmarks } from '../helpers/bookmarks.helper.mjs';

test.describe('Columns Capacity Test', () => {
  let folderIds = [];

  test.beforeEach(async ({ page, extensionId, extensionProtocol, browserName }) => {
    if (browserName === 'firefox') test.skip(true, 'Firefox no soportado');
    await page.goto(`${extensionProtocol}${extensionId}/setup/setup.html`);

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

  test('4 columns should fit in 1280px width', async ({ page, extensionId, extensionProtocol }) => {
    await page.setViewportSize({ width: 1280, height: 720 });

    const setupPage = new SetupPage(page, `${extensionProtocol}${extensionId}`);
    await setupPage.goto();
    for (let i = 0; i < folderIds.length; i++) {
      const folderCheckbox = setupPage.getFolderCheckbox(folderIds[i]);
      if (!(await folderCheckbox.isChecked())) await folderCheckbox.check();
    }
    await setupPage.save();

    const newTabPage = new NewTabPage(page, `${extensionProtocol}${extensionId}`);
    await newTabPage.goto();

    const groups = newTabPage.getFolderGroups();
    await expect(groups).toHaveCount(4);

    // To check if they are in the same row, we compare their Y coordinates.
    const groupBoxes = [];
    for (let i = 0; i < 4; i++) {
      const box = await groups.nth(i).boundingBox();
      groupBoxes.push(box);
    }

    // Since it's CSS columns, items in the same row should have roughly the same Y coordinate
    const firstY = groupBoxes[0].y;
    for (let i = 1; i < 4; i++) {
      expect(Math.abs(groupBoxes[i].y - firstY)).toBeLessThan(5); // all 4 in the same row
    }
  });
});
