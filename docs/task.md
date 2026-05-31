# Estado actual - martabs

Ultima actualizacion: 2026-05-31.

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
- Tests automaticos para busqueda, tags, bookmarks, setup, privacidad, orden, nueva pestana, salud de enlaces e i18n.
- Exportar e importar configuracion con remapeo robusto por URL/path.
- Playwright Fase 0 y Fase 1 implementadas para infraestructura, smoke y MVP en Chrome.
- Paso 12: Internacionalizacion (i18n) completa con selector de idioma y 11 idiomas: Sistema, Espanol, Ingles, Portugues, Aleman, Frances, Italiano, Coreano, Ruso, Arabe, Chino simplificado y Japones.
- Sitios frecuentes opcionales usando Top Sites del navegador.
- Estadisticas de uso locales opcionales con grafico, reset y exportacion JSON.
- Fondos personalizados por imagen con IndexedDB, slots, rotacion, brillo y opacidad de superficies.
- Fondos por degradado con presets, editor lineal/radial y animacion Aurora opcional.
- Capturas publicas/documentales regeneradas con Playwright.

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
- La preview del selector de degradados reutiliza textos i18n existentes del tablero real (`loadingBookmarks`, `settingsBtn`, `searchPlaceholder`) y el logo real `src/images/newlogo.png`.
- El selector claro/oscuro de fondo personalizado cambia la interfaz, no debe alterar la oscuridad del degradado.
- En degradados radiales, el control de angulo debe ocultarse/deshabilitarse.

## Registro reciente

Fecha: 2026-05-31
Herramienta: Codex
Resumen: Cierre de etapa de fondos por degradado y limpieza general. Se mejoro la preview de degradados para parecerse al tablero real con logo, status, boton de configuracion, buscador y mini carpetas; se reutilizaron claves i18n existentes para los textos de la preview. Se corrigio el test i18n para usar `process.execPath` y no depender del `node` global. Se regeneraron capturas de documentacion, arabe y store screenshots con Playwright/Chrome. Se actualizo `README.md` con fondos personalizados, degradados/Aurora, Top Sites, estadisticas locales, 11 idiomas y detalles de colaboracion IA.
Archivos tocados: `README.md`, `docs/task.md`, `src/setup/setup.html`, `src/setup/setup.css`, `src/setup/setup.js`, `src/newtab/newtab.css`, `src/newtab/newtab.js`, `tests/setup.test.js`, `tests/i18n.test.js`, capturas en `docs/assets/screenshots/*` y `docs/assets/store_screenshots/*`.
Verificacion: build correcto; `node --test` (65/65); `scripts/i18n-maintain.mjs --check`; Playwright Chromium para `documentation-screenshots`, `arabic-screenshots` y `store-screenshots` (3/3).

## Pendiente actual

### Paso 12: Internacionalizacion (i18n)

Estado: completado. La base tecnica y el selector manual de idioma ya estan implementados; soporte para Sistema, Espanol, Ingles, Portugues y Aleman.

- `[x]` **Build & Manifest**:
  - `[x]` Configurar `"default_locale": "es"` y `__MSG_...` en `src/manifest.base.json`.
  - `[x]` Agregar `"src/_locales"` a `copyPaths` en `scripts/build.mjs`.
- `[x]` **Locales & Messages**:
  - `[x]` Crear `src/_locales/es/messages.json`.
  - `[x]` Crear `src/_locales/en/messages.json`.
- `[x]` **Helpers**:
  - `[x]` Modificar `src/shared/browser-api.js` para exponer `i18n.getMessage` con fallback.
  - `[x]` Crear `src/shared/i18n-helper.js` con `localizeHtml` (soporte `ownerDocument`) y `t()`.
  - `[x]` Modificar `src/shared/render.js` (`formatDate`) para locale dinamico.
  - `[x]` Modificar `src/shared/sync.js` para usar codigos de error.
- `[x]` **HTML & JS Localizacion**:
  - `[x]` Localizar `src/newtab/newtab.html` con atributos `data-i18n-*`.
  - `[x]` Localizar `src/newtab/newtab.js` con `localizeHtml` and `t()`.
  - `[x]` Localizar `src/setup/setup.html` con `data-i18n-*` y `data-i18n-search`.
  - `[x]` Localizar `src/setup/setup.js` con `localizeHtml` y `t()`.
- `[x]` **Tests**:
  - `[x]` Modificar `tests/newtab.test.js` y `tests/setup.test.js` para buscar `data-i18n-*`.
  - `[x]` Crear `tests/i18n.test.js` para paridad de claves, test de helper y deteccion de mojibake.
- `[x]` **Verificacion automatica**:
  - `[x]` Correr `npm test` y asegurar que pase.
  - `[x]` Correr `npm run build`.
- `[x]` **Selector de idioma en Configuracion**:
  - `[x]` Agregar opcion de idioma para elegir `Sistema`, `Espanol`, `Ingles` y futuros idiomas.
  - `[x]` Guardar la preferencia en `settings`.
  - `[x]` Hacer que `t()` y `localizeHtml()` puedan usar el idioma elegido por el usuario cuando no sea `Sistema`.
  - `[x]` Actualizar textos visibles sin depender exclusivamente del idioma del navegador.
  - `[x]` Agregar tests del selector y del fallback a `@@ui_locale`.
- `[x]` **Mas idiomas**:
  - `[x]` Definir lista inicial de idiomas extra.
  - `[x]` Crear nuevos `_locales/<idioma>/messages.json`.
  - `[x]` Mantener paridad exacta de claves con `tests/i18n.test.js`.
- `[x]` **Validacion manual**:
  - `[x]` Probar idioma del sistema.
  - `[x]` Probar idioma forzado desde Configuracion.
  - `[x]` Probar Chrome y Firefox.

### Paso 13: Limpieza, README publico y capturas

Estado: completado. Limpieza, README, documentacion y capturas con datos controlados completados.

- `[x]` **Limpieza de codigo y repo**:
  - `[x]` Revisar archivos no usados, pruebas obsoletas, planes historicos absorbidos y artefactos temporales.
  - `[x]` Verificar que `dist/`, `test-results/` y screenshots generados no se suban si no corresponde.
  - `[x]` Revisar `package.json`, scripts y nombres de comandos.
  - `[x]` Correr `npm test` y `npm run build` al cerrar.
- `[x]` **README publico**:
  - `[x]` Reescribir README con descripcion clara, instalacion, desarrollo, privacidad, permisos y capturas.
  - `[x]` Agregar capturas tomadas con Playwright como ejemplos visuales.
  - `[x]` No mencionar inspiraciones de producto o referencias visuales externas.
  - `[x]` Dejar claro que el desarrollo fue colaborativo con Antigravity y modelos Gemini 3.5 Pro, Gemini 3.5 Fast y Codex GPT 5.5, verificando antes la denominacion publica exacta de cada herramienta/modelo.
- `[x]` **Capturas con Playwright**:
  - `[x]` Preparar datos de ejemplo reproducibles.
  - `[x]` Tomar screenshots de dashboard, busqueda, configuracion, modos visuales y edicion.
  - `[x]` Guardar capturas en una carpeta apta para documentacion, con nombres claros.
- `[x]` **Documentacion para terceros**:
  - `[x]` Investigar si hace falta documentacion adicional para que cualquier persona pueda levantar el proyecto desde su entorno.
  - `[x]` Documentar requisitos, instalacion, carga temporal en Chrome/Firefox, ejecucion de tests, build y estructura del proyecto.
  - `[x]` Documentar como colaborar con modelos propios sin depender de Codex/Gemini/Antigravity.
  - `[x]` Agregar una guia breve de decisiones tecnicas y flujos sensibles.


### Paso 14: Preparacion para publicar en stores

Estado: en progreso. Base publica, privacidad, licencia y paquetes generados; falta activar GitHub Pages y completar la carga en stores.

- `[ ]` **Requisitos de publicacion**:
  - `[x]` Revisar documentacion oficial vigente de Chrome Web Store.
  - `[x]` Revisar documentacion oficial vigente de Firefox Add-ons.
  - `[x]` Preparar checklist de assets, tamanos, screenshots, descripciones y categorias.
- `[x]` **Privacidad y avisos legales**:
  - `[x]` Redactar texto final de privacidad para publicacion.
  - `[x]` Explicar permisos base y opcionales en lenguaje claro.
  - `[x]` Aclarar que los datos se guardan localmente y no se usan servicios externos.
  - `[x]` Preparar politica de privacidad externa para GitHub Pages.
- `[x]` **Licencias**:
  - `[x]` Definir licencia del proyecto.
  - `[x]` Revisar licencias de dependencias.
  - `[x]` Agregar archivo `LICENSE`.
  - `[x]` Agregar avisos de terceros si hiciera falta.
- `[x]` **Ficha publica sin referencias indebidas**:
  - `[x]` Quitar referencias a inspiraciones, marcas o comparaciones no necesarias.
  - `[x]` Evitar claims ambiguos o dificiles de probar.
  - `[x]` Preparar descripcion corta, descripcion larga, changelog inicial y textos promocionales.
- `[x]` **Paquetes finales**:
  - `[x]` Generar build final de Chrome.
  - `[x]` Generar build final de Firefox.
  - `[x]` Verificar manifests finales, permisos y archivos incluidos.
  - `[x]` Probar instalacion limpia en ambos navegadores.
- `[ ]` **Publicacion manual pendiente**:
  - `[x]` Activar GitHub Pages desde `main` / `/docs`.
  - `[x]` Verificar URL publica `https://unksgit.github.io/martabs/privacy_policy.html`.
  - `[ ]` Cargar paquetes en Chrome Web Store y Firefox Add-ons.

## Completado tecnico reciente

### Paso 10: Edicion de Nombres de Carpetas y Ajuste Visual

- `[x]` **CSS**: Modificar `.group-header h2` para soportar 2 lineas (`-webkit-line-clamp: 2`).
- `[x]` **Storage**: Agregar `folderNameOverrides: {}` a `DEFAULT_SETTINGS` en `src/shared/storage.js`.
- `[x]` **UI (Tablero)**: Usar `folderNameOverrides` en `newtab.js` y habilitar doble clic para editar (`contenteditable`).
- `[x]` **UI (Setup)**: Usar `folderNameOverrides` en `setup.js` y habilitar doble clic para editar.
- `[x]` **Avanzado**: Hacer que "Restablecer organizacion local" tambien limpie `folderNameOverrides`.
- `[x]` **Tests**: Correr `npm test` y verificar.

### Paso 11: Exportar e Importar Configuracion (Robusto)

- `[x]` **Logic**: Crear `src/shared/sync.js` con las funciones `generateExportData` y `parseAndRemapImport`.
- `[x]` **Tests**: Crear `test/sync.test.js` para probar la logica pura de remapeo.
- `[x]` **UI HTML**: Agregar botones de exportar/importar en `src/setup/setup.html` (Avanzado).
- `[x]` **UI JS**: Implementar los manejadores de eventos en `src/setup/setup.js` llamando a `sync.js`.
- `[x]` **Permisos**: Validar que import_config compruebe `api.permissions.contains` antes de habilitar `linkHealthEnabled`/`previewCaptureEnabled`.
- `[x]` **Tests de Integracion**: Correr `npm test` y build.

### Playwright Fase 0: Infraestructura y Smoke

- `[x]` Instalar dependencias (`@playwright/test` y navegadores).
- `[x]` Crear `playwright.config.mjs` configurado para Chromium y Firefox.
- `[x]` Crear fixtures (`e2e/fixtures/extension.fixture.mjs`) para inyectar la extension en Chrome y Firefox.
- `[x]` Crear helper (`e2e/helpers/bookmarks.helper.mjs`) para inyectar marcadores usando `api.bookmarks`.
- `[x]` Escribir `e2e/tests/smoke.spec.mjs` para validar la infraestructura.
- `[x]` Correr smoke test y documentar resultados/limitaciones.

### Playwright Fase 1: MVP en Chrome

- `[x]` Crear Page Objects base (`e2e/pages/setup.page.mjs`, `e2e/pages/newtab.page.mjs`).
- `[x]` Escribir `e2e/tests/setup.spec.mjs` (HU-1, S-01 a S-05 con screenshot).
- `[x]` Escribir `e2e/tests/dashboard.spec.mjs` (HU-2, T-01 a T-03 con screenshot).
- `[x]` Escribir `e2e/tests/search.spec.mjs` (HU-3, B-01 a B-02).
- `[x]` Correr la suite en Chrome, asegurar que pase verde y generar screenshots de referencia.

## Registro reciente

Fecha: 2026-05-29
Herramienta: Antigravity
Resumen: Preparación v0.9.6. Se resolvieron violaciones de CSP en Manifest V3 extrayendo el script inline de detección de tema de head a un archivo externo unificado `src/shared/theme-init.js` para newtab y setup. Se implementó el efecto de vidrio templado (transparencia y glassmorphism) en la ventana de Configuración (`setup.html`) en modo claro, sincronizando variables de tema y gradientes con el tablero principal. Se estilizaron los menús desplegables (`select`) con fondos translúcidos y hover en modo claro, manteniendo opciones (`option`) opacas sólidas para legibilidad. Se crearon los documentos `docs/ai-map.md` y `docs/ai-map-notes.md` para guiar a los agentes de IA en el desarrollo y se marcó su lectura como obligatoria en los READMEs del proyecto.
Archivos tocados: `src/newtab/newtab.html`, `src/setup/setup.html`, `src/setup/setup.css`, `src/shared/theme-init.js`, `tests/setup.test.js`, `docs/ai-map.md`, `docs/ai-map-notes.md`, `README.md`, `README.es.md`, `docs/task.md`.
Verificación: `npm test` (63 tests correctos), `npm run build` y validación visual.

Fecha: 2026-05-26
Herramienta: Codex
Resumen: Paso 14 parcial. Se preparo GitHub Pages desde `docs/` con landing y politica de privacidad publica, se agregaron textos de store/reviewer en ingles, se configuro soporte con `martabs.extension@gmail.com`, se agrego licencia GPL-3.0-only y se creo `npm run package` para generar zips finales de Chrome y Firefox en `release/`.
Archivos tocados: `README.md`, `.gitignore`, `LICENSE`, `package.json`, `scripts/package.mjs`, `docs/index.html`, `docs/privacy_policy.html`, `docs/privacy_policy.md`, `docs/store_listing.md`, `docs/reviewer_notes.md`, `docs/implementation_plan_step14.md`, `docs/task.md`.
Verificacion: `npm test` (47 tests correctos), `npm run package`, inspeccion de zips con `manifest.json` en la raiz.
Pendientes: activar GitHub Pages en GitHub, verificar URL publica de privacy policy y probar instalacion limpia desde paquetes antes de subir a stores.

Fecha: 2026-05-26
Herramienta: Codex
Resumen: Cierre de Paso 13. Se agrego un generador E2E de capturas para documentacion con datos de ejemplo controlados y API WebExtension simulada, evitando usar marcadores reales. Se generaron capturas de dashboard oscuro, dashboard claro, busqueda, configuracion, modos visuales y edicion de marcador en `docs/assets/screenshots/`, y se enlazaron desde `README.md`.
Archivos tocados: `README.md`, `docs/task.md`, `e2e/fixtures/extension.fixture.mjs`, `e2e/tests/documentation-screenshots.spec.mjs`, `docs/assets/screenshots/*`.
Verificacion: `npm run build`; `CHROME_EXECUTABLE_PATH="C:\Program Files\Google\Chrome\Application\chrome.exe" npx playwright test e2e/tests/documentation-screenshots.spec.mjs --project=chromium`.
Pendientes: Paso 14, preparacion para publicacion en stores.

Fecha: 2026-05-26
Herramienta: Antigravity
Resumen: Extension de i18n y resolucion de bug de parpadeo de favicons en Firefox. Se agregaron frances (fr), italiano (it), coreano (ko), chino simplificado (zh_CN) y japones (ja) con paridad de claves, corrigiendo problemas de codificacion de caracteres (mojibake) y de desborde de recuadro en frances. Se soluciono el parpadeo de favicons en Firefox al cambiar el modo de visualizacion de carpetas, realizando actualizaciones de clases en el DOM in-place y filtrando el callback del storage en el service-worker para evitar reconstruir el indice de marcadores en cambios meramente visuales.
Archivos tocados: `src/newtab/newtab.js`, `src/newtab/newtab.css`, `src/setup/setup.css`, `src/background/service-worker.js`, `src/_locales/*`, `tests/newtab.test.js`, `tests/privacy.test.js`, `tests/i18n.test.js`.
Verificacion: `npm test` (47 tests correctos) y `npm run build`.

Fecha: 2026-05-26
Herramienta: Antigravity
Resumen: Paso 13 (parcial) - Limpieza, README publico y documentacion. Se consolidaron las carpetas de pruebas (`test/` -> `tests/`), se eliminaron directorios vacios (`mockups/`, `tools/`, `docs/superpowers/`) y el plan obsoleto `docs/implementation_plan_i18n.md`. Se reescribio README.md con descripcion clara, privacidad, instalacion, desarrollo, estructura del proyecto y mencion de la colaboracion con IA. Se actualizaron docs vivos: `docs/implementation_plan.md` (arquitectura i18n, filtrado de rebuild), `docs/roadmap.md` (multilenguaje cerrado), `docs/walkthrough.md` (seccion idioma), `docs/testing.md` (cobertura ampliada). Quedan pendientes las capturas con Playwright usando datos de ejemplo controlados.
Archivos tocados: `README.md`, `docs/task.md`, `docs/implementation_plan.md`, `docs/roadmap.md`, `docs/walkthrough.md`, `docs/testing.md`. Eliminados: `test/`, `mockups/`, `tools/`, `docs/superpowers/`, `docs/implementation_plan_i18n.md`.
Verificacion: `npm test` (47 tests correctos) y `npm run build`.

Fecha: 2026-05-26
Herramienta: Antigravity
Resumen: Paso 12 finalizado - Internacionalizacion (i18n) completa. Se agrego un selector manual de idioma en el panel de Configuracion (seccion Apariencia) permitiendo cambiar el idioma a Sistema, Espanol, Ingles, Portugues y Aleman de forma dinamica al guardar, actualizando de inmediato la UI (incluyendo la lista de carpetas y opciones de ordenamiento). Se generaron los archivos de traduccion en pt y de con paridad de claves y tests locales/automatizados exitosos.
Archivos tocados: `src/shared/storage.js`, `src/shared/i18n-helper.js`, `src/setup/setup.html`, `src/setup/setup.js`, `src/newtab/newtab.js`, `src/_locales/es/messages.json`, `src/_locales/en/messages.json`, `src/_locales/pt/messages.json`, `src/_locales/de/messages.json`, `tests/i18n.test.js`, `tests/setup.test.js`, `docs/task.md`.
Verificacion: `npm test` (43 tests correctos), `npm run build` y Playwright `npm run test:e2e:chrome` (14/14 tests correctos).

Fecha: 2026-05-26
Herramienta: Codex
Resumen: Se actualizo `docs/task.md` para reflejar el estado real: Paso 10, Paso 11, Playwright Fase 0 y Playwright Fase 1 cerrados; Paso 12 queda abierto por selector de idioma, mas idiomas y validacion manual; los opcionales pasan a pendientes formales de limpieza, README, capturas, documentacion para terceros y preparacion de stores.
Archivos tocados: `docs/task.md`.
Verificacion: revision documental.
Pendientes: ejecutar los nuevos pasos 12, 13 y 14.

Fecha: 2026-05-26
Herramienta: Codex
Resumen: Cierre de pendientes de i18n. Se localizaron textos dinamicos restantes en Nueva pestana (`reviewing`, `delete`, `noFolder`), se reemplazo el identificador visual de Fijados por una clave interna estable sin emoji, y se agregaron tests para evitar mojibake en `_locales` y strings sin traducir en `newtab.js`.
Archivos tocados: `src/newtab/newtab.js`, `src/_locales/es/messages.json`, `src/_locales/en/messages.json`, `tests/newtab.test.js`, `tests/i18n.test.js`.
Verificacion: `npm test` (42 tests) y `npm run build`.
Pendientes: selector de idioma, mas idiomas y validacion manual en navegador.

Fecha: 2026-05-26
Herramienta: Antigravity
Resumen: Paso 11 - Exportar/Importar configuracion con remapeo robusto de IDs por URL y path. Modulo puro `sync.js`, UI con resumen y confirmacion, seguridad de permisos.
Archivos tocados: `src/shared/sync.js` (nuevo), `test/sync.test.js` (nuevo), `src/setup/setup.html`, `src/setup/setup.js`, `src/shared/storage.js`, `docs/maintenance_notes.md`.
Verificacion: `npm test` (35 tests), `npm run build`.

Fecha: 2026-05-26
Herramienta: Antigravity
Resumen: Paso 10 - Nombres personalizados de carpetas (doble clic) y titulo de carpeta expandido a 2 lineas. Toggle marcar/desmarcar todas las carpetas en Configuracion.
Archivos tocados: `src/newtab/newtab.js`, `src/newtab/newtab.css`, `src/setup/setup.js`, `src/setup/setup.html`, `src/shared/storage.js`.
Verificacion: `npm test`, `npm run build`.

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
