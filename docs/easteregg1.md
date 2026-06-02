# Easter Egg 1 - Fallout-inspired Command

## Objetivo

Agregar un easter egg liviano para martabs v0.9.9 activado desde la barra de busqueda con el comando oculto `:fallout`.

El efecto debe tener una referencia retro/post-apocaliptica sutil, sin usar marcas, logos, sonidos, assets oficiales ni nombres licenciados. Debe sentirse como un detalle divertido de interfaz, no como una funcionalidad central ni como una dependencia visual pesada.

## Comportamiento esperado

Cuando el usuario escriba exactamente `:fallout` en el buscador:

1. Se activa un modo visual temporal tipo terminal retro.
2. El numero del "vault" debe ser la cantidad real de marcadores monitoreados, no un numero fijo.
   - Ejemplo: si hay 233 marcadores, mostrar algo como `VAULT 233 ONLINE`.
   - La fuente de verdad debe ser `bookmarks.length`, que es la misma base usada por el contador `#status-line`.
3. La barra de busqueda debe transformarse temporalmente en una consola.
   - Mostrar 2 o 3 lineas cortas de estado.
   - Ejemplos:
     - `> indexing local archive...`
     - `> 233 entries recovered`
     - `> signal stable`
4. El contador del encabezado debe cambiar temporalmente a un mensaje tematico.
   - Ejemplo: `233 entries secured`
   - Al terminar el efecto, debe volver al texto normal traducido de marcadores monitoreados.
5. El comando no debe ejecutar una busqueda real ni renderizar resultados.
6. El efecto debe desactivarse automaticamente despues de unos segundos o al presionar `Escape`.

## Alcance

Archivos principales a tocar:

- `src/newtab/newtab.html`
  - Agregar un contenedor minimo para las lineas de terminal junto al buscador, oculto por defecto.
  - Mantenerlo dentro de `.search-section` para no afectar el layout general.

- `src/newtab/newtab.css`
  - Agregar clases para el estado activo, por ejemplo:
    - `.easter-fallout-active`
    - `.fallout-terminal`
    - `.fallout-counter`
  - Usar efectos baratos: color, borde, sombra suave, scanline sutil con pseudo-elemento.
  - Evitar filtros pesados, blur grande, imagenes externas o animaciones constantes costosas.
  - Respetar `prefers-reduced-motion: reduce` desactivando parpadeos o animaciones.

- `src/newtab/newtab.js`
  - Agregar constantes:
    - `FALLOUT_COMMAND = ":fallout"`
    - `FALLOUT_DURATION_MS`, sugerido entre 8000 y 12000.
  - Agregar estado interno:
    - `let falloutEasterEggTimer = null`
    - `let isFalloutEasterEggActive = false`
  - Agregar funciones:
    - `isFalloutCommand(query)`
    - `activateFalloutEasterEgg()`
    - `deactivateFalloutEasterEgg({ clearSearch = true } = {})`
    - `renderFalloutTerminalLines(count)`
  - Integrar el comando al inicio de `render()`:
    - Si `searchInput.value.trim().toLowerCase() === ":fallout"`, activar el easter egg y cortar el flujo normal.
    - No llamar a `searchBookmarks()` para ese comando.
  - Integrar `Escape`:
    - Si el easter egg esta activo, desactivarlo antes de aplicar el comportamiento normal de limpiar busqueda.
  - Al desactivar:
    - Quitar clases visuales.
    - Ocultar/limpiar las lineas de terminal.
    - Restaurar el contador llamando a `render()` o reutilizando la misma logica actual de `statusLine`.

- `src/_locales/*/messages.json`
  - Agregar claves i18n para no romper el soporte multilenguaje:
    - `easterFalloutVaultOnline`
    - `easterFalloutIndexing`
    - `easterFalloutRecovered`
    - `easterFalloutSignalStable`
    - `easterFalloutCounter`
  - Usar placeholders con `$COUNT$` donde aplique.
  - Mantener todas las traducciones sincronizadas y ordenadas alfabeticamente.

- `tests/newtab.test.js`
  - Agregar verificaciones estaticas o unitarias livianas para asegurar que:
    - Existe el comando `:fallout`.
    - El numero usado sale de `bookmarks.length`.
    - El comando no pasa por la busqueda normal.
    - Existe limpieza por timer o `Escape`.
    - No se agregan assets externos.

## Flujo tecnico propuesto

1. Crear tests primero
   - Agregar asserts simples en `tests/newtab.test.js`.
   - El objetivo es evitar que el easter egg se rompa o termine usando un numero fijo.

2. Agregar estructura HTML minima
   - Dentro de `.search-section`, sumar algo como:

```html
<div id="fallout-terminal" class="fallout-terminal" hidden aria-live="polite"></div>
```

3. Implementar estilos
   - El efecto debe ser visible pero no invasivo.
   - Debe funcionar con modo claro, modo oscuro y fondos personalizados.
   - Recomendacion visual:
     - Verde fosforo suave o cyan verdoso.
     - Borde fino.
     - Texto monoespaciado solo dentro del terminal.
     - Sombra baja.
   - No modificar el layout permanente de carpetas ni pestañas.

4. Implementar logica JS
   - Detectar el comando exacto.
   - Usar `bookmarks.length` como numero del vault.
   - Cambiar temporalmente `statusLine.textContent`.
   - Renderizar lineas de terminal.
   - Programar cleanup.

5. Agregar traducciones
   - Completar todos los idiomas actuales.
   - Ejecutar el chequeo i18n.

6. Verificar
   - Ejecutar tests.
   - Probar manualmente:
     - Escribir `:fallout`.
     - Confirmar que el contador usa la cantidad real.
     - Confirmar que vuelve solo.
     - Confirmar que `Escape` lo cancela.
     - Confirmar que busquedas normales siguen igual.

## Criterios de aceptacion

- `:fallout` activa el easter egg desde la barra de busqueda.
- El numero mostrado coincide con la cantidad real de marcadores monitoreados.
- El contador del encabezado cambia de mensaje durante el efecto y luego vuelve al texto normal.
- La barra de busqueda muestra una consola temporal con lineas de estado.
- No se abre ninguna pagina, no se reproduce audio y no se hacen requests externos.
- No se usan imagenes, nombres oficiales, marcas registradas ni assets de terceros.
- Funciona en Chrome y Firefox.
- Respeta `prefers-reduced-motion`.
- No afecta la busqueda normal, las pestañas, el ordenamiento, los previews ni la configuracion.

## Notas para mantenerlo liviano

- No guardar estado en storage.
- No cargar fuentes externas.
- No agregar librerias.
- No usar canvas ni imagenes.
- Mantener el efecto como CSS + DOM minimo.
- El comando debe ser una salida visual temporal, no una nueva seccion de la aplicacion.

## Idea reservada para v1.0

Para v1.0 se puede agregar un segundo easter egg distinto, por ejemplo al hacer click varias veces sobre el numero de version en Configuracion. Conviene mantenerlo separado para que `:fallout` siga siendo el easter egg principal de v0.9.9.
