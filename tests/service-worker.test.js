import test from "node:test";
import assert from "node:assert/strict";
import { createBrowserMock } from "./helpers/browser-mock.js";

// Setup browser mock globally before importing the service worker!
const mockStorage = {
  settings: {
    setupComplete: true,
    selectedFolderIds: ["1"],
    previewCaptureEnabled: true
  },
  capturedPreviews: {},
  pendingPreviewCaptures: {}
};

const mockBookmarks = [
  {
    id: "root",
    title: "",
    children: [
      {
        id: "1",
        title: "Bookmarks Bar",
        children: [
          { id: "b1", title: "Example Site", url: "https://example.com" }
        ]
      }
    ]
  }
];

const initialState = {
  storage: mockStorage,
  bookmarks: mockBookmarks,
  grantedOrigins: ["<all_urls>"],
  grantedPermissions: ["bookmarks", "storage"],
  tabsState: {}
};

const browserMock = createBrowserMock(initialState);
globalThis.chrome = browserMock;

// Import the service worker (its top-level logic will run using our mocked chrome APIs)
const serviceWorker = await import("../src/background/service-worker.js");
// Configure delay to 0 for fast tests
serviceWorker.setCaptureDelayMs(0);
const flushPromises = () => new Promise(resolve => setTimeout(resolve, 10));

test("service worker: message CAPTURE_OPENED_BOOKMARK arms capture", async () => {
  // Reset pending state in mock storage
  mockStorage.pendingPreviewCaptures = {};

  // Find runtime.onMessage listener
  const onMessageListeners = browserMock.listeners.runtimeOnMessage;
  assert.ok(onMessageListeners.length > 0, "Should register onMessage listener");

  // Simulate receiving message CAPTURE_OPENED_BOOKMARK
  let response = null;
  const sendResponse = (res) => { response = res; };

  // Sender tab and window
  const sender = {
    tab: { id: 99, windowId: 456 }
  };

  const messageHandler = onMessageListeners[0];
  const handled = messageHandler(
    {
      type: "CAPTURE_OPENED_BOOKMARK",
      bookmarkId: "b1",
      url: "https://example.com"
    },
    sender,
    sendResponse
  );

  assert.strictEqual(handled, true, "Message should be handled");
  
  // Wait for async operations to complete
  await flushPromises();

  assert.deepEqual(response, { armed: true }, "Should respond with armed: true");

  // Verify that it is armed in storage
  const pending = mockStorage.pendingPreviewCaptures["99"];
  assert.ok(pending, "Should save pending capture under tabId");
  assert.strictEqual(pending.bookmarkId, "b1");
  assert.strictEqual(pending.url, "https://example.com");
  assert.strictEqual(pending.windowId, 456);
});

test("service worker: complete capture on tabs.onUpdated with correct active state and matching host", async () => {
  // Set up pending state and tab state in mock
  mockStorage.pendingPreviewCaptures = {
    "99": {
      bookmarkId: "b1",
      url: "https://example.com",
      windowId: 456,
      armedAt: Date.now()
    }
  };
  mockStorage.capturedPreviews = {};

  // Configure tab details returned by tabs.get in browserMock
  initialState.tabsState = {
    "99": {
      id: 99,
      active: true,
      windowId: 456,
      url: "https://example.com/some-path" // redirection/inner path but same hostname
    }
  };
  
  browserMock.listeners.tabsOnUpdated.forEach(cb => {
    cb(99, { status: "complete" }, { id: 99, url: "https://example.com/some-path" });
  });

  // Let tabs.get and captures resolve
  await flushPromises();

  // Should have captured successfully and stored the preview image
  const previews = mockStorage.capturedPreviews;
  assert.ok(previews["b1"], "Preview should be captured for b1");
  assert.strictEqual(previews["b1"].url, "https://example.com");
  assert.strictEqual(previews["b1"].sourceUrl, "https://example.com/some-path");
  assert.match(previews["b1"].image, /^data:image/);

  // Pending capture should be cleaned up immediately
  assert.strictEqual(mockStorage.pendingPreviewCaptures["99"], undefined);
});

test("service worker: abort capture if tab becomes inactive", async () => {
  mockStorage.pendingPreviewCaptures = {
    "99": {
      bookmarkId: "b1",
      url: "https://example.com",
      windowId: 456,
      armedAt: Date.now()
    }
  };
  mockStorage.capturedPreviews = {};

  // Mock tab state as active: false
  initialState.tabsState = {
    "99": {
      id: 99,
      active: false, // inactive tab!
      windowId: 456,
      url: "https://example.com"
    }
  };

  browserMock.listeners.tabsOnUpdated.forEach(cb => {
    cb(99, { status: "complete" }, { id: 99, url: "https://example.com" });
  });

  await flushPromises();

  // Should NOT capture, and capturedPreviews should remain empty
  assert.deepEqual(mockStorage.capturedPreviews, {});
  // Pending capture should still be cleaned up
  assert.strictEqual(mockStorage.pendingPreviewCaptures["99"], undefined);
});

test("service worker: abort capture if tab shifts windowId", async () => {
  mockStorage.pendingPreviewCaptures = {
    "99": {
      bookmarkId: "b1",
      url: "https://example.com",
      windowId: 456,
      armedAt: Date.now()
    }
  };
  mockStorage.capturedPreviews = {};

  initialState.tabsState = {
    "99": {
      id: 99,
      active: true,
      windowId: 777, // different windowId!
      url: "https://example.com"
    }
  };

  browserMock.listeners.tabsOnUpdated.forEach(cb => {
    cb(99, { status: "complete" }, { id: 99, url: "https://example.com" });
  });

  await flushPromises();

  assert.deepEqual(mockStorage.capturedPreviews, {});
  assert.strictEqual(mockStorage.pendingPreviewCaptures["99"], undefined);
});

test("service worker: hostname validation redirects", async () => {
  // Test case A: Redirection inside the same host (e.g. google.com to https://www.google.com)
  mockStorage.pendingPreviewCaptures = {
    "99": {
      bookmarkId: "b1",
      url: "http://google.com",
      windowId: 456,
      armedAt: Date.now()
    }
  };
  mockStorage.capturedPreviews = {};
  initialState.tabsState = {
    "99": {
      id: 99,
      active: true,
      windowId: 456,
      url: "https://www.google.com/search?q=test" // Same hostname when ignoring www.
    }
  };

  browserMock.listeners.tabsOnUpdated.forEach(cb => {
    cb(99, { status: "complete" }, { id: 99, url: "https://www.google.com/search?q=test" });
  });

  await flushPromises();
  assert.ok(mockStorage.capturedPreviews["b1"], "Should capture for same host redirection");
  assert.strictEqual(mockStorage.pendingPreviewCaptures["99"], undefined);

  // Test case B: Redirection to a different host (e.g. google.com to yahoo.com)
  mockStorage.pendingPreviewCaptures = {
    "99": {
      bookmarkId: "b1",
      url: "http://google.com",
      windowId: 456,
      armedAt: Date.now()
    }
  };
  mockStorage.capturedPreviews = {};
  initialState.tabsState = {
    "99": {
      id: 99,
      active: true,
      windowId: 456,
      url: "https://yahoo.com" // Different host!
    }
  };

  browserMock.listeners.tabsOnUpdated.forEach(cb => {
    cb(99, { status: "complete" }, { id: 99, url: "https://yahoo.com" });
  });

  await flushPromises();
  assert.deepEqual(mockStorage.capturedPreviews, {}, "Should abort capture for different host redirection");
  assert.strictEqual(mockStorage.pendingPreviewCaptures["99"], undefined);
});

test("service worker: tabs.onRemoved cleans up pending state", async () => {
  mockStorage.pendingPreviewCaptures = {
    "99": {
      bookmarkId: "b1",
      url: "https://example.com",
      windowId: 456,
      armedAt: Date.now()
    }
  };

  const onRemovedListeners = browserMock.listeners.tabsOnRemoved;
  assert.ok(onRemovedListeners.length > 0, "Should register onRemoved listener");

  onRemovedListeners.forEach(cb => cb(99));

  await flushPromises();

  // Should have deleted tab 99 pending capture from storage
  assert.strictEqual(mockStorage.pendingPreviewCaptures["99"], undefined);
});

test("service worker: handles captureVisibleTab exceptions silently", async () => {
  mockStorage.pendingPreviewCaptures = {
    "99": {
      bookmarkId: "b1",
      url: "https://example.com",
      windowId: 456,
      armedAt: Date.now()
    }
  };
  mockStorage.capturedPreviews = {};

  initialState.tabsState = {
    "99": {
      id: 99,
      active: true,
      windowId: 456,
      url: "https://example.com"
    }
  };
  // Force tabs.captureVisibleTab to fail/reject
  initialState.shouldFailTabs = true;

  try {
    browserMock.listeners.tabsOnUpdated.forEach(cb => {
      cb(99, { status: "complete" }, { id: 99, url: "https://example.com" });
    });

    await flushPromises();
    
    // No error was thrown, capture is skipped and pending cleaned up
    assert.deepEqual(mockStorage.capturedPreviews, {});
    assert.strictEqual(mockStorage.pendingPreviewCaptures["99"], undefined);
  } finally {
    initialState.shouldFailTabs = false;
  }
});
