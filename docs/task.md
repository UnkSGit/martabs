# Tareas y estado actual - martabs

## Completado

- [x] Extension WebExtension Manifest V3 con builds separados para Chrome y Firefox.
- [x] Reemplazo de Nueva pestana.
- [x] Configuracion inicial de carpetas monitoreadas.
- [x] Reindexado local cuando cambian marcadores o configuracion.
- [x] Busqueda por titulo, URL, dominio, carpeta y etiquetas.
- [x] Etiquetas automaticas y soporte de etiquetas manuales en el modelo de datos.
- [x] Favicons locales en Chrome con fallback visual.
- [x] Vista rapida local sin servicios externos.
- [x] Capturas locales automaticas al abrir marcadores desde martabs, validadas manualmente.
- [x] Tema claro, oscuro y sistema.
- [x] Logo de martabs integrado con capsula clara y borde en modo oscuro.
- [x] Revision opcional de enlaces por carpeta, disparada por el usuario.
- [x] Vista de fallos con scroll, boton volver y eliminacion segura.
- [x] Permisos opcionales de URLs solo cuando la revision de enlaces esta activa.
- [x] Pruebas automaticas de busqueda, tags, bookmarks, setup, privacidad y salud de enlaces.
- [x] Edicion de marcadores desde la UI: titulo, URL, etiquetas manuales, eliminar y guardar.
- [x] Nota obligatoria de mantenimiento para el bug corregido de `Guardar` en edicion.

## Comportamiento importante

- La extension no usa temporizadores para revisar enlaces.
- La extension no revisa enlaces en segundo plano.
- No hay banner global de fallos.
- Los estados de salud de enlace solo se muestran si la opcion esta activada.
- Al desactivar la revision de enlaces, martabs intenta retirar los permisos opcionales.
- Las capturas locales se intentan solo si la opcion esta activada y solo para marcadores abiertos desde martabs; no se monitorea la navegacion general.
- El flujo de capturas locales tiene test de regresion para evitar que vuelva a depender de una espera viva del service worker o de navegacion global.

## Registro reciente

Fecha: 2026-05-25
Herramienta: Codex
Resumen: Se corrigio y documento el flujo de edicion de marcadores. `Guardar` dependia de exponer `bookmarks.update` en `src/shared/browser-api.js`; tambien se documento el patron visual del boton de editar y del modal.
Archivos tocados: `src/shared/browser-api.js`, `src/newtab/newtab.js`, `src/newtab/newtab.html`, `src/newtab/newtab.css`, `tests/newtab.test.js`, `tests/privacy.test.js`, `docs/collaboration.md`, `docs/implementation_plan.md`, `docs/maintenance_notes.md`, `docs/task.md`
Verificacion: `npm test`, `npm run build` e inspeccion visual local del modal y boton de edicion.
Pendientes: leer `docs/maintenance_notes.md` antes de modificar este flujo.

Fecha: 2026-05-25
Herramienta: Codex
Resumen: Se documento como confirmado el flujo de capturas locales automaticas al abrir marcadores desde martabs.
Archivos tocados: `docs/implementation_plan.md`, `docs/walkthrough.md`, `docs/task.md`, `docs/roadmap.md`
Verificacion: cambio documental; la funcionalidad fue validada manualmente por el usuario.
Pendientes: cuando se implemente edicion de marcadores, agregar `No capturar imagen de este marcador` y un estado visual propio para captura denegada.

## Pendiente opcional

- Validacion manual en Firefox antes de publicar.
- Preparar capturas definitivas para Chrome Web Store si se decide publicarla.
- Definir texto final de privacidad para la ficha de publicacion.
- Ver `docs/roadmap.md` para la lista priorizada de proximas mejoras.
- Ver `docs/collaboration.md` para la forma de trabajar entre Codex y Gemini/Antigravity.
