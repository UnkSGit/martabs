import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("new tab does not call third-party preview or icon services", async () => {
  const js = await readFile("src/newtab/newtab.js", "utf8");
  const css = await readFile("src/newtab/newtab.css", "utf8");
  const setupCss = await readFile("src/setup/setup.css", "utf8");

  assert.doesNotMatch(js, /image\.thum\.io|duckduckgo/i);
  assert.doesNotMatch(css, /fonts\.googleapis/i);
  assert.doesNotMatch(setupCss, /fonts\.googleapis/i);
});

test("link health checks run from the new tab page, not the service worker", async () => {
  const worker = await readFile("src/background/service-worker.js", "utf8");
  const js = await readFile("src/newtab/newtab.js", "utf8");
  const api = await readFile("src/shared/browser-api.js", "utf8");
  const storage = await readFile("src/shared/storage.js", "utf8");

  // Service worker no longer handles health checks
  assert.doesNotMatch(worker, /runInitialHealthCheck/);
  assert.doesNotMatch(worker, /runLinkHealthCheck/);
  assert.doesNotMatch(worker, /checkUrl/);
  assert.doesNotMatch(worker, /selectedFoldersChanged/);
  assert.doesNotMatch(worker, /alarms/);

  // New tab page owns the health check logic
  assert.match(js, /async function checkUrl/);
  assert.match(js, /async function reviewFolderHealth/);
  assert.match(js, /applyLinkCheckResult/);
  assert.match(js, /saveLinkHealth/);

  assert.doesNotMatch(api, /alarms|storage\.local\.remove/);
  assert.doesNotMatch(storage, /dismissedLinkWarnings|saveManualTags/);
});

test("opened bookmarks can trigger local capture without global navigation tracking", async () => {
  const base = JSON.parse(await readFile("src/manifest.base.json", "utf8"));
  const worker = await readFile("src/background/service-worker.js", "utf8");
  const js = await readFile("src/newtab/newtab.js", "utf8");
  const api = await readFile("src/shared/browser-api.js", "utf8");

  assert.deepEqual(base.permissions, ["bookmarks", "storage"]);
  assert.ok(base.optional_host_permissions.includes("<all_urls>"));
  assert.ok(!base.action, "toolbar capture action should not be declared");
  assert.match(js, /CAPTURE_OPENED_BOOKMARK/);
  assert.match(worker, /CAPTURE_OPENED_BOOKMARK/);
  assert.match(worker, /armPreviewCapture/);
  assert.match(worker, /handleCompletedPreviewCapture/);
  assert.match(worker, /pendingPreviewCaptures/);
  assert.match(worker, /api\.tabs\.onUpdated\.addListener/);
  assert.match(worker, /previewCaptureEnabled/);
  assert.match(api, /onMessage/);
  assert.match(api, /sendMessage/);
  assert.match(api, /onUpdated/);
  assert.match(api, /update: api\.bookmarks\.update/);
  assert.doesNotMatch(worker, /tabs\.onActivated|webNavigation|waitForTabLoad|capturePreviewForTab|setCaptureBadge/);
  assert.doesNotMatch(api, /action:/);
});

test("firefox manifest does not inherit chrome-only favicon permission", async () => {
  const base = JSON.parse(await readFile("src/manifest.base.json", "utf8"));
  const chrome = JSON.parse(await readFile("src/manifest.chrome.json", "utf8"));
  const firefox = JSON.parse(await readFile("src/manifest.firefox.json", "utf8"));

  assert.deepEqual(base.permissions, ["bookmarks", "storage"]);
  assert.deepEqual(chrome.permissions, ["bookmarks", "storage", "favicon"]);
  assert.deepEqual(firefox.background, {
    scripts: ["background/service-worker.js"],
    type: "module"
  });
  assert.ok(!("service_worker" in firefox.background));
  assert.ok(base.optional_host_permissions.includes("<all_urls>"));
  assert.ok(!base.optional_permissions?.includes("alarms"), "base manifest should not declare optional alarms");
});

test("firefox manifest privacy declaration matches supported browser versions", async () => {
  const firefox = JSON.parse(await readFile("src/manifest.firefox.json", "utf8"));
  const settings = firefox.browser_specific_settings;

  assert.equal(settings.gecko.strict_min_version, "140.0");
  assert.deepEqual(settings.gecko.data_collection_permissions, { required: ["none"] });
  assert.equal(settings.gecko_android.strict_min_version, "142.0");
});

test("statistics and warning badges avoid dynamic innerHTML that AMO flags", async () => {
  const setup = await readFile("src/setup/setup.js", "utf8");
  const newtab = await readFile("src/newtab/newtab.js", "utf8");

  assert.doesNotMatch(setup, /statsChart\.innerHTML\s*=\s*`/);
  assert.doesNotMatch(setup, /storageAudit\.innerHTML\s*\+=/);
  assert.doesNotMatch(newtab, /\breviewButton\.innerHTML\s*=/);
  assert.doesNotMatch(newtab, /\bviewButton\.innerHTML\s*=/);
  assert.doesNotMatch(newtab, /\bmodeBtn\.innerHTML\s*=/);
  assert.doesNotMatch(newtab, /\bsortBtn\.innerHTML\s*=/);
});

test("service worker does not rebuild index on purely visual setting changes", async () => {
  const worker = await readFile("src/background/service-worker.js", "utf8");

  assert.match(worker, /selectedFolderIds/);
  assert.match(worker, /setupComplete/);
  assert.match(worker, /bookmarkFolderOverrides/);
  assert.match(worker, /listenToSettingsChanges/);
  
  // Make sure it references rebuildAffectingKeys
  assert.match(worker, /rebuildAffectingKeys/);
});
