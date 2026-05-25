# Implementation Plan - Martabs Overhaul

Visual overhaul to match start.me aesthetics (glassmorphism, pastel gradients, local favicons where available), dynamic column layouts with left-side scrolls, application rename to "martabs", custom logo integration, dark/light theme alignment on option pages, and a safe review process for inaccessible bookmarks.

## User Review Required

> [!NOTE]
> We will copy the user's custom logo file (`media__1779649597125.png`) to `src/newtab/logo.png` and display it in the header.
> The layout dynamically adapts to folder counts:
> - **1 folder**: Full-width card with bookmarks distributed in a responsive column grid to fit the viewport.
> - **2-4 folders**: Placed side-by-side, matching the viewport height, with independent scrollbars on the left.
> - **>4 folders**: Placed in a grid wrapping to new rows with main window vertical scroll.

> [!IMPORTANT]
> Inaccessible bookmarks are reviewed explicitly from each affected folder. The dashboard shows a compact "Revisar" button inside folder headers and allows one-at-a-time deletion after confirmation. The extension avoids a global review banner and bulk cleanup.

## Proposed Changes

We will create and modify the following files:

---

### Shared API Adapter

#### [MODIFY] [browser-api.js](file:///C:/Users/Gabriel/OneDrive/Documentos/organizador%20de%20marcadores/src/shared/browser-api.js)
- Expose `remove: wrap(api.bookmarks.remove, api.bookmarks)` inside the `bookmarks` block only for explicit one-at-a-time deletion from the review view.

---

### Project Configuration & Extension Metadata

#### [MODIFY] [manifest.base.json](file:///C:/Users/Gabriel/OneDrive/Documentos/organizador%20de%20marcadores/src/manifest.base.json)
- Rename `"name"` to `"martabs"`.
- Rename `"description"` to `"A fast visual New Tab dashboard for your bookmarks."`.
- Add `"logo.png"` to copy scripts if required.

#### [MODIFY] [package.json](file:///C:/Users/Gabriel/OneDrive/Documentos/organizador%20de%20marcadores/package.json)
- Rename `"name"` to `"martabs"`.

#### [MODIFY] [README.md](file:///C:/Users/Gabriel/OneDrive/Documentos/organizador%20de%20marcadores/README.md)
- Update titles, commands, and descriptions to use "martabs".

---

### Options Page Theme Matching

#### [MODIFY] [setup.html](file:///C:/Users/Gabriel/OneDrive/Documentos/organizador%20de%20marcadores/src/setup/setup.html)
- Change `<title>` to `"Configurar martabs"`.
- Ensure elements match the layout styles.

#### [MODIFY] [setup.css](file:///C:/Users/Gabriel/OneDrive/Documentos/organizador%20de%20marcadores/src/setup/setup.css)
- Implement `@media (prefers-color-scheme: dark)` styling to support dark and light theme options page automatically. Use similar colors, background, and fonts as the new tab dashboard.

#### [MODIFY] [setup.js](file:///C:/Users/Gabriel/OneDrive/Documentos/organizador%20de%20marcadores/src/setup/setup.js)
- Update success/error messages to refer to "martabs" instead of "Bookmark Home".

---

### New Tab Layout, Styles & Visual Previews

#### [MODIFY] [newtab.html](file:///C:/Users/Gabriel/OneDrive/Documentos/organizador%20de%20marcadores/src/newtab/newtab.html)
- Replace title with `"Inicio - martabs"`.
- Integrate custom logo image (`logo.png`) in the header next to the status line.
- Remove the old global `#review-links` banner so link issues are only surfaced inside folder cards.

#### [MODIFY] [newtab.css](file:///C:/Users/Gabriel/OneDrive/Documentos/organizador%20de%20marcadores/src/newtab/newtab.css)
- **Background**: Soft colorful pastel gradient (smooth orange/pink/indigo/green blend) in light mode, and deep slate/indigo blend in dark mode.
- **Glassmorphism**: Translucent card panels with backdrop filter blurs and thin border lines.
- **Folder Layout Modes**:
  - Class `.layout-single`: full width card, bookmarks in CSS grid `.bookmark-list` with `repeat(auto-fill, minmax(280px, 1fr))`.
  - Class `.layout-columns`: side-by-side columns with viewport-aligned height.
  - Class `.layout-grid`: cards wrapping to multiple rows.
- **Scrollbar Placement**: Apply `direction: rtl` on `.bookmark-list` and `direction: ltr` on row items to put scrollbars on the left. Style them thin and subtle.
- **Review Button**: Style a compact review button inside each card header when warning states exist.
- **No Global Banner**: Remove `.review-links` styles and keep only compact folder-level review actions.

#### [MODIFY] [newtab.js](file:///C:/Users/Gabriel/OneDrive/Documentos/organizador%20de%20marcadores/src/newtab/newtab.js)
- Dynamically add classes `layout-single`, `layout-columns`, or `layout-grid` to the `#content` container depending on the count of selected folders.
- Do not render a global link-review banner. Failed links are surfaced only with the compact "Revisar" action inside the affected folder header.
- Show failed links in a review view and call `api.bookmarks.remove(id)` only after one-at-a-time confirmation.
- Render the custom logo `logo.png` instead of the generic SVG icon in the header.

---

### Tests

#### [MODIFY] [newtab.test.js](file:///C:/Users/Gabriel/OneDrive/Documentos/organizador%20de%20marcadores/tests/newtab.test.js)
- Update test cases to verify "martabs" title matches and scrollbar direction tags.

#### [MODIFY] [setup.test.js](file:///C:/Users/Gabriel/OneDrive/Documentos/organizador%20de%20marcadores/tests/setup.test.js)
- Update title assertions to match "martabs".

---

## Verification Plan

### Automated Tests
Run Node.js tests:
```powershell
npm test
```

### Manual Verification
1. Run `npm run build` and load target in Chrome.
2. Verify the title, logo, and layout of the options configuration page.
3. Configure a single folder with many bookmarks: check that it expands horizontally and lists bookmarks in columns.
4. Configure 3 folders: check that they lay out side-by-side with independent scrolls and left-side scrollbars.
5. Enable link checks in setup, add or change a monitored folder, confirm that affected folders show "Revisar", and delete one failed bookmark after confirming.
