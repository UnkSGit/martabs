# Plan tecnico: Paso 7A - Ordenamiento por carpeta

Este documento propone la primera parte util del punto 7 del roadmap: permitir ordenar marcadores dentro de cada carpeta sin modificar el orden real de bookmarks del navegador.

Estado: implementado por Codex el 2026-05-25.

Resumen de implementacion:

- Se agrego `src/shared/bookmark-sort.js` con `sortBookmarks`.
- Se agregaron `defaultFolderSort` y `folderSorts` en settings.
- Configuracion permite elegir orden global y orden por carpeta.
- El tablero aplica el orden por carpeta, pero el control queda solo en Configuracion para no sobrecargar el encabezado.
- La carpeta virtual `Fijados` conserva el orden manual de `pinnedBookmarks`.
- La busqueda no se ve afectada por `folderSorts`.
- Quedaron tests en `tests/bookmark-sort.test.js`, `tests/setup.test.js` y `tests/newtab.test.js`.

## Objetivo

Permitir que cada carpeta tenga un criterio de orden propio, configurable por el usuario, manteniendo martabs como una vista local y segura sobre los marcadores existentes.

La extension no debe mover marcadores reales en Chrome/Firefox en esta etapa.

## Alcance

Primera version recomendada:

- Orden por defecto global.
- Orden por carpeta.
- Selector en Configuracion junto al modo visual de cada carpeta.
- Persistencia en `storage.local`.
- Los fijados siguen apareciendo primero si corresponde.

Fuera de alcance por ahora:

- Drag & drop de marcadores dentro de carpetas.
- Mover marcadores entre carpetas.
- Cambiar el orden real del gestor de marcadores del navegador.
- Mover marcadores reales del navegador segun el orden manual local.

## Modos de orden propuestos

Valores internos evaluados:

- `default`: usa el orden global.
- `browser`: orden original del navegador.
- `title-asc`: titulo A-Z.
- `title-desc`: titulo Z-A.
- `date-newest`: fecha de agregado, nuevos primero.
- `date-oldest`: fecha de agregado, viejos primero.
- `domain-asc`: dominio A-Z.
- `health-broken-first`: enlaces con fallos primero.

Primera implementacion incluida:

- `browser`
- `manual`
- `title-asc`
- `date-newest`
- `domain-asc`
- `health-broken-first`

## Modelo de datos

Agregar a settings:

```js
defaultFolderSort: "browser",
folderSorts: {}
```

Formato:

```js
{
  defaultFolderSort: "browser",
  folderSorts: {
    "folder-id-1": "title-asc",
    "folder-id-2": "date-newest"
  },
  folderBookmarkOrders: {
    "folder-id-3": ["bookmark-id-2", "bookmark-id-1"]
  }
}
```

Regla:

- Si una carpeta no tiene entrada en `folderSorts`, usa `defaultFolderSort`.
- Si una carpeta tiene `"default"`, se trata igual que ausencia de entrada.
- La carpeta virtual `Fijados` puede usar un orden propio interno fijo o el orden global. Se recomienda mantenerla con el orden de `pinnedBookmarks` en storage para no sorprender al usuario.
- `folderBookmarkOrders` solo se usa cuando el orden efectivo de la carpeta es `manual`.

## Prioridad de orden con fijados

Los fijados ya son una forma de prioridad manual. Para no perder ese valor:

1. Si el marcador esta fijado, aparece antes que los no fijados dentro de su carpeta.
2. Dentro del grupo de fijados se aplica el orden elegido.
3. Dentro del grupo no fijado se aplica el mismo orden elegido.

Ejemplo:

```text
Fijados A-Z
No fijados A-Z
```

Alternativa a revisar:

- Agregar opcion futura `pinnedFirst: true/false`.
- No se recomienda para primera version; suma configuracion y poco valor.

## UI propuesta

### Configuracion

En `setup.html`, dentro de Apariencia o junto al selector de modo visual:

- Selector global: `Orden predeterminado`.
- Selector por carpeta: `Orden`.

La fila de cada carpeta podria tener:

```text
[drag] [checkbox carpeta] [nombre carpeta] [modo visual] [orden]
```

### Nueva pestana

Decision final:

- No mostrar control de orden en el encabezado de las carpetas.
- El orden se aplica visualmente segun lo configurado en Configuracion.
- Mantener el header liviano con acciones de uso mas frecuente, como `Revisar`, fallos y `Vista`.

Motivo: en carpetas con revision de enlaces, fallos y cambio de vista, un boton adicional `Orden` vuelve el encabezado demasiado cargado para una accion poco frecuente.

## Funcion de orden

Centralizar la logica en una funcion testeable, idealmente en `src/shared/bookmark-sort.js` o cerca de `src/shared/search.js` si se prefiere evitar muchos archivos.

Firma sugerida:

```js
export function sortBookmarks(bookmarks, sortMode, pinnedIds = []) {}
```

Reglas:

- No mutar el array original.
- Orden estable cuando los valores comparados son iguales.
- Normalizar strings con `localeCompare("es", { sensitivity: "base" })` o helper equivalente.
- Fechas faltantes van al final.
- Dominios faltantes van al final.
- `health-broken-first` solo prioriza fallidos si existe `linkHealth.consecutiveFailures > 0`.

## Interaccion con busqueda

La busqueda debe seguir funcionando igual.

Recomendacion:

- En dashboard normal: aplicar orden por carpeta.
- En resultados de busqueda: mantener ranking de busqueda actual, no aplicar orden por carpeta.

Razon:

- Cuando el usuario busca, espera relevancia por texto, no el orden de la carpeta.

## Interaccion con modos visuales

El orden es independiente del modo visual:

- Lista completa puede estar A-Z.
- Compacta puede estar por fecha.
- Quicklinks puede estar por dominio.

La clase visual de `bookmark-list` no debe controlar el orden; el orden debe resolverse antes de renderizar.

## Interaccion con salud de enlaces

`health-broken-first` tiene sentido solo si la revision de enlaces esta activada o si hay datos previos.

Comportamiento recomendado:

- Si no hay datos de salud, mantener orden original relativo.
- Si `linkHealthEnabled` esta desactivado, ocultar o deshabilitar esta opcion en UI para evitar confusion.

Punto a revisar por Gemini:

- Si la opcion queda guardada y luego el usuario desactiva revision de enlaces, decidir si se conserva pero no se aplica, o si se vuelve a `browser`.

Recomendacion inicial:

- Conservar el valor guardado.
- Si no hay datos o la revision esta desactivada, el orden cae naturalmente al resto de comparadores estables.

## Interaccion con carpeta virtual Fijados

La carpeta virtual `Fijados` no representa una carpeta real.

Recomendacion:

- No mostrar selector de orden para `Fijados` en Configuracion.
- En el dashboard, respetar el orden de `pinnedBookmarks` si ese array tiene significado manual.
- Si no hay orden manual de fijados, usar el mismo criterio global.

Punto abierto:

- Confirmar si `pinnedBookmarks` hoy preserva el orden en que el usuario fijo los marcadores. Si si, conviene usarlo.

## Tests recomendados

Agregar tests nuevos para:

- `sortBookmarks` no muta el array original.
- `browser` conserva orden de entrada.
- `title-asc` ordena sin distinguir mayusculas ni acentos.
- `date-newest` pone fechas faltantes al final.
- `domain-asc` pone dominios faltantes al final.
- `health-broken-first` sube enlaces con `consecutiveFailures > 0`.
- Fijados quedan primero y dentro de cada grupo se aplica el orden elegido.
- `setup` contiene selector global y selector por carpeta.
- `newtab` aplica el orden antes de renderizar carpetas.
- Busqueda no queda afectada por `folderSorts`.

## Verificacion manual

Probar:

- Una carpeta en orden original.
- Una carpeta A-Z.
- Una carpeta por fecha.
- Una carpeta por dominio.
- Una carpeta con fallos primero.
- Fijados dentro de una carpeta ordenada.
- Cambio de orden desde Configuracion.
- Confirmar que la Nueva pestana aplica el orden elegido sin mostrar boton `Orden`.
- Busqueda despues de configurar ordenes.
- Modo claro/oscuro y diferentes modos visuales.

## Riesgos

- Demasiados controles en el header de carpeta pueden ensuciar la UI.
- `health-broken-first` puede confundir si no hay revision de enlaces activa.
- Si se ordenan carpetas con muchos marcadores, hacerlo en cada render debe seguir siendo liviano.
- El orden visual puede interactuar con masonry y cambiar alturas, pero menos que los modos visuales.

## Recomendacion final

Implementar como `Paso 7A` con una funcion pura de ordenamiento y persistencia simple:

1. `defaultFolderSort`
2. `folderSorts`
3. `sortBookmarks`
4. UI en Configuracion
5. No agregar control compacto en Nueva pestana; el orden queda solo en Configuracion

Dejar drag & drop de marcadores para un `Paso 7B`, cuando el ordenamiento declarativo ya este probado.

## Anexo: Paso 7B implementado

El orden manual ya esta disponible como criterio `manual`.

- Se configura desde Configuracion, igual que los demas criterios de orden.
- Solo las carpetas en modo `manual` habilitan arrastrar marcadores dentro del tablero.
- Al soltar un marcador, se actualiza `folderBookmarkOrders[folderId]`.
- El flujo no llama a `chrome.bookmarks.move`; solo cambia la vista local de martabs.
- La carpeta virtual `Fijados` queda fuera del drag & drop.
