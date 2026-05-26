import test from "node:test";
import assert from "node:assert";
import { generateExportData, parseAndRemapImport } from "../src/shared/sync.js";

test("generateExportData creates correct refs map", () => {
  const settings = {
    selectedFolderIds: ["f1"],
    folderNameOverrides: { "f1": "My Folder" },
    bookmarkFolderOverrides: { "b1": "f2" }
  };
  const manualTags = { "b1": ["tag1"] };
  const pinnedBookmarks = ["b2"];
  
  // bookmarkIndex is an array of bookmark objects (no folders)
  const bookmarkIndex = [
    { id: "b1", url: "https://b1.com" },
    { id: "b2", url: "https://b2.com" }
  ];

  // folderOptions is the list from getFolderOptions
  const folderOptions = [
    { id: "f1", title: "Folder 1", path: "Folder 1" },
    { id: "f2", title: "Folder 2", path: "Folder 2" }
  ];

  const exported = generateExportData(settings, manualTags, pinnedBookmarks, bookmarkIndex, folderOptions);

  assert.strictEqual(exported.version, 1);
  assert.strictEqual(exported.refs.folders["f1"], "Folder 1");
  assert.strictEqual(exported.refs.folders["f2"], "Folder 2");
  assert.strictEqual(exported.refs.bookmarks["b1"], "https://b1.com");
  assert.strictEqual(exported.refs.bookmarks["b2"], "https://b2.com");
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
