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
2. **Carpeta Virtual:** En `newtab.js`, dentro de `renderDashboard`, la carpeta "ðŸ“Œ Fijados" no existe en la estructura original de marcadores del navegador. Se inyecta al vuelo interceptando el arreglo de marcadores si la configuracion `currentSettings.showPinnedFolder !== false` lo permite.
3. **Visibilidad Dual:** Los marcadores fijados se muestran tanto en la carpeta virtual superior como en su carpeta original.
4. **Ordenamiento Inteligente:** Ademas, la funcion `renderDashboard` aplica un `.sort()` sobre las carpetas reales para que los marcadores fijados suban al inicio de la lista dentro de su propia carpeta, garantizando prioridad visual inmediata.
5. **UI de Acciones:** Se introdujo `.bookmark-actions` en CSS para agrupar ambos botones (Pin y Editar) con `position: absolute` a la derecha. Para evitar que superpongan el texto, `.bookmark` ahora requiere `padding-right: 76px`.

### Consideracion a futuro

Si otro agente necesita agregar un tercer boton, no olvidar incrementar el `padding-right` en `.bookmark` para acomodar el ancho extra de los botones flotantes.

## 2026-05-25 - Masonry Layout Base (Paso 5A)

### Detalles ArquitectÃ³nicos

Se reemplazaron los antiguos modos `layout-single`, `layout-columns` y `layout-grid` por un Ãºnico `layout-masonry` basado en CSS Multi-column (`column-width: 320px`).

1. **Scroll**: El layout delega el scroll al contenedor `.content` (usando `overflow-y: auto`), el cual se estira para usar todo el alto de la pantalla disponible menos el header (mediante `flex-grow: 1`). Esto evita que el search bar desaparezca al hacer scroll.
2. **Alturas DinÃ¡micas**: Las carpetas (`.group`) ya no tienen `max-height` restringido (usan `height: auto`) y pueden crecer lo que necesiten. Usan `break-inside: avoid-column` para no partirse.
3. **Centrado DinÃ¡mico sin JS**: Para evitar que en pantallas muy anchas, 1 o 2 carpetas floten a la izquierda o se expandan torpemente, el script `newtab.js` asigna clases dinÃ¡micas de ancho mÃ¡ximo (`.masonry-1`, `.masonry-2`, `.masonry-3`, `.masonry-max`) a `.content` segÃºn el nÃºmero total de carpetas a renderizar. Esto permite que el `margin: 0 auto` logre un centrado horizontal perfecto.
4. **LÃ­mite de Altura y Scroll Interno**: Para evitar que carpetas gigantes acaparen demasiada altura y rompan el equilibrio visual de las columnas, se fijÃ³ un `max-height: 550px` a `.group`. El contenedor de enlaces (`.bookmark-list`) recibe `overflow-y: auto`, habilitando scroll interno solo para las carpetas excedidas.
5. **Reordenamiento Manual (Drag & Drop)**: Como el CSS Multi-column distribuye los bloques de arriba hacia abajo y de izquierda a derecha, se implementÃ³ Drag & Drop en la vista de ConfiguraciÃ³n (`setup.html`) en lugar de en el tablero. `newtab.js` lee la secuencia ordenada por el usuario en `currentSettings.selectedFolders` y fuerza al motor a renderizar las carpetas exactamente en ese orden.

### Paso 5B: Modos Visuales por Carpeta (Mayo 2026)
**Decisión**: Permitir configurar la visualización de cada carpeta (lista completa, compacta, grilla de iconos, quicklinks) y un estado de 'colapsado', tanto desde configuración como desde la pestaña nueva.
**Razonamiento**: Los usuarios tienen carpetas de diferente naturaleza. Una carpeta de herramientas frecuentes se ve mejor en iconos grandes (quicklinks), mientras que un archivo se ve mejor en una lista compacta.
**Implementación**:
1. **Separación de estado**: Se mantiene el modo visual (folderModes) separado del estado colapsado (collapsedFolders) en storage.local para que una carpeta no olvide su modo al cerrarse.
2. **Sincronización Dual**: Las opciones pueden configurarse masivamente en setup.js o ajustarse interactivamente desde newtab.js.
3. **Manejo CSS Modular**: newtab.js inyecta clases modificadoras (ej. .mode-compact, .mode-icons) en .bookmark-list. Los resultados de búsqueda fuerzan un contenedor .results que no usa estas clases y respeta una vista legible de lista por defecto.
