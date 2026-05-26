import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { localizeHtml, t, initI18n, getMessage, normalizeLanguageCode } from "../src/shared/i18n-helper.js";

test("i18n messages files have matching keys", async () => {
  const locales = await readdir("src/_locales");
  const baseJson = JSON.parse(await readFile("src/_locales/es/messages.json", "utf8"));
  const baseKeys = Object.keys(baseJson).sort();

  for (const locale of locales) {
    if (locale === "es") continue;
    const localeJson = JSON.parse(await readFile(`src/_locales/${locale}/messages.json`, "utf8"));
    const localeKeys = Object.keys(localeJson).sort();
    assert.deepStrictEqual(localeKeys, baseKeys, `Las claves de traduccion en ${locale}/messages.json deben ser exactamente iguales a las de es/messages.json.`);
  }
});

test("i18n message files do not contain mojibake", async () => {
  const locales = await readdir("src/_locales");
  for (const locale of locales) {
    const text = await readFile(`src/_locales/${locale}/messages.json`, "utf8");
    assert.doesNotMatch(text, /Ã|Â|ðŸ/, `El archivo de traduccion ${locale}/messages.json contiene posibles caracteres mojibake.`);
  }
});

test("selected CJK locales translate the setup UI instead of falling back to Spanish", async () => {
  const spanish = JSON.parse(await readFile("src/_locales/es/messages.json", "utf8"));

  for (const locale of ["zh_CN", "ja"]) {
    const messages = JSON.parse(await readFile(`src/_locales/${locale}/messages.json`, "utf8"));
    for (const key of [
      "setupHeaderTitle",
      "foldersSection",
      "appearanceSection",
      "privacySection",
      "tagsSection",
      "advancedSection",
      "saveChanges",
      "searchSettingsPlaceholder"
    ]) {
      assert.notStrictEqual(
        messages[key].message,
        spanish[key].message,
        `${locale}/${key} no debe quedar en espanol.`
      );
    }
  }
});

test("legacy zh setting is normalized to zh_CN", () => {
  assert.strictEqual(normalizeLanguageCode("zh"), "zh_CN");
  assert.strictEqual(normalizeLanguageCode("zh_CN"), "zh_CN");
  assert.strictEqual(normalizeLanguageCode("ja"), "ja");
});

test("localizeHtml updates mock DOM elements correctly", () => {
  const translations = {
    "@@ui_locale": "en_US",
    "keyText": "Monitored bookmarks",
    "keyPlaceholder": "Search...",
    "keyTitle": "Configure Settings",
    "keySearch": "extra search keywords"
  };

  const mockApi = {
    i18n: {
      getMessage: (key) => translations[key] || ""
    }
  };

  const textElement = { dataset: { i18n: "keyText" }, textContent: "original" };
  const placeholderElement = { dataset: { i18nPlaceholder: "keyPlaceholder" }, placeholder: "original" };
  const titleElement = { dataset: { i18nTitle: "keyTitle" }, title: "original" };
  const searchElement = { dataset: { i18nSearch: "keySearch", search: "original" } };

  const mockDocument = {
    documentElement: {
      lang: "es"
    }
  };

  const mockRoot = {
    ownerDocument: mockDocument,
    querySelectorAll: (selector) => {
      if (selector === "[data-i18n]") return [textElement];
      if (selector === "[data-i18n-placeholder]") return [placeholderElement];
      if (selector === "[data-i18n-title]") return [titleElement];
      if (selector === "[data-i18n-search]") return [searchElement];
      return [];
    }
  };

  localizeHtml(mockApi, mockRoot);

  assert.strictEqual(mockDocument.documentElement.lang, "en", "El idioma de html deberia ser normalizado a 'en'");
  assert.strictEqual(textElement.textContent, "Monitored bookmarks");
  assert.strictEqual(placeholderElement.placeholder, "Search...");
  assert.strictEqual(titleElement.title, "Configure Settings");
  assert.strictEqual(searchElement.dataset.search, "original extra search keywords");
});

test("t helper returns message or key fallback", () => {
  const mockApi = {
    i18n: {
      getMessage: (key, subs) => {
        if (key === "test") return `hello ${subs ? subs[0] : ""}`.trim();
        return "";
      }
    }
  };

  assert.strictEqual(t(mockApi, "test", ["world"]), "hello world");
  assert.strictEqual(t(mockApi, "missing"), "missing", "Deberia retornar la clave original si falta la traduccion.");
});

test("initI18n loads translations via fetch and custom getMessage handles substitutions and fallback", async () => {
  const originalFetch = globalThis.fetch;

  const mockEnMessages = {
    "hello": { "message": "hello $1" },
    "monitored": {
      "message": "$COUNT$ bookmarks monitored",
      "placeholders": {
        "count": { "content": "$1" }
      }
    }
  };
  const mockEsMessages = {
    "hello": { "message": "hola $1" },
    "fallbackKey": { "message": "solo en espanol" }
  };

  globalThis.fetch = async (url) => {
    if (url.includes("/en/")) {
      return {
        ok: true,
        json: async () => mockEnMessages
      };
    }
    if (url.includes("/es/")) {
      return {
        ok: true,
        json: async () => mockEsMessages
      };
    }
    return { ok: false };
  };

  try {
    await initI18n({ i18n: { getMessage: (k) => k } }, "system");
    assert.strictEqual(getMessage({ i18n: { getMessage: () => "native" } }, "hello"), "native");

    await initI18n({ i18n: { getMessage: (k) => k } }, "en");
    assert.strictEqual(getMessage({ i18n: { getMessage: () => "native" } }, "hello", ["world"]), "hello world");
    assert.strictEqual(getMessage({ i18n: { getMessage: () => "native" } }, "monitored", ["42"]), "42 bookmarks monitored");
    assert.strictEqual(getMessage({ i18n: { getMessage: () => "native" } }, "fallbackKey"), "solo en espanol");
    assert.strictEqual(getMessage({ i18n: { getMessage: () => "native" } }, "@@ui_locale"), "en");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
