# Notas obligatorias de mantenimiento

Leer este documento antes de tocar flujos sensibles. Sirve para que Codex y Gemini/Antigravity no repitan errores ya encontrados.

## Reglas globales

- Si una accion de UI llama a APIs del navegador, revisar `src/shared/browser-api.js`.
- `setup.js` debe conservar settings completos al guardar. No construir un objeto parcial desde cero.
- No reintroducir servicios externos para previews, favicons, busqueda o metadata.
- No revisar enlaces en service worker ni con temporizadores.
- No capturar navegacion general del usuario.
- No usar `chrome.bookmarks.move` para orden o movimiento local de martabs.
- No reintroducir `backdrop-filter` en cards flotantes o modales que se superponen a carpetas.

## Edicion de marcadores

Problema corregido: el modal aparecia, pero `Guardar` no funcionaba.

Causa real: `newtab.js` llamaba a `api.bookmarks.update(...)`, pero `browser-api.js` no exponia `bookmarks.update`.

Reglas:

- El modal debe mantener `class="edit-form"`.
- El boton de editar usa CSS con `.bookmark-edit-btn::before`, no SVG inyectado.
- `.bookmark` debe conservar espacio para acciones flotantes.
- Los botones del modal deben compartir altura.
- Si se cambia este flujo, actualizar tests de `newtab` y `privacy`.

## Iconos custom

Problema corregido: un icono custom roto podia entrar en loop entre imagen rota y fallback.

Reglas:

- Solo una carga exitosa del icono custom puede limpiar `brokenCustomFavicons`.
- El fallback nunca debe limpiar esa marca.
- Antes de cambiar al favicon por defecto, cambiar `dataset.faviconSource` a `default` y desactivar el `onload` del custom.

## Favoritos fijados

Los fijados se guardan en `pinnedBookmarks`.

Reglas:

- Los fijados se muestran arriba dentro de su carpeta real.
- La carpeta virtual `Fijados` es opcional y no existe en el arbol real.
- Si se agrega otra accion flotante al marcador, revisar el espacio reservado en `.bookmark`.

## Masonry y modos visuales

El layout usa masonry basado en CSS columns.

Reglas:

- Cada carpeta renderizada como `.group` debe conservar `data-folder-id`.
- El foco suave despues de cambiar vista depende de `pendingViewFocusFolderId`, `focusPendingViewFolder()` y `.is-view-focus`.
- En modos con iconos, usar `flex-wrap` en vez de grid dentro de masonry para evitar colapsos visuales en Chrome.
- El estado colapsado se descarto: si el usuario no quiere una carpeta, puede desmarcarla.

## Ordenamiento y drag & drop

Reglas:

- `sortBookmarks` no debe mutar el array recibido.
- `browser` conserva el orden del navegador.
- `manual` usa `folderBookmarkOrders`.
- Los fijados tienen prioridad visual.
- La busqueda no aplica `folderSorts`; mantiene ranking propio.
- El drag & drop es local y debe guardar estado en settings.

## Configuracion

Secciones actuales:

- `Carpetas`
- `Apariencia`
- `Privacidad`
- `Etiquetas`
- `Avanzado`

Reglas:

- `collectSettingsFromForm()` parte de `currentSettings`.
- Preservar claves internas: `bookmarkFolderOverrides`, `folderBookmarkOrders`, `folderNameOverrides`, `customFavicons`, `brokenCustomFavicons` y futuras claves no visibles.
- Las acciones de `Avanzado` son inmediatas y con confirmacion.
- El buscador vive en `#settings-search`.
- `syncSetupContentHeight()` evita saltos de alto entre secciones.

## Nombres personalizados de carpetas

El usuario puede hacer doble clic en el titulo de una carpeta (tanto en el Tablero como en Configuracion) para asignar un alias local.

Reglas:

- Los alias se guardan en `folderNameOverrides` dentro de settings, mapeando `folderId -> string`.
- No modifican el nombre real de la carpeta en el navegador.
- Si el usuario borra el texto o escribe el nombre original, el override se elimina.
- `Restablecer organizacion local` en Avanzado tambien limpia `folderNameOverrides`.
- En el tablero, los titulos de carpeta permiten hasta 2 lineas (`-webkit-line-clamp: 2`). No usar `white-space: nowrap`.

## Exportar e importar configuracion

El modulo `src/shared/sync.js` contiene la logica pura. Es independiente de la UI para facilitar testing.

Estructura del JSON exportado:

- `version`: siempre `1`.
- `settings`: la configuracion completa (filtrada por allowlist al importar).
- `manualTags`: tags manuales del usuario.
- `pinnedBookmarks`: marcadores fijados.
- `refs.bookmarks`: diccionario `id -> URL` para remapear marcadores entre perfiles.
- `refs.folders`: diccionario `id -> path` para remapear carpetas entre perfiles.

Reglas:

- Al exportar, `generateExportData` recibe `folderOptions` (de `getFolderOptions`) ademas de `bookmarkIndex`. El bookmarkIndex solo contiene marcadores, no carpetas.
- Al importar, `parseAndRemapImport` recibe tambien `folderOptions` del arbol actual para construir el mapa de traduccion.
- Si `linkHealthEnabled` o `previewCaptureEnabled` estan activos en el JSON, verificar `api.permissions.contains` antes de activarlos. Si no hay permiso, forzar a `false`.
- No importar claves desconocidas en settings. Usar la allowlist de `booleanSettings` y `stringSettings`.
- No exportar `bookmarkIndex`, `linkHealth`, `capturedPreviews` ni `pendingPreviewCaptures`.
- La UI de importacion muestra un resumen con botones "Confirmar y aplicar" / "Cancelar". No usar `window.confirm()`.

## Permisos y capturas

Estado actual:

- `activeTab` ya no es permiso fijo.
- No hay accion de toolbar para capturar manualmente.
- Las capturas locales se arman solo al abrir marcadores desde martabs.
- La revision de enlaces y las capturas usan permisos opcionales de URLs.
- Firefox no soporta `background.service_worker` en este flujo. Su manifest debe usar `background.scripts`.
- Revision de enlaces y capturas locales comparten `urlPermissions` con `<all_urls>`.

Reglas:

- Si `previewCaptureEnabled` esta apagado, el service worker no debe armar capturas.
- No usar `webNavigation`, `tabs.onActivated` ni captura por navegacion general.
- Al desactivar ambas opciones sensibles, Configuracion debe intentar retirar permisos opcionales.
- No volver a pedir permisos separados para `linkHealthEnabled` y `previewCaptureEnabled`; Firefox puede conceder uno y dejar el otro en falso.
- No quitar el override `background.scripts` de `src/manifest.firefox.json`.

## Favicons por navegador

Chrome usa `_favicon` y el permiso `favicon`.

Firefox no tiene ese mecanismo. El fallback compatible es intentar `https://dominio/favicon.ico` y, si falla, usar el fallback visual de martabs.

Reglas:

- No usar servicios externos para resolver favicons.
- No usar `_favicon` cuando `isFirefoxRuntime()` detecta Firefox.
- Si falla un icono custom, se marca roto y luego se intenta el favicon por defecto del navegador o `/favicon.ico`.
- Si tambien falla el default, usar `favicon-fallback`.

## Bug visual de Chrome con `backdrop-filter`

Chrome puede componer mal capas superpuestas con `backdrop-filter` y botones semitransparentes.

Regla:

- Mantener fondos solidos en elementos flotantes como `.preview-card` o modales que se superponen a carpetas.
