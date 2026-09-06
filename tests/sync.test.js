import test from "node:test";
import assert from "node:assert";
import { generateExportData, parseAndRemapImport, mergeImportedSettings } from "../src/shared/sync.js";

test("generateExportData creates correct refs map", () => {
  const settings = {
    selectedFolderIds: ["f1"],
    folderNameOverrides: { "f1": "My Folder" },
    bookmarkFolderOverrides: { "b1": "f2" },
    customFavicons: { "b3": "https://icons.example/icon.png" }
  };
  const manualTags = { "b1": ["tag1"] };
  const pinnedBookmarks = ["b2"];
  
  // bookmarkIndex is an array of bookmark objects (no folders)
  const bookmarkIndex = [
    { id: "b1", url: "https://b1.com" },
    { id: "b2", url: "https://b2.com" },
    { id: "b3", url: "https://b3.com" }
  ];

  // folderOptions is the list from getFolderOptions
  const folderOptions = [
    { id: "f1", title: "Folder 1", path: "Folder 1" },
    { id: "f2", title: "Folder 2", path: "Folder 2" }
  ];

  const exported = generateExportData(settings, manualTags, pinnedBookmarks, bookmarkIndex, folderOptions);

  assert.strictEqual(exported.version, 1);
  assert.ok(exported.exportedAt);
  assert.doesNotThrow(() => new Date(exported.exportedAt));
  assert.strictEqual(exported.refs.folders["f1"], "Folder 1");
  assert.strictEqual(exported.refs.folders["f2"], "Folder 2");
  assert.strictEqual(exported.refs.bookmarks["b1"], "https://b1.com");
  assert.strictEqual(exported.refs.bookmarks["b2"], "https://b2.com");
  assert.strictEqual(exported.refs.bookmarks["b3"], "https://b3.com");
  
  // Excluye propiedades derivadas o ruidosas explicitamente
  assert.strictEqual(exported.bookmarkIndex, undefined);
  assert.strictEqual(exported.linkHealth, undefined);
  assert.strictEqual(exported.capturedPreviews, undefined);
  assert.strictEqual(exported.pendingPreviewCaptures, undefined);
});

test("parseAndRemapImport remaps custom favicon bookmark ids", () => {
  const exportedJson = {
    version: 1,
    settings: {
      customFavicons: {
        "old-b1": "https://icons.example/icon.png",
        "old-missing": "https://icons.example/missing.png"
      }
    },
    refs: {
      bookmarks: {
        "old-b1": "https://b1.com",
        "old-missing": "https://missing.com"
      },
      folders: {}
    }
  };

  const currentBookmarkIndex = [
    { id: "new-b1", url: "https://b1.com" }
  ];

  const result = parseAndRemapImport(exportedJson, currentBookmarkIndex, []);

  assert.deepStrictEqual(result.settings.customFavicons, {
    "new-b1": "https://icons.example/icon.png"
  });
  assert.strictEqual(result.settings.customFavicons["old-b1"], undefined);
  assert.strictEqual(result.stats.unmappedItems, 1);
});

test("parseAndRemapImport ignores unmapped items and remaps correctly", () => {
  const exportedJson = {
    version: 1,
    settings: {
      theme: "dark",
      selectedFolderIds: ["old-f1", "old-missing-f"],
      bookmarkFolderOverrides: {
        "old-b1": "old-f1",
        "old-b-missing": "old-f1"
      }
    },
    manualTags: {
      "old-b1": ["test"]
    },
    pinnedBookmarks: ["old-b1", "old-b-missing"],
    refs: {
      folders: {
        "old-f1": "Folder 1",
        "old-missing-f": "Missing Folder"
      },
      bookmarks: {
        "old-b1": "https://b1.com",
        "old-b-missing": "https://missing.com"
      }
    }
  };

  // Current session: different IDs, some items missing
  const currentBookmarkIndex = [
    { id: "new-b1", url: "https://b1.com" }
  ];
  const currentFolderOptions = [
    { id: "new-f1", title: "Folder 1", path: "Folder 1" }
  ];

  const result = parseAndRemapImport(exportedJson, currentBookmarkIndex, currentFolderOptions);

  // Settings
  assert.strictEqual(result.settings.theme, "dark");
  assert.deepStrictEqual(result.settings.selectedFolderIds, ["new-f1"]);
  assert.deepStrictEqual(result.settings.bookmarkFolderOverrides, {
    "new-b1": "new-f1"
  });

  // Tags and Pinned
  assert.deepStrictEqual(result.manualTags, { "new-b1": ["test"] });
  assert.deepStrictEqual(result.pinnedBookmarks, ["new-b1"]);

  // Stats
  assert.strictEqual(result.stats.mappedFolders, 1);
  assert.strictEqual(result.stats.mappedTags, 1);
  assert.strictEqual(result.stats.mappedPinned, 1);
  assert.strictEqual(result.stats.unmappedItems > 0, true);
});

test("parseAndRemapImport throws on invalid version", () => {
  assert.throws(() => {
    parseAndRemapImport({ version: 2 }, [], []);
  }, /soportada/);
});

test("parseAndRemapImport throws on invalid json structure (null/string)", () => {
  assert.throws(() => {
    parseAndRemapImport(null, [], []);
  });
  
  assert.throws(() => {
    parseAndRemapImport("just a string", [], []);
  });
});

test("parseAndRemapImport allows only safe settings", () => {
  const result = parseAndRemapImport({
    version: 1,
    settings: {
      theme: "dark",
      hack: "should not be here",
      automaticTagsEnabled: true,
      setupComplete: "string-instead-of-bool"
    }
  }, [], []);

  assert.strictEqual(result.settings.theme, "dark");
  assert.strictEqual(result.settings.automaticTagsEnabled, true);
  assert.strictEqual(result.settings.hack, undefined);
  assert.strictEqual(result.settings.setupComplete, undefined);
});

test("same-profile import maps IDs directly when paths match", () => {
  const exportedJson = {
    version: 1,
    settings: {
      selectedFolderIds: ["5"],
      folderNameOverrides: { "5": "Dev" }
    },
    manualTags: { "10": ["important"] },
    pinnedBookmarks: ["10"],
    refs: {
      folders: { "5": "Barra de marcadores / Desarrollo" },
      bookmarks: { "10": "https://github.com" }
    }
  };

  // Same profile, same IDs
  const bookmarkIndex = [{ id: "10", url: "https://github.com" }];
  const folderOptions = [{ id: "5", title: "Desarrollo", path: "Barra de marcadores / Desarrollo" }];

  const result = parseAndRemapImport(exportedJson, bookmarkIndex, folderOptions);

  assert.deepStrictEqual(result.settings.selectedFolderIds, ["5"]);
  assert.deepStrictEqual(result.settings.folderNameOverrides, { "5": "Dev" });
  assert.deepStrictEqual(result.manualTags, { "10": ["important"] });
  assert.deepStrictEqual(result.pinnedBookmarks, ["10"]);
  assert.strictEqual(result.stats.unmappedItems, 0);
});

test("parseAndRemapImport preserves the complete current settings schema", () => {
  const settings = {
    language: "es",
    selectedFolderIds: ["old-f"],
    automaticTagsEnabled: false,
    localStatsEnabled: true,
    showTopSitesFolder: true,
    topSitesLimit: 12,
    topSitesBlacklist: ["example.com"],
    cleanFolderNames: false,
    enablePinnedShortcuts: false,
    pinnedShortcutModifier: ["Control", "Shift"],
    tabs: [{ id: "tab-1", name: "Trabajo" }],
    folderTabs: { "old-f": "tab-1" },
    activeTabId: "tab-1",
    customWallpaperEnabled: true,
    customWallpaperSlots: [1, 2],
    customWallpaperActiveSlot: 2,
    customWallpaperRotate: true,
    customWallpaperBrightness: 0.7,
    customWallpaperFolderOpacity: 0.4,
    customWallpaperHeaderOpacity: 0.6,
    customWallpaperThemes: { 1: "dark", 2: "light" },
    customWallpaperType: "gradient",
    customWallpaperGradientConfig: { type: "linear", colorA: "#111111", colorB: "#eeeeee", angle: 90, presetId: "x", animated: true },
    widgets: {
      enabled: true,
      collapsed: false,
      style: "compact",
      layout: ["clock", "notes"],
      clock: { enabled: true, format: "24" },
      notes: { enabled: true },
      checklist: { enabled: false },
      weather: { enabled: true, locationLabel: "Buenos Aires", locationQuery: "Buenos Aires", units: "metric" },
      sports: { enabled: false, mode: "teams", league: "soccer-esp-1", favorites: [] }
    }
  };
  const exported = generateExportData(settings, {}, [], [{ id: "old-b", url: "https://example.com" }], [{ id: "old-f", path: "Root / Work" }]);
  const result = parseAndRemapImport(exported, [], [{ id: "new-f", path: "Root / Work" }]);

  assert.strictEqual(result.settings.language, "es");
  assert.strictEqual(result.settings.localStatsEnabled, true);
  assert.deepStrictEqual(result.settings.tabs, settings.tabs);
  assert.deepStrictEqual(result.settings.folderTabs, { "new-f": "tab-1" });
  assert.deepStrictEqual(result.settings.widgets, settings.widgets);
  assert.strictEqual(result.settings.customWallpaperType, "gradient");
  assert.deepStrictEqual(result.settings.customWallpaperGradientConfig, settings.customWallpaperGradientConfig);
  assert.strictEqual(result.settings.customWallpaperThemes[2], "light");
  assert.strictEqual(result.settings.hack, undefined);
});

test("mergeImportedSettings preserves omitted newer settings and merges nested config", () => {
  const current = {
    language: "en",
    localStatsEnabled: true,
    widgets: { enabled: true, clock: { enabled: true, format: "24" }, notes: { enabled: true } }
  };
  const merged = mergeImportedSettings(current, { language: "es", widgets: { clock: { format: "12" } } });
  assert.strictEqual(merged.language, "es");
  assert.strictEqual(merged.localStatsEnabled, true);
  assert.deepStrictEqual(merged.widgets, {
    enabled: true,
    clock: { enabled: true, format: "12" },
    notes: { enabled: true }
  });
});

test("mergeImportedSettings clears explicitly imported dictionaries", () => {
  const merged = mergeImportedSettings({ folderModes: { "f1": "icons" }, localStatsEnabled: true }, { folderModes: {} });
  assert.deepStrictEqual(merged.folderModes, {});
  assert.strictEqual(merged.localStatsEnabled, true);
});

test("parseAndRemapImport rejects unsafe map values and manual tag entries", () => {
  const result = parseAndRemapImport({
    version: 1,
    settings: {
      folderModes: { oldF: "icons", bad: { exploit: true } },
      folderSorts: { oldF: "title-asc" },
      folderNameOverrides: { oldF: { exploit: true } }
    },
    manualTags: { oldB: ["ok", { exploit: true }] },
    refs: { folders: { oldF: "Folder" }, bookmarks: { oldB: "https://example.com" } }
  }, [{ id: "newB", url: "https://example.com" }], [{ id: "newF", path: "Folder" }]);
  assert.deepStrictEqual(result.settings.folderModes, { newF: "icons" });
  assert.deepStrictEqual(result.settings.folderSorts, { newF: "title-asc" });
  assert.deepStrictEqual(result.settings.folderNameOverrides, {});
  assert.deepStrictEqual(result.manualTags, {});
});

test("parseAndRemapImport keeps quicklinks mode and legacy sports favorite strings", () => {
  const result = parseAndRemapImport({
    version: 1,
    settings: {
      folderModes: { oldF: "quicklinks" },
      widgets: { sports: { enabled: true, favorites: ["legacy-team", { teamId: "new-team", teamName: "Team" }] } }
    },
    refs: { folders: { oldF: "Folder" }, bookmarks: {} }
  }, [], [{ id: "newF", path: "Folder" }]);
  assert.deepStrictEqual(result.settings.folderModes, { newF: "quicklinks" });
  assert.deepStrictEqual(result.settings.widgets.sports.favorites, ["legacy-team", { teamId: "new-team", teamName: "Team" }]);
});
