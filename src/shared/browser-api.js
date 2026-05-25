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
      update: api.bookmarks.update ? wrap(api.bookmarks.update, api.bookmarks) : async () => {},
      remove: api.bookmarks.remove ? wrap(api.bookmarks.remove, api.bookmarks) : async () => {},
      onCreated: api.bookmarks.onCreated,
      onChanged: api.bookmarks.onChanged,
      onMoved: api.bookmarks.onMoved,
      onRemoved: api.bookmarks.onRemoved
    },
    runtime: {
      id: api.runtime?.id || "",
      sendMessage: api.runtime.sendMessage
        ? wrap(api.runtime.sendMessage, api.runtime)
        : async () => null,
      onMessage: api.runtime.onMessage,
      openOptionsPage: api.runtime.openOptionsPage
        ? wrap(api.runtime.openOptionsPage, api.runtime)
        : async () => {}
    },
    action: api.action
      ? {
          onClicked: api.action.onClicked,
          setBadgeText: api.action.setBadgeText
            ? wrap(api.action.setBadgeText, api.action)
            : async () => {},
          setBadgeBackgroundColor: api.action.setBadgeBackgroundColor
            ? wrap(api.action.setBadgeBackgroundColor, api.action)
            : async () => {}
        }
      : null,
    tabs: api.tabs
      ? {
          captureVisibleTab: api.tabs.captureVisibleTab
            ? wrap(api.tabs.captureVisibleTab, api.tabs)
            : async () => null,
          onUpdated: api.tabs.onUpdated
        }
      : null,
    storage: {
      local: {
        get: wrap(api.storage.local.get, api.storage.local),
        set: wrap(api.storage.local.set, api.storage.local)
      },
      onChanged: api.storage.onChanged
    },
    permissions: api.permissions
      ? {
          request: wrap(api.permissions.request, api.permissions),
          remove: api.permissions.remove
            ? wrap(api.permissions.remove, api.permissions)
            : async () => false
        }
      : null
  };
}
