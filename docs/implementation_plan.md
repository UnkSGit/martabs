# Arquitectura vigente - martabs

Este documento resume como esta armado martabs hoy. Las ideas futuras viven en `docs/roadmap.md`.

## Estructura

- `src/manifest.base.json`: manifest comun.
- `src/manifest.chrome.json`: permisos extra de Chrome, hoy solo `favicon`.
- `src/manifest.firefox.json`: configuracion especifica de Firefox.
- `src/background/service-worker.js`: reindexado, capturas locales pendientes y escucha de cambios.
- `src/shared/i18n-helper.js`: helpers de traduccion (`localizeHtml`, `t`, `initI18n`).
- `src/_locales/*/messages.json`: traducciones (es, en, pt, de, fr, it, ko, zh_CN, ja).
- `src/newtab/*`: tablero de Nueva pestana.
- `src/setup/*`: Configuracion.
- `src/shared/*`: helpers compartidos.
- `tests/*`: tests livianos con `node --test`.
- `scripts/build.mjs`: genera `dist/chrome` y `dist/firefox`.

## Datos locales

Settings principales en `storage.local`:

- `selectedFolderIds`
- `automaticTagsEnabled`
- `manualTagsEnabled`
- `linkHealthEnabled`
- `previewEnabled`
- `previewCaptureEnabled`
- `showPinnedFolder`
- `theme`
- `setupComplete`
- `defaultFolderMode`
- `folderModes`
- `defaultFolderSort`
- `folderSorts`
- `folderBookmarkOrders`
- `bookmarkFolderOverrides`
- `customFavicons`
- `brokenCustomFavicons`

Otras claves:

- `bookmarkIndex`
- `manualTags`
- `linkHealth`
- `capturedPreviews`
- `pendingPreviewCaptures`
- `pinnedBookmarks`

## Indexado de marcadores

El service worker reconstruye `bookmarkIndex` cuando:

- cambian marcadores;
- cambian settings que afectan la estructura del indice (`selectedFolderIds`, `setupComplete`, `bookmarkFolderOverrides`).

Cambios visuales o locales (`folderModes`, `folderSorts`, `theme`, `language`, etc.) no disparan reconstruccion.

`buildBookmarkIndex()` filtra por carpetas seleccionadas y aplica `bookmarkFolderOverrides` para movimientos locales. Luego mezcla etiquetas automaticas, etiquetas manuales y estado de salud.

## Nueva pestana

`newtab.js`:

- carga settings, indice, previews y fijados;
- aplica tema;
- renderiza tablero masonry;
- agrupa marcadores por carpeta;
- inyecta la carpeta virtual `Fijados` si corresponde;
- aplica orden visual;
- maneja busqueda, vista rapida, revision de enlaces, edicion, fijados y drag & drop local.

Reglas:

- La busqueda conserva su ranking propio y no aplica `folderSorts`.
- La carpeta virtual `Fijados` respeta `pinnedBookmarks`.
- El drag & drop es local. No usar `chrome.bookmarks.move` para estos flujos.
- El foco suave depende de `data-folder-id` en cada `.group`.

## Configuracion

`setup` es una sola pagina con secciones:

- `Carpetas`
- `Apariencia`
- `Privacidad`
- `Etiquetas`
- `Avanzado`

`collectSettingsFromForm()` debe partir de `currentSettings` y pisar solo campos visibles. No construir settings desde cero, porque se perderian claves internas como ordenes manuales, iconos custom o estados rotos.

Acciones avanzadas:

- `Restablecer organizacion local`: limpia `bookmarkFolderOverrides` y `folderBookmarkOrders`.
- `Limpiar previews cacheadas`: limpia `capturedPreviews` y `pendingPreviewCaptures`.

## Permisos

Permisos base:

- `bookmarks`
- `storage`
- `favicon` solo en Chrome

Permisos opcionales por URLs:

- Revision de enlaces.
- Capturas locales.

Estas dos opciones comparten el mismo permiso opcional (`<all_urls>`). Configuracion debe pedirlo una sola vez si cualquiera de las dos esta activa, y retirarlo solo cuando ambas estan desactivadas. Esto evita dobles prompts en Chrome y evita que Firefox conceda una opcion y deje la otra en error.

El flujo experimental de captura desde el boton de extension fue eliminado. Las capturas se arman solo cuando el usuario abre un marcador desde martabs y `previewCaptureEnabled` esta activo.

Compatibilidad de background:

- Chrome usa `background.service_worker`.
- Firefox usa `background.scripts` con `type: "module"`.
- `src/manifest.firefox.json` debe sobrescribir el bloque `background` completo para que el build de Firefox no herede el service worker de Chrome.

## Capturas locales

Flujo:

1. `newtab.js` envia `CAPTURE_OPENED_BOOKMARK` antes de navegar.
2. El service worker guarda la captura pendiente por `tabId`.
3. `tabs.onUpdated` detecta carga completa.
4. Se espera un delay corto.
5. `captureVisibleTab` intenta capturar.
6. La imagen se guarda en `capturedPreviews` con limite de cache.

No se usa `webNavigation`, `tabs.onActivated` ni monitoreo general.

## Favicons

Chrome usa el endpoint interno `_favicon` con el permiso `favicon`.

Firefox no soporta ese endpoint. En Firefox martabs intenta un fallback liviano a `/favicon.ico` del dominio del marcador. Si no carga, vuelve al fallback visual con la letra/dominio.

No usar servicios externos de favicons.

## Orden y movimiento local

`src/shared/bookmark-sort.js` centraliza el orden visual.

Criterios:

- `browser`
- `manual`
- `title-asc`
- `date-newest`
- `domain-asc`
- `health-broken-first`

`folderBookmarkOrders` guarda el orden manual dentro de una carpeta.

`bookmarkFolderOverrides` mueve marcadores entre carpetas solo dentro de martabs.

## Pendiente tecnico principal

Limpieza, README publico y preparacion para stores. Ver `docs/task.md` para el estado actual.
