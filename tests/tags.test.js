import test from "node:test";
import assert from "node:assert/strict";
import { generateAutomaticTags, mergeTags } from "../src/shared/tags.js";

test("generateAutomaticTags uses folders and domain", () => {
  const tags = generateAutomaticTags({
    title: "MDN CSS Grid",
    url: "https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout",
    domain: "developer.mozilla.org",
    folderPath: "Bookmarks Bar / Aprendizaje / CSS"
  });

  assert.deepEqual(tags, ["aprendizaje", "css", "developer.mozilla.org"]);
});

test("generateAutomaticTags ignores accented mobile bookmarks root", () => {
  const tags = generateAutomaticTags({
    domain: "example.com",
    folderPath: "Marcadores m\u00f3viles / Lectura"
  });

  assert.deepEqual(tags, ["lectura", "example.com"]);
});

test("mergeTags keeps manual tags and removes duplicates", () => {
  assert.deepEqual(
    mergeTags(["css", "developer.mozilla.org"], ["CSS", "referencia"]),
    ["css", "developer.mozilla.org", "referencia"]
  );
});
