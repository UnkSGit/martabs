# Plan de Implementación

Este documento sirve para alinear la arquitectura y diseño técnico entre los agentes y el usuario.

## Tareas en curso

### Favoritos Fijados (Completado ✅)

**Objetivo:** Permitir destacar enlaces importantes para un acceso rápido.

**Arquitectura:**
- **Estado Local:** Se usará `chrome.storage.local` con una nueva clave `martabs_pinned` para almacenar un arreglo de `id`s de los marcadores fijados. Además, se añade `showPinnedFolder` en los settings globales.
- **Renderizado Virtual:** Al iniciar la vista de la Nueva Pestaña, se cruzará el listado global de marcadores con los IDs fijados y se creará un grupo virtual (carpeta) al principio llamado "📌 Fijados" (si `showPinnedFolder` no es falso).
- **Visibilidad Dual y Ordenamiento:** Los marcadores fijados se renderizan tanto en el grupo "Fijados" como en su carpeta original. Las carpetas originales reciben un ordenamiento (`.sort()`) interno para mostrar los marcadores fijados al tope de su lista.
- **UI de Interacción:** 
  - Botón flotante al hacer hover sobre un marcador (ícono de Pin/Chincheta), posicionado junto al botón de "Editar".
  - El botón cambiará de estado (Pin lleno vs Pin vacío) dependiendo de si el marcador ya está fijado.
  - Al hacer clic, se actualiza el storage local y se re-renderiza la grilla/lista.

**Impacto:**
No afecta la estructura original de marcadores del navegador (`chrome.bookmarks`), solo la vista interna de martabs.

## Estado confirmado: Modos visuales y foco suave

Los modos visuales por carpeta ya estan implementados sobre el tablero masonry.

**Comportamiento actual:**
- Cada carpeta puede usar un modo visual propio mediante `folderModes` en `storage.local`.
- El usuario puede configurar modos desde Configuracion y tambien rotarlos desde el boton `Vista` en cada carpeta.
- Los resultados de busqueda mantienen una vista legible independiente de los modos visuales.
- El estado colapsado se descarto para mantener la UI simple.

**Foco suave al cambiar vista:**
- Cambiar de modo puede alterar la altura de una carpeta y hacer que CSS masonry la reacomode.
- Para que el usuario no pierda el contexto, `newtab.js` guarda el `folderId` en `pendingViewFocusFolderId`.
- Tras el render, se busca la carpeta por `data-folder-id`, se llama a `scrollIntoView({ behavior: "smooth" })` y se aplica la clase temporal `.is-view-focus`.
- `newtab.css` usa la animacion `view-focus-pulse` para resaltar la carpeta durante 900 ms.

**Regla tecnica:**
- Toda carpeta renderizada como `.group` debe conservar `data-folder-id` si se espera que el foco suave funcione.
- Si se cambia el motor masonry o el render de carpetas, actualizar `tests/newtab.test.js` y `docs/maintenance_notes.md`.

## Estado confirmado: Ordenamiento por carpeta

El Paso 7A del roadmap ya esta implementado como ordenamiento visual por carpeta.

**Comportamiento actual:**
- `defaultFolderSort` define el orden global por defecto.
- `folderSorts` guarda overrides por carpeta.
- Configuracion muestra un selector global y un selector por carpeta.
- El tablero aplica el orden elegido, pero no muestra un boton `Orden` para no sobrecargar el encabezado de las carpetas.
- El orden visual no modifica los bookmarks reales del navegador.
- Los resultados de busqueda conservan su ranking propio.

**Criterios actuales:**
- `browser`
- `manual`
- `title-asc`
- `date-newest`
- `domain-asc`
- `health-broken-first`

**Regla tecnica:**
- La logica vive en `src/shared/bookmark-sort.js`.
- Si se agrega un criterio nuevo, actualizar `SORT_MODES`, los selectores de `setup`, los tests y la documentacion.
- La carpeta virtual `Fijados` no debe tomar el orden global; respeta `pinnedBookmarks`.

## Estado confirmado: Orden manual por carpeta

El Paso 7B ya permite ordenar manualmente marcadores dentro de una carpeta sin moverlos en Chrome/Firefox.

**Comportamiento actual:**
- Configuracion incluye el criterio `Manual`.
- Solo las carpetas configuradas en `Manual` habilitan drag & drop de marcadores en el tablero.
- El orden manual se guarda en `folderBookmarkOrders` dentro de settings.
- Al soltar un marcador, martabs persiste el nuevo orden visual y re-renderiza la carpeta.
- Los marcadores fijados siguen teniendo prioridad visual dentro de la carpeta.
- La carpeta virtual `Fijados` no permite drag & drop de marcadores.

**Regla tecnica:**
- El orden manual es una capa local de martabs. No usar `chrome.bookmarks.move` para este flujo.
- Si se cambia el drag & drop, mantener la condicion `folderSort === "manual"` para no mezclar orden manual con orden A-Z, fecha, dominio o salud.
