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

// Scroll Benchmark utility using requestAnimationFrame & PerformanceObserver
// type can be:
// - 'clean' (scrollTop scroll, no mouse movement)
// - 'interactive' (scrollTop scroll with parallel mouse movement - stress hover)
// - 'wheel' (Playwright real mouse.wheel dispatch)
async function runScrollBenchmark(page, type = 'clean') {
  if (type === 'interactive') {
    await page.mouse.move(300, 200);
  } else if (type === 'wheel') {
    // Move mouse to center of scroll container
    const containerBoundingBox = await page.locator('.content').boundingBox();
    if (containerBoundingBox) {
      const centerX = containerBoundingBox.x + containerBoundingBox.width / 2;
      const centerY = containerBoundingBox.y + containerBoundingBox.height / 2;
      await page.mouse.move(centerX, centerY);
    } else {
      await page.mouse.move(300, 200);
    }
  } else {
    await page.mouse.move(0, 0);
  }

  const scrollPromise = page.evaluate(async (scrollType) => {
    const container = document.querySelector('.content');
    if (!container) return null;

    const longTasks = [];
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        longTasks.push(entry.duration);
      }
    });
    observer.observe({ entryTypes: ['longtask'] });

    const frameTimes = [];
    let lastTime = performance.now();
    const scrollStep = 20; // Scroll step in pixels for scrollTop method
    const maxScroll = Math.min(container.scrollHeight - container.clientHeight, 2000);

    if (maxScroll <= 0) {
      observer.disconnect();
      return { avgFrame: 0, worstFrame: 0, over16: 0, over33: 0, over50: 0, longTasksCount: 0, maxLongTask: 0, duration: 0 };
    }

    container.scrollTop = 0;
    
    // Settle layout
    await new Promise(r => setTimeout(r, 100));
    
    let running = true;
    
    // requestAnimationFrame frame collector
    function step() {
      const now = performance.now();
      const delta = now - lastTime;
      lastTime = now;
      if (running) {
        frameTimes.push(delta);
        requestAnimationFrame(step);
      }
    }
    requestAnimationFrame(step);

    if (scrollType === 'wheel') {
      // For wheel scroll, we wait until container.scrollTop reaches maxScroll or timeout
      await new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (container.scrollTop >= maxScroll) {
            clearInterval(checkInterval);
            running = false;
            resolve();
          }
        }, 30);
        // Fail-safe timeout of 15 seconds
        setTimeout(() => {
          clearInterval(checkInterval);
          running = false;
          resolve();
        }, 15000);
      });
    } else {
      // For scrollTop / interactive methods
      await new Promise((resolve) => {
        function scrollStepFn() {
          if (container.scrollTop >= maxScroll) {
            running = false;
            resolve();
          } else {
            container.scrollTop = Math.min(container.scrollTop + scrollStep, maxScroll);
            requestAnimationFrame(scrollStepFn);
          }
        }
        requestAnimationFrame(scrollStepFn);
      });
    }

    observer.disconnect();

    const totalFrames = frameTimes.length;
    const averageFrame = totalFrames > 0 ? frameTimes.reduce((a, b) => a + b, 0) / totalFrames : 0;
    const worstFrame = frameTimes.length > 0 ? Math.max(...frameTimes) : 0;
    const over16 = frameTimes.filter(t => t > 16.67).length;
    const over33 = frameTimes.filter(t => t > 33.33).length;
    const over50 = frameTimes.filter(t => t > 50).length;

    return {
      avgFrame: averageFrame,
      worstFrame,
      over16,
      over33,
      over50,
      longTasksCount: longTasks.length,
      maxLongTask: longTasks.length > 0 ? Math.max(...longTasks) : 0,
      duration: frameTimes.reduce((a, b) => a + b, 0)
    };
  }, type);

  // If wheel scroll, we trigger wheel ticks from Playwright side in parallel
  if (type === 'wheel') {
    const maxScrollHeight = 2000;
    let currentScroll = 0;
    const wheelStep = 100;
    
    // We send wheel events periodically
    while (currentScroll < maxScrollHeight) {
      // Check if container already scrolled to max or page closed
      const isScrollFinished = await page.evaluate(() => {
        const container = document.querySelector('.content');
        if (!container) return true;
        const maxScroll = Math.min(container.scrollHeight - container.clientHeight, 2000);
        return container.scrollTop >= maxScroll;
      });
      if (isScrollFinished) break;

      await page.mouse.wheel(0, wheelStep);
      currentScroll += wheelStep;
      await page.waitForTimeout(40);
    }
  }

  // If interactive mode (stress hover), move mouse back and forth during scroll to trigger hover/repaint
  if (type === 'interactive') {
    const steps = 30;
    for (let i = 0; i < steps; i++) {
      const x = 200 + (i % 2 === 0 ? 500 : 0);
      const y = 200 + (i * 15) % 400;
      await page.mouse.move(x, y);
      await page.waitForTimeout(40);
    }
  }

  return await scrollPromise;
}

const benchmarkResults = {};

test.describe('Performance Benchmark load tests', () => {
  let server;

  test.beforeAll(async () => {
    server = await startStaticServer();
  });

  test.afterAll(async () => {
    await server.close();

    // Save benchmark results to JSON file
    try {
      const outputDir = path.join(rootDir, 'docs', 'performance');
      await fs.mkdir(outputDir, { recursive: true });
      const outputPath = path.join(outputDir, 'benchmark-v0.9.9-baseline.json');
      
      const reportData = {
        timestamp: new Date().toISOString(),
        scenarios: benchmarkResults
      };
      
      await fs.writeFile(outputPath, JSON.stringify(reportData, null, 2), 'utf-8');
      console.log(`\n[Benchmark] Baseline JSON saved to: ${outputPath}\n`);
    } catch (err) {
      console.error('Failed to save benchmark JSON:', err);
    }
  });

  const SCENARIOS = [
    { name: 'A (Baseline: 10 folders x 10 bookmarks = 100 total)', folders: 10, bookmarksPerFolder: 10 },
    { name: 'B (Wide folders: 5 folders x 100 bookmarks = 500 total)', folders: 5, bookmarksPerFolder: 100 },
    { name: 'C (Many columns: 250 folders x 2 bookmarks = 500 total)', folders: 250, bookmarksPerFolder: 2 },
    { name: 'D (Huge load: 50 folders x 40 bookmarks = 2000 total)', folders: 50, bookmarksPerFolder: 40 }
  ];

  for (const scenario of SCENARIOS) {
    test(`Benchmark Scenario ${scenario.name}`, async () => {
      // Set test timeout to 120 seconds to allow all scrolls to finish
      test.setTimeout(120000);

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

        const benchmarkData = generateBenchmarkData(scenario.folders, scenario.bookmarksPerFolder);
        await installMockApi(page, benchmarkData);

        // 1. Initial Load
        const startLoadTime = Date.now();
        await page.goto(`${server.origin}/src/newtab/newtab.html`);
        await page.locator('.group').first().waitFor();
        const loadDurationMs = Date.now() - startLoadTime;

        await page.waitForTimeout(500);

        // DOM node counts
        const domStats = await page.evaluate(() => {
          return {
            nodes: document.getElementsByTagName('*').length,
            groups: document.querySelectorAll('.group').length,
            bookmarks: document.querySelectorAll('.bookmark').length
          };
        });

        // 2. Clean Scroll
        const cleanScroll = await runScrollBenchmark(page, 'clean');

        // Settle scroll back to top
        await page.evaluate(() => {
          const container = document.querySelector('.content');
          if (container) container.scrollTop = 0;
        });
        await page.waitForTimeout(300);

        // 3. Interactive Scroll (stress hover)
        const interactiveScroll = await runScrollBenchmark(page, 'interactive');

        // Settle back to top
        await page.evaluate(() => {
          const container = document.querySelector('.content');
          if (container) container.scrollTop = 0;
        });
        await page.waitForTimeout(300);

        // 4. Wheel Scroll (Real mouse wheel dispatch)
        const wheelScroll = await runScrollBenchmark(page, 'wheel');

        // Settle back to top
        await page.evaluate(() => {
          const container = document.querySelector('.content');
          if (container) container.scrollTop = 0;
        });
        await page.waitForTimeout(300);

        // 5. Search and Search Scroll
        const broadSearchStart = Date.now();
        await page.locator('#search').fill('Title Search');
        await page.locator('.result').first().waitFor();
        
        // Wait 2 frames to ensure search rendering is fully settled
        await page.evaluate(() => new Promise(requestAnimationFrame));
        await page.evaluate(() => new Promise(requestAnimationFrame));
        
        const broadSearchDuration = Date.now() - broadSearchStart;
        const searchResultCount = await page.locator('.result').count();

        await page.waitForTimeout(300);
        
        // Scroll inside Search Results
        const searchScroll = await runScrollBenchmark(page, 'clean');

        // Clear search
        await page.locator('#search').fill('');
        await page.locator('.group').first().waitFor();
        await page.waitForTimeout(200);

        // Print visual reports
        console.log(`DOM nodes: ${domStats.nodes}`);
        console.log(`load ms: ${loadDurationMs}`);
        console.log(`broad search ms: ${broadSearchDuration}`);
        console.log(`Rendered search results: ${searchResultCount}`);
        
        console.log(`[Clean Scroll] scroll duration ms: ${cleanScroll.duration ? cleanScroll.duration.toFixed(1) : 0}`);
        console.log(`[Clean Scroll] avg frame ms: ${cleanScroll.avgFrame ? cleanScroll.avgFrame.toFixed(2) : 0}`);
        console.log(`[Clean Scroll] worst frame ms: ${cleanScroll.worstFrame ? cleanScroll.worstFrame.toFixed(2) : 0}`);
        console.log(`[Clean Scroll] dropped frames estimate: ${cleanScroll.over16} (frames > 16ms)`);
        console.log(`[Clean Scroll] over 33ms: ${cleanScroll.over33}`);
        console.log(`[Clean Scroll] over 50ms: ${cleanScroll.over50}`);
        console.log(`[Clean Scroll] long tasks count: ${cleanScroll.longTasksCount} (max: ${cleanScroll.maxLongTask ? cleanScroll.maxLongTask.toFixed(1) + 'ms' : '0ms'})`);

        console.log(`[Interactive Scroll - stress hover] scroll duration ms: ${interactiveScroll.duration ? interactiveScroll.duration.toFixed(1) : 0}`);
        console.log(`[Interactive Scroll - stress hover] avg frame ms: ${interactiveScroll.avgFrame ? interactiveScroll.avgFrame.toFixed(2) : 0}`);
        console.log(`[Interactive Scroll - stress hover] worst frame ms: ${interactiveScroll.worstFrame ? interactiveScroll.worstFrame.toFixed(2) : 0}`);
        console.log(`[Interactive Scroll - stress hover] dropped frames estimate: ${interactiveScroll.over16} (frames > 16ms)`);
        console.log(`[Interactive Scroll - stress hover] over 33ms: ${interactiveScroll.over33}`);
        console.log(`[Interactive Scroll - stress hover] over 50ms: ${interactiveScroll.over50}`);
        console.log(`[Interactive Scroll - stress hover] long tasks count: ${interactiveScroll.longTasksCount} (max: ${interactiveScroll.maxLongTask ? interactiveScroll.maxLongTask.toFixed(1) + 'ms' : '0ms'})`);

        console.log(`[Wheel Scroll - real input] scroll duration ms: ${wheelScroll.duration ? wheelScroll.duration.toFixed(1) : 0}`);
        console.log(`[Wheel Scroll - real input] avg frame ms: ${wheelScroll.avgFrame ? wheelScroll.avgFrame.toFixed(2) : 0}`);
        console.log(`[Wheel Scroll - real input] worst frame ms: ${wheelScroll.worstFrame ? wheelScroll.worstFrame.toFixed(2) : 0}`);
        console.log(`[Wheel Scroll - real input] dropped frames estimate: ${wheelScroll.over16} (frames > 16ms)`);
        console.log(`[Wheel Scroll - real input] over 33ms: ${wheelScroll.over33}`);
        console.log(`[Wheel Scroll - real input] over 50ms: ${wheelScroll.over50}`);
        console.log(`[Wheel Scroll - real input] long tasks count: ${wheelScroll.longTasksCount} (max: ${wheelScroll.maxLongTask ? wheelScroll.maxLongTask.toFixed(1) + 'ms' : '0ms'})`);

        console.log(`[Search Scroll] scroll duration ms: ${searchScroll.duration ? searchScroll.duration.toFixed(1) : 0}`);
        console.log(`[Search Scroll] avg frame ms: ${searchScroll.avgFrame ? searchScroll.avgFrame.toFixed(2) : 0}`);
        console.log(`[Search Scroll] worst frame ms: ${searchScroll.worstFrame ? searchScroll.worstFrame.toFixed(2) : 0}`);
        console.log(`[Search Scroll] dropped frames estimate: ${searchScroll.over16} (frames > 16ms)`);
        console.log(`[Search Scroll] over 33ms: ${searchScroll.over33}`);
        console.log(`[Search Scroll] over 50ms: ${searchScroll.over50}`);
        console.log(`[Search Scroll] long tasks count: ${searchScroll.longTasksCount} (max: ${searchScroll.maxLongTask ? searchScroll.maxLongTask.toFixed(1) + 'ms' : '0ms'})`);

        // Save metrics in global map
        benchmarkResults[scenario.name] = {
          domStats,
          loadDurationMs,
          broadSearchDuration,
          searchResultCount,
          cleanScroll,
          interactiveScroll,
          wheelScroll,
          searchScroll
        };

        expect(domStats.groups).toBe(scenario.folders);

      } finally {
        await context.close();
        await browser.close();
      }
    });
  }
});
