# Bookmark Home Extension Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a lightweight WebExtension that replaces the New Tab page with a local, searchable bookmark dashboard for Chrome, with a Firefox-ready architecture.

**Architecture:** Use a vanilla JavaScript extension with a shared domain layer, a browser API adapter, a background service worker, a setup page, and a New Tab UI. Keep browser-specific details in manifest generation and one adapter module so Chrome and Firefox variants can share the same app code.

**Tech Stack:** Manifest V3 WebExtension, vanilla HTML/CSS/JavaScript ES modules, Node.js built-in test runner, Chrome/Firefox WebExtensions APIs.

---

## File Structure

- `package.json`: scripts for tests, build, and packaging checks.
- `README.md`: local install and development instructions.
- `src/manifest.base.json`: shared manifest fields.
- `src/manifest.chrome.json`: Chrome-specific manifest additions.
- `src/manifest.firefox.json`: Firefox-specific manifest additions.
- `src/background/service-worker.js`: extension event listeners, index rebuilds, and scheduled link checks.
- `src/newtab/newtab.html`: New Tab page shell.
- `src/newtab/newtab.css`: New Tab visual design.
- `src/newtab/newtab.js`: New Tab rendering, search, keyboard behavior, tag editing entry points.
- `src/setup/setup.html`: first-run setup page shell.
- `src/setup/setup.css`: setup page styles.
- `src/setup/setup.js`: folder selection and preference saving.
- `src/shared/browser-api.js`: `chrome.*` / `browser.*` adapter.
- `src/shared/storage.js`: typed storage helpers.
- `src/shared/bookmarks.js`: bookmark tree traversal and monitored-folder filtering.
- `src/shared/tags.js`: automatic/manual tag logic.
- `src/shared/search.js`: search normalization and ranking.
- `src/shared/link-health.js`: delayed broken-link state machine.
- `src/shared/render.js`: small DOM helpers used by UI pages.
- `scripts/build.mjs`: writes `dist/chrome` and `dist/firefox`.
- `tests/*.test.js`: Node tests for pure shared modules.

## Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `README.md`
- Create: `src/manifest.base.json`
- Create: `src/manifest.chrome.json`
- Create: `src/manifest.firefox.json`
- Create: `scripts/build.mjs`
- Create: `src/shared/browser-api.js`
- Create: `src/shared/storage.js`

- [ ] **Step 1: Create package scripts**

Create `package.json`:

```json
{
  "name": "bookmark-home-extension",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test tests/*.test.js",
    "build": "node scripts/build.mjs",
    "build:chrome": "node scripts/build.mjs chrome",
    "build:firefox": "node scripts/build.mjs firefox"
  },
  "devDependencies": {}
}
```

- [ ] **Step 2: Create README**

Create `README.md`:

```markdown
# Bookmark Home Extension

Lightweight New Tab bookmark dashboard for Chrome, with a Firefox-ready WebExtension architecture.

## Development

Run tests:

```powershell
npm test
```

Build both browser variants:

```powershell
npm run build
```

Build only Chrome:

```powershell
npm run build:chrome
```

Build only Firefox:

```powershell
npm run build:firefox
```

## Load in Chrome

1. Run `npm run build:chrome`.
2. Open `chrome://extensions`.
3. Enable Developer mode.
4. Load unpacked extension from `dist/chrome`.

## Load in Firefox

1. Run `npm run build:firefox`.
2. Open `about:debugging#/runtime/this-firefox`.
3. Load temporary add-on from `dist/firefox/manifest.json`.
```

- [ ] **Step 3: Add shared manifest**

Create `src/manifest.base.json`:

```json
{
  "manifest_version": 3,
  "name": "Bookmark Home",
  "version": "0.1.0",
  "description": "A fast local New Tab dashboard for your selected bookmark folders.",
  "permissions": ["bookmarks", "storage"],
  "optional_permissions": ["alarms"],
  "optional_host_permissions": ["http://*/*", "https://*/*"],
  "chrome_url_overrides": {
    "newtab": "newtab/newtab.html"
  },
  "background": {
    "service_worker": "background/service-worker.js",
    "type": "module"
  },
  "options_page": "setup/setup.html",
  "action": {
    "default_title": "Bookmark Home"
  },
  "icons": {}
}
```

- [ ] **Step 4: Add browser manifests**

Create `src/manifest.chrome.json`:

```json
{}
```

Create `src/manifest.firefox.json`:

```json
{
  "browser_specific_settings": {
    "gecko": {
      "id": "bookmark-home@example.local",
      "strict_min_version": "109.0"
    }
  }
}
```

- [ ] **Step 5: Add build script**

Create `scripts/build.mjs`:

```js
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";

const root = process.cwd();
const targets = process.argv[2] ? [process.argv[2]] : ["chrome", "firefox"];
const copyPaths = ["src/background", "src/newtab", "src/setup", "src/shared"];

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

function mergeManifest(base, override) {
  return { ...base, ...override };
}

async function buildTarget(target) {
  if (!["chrome", "firefox"].includes(target)) {
    throw new Error(`Unsupported target: ${target}`);
  }

  const outDir = join(root, "dist", target);
  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });

  for (const relative of copyPaths) {
    if (existsSync(join(root, relative))) {
      await cp(join(root, relative), join(outDir, relative.replace(/^src[\\/]/, "")), {
        recursive: true
      });
    }
  }

  const base = await readJson(join(root, "src", "manifest.base.json"));
  const override = await readJson(join(root, "src", `manifest.${target}.json`));
  const manifest = mergeManifest(base, override);
  await writeFile(join(outDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
}

for (const target of targets) {
  await buildTarget(target);
}
```

- [ ] **Step 6: Add browser API adapter**

Create `src/shared/browser-api.js`:

```js
export function getBrowserApi(globalScope = globalThis) {
  const api = globalScope.browser || globalScope.chrome;

  if (!api) {
    throw new Error("WebExtension API is not available");
  }

  const wrap = (fn, context) => (...args) => {
    const result = fn.apply(context, args);
    if (result && typeof result.then === "function") {
      return result;
    }
    return new Promise((resolve, reject) => {
      const lastError = api.runtime?.lastError;
      if (lastError) {
        reject(new Error(lastError.message));
        return;
      }
      resolve(result);
    });
  };

  return {
    bookmarks: {
      getTree: wrap(api.bookmarks.getTree, api.bookmarks),
      onCreated: api.bookmarks.onCreated,
      onChanged: api.bookmarks.onChanged,
      onMoved: api.bookmarks.onMoved,
      onRemoved: api.bookmarks.onRemoved
    },
    runtime: {
      openOptionsPage: api.runtime.openOptionsPage
        ? wrap(api.runtime.openOptionsPage, api.runtime)
        : async () => {}
    },
    storage: {
      local: {
        get: wrap(api.storage.local.get, api.storage.local),
        set: wrap(api.storage.local.set, api.storage.local),
        remove: wrap(api.storage.local.remove, api.storage.local)
      }
    },
    alarms: api.alarms
      ? {
          create: wrap(api.alarms.create, api.alarms),
          clear: wrap(api.alarms.clear, api.alarms),
          onAlarm: api.alarms.onAlarm
        }
      : null,
    permissions: api.permissions
      ? {
          contains: wrap(api.permissions.contains, api.permissions),
          request: wrap(api.permissions.request, api.permissions)
        }
      : null
  };
}
```

- [ ] **Step 7: Add storage wrapper**

Create `src/shared/storage.js`:

```js
const DEFAULT_SETTINGS = {
  selectedFolderIds: [],
  automaticTagsEnabled: true,
  manualTagsEnabled: true,
  linkHealthEnabled: false,
  setupComplete: false
};

export const STORAGE_KEYS = {
  settings: "settings",
  bookmarkIndex: "bookmarkIndex",
  manualTags: "manualTags",
  linkHealth: "linkHealth",
  dismissedLinkWarnings: "dismissedLinkWarnings"
};

export async function getSettings(api) {
  const data = await api.storage.local.get(STORAGE_KEYS.settings);
  return { ...DEFAULT_SETTINGS, ...(data[STORAGE_KEYS.settings] || {}) };
}

export async function saveSettings(api, settings) {
  await api.storage.local.set({
    [STORAGE_KEYS.settings]: { ...DEFAULT_SETTINGS, ...settings }
  });
}

export async function getStoredValue(api, key, fallback) {
  const data = await api.storage.local.get(key);
  return data[key] ?? fallback;
}

export async function setStoredValue(api, key, value) {
  await api.storage.local.set({ [key]: value });
}
```

- [ ] **Step 8: Run build**

Run:

```powershell
npm run build
```

Expected: `dist/chrome/manifest.json` and `dist/firefox/manifest.json` are created.

- [ ] **Step 9: Commit**

Run:

```powershell
git add package.json README.md src scripts
git commit -m "chore: scaffold webextension project"
```

Expected: commit succeeds. If the folder is not a git repository, run `git init` first and then repeat the commit.

## Task 2: Bookmark Normalization And Tags

**Files:**
- Create: `tests/bookmarks.test.js`
- Create: `tests/tags.test.js`
- Create: `src/shared/bookmarks.js`
- Create: `src/shared/tags.js`

- [ ] **Step 1: Write bookmark tests**

Create `tests/bookmarks.test.js`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { buildBookmarkIndex, getFolderOptions } from "../src/shared/bookmarks.js";

const tree = [
  {
    id: "0",
    title: "",
    children: [
      {
        id: "1",
        title: "Bookmarks Bar",
        children: [
          {
            id: "10",
            title: "Trabajo",
            children: [
              {
                id: "100",
                title: "Notion",
                url: "https://notion.so/work",
                dateAdded: 1716500000000
              }
            ]
          }
        ]
      },
      {
        id: "2",
        title: "Other Bookmarks",
        children: [
          {
            id: "20",
            title: "Aprendizaje",
            children: [
              {
                id: "200",
                title: "MDN CSS Grid",
                url: "https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout",
                dateAdded: 1716510000000
              }
            ]
          }
        ]
      }
    ]
  }
];

test("getFolderOptions returns folders with paths", () => {
  const folders = getFolderOptions(tree);
  assert.deepEqual(
    folders.map((folder) => ({ id: folder.id, path: folder.path })),
    [
      { id: "1", path: "Bookmarks Bar" },
      { id: "10", path: "Bookmarks Bar / Trabajo" },
      { id: "2", path: "Other Bookmarks" },
      { id: "20", path: "Other Bookmarks / Aprendizaje" }
    ]
  );
});

test("buildBookmarkIndex only indexes selected folders", () => {
  const index = buildBookmarkIndex(tree, ["10"]);
  assert.equal(index.length, 1);
  assert.equal(index[0].id, "100");
  assert.equal(index[0].title, "Notion");
  assert.equal(index[0].domain, "notion.so");
  assert.equal(index[0].folderPath, "Bookmarks Bar / Trabajo");
});
```

- [ ] **Step 2: Run failing bookmark tests**

Run:

```powershell
npm test
```

Expected: tests fail because `src/shared/bookmarks.js` does not exist.

- [ ] **Step 3: Implement bookmarks module**

Create `src/shared/bookmarks.js`:

```js
function isFolder(node) {
  return Boolean(node.children);
}

function isBookmark(node) {
  return Boolean(node.url);
}

function getDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function walkFolders(nodes, path = [], output = []) {
  for (const node of nodes) {
    const nextPath = node.title ? [...path, node.title] : path;
    if (isFolder(node) && node.title) {
      output.push({
        id: node.id,
        title: node.title,
        path: nextPath.join(" / ")
      });
    }
    if (node.children) {
      walkFolders(node.children, nextPath, output);
    }
  }
  return output;
}

function walkBookmarks(nodes, selectedFolderIds, path = [], insideSelected = false, output = []) {
  for (const node of nodes) {
    const nextPath = node.title && isFolder(node) ? [...path, node.title] : path;
    const selected = insideSelected || selectedFolderIds.includes(node.id);

    if (isBookmark(node) && selected) {
      output.push({
        id: node.id,
        parentId: node.parentId || "",
        title: node.title || node.url,
        url: node.url,
        domain: getDomain(node.url),
        dateAdded: node.dateAdded || null,
        folderPath: path.join(" / "),
        automaticTags: [],
        manualTags: [],
        preview: null,
        linkHealth: null
      });
    }

    if (node.children) {
      walkBookmarks(node.children, selectedFolderIds, nextPath, selected, output);
    }
  }
  return output;
}

export function getFolderOptions(bookmarkTree) {
  return walkFolders(bookmarkTree);
}

export function buildBookmarkIndex(bookmarkTree, selectedFolderIds) {
  return walkBookmarks(bookmarkTree, selectedFolderIds);
}
```

- [ ] **Step 4: Write tag tests**

Create `tests/tags.test.js`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { generateAutomaticTags, mergeTags } from "../src/shared/tags.js";

test("generateAutomaticTags uses folders and domain", () => {
  const tags = generateAutomaticTags({
    title: "MDN CSS Grid",
    url: "https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout",
    domain: "developer.mozilla.org",
    folderPath: "Bookmarks Bar / Aprendizaje / CSS"
  });

  assert.deepEqual(tags, ["aprendizaje", "css", "developer.mozilla.org"]);
});

test("mergeTags keeps manual tags and removes duplicates", () => {
  assert.deepEqual(
    mergeTags(["css", "developer.mozilla.org"], ["CSS", "referencia"]),
    ["css", "developer.mozilla.org", "referencia"]
  );
});
```

- [ ] **Step 5: Run failing tag tests**

Run:

```powershell
npm test
```

Expected: tag tests fail because `src/shared/tags.js` does not exist.

- [ ] **Step 6: Implement tags module**

Create `src/shared/tags.js`:

```js
const IGNORED_FOLDER_NAMES = new Set([
  "bookmarks bar",
  "other bookmarks",
  "mobile bookmarks",
  "barra de marcadores",
  "otros marcadores",
  "marcadores moviles",
  "marcadores móviles"
]);

function normalizeTag(tag) {
  return String(tag || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export function generateAutomaticTags(bookmark) {
  const folderTags = String(bookmark.folderPath || "")
    .split("/")
    .map(normalizeTag)
    .filter(Boolean)
    .filter((tag) => !IGNORED_FOLDER_NAMES.has(tag));

  const domainTag = normalizeTag(bookmark.domain);
  return [...new Set([...folderTags, domainTag].filter(Boolean))];
}

export function mergeTags(automaticTags, manualTags) {
  return [...new Set([...automaticTags, ...manualTags].map(normalizeTag).filter(Boolean))];
}
```

- [ ] **Step 7: Wire tags into bookmarks module**

Modify `src/shared/bookmarks.js`:

```js
import { generateAutomaticTags } from "./tags.js";

function isFolder(node) {
  return Boolean(node.children);
}

function isBookmark(node) {
  return Boolean(node.url);
}

function getDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function walkFolders(nodes, path = [], output = []) {
  for (const node of nodes) {
    const nextPath = node.title ? [...path, node.title] : path;
    if (isFolder(node) && node.title) {
      output.push({
        id: node.id,
        title: node.title,
        path: nextPath.join(" / ")
      });
    }
    if (node.children) {
      walkFolders(node.children, nextPath, output);
    }
  }
  return output;
}

function walkBookmarks(nodes, selectedFolderIds, path = [], insideSelected = false, output = []) {
  for (const node of nodes) {
    const nextPath = node.title && isFolder(node) ? [...path, node.title] : path;
    const selected = insideSelected || selectedFolderIds.includes(node.id);

    if (isBookmark(node) && selected) {
      const bookmark = {
        id: node.id,
        parentId: node.parentId || "",
        title: node.title || node.url,
        url: node.url,
        domain: getDomain(node.url),
        dateAdded: node.dateAdded || null,
        folderPath: path.join(" / "),
        automaticTags: [],
        manualTags: [],
        preview: null,
        linkHealth: null
      };
      bookmark.automaticTags = generateAutomaticTags(bookmark);
      output.push(bookmark);
    }

    if (node.children) {
      walkBookmarks(node.children, selectedFolderIds, nextPath, selected, output);
    }
  }
  return output;
}

export function getFolderOptions(bookmarkTree) {
  return walkFolders(bookmarkTree);
}

export function buildBookmarkIndex(bookmarkTree, selectedFolderIds) {
  return walkBookmarks(bookmarkTree, selectedFolderIds);
}
```

- [ ] **Step 8: Run tests**

Run:

```powershell
npm test
```

Expected: all tests pass.

- [ ] **Step 9: Commit**

Run:

```powershell
git add src/shared/bookmarks.js src/shared/tags.js tests/bookmarks.test.js tests/tags.test.js
git commit -m "feat: normalize bookmarks and tags"
```

Expected: commit succeeds.

## Task 3: Search And Link Health State

**Files:**
- Create: `tests/search.test.js`
- Create: `tests/link-health.test.js`
- Create: `src/shared/search.js`
- Create: `src/shared/link-health.js`

- [ ] **Step 1: Write search tests**

Create `tests/search.test.js`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { searchBookmarks } from "../src/shared/search.js";

const bookmarks = [
  {
    id: "1",
    title: "MDN CSS Grid",
    url: "https://developer.mozilla.org/grid",
    domain: "developer.mozilla.org",
    folderPath: "Aprendizaje / CSS",
    automaticTags: ["aprendizaje", "css"],
    manualTags: ["referencia"]
  },
  {
    id: "2",
    title: "Panel de facturacion",
    url: "https://billing.example.com",
    domain: "billing.example.com",
    folderPath: "Trabajo",
    automaticTags: ["trabajo"],
    manualTags: ["pagos"]
  }
];

test("empty search returns bookmarks unchanged", () => {
  assert.deepEqual(searchBookmarks(bookmarks, ""), bookmarks);
});

test("search matches title, tags, folder, and domain", () => {
  assert.equal(searchBookmarks(bookmarks, "grid")[0].id, "1");
  assert.equal(searchBookmarks(bookmarks, "pagos")[0].id, "2");
  assert.equal(searchBookmarks(bookmarks, "trabajo")[0].id, "2");
  assert.equal(searchBookmarks(bookmarks, "mozilla")[0].id, "1");
});
```

- [ ] **Step 2: Implement search module**

Create `src/shared/search.js`:

```js
function normalize(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function searchableText(bookmark) {
  return normalize([
    bookmark.title,
    bookmark.url,
    bookmark.domain,
    bookmark.folderPath,
    ...(bookmark.automaticTags || []),
    ...(bookmark.manualTags || [])
  ].join(" "));
}

function scoreBookmark(bookmark, terms) {
  const title = normalize(bookmark.title);
  const text = searchableText(bookmark);
  let score = 0;

  for (const term of terms) {
    if (!text.includes(term)) {
      return 0;
    }
    score += title.includes(term) ? 3 : 1;
  }

  return score;
}

export function searchBookmarks(bookmarks, query) {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  if (terms.length === 0) {
    return bookmarks;
  }

  return bookmarks
    .map((bookmark) => ({ bookmark, score: scoreBookmark(bookmark, terms) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.bookmark.title.localeCompare(b.bookmark.title))
    .map((item) => item.bookmark);
}
```

- [ ] **Step 3: Write link health tests**

Create `tests/link-health.test.js`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import {
  applyLinkCheckResult,
  shouldShowLinkWarning
} from "../src/shared/link-health.js";

const day = 24 * 60 * 60 * 1000;
const now = Date.UTC(2026, 4, 24);

test("first failure does not show warning", () => {
  const state = applyLinkCheckResult(null, {
    ok: false,
    status: 404,
    checkedAt: now
  });

  assert.equal(state.consecutiveFailures, 1);
  assert.equal(shouldShowLinkWarning(state, now + day * 2), false);
});

test("failure for at least 10 days shows warning", () => {
  const state = {
    firstFailureAt: now - day * 10,
    lastCheckedAt: now,
    lastStatus: 404,
    lastSuccessAt: null,
    consecutiveFailures: 4,
    dismissedAt: null
  };

  assert.equal(shouldShowLinkWarning(state, now), true);
});

test("success resets failures", () => {
  const state = applyLinkCheckResult(
    { firstFailureAt: now - day * 10, consecutiveFailures: 4 },
    { ok: true, status: 200, checkedAt: now }
  );

  assert.equal(state.consecutiveFailures, 0);
  assert.equal(state.firstFailureAt, null);
  assert.equal(state.lastSuccessAt, now);
});
```

- [ ] **Step 4: Implement link health module**

Create `src/shared/link-health.js`:

```js
const TEN_DAYS_MS = 10 * 24 * 60 * 60 * 1000;

export function applyLinkCheckResult(previousState, result) {
  const previous = previousState || {};

  if (result.ok) {
    return {
      firstFailureAt: null,
      lastCheckedAt: result.checkedAt,
      lastStatus: result.status || 200,
      lastSuccessAt: result.checkedAt,
      consecutiveFailures: 0,
      dismissedAt: previous.dismissedAt || null
    };
  }

  return {
    firstFailureAt: previous.firstFailureAt || result.checkedAt,
    lastCheckedAt: result.checkedAt,
    lastStatus: result.status || "network-error",
    lastSuccessAt: previous.lastSuccessAt || null,
    consecutiveFailures: (previous.consecutiveFailures || 0) + 1,
    dismissedAt: previous.dismissedAt || null
  };
}

export function shouldShowLinkWarning(state, now = Date.now()) {
  if (!state || !state.firstFailureAt || state.consecutiveFailures <= 0) {
    return false;
  }
  if (state.dismissedAt && state.dismissedAt >= state.firstFailureAt) {
    return false;
  }
  return now - state.firstFailureAt >= TEN_DAYS_MS;
}
```

- [ ] **Step 5: Run tests**

Run:

```powershell
npm test
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

Run:

```powershell
git add src/shared/search.js src/shared/link-health.js tests/search.test.js tests/link-health.test.js
git commit -m "feat: add search and link health logic"
```

Expected: commit succeeds.

## Task 4: Background Indexing

**Files:**
- Create: `src/background/service-worker.js`
- Modify: `src/shared/storage.js`

- [ ] **Step 1: Extend storage helpers**

Modify `src/shared/storage.js`:

```js
const DEFAULT_SETTINGS = {
  selectedFolderIds: [],
  automaticTagsEnabled: true,
  manualTagsEnabled: true,
  linkHealthEnabled: false,
  setupComplete: false
};

export const STORAGE_KEYS = {
  settings: "settings",
  bookmarkIndex: "bookmarkIndex",
  manualTags: "manualTags",
  linkHealth: "linkHealth",
  dismissedLinkWarnings: "dismissedLinkWarnings"
};

export async function getSettings(api) {
  const data = await api.storage.local.get(STORAGE_KEYS.settings);
  return { ...DEFAULT_SETTINGS, ...(data[STORAGE_KEYS.settings] || {}) };
}

export async function saveSettings(api, settings) {
  await api.storage.local.set({
    [STORAGE_KEYS.settings]: { ...DEFAULT_SETTINGS, ...settings }
  });
}

export async function getBookmarkIndex(api) {
  return getStoredValue(api, STORAGE_KEYS.bookmarkIndex, []);
}

export async function saveBookmarkIndex(api, bookmarkIndex) {
  await setStoredValue(api, STORAGE_KEYS.bookmarkIndex, bookmarkIndex);
}

export async function getManualTags(api) {
  return getStoredValue(api, STORAGE_KEYS.manualTags, {});
}

export async function saveManualTags(api, manualTags) {
  await setStoredValue(api, STORAGE_KEYS.manualTags, manualTags);
}

export async function getLinkHealth(api) {
  return getStoredValue(api, STORAGE_KEYS.linkHealth, {});
}

export async function saveLinkHealth(api, linkHealth) {
  await setStoredValue(api, STORAGE_KEYS.linkHealth, linkHealth);
}

export async function getStoredValue(api, key, fallback) {
  const data = await api.storage.local.get(key);
  return data[key] ?? fallback;
}

export async function setStoredValue(api, key, value) {
  await api.storage.local.set({ [key]: value });
}
```

- [ ] **Step 2: Create service worker**

Create `src/background/service-worker.js`:

```js
import { getBrowserApi } from "../shared/browser-api.js";
import { buildBookmarkIndex } from "../shared/bookmarks.js";
import { mergeTags } from "../shared/tags.js";
import {
  getLinkHealth,
  getManualTags,
  getSettings,
  saveBookmarkIndex
} from "../shared/storage.js";

const api = getBrowserApi();

async function rebuildIndex() {
  const settings = await getSettings(api);
  if (!settings.setupComplete || settings.selectedFolderIds.length === 0) {
    await saveBookmarkIndex(api, []);
    return [];
  }

  const [tree, manualTags, linkHealth] = await Promise.all([
    api.bookmarks.getTree(),
    getManualTags(api),
    getLinkHealth(api)
  ]);

  const index = buildBookmarkIndex(tree, settings.selectedFolderIds).map((bookmark) => {
    const bookmarkManualTags = manualTags[bookmark.id] || [];
    return {
      ...bookmark,
      manualTags: bookmarkManualTags,
      allTags: mergeTags(bookmark.automaticTags, bookmarkManualTags),
      linkHealth: linkHealth[bookmark.id] || null
    };
  });

  await saveBookmarkIndex(api, index);
  return index;
}

function listenToBookmarkChanges() {
  const scheduleRebuild = () => {
    rebuildIndex().catch((error) => console.error("Bookmark index rebuild failed", error));
  };

  api.bookmarks.onCreated.addListener(scheduleRebuild);
  api.bookmarks.onChanged.addListener(scheduleRebuild);
  api.bookmarks.onMoved.addListener(scheduleRebuild);
  api.bookmarks.onRemoved.addListener(scheduleRebuild);
}

listenToBookmarkChanges();
rebuildIndex().catch((error) => console.error("Initial bookmark index failed", error));
```

- [ ] **Step 3: Run tests and build**

Run:

```powershell
npm test
npm run build
```

Expected: tests pass and both browser builds complete.

- [ ] **Step 4: Commit**

Run:

```powershell
git add src/background/service-worker.js src/shared/storage.js
git commit -m "feat: rebuild bookmark index in background"
```

Expected: commit succeeds.

## Task 5: First-Run Setup UI

**Files:**
- Create: `src/setup/setup.html`
- Create: `src/setup/setup.css`
- Create: `src/setup/setup.js`

- [ ] **Step 1: Create setup HTML**

Create `src/setup/setup.html`:

```html
<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Configurar Bookmark Home</title>
    <link rel="stylesheet" href="./setup.css">
  </head>
  <body>
    <main class="setup-shell">
      <section class="setup-panel">
        <h1>Elegir carpetas</h1>
        <p>Selecciona las carpetas de marcadores que quieres ver en la nueva pestana.</p>
        <div id="folder-list" class="folder-list" aria-live="polite"></div>
        <fieldset>
          <legend>Funciones</legend>
          <label><input id="automatic-tags" type="checkbox" checked> Etiquetas automaticas</label>
          <label><input id="manual-tags" type="checkbox" checked> Etiquetas manuales</label>
          <label><input id="link-health" type="checkbox"> Revisar enlaces caidos en segundo plano</label>
        </fieldset>
        <div class="actions">
          <button id="save" type="button">Guardar configuracion</button>
          <p id="status" role="status"></p>
        </div>
      </section>
    </main>
    <script type="module" src="./setup.js"></script>
  </body>
</html>
```

- [ ] **Step 2: Create setup CSS**

Create `src/setup/setup.css`:

```css
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
  background: #f6f7fa;
  color: #17202a;
  font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.setup-shell {
  display: grid;
  place-items: center;
  min-height: 100vh;
  padding: 24px;
}

.setup-panel {
  width: min(760px, 100%);
  background: #fff;
  border: 1px solid #d0d5dd;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 12px 28px rgba(16, 24, 40, 0.08);
}

h1 {
  margin: 0 0 8px;
  font-size: 28px;
  letter-spacing: 0;
}

p {
  color: #667085;
}

.folder-list {
  display: grid;
  gap: 8px;
  max-height: 320px;
  overflow: auto;
  padding: 8px;
  border: 1px solid #d0d5dd;
  border-radius: 7px;
  background: #fbfcff;
}

label {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
}

fieldset {
  margin: 18px 0 0;
  border: 1px solid #d0d5dd;
  border-radius: 7px;
}

button {
  height: 40px;
  padding: 0 14px;
  border: 0;
  border-radius: 7px;
  background: #2d6cdf;
  color: #fff;
  font-weight: 700;
}

.actions {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: 18px;
}
```

- [ ] **Step 3: Create setup JS**

Create `src/setup/setup.js`:

```js
import { getBrowserApi } from "../shared/browser-api.js";
import { getFolderOptions } from "../shared/bookmarks.js";
import { getSettings, saveSettings } from "../shared/storage.js";

const api = getBrowserApi();
const folderList = document.querySelector("#folder-list");
const saveButton = document.querySelector("#save");
const status = document.querySelector("#status");
const automaticTags = document.querySelector("#automatic-tags");
const manualTags = document.querySelector("#manual-tags");
const linkHealth = document.querySelector("#link-health");

function renderFolders(folders, selectedFolderIds) {
  folderList.innerHTML = "";
  for (const folder of folders) {
    const label = document.createElement("label");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = folder.id;
    checkbox.checked = selectedFolderIds.includes(folder.id);
    label.append(checkbox, document.createTextNode(folder.path));
    folderList.append(label);
  }
}

function getSelectedFolderIds() {
  return [...folderList.querySelectorAll("input:checked")].map((input) => input.value);
}

async function init() {
  const [tree, settings] = await Promise.all([api.bookmarks.getTree(), getSettings(api)]);
  renderFolders(getFolderOptions(tree), settings.selectedFolderIds);
  automaticTags.checked = settings.automaticTagsEnabled;
  manualTags.checked = settings.manualTagsEnabled;
  linkHealth.checked = settings.linkHealthEnabled;
}

saveButton.addEventListener("click", async () => {
  const selectedFolderIds = getSelectedFolderIds();
  if (selectedFolderIds.length === 0) {
    status.textContent = "Selecciona al menos una carpeta.";
    return;
  }

  await saveSettings(api, {
    selectedFolderIds,
    automaticTagsEnabled: automaticTags.checked,
    manualTagsEnabled: manualTags.checked,
    linkHealthEnabled: linkHealth.checked,
    setupComplete: true
  });

  status.textContent = "Configuracion guardada. Abre una nueva pestana para usar Bookmark Home.";
});

init().catch((error) => {
  status.textContent = `No se pudieron cargar las carpetas: ${error.message}`;
});
```

- [ ] **Step 4: Run build**

Run:

```powershell
npm run build
```

Expected: setup files are copied into both `dist/chrome/setup` and `dist/firefox/setup`.

- [ ] **Step 5: Commit**

Run:

```powershell
git add src/setup
git commit -m "feat: add first-run setup"
```

Expected: commit succeeds.

## Task 6: New Tab Dashboard And Search

**Files:**
- Create: `src/shared/render.js`
- Create: `src/newtab/newtab.html`
- Create: `src/newtab/newtab.css`
- Create: `src/newtab/newtab.js`

- [ ] **Step 1: Create DOM helper**

Create `src/shared/render.js`:

```js
export function el(tag, attributes = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attributes)) {
    if (key === "class") node.className = value;
    else if (key === "text") node.textContent = value;
    else node.setAttribute(key, value);
  }
  for (const child of children) {
    node.append(child);
  }
  return node;
}

export function formatDate(timestamp) {
  if (!timestamp) return "";
  return new Intl.DateTimeFormat("es", { day: "2-digit", month: "2-digit", year: "numeric" }).format(timestamp);
}
```

- [ ] **Step 2: Create New Tab HTML**

Create `src/newtab/newtab.html`:

```html
<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Bookmark Home</title>
    <link rel="stylesheet" href="./newtab.css">
  </head>
  <body>
    <main class="app-shell">
      <header class="topbar">
        <div>
          <h1>Inicio</h1>
          <p id="status-line">Cargando marcadores...</p>
        </div>
        <button id="settings" type="button" title="Configurar">Configurar</button>
      </header>
      <label class="search-wrap">
        <span>Buscar</span>
        <input id="search" type="search" autocomplete="off" placeholder="Titulo, etiqueta, URL o carpeta">
      </label>
      <section id="review-links" class="review-links" hidden></section>
      <section id="content" class="content" aria-live="polite"></section>
    </main>
    <script type="module" src="./newtab.js"></script>
  </body>
</html>
```

- [ ] **Step 3: Create New Tab CSS**

Create `src/newtab/newtab.css`:

```css
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
  background: #f6f7fa;
  color: #17202a;
  font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.app-shell {
  width: min(1180px, 100%);
  margin: 0 auto;
  padding: 28px;
}

.topbar {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 18px;
}

h1 {
  margin: 0 0 4px;
  font-size: 28px;
  letter-spacing: 0;
}

p {
  margin: 0;
  color: #667085;
}

button {
  height: 38px;
  padding: 0 12px;
  border: 1px solid #d0d5dd;
  border-radius: 7px;
  background: #fff;
  color: #17202a;
}

.search-wrap {
  display: grid;
  gap: 6px;
  margin-bottom: 16px;
  color: #344054;
  font-weight: 700;
}

#search {
  height: 46px;
  width: 100%;
  border: 1px solid #d0d5dd;
  border-radius: 7px;
  padding: 0 14px;
  font-size: 16px;
}

.content {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 12px;
}

.group,
.result,
.review-links {
  background: #fff;
  border: 1px solid #d0d5dd;
  border-radius: 8px;
  padding: 14px;
  box-shadow: 0 8px 20px rgba(16, 24, 40, 0.06);
}

.group h2 {
  margin: 0 0 8px;
  font-size: 15px;
}

.bookmark {
  display: grid;
  grid-template-columns: 22px 1fr;
  gap: 8px;
  align-items: center;
  padding: 8px 0;
  border-top: 1px solid #eaecf0;
  color: inherit;
  text-decoration: none;
}

.bookmark:first-of-type {
  border-top: 0;
}

.favicon {
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border-radius: 5px;
  background: #eaf1ff;
  color: #2d6cdf;
  font-size: 12px;
  font-weight: 800;
}

.title,
.domain {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.title {
  font-weight: 700;
}

.domain,
.meta {
  color: #667085;
  font-size: 12px;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 6px;
}

.tag {
  border: 1px solid #cfe0ff;
  background: #edf4ff;
  color: #315a9f;
  border-radius: 999px;
  padding: 3px 7px;
  font-size: 11px;
}

.results {
  grid-template-columns: 1fr;
}

.empty {
  color: #667085;
}
```

- [ ] **Step 4: Create New Tab JS**

Create `src/newtab/newtab.js`:

```js
import { getBrowserApi } from "../shared/browser-api.js";
import { searchBookmarks } from "../shared/search.js";
import { getBookmarkIndex, getSettings } from "../shared/storage.js";
import { el, formatDate } from "../shared/render.js";
import { shouldShowLinkWarning } from "../shared/link-health.js";

const api = getBrowserApi();
const statusLine = document.querySelector("#status-line");
const searchInput = document.querySelector("#search");
const content = document.querySelector("#content");
const settingsButton = document.querySelector("#settings");
const reviewLinks = document.querySelector("#review-links");

let bookmarks = [];

function faviconLabel(bookmark) {
  return (bookmark.domain || bookmark.title || "?").slice(0, 1).toUpperCase();
}

function renderTags(bookmark) {
  const tags = bookmark.allTags || [...(bookmark.automaticTags || []), ...(bookmark.manualTags || [])];
  return el("div", { class: "tags" }, tags.slice(0, 4).map((tag) => el("span", { class: "tag", text: tag })));
}

function renderBookmark(bookmark, rich = false) {
  const details = [
    bookmark.domain,
    rich && bookmark.folderPath,
    rich && formatDate(bookmark.dateAdded)
  ].filter(Boolean).join(" · ");

  return el("a", { class: "bookmark", href: bookmark.url }, [
    el("span", { class: "favicon", text: faviconLabel(bookmark) }),
    el("span", {}, [
      el("span", { class: "title", text: bookmark.title }),
      el("span", { class: "domain", text: details }),
      renderTags(bookmark)
    ])
  ]);
}

function groupByFolder(items) {
  return Map.groupBy
    ? Map.groupBy(items, (bookmark) => bookmark.folderPath || "Sin carpeta")
    : items.reduce((map, bookmark) => {
        const key = bookmark.folderPath || "Sin carpeta";
        map.set(key, [...(map.get(key) || []), bookmark]);
        return map;
      }, new Map());
}

function renderDashboard(items) {
  content.classList.remove("results");
  content.innerHTML = "";
  for (const [folder, folderBookmarks] of groupByFolder(items)) {
    content.append(
      el("article", { class: "group" }, [
        el("h2", { text: folder }),
        ...folderBookmarks.map((bookmark) => renderBookmark(bookmark))
      ])
    );
  }
}

function renderResults(items) {
  content.classList.add("results");
  content.innerHTML = "";
  if (items.length === 0) {
    content.append(el("p", { class: "empty", text: "No hay resultados." }));
    return;
  }
  for (const bookmark of items) {
    content.append(el("article", { class: "result" }, [renderBookmark(bookmark, true)]));
  }
}

function renderReviewLinks(items) {
  const warnings = items.filter((bookmark) => shouldShowLinkWarning(bookmark.linkHealth));
  reviewLinks.hidden = warnings.length === 0;
  reviewLinks.innerHTML = warnings.length
    ? `<strong>Revisar enlaces</strong><p>${warnings.length} marcador(es) fallan hace al menos 10 dias.</p>`
    : "";
}

function render() {
  const query = searchInput.value;
  const results = searchBookmarks(bookmarks, query);
  statusLine.textContent = `${bookmarks.length} marcador(es) monitoreados`;
  renderReviewLinks(bookmarks);
  if (query.trim()) renderResults(results);
  else renderDashboard(bookmarks);
}

async function init() {
  const settings = await getSettings(api);
  if (!settings.setupComplete) {
    statusLine.textContent = "Configura tus carpetas para empezar.";
    content.append(el("p", { class: "empty", text: "Abre Configurar y elige una o mas carpetas." }));
    return;
  }
  bookmarks = await getBookmarkIndex(api);
  render();
  searchInput.focus();
}

searchInput.addEventListener("input", render);
searchInput.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    searchInput.value = "";
    render();
  }
  if (event.key === "Enter") {
    const [first] = searchBookmarks(bookmarks, searchInput.value);
    if (first) location.href = first.url;
  }
});

settingsButton.addEventListener("click", () => api.runtime.openOptionsPage());

init().catch((error) => {
  statusLine.textContent = `No se pudieron cargar los marcadores: ${error.message}`;
});
```

- [ ] **Step 5: Run build**

Run:

```powershell
npm run build
```

Expected: New Tab files are copied into both browser builds.

- [ ] **Step 6: Manual browser smoke test**

Run:

```powershell
npm run build:chrome
```

Then load `dist/chrome` as an unpacked extension in Chrome. Expected: opening a new tab shows the Bookmark Home UI or setup prompt.

- [ ] **Step 7: Commit**

Run:

```powershell
git add src/newtab src/shared/render.js
git commit -m "feat: add new tab dashboard"
```

Expected: commit succeeds.

## Task 7: Optional Link Health Checks

**Files:**
- Modify: `src/background/service-worker.js`
- Modify: `src/shared/storage.js`

- [ ] **Step 1: Add health check storage helper**

Modify `src/shared/storage.js` by keeping previous exports and ensuring `getLinkHealth` / `saveLinkHealth` exist exactly as introduced in Task 4.

Expected: `src/shared/storage.js` exports `getLinkHealth` and `saveLinkHealth`.

- [ ] **Step 2: Extend service worker with alarm scheduling**

Modify `src/background/service-worker.js`:

```js
import { getBrowserApi } from "../shared/browser-api.js";
import { buildBookmarkIndex } from "../shared/bookmarks.js";
import { applyLinkCheckResult } from "../shared/link-health.js";
import { mergeTags } from "../shared/tags.js";
import {
  getBookmarkIndex,
  getLinkHealth,
  getManualTags,
  getSettings,
  saveBookmarkIndex,
  saveLinkHealth
} from "../shared/storage.js";

const api = getBrowserApi();
const LINK_HEALTH_ALARM = "bookmark-home-link-health";
const BATCH_SIZE = 5;
const TIMEOUT_MS = 8000;

async function rebuildIndex() {
  const settings = await getSettings(api);
  if (!settings.setupComplete || settings.selectedFolderIds.length === 0) {
    await saveBookmarkIndex(api, []);
    return [];
  }

  const [tree, manualTags, linkHealth] = await Promise.all([
    api.bookmarks.getTree(),
    getManualTags(api),
    getLinkHealth(api)
  ]);

  const index = buildBookmarkIndex(tree, settings.selectedFolderIds).map((bookmark) => {
    const bookmarkManualTags = manualTags[bookmark.id] || [];
    return {
      ...bookmark,
      manualTags: bookmarkManualTags,
      allTags: mergeTags(bookmark.automaticTags, bookmarkManualTags),
      linkHealth: linkHealth[bookmark.id] || null
    };
  });

  await saveBookmarkIndex(api, index);
  return index;
}

async function checkUrl(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      method: "HEAD",
      cache: "no-store",
      signal: controller.signal
    });
    return {
      ok: response.ok || (response.status >= 300 && response.status < 400),
      status: response.status,
      checkedAt: Date.now()
    };
  } catch {
    return {
      ok: false,
      status: "network-error",
      checkedAt: Date.now()
    };
  } finally {
    clearTimeout(timeout);
  }
}

function pickHealthBatch(bookmarks, linkHealth) {
  return [...bookmarks]
    .sort((a, b) => {
      const aChecked = linkHealth[a.id]?.lastCheckedAt || 0;
      const bChecked = linkHealth[b.id]?.lastCheckedAt || 0;
      return aChecked - bChecked;
    })
    .slice(0, BATCH_SIZE);
}

async function runLinkHealthCheck() {
  const settings = await getSettings(api);
  if (!settings.linkHealthEnabled) return;

  const [bookmarks, linkHealth] = await Promise.all([getBookmarkIndex(api), getLinkHealth(api)]);
  const batch = pickHealthBatch(bookmarks, linkHealth);

  for (const bookmark of batch) {
    const result = await checkUrl(bookmark.url);
    linkHealth[bookmark.id] = applyLinkCheckResult(linkHealth[bookmark.id], result);
  }

  await saveLinkHealth(api, linkHealth);
  await rebuildIndex();
}

async function syncLinkHealthAlarm() {
  const settings = await getSettings(api);
  if (!api.alarms) return;
  if (settings.linkHealthEnabled) {
    await api.alarms.create(LINK_HEALTH_ALARM, { periodInMinutes: 24 * 60 });
  } else {
    await api.alarms.clear(LINK_HEALTH_ALARM);
  }
}

function listenToBookmarkChanges() {
  const scheduleRebuild = () => {
    rebuildIndex().catch((error) => console.error("Bookmark index rebuild failed", error));
  };

  api.bookmarks.onCreated.addListener(scheduleRebuild);
  api.bookmarks.onChanged.addListener(scheduleRebuild);
  api.bookmarks.onMoved.addListener(scheduleRebuild);
  api.bookmarks.onRemoved.addListener(scheduleRebuild);
}

listenToBookmarkChanges();

if (api.alarms) {
  api.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === LINK_HEALTH_ALARM) {
      runLinkHealthCheck().catch((error) => console.error("Link health check failed", error));
    }
  });
}

rebuildIndex().catch((error) => console.error("Initial bookmark index failed", error));
syncLinkHealthAlarm().catch((error) => console.error("Link health alarm setup failed", error));
```

- [ ] **Step 3: Build**

Run:

```powershell
npm run build
```

Expected: build completes. Link checking remains optional through settings.

- [ ] **Step 4: Commit**

Run:

```powershell
git add src/background/service-worker.js src/shared/storage.js
git commit -m "feat: add optional link health checks"
```

Expected: commit succeeds.

## Task 8: Final Verification And Packaging

**Files:**
- Modify: `README.md`
- Verify: `dist/chrome/manifest.json`
- Verify: `dist/firefox/manifest.json`

- [ ] **Step 1: Run automated checks**

Run:

```powershell
npm test
npm run build
```

Expected: tests pass and both builds complete.

- [ ] **Step 2: Inspect generated manifests**

Run:

```powershell
Get-Content dist/chrome/manifest.json
Get-Content dist/firefox/manifest.json
```

Expected: Chrome manifest contains base extension fields. Firefox manifest also contains `browser_specific_settings.gecko`.

- [ ] **Step 3: Manual Chrome verification**

Load `dist/chrome` unpacked in Chrome.

Expected:

- New Tab is replaced by Bookmark Home.
- Setup opens from the Configure button.
- Selecting folders and saving produces a populated New Tab after reloading.
- Search filters visible bookmarks.
- Enter opens the first search result.
- Escape clears search.

- [ ] **Step 4: Manual Firefox verification**

Load `dist/firefox/manifest.json` as a temporary add-on in Firefox.

Expected:

- The add-on loads without manifest errors.
- New Tab override works.
- Setup can read the bookmark folder tree.
- Search and dashboard work from local storage.

- [ ] **Step 5: Update README with verification notes**

Append to `README.md`:

```markdown
## Verification Checklist

- `npm test`
- `npm run build`
- Chrome unpacked extension from `dist/chrome`
- Firefox temporary add-on from `dist/firefox/manifest.json`

The New Tab page must remain usable even if optional link checks are disabled or lack host permissions.
```

- [ ] **Step 6: Commit**

Run:

```powershell
git add README.md dist
git commit -m "docs: add verification checklist"
```

Expected: commit succeeds. If generated `dist` files should not be committed, skip adding `dist` and commit only `README.md`.

## Self-Review

- Spec coverage: setup, monitored folders, New Tab override, dashboard, search, tags, local previews, link health, Chrome/Firefox-ready architecture, storage, and publishing considerations all map to tasks.
- Deliberate deferral: screenshot previews, cloud sync, accounts, AI summaries, and full bookmark reorganization remain out of scope.
- Placeholder scan: no task contains open placeholders; each code-producing step includes concrete content.
- Type consistency: bookmark fields use `id`, `title`, `url`, `domain`, `folderPath`, `automaticTags`, `manualTags`, `allTags`, `dateAdded`, `preview`, and `linkHealth` consistently across modules.
