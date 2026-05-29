# Funcionalidades - martabs

Este documento describe martabs desde la perspectiva del usuario final.

## Interfaz principal

- **Layout masonry:** Las carpetas se acomodan automaticamente segun el ancho disponible.
- **Carpetas monitoreadas:** Se muestran solo las carpetas elegidas en Configuracion.
- **Busqueda instantanea:** Busca por titulo, URL, dominio, etiqueta o carpeta. `Escape` limpia la busqueda y `Enter` abre el primer resultado.
- **Favoritos fijados:** Los marcadores fijados aparecen primero dentro de su carpeta. Tambien pueden aparecer en una carpeta virtual superior.
- **Orden por carpeta:** Cada carpeta puede usar orden original, manual, titulo A-Z, mas nuevos primero, dominio A-Z o fallidos primero.
- **Vista rapida:** Al pasar el cursor sobre un marcador puede aparecer una tarjeta con datos, etiquetas, estado de enlace y captura local si existe.
- **Acciones rapidas:** Al pasar el cursor sobre un marcador se muestran acciones para fijar/desfijar y editar.
- **Modos visuales:** Cada carpeta puede verse como lista, compacta, iconos, iconos grandes o quicklinks.
- **Favicons:** En Chrome usa favicons locales del navegador. En Firefox intenta `/favicon.ico` del sitio y, si falla, muestra el fallback visual.

## Configuracion

Accesible desde el boton `Configurar`.

Secciones:

- **Carpetas:** Elegir carpetas, reordenarlas, definir vista y orden por carpeta.
- **Apariencia:** Tema, vista por defecto, orden por defecto, carpeta virtual de fijados y vista rapida.
- **Privacidad:** Revision de enlaces y capturas locales, ambas con permisos opcionales.
- **Etiquetas:** Etiquetas automaticas y manuales.
- **Avanzado:** Restablecer organizacion local y limpiar previews cacheadas.

Arriba hay un buscador de ajustes. Al escribir, martabs salta a la primera seccion que coincide y filtra las opciones visibles de esa seccion.

El boton `Guardar cambios` aplica la configuracion del formulario. Las acciones de `Avanzado` piden confirmacion y se ejecutan en el momento.

## Revision de enlaces caidos

Si esta habilitada:

1. Aparece un boton `Revisar` en cada carpeta real.
2. Al presionarlo, martabs revisa los enlaces de esa carpeta desde la nueva pestana.
3. Si hay fallos, aparece un contador en esa carpeta.
4. El contador abre una vista con enlaces fallidos, acciones de eliminacion y boton `Volver`.
5. Los estados de enlace solo se muestran cuando la opcion esta activada.

## Capturas locales

Si esta habilitada:

1. El usuario abre un marcador desde martabs.
2. La extension arma una captura pendiente.
3. Cuando la pagina termina de cargar, martabs intenta capturar la pestana visible.
4. La imagen se guarda en cache local y se usa en la vista rapida.

La extension no captura sitios abiertos fuera de martabs y no monitorea la navegacion general.

La revision de enlaces y las capturas locales comparten el mismo permiso opcional de URLs. Si se activan juntas, martabs pide permiso una sola vez.

## Edicion de marcadores

Desde el boton de editar se puede:

- Cambiar titulo.
- Cambiar URL.
- Editar etiquetas manuales.
- Agregar una URL de icono custom.
- Eliminar el marcador.

Si el icono custom falla, martabs vuelve al favicon por defecto y marca el error para evitar loops.

## Busqueda y orden

El orden por carpeta afecta el tablero normal.

Cuando el usuario busca, martabs conserva el ranking de busqueda para priorizar relevancia.

## Idioma

martabs soporta 10 idiomas: espanol, ingles, portugues, aleman, frances, italiano, coreano, chino simplificado, japones y arabe.

El idioma se puede cambiar desde Configuracion > Apariencia. La opcion `Sistema` usa el idioma del navegador. Al elegir un idioma especifico, toda la interfaz se actualiza al guardar sin necesidad de recargar. En el caso del arabe, la interfaz se adapta dinamicamente al diseno de derecha a izquierda (RTL).
