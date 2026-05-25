# Funcionalidades - martabs

Este documento explica las funcionalidades principales desde la perspectiva del usuario final.

## Interfaz principal

- **Layout fluido tipo masonry**: Las carpetas se acomodan automaticamente usando el ancho disponible y evitando huecos grandes.
- **Carpetas monitoreadas**: Se muestran solo las carpetas elegidas en Configuracion.
- **Busqueda instantanea**: La barra superior busca por titulo, URL, dominio, etiqueta o carpeta. `Escape` limpia la busqueda y `Enter` abre el primer resultado.
- **Favoritos fijados**: Los marcadores fijados aparecen primero dentro de su carpeta original. Si esta habilitado, tambien aparece una carpeta virtual superior de fijados. Esa carpeta virtual respeta el orden manual guardado en `pinnedBookmarks`.
- **Orden por carpeta**: Cada carpeta puede usar un orden visual propio: original del navegador, manual, titulo A-Z, mas nuevos primero, dominio A-Z o fallidos primero. Esto no modifica el orden real de los marcadores en Chrome/Firefox.
- **Vista rapida**: Al pasar el cursor sobre un marcador, aparece una tarjeta flotante con titulo, URL, etiquetas, carpeta, estado de enlace y captura local si existe.
- **Acciones rapidas**: Al pasar el cursor sobre un marcador se muestran acciones para fijar/desfijar y editar.

## Configuracion

Accesible desde el boton `Configurar`.

- **Seleccion de carpetas**: Permite elegir que carpetas del navegador seran indexadas.
- **Orden de carpetas**: Las carpetas pueden reordenarse con drag & drop en Configuracion. Ese orden se refleja en el tablero.
- **Modos visuales**: Hay un modo global por defecto y un modo por carpeta: lista, compacta, iconos, iconos grandes o quicklinks. En el tablero, el boton `Vista` rota el modo de una carpeta.
- **Orden de marcadores**: Hay un orden global por defecto y un orden por carpeta. El control se configura desde Configuracion para mantener limpio el tablero. Si una carpeta esta en `Manual`, sus marcadores se pueden reordenar arrastrandolos dentro de esa misma carpeta.
- **Iconos personalizados**: Desde `Editar`, el usuario puede pegar una URL de icono custom. Si falla, martabs muestra el favicon por defecto y marca el error.
- **Etiquetas**: Se pueden activar o desactivar etiquetas automaticas y manuales.
- **Carpeta fijados**: Permite mostrar u ocultar la carpeta virtual superior de fijados.
- **Revision de enlaces**: Permite revisar enlaces caidos por carpeta. Requiere permisos opcionales de acceso a red.
- **Capturas locales**: Si esta activado, martabs intenta guardar una captura liviana de marcadores abiertos desde martabs.

## Revision de enlaces caidos

Si esta habilitada:

1. Aparece un boton `Revisar` en el encabezado de cada carpeta real.
2. Al presionarlo, martabs revisa los enlaces de esa carpeta desde la nueva pestana.
3. Si hay fallos, aparece un contador de fallos en esa carpeta.
4. El contador abre una vista con los enlaces fallidos, acciones de eliminacion y boton `Volver`.
5. Los estados de enlace solo se muestran cuando la opcion esta activada.

## Busqueda y orden

El orden por carpeta solo afecta el tablero normal.

Cuando el usuario busca, martabs conserva el ranking de busqueda para priorizar relevancia. Esto evita que un orden A-Z, por fecha o por dominio esconda el resultado mas probable.
