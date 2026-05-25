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
- [x] Tema claro, oscuro y sistema.
- [x] Logo de martabs integrado con capsula clara y borde en modo oscuro.
- [x] Revision opcional de enlaces por carpeta, disparada por el usuario.
- [x] Vista de fallos con scroll, boton volver y eliminacion segura.
- [x] Permisos opcionales de URLs solo cuando la revision de enlaces esta activa.
- [x] Pruebas automaticas de busqueda, tags, bookmarks, setup, privacidad y salud de enlaces.

## Comportamiento importante

- La extension no usa temporizadores para revisar enlaces.
- La extension no revisa enlaces en segundo plano.
- No hay banner global de fallos.
- Los estados de salud de enlace solo se muestran si la opcion esta activada.
- Al desactivar la revision de enlaces, martabs intenta retirar los permisos opcionales.

## Pendiente opcional

- Validacion manual en Firefox antes de publicar.
- Preparar capturas definitivas para Chrome Web Store si se decide publicarla.
- Definir texto final de privacidad para la ficha de publicacion.
- Ver `docs/roadmap.md` para la lista priorizada de proximas mejoras.
- Ver `docs/collaboration.md` para la forma de trabajar entre Codex y Gemini/Antigravity.
