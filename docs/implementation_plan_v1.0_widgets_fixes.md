# Implementation Plan - Widgets Fixes v1.0.0

Este plan corrige los problemas detectados en los widgets de martabs v1.0.0:

- `widget-strip` y `widget-panel` quedaron fijos y no acompañan el scroll del tablero.
- La ubicacion sugerida del clima no funciona de forma confiable.
- Las sugerencias de ubicacion/equipo no son deseadas.
- El widget deportivo consulta o muestra resultados incorrectos, especialmente Premier League aunque el usuario elija otra cosa.

El objetivo es que los widgets sigan siendo simples, livianos y predecibles.

## Principios de la correccion

1. **Un solo scroll principal**
   - Header y buscador pueden quedar arriba.
   - Widgets, tabs y tablero deben desplazarse juntos.

2. **Sin sugerencias**
   - No mostrar dropdowns de sugerencias para clima ni deportes.
   - El usuario escribe datos y martabs valida si existen.

3. **Validacion explicita**
   - Si la ubicacion/equipo existe, se guarda una version verificada.
   - Si no existe, se muestra error y no se guarda como valido.

4. **Sin fallback engañoso**
   - No mostrar LaLiga, Premier League ni otra liga si el favorito configurado no existe o no tiene datos.
   - Si no hay datos del equipo validado, mostrar estado vacio claro.

5. **Consultas acotadas**
   - No consultar muchas ligas por defecto.
   - Consultar solo la liga configurada por el usuario.

---

## 1. Corregir scroll de widgets

### Problema

`widget-strip` y `widget-panel` quedaron visualmente fijos. Al hacer scroll, el tablero baja pero los widgets permanecen arriba. Eso rompe la lectura natural de la pagina.

### Solucion

Crear un contenedor scrollable unico para todo lo que debe desplazarse:

```text
app-shell
  topbar
  search-section
  scroll-container
    widgets-strip
    widgets-panel
    tabs-bar
    content
```

### Archivos

- `src/newtab/newtab.html`
- `src/newtab/newtab.css`
- `src/newtab/newtab.js`

### Cambios HTML

Envolver estos bloques dentro de `#scroll-container`:

- `#widgets-strip`
- `#widgets-panel`
- `#tabs-bar`
- `#content`

Ejemplo:

```html
<div id="scroll-container" class="scroll-container">
  <section id="widgets-strip" class="widgets-strip" hidden></section>
  <section id="widgets-panel" class="widgets-panel" hidden></section>
  <div id="tabs-bar" class="tabs-bar" style="display: none;"></div>
  <section id="content" class="content" aria-live="polite"></section>
</div>
```

### Cambios CSS

Reglas:

- `.app-shell` mantiene `height: 100vh` y `overflow: hidden`.
- `.topbar` y `.search-section` quedan fuera del scroll.
- `.scroll-container` recibe el scroll vertical.
- `.content` deja de ser el scroller principal.
- Widgets no deben usar `position: fixed` ni `position: sticky`.

Ejemplo conceptual:

```css
.scroll-container {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding-bottom: 40px;
}

.content {
  overflow: visible;
  min-height: auto;
}

.widgets-strip,
.widgets-panel {
  position: static;
}
```

### Cambios JS

Actualizar cualquier funcion que scrollea el dashboard para que use `#scroll-container`.

Funciones a revisar:

- `resetDashboardScroll()`
- cambios de pestaña
- busqueda
- volver desde resultados/fallos
- focus de carpeta si existe

Ejemplo:

```js
const scrollContainer = document.querySelector("#scroll-container");

function resetDashboardScroll() {
  if (scrollContainer) {
    scrollContainer.scrollTop = 0;
  }
}
```

### Criterio de aceptacion

- Al hacer scroll, widgets, tabs y tablero se desplazan juntos.
- Header y buscador conservan el comportamiento actual.
- No hay doble scrollbar visible.
- Cambiar de pestaña o busqueda vuelve el contenedor correcto arriba.
- Funciona en 720p, desktop grande, Chrome y Firefox.

---

## 2. Clima: quitar sugerencias y validar ubicacion

### Problema

La ubicacion sugerida no funciona bien. El usuario debe editar manualmente y escribir algo como `Madrid, Spain` para que el clima funcione.

### Decision

Eliminar sugerencias/autocomplete y reemplazarlas por verificacion explicita.

### Archivos

- `src/setup/setup.html`
- `src/setup/setup.css`
- `src/setup/setup.js`
- `src/shared/widgets-cache.js` si aplica
- tests relacionados a widgets/settings

### Cambios UI

Eliminar:

- `#weather-autocomplete-results`
- dropdowns de sugerencias
- handlers de sugerencias

Agregar:

```html
<span id="weather-validation-status" class="validation-status" aria-live="polite"></span>
```

Opcional pero recomendado:

```html
<button id="weather-verify-location" type="button">Verificar</button>
```

### Comportamiento

El usuario escribe una ubicacion manualmente.

La validacion se ejecuta:

- al presionar `Verificar`, o
- al guardar configuracion, o
- al perder foco si no resulta molesto.

Recomendacion: usar boton `Verificar` + validacion obligatoria al guardar.

### API

Usar Open-Meteo Geocoding:

```text
https://geocoding-api.open-meteo.com/v1/search?name={query}&count=1&language={lang}&format=json
```

Reglas:

- Si no hay resultados: mostrar `Ubicacion no encontrada`.
- Si hay resultado: guardar ubicacion verificada.
- Si el resultado parece ambiguo o no coincide con lo escrito, pedir mas precision.

### Datos a guardar

Guardar datos normalizados:

```js
weather: {
  enabled: true,
  locationQuery: "Madrid, Spain",
  locationLabel: "Madrid, Spain",
  latitude: 40.4165,
  longitude: -3.7026,
  countryCode: "ES",
  timezone: "Europe/Madrid",
  verifiedAt: 1710000000000,
  lastFetchAt: null,
  lastData: null,
  lastError: null
}
```

No depender del texto libre para consultar clima si ya existe una ubicacion verificada.

### Estados UI

Mostrar estados claros:

- `Verificando ubicacion...`
- `Ubicacion verificada: Madrid, Spain`
- `Ubicacion no encontrada`
- `Agrega pais o region para mayor precision`

### Criterio de aceptacion

- No hay sugerencias/dropdown.
- El usuario puede verificar `Madrid, Spain`.
- Si escribe una ubicacion inexistente, no se guarda como valida.
- Si cambia el texto despues de verificar, la ubicacion queda como pendiente de nueva verificacion.
- El widget usa lat/lon verificados, no texto libre.
- No hay requests de clima si la ubicacion no esta verificada.

---

## 3. Deportes: validar liga/equipo y usar IDs reales

### Problema

La API de ESPN no se esta usando de forma suficientemente precisa. El widget termina devolviendo resultados de Premier League aunque el usuario elija otra cosa.

### Decision

Eliminar sugerencias y fallbacks automaticos. El usuario debe configurar una liga y un equipo. martabs valida que el equipo exista en esa liga y guarda su ID real.

### Fuente tecnica

La documentacion comunitaria de ESPN indica endpoints utiles:

```text
https://site.api.espn.com/apis/site/v2/sports/{sport}/{league}/teams
https://site.api.espn.com/apis/site/v2/sports/{sport}/{league}/scoreboard
```

Ejemplos:

```text
https://site.api.espn.com/apis/site/v2/sports/soccer/esp.1/teams
https://site.api.espn.com/apis/site/v2/sports/soccer/esp.1/scoreboard
https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard
https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard
https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard
```

Referencia:

```text
https://github.com/pseudo-r/Public-ESPN-API
```

### Archivos

- `src/setup/setup.html`
- `src/setup/setup.css`
- `src/setup/setup.js`
- `src/newtab/widgets/widget-renderer.js`
- `src/shared/widgets-cache.js`
- tests de widgets/deportes

### UI propuesta

Campos:

```text
Deporte
[ Soccer | Basketball | Football ]

Liga
[ LaLiga | Premier League | Champions League | Serie A | NBA | NFL ]

Equipo
[ texto libre ]

[ Verificar equipo ]
Estado: Equipo verificado / Equipo no encontrado
```

No mostrar sugerencias.

### Catalogo inicial de ligas

Mantener una lista cerrada para v1.0.0:

```js
const SPORTS_LEAGUES = [
  { id: "soccer-esp-1", sport: "soccer", league: "esp.1", label: "Spanish LaLiga" },
  { id: "soccer-eng-1", sport: "soccer", league: "eng.1", label: "English Premier League" },
  { id: "soccer-uefa-champions", sport: "soccer", league: "uefa.champions", label: "UEFA Champions League" },
  { id: "soccer-ita-1", sport: "soccer", league: "ita.1", label: "Italian Serie A" },
  { id: "basketball-nba", sport: "basketball", league: "nba", label: "NBA" },
  { id: "football-nfl", sport: "football", league: "nfl", label: "NFL" }
];
```

Se pueden agregar mas ligas despues, pero no conviene consultar ligas no elegidas por el usuario.

### Validacion de equipo

Al presionar `Verificar equipo`:

1. Leer deporte/liga seleccionados.
2. Consultar `/teams` de esa liga.
3. Normalizar nombres:
   - lowercase
   - quitar acentos
   - comparar `displayName`, `name`, `shortDisplayName`, `abbreviation`
4. Si hay coincidencia unica:
   - guardar equipo verificado.
5. Si no hay coincidencia:
   - mostrar `Equipo no encontrado en esta liga`.
6. Si hay mas de una coincidencia:
   - pedir mas precision, sin mostrar dropdown de sugerencias.

### Datos a guardar

Guardar favoritos deportivos como datos verificados:

```js
sports: {
  enabled: true,
  favorites: [
    {
      sport: "soccer",
      league: "esp.1",
      leagueLabel: "Spanish LaLiga",
      teamId: "86",
      teamName: "Real Madrid",
      teamAbbreviation: "RMA",
      verifiedQuery: "Real Madrid",
      verifiedAt: 1710000000000
    }
  ],
  cacheTtlMs: 900000,
  liveCacheTtlMs: 300000,
  lastData: null,
  lastFetchAt: null,
  lastError: null
}
```

No guardar solo texto libre como favorito activo.

### Render del widget

Para cada favorito verificado:

1. Consultar solo su liga:

```text
https://site.api.espn.com/apis/site/v2/sports/{sport}/{league}/scoreboard
```

2. Buscar eventos donde participe `teamId`.
3. Si hay evento:
   - mostrar rival, estado y marcador/fecha.
4. Si no hay evento:
   - mostrar `Sin partido cercano para {teamName}`.
5. Si falla fetch:
   - mostrar cache si existe.
   - si no hay cache: mostrar error discreto.

### Lo que NO debe hacer

- No consultar todas las ligas por defecto.
- No usar Premier League como fallback.
- No usar LaLiga como fallback.
- No mostrar resultados de una liga distinta.
- No guardar equipo si no fue verificado.
- No sugerir equipos.

### Criterio de aceptacion

- Si se elige LaLiga + Real Madrid, no se consulta Premier League.
- Si se elige NBA + Lakers, no se consulta soccer.
- Si el equipo no existe en la liga elegida, no se guarda como favorito valido.
- El widget nunca muestra partidos de otra liga como relleno.
- Si no hay partido, muestra estado vacio claro.
- Cache respeta TTL.

---

## 4. Cache y requests

### Clima

- No consultar clima si no hay ubicacion verificada.
- Usar lat/lon verificados.
- TTL recomendado: 60 minutos.
- Boton `Actualizar ahora` ignora TTL.

### Deportes

- No consultar si no hay favoritos verificados.
- Consultar solo ligas necesarias.
- Agrupar favoritos por `{sport, league}` para evitar requests duplicados.
- TTL:
  - partido en vivo: 5 a 15 minutos.
  - sin vivo: 3 a 6 horas.

### Criterio

- Con widgets conectados apagados: cero requests externas.
- Con clima activo sin ubicacion verificada: cero requests de clima.
- Con deportes activo sin favoritos verificados: cero requests de ESPN.
- Con 2 equipos de la misma liga: 1 request al scoreboard de esa liga.

---

## 5. Permisos

Revisar permisos opcionales:

- Open-Meteo geocoding/weather.
- ESPN site API.

Reglas:

- Pedir permisos al activar widgets conectados.
- No pedir permisos si solo se usan widgets locales.
- Al desactivar clima y deportes, intentar retirar permisos conectados si no hay otra funcion que los use.
- No usar `<all_urls>`.

---

## 6. Checklist: agregar tareas desde el titulo

### Problema

El widget de lista de tareas pierde demasiado espacio vertical con el boton grande `Agregar item`. En una card normal solo entran pocas tareas antes de necesitar scroll.

### Decision

Mantener todos los widgets en la misma linea y no agrandar la card de checklist. En su lugar, mover la creacion de tareas al encabezado:

```text
Lista de tareas                         +
-----------------------------------------
[ ] Revisar PR
[ ] Comprar cable
[ ] Enviar backup
[ ] Actualizar README
```

Al tocar `+`, el titulo se transforma en input:

```text
[ Escribir nueva tarea...              ]
-----------------------------------------
[ ] Revisar PR
[ ] Comprar cable
```

### Comportamiento

- Click en `+`: oculta el titulo y muestra input inline.
- `Enter`: agrega la tarea, limpia input y vuelve el titulo.
- `Escape`: cancela y vuelve el titulo.
- Blur con input vacio: cancela y vuelve el titulo.
- No abrir modal.
- No agregar una fila extra debajo de la lista.

### CSS

- Boton `+` chico, icon-only, junto al titulo.
- Input ocupa el lugar del titulo.
- Filas de tareas mas compactas.
- En card normal deben entrar aproximadamente 4 tareas.
- Si hay mas tareas, usar scroll interno de la lista con barra invisible o minima.

### Criterio de aceptacion

- Todos los widgets pueden seguir en la misma linea.
- Checklist no necesita una card mas alta para ser util.
- La accion de agregar tarea queda disponible sin ocupar espacio permanente.
- La lista entra mejor visualmente y no se siente apretada.

---

## 7. Tests requeridos

### Unitarios / estaticos

- `scroll-container` contiene widgets, tabs y content.
- `.content` no es el scroller principal.
- Widgets no usan `position: fixed`.
- Checklist tiene boton `+` en el encabezado.
- Checklist no renderiza formulario inferior permanente.
- Checklist usa input inline en el titulo.
- No existe `weather-autocomplete-results`.
- Existe `weather-validation-status`.
- Deportes tiene catalogo cerrado de ligas.
- Deportes usa `/teams` para validar.
- Deportes usa `/scoreboard` para render.
- No existe fallback a Premier/LaLiga.

### Logica

- Normalizacion de nombres de equipos.
- Match exacto por `displayName`, `shortDisplayName`, `abbreviation`.
- Equipo inexistente no se guarda.
- Ubicacion inexistente no se guarda.
- Cambio de texto invalida verificacion previa.
- Agrupacion de favoritos por liga.
- Cache evita requests repetidos.
- Checklist agrega tarea con Enter.
- Checklist cancela input con Escape.

### E2E

- Scroll: widgets bajan junto con el tablero.
- Clima: `Madrid, Spain` verifica y renderiza.
- Clima: ubicacion falsa muestra error.
- Deportes: LaLiga + Real Madrid valida y no consulta Premier.
- Deportes: equipo falso muestra error.
- Deportes: sin partido muestra estado vacio, no otra liga.
- Chrome.
- Firefox.

---

## 8. Orden de implementacion

1. Corregir scroll.
2. Quitar sugerencias de clima.
3. Agregar verificacion de ubicacion.
4. Quitar sugerencias de deportes.
5. Agregar catalogo cerrado de ligas.
6. Agregar verificacion de equipo por `/teams`.
7. Cambiar render deportivo para usar `teamId` + liga validada.
8. Ajustar cache/permisos.
9. Agregar tests.
10. Probar Chrome/Firefox.

---

## Criterios finales de aceptacion

- Los widgets acompañan el scroll del tablero.
- No hay sugerencias visuales de clima ni deportes.
- Clima solo funciona con ubicacion verificada.
- Deportes solo funciona con equipo/liga verificados.
- ESPN no devuelve Premier League salvo que el usuario haya elegido Premier League.
- No se muestran datos de relleno de otra liga.
- No hay requests innecesarios.
- No hay nuevos permisos si widgets conectados estan apagados.
- Tests pasan.
- Build Chrome y Firefox pasan.
