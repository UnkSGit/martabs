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
  
  const bookmarkIndex = {
    "f1": { id: "f1", folderPath: "Folder 1" },
    "f2": { id: "f2", folderPath: "Folder 2" },
    "b1": { id: "b1", url: "https://b1.com" },
    "b2": { id: "b2", url: "https://b2.com" }
  };

  const exported = generateExportData(settings, manualTags, pinnedBookmarks, bookmarkIndex);

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

  // Current session has different IDs, and some items are missing
  const currentBookmarkIndex = {
    "new-f1": { id: "new-f1", folderPath: "Folder 1" }, // Matches old-f1
    "new-b1": { id: "new-b1", url: "https://b1.com" }   // Matches old-b1
  };

  const result = parseAndRemapImport(exportedJson, currentBookmarkIndex);

  // Settings
  assert.strictEqual(result.settings.theme, "dark");
  assert.deepStrictEqual(result.settings.selectedFolderIds, ["new-f1"]); // missing folder is omitted
  assert.deepStrictEqual(result.settings.bookmarkFolderOverrides, {
    "new-b1": "new-f1" // correctly mapped
  }); // missing bookmark override is omitted

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
    parseAndRemapImport({ version: 2 }, {});
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
  }, {});

  assert.strictEqual(result.settings.theme, "dark");
  assert.strictEqual(result.settings.automaticTagsEnabled, true);
  assert.strictEqual(result.settings.hack, undefined); // omitted
  assert.strictEqual(result.settings.setupComplete, undefined); // type mismatch omitted
});
