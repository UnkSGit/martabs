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
      },
      onChanged: api.storage.onChanged
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
