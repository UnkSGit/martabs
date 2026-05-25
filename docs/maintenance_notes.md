# Notas obligatorias de mantenimiento

Este documento debe leerse antes de tocar flujos sensibles. Sirve para que Codex y Gemini/Antigravity no repitan errores ya encontrados.

## 2026-05-25 - Edicion de marcadores desde la UI

### Problema detectado

El modal de edicion aparecia, pero:

- `Guardar` no funcionaba.
- El icono de lapiz no se veia.
- Al hacer hover sobre un marcador, el boton de editar podia desacomodar la fila.
- El modal tenia poco margen interno.
- `Guardar` quedaba visualmente fuera de linea con `Cancelar` y `Eliminar`.

### Causa real

La falla principal de guardado no estaba en el modal: `src/newtab/newtab.js` llamaba a `api.bookmarks.update(bookmark.id, ...)`, pero `src/shared/browser-api.js` no exponia `bookmarks.update`.

Mientras eso faltara, cambiar HTML o CSS no podia hacer que `Guardar` funcionara.

Tambien habia problemas visuales separados:

- El formulario tenia `id="edit-form"` pero no `class="edit-form"`, por eso los estilos de margen/padding del modal no aplicaban.
- El icono del lapiz dependia de SVG inyectado en JavaScript, que era fragil para este caso.
- El boton de editar necesitaba posicion absoluta dentro de una fila `.bookmark` con `position: relative` y espacio reservado a la derecha.
- Los botones de acciones del modal necesitaban una regla comun de altura.

### Correccion aplicada

Archivos relevantes:

- `src/shared/browser-api.js`
- `src/newtab/newtab.js`
- `src/newtab/newtab.html`
- `src/newtab/newtab.css`
- `tests/newtab.test.js`
- `tests/privacy.test.js`

Cambios importantes:

- Se agrego `bookmarks.update` al adaptador compartido en `getBrowserApi`.
- `showEditModal` deshabilita `Guardar` mientras intenta guardar y muestra error si falla.
- El formulario del dialog ahora tiene `class="edit-form"`.
- El lapiz se dibuja por CSS con `.bookmark-edit-btn::before`, no con SVG inyectado desde JS.
- `.bookmark` reserva espacio con `padding-right: 44px` y actua como referencia con `position: relative`.
- `.bookmark-edit-btn` queda absoluto a la derecha, sin afectar el layout de la fila.
- `.edit-actions .link-action-button`, `.edit-actions .danger-button` y `.edit-actions .primary-button` comparten `height: 30px`.

### Regla para futuros cambios

Cuando una accion de UI llama a APIs del navegador, revisar siempre el adaptador `src/shared/browser-api.js`.

No alcanza con verificar que el codigo de UI llame a `api.algo.metodo(...)`: ese metodo tambien debe existir en el wrapper compartido y tener test de regresion.

### Tests de regresion

Quedaron cubiertos estos puntos:

- El HTML incluye el modal y `class="edit-form"`.
- El CSS incluye el boton de editar, el icono por `::before`, el espacio reservado de la fila y la altura alineada de acciones.
- El controlador llama a `api.bookmarks.update(bookmark.id, ...)`.
- El guardado maneja estado deshabilitado y error visible.
- El adaptador expone `update: api.bookmarks.update`.

Verificacion ejecutada:

- `npm test`
- `npm run build`
- Inspeccion visual local con navegador: lapiz visible, modal con margen, botones alineados y fila sin salto vertical.

## 2026-05-25 - Favoritos Fijados y visibilidad dual

### Detalles de la implementacion

La funcion de "Favoritos Fijados" permite destacar marcadores. 

1. **Estado:** Se almacenan unicamente los IDs de los marcadores en `chrome.storage.local` bajo la clave `STORAGE_KEYS.pinnedBookmarks`.
2. **Carpeta Virtual:** En `newtab.js`, dentro de `renderDashboard`, la carpeta "📌 Fijados" no existe en la estructura original de marcadores del navegador. Se inyecta al vuelo interceptando el arreglo de marcadores si la configuracion `currentSettings.showPinnedFolder !== false` lo permite.
3. **Visibilidad Dual:** Los marcadores fijados se muestran tanto en la carpeta virtual superior como en su carpeta original.
4. **Ordenamiento Inteligente:** Ademas, la funcion `renderDashboard` aplica un `.sort()` sobre las carpetas reales para que los marcadores fijados suban al inicio de la lista dentro de su propia carpeta, garantizando prioridad visual inmediata.
5. **UI de Acciones:** Se introdujo `.bookmark-actions` en CSS para agrupar ambos botones (Pin y Editar) con `position: absolute` a la derecha. Para evitar que superpongan el texto, `.bookmark` ahora requiere `padding-right: 76px`.

### Consideracion a futuro

Si otro agente necesita agregar un tercer boton, no olvidar incrementar el `padding-right` en `.bookmark` para acomodar el ancho extra de los botones flotantes.
