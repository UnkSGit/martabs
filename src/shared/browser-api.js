export function getBrowserApi(globalScope = globalThis) {
  const api = globalScope.browser || globalScope.chrome;

  if (!api) {
    throw new Error("WebExtension API is not available");
  }

  const wrapAsyncCallback = (fn, context) => (...args) => {
    return new Promise((resolve, reject) => {
      const callback = (res) => {
        const err = api.runtime?.lastError;
        if (err) {
          reject(new Error(err.message));
        } else {
          resolve(res);
        }
      };

      try {
        const result = fn.apply(context, [...args, callback]);
        if (result && typeof result.then === "function") {
          result.then(resolve, reject);
        }
      } catch (err) {
        reject(err);
      }
    });
  };

  return {
    i18n: {
      getMessage: api.i18n
        ? (messageName, substitutions) => api.i18n.getMessage(messageName, substitutions)
        : (messageName) => messageName
    },
    bookmarks: api.bookmarks
      ? {
          getTree: wrapAsyncCallback(api.bookmarks.getTree, api.bookmarks),
          update: api.bookmarks.update ? wrapAsyncCallback(api.bookmarks.update, api.bookmarks) : async () => {},
          remove: api.bookmarks.remove ? wrapAsyncCallback(api.bookmarks.remove, api.bookmarks) : async () => {},
          create: api.bookmarks.create ? wrapAsyncCallback(api.bookmarks.create, api.bookmarks) : async () => {},
          onCreated: api.bookmarks.onCreated,
          onChanged: api.bookmarks.onChanged,
          onMoved: api.bookmarks.onMoved,
          onRemoved: api.bookmarks.onRemoved
        }
      : null,
    runtime: {
      id: api.runtime?.id || "",
      sendMessage: api.runtime.sendMessage
        ? wrapAsyncCallback(api.runtime.sendMessage, api.runtime)
        : async () => null,
      onMessage: api.runtime.onMessage,
      openOptionsPage: api.runtime.openOptionsPage
        ? wrapAsyncCallback(api.runtime.openOptionsPage, api.runtime)
        : async () => {},
      getManifest: api.runtime?.getManifest
        ? () => api.runtime.getManifest()
        : () => ({ version: "0.9.4" }),
      getURL: api.runtime?.getURL
        ? (path) => api.runtime.getURL(path)
        : (path) => path
    },
    tabs: api.tabs
      ? {
          create: api.tabs.create
            ? wrapAsyncCallback(api.tabs.create, api.tabs)
            : async () => null,
          get: api.tabs.get
            ? wrapAsyncCallback(api.tabs.get, api.tabs)
            : async () => null,
          captureVisibleTab: api.tabs.captureVisibleTab
            ? wrapAsyncCallback(api.tabs.captureVisibleTab, api.tabs)
            : async () => null,
          onUpdated: api.tabs.onUpdated,
          onRemoved: api.tabs.onRemoved
        }
      : null,
    storage: api.storage
      ? {
          local: {
            get: wrapAsyncCallback(api.storage.local.get, api.storage.local),
            set: wrapAsyncCallback(api.storage.local.set, api.storage.local),
            remove: api.storage.local["remove"]
              ? wrapAsyncCallback(api.storage.local["remove"], api.storage.local)
              : async () => {}
          },
          onChanged: api.storage.onChanged
        }
      : null,
    permissions: api.permissions
      ? {
          request: wrapAsyncCallback(api.permissions.request, api.permissions),
          contains: api.permissions.contains
            ? wrapAsyncCallback(api.permissions.contains, api.permissions)
            : async () => false,
          remove: api.permissions.remove
            ? wrapAsyncCallback(api.permissions.remove, api.permissions)
            : async () => false
        }
      : null,
    topSites: api.topSites
      ? {
          get: wrapAsyncCallback(api.topSites.get, api.topSites)
        }
      : null
  };
}
