import test from "node:test";
import assert from "node:assert/strict";
import {
  addChecklistItem,
  deleteChecklistItem,
  loadChecklist,
  updateChecklistItem,
  saveNotesImmediately
} from "../src/shared/widget-persistence.js";
import { createChecklistMutationProcessor, createNotesSaveProcessor } from "../src/shared/widget-persistence.js";

function createStorage(initial = {}, delay = 0) {
  const data = { ...initial };
  return {
    data,
    async get(keys) {
      if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
      if (keys === null) return { ...data };
      if (typeof keys === "string") return { [keys]: data[keys] };
      return Object.fromEntries(keys.map((key) => [key, data[key]]));
    },
    async set(values) {
      if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
      Object.assign(data, values);
    },
    async remove(keys) {
      for (const key of (Array.isArray(keys) ? keys : [keys])) delete data[key];
    }
  };
}

function createApi(initial = {}, delay = 0) {
  const storage = createStorage(initial, delay);
  const process = createChecklistMutationProcessor(storage);
  const processNotes = createNotesSaveProcessor(storage);
  return { storage: { local: storage }, runtime: { sendMessage: ({ type, mutation, value }) => type === "WIDGET_NOTES_SAVE" ? processNotes(value) : process(mutation) } };
}

test("concurrent checklist additions preserve both tasks", async () => {
  const api = createApi({}, 5);
  await Promise.all([
    addChecklistItem(api, "A"),
    addChecklistItem(api, "B")
  ]);

  const items = await loadChecklist(api);
  assert.deepEqual(items.map((item) => item.text).sort(), ["A", "B"]);
});

test("legacy checklist items are migrated to stable identities", async () => {
  const api = createApi({ widgetChecklist: [{ text: "old", checked: true }] });
  const items = await loadChecklist(api);
  assert.equal(items[0].id, "legacy-0-old");
  assert.equal(items[0].checked, true);
});

test("reading checklist does not write storage", async () => {
  const api = createApi({ widgetChecklist: [{ id: "x", text: "kept" }] });
  let writes = 0;
  const originalSet = api.storage.local.set;
  api.storage.local.set = async (...args) => { writes++; return originalSet(...args); };
  await loadChecklist(api);
  assert.equal(writes, 0);
});

test("checklist mutations use stable IDs for edit and delete", async () => {
  const api = createApi();
  const added = await addChecklistItem(api, "A");
  await updateChecklistItem(api, added.id, { checked: true });
  await deleteChecklistItem(api, added.id);
  assert.deepEqual(await loadChecklist(api), []);
});

test("invalid checklist mutations are rejected before storage writes", async () => {
  const api = createApi({ widgetChecklist: [{ id: "x", text: "kept" }] });
  let reads = 0;
  let writes = 0;
  const originalGet = api.storage.local.get;
  const originalSet = api.storage.local.set;
  api.storage.local.get = async (...args) => { reads++; return originalGet(...args); };
  api.storage.local.set = async (...args) => { writes++; return originalSet(...args); };
  await assert.rejects(() => updateChecklistItem(api, "x", { id: "changed" }), /Invalid checklist update/);
  assert.equal(reads, 0);
  assert.equal(writes, 0);
});

test("notes are persisted immediately without waiting for debounce", async () => {
  const api = createApi();
  await saveNotesImmediately(api, "draft");
  assert.equal((await api.storage.local.get("widgetNotes")).widgetNotes, "draft");
});
