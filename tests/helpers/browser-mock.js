export function createBrowserMock(initialState = {}) {
  const storageData = initialState.storage || {};
  const bookmarksTree = initialState.bookmarks || [];
  const manifest = initialState.manifest || { version: "0.9.4" };
  
  const calls = {
    storageGet: [],
    storageSet: [],
    storageRemove: [],
    bookmarksGetTree: [],
    bookmarksUpdate: [],
    bookmarksRemove: [],
    bookmarksCreate: [],
    runtimeSendMessage: [],
    runtimeOpenOptionsPage: [],
    runtimeGetManifest: [],
    runtimeGetURL: [],
    tabsCreate: [],
    tabsGet: [],
    tabsCaptureVisibleTab: [],
    permissionsContains: [],
    permissionsRequest: [],
    permissionsRemove: [],
    topSitesGet: [],
    i18nGetMessage: []
  };

  const listeners = {
    bookmarksOnCreated: [],
    bookmarksOnChanged: [],
    bookmarksOnMoved: [],
    bookmarksOnRemoved: [],
    storageOnChanged: [],
    runtimeOnMessage: [],
    tabsOnUpdated: [],
    tabsOnRemoved: []
  };

  const runtimeMock = {
    id: "mock-extension-id",
    lastError: null,
    sendMessage: (msg, responseCallback) => {
      calls.runtimeSendMessage.push([msg]);
      if (initialState.shouldFailRuntimeMessage) {
        runtimeMock.lastError = { message: "Failed to send message" };
        if (responseCallback) responseCallback();
        return Promise.reject(new Error("Failed to send message"));
      }
      runtimeMock.lastError = null;
      if (responseCallback) responseCallback({ success: true });
      return Promise.resolve({ success: true });
    },
    onMessage: {
      addListener: (cb) => listeners.runtimeOnMessage.push(cb),
      removeListener: () => {}
    },
    openOptionsPage: (callback) => {
      calls.runtimeOpenOptionsPage.push([]);
      if (initialState.shouldFailOptionsPage) {
        runtimeMock.lastError = { message: "Failed to open options" };
        if (callback) callback();
        return Promise.reject(new Error("Failed to open options"));
      }
      runtimeMock.lastError = null;
      if (callback) callback();
      return Promise.resolve();
    },
    getManifest: () => {
      calls.runtimeGetManifest.push([]);
      return manifest;
    },
    getURL: (path) => {
      calls.runtimeGetURL.push([path]);
      return `chrome-extension://mock-id/${path}`;
    }
  };

  const mock = {
    calls,
    i18n: {
      getMessage: (key, substitutions) => {
        calls.i18nGetMessage.push([key, substitutions]);
        if (initialState.translations && initialState.translations[key]) {
          let message = initialState.translations[key].message || "";
          if (substitutions) {
            const subs = Array.isArray(substitutions) ? substitutions : [substitutions];
            subs.forEach((sub, i) => {
              message = message.replace(`$${i + 1}`, sub);
            });
          }
          return message;
        }
        return key;
      }
    },
    bookmarks: {
      getTree: (callback) => {
        calls.bookmarksGetTree.push([]);
        if (initialState.shouldFailBookmarks) {
          runtimeMock.lastError = { message: "Bookmarks error" };
          if (callback) callback();
          return Promise.reject(new Error("Bookmarks error"));
        }
        runtimeMock.lastError = null;
        if (callback) callback(bookmarksTree);
        return Promise.resolve(bookmarksTree);
      },
      update: (id, changes, callback) => {
        calls.bookmarksUpdate.push([id, changes]);
        if (initialState.shouldFailBookmarks) {
          runtimeMock.lastError = { message: "Bookmarks update error" };
          if (callback) callback();
          return Promise.reject(new Error("Bookmarks update error"));
        }
        runtimeMock.lastError = null;
        if (callback) callback(changes);
        return Promise.resolve(changes);
      },
      remove: (id, callback) => {
        calls.bookmarksRemove.push([id]);
        if (initialState.shouldFailBookmarks) {
          runtimeMock.lastError = { message: "Bookmarks remove error" };
          if (callback) callback();
          return Promise.reject(new Error("Bookmarks remove error"));
        }
        runtimeMock.lastError = null;
        if (callback) callback();
        return Promise.resolve();
      },
      create: (bookmark, callback) => {
        calls.bookmarksCreate.push([bookmark]);
        if (initialState.shouldFailBookmarks) {
          runtimeMock.lastError = { message: "Bookmarks create error" };
          if (callback) callback();
          return Promise.reject(new Error("Bookmarks create error"));
        }
        runtimeMock.lastError = null;
        if (callback) callback(bookmark);
        return Promise.resolve(bookmark);
      },
      onCreated: { addListener: (cb) => listeners.bookmarksOnCreated.push(cb), removeListener: () => {} },
      onChanged: { addListener: (cb) => listeners.bookmarksOnChanged.push(cb), removeListener: () => {} },
      onMoved: { addListener: (cb) => listeners.bookmarksOnMoved.push(cb), removeListener: () => {} },
      onRemoved: { addListener: (cb) => listeners.bookmarksOnRemoved.push(cb), removeListener: () => {} }
    },
    runtime: runtimeMock,
    tabs: {
      create: (options, callback) => {
        calls.tabsCreate.push([options]);
        if (initialState.shouldFailTabs) {
          runtimeMock.lastError = { message: "Tabs create error" };
          if (callback) callback();
          return Promise.reject(new Error("Tabs create error"));
        }
        runtimeMock.lastError = null;
        const createdTab = { id: 123, ...options };
        if (callback) callback(createdTab);
        return Promise.resolve(createdTab);
      },
      get: (tabId, callback) => {
        calls.tabsGet.push([tabId]);
        if (initialState.shouldFailTabs) {
          runtimeMock.lastError = { message: "Tabs get error" };
          if (callback) callback();
          return Promise.reject(new Error("Tabs get error"));
        }
        runtimeMock.lastError = null;
        const tabState = (initialState.tabsState && initialState.tabsState[tabId]) || {
          id: tabId,
          active: true,
          windowId: 123,
          url: "https://example.com"
        };
        if (callback) callback(tabState);
        return Promise.resolve(tabState);
      },
      captureVisibleTab: (windowId, options, callback) => {
        let winId = windowId;
        let opt = options;
        let cb = callback;
        if (typeof windowId === "function") {
          cb = windowId;
          winId = null;
          opt = null;
        } else if (typeof options === "function") {
          cb = options;
          opt = null;
        }
        calls.tabsCaptureVisibleTab.push([winId, opt]);
        if (initialState.shouldFailTabs) {
          runtimeMock.lastError = { message: "Tabs capture error" };
          if (cb) cb();
          return Promise.reject(new Error("Tabs capture error"));
        }
        runtimeMock.lastError = null;
        const captureResult = "data:image/png;base64,mock";
        if (cb) cb(captureResult);
        return Promise.resolve(captureResult);
      },
      onUpdated: { addListener: (cb) => listeners.tabsOnUpdated.push(cb), removeListener: () => {} },
      onRemoved: { addListener: (cb) => listeners.tabsOnRemoved.push(cb), removeListener: () => {} }
    },
    storage: {
      local: {
        get: (keys, callback) => {
          calls.storageGet.push([keys]);
          if (initialState.shouldFailStorage) {
            runtimeMock.lastError = { message: "Storage get error" };
            if (callback) callback();
            return Promise.reject(new Error("Storage get error"));
          }
          runtimeMock.lastError = null;
          let result = {};
          if (keys === null) {
            result = { ...storageData };
          } else if (typeof keys === "string") {
            result = { [keys]: storageData[keys] };
          } else if (Array.isArray(keys)) {
            keys.forEach(k => { result[k] = storageData[k]; });
          } else if (typeof keys === "object") {
            Object.entries(keys).forEach(([k, defaultVal]) => {
              result[k] = storageData[k] !== undefined ? storageData[k] : defaultVal;
            });
          } else {
            result = { ...storageData };
          }
          if (callback) callback(result);
          return Promise.resolve(result);
        },
        set: (items, callback) => {
          calls.storageSet.push([items]);
          if (initialState.shouldFailStorage) {
            runtimeMock.lastError = { message: "Storage set error" };
            if (callback) callback();
            return Promise.reject(new Error("Storage set error"));
          }
          runtimeMock.lastError = null;
          Object.assign(storageData, items);
          if (callback) callback();
          return Promise.resolve();
        },
        remove: (keys, callback) => {
          calls.storageRemove.push([keys]);
          if (initialState.shouldFailStorage) {
            runtimeMock.lastError = { message: "Storage remove error" };
            if (callback) callback();
            return Promise.reject(new Error("Storage remove error"));
          }
          runtimeMock.lastError = null;
          const arr = Array.isArray(keys) ? keys : [keys];
          arr.forEach(k => delete storageData[k]);
          if (callback) callback();
          return Promise.resolve();
        }
      },
      onChanged: { addListener: (cb) => listeners.storageOnChanged.push(cb), removeListener: () => {} }
    },
    permissions: {
      contains: (perm, callback) => {
        calls.permissionsContains.push([perm]);
        if (initialState.shouldFailPermissions) {
          runtimeMock.lastError = { message: "Permissions error" };
          if (callback) callback();
          return Promise.reject(new Error("Permissions error"));
        }
        runtimeMock.lastError = null;
        const origins = perm.origins || [];
        const perms = perm.permissions || [];
        const hasOrigins = origins.every(o => (initialState.grantedOrigins || []).includes(o));
        const hasPerms = perms.every(p => (initialState.grantedPermissions || []).includes(p));
        const result = hasOrigins && hasPerms;
        if (callback) callback(result);
        return Promise.resolve(result);
      },
      request: (perm, callback) => {
        calls.permissionsRequest.push([perm]);
        if (initialState.shouldDenyPermissions) {
          runtimeMock.lastError = null;
          if (callback) callback(false);
          return Promise.resolve(false);
        }
        if (initialState.shouldFailPermissions) {
          runtimeMock.lastError = { message: "Permissions request error" };
          if (callback) callback();
          return Promise.reject(new Error("Permissions request error"));
        }
        runtimeMock.lastError = null;
        if (callback) callback(true);
        return Promise.resolve(true);
      },
      remove: (perm, callback) => {
        calls.permissionsRemove.push([perm]);
        if (initialState.shouldFailPermissions) {
          runtimeMock.lastError = { message: "Permissions remove error" };
          if (callback) callback();
          return Promise.reject(new Error("Permissions remove error"));
        }
        runtimeMock.lastError = null;
        if (callback) callback(true);
        return Promise.resolve(true);
      }
    },
    topSites: {
      get: (callback) => {
        calls.topSitesGet.push([]);
        if (initialState.shouldFailTopSites) {
          runtimeMock.lastError = { message: "TopSites error" };
          if (callback) callback();
          return Promise.reject(new Error("TopSites error"));
        }
        runtimeMock.lastError = null;
        const sites = initialState.topSites || [];
        if (callback) callback(sites);
        return Promise.resolve(sites);
      }
    }
  };

  mock.listeners = listeners;
  return mock;
}
