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

function generateBenchmarkData(folderCount, bookmarksPerFolder) {
  const folders = [];
  const bookmarks = [];

  for (let f = 0; f < folderCount; f++) {
    const folderId = `folder-bench-${f}`;
    const folderTitle = `Folder Bench ${f}`;
    folders.push({ id: folderId, title: folderTitle });

    for (let b = 0; b < bookmarksPerFolder; b++) {
      const bookmarkId = `b-bench-${f}-${b}`;
      const bookmarkTitle = `Bookmark ${f} - ${b} (Title Search)`;
      const url = `https://example.com/bench/${f}/${b}`;
      bookmarks.push({
        id: bookmarkId,
        parentId: folderId,
        title: bookmarkTitle,
        url: url,
        domain: 'example.com',
        folderPath: folderTitle,
        automaticTags: [folderTitle, 'example.com'],
        manualTags: ['bench'],
        dateAdded: 1716800000000 + f * 100000 + b * 1000,
        icon: iconDataUrl('B', '#0f766e')
      });
    }
  }

  const normalizedBookmarks = bookmarks.map((b) => ({
    ...b,
    allTags: [...b.manualTags, ...b.automaticTags],
    linkHealth: null
  }));

  const customFavicons = Object.fromEntries(normalizedBookmarks.map((b) => [b.id, b.icon]));

  const settings = {
    selectedFolderIds: folders.map((f) => f.id),
    automaticTagsEnabled: true,
    manualTagsEnabled: true,
    linkHealthEnabled: false,
    previewEnabled: true,
    previewCaptureEnabled: false,
    showPinnedFolder: false,
    theme: 'dark',
    language: 'en',
    setupComplete: true,
    defaultFolderMode: 'list',
    folderModes: {},
    defaultFolderSort: 'browser',
    folderSorts: {},
    folderBookmarkOrders: {},
    bookmarkFolderOverrides: {},
    folderNameOverrides: {},
    customFavicons,
    brokenCustomFavicons: {},
    customWallpaperEnabled: false,
    customWallpaperType: 'none'
  };

  return {
    folders,
    bookmarks: normalizedBookmarks,
    storage: {
      settings,
      bookmarkIndex: normalizedBookmarks,
      manualTags: Object.fromEntries(normalizedBookmarks.map((b) => [b.id, b.manualTags])),
      linkHealth: {},
      capturedPreviews: {},
      pendingPreviewCaptures: {},
      pinnedBookmarks: []
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
                .filter((b) => b.parentId === folder.id)
                .map((b) => ({
                  id: b.id,
                  title: b.title,
                  url: b.url,
                  parentId: folder.id,
                  dateAdded: b.dateAdded
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
    // Clear localStorage to ensure a clean run
    window.localStorage.removeItem('__martabsMockStorage');
    
    const listeners = [];
    const storage = structuredClone(initialData.storage);
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

test.describe('Performance Benchmark load tests', () => {
  let server;

  test.beforeAll(async () => {
    server = await startStaticServer();
  });

  test.afterAll(async () => {
    await server.close();
  });

  const SCENARIOS = [
    { name: 'A (Baseline: 10 folders x 10 bookmarks = 100 total)', folders: 10, bookmarksPerFolder: 10 },
    { name: 'B (Wide folders: 5 folders x 100 bookmarks = 500 total)', folders: 5, bookmarksPerFolder: 100 },
    { name: 'C (Many columns: 250 folders x 2 bookmarks = 500 total)', folders: 250, bookmarksPerFolder: 2 },
    { name: 'D (Huge load: 50 folders x 40 bookmarks = 2000 total)', folders: 50, bookmarksPerFolder: 40 }
  ];

  for (const scenario of SCENARIOS) {
    test(`Benchmark Scenario ${scenario.name}`, async () => {
      const browser = await chromium.launch({
        executablePath: chromePath,
        headless: true,
        args: ['--no-sandbox']
      });

      const context = await browser.newContext({
        viewport: { width: 1440, height: 900 }
      });

      const page = await context.newPage();

      try {
        console.log(`\n--- Running Scenario: ${scenario.name} ---`);

        // Generate data for this benchmark
        const benchmarkData = generateBenchmarkData(scenario.folders, scenario.bookmarksPerFolder);
        await installMockApi(page, benchmarkData);

        // 1. Measure initial load and rendering time
        const startLoadTime = Date.now();
        await page.goto(`${server.origin}/src/newtab/newtab.html`);
        
        // Wait for first folder element to render
        await page.locator('.group').first().waitFor();
        const loadDurationMs = Date.now() - startLoadTime;

        // Give it a tiny bit of time to settle layout
        await page.waitForTimeout(500);

        // 2. Measure DOM elements size
        const domStats = await page.evaluate(() => {
          return {
            nodes: document.getElementsByTagName('*').length,
            groups: document.querySelectorAll('.group').length,
            bookmarks: document.querySelectorAll('.bookmark').length
          };
        });

        // 3. Measure layout/styling paint metric if supported by browser
        const perfData = await page.evaluate(() => {
          const paint = performance.getEntriesByType('paint');
          const firstMeaningfulPaint = paint.find(entry => entry.name === 'first-contentful-paint');
          return {
            fcp: firstMeaningfulPaint ? firstMeaningfulPaint.startTime : null
          };
        });

        // 4. Measure search performance (typing a general query 'Bookmark' matching all, vs a specific 'Bookmark 0 - 0' matching 1)
        const specificSearchStart = Date.now();
        await page.locator('#search').fill('Bookmark 0 - 0');
        await page.locator('.result').first().waitFor();
        const specificSearchDuration = Date.now() - specificSearchStart;

        // Clear search
        await page.locator('#search').fill('');
        await page.locator('.group').first().waitFor();
        await page.waitForTimeout(300);

        const broadSearchStart = Date.now();
        await page.locator('#search').fill('Title Search');
        await page.locator('.result').first().waitFor();
        const broadSearchDuration = Date.now() - broadSearchStart;

        console.log(`[Metrics] Load Time (Playwright wait): ${loadDurationMs} ms`);
        console.log(`[Metrics] First Contentful Paint: ${perfData.fcp ? perfData.fcp.toFixed(1) + ' ms' : 'N/A'}`);
        console.log(`[Metrics] Total DOM Nodes: ${domStats.nodes}`);
        console.log(`[Metrics] Rendered Folders: ${domStats.groups}`);
        console.log(`[Metrics] Rendered Bookmarks: ${domStats.bookmarks}`);
        console.log(`[Metrics] Specific Search (1 match): ${specificSearchDuration} ms`);
        console.log(`[Metrics] Broad Search (many matches): ${broadSearchDuration} ms`);
        
        // Assert basic visibility to pass the test
        expect(domStats.groups).toBe(scenario.folders);

      } finally {
        await context.close();
        await browser.close();
      }
    });
  }
});
