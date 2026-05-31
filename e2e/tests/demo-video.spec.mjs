import { test, expect, chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import http from 'node:http';
import path from 'node:path';

const rootDir = path.resolve('.');
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

function createMockData(theme = 'dark', language = 'en') {
  const folders = [
    { id: 'folder-dev', title: 'Development' },
    { id: 'folder-design', title: 'Design' },
    { id: 'folder-prod', title: 'Productivity' },
    { id: 'folder-learning', title: 'Learning' },
    { id: 'folder-ref', title: 'Reference' }
  ];

  const bookmarks = [
    { id: 'b-github', parentId: 'folder-dev', title: 'GitHub', url: 'https://github.com', domain: 'github.com', folderPath: 'Development', automaticTags: ['Development', 'github.com'], manualTags: ['code'], dateAdded: 1716800100000, icon: iconDataUrl('GH', '#24292f') },
    { id: 'b-mdn', parentId: 'folder-dev', title: 'MDN Web Docs', url: 'https://developer.mozilla.org', domain: 'developer.mozilla.org', folderPath: 'Development', automaticTags: ['Development', 'mozilla.org'], manualTags: ['docs'], dateAdded: 1716800200000, icon: iconDataUrl('MD', '#8b5cf6') },
    { id: 'b-stackoverflow', parentId: 'folder-dev', title: 'Stack Overflow', url: 'https://stackoverflow.com', domain: 'stackoverflow.com', folderPath: 'Development', automaticTags: ['Development', 'stackoverflow.com'], manualTags: ['help'], dateAdded: 1716800300000, icon: iconDataUrl('SO', '#f48024') },
    { id: 'b-figma', parentId: 'folder-design', title: 'Figma', url: 'https://figma.com', domain: 'figma.com', folderPath: 'Design', automaticTags: ['Design', 'figma.com'], manualTags: ['ux'], dateAdded: 1716800400000, icon: iconDataUrl('FG', '#a259ff') },
    { id: 'b-calendar', parentId: 'folder-prod', title: 'Google Calendar', url: 'https://calendar.google.com', domain: 'calendar.google.com', folderPath: 'Productivity', automaticTags: ['Productivity', 'google.com'], manualTags: ['work'], dateAdded: 1716800500000, icon: iconDataUrl('GC', '#4285f4') },
    { id: 'b-notion', parentId: 'folder-prod', title: 'Notion', url: 'https://notion.so', domain: 'notion.so', folderPath: 'Productivity', automaticTags: ['Productivity', 'notion.so'], manualTags: ['notes'], dateAdded: 1716800600000, icon: iconDataUrl('NT', '#000000') },
    { id: 'b-wikipedia', parentId: 'folder-learning', title: 'Wikipedia', url: 'https://wikipedia.org', domain: 'wikipedia.org', folderPath: 'Learning', automaticTags: ['Learning', 'wikipedia.org'], manualTags: ['wiki'], dateAdded: 1716800700000, icon: iconDataUrl('WK', '#6366f1') },
    { id: 'b-hackernews', parentId: 'folder-learning', title: 'Hacker News', url: 'https://news.ycombinator.com', domain: 'news.ycombinator.com', folderPath: 'Learning', automaticTags: ['Learning', 'ycombinator.com'], manualTags: ['news'], dateAdded: 1716800800000, icon: iconDataUrl('HN', '#ff6600') },
    { id: 'b-openai', parentId: 'folder-ref', title: 'OpenAI', url: 'https://openai.com', domain: 'openai.com', folderPath: 'Reference', automaticTags: ['Reference', 'openai.com'], manualTags: ['ai'], dateAdded: 1716800900000, icon: iconDataUrl('AI', '#10a37f') },
    { id: 'b-firefox-addons', parentId: 'folder-ref', title: 'Firefox Add-ons', url: 'https://addons.mozilla.org', domain: 'addons.mozilla.org', folderPath: 'Reference', automaticTags: ['Reference', 'mozilla.org'], manualTags: ['store'], dateAdded: 1716801000000, icon: iconDataUrl('FF', '#ff941a') }
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
    language: language,
    setupComplete: true,
    defaultFolderMode: 'list',
    folderModes: {
      'folder-dev': 'list',
      'folder-design': 'compact',
      'folder-prod': 'quicklinks',
      'folder-learning': 'list',
      'folder-ref': 'list'
    },
    defaultFolderSort: 'browser',
    folderSorts: {},
    folderBookmarkOrders: {},
    bookmarkFolderOverrides: {},
    folderNameOverrides: {},
    customFavicons,
    brokenCustomFavicons: {},
    customWallpaperEnabled: false,
    customWallpaperType: 'none',
    customWallpaperGradientConfig: {
      type: 'linear',
      colorA: '#ff9a9e',
      colorB: '#fecfef',
      angle: 135,
      presetId: 'sunset-breeze',
      animated: false
    }
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
      pinnedBookmarks: ['b-github', 'b-notion', 'b-openai']
    },
    tree: [
      {
        id: '0',
        title: '',
        children: [
          {
            id: '1',
            title: 'Bookmarks Bar',
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

test.describe('Video Demo Generation', () => {
  test('records clean UI tour with settings and gradients', async () => {
    test.setTimeout(60000);
    // Start local E2E static server
    const server = await startStaticServer();

    const browser = await chromium.launch({
      executablePath: chromePath,
      headless: true,
      args: ['--no-sandbox', '--lang=en']
    });

    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      recordVideo: {
        dir: 'test-results/demo-video',
        size: { width: 1440, height: 900 }
      }
    });

    const page = await context.newPage();

    try {
      // 1. Install Mock API with initial Dark Theme in English
      await installMockApi(page, createMockData('dark', 'en'));

      // 2. Open martabs dashboard
      await page.goto(`${server.origin}/src/newtab/newtab.html`);
      await expect(page.locator('.group')).toHaveCount(6); // Pinned + 5 folders
      
      // Pause briefly on initial dashboard
      await page.waitForTimeout(2500);

      // 3. Search with a short mock query
      await page.locator('#search').click();
      await page.waitForTimeout(500);
      await page.locator('#search').pressSequentially('notion', { delay: 150 });
      await expect(page.locator('.result')).toHaveCount(1);
      await page.waitForTimeout(2000);

      // 4. Clear search
      await page.locator('#search').fill('');
      await page.waitForTimeout(1500);

      // 5. Change view mode of first folder (Development)
      const devFolder = page.locator('.group').filter({ hasText: 'Development' });
      const viewModeBtn = devFolder.locator('.review-button').first();
      
      // Toggle to Compact
      await viewModeBtn.click();
      await page.waitForTimeout(1800);

      // Toggle to Icons
      await viewModeBtn.click();
      await page.waitForTimeout(1800);

      // Toggle back to List (original mode)
      await viewModeBtn.click();
      await page.waitForTimeout(1500);

      // 6. Navigate to Settings page
      await page.locator('#settings').click();
      await page.waitForURL('**/setup/setup.html');
      await expect(page.locator('#section-folders')).toBeVisible();
      await page.waitForTimeout(2000);

      // 7. Click Wallpaper tab on sidebar
      await page.locator('.setup-nav-button[data-section="wallpaper"]').click();
      await expect(page.locator('#section-wallpaper')).toBeVisible();
      await page.waitForTimeout(1500);

      // 8. Select Gradient wallpaper type
      await page.locator('button[data-wallpaper-type="gradient"]').click();
      await expect(page.locator('#wallpaper-gradient-container')).toBeVisible();
      await page.waitForTimeout(1800);

      // 9. Choose preset (Cosmic Violet)
      await page.locator('.gradient-preset-btn[data-preset="cosmic-violet"]').click();
      await page.waitForTimeout(1800);

      // 10. Open Customize accordion
      await page.locator('#gradient-customize-toggle').click();
      await page.waitForTimeout(1500);

      // Enable Aurora animation
      await page.locator('#gradient-animate-checkbox').check();
      await page.waitForTimeout(1800);

      // 11. Save settings
      await page.locator('#save').click();
      await page.waitForTimeout(1500);

      // 12. Return to dashboard
      await page.locator('#back-to-dashboard').click();
      await page.waitForURL('**/newtab/newtab.html');
      
      // 13. Pause on the final dashboard displaying Cosmic Violet animated gradient
      await page.waitForTimeout(5000);

      // Record final states
      console.log('Video flow finished successfully.');
    } finally {
      // 14. Close context and browser to finalize video generation
      const video = page.video();
      await context.close();
      await browser.close();
      await server.close();

      if (video) {
        const videoPath = await video.path();
        await fs.mkdir('docs/assets/demo', { recursive: true });
        await fs.copyFile(videoPath, 'docs/assets/demo/martabs-demo.webm');
        console.log(`E2E Demo Video generated and saved to: docs/assets/demo/martabs-demo.webm`);
      } else {
        throw new Error('Playwright video recorder failed to create the video file.');
      }
    }
  });
});
