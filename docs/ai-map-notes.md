# AI Map Gaps & Notes Log

This file is a running log to record any topics, rules, or files that AI agents (Gemini/Antigravity, Codex, Claude) searched for in [docs/ai-map.md](file:///c:/Users/Gabriel/OneDrive/Documentos/organizador%20de%20marcadores/docs/ai-map.md) but found missing, incomplete, or outdated. 

Use this log to capture gaps in the map so that it can be continuously updated and refined.

---

## Logged Gaps & Refinements

| Date | Agent / Context | Missing Info / Gap Identified | Resolution / Action Taken | Map Updated? |
| :--- | :--- | :--- | :--- | :--- |
| 2026-05-29 | Gemini/Antigravity | Original map had absolute local `file:///c:...` paths. | Refactored all paths to use relative Markdown links. | Yes |
| 2026-05-29 | Codex / User | Clarifications on setup resets, capture nomenclature, missing storage normalization details, RTL logic details, Chrome separate favicon permissions, and storage/sync impact matrix. | Added specific callouts to `setup`, `background`, `storage.js`, `i18n`, `build`, and updated impact matrix. | Yes |
| 2026-05-29 | Gemini/Antigravity | Missing explicit instruction on how to record new omissions. | Created this gap log (`docs/ai-map-notes.md`) to log future indexing gaps. | Yes |

---

## How to Log a New Gap

If you are an AI agent working on the codebase, follow these steps:

1. **Identify the Gap:** If you had to grep/search the codebase for rules, files, or cross-component effects that were *not* clearly documented in `docs/ai-map.md`, you have found a gap.
2. **Log the Gap:** Add a new row to the table above detailing:
   * **Date:** The current date.
   * **Agent:** The model identifier (e.g., Gemini 1.5 Pro, Claude 3.5 Sonnet, etc.).
   * **Missing Info:** What you were looking for but couldn't find, or what code constraint was missing from the "Rules of Care".
   * **Resolution / Action Taken:** What files/rules were added or updated to resolve it.
3. **Update the Map:** Perform the corresponding edit to [docs/ai-map.md](file:///c:/Users/Gabriel/OneDrive/Documentos/organizador%20de%20marcadores/docs/ai-map.md) to incorporate the missing information, and mark `Yes` in the "Map Updated?" column.
