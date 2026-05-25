# Plan tecnico: Paso 7A - Ordenamiento por carpeta

Este documento propone la primera parte util del punto 7 del roadmap: permitir ordenar marcadores dentro de cada carpeta sin modificar el orden real de bookmarks del navegador.

Estado: propuesta para revision de Codex y Gemini/Antigravity antes de implementar.

## Objetivo

Permitir que cada carpeta tenga un criterio de orden propio, configurable por el usuario, manteniendo martabs como una vista local y segura sobre los marcadores existentes.

La extension no debe mover marcadores reales en Chrome/Firefox en esta etapa.

## Alcance

Primera version recomendada:

- Orden por defecto global.
- Orden por carpeta.
- Selector en Configuracion junto al modo visual de cada carpeta.
- Boton o menu compacto en el encabezado de cada carpeta para cambiar el orden al vuelo.
- Persistencia en `storage.local`.
- Los fijados siguen apareciendo primero si corresponde.

Fuera de alcance por ahora:

- Drag & drop de marcadores dentro de carpetas.
- Mover marcadores entre carpetas.
- Cambiar el orden real del gestor de marcadores del navegador.
- Orden manual arbitrario por marcador.

## Modos de orden propuestos

Valores internos sugeridos:

- `default`: usa el orden global.
- `browser`: orden original del navegador.
- `title-asc`: titulo A-Z.
- `title-desc`: titulo Z-A.
- `date-newest`: fecha de agregado, nuevos primero.
- `date-oldest`: fecha de agregado, viejos primero.
- `domain-asc`: dominio A-Z.
- `health-broken-first`: enlaces con fallos primero.

Primera implementacion minima podria incluir:

- `browser`
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
  }
}
```

Regla:

- Si una carpeta no tiene entrada en `folderSorts`, usa `defaultFolderSort`.
- Si una carpeta tiene `"default"`, se trata igual que ausencia de entrada.
- La carpeta virtual `Fijados` puede usar un orden propio interno fijo o el orden global. Se recomienda mantenerla con el orden de `pinnedBookmarks` en storage para no sorprender al usuario.

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

En el header de cada carpeta:

- Mantener boton `Vista`.
- Agregar boton `Orden` o un menu compacto.

Primera opcion simple:

- Boton que rota entre ordenes principales.
- Tooltip/title con el orden actual.

Opcion mas clara:

- Menu desplegable pequeño.

Recomendacion:

- Usar selector/menu en Configuracion para control completo.
- En la Nueva pestana usar boton compacto para rotar entre ordenes comunes, igual que `Vista`, si no sobrecarga el header.

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
- Cambio de orden desde Nueva pestana, si se implementa.
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
5. Opcional: control compacto en Nueva pestana

Dejar drag & drop de marcadores para un `Paso 7B`, cuando el ordenamiento declarativo ya este probado.
