# Plan de Implementacion - Widgets y Easter Egg v1.0.0

Este documento define el alcance tecnico para la version **martabs v1.0.0**.

La prioridad de esta version son los **widgets**: una capa opcional, liviana y privada que complemente el tablero de marcadores sin convertir martabs en una aplicacion pesada. El easter egg conmemorativo queda como extra final, para sumar cuando la base de widgets ya este estable.

## Objetivo de v1.0.0

Agregar widgets utiles a la Nueva pestaña manteniendo los principios actuales de martabs:

- Rapidez por defecto.
- Privacidad por defecto.
- Cero servicios externos si el usuario no activa funciones conectadas.
- Permisos opcionales solo cuando una funcion los necesita.
- UI simple, clara y sin sobrecargar el tablero.
- Sin SDKs externos, iframes, trackers ni librerias innecesarias.

## Alcance decidido

### Widgets incluidos en v1.0.0

Widgets locales:

- Reloj.
- Notas rapidas.
- Checklist.
- Accesos rapidos / favoritos destacados.

Widgets conectados opt-in:

- Clima.
- Deportes.

Estos widgets conectados pueden entrar en v1.0.0 siempre que se mantengan estrictamente opt-in, con permisos dinamicos, cache y explicacion clara en Configuracion.

### Widgets excluidos

No incluir en v1.0.0:

- Timer / Focus.
- Estadisticas locales como widget.
- Noticias.
- Calendario externo.
- Integraciones OAuth.
- Widgets de terceros.
- Marketplace de widgets.
- Iframes embebidos.

Motivo: timer y estadisticas agregan superficie funcional que hoy no es prioritaria para esta version. Las estadisticas ya existen en martabs como seccion propia, y no hace falta duplicarlas como widget.

## Principios de implementacion

1. **Widgets apagados por defecto**
   - Si el usuario no activa widgets, martabs debe comportarse y cargar igual que antes.

2. **Infraestructura simple**
   - Crear una base modular, pero evitar una arquitectura sobredimensionada.
   - No preparar capas complejas hasta que una funcion real las necesite.

3. **Separacion clara entre locales y conectados**
   - Los widgets locales no deben pedir permisos ni hacer requests.
   - Los widgets conectados deben pedir permisos solo al activarse.

4. **Sin polling agresivo**
   - No usar intervalos permanentes en New Tab.
   - No hacer fetch cada vez que se abre una pestaña.
   - Usar cache y actualizacion manual.

5. **Sin geolocalizacion automatica**
   - Clima requiere ciudad escrita manualmente.
   - Deportes requiere equipo/liga elegidos manualmente.

6. **Visual simple**
   - Los widgets deben sentirse parte de martabs.
   - Deben evitar tarjetas gigantes, layouts pesados o controles excesivos.

## Arquitectura propuesta

Mantener una estructura compacta:

```text
src/
  newtab/
    widgets/
      widget-registry.js
      widget-renderer.js
      clock-widget.js
      notes-widget.js
      checklist-widget.js
      quick-links-widget.js
      weather-widget.js
      sports-widget.js
  shared/
    widgets-storage.js
    widgets-cache.js
    widgets-permissions.js
```

Notas:

- `widgets-cache.js` y `widgets-permissions.js` existen para clima/deportes.
- No agregar background dedicado salvo que sea necesario para permisos, fetch o compatibilidad Firefox/Chrome.
- Si los widgets conectados funcionan bien desde New Tab con permisos opcionales y cache controlado, evitar `background/connected-widgets.js` en esta etapa.

## Modelo de configuracion

Agregar a settings una estructura unica y legible:

```js
widgets: {
  enabled: false,
  layout: [
    // { id: "clock", zone: "top", size: "compact", order: 0 }
  ],
  clock: {
    enabled: false,
    format: "locale"
  },
  notes: {
    enabled: false,
    text: ""
  },
  checklist: {
    enabled: false,
    items: []
  },
  quickLinks: {
    enabled: false,
    bookmarkIds: []
  },
  weather: {
    enabled: false,
    locationLabel: "",
    locationQuery: "",
    units: "metric",
    provider: "",
    cacheTtlMs: 3600000,
    lastFetchAt: null,
    lastData: null,
    lastError: null
  },
  sports: {
    enabled: false,
    favorites: [],
    cacheTtlMs: 900000,
    liveCacheTtlMs: 300000,
    lastFetchAt: null,
    lastData: null,
    lastError: null
  }
}
```

Reglas:

- Export/import debe incluir `widgets`.
- Migracion: si no existe `widgets`, crear defaults sin alterar settings previos.
- Al desactivar widgets globalmente, no borrar datos del usuario; solo ocultarlos.
- Al desactivar un widget conectado, intentar retirar permisos si ningun otro widget conectado los usa.

## UI del dashboard

La UI debe ser simple y poco invasiva.

Layout recomendado:

```text
Header / Search / Settings
Widget strip opcional
Tabs opcionales
Dashboard de carpetas
```

### Widget strip

Zona superior compacta para widgets chicos:

- Reloj.
- Clima resumido.
- Deportes resumido.
- Accesos rapidos compactos.

### Panel compacto opcional

Para widgets con mas contenido:

- Notas rapidas.
- Checklist.

Reglas visuales:

- No insertar widgets dentro del masonry de carpetas en v1.0.0.
- No ocupar demasiado alto en 720p.
- Si hay muchos widgets, permitir ocultar/contraer la zona de widgets.
- Mantener consistencia con modo claro, modo oscuro, wallpapers y RTL.

## Configuracion

Agregar seccion nueva:

```text
Configuracion
  - Tablero
  - Apariencia
  - Widgets
  - Privacidad
  - Etiquetas
  - Avanzado
```

Contenido de Widgets:

```text
[ ] Activar widgets

Widgets locales
  [ ] Reloj
  [ ] Notas rapidas
  [ ] Checklist
  [ ] Accesos rapidos

Widgets conectados
  [ ] Mostrar widgets conectados
      [ ] Clima
      [ ] Deportes

Aviso:
Los widgets conectados consultan servicios externos. martabs no agrega telemetria propia, pero estos widgets pueden enviar la ciudad, equipo o liga configurada al proveedor elegido.
```

Configuracion minima por widget:

- Reloj: formato locale / 12h / 24h.
- Notas: limpiar nota.
- Checklist: limpiar completados / limpiar todo.
- Accesos rapidos: elegir marcadores.
- Clima: ciudad, unidades, actualizar ahora.
- Deportes: equipo/liga, actualizar ahora.

## Widgets locales

### Reloj

Requisitos:

- Mostrar hora local.
- Usar locale del navegador por defecto.
- Opcion 12h / 24h.
- Actualizar una vez por minuto.
- Pausar actualizacion cuando `document.hidden === true`.

No hacer:

- No mostrar segundos por defecto.
- No usar animaciones permanentes.

### Notas rapidas

Requisitos:

- Textarea compacto.
- Guardado local con debounce.
- Limite razonable de caracteres.
- Boton limpiar.
- Mensaje discreto: se guarda solo en este navegador.

No hacer:

- No sincronizar con servicios externos.
- No agregar markdown avanzado en v1.0.0.

### Checklist

Requisitos:

- Agregar item.
- Marcar/desmarcar.
- Eliminar.
- Guardado local.
- Limpiar completados.

Opcional si no complica:

- Reordenar items.

No hacer:

- No agregar fechas, prioridades o subtareas en v1.0.0.

### Accesos rapidos

Requisitos:

- Permitir elegir algunos marcadores para mostrarlos como accesos rapidos.
- Usar datos existentes de bookmarks.
- No crear marcadores nuevos automaticamente.
- No modificar URL/titulo salvo que el usuario edite el marcador desde el flujo existente.

Regla:

- Si se necesita fijar algo y eso implicara crear un marcador real nuevo, no hacerlo.

## Widgets conectados opt-in

Estos widgets pueden entrar en v1.0.0 solo si cumplen estas reglas:

- Apagados por defecto.
- Detras de toggle de widgets conectados.
- Explicacion clara antes de activar.
- Sin geolocalizacion automatica.
- Sin detectar intereses automaticamente.
- Sin historial del usuario.
- Cache obligatorio.
- Boton "Actualizar ahora".
- Timeout corto.
- Fallback a ultimo dato cacheado.
- Sin SDKs.
- Sin iframes.
- Sin analytics.
- Sin `<all_urls>`.

### Clima

Requisitos:

- Usuario escribe ciudad manualmente.
- Guardar ciudad/unidades.
- Mostrar cache si existe.
- Hacer fetch solo si cache expiro o el usuario presiona actualizar.
- Guardar respuesta normalizada, no respuesta cruda completa.

TTL:

- Default: 60 minutos.
- Minimo permitido: 30 minutos.

### Deportes

Requisitos:

- Usuario elige equipo/liga manualmente.
- No consultar nada si no hay favoritos configurados.
- Mostrar cache si existe.
- Hacer fetch solo si cache expiro o el usuario presiona actualizar.
- Guardar respuesta normalizada.

TTL:

- Partido en vivo: 5 a 15 minutos.
- Sin partido en vivo: 3 a 6 horas.

## Permisos y privacidad

Widgets locales:

- No agregan permisos.
- No hacen requests.
- Guardan datos solo en el navegador.

Widgets conectados:

- Pedir host permission solo para el proveedor elegido.
- Pedir permiso al activar el widget.
- Intentar retirar permiso al desactivar todos los widgets conectados.
- Explicar que la ciudad/equipo/liga configurada puede enviarse al proveedor externo.

Actualizar:

- `README.md`
- `docs/privacy_policy.md`
- `docs/store_listing.md`
- notas para revisores si se agregan permisos nuevos

## Easter egg conmemorativo v1.0.0

El easter egg no es la prioridad de la version. Se implementa al final, cuando los widgets ya esten completos y estables.

### Comportamiento

Al hacer clic 10 veces sobre el numero de version:

- Se muestra un overlay con fireworks CSS.
- Aparece el texto `martabs v1.0`.
- Subtitulo: `First stable release`.
- Se cierra con Escape, click o timeout.

### Reglas

- No usar imagenes externas.
- No usar audio.
- No usar librerias.
- No guardar estado en storage.
- No agregar DOM permanente del overlay.
- No mantener timers permanentes.
- Respetar `prefers-reduced-motion`.

### Archivo sugerido

```text
src/shared/version-easter-egg.js
```

Usarlo en el lugar donde el numero de version ya esta visible, preferentemente Configuracion / Acerca de.

## i18n

Agregar claves para Widgets:

```text
widgets
widgetsEnabled
localWidgets
connectedWidgets
connectedWidgetsEnabled
clockWidget
notesWidget
checklistWidget
quickLinksWidget
weatherWidget
sportsWidget
refreshNow
lastUpdated
cachedData
externalServiceNotice
manualLocationOnly
manualTeamOnly
```

Agregar claves para el easter egg:

```text
versionLabel
releaseCelebrationTitle
releaseCelebrationSubtitle
releaseCelebrationAriaLabel
```

Valores base:

```json
{
  "releaseCelebrationTitle": { "message": "martabs v1.0" },
  "releaseCelebrationSubtitle": { "message": "First stable release" },
  "releaseCelebrationAriaLabel": { "message": "martabs v1.0 celebration" }
}
```

Criterio:

- Mantener paridad exacta de claves en todos los idiomas.
- Evitar textos hardcodeados.
- Ejecutar auditoria i18n.

## Implementacion por fases

### Fase 1 - Infraestructura minima

- Crear registry de widgets.
- Crear renderer de widgets.
- Crear storage helper.
- Agregar defaults de settings.
- Agregar zona visual de widgets en New Tab.
- Agregar seccion Widgets en Configuracion.
- Agregar i18n base.
- Agregar tests de defaults, migracion y render apagado.

Criterio:

- Widgets apagados no agregan costo relevante.
- No hay permisos nuevos.
- Build Chrome/Firefox sin cambios inesperados.

### Fase 2 - Widgets locales

- Reloj.
- Notas rapidas.
- Checklist.
- Accesos rapidos.

Criterio:

- Sin requests.
- Sin permisos.
- Guardado local.
- UI compacta.
- Sin jank en scroll.

### Fase 3 - Layout y configuracion

- Activar/desactivar cada widget.
- Elegir zona simple: superior o panel compacto.
- Ordenar widgets.
- Tamaño compacto / normal si aplica.
- Resetear widgets.
- Incluir widgets en export/import.

Criterio:

- El layout de widgets no se mezcla con carpetas, tabs ni orden manual de marcadores.

### Fase 4 - Widgets conectados opt-in

- Clima.
- Deportes.
- Permisos opcionales.
- Cache.
- Actualizacion manual.
- Fallback a cache.
- Documentacion de privacidad.

Criterio:

- Cero requests si no estan activados.
- No hay fetch por cada nueva pestaña.
- No hay `<all_urls>`.

### Fase 5 - Benchmarks y pruebas

Archivo sugerido:

```text
e2e/tests/widgets-performance.spec.mjs
```

Escenarios:

- Widgets apagados.
- Solo widgets locales.
- Todos los widgets locales.
- Clima/deportes cacheados con mocks.
- Easter egg no activado.
- Easter egg activado.

Metricas:

- Tiempo de carga inicial.
- Nodos DOM extra.
- Long tasks durante scroll.
- Requests externas.
- Limpieza de timers/listeners.
- Overlay del easter egg eliminado al cerrar.

Objetivos:

- Widgets apagados: diferencia menor a 2% contra baseline.
- Widgets locales: menos de 300 nodos extra.
- Widgets locales: cero requests.
- Ningun widget local debe crear long tasks > 50ms.
- Widgets conectados apagados: cero requests externas.
- Clima/deportes: maximo 1 request por TTL vencido.

### Fase 6 - Easter egg v1.0.0

- Convertir version visible en trigger accesible.
- Detectar 10 clicks dentro de 5 segundos.
- Crear overlay solo al activar.
- Mostrar `martabs v1.0`.
- Mostrar `First stable release`.
- Fireworks CSS.
- Cerrar con Escape, click o timeout.
- Respetar `prefers-reduced-motion`.
- Agregar tests.

Criterio:

- No afecta carga inicial.
- No usa red.
- No usa permisos.
- Limpia DOM/listeners al cerrar.

## Tests requeridos

Unitarios:

- Defaults de widgets.
- Migracion de settings antiguos.
- Registry no duplica IDs.
- Widgets locales no declaran permisos.
- Notas guardan con debounce.
- Checklist agrega/marca/elimina.
- Cache TTL de clima/deportes.
- Fallback a cache si falla fetch.
- Easter egg requiere 10 clicks.
- Easter egg limpia overlay/listeners.

Integracion:

- New Tab sin widgets.
- New Tab con widgets locales.
- Settings guarda layout.
- Export/import incluye widgets.
- Desactivar widgets limpia timers/listeners.
- Desactivar widget conectado intenta retirar permisos.
- Version renderiza trigger accesible.

E2E:

- Activar widgets locales.
- Crear nota.
- Crear checklist.
- Ver accesos rapidos.
- Activar clima con mock.
- Activar deportes con mock.
- Cambiar tema claro/oscuro/sistema.
- Verificar wallpapers/opacidad.
- Activar easter egg.
- Cerrar easter egg con Escape y click.
- Verificar Chrome.
- Verificar Firefox.

## Criterios de aceptacion v1.0.0

La version esta lista si:

- Widgets apagados mantienen rendimiento equivalente a v0.9.9.
- Widgets locales no agregan permisos.
- Widgets locales no hacen requests.
- Widgets pueden activarse/desactivarse individualmente.
- Notas/checklist quedan solo en storage local.
- Accesos rapidos no crean marcadores reales automaticamente.
- UI no agrega jank durante scroll.
- Export/import conserva configuracion de widgets.
- Clima/deportes estan apagados por defecto.
- Clima/deportes usan permisos dinamicos y cache.
- No hay geolocalizacion automatica.
- No hay `<all_urls>`.
- El easter egg se activa solo con 10 clicks en la version.
- El easter egg es local, sin red ni permisos.
- El easter egg respeta `prefers-reduced-motion`.
- El easter egg limpia DOM/listeners al cerrar.
- Tests unitarios pasan.
- Build Chrome pasa.
- Build Firefox pasa.
- README y politica de privacidad explican widgets locales/conectados.

## Recomendacion final

v1.0.0 debe enfocarse en widgets, no en convertir martabs en un portal pesado.

El alcance recomendado queda asi:

- Infraestructura simple de widgets.
- Reloj.
- Notas rapidas.
- Checklist.
- Accesos rapidos.
- Clima opt-in.
- Deportes opt-in.
- Configuracion clara.
- Export/import.
- Benchmarks.
- Easter egg v1.0.0 como cierre, con texto `First stable release`.

La regla de oro: si un widget complica permisos, rendimiento o privacidad mas de lo esperado, se baja a v1.0.1 sin bloquear la salida de v1.0.0.
