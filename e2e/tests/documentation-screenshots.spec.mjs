import { test, expect, chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import http from 'node:http';
import path from 'node:path';

const rootDir = path.resolve('.');
const screenshotsDir = path.resolve('docs/assets/screenshots');
const chromePath = process.env.CHROME_EXECUTABLE_PATH || undefined;

function iconDataUrl(label, color) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" rx="22" fill="${color}"/><text x="48" y="58" text-anchor="middle" font-family="Arial, sans-serif" font-size="36" font-weight="700" fill="#fff">${label}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function mimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.html') return 'text/html; charset=utf-8';
  if (ext === '.js' || ext === '.mjs') return 'text/javascript; charset=utf-8';
  if (ext === '.css') return 'text/css; charset=utf-8';
  if (ext === '.json') return 'application/json; charset=utf-8';
  if (ext === '.png') return 'image/png';
  return 'application/octet-stream';
}

async function startStaticServer() {
  const server = http.createServer(async (request, response) => {
    const url = new URL(request.url || '/', 'http://127.0.0.1');
    const requestedPath = path.normalize(decodeURIComponent(url.pathname)).replace(/^([/\\])+/, '');
    const filePath = path.join(rootDir, requestedPath || 'src/newtab/newtab.html');

    if (!filePath.startsWith(rootDir)) {
      response.writeHead(403);
      response.end('Forbidden');
      return;
    }

    try {
      await fs.access(filePath);
      response.writeHead(200, { 'Content-Type': mimeType(filePath) });
      createReadStream(filePath).pipe(response);
    } catch {
      response.writeHead(404);
      response.end('Not found');
    }
  });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  return {
    origin: `http://127.0.0.1:${address.port}`,
    close: () => new Promise((resolve) => server.close(resolve))
  };
}

function createMockData(theme = 'dark') {
  const folders = [
    { id: 'folder-work', title: 'Trabajo diario' },
    { id: 'folder-reading', title: 'Lecturas tecnicas' },
    { id: 'folder-tools', title: 'Herramientas favoritas' }
  ];

  const bookmarks = [
    { id: 'b-github', parentId: 'folder-work', title: 'GitHub - Proyecto martabs', url: 'https://github.com', domain: 'github.com', folderPath: 'Trabajo diario', automaticTags: ['Trabajo diario', 'github.com'], manualTags: ['codigo'], dateAdded: 1716800100000, icon: iconDataUrl('GH', '#24292f') },
    { id: 'b-linear', parentId: 'folder-work', title: 'Linear - Roadmap del equipo', url: 'https://linear.app', domain: 'linear.app', folderPath: 'Trabajo diario', automaticTags: ['Trabajo diario', 'linear.app'], manualTags: ['roadmap'], dateAdded: 1716800200000, icon: iconDataUrl('L', '#5e6ad2') },
    { id: 'b-calendar', parentId: 'folder-work', title: 'Google Calendar', url: 'https://calendar.google.com', domain: 'calendar.google.com', folderPath: 'Trabajo diario', automaticTags: ['Trabajo diario', 'google.com'], manualTags: ['agenda'], dateAdded: 1716800300000, icon: iconDataUrl('31', '#4285f4') },
    { id: 'b-mdn', parentId: 'folder-reading', title: 'MDN Web Docs', url: 'https://developer.mozilla.org', domain: 'developer.mozilla.org', folderPath: 'Lecturas tecnicas', automaticTags: ['Lecturas tecnicas', 'mozilla.org'], manualTags: ['docs'], dateAdded: 1716800400000, icon: iconDataUrl('M', '#8b5cf6') },
    { id: 'b-chrome', parentId: 'folder-reading', title: 'Chrome Extensions Docs', url: 'https://developer.chrome.com/docs/extensions', domain: 'developer.chrome.com', folderPath: 'Lecturas tecnicas', automaticTags: ['Lecturas tecnicas', 'chrome.com'], manualTags: ['docs'], dateAdded: 1716800500000, icon: iconDataUrl('C', '#f59e0b') },
    { id: 'b-firefox', parentId: 'folder-reading', title: 'Firefox Add-ons Developer Hub', url: 'https://addons.mozilla.org/developers/', domain: 'addons.mozilla.org', folderPath: 'Lecturas tecnicas', automaticTags: ['Lecturas tecnicas', 'mozilla.org'], manualTags: ['publicacion'], dateAdded: 1716800600000, icon: iconDataUrl('F', '#f97316') },
    { id: 'b-notion', parentId: 'folder-tools', title: 'Notion Workspace', url: 'https://www.notion.so', domain: 'notion.so', folderPath: 'Herramientas favoritas', automaticTags: ['Herramientas favoritas', 'notion.so'], manualTags: ['notas'], dateAdded: 1716800700000, icon: iconDataUrl('N', '#111827') },
    { id: 'b-figma', parentId: 'folder-tools', title: 'Figma Community', url: 'https://www.figma.com/community', domain: 'figma.com', folderPath: 'Herramientas favoritas', automaticTags: ['Herramientas favoritas', 'figma.com'], manualTags: ['diseno'], dateAdded: 1716800800000, icon: iconDataUrl('F', '#a855f7') },
    { id: 'b-playwright', parentId: 'folder-tools', title: 'Playwright', url: 'https://playwright.dev', domain: 'playwright.dev', folderPath: 'Herramientas favoritas', automaticTags: ['Herramientas favoritas', 'playwright.dev'], manualTags: ['testing'], dateAdded: 1716800900000, icon: iconDataUrl('P', '#16a34a') }
  ].map((bookmark) => ({
    ...bookmark,
    allTags: [...bookmark.manualTags, ...bookmark.automaticTags],
    linkHealth: null
  }));

  const customFavicons = Object.fromEntries(bookmarks.map((bookmark) => [bookmark.id, bookmark.icon]));

  const settings = {
    selectedFolderIds: folders.map((folder) => folder.id),
    automaticTagsEnabled: true,
    manualTagsEnabled: true,
    linkHealthEnabled: false,
    previewEnabled: true,
    previewCaptureEnabled: false,
    showPinnedFolder: true,
    theme,
    language: 'es',
    setupComplete: true,
    defaultFolderMode: 'list',
    folderModes: {
      'folder-work': 'list',
      'folder-reading': 'compact',
      'folder-tools': 'quicklinks'
    },
    defaultFolderSort: 'browser',
    folderSorts: {},
    folderBookmarkOrders: {},
    bookmarkFolderOverrides: {},
    folderNameOverrides: {},
    customFavicons,
    brokenCustomFavicons: {}
  };

  return {
    folders,
    bookmarks,
    storage: {
      settings,
      bookmarkIndex: bookmarks,
      manualTags: Object.fromEntries(bookmarks.map((bookmark) => [bookmark.id, bookmark.manualTags])),
      linkHealth: {},
      capturedPreviews: {},
      pendingPreviewCaptures: {},
      pinnedBookmarks: ['b-github', 'b-mdn', 'b-playwright']
    },
    tree: [
      {
        id: '0',
        title: '',
        children: [
          {
            id: '1',
            title: 'Barra de favoritos',
            children: folders.map((folder) => ({
              id: folder.id,
              title: folder.title,
              parentId: '1',
              children: bookmarks
                .filter((bookmark) => bookmark.parentId === folder.id)
                .map((bookmark) => ({
                  id: bookmark.id,
                  title: bookmark.title,
                  url: bookmark.url,
                  parentId: folder.id,
                  dateAdded: bookmark.dateAdded
                }))
            }))
          }
        ]
      }
    ]
  };
}

async function installMockApi(page, data) {
  await page.addInitScript((initialData) => {
    const listeners = [];
    const persistedStorage = window.localStorage.getItem('__martabsMockStorage');
    const storage = persistedStorage ? JSON.parse(persistedStorage) : structuredClone(initialData.storage);
    const tree = structuredClone(initialData.tree);
    window.localStorage.setItem('__martabsMockStorage', JSON.stringify(storage));

    function getValue(keys) {
      if (!keys) return { ...storage };
      if (typeof keys === 'string') return { [keys]: storage[keys] };
      if (Array.isArray(keys)) return Object.fromEntries(keys.map((key) => [key, storage[key]]));
      return Object.fromEntries(Object.keys(keys).map((key) => [key, storage[key] ?? keys[key]]));
    }

    window.chrome = {
      runtime: {
        id: 'documentation',
        openOptionsPage: async () => {},
        sendMessage: async () => null,
        onMessage: { addListener: () => {} }
      },
      i18n: {
        getMessage: () => ''
      },
      storage: {
        local: {
          get: async (keys) => getValue(keys),
          set: async (values) => {
            const changes = {};
            for (const [key, value] of Object.entries(values)) {
              changes[key] = { oldValue: storage[key], newValue: value };
              storage[key] = value;
            }
            window.localStorage.setItem('__martabsMockStorage', JSON.stringify(storage));
            listeners.forEach((listener) => listener(changes, 'local'));
          }
        },
        onChanged: {
          addListener: (listener) => listeners.push(listener)
        }
      },
      bookmarks: {
        getTree: async () => tree,
        update: async (id, changes) => {
          const bookmark = storage.bookmarkIndex.find((item) => item.id === id);
          if (bookmark) Object.assign(bookmark, changes);
          return bookmark || null;
        },
        remove: async (id) => {
          storage.bookmarkIndex = storage.bookmarkIndex.filter((item) => item.id !== id);
        },
        onCreated: { addListener: () => {} },
        onChanged: { addListener: () => {} },
        onMoved: { addListener: () => {} },
        onRemoved: { addListener: () => {} }
      },
      permissions: {
        request: async () => true,
        contains: async () => true,
        remove: async () => true
      }
    };
  }, data);
}

async function screenshot(page, name) {
  await page.screenshot({
    path: path.join(screenshotsDir, name),
    fullPage: true
  });
}

test.describe('Capturas de documentacion', () => {
  test('genera capturas publicas con datos de ejemplo', async () => {
    await fs.mkdir(screenshotsDir, { recursive: true });

    const server = await startStaticServer();
    const browser = await chromium.launch({
      executablePath: chromePath,
      headless: true,
      args: ['--no-sandbox']
    });

    try {
      const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
      await installMockApi(page, createMockData('dark'));

      await page.goto(`${server.origin}/src/newtab/newtab.html`);
      await expect(page.locator('.group')).toHaveCount(4);
      await screenshot(page, 'dashboard-dark.png');

      await page.evaluate(async () => {
        const data = await chrome.storage.local.get('settings');
        await chrome.storage.local.set({ settings: { ...data.settings, theme: 'light' } });
      });
      await page.reload();
      await expect(page.locator('.group')).toHaveCount(4);
      await screenshot(page, 'dashboard-light.png');

      await page.evaluate(async () => {
        const data = await chrome.storage.local.get('settings');
        await chrome.storage.local.set({
          settings: {
            ...data.settings,
            theme: 'dark',
            folderModes: {
              'folder-work': 'list',
              'folder-reading': 'icons',
              'folder-tools': 'quicklinks'
            }
          }
        });
      });
      await page.reload();
      await expect(page.locator('.mode-icons')).toBeVisible();
      await expect(page.locator('.mode-quicklinks')).toBeVisible();
      await screenshot(page, 'folder-modes.png');

      await page.locator('#search').fill('docs');
      await expect(page.locator('.result')).toHaveCount(2);
      await screenshot(page, 'search-results.png');

      await page.locator('#search').fill('');
      await expect(page.locator('.bookmark')).toHaveCount(12);
      const githubBookmark = page.locator('.bookmark').filter({ hasText: 'GitHub - Proyecto martabs' }).first();
      await githubBookmark.hover();
      await githubBookmark.locator('.bookmark-edit-btn').click({ force: true });
      await expect(page.locator('#edit-modal')).toBeVisible();
      await screenshot(page, 'edit-bookmark.png');
      await page.locator('#edit-cancel').click();

      await page.goto(`${server.origin}/src/setup/setup.html`);
      await expect(page.locator('#section-folders')).toBeVisible();
      await page.locator('#settings-search').fill('idioma');
      await screenshot(page, 'settings.png');
    } finally {
      await browser.close();
      await server.close();
    }
  });
});
