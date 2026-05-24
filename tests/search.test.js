import test from "node:test";
import assert from "node:assert/strict";
import { searchBookmarks } from "../src/shared/search.js";

const bookmarks = [
  {
    id: "1",
    title: "MDN CSS Grid",
    url: "https://developer.mozilla.org/grid",
    domain: "developer.mozilla.org",
    folderPath: "Aprendizaje / CSS",
    automaticTags: ["aprendizaje", "css"],
    manualTags: ["referencia"]
  },
  {
    id: "2",
    title: "Panel de facturacion",
    url: "https://billing.example.com",
    domain: "billing.example.com",
    folderPath: "Trabajo",
    automaticTags: ["trabajo"],
    manualTags: ["pagos"]
  }
];

test("empty search returns bookmarks unchanged", () => {
  assert.deepEqual(searchBookmarks(bookmarks, ""), bookmarks);
});

test("search matches title, tags, folder, and domain", () => {
  assert.equal(searchBookmarks(bookmarks, "grid")[0].id, "1");
  assert.equal(searchBookmarks(bookmarks, "pagos")[0].id, "2");
  assert.equal(searchBookmarks(bookmarks, "trabajo")[0].id, "2");
  assert.equal(searchBookmarks(bookmarks, "mozilla")[0].id, "1");
});

test("search ignores accents", () => {
  const [result] = searchBookmarks([
    {
      id: "3",
      title: "Guia de facturaci\u00f3n",
      url: "https://example.com/help",
      domain: "example.com",
      folderPath: "Administraci\u00f3n",
      automaticTags: ["finanzas"],
      manualTags: ["contadur\u00eda"]
    }
  ], "administracion");

  assert.equal(result.id, "3");
});

test("search matches URL path segments", () => {
  const [result] = searchBookmarks([
    {
      id: "url-path",
      title: "Reference",
      url: "https://example.com/help/grid",
      domain: "example.com",
      folderPath: "Docs",
      automaticTags: [],
      manualTags: []
    }
  ], "grid");

  assert.equal(result.id, "url-path");
});

test("title matches rank above non-title matches", () => {
  const results = searchBookmarks([
    {
      id: "url-only",
      title: "Reference",
      url: "https://example.com/grid",
      domain: "example.com",
      folderPath: "Docs",
      automaticTags: [],
      manualTags: []
    },
    {
      id: "title-match",
      title: "Grid Guide",
      url: "https://example.com/reference",
      domain: "example.com",
      folderPath: "Docs",
      automaticTags: [],
      manualTags: []
    }
  ], "grid");

  assert.equal(results[0].id, "title-match");
});
