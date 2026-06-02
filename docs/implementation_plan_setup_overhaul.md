# Setup Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign `setup.html` into a clearer, calmer configuration experience with fewer top-level sections, stronger visual hierarchy, and enough spacing to avoid the UI feeling crowded.

**Architecture:** Keep the current setup page as a standalone extension page and preserve existing setting IDs so most business logic in `setup.js` keeps working. Reorganize the information architecture around five sections: Dashboard, Appearance, Features, Data, and Advanced. Extract repeated layout styling into reusable CSS classes and remove inline styles as the markup is moved.

**Tech Stack:** WebExtension HTML/CSS/JS, vanilla modules, `node --test`, Playwright E2E snapshots.

---

## Design Direction

This overhaul should not make martabs feel like a dense admin dashboard. The mock in `docs/setup-overhaul-option2-preview.html` is a directional reference, but the implementation must be more spacious:

- Keep only five primary sidebar items.
- Use larger vertical rhythm than the mock: setting rows around `72px` minimum height where practical.
- Use visible group headings to explain related settings.
- Avoid putting too many controls into the right-side/context panel.
- Keep the current search field and save button in the header.
- Use a calm, product-like layout: fewer cards, clearer groups, more breathing room.
- Do not introduce external fonts, icon libraries, or heavy dependencies.
- Do not change setting behavior in this step unless a markup move requires a selector update.

## Target Information Architecture

### 1. Dashboard

Replaces current `Carpetas` + `Pestañas` + some current `Apariencia` options.

Contains:

- Monitored folders tree.
- Folder sorting view / ordered columns.
- Custom tabs and folder-to-tab assignment.
- Default visual mode.
- Default bookmark order.
- Show pinned folder.
- Simplify folder names.
- Show folder View button.
- Show folder Sort button.

### 2. Appearance

Replaces current `Apariencia` + `Fondo de pantalla`, minus dashboard behavior controls.

Contains:

- Theme.
- Language.
- Quick preview on hover.
- Wallpaper type.
- Image wallpaper controls.
- Gradient wallpaper controls.
- Interface scheme over wallpaper.
- Wallpaper brightness.
- Folder opacity.
- Header opacity.

### 3. Features

Contains optional/productivity features.

- Link health checking.
- Preview capture.
- Frequent sites.
- Tags: automatic tags and manual tags.
- Accessibility shortcuts.
- Pinned shortcut configuration.

### 4. Data

Contains privacy/data visibility and exportable local state.

- Local usage statistics toggle.
- Statistics chart.
- Storage audit.
- Download click stats.
- Reset stats.
- Export configuration.
- Import configuration.

### 5. Advanced

Contains infrequent maintenance and app information.

- Reset local organization.
- Clear cached previews.
- About martabs.
- Installed version.
- Browser-specific notices if needed.

## File Map

- Modify: `src/setup/setup.html`
  - Reorganize sections and preserve existing control IDs.
  - Replace old sidebar buttons with the five new sections.
  - Add reusable group wrappers around moved controls.

- Modify: `src/setup/setup.css`
  - Add a new settings layout system.
  - Reduce inline-style dependency.
  - Keep old classes only where current JS or tests require them.
  - Add responsive behavior for the new grouped layout.

- Modify: `src/setup/setup.js`
  - Update section IDs and search mappings.
  - Keep all existing query selectors for controls unchanged where possible.
  - Ensure search can find moved settings.
  - Ensure `syncSetupContentHeight()` still measures the largest section.

- Modify: `tests/setup.test.js`
  - Update expected sidebar sections.
  - Assert the new IA exists.
  - Assert important existing control IDs still exist.
  - Add checks that obsolete top-level sections are no longer sidebar entries.

- Modify: `e2e/tests/setup.spec.mjs`
  - Update nav count from 9 to 5.
  - Update screenshot expectations once the new layout is accepted.

- Optional modify: `e2e/pages/setup.page.mjs`
  - Only if selectors used by E2E helpers need updating.

- Optional modify: `_locales/*/messages.json`
  - Only if new labels are introduced.
  - Prefer reusing existing keys where possible.

---

## Task 1: Lock Current Behavior With Tests

**Files:**
- Modify: `tests/setup.test.js`

- [ ] **Step 1: Add assertions that all critical controls survive the move**

Add a test near the existing setup HTML tests:

```js
test("setup keeps stable control IDs required by setup.js", async () => {
  const html = await readFile("src/setup/setup.html", "utf8");

  const requiredIds = [
    "settings-search",
    "save",
    "folder-tree-container",
    "selected-folders-list",
    "folder-tree-search",
    "sort-columns-btn",
    "back-to-tree-btn",
    "tabs-list",
    "tabs-folder-tree-container",
    "tabs-dropzones-list",
    "default-mode-select",
    "default-sort-select",
    "theme-select",
    "language-select",
    "show-pinned-folder",
    "clean-folder-names",
    "show-view-button",
    "show-sort-button",
    "preview-enabled",
    "wallpaper-type-select",
    "wallpaper-image-container",
    "wallpaper-gradient-container",
    "link-health",
    "preview-capture",
    "frequent-sites",
    "local-stats",
    "automatic-tags",
    "manual-tags",
    "enable-pinned-shortcuts",
    "reset-local-organization",
    "clear-preview-cache",
    "export-config",
    "import-config",
    "advanced-version"
  ];

  for (const id of requiredIds) {
    assert.match(html, new RegExp(`id="${id}"`), `Missing #${id}`);
  }
});
```

- [ ] **Step 2: Run the test and verify it passes before refactor**

Run:

```bash
npm test -- tests/setup.test.js
```

Expected:

```text
ok
```

- [ ] **Step 3: Commit the safety test**

```bash
git add tests/setup.test.js
git commit -m "test: lock setup control ids before overhaul"
```

---

## Task 2: Replace Top-Level Navigation With Five Sections

**Files:**
- Modify: `src/setup/setup.html`
- Modify: `src/setup/setup.js`
- Modify: `tests/setup.test.js`
- Modify: `e2e/tests/setup.spec.mjs`

- [ ] **Step 1: Update sidebar buttons in `setup.html`**

Replace the current nine `.setup-nav-button` entries with:

```html
<button class="setup-nav-button is-active" type="button" data-section="dashboard" data-i18n="setupSectionDashboard">Tablero</button>
<button class="setup-nav-button" type="button" data-section="appearance" data-i18n="appearanceSection">Apariencia</button>
<button class="setup-nav-button" type="button" data-section="features" data-i18n="setupSectionFeatures">Funciones</button>
<button class="setup-nav-button" type="button" data-section="data" data-i18n="setupSectionData">Datos</button>
<button class="setup-nav-button" type="button" data-section="advanced" data-i18n="advancedSection">Avanzado</button>
```

- [ ] **Step 2: Rename the active first section**

Change:

```html
<section id="section-folders" class="setup-section is-active" data-section="folders"
```

To:

```html
<section id="section-dashboard" class="setup-section is-active" data-section="dashboard" data-i18n-search="searchDashboardSection" data-search="tablero carpetas columnas pestañas vista orden fijados">
```

- [ ] **Step 3: Update `setup.js` section reset logic**

Find:

```js
if (sectionId === "folders" && foldersTreeWrapper && foldersSortWrapper) {
```

Change to:

```js
if (sectionId === "dashboard" && foldersTreeWrapper && foldersSortWrapper) {
```

- [ ] **Step 4: Update unit tests for new nav IA**

In `tests/setup.test.js`, replace assertions for old sidebar sections with:

```js
assert.match(html, /data-section="dashboard"/);
assert.match(html, /data-section="appearance"/);
assert.match(html, /data-section="features"/);
assert.match(html, /data-section="data"/);
assert.match(html, /data-section="advanced"/);
assert.match(html, /id="section-dashboard"/);
assert.match(html, /id="section-appearance"/);
assert.match(html, /id="section-features"/);
assert.match(html, /id="section-data"/);
assert.match(html, /id="section-advanced"/);
```

- [ ] **Step 5: Update E2E nav count**

In `e2e/tests/setup.spec.mjs`, change:

```js
await expect(page.locator('nav button')).toHaveCount(9);
```

To:

```js
await expect(page.locator('nav button')).toHaveCount(5);
```

- [ ] **Step 6: Run setup tests**

Run:

```bash
npm test -- tests/setup.test.js
```

Expected:

```text
ok
```

- [ ] **Step 7: Commit**

```bash
git add src/setup/setup.html src/setup/setup.js tests/setup.test.js e2e/tests/setup.spec.mjs
git commit -m "refactor: simplify setup navigation"
```

---

## Task 3: Build Reusable Spacious Layout Classes

**Files:**
- Modify: `src/setup/setup.css`
- Modify: `tests/setup.test.js`

- [ ] **Step 1: Add layout primitives**

Add these classes near the current setup layout styles:

```css
.settings-section-grid {
  display: grid;
  gap: 20px;
}

.settings-two-column {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(280px, 340px);
  gap: 22px;
  align-items: start;
}

.settings-group {
  border: 1px solid var(--surface-border);
  border-radius: var(--radius-lg);
  background: var(--surface-bg);
  overflow: hidden;
}

.settings-group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 64px;
  padding: 16px 18px;
  border-bottom: 1px solid var(--surface-border);
}

.settings-group-header strong {
  display: block;
  font-size: 14px;
  color: var(--text-primary);
}

.settings-group-header small {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: var(--text-secondary);
}

.settings-group-body {
  display: grid;
  gap: 0;
}

.settings-group-body > .setting-row,
.settings-group-body > .switch-row {
  min-height: 72px;
  border: 0;
  border-bottom: 1px solid var(--surface-border);
  border-radius: 0;
  background: transparent;
}

.settings-group-body > .setting-row:last-child,
.settings-group-body > .switch-row:last-child {
  border-bottom: 0;
}

.settings-side-panel {
  display: grid;
  gap: 16px;
}
```

- [ ] **Step 2: Add responsive fallback**

Inside the existing mobile media query, add:

```css
.settings-two-column {
  grid-template-columns: 1fr;
}
```

- [ ] **Step 3: Add CSS test assertions**

In `tests/setup.test.js`, in the setup styles test, add:

```js
assert.match(css, /\.settings-section-grid\s*{/);
assert.match(css, /\.settings-two-column\s*{/);
assert.match(css, /\.settings-group\s*{/);
assert.match(css, /\.settings-group-header\s*{/);
assert.match(css, /\.settings-group-body\s*{/);
assert.match(css, /\.settings-side-panel\s*{/);
```

- [ ] **Step 4: Run tests**

Run:

```bash
npm test -- tests/setup.test.js
```

Expected:

```text
ok
```

- [ ] **Step 5: Commit**

```bash
git add src/setup/setup.css tests/setup.test.js
git commit -m "style: add spacious setup layout primitives"
```

---

## Task 4: Reorganize Dashboard Section

**Files:**
- Modify: `src/setup/setup.html`
- Modify: `tests/setup.test.js`

- [ ] **Step 1: Wrap folder and tabs controls in Dashboard**

Inside `#section-dashboard`, use this structure while preserving the current existing controls:

```html
<div class="settings-section-grid">
  <div class="settings-two-column">
    <div class="settings-group">
      <div class="settings-group-header">
        <span>
          <strong data-i18n="foldersHeading">Carpetas</strong>
          <small data-i18n="foldersDescription">Elegir carpetas, ordenarlas y ajustar vista u orden por carpeta.</small>
        </span>
        <div class="settings-group-actions">
          <!-- keep sort-columns-btn, collapse-all-btn, toggle-all-folders, open-browser-bookmarks -->
        </div>
      </div>
      <div class="settings-group-body">
        <!-- keep folders-tree-wrapper, folders-sort-wrapper, folders-sort-actions -->
      </div>
    </div>

    <div class="settings-side-panel">
      <div class="settings-group">
        <div class="settings-group-header">
          <span>
            <strong data-i18n="defaultSettingsHeading">Valores por defecto</strong>
            <small data-i18n="defaultSettingsDesc">Se aplican donde una carpeta no tiene ajuste propio.</small>
          </span>
        </div>
        <div class="settings-group-body">
          <!-- move default-mode-select, default-sort-select, show-pinned-folder, clean-folder-names, show-view-button, show-sort-button here -->
        </div>
      </div>
    </div>
  </div>

  <div class="settings-group">
    <div class="settings-group-header">
      <span>
        <strong data-i18n="tabsHeading">Pestañas</strong>
        <small data-i18n="tabsDescription">Organiza las columnas de tus marcadores en pestañas personalizadas.</small>
      </span>
    </div>
    <div class="settings-group-body">
      <!-- move tabs manager and tabs drag assignment here -->
    </div>
  </div>
</div>
```

Do not duplicate IDs. Move the existing nodes.

- [ ] **Step 2: Keep Dashboard spacious**

When moving controls, avoid placing the folder tree, tabs assignment, and preview all in the same row. The folder tree gets the main width; defaults get the side panel; tabs are a second full-width group below.

- [ ] **Step 3: Test Dashboard contains moved controls**

Add to `tests/setup.test.js`:

```js
test("setup dashboard groups folder, tab, and default view controls", async () => {
  const html = await readFile("src/setup/setup.html", "utf8");

  const dashboard = html.slice(
    html.indexOf('id="section-dashboard"'),
    html.indexOf('id="section-appearance"')
  );

  assert.match(dashboard, /id="folder-tree-container"/);
  assert.match(dashboard, /id="selected-folders-list"/);
  assert.match(dashboard, /id="tabs-list"/);
  assert.match(dashboard, /id="tabs-dropzones-list"/);
  assert.match(dashboard, /id="default-mode-select"/);
  assert.match(dashboard, /id="default-sort-select"/);
  assert.match(dashboard, /id="show-pinned-folder"/);
  assert.match(dashboard, /id="clean-folder-names"/);
  assert.match(dashboard, /id="show-view-button"/);
  assert.match(dashboard, /id="show-sort-button"/);
});
```

- [ ] **Step 4: Run tests**

Run:

```bash
npm test -- tests/setup.test.js
```

Expected:

```text
ok
```

- [ ] **Step 5: Commit**

```bash
git add src/setup/setup.html tests/setup.test.js
git commit -m "refactor: group dashboard setup controls"
```

---

## Task 5: Reorganize Appearance Section

**Files:**
- Modify: `src/setup/setup.html`
- Modify: `tests/setup.test.js`

- [ ] **Step 1: Move visual controls into Appearance**

Keep `#section-appearance`, but make it contain:

```html
<div class="settings-section-grid">
  <div class="settings-group">
    <div class="settings-group-header">
      <span>
        <strong data-i18n="appearanceHeading">Apariencia</strong>
        <small data-i18n="appearanceDescription">Preferencias visuales generales del tablero.</small>
      </span>
    </div>
    <div class="settings-group-body">
      <!-- theme-select, language-select, preview-enabled -->
    </div>
  </div>

  <div class="settings-group">
    <div class="settings-group-header">
      <span>
        <strong data-i18n="wallpaperHeading">Fondo de pantalla</strong>
        <small data-i18n="wallpaperDescription">Personaliza el fondo del tablero principal de tu nueva pestaña.</small>
      </span>
    </div>
    <div class="settings-group-body">
      <!-- wallpaper-type-row, wallpaper image container, wallpaper gradient container, wallpaper theme/brightness/opacity controls -->
    </div>
  </div>
</div>
```

Remove the separate top-level `section-wallpaper` after moving its content.

- [ ] **Step 2: Preserve wallpaper control order**

Within the Wallpaper group, keep the existing flow:

1. Wallpaper type.
2. Image controls.
3. Gradient controls.
4. Interface scheme.
5. Brightness and opacity sliders.

- [ ] **Step 3: Add Appearance test**

Add:

```js
test("setup appearance groups theme language preview and wallpaper controls", async () => {
  const html = await readFile("src/setup/setup.html", "utf8");

  const appearance = html.slice(
    html.indexOf('id="section-appearance"'),
    html.indexOf('id="section-features"')
  );

  assert.match(appearance, /id="theme-select"/);
  assert.match(appearance, /id="language-select"/);
  assert.match(appearance, /id="preview-enabled"/);
  assert.match(appearance, /id="wallpaper-type-select"/);
  assert.match(appearance, /id="wallpaper-image-container"/);
  assert.match(appearance, /id="wallpaper-gradient-container"/);
  assert.doesNotMatch(html, /id="section-wallpaper"/);
});
```

- [ ] **Step 4: Run tests**

Run:

```bash
npm test -- tests/setup.test.js
```

Expected:

```text
ok
```

- [ ] **Step 5: Commit**

```bash
git add src/setup/setup.html tests/setup.test.js
git commit -m "refactor: merge wallpaper into appearance setup"
```

---

## Task 6: Create Features Section

**Files:**
- Modify: `src/setup/setup.html`
- Modify: `tests/setup.test.js`

- [ ] **Step 1: Create `#section-features`**

Add after Appearance:

```html
<section id="section-features" class="setup-section" data-section="features" data-i18n-search="searchFeaturesSection" data-search="funciones enlaces capturas sitios frecuentes etiquetas accesibilidad atajos">
  <div class="section-heading">
    <h2 data-i18n="setupSectionFeatures">Funciones</h2>
    <p data-i18n="setupSectionFeaturesDesc">Activa funciones opcionales del tablero y accesos rápidos.</p>
  </div>
  <div class="settings-section-grid">
    <!-- groups go here -->
  </div>
</section>
```

- [ ] **Step 2: Move optional feature controls**

Create groups:

- Link and preview tools: `link-health`, `preview-capture`, `frequent-sites`, `topsites-limit`, `reset-topsites-blacklist`.
- Tags: `automatic-tags`, `manual-tags`.
- Accessibility: keyboard shortcut list, `enable-pinned-shortcuts`, `pinned-shortcut-catcher-1`, `pinned-shortcut-catcher-2`.

- [ ] **Step 3: Add Features test**

Add:

```js
test("setup features groups optional feature controls", async () => {
  const html = await readFile("src/setup/setup.html", "utf8");

  const features = html.slice(
    html.indexOf('id="section-features"'),
    html.indexOf('id="section-data"')
  );

  assert.match(features, /id="link-health"/);
  assert.match(features, /id="preview-capture"/);
  assert.match(features, /id="frequent-sites"/);
  assert.match(features, /id="automatic-tags"/);
  assert.match(features, /id="manual-tags"/);
  assert.match(features, /id="enable-pinned-shortcuts"/);
  assert.doesNotMatch(html, /id="section-privacy"/);
  assert.doesNotMatch(html, /id="section-tags"/);
  assert.doesNotMatch(html, /id="section-accessibility"/);
});
```

- [ ] **Step 4: Run tests**

Run:

```bash
npm test -- tests/setup.test.js
```

Expected:

```text
ok
```

- [ ] **Step 5: Commit**

```bash
git add src/setup/setup.html tests/setup.test.js
git commit -m "refactor: group optional setup features"
```

---

## Task 7: Create Data Section

**Files:**
- Modify: `src/setup/setup.html`
- Modify: `src/setup/setup.js`
- Modify: `tests/setup.test.js`

- [ ] **Step 1: Create `#section-data`**

Add after Features:

```html
<section id="section-data" class="setup-section" data-section="data" data-i18n-search="searchDataSection" data-search="datos privacidad estadisticas importar exportar json almacenamiento">
  <div class="section-heading">
    <h2 data-i18n="setupSectionData">Datos</h2>
    <p data-i18n="setupSectionDataDesc">Controla estadísticas locales, almacenamiento e importación/exportación.</p>
  </div>
  <div class="settings-section-grid">
    <!-- groups go here -->
  </div>
</section>
```

- [ ] **Step 2: Move data controls**

Move:

- `local-stats` from the old Privacy section into a group named Statistics privacy.
- `statistics-disabled-msg`.
- `statistics-content`.
- `download-stats`.
- `reset-stats`.
- `export-config`.
- `import-config`.
- `import-config-file`.
- `import-summary-container`.

- [ ] **Step 3: Update JS link from stats disabled message**

Find code that navigates to Privacy:

```js
const privacyBtn = document.querySelector('.setup-nav-button[data-section="privacy"]');
if (privacyBtn) privacyBtn.click();
```

Change to:

```js
const dataBtn = document.querySelector('.setup-nav-button[data-section="data"]');
if (dataBtn) dataBtn.click();
```

If the button text still says "Habilitar en Privacidad", either reuse a better existing translation key or add a key meaning "Habilitar estadísticas".

- [ ] **Step 4: Add Data test**

Add:

```js
test("setup data groups local statistics and import export controls", async () => {
  const html = await readFile("src/setup/setup.html", "utf8");

  const dataSection = html.slice(
    html.indexOf('id="section-data"'),
    html.indexOf('id="section-advanced"')
  );

  assert.match(dataSection, /id="local-stats"/);
  assert.match(dataSection, /id="statistics-disabled-msg"/);
  assert.match(dataSection, /id="statistics-content"/);
  assert.match(dataSection, /id="download-stats"/);
  assert.match(dataSection, /id="reset-stats"/);
  assert.match(dataSection, /id="export-config"/);
  assert.match(dataSection, /id="import-config"/);
});
```

- [ ] **Step 5: Run tests**

Run:

```bash
npm test -- tests/setup.test.js
```

Expected:

```text
ok
```

- [ ] **Step 6: Commit**

```bash
git add src/setup/setup.html src/setup/setup.js tests/setup.test.js
git commit -m "refactor: group setup data controls"
```

---

## Task 8: Clean Advanced Section

**Files:**
- Modify: `src/setup/setup.html`
- Modify: `tests/setup.test.js`

- [ ] **Step 1: Keep only maintenance and about controls**

In `#section-advanced`, keep:

- `reset-local-organization`.
- `clear-preview-cache`.
- `advanced-version`.
- About row.

Do not keep import/export in Advanced after Task 7.

- [ ] **Step 2: Add Advanced test**

Add:

```js
test("setup advanced only contains maintenance and about controls", async () => {
  const html = await readFile("src/setup/setup.html", "utf8");

  const advanced = html.slice(html.indexOf('id="section-advanced"'));

  assert.match(advanced, /id="reset-local-organization"/);
  assert.match(advanced, /id="clear-preview-cache"/);
  assert.match(advanced, /id="advanced-version"/);
  assert.doesNotMatch(advanced, /id="export-config"/);
  assert.doesNotMatch(advanced, /id="import-config"/);
});
```

- [ ] **Step 3: Run tests**

Run:

```bash
npm test -- tests/setup.test.js
```

Expected:

```text
ok
```

- [ ] **Step 4: Commit**

```bash
git add src/setup/setup.html tests/setup.test.js
git commit -m "refactor: simplify advanced setup section"
```

---

## Task 9: Reduce Inline Styling

**Files:**
- Modify: `src/setup/setup.html`
- Modify: `src/setup/setup.css`
- Modify: `tests/setup.test.js`

- [ ] **Step 1: Replace repeated inline button styles**

Create reusable CSS:

```css
.compact-action-button {
  height: 32px;
  padding: 0 12px;
  font-size: 12px;
}

.settings-group-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.settings-inline-note {
  font-size: 11px;
  color: var(--text-secondary);
  line-height: 1.35;
}
```

Then replace inline styles like:

```html
style="padding: 6px 12px; height: 32px; font-size: 12px;"
```

With:

```html
class="secondary-button compact-action-button"
```

- [ ] **Step 2: Keep complex wallpaper inline styles only if risky**

Wallpaper controls currently have many specific inline styles. Remove simple layout inline styles first. Leave color input dimensions and hidden legacy test elements until a dedicated wallpaper cleanup is planned.

- [ ] **Step 3: Add style test**

Add:

```js
test("setup uses reusable compact action styling", async () => {
  const html = await readFile("src/setup/setup.html", "utf8");
  const css = await readFile("src/setup/setup.css", "utf8");

  assert.match(css, /\.compact-action-button\s*{/);
  assert.match(css, /\.settings-group-actions\s*{/);
  assert.match(html, /compact-action-button/);
  assert.doesNotMatch(html, /padding: 6px 12px; height: 32px; font-size: 12px;/);
});
```

- [ ] **Step 4: Run tests**

Run:

```bash
npm test -- tests/setup.test.js
```

Expected:

```text
ok
```

- [ ] **Step 5: Commit**

```bash
git add src/setup/setup.html src/setup/setup.css tests/setup.test.js
git commit -m "style: reduce setup inline button styles"
```

---

## Task 10: Add Or Reuse i18n Keys

**Files:**
- Modify: `_locales/*/messages.json`
- Run: `scripts/i18n-maintain.mjs`

- [ ] **Step 1: Add only missing new keys**

If the implementation introduced new labels, add them first in Spanish or English source locale according to the current i18n workflow:

```json
"setupSectionDashboard": {
  "message": "Tablero"
},
"setupSectionFeatures": {
  "message": "Funciones"
},
"setupSectionFeaturesDesc": {
  "message": "Activa funciones opcionales del tablero y accesos rápidos."
},
"setupSectionData": {
  "message": "Datos"
},
"setupSectionDataDesc": {
  "message": "Controla estadísticas locales, almacenamiento e importación/exportación."
},
"defaultSettingsHeading": {
  "message": "Valores por defecto"
},
"defaultSettingsDesc": {
  "message": "Se aplican donde una carpeta no tiene ajuste propio."
}
```

- [ ] **Step 2: Run i18n maintenance check**

Run:

```bash
npm run i18n:check
```

Expected:

```text
ok
```

If it reports missing keys, run:

```bash
npm run i18n:maintain
```

Then manually review generated values for Spanish, English, Portuguese, German, French, Italian, Russian, Arabic, Chinese, Japanese, and Korean.

- [ ] **Step 3: Commit**

```bash
git add _locales
git commit -m "chore: update setup overhaul translations"
```

---

## Task 11: Visual Verification And Screenshots

**Files:**
- Modify: `e2e/tests/setup.spec.mjs`
- Possibly update: `e2e/tests/setup.spec.mjs-snapshots/setup-page-chromium-win32.png`

- [ ] **Step 1: Run unit tests**

Run:

```bash
npm test
```

Expected:

```text
ok
```

- [ ] **Step 2: Run build**

Run:

```bash
npm run build
```

Expected:

```text
Built Chrome extension
Built Firefox extension
```

Exact wording can differ, but command must exit with code `0`.

- [ ] **Step 3: Run Chrome setup E2E**

Run:

```bash
npm run test:e2e:chrome -- e2e/tests/setup.spec.mjs
```

Expected:

```text
passed
```

- [ ] **Step 4: Update screenshot only after manual review**

Run:

```bash
npm run test:e2e:update-screenshots -- e2e/tests/setup.spec.mjs
```

Expected:

```text
setup-page.png
```

After updating the screenshot, manually inspect it for:

- No clipped controls.
- No text overflow in sidebar.
- Folder tree scroll is usable.
- Header save/status area does not crowd the search.
- Dashboard section feels spacious, not compressed.
- Mobile width still stacks sections correctly.

- [ ] **Step 5: Commit final verification changes**

```bash
git add src/setup/setup.html src/setup/setup.css src/setup/setup.js tests/setup.test.js e2e/tests/setup.spec.mjs e2e/tests/setup.spec.mjs-snapshots
git commit -m "refactor: overhaul setup configuration layout"
```

---

## Explicit Non-Goals

- Do not redesign the main new tab dashboard in this plan.
- Do not add new settings behavior.
- Do not change bookmark, preview, statistics, or wallpaper storage schemas.
- Do not add dependencies.
- Do not implement a modal setup page.
- Do not remove tests because the markup changed.

## Risk Notes

- Moving controls is safe only if IDs remain unchanged.
- `setup.js` uses many direct selectors at module load. If any element is removed or renamed, save behavior may silently break.
- The old tests assert `section-wallpaper`, `section-privacy`, `section-tags`, and `section-accessibility`; these must be intentionally updated.
- Some i18n keys can be reused. Adding unnecessary keys increases maintenance across all locales.
- The visual density concern is real: prioritize spacing over fitting everything above the fold.

## Self-Review

- Spec coverage: The plan covers the requested massive style/organization overhaul, keeps the Option 2 architecture, and includes the user's concern about avoiding crowded areas.
- Placeholder scan: No task contains `TBD`, `TODO`, or unspecified implementation work.
- Type/name consistency: New section IDs are `dashboard`, `appearance`, `features`, `data`, and `advanced`; tests and JS updates use those names consistently.

