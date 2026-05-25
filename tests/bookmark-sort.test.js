import test from "node:test";
import assert from "node:assert/strict";
import { sortBookmarks } from "../src/shared/bookmark-sort.js";

const bookmarks = [
  {
    id: "1",
    title: "Zebra",
    domain: "zeta.example",
    dateAdded: 100,
    linkHealth: { consecutiveFailures: 0 }
  },
  {
    id: "2",
    title: "Árbol",
    domain: "alpha.example",
    dateAdded: 300,
    linkHealth: { consecutiveFailures: 2 }
  },
  {
    id: "3",
    title: "Beta",
    domain: "",
    linkHealth: { consecutiveFailures: 0 }
  },
  {
    id: "4",
    title: "Casa",
    domain: "casa.example",
    dateAdded: 200
  }
];

test("browser sort preserves input order and does not mutate", () => {
  const input = [...bookmarks];
  const result = sortBookmarks(input, "browser");

  assert.deepEqual(result.map((bookmark) => bookmark.id), ["1", "2", "3", "4"]);
  assert.notEqual(result, input);
  assert.deepEqual(input.map((bookmark) => bookmark.id), ["1", "2", "3", "4"]);
});

test("title sort ignores accents and case", () => {
  const result = sortBookmarks(bookmarks, "title-asc");

  assert.deepEqual(result.map((bookmark) => bookmark.id), ["2", "3", "4", "1"]);
});

test("date newest puts missing dates last", () => {
  const result = sortBookmarks(bookmarks, "date-newest");

  assert.deepEqual(result.map((bookmark) => bookmark.id), ["2", "4", "1", "3"]);
});

test("domain sort puts missing domains last", () => {
  const result = sortBookmarks(bookmarks, "domain-asc");

  assert.deepEqual(result.map((bookmark) => bookmark.id), ["2", "4", "1", "3"]);
});

test("health broken first prioritizes failed links", () => {
  const result = sortBookmarks(bookmarks, "health-broken-first");

  assert.equal(result[0].id, "2");
});

test("pinned bookmarks stay first and each group uses selected sort", () => {
  const result = sortBookmarks(bookmarks, "title-asc", ["4", "1"]);

  assert.deepEqual(result.map((bookmark) => bookmark.id), ["4", "1", "2", "3"]);
});

test("manual sort follows stored bookmark ids and keeps unknown ids last", () => {
  const result = sortBookmarks(bookmarks, "manual", [], ["4", "2"]);

  assert.deepEqual(result.map((bookmark) => bookmark.id), ["4", "2", "1", "3"]);
});

test("manual sort keeps pinned bookmarks first", () => {
  const result = sortBookmarks(bookmarks, "manual", ["1"], ["4", "2", "1", "3"]);

  assert.deepEqual(result.map((bookmark) => bookmark.id), ["1", "4", "2", "3"]);
});
