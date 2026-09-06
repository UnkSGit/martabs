import { readFile } from 'node:fs/promises';
import { test, expect } from '../fixtures/extension.fixture.mjs';

test.describe('Data persistence regressions', () => {
  test.beforeEach(async ({ page, extensionId, extensionProtocol, browserName }) => {
    test.skip(browserName === 'firefox', 'The existing Firefox extension fixture is not supported.');
    await page.goto(`${extensionProtocol}${extensionId}/setup/setup.html`);
  });

  async function seedWidgets(page, items = []) {
    await page.evaluate(items => chrome.storage.local.set({
      settings: { setupComplete: true, widgets: { enabled: true, notes: { enabled: true }, checklist: { enabled: true } } },
      widgetChecklist: items, widgetNotes: ''
    }), items);
  }

  async function newDashboard(context, control) {
    const dashboard = await context.newPage();
    await dashboard.goto(new URL('../newtab/newtab.html', control.url()).href);
    await dashboard.locator('.widget-checklist-add-btn').waitFor();
    return dashboard;
  }

  async function addTask(page, text) {
    await page.locator('.widget-checklist-add-btn').click();
    await page.locator('.widget-checklist-input').fill(text);
    await page.locator('.widget-checklist-input').press('Enter');
  }

  function stored(page, key) {
    return page.evaluate(key => chrome.storage.local.get(key).then(data => data[key]), key);
  }

  test('two dashboards preserve concurrent additions and sync task changes', async ({ context, page }) => {
    await seedWidgets(page);
    const a = await newDashboard(context, page), b = await newDashboard(context, page);
    await addTask(a, 'First task');
    await expect(b.locator('.widget-checklist-item')).toHaveCount(1);
    await Promise.all([addTask(a, 'Second task'), addTask(b, 'Third task')]);
    await expect.poll(async () => (await stored(page, 'widgetChecklist')).map(item => item.text).sort())
      .toEqual(['First task', 'Second task', 'Third task']);
    await expect(a.locator('.widget-checklist-item')).toHaveCount(3);
    await expect(b.locator('.widget-checklist-item')).toHaveCount(3);
    await a.locator('.widget-checklist-item').filter({ hasText: 'Second task' }).locator('input').check();
    await expect(b.locator('.widget-checklist-item').filter({ hasText: 'Second task' }).locator('input')).toBeChecked();
    await b.locator('.widget-checklist-item').filter({ hasText: 'First task' }).locator('button').click();
    await expect(a.locator('.widget-checklist-item')).toHaveCount(2);
    await expect.poll(async () => (await stored(page, 'widgetChecklist')).map(item => item.text).sort())
      .toEqual(['Second task', 'Third task']);
  });

  test('legacy checklist items survive simultaneous edits from two dashboards', async ({ context, page }) => {
    await seedWidgets(page, [{ text: 'Legacy task', checked: true }]);
    const a = await newDashboard(context, page), b = await newDashboard(context, page);
    await Promise.all([addTask(a, 'New A'), addTask(b, 'New B')]);
    await expect.poll(async () => (await stored(page, 'widgetChecklist')).map(item => item.text).sort())
      .toEqual(['Legacy task', 'New A', 'New B']);
    expect((await stored(page, 'widgetChecklist')).find(item => item.text === 'Legacy task').checked).toBe(true);
  });

  test('notes survive immediate close and update another open dashboard', async ({ context, page }) => {
    await seedWidgets(page);
    const a = await newDashboard(context, page), b = await newDashboard(context, page);
    await a.locator('.widget-notes-textarea').fill('Saved before closing');
    await a.close();
    await expect.poll(() => stored(page, 'widgetNotes')).toBe('Saved before closing');
    await expect(b.locator('.widget-notes-textarea')).toHaveValue('Saved before closing');
    await b.locator('.widget-notes-textarea').fill('');
    await b.locator('.widget-notes-textarea').pressSequentially('Rapid edits survive closing');
    await b.close();
    await expect.poll(() => stored(page, 'widgetNotes')).toBe('Rapid edits survive closing');
  });

  test('overlapping widget initialization cleans up detached storage listeners', async ({ page }) => {
    const counts = await page.evaluate(async () => {
      const { initializeWidgets } = await import('../newtab/widgets/widget-renderer.js');
      const listeners = new Set();
      const pendingReads = [];
      const api = {
        i18n: { getMessage: key => key },
        storage: {
          local: { get: key => new Promise(resolve => pendingReads.push(() => resolve({ [key]: key === 'widgetChecklist' ? [] : '' }))) },
          onChanged: { addListener: listener => listeners.add(listener), removeListener: listener => listeners.delete(listener) }
        }
      };
      const container = document.createElement('div'), grid = document.createElement('div');
      container.append(grid);
      document.body.append(container);
      const settings = { widgets: { enabled: true, notes: { enabled: true }, checklist: { enabled: true } } };
      const first = initializeWidgets(api, settings, container, grid);
      const second = initializeWidgets(api, settings, container, grid);
      pendingReads.splice(0).forEach(resolve => resolve());
      await Promise.all([first, second]);
      await new Promise(resolve => setTimeout(resolve, 0));
      const active = listeners.size;
      await initializeWidgets(api, { widgets: { enabled: false } }, container, grid);
      return { active, disabled: listeners.size };
    });
    expect(counts).toEqual({ active: 2, disabled: 0 });
  });

  test('image wallpaper import retains local blobs and disables missing images', async ({ page }) => {
    await page.evaluate(async () => {
      const { saveWallpaper } = await import('../shared/db.js');
      await saveWallpaper(1, new Blob(['test image asset'], { type: 'image/png' }));
    });
    const backup = { version: 1, settings: {
      customWallpaperEnabled: true, customWallpaperType: 'image', customWallpaperSlots: [1, 2],
      customWallpaperActiveSlot: 1, customWallpaperThemes: { 1: 'dark', 2: 'light' }
    }, refs: { bookmarks: {}, folders: {} } };
    async function importImage() {
      await page.locator('button[data-section="data"]').click();
      await page.locator('#import-config-file').setInputFiles({ name: 'image-backup.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(backup)) });
      await page.locator('#import-confirm-btn').click();
    }
    await importImage();
    await expect.poll(async () => (await stored(page, 'settings')).customWallpaperSlots).toEqual([1]);
    const available = await stored(page, 'settings');
    expect(available.customWallpaperEnabled).toBe(true);
    expect(available.customWallpaperType).toBe('image');
    await page.reload();
    await page.evaluate(async () => {
      const { deleteWallpaper } = await import('../shared/db.js');
      await deleteWallpaper(1);
    });
    await importImage();
    await expect.poll(async () => (await stored(page, 'settings')).customWallpaperEnabled).toBe(false);
    expect((await stored(page, 'settings')).customWallpaperSlots).toEqual([]);
  });

  test('failed task writes revert the checkbox and slow reads do not erase typed notes', async ({ page }) => {
    await page.evaluate(async () => {
      const { initializeWidgets } = await import('../newtab/widgets/widget-renderer.js');
      const data = { widgetChecklist: [{ id: 'task', text: 'Unsaved toggle', checked: false }], widgetNotes: 'Original' };
      let delayNotesRead = false;
      const api = {
        i18n: { getMessage: key => key },
        storage: { local: { get: async key => {
          const snapshot = { [key]: data[key] };
          if (key === 'widgetNotes' && delayNotesRead) await new Promise(resolve => { window.finishNotesRead = resolve; });
          return snapshot;
        } } },
        runtime: { sendMessage: async message => {
          if (message.type === 'WIDGET_CHECKLIST_MUTATE') return { success: false, error: 'Simulated storage failure' };
          data.widgetNotes = message.value;
          return { success: true };
        } }
      };
      const container = document.createElement('div'), grid = document.createElement('div');
      container.append(grid);
      document.body.append(container);
      await initializeWidgets(api, { widgets: { enabled: true, notes: { enabled: true }, checklist: { enabled: true } } }, container, grid);
      window.delayNotesRead = () => { delayNotesRead = true; };
    });
    const checkbox = page.locator('.widget-checklist-item input');
    await checkbox.waitFor();
    await checkbox.evaluate(element => element.click());
    await expect(checkbox).not.toBeChecked();
    await expect(page.locator('.widget-checklist-item')).not.toHaveClass(/checked/);
    await page.evaluate(() => {
      window.delayNotesRead();
      const textarea = document.querySelector('.widget-notes-textarea');
      textarea.focus();
      textarea.value = 'New text after read started';
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      window.finishNotesRead();
    });
    await expect(page.locator('.widget-notes-textarea')).toHaveValue('New text after read started');
  });

  test('export and import restores newer settings and accepts an older partial backup', async ({ page }) => {
    await page.evaluate(async () => {
      const folder = await chrome.bookmarks.create({ title: 'Restoration test folder' });
      const { getSettings } = await import('../shared/storage.js');
      const { getBrowserApi } = await import('../shared/browser-api.js');
      await chrome.storage.local.set({ settings: {
        ...await getSettings(getBrowserApi()), setupComplete: true, selectedFolderIds: [folder.id],
        language: 'ja', theme: 'dark', tabs: [{ id: 'work', name: 'Work' }],
        folderTabs: { [folder.id]: 'work' }, activeTabId: 'work', localStatsEnabled: true,
        cleanFolderNames: false, showViewButton: false, showSortButton: false,
        widgets: { enabled: true, style: 'compact', order: ['notes', 'checklist'],
          notes: { enabled: true }, checklist: { enabled: true }, clock: { enabled: false, format: '24' },
          weather: { enabled: false }, sports: { enabled: false } },
        customWallpaperEnabled: true, customWallpaperType: 'gradient',
        customWallpaperGradientConfig: { type: 'linear', colorA: '#123456', colorB: '#abcdef', angle: 45, presetId: 'custom', animated: false }
      } });
    });
    await page.reload();
    await page.locator('button[data-section="data"]').click();
    const downloadPromise = page.waitForEvent('download');
    await page.locator('#export-config').click();
    const backup = JSON.parse(await readFile(await (await downloadPromise).path(), 'utf8'));
    await page.evaluate(() => chrome.storage.local.set({ settings: { setupComplete: true, language: 'es', theme: 'light' } }));
    await page.reload();

    async function importBackup(data) {
      await page.locator('button[data-section="data"]').click();
      await page.locator('#import-config-file').setInputFiles({ name: 'backup.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(data)) });
      await page.locator('#import-confirm-btn').click();
    }

    await importBackup(backup);
    await expect.poll(async () => (await stored(page, 'settings')).language).toBe('ja');
    const restored = await stored(page, 'settings');
    for (const key of ['tabs', 'folderTabs', 'activeTabId', 'language', 'localStatsEnabled', 'cleanFolderNames', 'showViewButton', 'showSortButton', 'customWallpaperType', 'customWallpaperGradientConfig']) {
      expect(restored[key], key).toEqual(backup.settings[key]);
    }
    expect(restored.widgets.enabled).toBe(true);
    expect(restored.widgets.style).toBe('compact');
    expect(restored.widgets.order).toEqual(['notes', 'checklist']);
    await page.reload();
    await importBackup({ version: 1, settings: { theme: 'light' }, refs: { bookmarks: {}, folders: {} } });
    await expect.poll(async () => (await stored(page, 'settings')).theme).toBe('light');
    const partial = await stored(page, 'settings');
    expect(partial.language).toBe('ja');
    expect(partial.tabs).toEqual(backup.settings.tabs);
    expect(partial.widgets).toEqual(restored.widgets);
    expect(partial.folderTabs).toEqual(restored.folderTabs);
  });
});
