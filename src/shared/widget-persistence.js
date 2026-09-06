const CHECKLIST_KEY = "widgetChecklist";
const MUTATION_MESSAGE = "WIDGET_CHECKLIST_MUTATE";

function makeId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function withId(item, index) {
  return { id: String(item?.id || `legacy-${index}-${String(item?.text || "")}`), text: String(item?.text || ""), checked: Boolean(item?.checked) };
}

export function normalizeChecklist(items) {
  return (Array.isArray(items) ? items : []).map(withId);
}

export function createChecklistMutationProcessor(local) {
  let queue = Promise.resolve();
  return (mutation) => {
    if (mutation?.type === "add") {
      if (!mutation.item?.id || typeof mutation.item.text !== "string" || typeof mutation.item.checked !== "boolean") {
        return Promise.reject(new Error("Invalid checklist add mutation"));
      }
    } else if (mutation?.type === "update") {
      const changes = mutation.changes;
      if (!mutation.id || !changes || Object.keys(changes).some((key) => key !== "checked" || typeof changes[key] !== "boolean")) {
        return Promise.reject(new Error("Invalid checklist update mutation"));
      }
    } else if (mutation?.type === "delete") {
      if (!mutation.id) return Promise.reject(new Error("Invalid checklist delete mutation"));
    } else {
      return Promise.reject(new Error("Invalid checklist mutation"));
    }
    const run = queue.then(async () => {
      const data = await local.get(CHECKLIST_KEY);
      const items = normalizeChecklist(data[CHECKLIST_KEY]);
      if (mutation?.type === "add" && mutation.item?.id) {
        if (!items.some((item) => item.id === String(mutation.item.id))) {
          items.push(withId(mutation.item, items.length));
        }
      } else if (mutation?.type === "update") {
        const item = items.find((candidate) => candidate.id === String(mutation.id));
        if (item) Object.assign(item, mutation.changes || {});
      } else if (mutation?.type === "delete") {
        const index = items.findIndex((candidate) => candidate.id === String(mutation.id));
        if (index >= 0) items.splice(index, 1);
      }
      await local.set({ [CHECKLIST_KEY]: items });
      return { success: true, items };
    });
    queue = run.catch(() => {});
    return run;
  };
}

async function mutate(api, mutation) {
  if (!api.runtime?.sendMessage) throw new Error("Checklist persistence is unavailable");
  const response = await api.runtime.sendMessage({ type: MUTATION_MESSAGE, mutation });
  if (!response?.success) throw new Error(response?.error || "Checklist persistence failed");
  return response.items || [];
}

export async function loadChecklist(api) {
  const data = await api.storage.local.get(CHECKLIST_KEY);
  return normalizeChecklist(data[CHECKLIST_KEY]);
}

export async function addChecklistItem(api, text) {
  const item = { id: makeId(), text: String(text), checked: false };
  await mutate(api, { type: "add", item });
  return item;
}

export async function updateChecklistItem(api, id, changes) {
  return mutate(api, { type: "update", id: String(id), changes: { ...changes } });
}

export async function deleteChecklistItem(api, id) {
  return mutate(api, { type: "delete", id: String(id) });
}

export async function saveNotesImmediately(api, value) {
  if (!api.runtime?.sendMessage) throw new Error("Notes persistence is unavailable");
  const response = await api.runtime.sendMessage({ type: "WIDGET_NOTES_SAVE", value: String(value) });
  if (!response?.success) throw new Error(response?.error || "Notes persistence failed");
}

export function createNotesSaveProcessor(local) {
  let queue = Promise.resolve();
  return (value) => {
    const run = queue.then(async () => {
      await local.set({ widgetNotes: String(value) });
      return { success: true };
    });
    queue = run.catch(() => {});
    return run;
  };
}
