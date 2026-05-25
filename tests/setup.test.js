import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("setup page loads setup assets and required controls", async () => {
  const html = await readFile("src/setup/setup.html", "utf8");

  assert.match(html, /<html lang="es">/);
  assert.match(html, /<link rel="stylesheet" href="\.\/setup\.css">/);
  assert.match(html, /<div id="folder-list" class="folder-list" aria-live="polite"><\/div>/);
  assert.match(html, /<input id="automatic-tags" type="checkbox" checked>/);
  assert.match(html, /<input id="manual-tags" type="checkbox" checked>/);
  assert.match(html, /<input id="link-health" type="checkbox">/);
  assert.match(html, /<input id="preview-capture" type="checkbox">/);
  assert.match(html, /<button id="save" type="button">Guardar configuracion<\/button>/);
  assert.match(html, /<script type="module" src="\.\/setup\.js"><\/script>/);
});

test("setup styles include the setup shell and folder list layout", async () => {
  const css = await readFile("src/setup/setup.css", "utf8");

  assert.match(css, /\.setup-shell\s*{/);
  assert.match(css, /place-items: center;/);
  assert.match(css, /\.setup-panel\s*{/);
  assert.match(css, /width: min\(760px, 100%\);/);
  assert.match(css, /\.folder-list\s*{/);
  assert.match(css, /max-height: 320px;/);
  assert.match(css, /\.theme-label\s*{/);
  assert.doesNotMatch(css, /fonts\.googleapis/);
});

test("setup script saves selected folders and setup completion", async () => {
  const js = await readFile("src/setup/setup.js", "utf8");

  assert.match(js, /import { getBrowserApi } from "\.\.\/shared\/browser-api\.js";/);
  assert.match(js, /import { getFolderOptions } from "\.\.\/shared\/bookmarks\.js";/);
  assert.match(js, /import { getSettings, saveSettings } from "\.\.\/shared\/storage\.js";/);
  assert.match(js, /api\.bookmarks\.getTree\(\)/);
  assert.match(js, /selectedFolderIds\.length === 0/);
  assert.match(js, /api\.permissions\?\.request/);
  assert.match(js, /origins:\s*\["http:\/\/\*\/\*", "https:\/\/\*\/\*"\]/);
  assert.match(js, /origins:\s*\["<all_urls>"\]/);
  assert.match(js, /api\.permissions\?\.remove/);
  assert.match(js, /linkHealthEnabled: linkHealthEnabled/);
  assert.match(js, /previewCaptureEnabled: previewCaptureEnabled/);
  assert.match(js, /setupComplete: true/);
  assert.match(js, /No se pudo guardar la configuracion:/);
  assert.match(js, /No se pudo activar la revision de enlaces/);
  assert.match(js, /No se pudo activar la captura de previews/);
});
