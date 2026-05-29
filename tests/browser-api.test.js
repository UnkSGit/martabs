import test from "node:test";
import assert from "node:assert/strict";
import { getBrowserApi } from "../src/shared/browser-api.js";
import { createBrowserMock } from "./helpers/browser-mock.js";

test("getBrowserApi exposes bookmarks, runtime, tabs, storage, permissions and topSites", () => {
  const browserMock = createBrowserMock({
    storage: { key: "value" }
  });
  
  const api = getBrowserApi({ chrome: browserMock });
  
  assert.ok(api.i18n);
  assert.ok(api.bookmarks);
  assert.ok(api.runtime);
  assert.ok(api.tabs);
  assert.ok(api.storage);
  assert.ok(api.permissions);
  assert.ok(api.topSites);
});

test("synchronous methods return values directly (not Promises)", () => {
  const browserMock = createBrowserMock({
    manifest: { version: "1.2.3" }
  });
  const api = getBrowserApi({ chrome: browserMock });
  
  // runtime.getManifest
  const manifest = api.runtime.getManifest();
  assert.strictEqual(typeof manifest, "object");
  assert.strictEqual(manifest.version, "1.2.3");
  assert.ok(!(manifest instanceof Promise));

  // runtime.getURL
  const url = api.runtime.getURL("icons/icon.png");
  assert.strictEqual(typeof url, "string");
  assert.match(url, /chrome-extension:\/\//);
  assert.ok(!(url instanceof Promise));

  // i18n.getMessage
  const msg = api.i18n.getMessage("extensionName");
  assert.strictEqual(typeof msg, "string");
  assert.strictEqual(msg, "extensionName"); // since no translations provided, returns key
  assert.ok(!(msg instanceof Promise));
});

test("wrapAsyncCallback handles Firefox-style Promise returns", async () => {
  const originalBookmarks = {
    getTree: () => Promise.resolve([{ id: "1", title: "Folder" }])
  };
  const chromeMock = {
    bookmarks: originalBookmarks,
    runtime: {}
  };
  
  const api = getBrowserApi({ chrome: chromeMock });
  const tree = await api.bookmarks.getTree();
  assert.deepEqual(tree, [{ id: "1", title: "Folder" }]);
});

test("wrapAsyncCallback handles Chrome-style Callbacks", async () => {
  const chromeMock = {
    runtime: {
      lastError: null
    },
    storage: {
      local: {
        get: (keys, callback) => {
          setTimeout(() => {
            callback({ testKey: "testValue" });
          }, 0);
          return undefined;
        }
      }
    }
  };

  const api = getBrowserApi({ chrome: chromeMock });
  const result = await api.storage.local.get("testKey");
  assert.deepEqual(result, { testKey: "testValue" });
});

test("wrapAsyncCallback rejects on callback error (runtime.lastError)", async () => {
  const chromeMock = {
    runtime: {
      lastError: { message: "Mocked Chrome Error" }
    },
    storage: {
      local: {
        get: (keys, callback) => {
          setTimeout(() => {
            callback(undefined);
          }, 0);
          return undefined;
        }
      }
    }
  };

  const api = getBrowserApi({ chrome: chromeMock });
  await assert.rejects(
    async () => {
      await api.storage.local.get("testKey");
    },
    /Mocked Chrome Error/
  );
});

test("createBrowserMock tracks calls and simulates errors", async () => {
  const browserMock = createBrowserMock({
    shouldFailStorage: true
  });
  
  const api = getBrowserApi({ chrome: browserMock });
  
  await assert.rejects(
    async () => {
      await api.storage.local.get("anyKey");
    },
    /Storage get error/
  );
  
  assert.strictEqual(browserMock.calls.storageGet.length, 1);
  assert.deepEqual(browserMock.calls.storageGet[0], ["anyKey"]);
});
