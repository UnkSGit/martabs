import test from "node:test";
import assert from "node:assert";
import { getBrowserApi } from "../src/shared/browser-api.js";

test("getBrowserApi exposes permissions.contains when the browser supports it", async () => {
  let containsArgs = null;
  const permissions = {
    request: () => true,
    remove: () => true,
    contains: (permission) => {
      containsArgs = permission;
      return true;
    }
  };

  const api = getBrowserApi({
    chrome: {
      bookmarks: {
        getTree: () => [],
        onCreated: {},
        onChanged: {},
        onMoved: {},
        onRemoved: {}
      },
      runtime: {
        sendMessage: () => null,
        onMessage: {}
      },
      storage: {
        local: {
          get: () => ({}),
          set: () => {}
        },
        onChanged: {}
      },
      permissions
    }
  });

  const permission = { origins: ["<all_urls>"] };

  assert.strictEqual(await api.permissions.contains(permission), true);
  assert.deepStrictEqual(containsArgs, permission);
});
