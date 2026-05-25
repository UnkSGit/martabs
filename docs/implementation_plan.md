# Estado de implementacion - martabs

Este documento describe la arquitectura actual de martabs. Ya no funciona como un plan pendiente: es una referencia rapida para entender como esta armado el proyecto.

## Objetivo

Crear una pagina de Nueva pestana muy rapida, visual y privada para navegar carpetas de marcadores. La extension debe ayudar a encontrar marcadores por busqueda y permitir revisar enlaces caidos sin molestar ni cargar trabajo innecesario en segundo plano.

## Flujo principal

1. El usuario abre `Configurar`.
2. Elige una o mas carpetas de marcadores.
3. Elige si quiere etiquetas automaticas, etiquetas manuales, revision de enlaces y tema visual.
4. martabs guarda la configuracion en `storage.local`.
5. El service worker reconstruye el indice local de marcadores.
6. La Nueva pestana lee ese indice y renderiza columnas, busqueda, favicons y vista rapida.

## Componentes

### `src/background/service-worker.js`

- Escucha cambios de marcadores y configuracion.
- Reconstruye el indice local con los datos de las carpetas elegidas.
- Mezcla etiquetas manuales y automaticas.
- Adjunta el ultimo estado conocido de salud de cada enlace.
- No revisa enlaces y no usa alarmas.

### `src/setup/*`

- Muestra las carpetas disponibles.
- Guarda preferencias.
- Pide permisos opcionales de URLs solo si el usuario activa la revision de enlaces.
- Intenta quitar esos permisos cuando el usuario desactiva la opcion.
- Aplica tema claro, oscuro o sistema.

### `src/newtab/*`

- Reemplaza la pagina Nueva pestana.
- Renderiza las carpetas monitoreadas como columnas o grilla segun la cantidad.
- Permite buscar por titulo, URL, dominio, carpeta y etiquetas.
- Usa favicons locales en Chrome y fallback textual cuando no hay favicon.
- Muestra una vista rapida local al pasar el mouse.
- Ejecuta la revision de enlaces desde cada carpeta con el boton `Revisar`, solo cuando la opcion esta activa.
- Muestra fallos dentro de la carpeta afectada y permite eliminar enlaces desde la vista de revision.

### `src/shared/*`

- `browser-api.js`: adaptador minimo para Chrome/Firefox.
- `bookmarks.js`: obtiene carpetas, recorre el arbol y arma el indice.
- `search.js`: busqueda local.
- `tags.js`: etiquetas automaticas y mezcla con manuales.
- `storage.js`: lectura/escritura de `storage.local`.
- `link-health.js`: normaliza resultados de revision de enlaces.
- `render.js`: utilidades DOM y formato de fechas.

## Revision de enlaces

La revision actual es deliberadamente manual:

- no corre cada dia;
- no depende de temporizadores;
- no se ejecuta en el service worker;
- no muestra banner global;
- solo aparece en cada carpeta cuando la opcion esta activada.

El boton `Revisar` comprueba los enlaces de esa carpeta, guarda el resultado y vuelve a renderizar. Si hay fallos, la carpeta muestra un boton compacto con la cantidad de fallos.

## Builds

El build une `src/manifest.base.json` con el manifiesto especifico de cada navegador:

- Chrome: `src/manifest.chrome.json`
- Firefox: `src/manifest.firefox.json`

El resultado queda en:

- `dist/chrome`
- `dist/firefox`

## Verificacion recomendada

```powershell
npm test
npm run build
```

Despues conviene probar manualmente:

- busqueda;
- cambio de carpetas monitoreadas;
- tema claro/oscuro/sistema;
- revision de enlaces activada y desactivada;
- eliminacion de enlaces desde la vista de fallos.

## Documentos relacionados

- `docs/roadmap.md`: ideas y prioridades para proximas versiones.
- `docs/collaboration.md`: reglas de trabajo compartido entre Codex y Gemini/Antigravity.
