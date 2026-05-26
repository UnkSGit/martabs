# Estado actual - martabs

Ultima actualizacion: 2026-05-26.

## Completado

- Extension WebExtension Manifest V3 con builds para Chrome y Firefox.
- Reemplazo de Nueva pestana.
- Configuracion inicial y seleccion de carpetas monitoreadas.
- Reindexado local cuando cambian marcadores o configuracion.
- Busqueda por titulo, URL, dominio, carpeta y etiquetas.
- Etiquetas automaticas y manuales.
- Favicons locales en Chrome y fallback liviano en Firefox usando `/favicon.ico`.
- Vista rapida local sin servicios externos.
- Capturas locales automaticas al abrir marcadores desde martabs.
- Tema claro, oscuro y sistema.
- Logo integrado sin capsula, con brillo aplicado directamente a la imagen.
- Revision opcional de enlaces por carpeta, disparada por el usuario.
- Vista de fallos con scroll, boton volver y eliminacion segura.
- Permisos opcionales para URLs solo cuando revision de enlaces o capturas estan activas, con un unico pedido compartido para ambas opciones.
- Edicion de marcadores desde la UI: titulo, URL, etiquetas, icono custom, eliminar y guardar.
- Fallback de icono custom sin loop entre imagen rota y favicon por defecto.
- Favoritos fijados y carpeta virtual opcional de fijados.
- Modos visuales por carpeta.
- Foco suave cuando una carpeta cambia de vista y el masonry la reacomoda.
- Ordenamiento visual global y por carpeta.
- Orden manual por carpeta con drag & drop local.
- Movimiento local de marcadores entre carpetas monitoreadas.
- Overhaul de Configuracion con secciones, buscador y acciones avanzadas.
- Tests automaticos para busqueda, tags, bookmarks, setup, privacidad, orden, nueva pestana y salud de enlaces.

## Comportamiento importante

- La extension no usa temporizadores para revisar enlaces.
- La extension no revisa enlaces en segundo plano.
- No hay banner global de fallos.
- Los estados de salud de enlace solo se muestran si la opcion esta activada.
- Al desactivar revision de enlaces o capturas, martabs intenta retirar permisos opcionales.
- Las capturas locales se intentan solo si la opcion esta activada y solo para marcadores abiertos desde martabs.
- No se monitorea la navegacion general del usuario.
- El flujo experimental de captura desde el boton de la extension fue eliminado.
- El ordenamiento y los movimientos de marcadores son locales: no cambian el orden ni la carpeta real en Chrome/Firefox.
- Los marcadores fijados siguen arriba dentro de su carpeta.
- La carpeta virtual de fijados respeta el orden local de `pinnedBookmarks`.
- El drag & drop de marcadores solo representa cambios locales de martabs.
- Configuracion esta organizada en `Carpetas`, `Apariencia`, `Privacidad`, `Etiquetas` y `Avanzado`.
- El boton global `Guardar cambios` debe preservar settings internos no visibles en el formulario.

## Pendiente actual

- Multilenguaje con el sistema nativo de extensiones (`_locales`), empezando por `es` y `en`.

### Paso 10: Edición de Nombres de Carpetas y Ajuste Visual
- `[x]` **CSS**: Modificar `.group-header h2` para soportar 2 líneas (`-webkit-line-clamp: 2`).
- `[x]` **Storage**: Agregar `folderNameOverrides: {}` a `DEFAULT_SETTINGS` en `src/shared/storage.js`.
- `[x]` **UI (Tablero)**: Usar `folderNameOverrides` en `newtab.js` y habilitar doble clic para editar (`contenteditable`).
- `[x]` **UI (Setup)**: Usar `folderNameOverrides` en `setup.js` y habilitar doble clic para editar.
- `[x]` **Avanzado**: Hacer que "Restablecer organización local" también limpie `folderNameOverrides`.
- `[ ]` **Tests**: Correr `npm test` y verificar.

### Paso 11: Exportar e Importar Configuración (Robusto)
- `[x]` **Logic**: Crear `src/shared/sync.js` con las funciones `generateExportData` y `parseAndRemapImport`.
- `[x]` **Tests**: Crear `test/sync.test.js` para probar la lógica pura de remapeo.
- `[x]` **UI HTML**: Agregar botones de exportar/importar en `src/setup/setup.html` (Avanzado).
- `[x]` **UI JS**: Implementar los manejadores de eventos en `src/setup/setup.js` llamando a `sync.js`.
- `[x]` **Permisos**: Validar que import_config compruebe `api.permissions.contains` antes de habilitar `linkHealthEnabled`/`previewCaptureEnabled`.
- `[x]` **Tests de Integración**: Correr `npm test` y build.
- Preparar capturas definitivas para Chrome Web Store si se decide publicarla.
- Definir texto final de privacidad para la ficha de publicacion.
- Evaluar tests E2E con navegador si aparecen mas flujos visuales sensibles.

## Registro reciente

Fecha: 2026-05-26
Herramienta: Codex
Resumen: Se agrego fallback `/favicon.ico` para Firefox y se unifico el pedido de permisos de URLs para revision de enlaces y capturas locales.
Archivos tocados: `src/newtab/newtab.js`, `src/setup/setup.js`, `tests/newtab.test.js`, `tests/setup.test.js`, `docs/implementation_plan.md`, `docs/maintenance_notes.md`, `docs/walkthrough.md`, `docs/task.md`.
Verificacion: `npm test` y `npm run build`.
Pendientes: multilenguaje.

Fecha: 2026-05-26
Herramienta: Codex
Resumen: Se corrigio el build de Firefox para usar `background.scripts` en lugar de heredar `background.service_worker`, que Firefox rechaza al cargar el complemento temporal.
Archivos tocados: `src/manifest.firefox.json`, `tests/privacy.test.js`, `docs/implementation_plan.md`, `docs/maintenance_notes.md`.
Verificacion: `npm test`, `npm run build` y revision de `dist/firefox/manifest.json`.
Pendientes: multilenguaje.

Fecha: 2026-05-26
Herramienta: Codex
Resumen: Limpieza general. Se consolido documentacion viva, se quitaron planes historicos ya absorbidos, se retiro el flujo experimental de captura desde el boton de extension y se elimino `activeTab` como permiso fijo.
Archivos tocados: `README.md`, `docs/*`, `src/background/service-worker.js`, `src/manifest.base.json`, `src/manifest.chrome.json`, `src/shared/browser-api.js`, `tests/privacy.test.js`.
Verificacion: pendiente de cierre con `npm test` y `npm run build`.
Pendientes: multilenguaje.

Fecha: 2026-05-26
Herramienta: Codex
Resumen: Se implemento el overhaul de Configuracion: panel con navegacion por secciones, guardado global, buscador de ajustes y acciones avanzadas.
Verificacion: `npm test` y `npm run build`.

Fecha: 2026-05-25
Herramienta: Codex
Resumen: Se implementaron orden global, orden por carpeta, orden manual y drag & drop local.
Verificacion: `npm test`, `npm run build` y revision estatica de UI.

Fecha: 2026-05-25
Herramienta: Codex
Resumen: Se corrigio el flujo de edicion de marcadores y se documento el bug del boton `Guardar`.
Verificacion: `npm test`, `npm run build` e inspeccion visual local.
