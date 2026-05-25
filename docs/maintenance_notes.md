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
**Decisión**: Permitir configurar la visualización de cada carpeta (lista completa, compacta, grilla de iconos, quicklinks) tanto desde configuración como desde la pestaña nueva mediante un botón que rota entre modos.
**Razonamiento**: Los usuarios tienen carpetas de diferente naturaleza. Una carpeta de herramientas frecuentes se ve mejor en iconos grandes (quicklinks), mientras que un archivo se ve mejor en una lista compacta. Se descartó el estado "colapsado" por redundante (si no se usa, la carpeta se puede desmarcar en setup).
**Implementación**:
1. **Separación de estado**: Se mantiene el modo visual (`folderModes`) en `storage.local` para que una carpeta recuerde su modo.
2. **Sincronización Dual**: Las opciones pueden configurarse masivamente en `setup.js` o ajustarse interactivamente desde `newtab.js` (botón "Vista").
3. **Manejo CSS Modular**: `newtab.js` inyecta clases modificadoras (ej. `.mode-compact`, `.mode-icons`) en `.bookmark-list`. Los resultados de búsqueda fuerzan un contenedor `.results` que no usa estas clases y respeta una vista legible de lista por defecto.
4. **CSS Grid vs Flexbox en Masonry**: Se intentó usar `display: grid` para `.mode-icons`, pero esto disparó un bug conocido en Chrome al anidarse dentro de CSS Multi-column (`column-width`), causando que las filas colapsaran a `height: 0` y los íconos se solaparan. Se optó por `display: flex; flex-wrap: wrap;` logrando la misma grilla estable sin bugs.
5. **Favicons Custom y Fallback (`size=64`)**: Se añadió soporte para íconos custom (`currentSettings.customFavicons`). Si una imagen custom no se puede cargar, el handler `onerror` registra la falla en `currentSettings.brokenCustomFavicons` y muestra el icono por defecto. Esto detiene bucles infinitos en re-renderizados vinculados al evento `chrome.storage.onChanged`.

## 2026-05-25 - Correccion de loop en iconos custom

### Problema detectado

Cuando un icono custom fallaba, martabs lo marcaba en `brokenCustomFavicons` y cambiaba el `<img>` al favicon por defecto. El problema era que el mismo `onload` seguia activo; cuando cargaba el fallback, borraba la marca de error como si hubiera cargado correctamente el icono custom. Eso disparaba `storage.onChanged`, re-renderizaba, volvia a intentar el custom roto y entraba en loop.

### Regla para futuros cambios

El fallback nunca debe limpiar `brokenCustomFavicons`. Solo una carga exitosa del icono custom puede hacerlo.

### Correccion aplicada

- `renderFavicon` calcula `usingCustomFavicon` antes de crear la imagen.
- El `<img>` guarda su origen en `dataset.faviconSource`.
- Antes de cambiar el `src` al favicon por defecto, se cambia `dataset.faviconSource` a `default` y se desactiva `contentNode.onload`.
- Al guardar desde el modal, si el mismo icono estaba marcado como roto, se limpia la marca para permitir un reintento controlado.
- `DEFAULT_SETTINGS` ahora incluye `brokenCustomFavicons: {}`.
- `tests/newtab.test.js` cubre estas reglas para evitar que vuelva el loop.

## 2026-05-25 - Foco suave al cambiar vista de carpeta

### Problema detectado

Con el layout masonry basado en CSS columns, cambiar el modo visual de una carpeta puede alterar su altura. Cuando eso pasa, el navegador reacomoda automaticamente las columnas y la carpeta puede aparecer en otra posicion. Es comportamiento normal del masonry, pero visualmente puede sentirse como que la carpeta "salto" o se perdio.

### Decision aplicada

No se intenta bloquear el reacomodo del masonry. En su lugar, despues de cambiar la vista:

- `newtab.js` guarda temporalmente el `folderId` en `pendingViewFocusFolderId`.
- Tras re-renderizar, busca la carpeta con `data-folder-id`.
- Aplica `scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" })`.
- Agrega la clase temporal `.is-view-focus`.
- CSS ejecuta `view-focus-pulse` durante 900 ms para orientar visualmente al usuario.

### Regla para futuros cambios

Si se cambian modos visuales, masonry o encabezados de carpetas, conservar `data-folder-id` en `.group`. El foco suave depende de ese atributo para ubicar la carpeta despues del render.

### Tests de regresion

`tests/newtab.test.js` verifica la presencia de:

- `pendingViewFocusFolderId`;
- `focusPendingViewFolder`;
- `scrollIntoView` con `behavior: "smooth"`;
- clase `.is-view-focus`;
- atributo `data-folder-id`;
- animacion CSS `view-focus-pulse`.

## 2026-05-25 - Ordenamiento por carpeta (Paso 7A)

### Detalles de la implementacion

El ordenamiento por carpeta es visual y local. No llama a `chrome.bookmarks.move` ni cambia el orden real de los marcadores del navegador.

Archivos principales:

- `src/shared/bookmark-sort.js`: funcion pura `sortBookmarks`.
- `src/shared/storage.js`: defaults `defaultFolderSort` y `folderSorts`.
- `src/setup/setup.html`: selector global de orden.
- `src/setup/setup.js`: selectores de orden por carpeta y persistencia.
- `src/newtab/newtab.js`: aplica el orden antes de renderizar cada carpeta. No muestra boton `Orden` en el tablero.

### Reglas importantes

- `sortBookmarks` no debe mutar el array recibido.
- El modo `browser` conserva el orden de entrada.
- Si una carpeta no tiene valor en `folderSorts`, usa `defaultFolderSort`.
- El valor `default` solo existe en la UI de Configuracion; no se guarda como override por carpeta.
- Los marcadores fijados quedan primero dentro de cada carpeta real y dentro de ese grupo se aplica el orden elegido.
- La carpeta virtual de fijados es especial: respeta el orden de `pinnedBookmarks`.
- El tablero no debe agregar boton `Orden`; el control vive solo en Configuracion para mantener livianos los encabezados.
- La busqueda no debe aplicar `folderSorts`; mantiene su ranking de relevancia.

### Modos actuales

- `browser`: orden original del navegador.
- `title-asc`: titulo A-Z, comparacion base en espanol.
- `date-newest`: fecha de agregado, nuevos primero; fechas faltantes al final.
- `domain-asc`: dominio A-Z; dominios faltantes al final.
- `health-broken-first`: enlaces con fallos primero cuando hay datos de salud.

### Tests de regresion

- `tests/bookmark-sort.test.js` cubre estabilidad, no mutacion, fechas, dominios, salud y fijados.
- `tests/setup.test.js` cubre selector global y persistencia de `folderSorts`.
- `tests/newtab.test.js` cubre importacion de `sortBookmarks`, aplicacion del orden, ausencia del boton `Orden` y tratamiento especial de fijados.

## 2026-05-25 - Orden manual por carpeta (Paso 7B)

### Detalles de la implementacion

El orden manual se habilita como un criterio mas de orden: `manual`.

Archivos principales:

- `src/shared/bookmark-sort.js`: `sortBookmarks` acepta `manualOrderIds`.
- `src/shared/storage.js`: settings incluye `folderBookmarkOrders`.
- `src/setup/setup.html` y `src/setup/setup.js`: agregan la opcion `Manual`.
- `src/newtab/newtab.js`: habilita drag & drop solo cuando `folderSort === "manual"`.

### Reglas importantes

- El drag & drop de marcadores es local a martabs y no llama a `chrome.bookmarks.move`.
- No habilitar drag & drop si la carpeta usa otro criterio de orden.
- El drop guarda `folderBookmarkOrders[folderId]` y mantiene `folderSorts[folderId] = "manual"`.
- La carpeta virtual `Fijados` no participa del drag & drop.
- Los marcadores fijados siguen arriba dentro de carpetas reales; luego se aplica el orden manual dentro de cada grupo.

### Tests de regresion

- `tests/bookmark-sort.test.js` cubre orden manual y prioridad de fijados.
- `tests/setup.test.js` cubre la opcion `Manual`.
- `tests/newtab.test.js` cubre drag & drop condicionado por `manual`, uso de `folderBookmarkOrders` y ausencia del boton `Orden`.
