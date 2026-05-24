import test from "node:test";
import assert from "node:assert/strict";
import { buildBookmarkIndex, getFolderOptions } from "../src/shared/bookmarks.js";

const tree = [
  {
    id: "0",
    title: "",
    children: [
      {
        id: "1",
        title: "Bookmarks Bar",
        children: [
          {
            id: "10",
            title: "Trabajo",
            children: [
              {
                id: "100",
                title: "Notion",
                url: "https://notion.so/work",
                dateAdded: 1716500000000
              }
            ]
          }
        ]
      },
      {
        id: "2",
        title: "Other Bookmarks",
        children: [
          {
            id: "20",
            title: "Aprendizaje",
            children: [
              {
                id: "200",
                title: "MDN CSS Grid",
                url: "https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout",
                dateAdded: 1716510000000
              }
            ]
          }
        ]
      }
    ]
  }
];

test("getFolderOptions returns folders with paths", () => {
  const folders = getFolderOptions(tree);
  assert.deepEqual(
    folders.map((folder) => ({ id: folder.id, path: folder.path })),
    [
      { id: "1", path: "Bookmarks Bar" },
      { id: "10", path: "Bookmarks Bar / Trabajo" },
      { id: "2", path: "Other Bookmarks" },
      { id: "20", path: "Other Bookmarks / Aprendizaje" }
    ]
  );
});

test("buildBookmarkIndex only indexes selected folders", () => {
  const index = buildBookmarkIndex(tree, ["10"]);
  assert.equal(index.length, 1);
  assert.equal(index[0].id, "100");
  assert.equal(index[0].title, "Notion");
  assert.equal(index[0].domain, "notion.so");
  assert.equal(index[0].folderPath, "Bookmarks Bar / Trabajo");
});
