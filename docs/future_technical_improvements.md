# Mejoras Tecnicas Futuras

Este documento reune mejoras de mantenimiento y arquitectura para futuras versiones de martabs. No son features visibles urgentes, sino cambios para que el proyecto siga siendo facil de evolucionar con Codex, Gemini/Antigravity u otros entornos.

## Prioridad recomendada

1. Centralizar mocks de tests.
2. Hacer explicita la capa `browser-api.js`.
3. Agregar herramientas de mantenimiento i18n.
4. Mejorar la captura de miniaturas con eventos + fallback.
5. Extras de robustez: settings schema, migraciones, limpieza de CSS inline y validacion de paquetes.

---

## 1. Gestion de traducciones i18n

### Problema

Con muchos idiomas, agregar una clave nueva obliga a tocar muchos archivos `src/_locales/*/messages.json`. Eso aumenta el riesgo de:

- claves faltantes;
- placeholders inconsistentes;
- mojibake;
- textos copiados en el idioma incorrecto;
- cambios manuales repetitivos.

### Mejora propuesta

Crear scripts Node para mantenimiento de locales.

Primera etapa:

- Usar `src/_locales/es/messages.json` como fuente base de claves.
- Detectar claves faltantes y sobrantes en todos los idiomas.
- Verificar que los placeholders coincidan con el idioma base.
- Generar claves faltantes con un marcador claro, por ejemplo `[TODO]`.
- Fallar en tests si quedan `[TODO]`, mojibake o placeholders incompatibles.

Segunda etapa opcional:

- Generar un reporte legible en consola.
- Ordenar claves consistentemente.
- Crear una herramienta manual de pretraduccion, nunca automatica en build.

### Recomendacion

No auto-traducir durante el build. Puede ahorrar tiempo, pero tambien puede meter traducciones malas silenciosamente. Mejor usar scripts como ayuda y mantener revision humana.

---

## 2. Capa explicita de API del navegador

### Problema

`browser-api.js` tiene una funcion `wrap()` que sirve para muchas APIs callback/promise, pero no para todas. Algunas APIs son sincronas, por ejemplo:

- `runtime.getManifest()`
- `runtime.getURL()`
- `i18n.getMessage()`

Envolverlas como si fueran asincronas puede crear bugs sutiles.

### Mejora propuesta

Reescribir `browser-api.js` como un mapa explicito:

- APIs sincronas se exponen directamente.
- APIs callback/promise se envuelven de forma controlada.
- Cada grupo queda documentado.

Ejemplo conceptual:

```js
runtime: {
  getManifest: api.runtime.getManifest.bind(api.runtime),
  getURL: api.runtime.getURL.bind(api.runtime),
  openOptionsPage: wrap(api.runtime.openOptionsPage, api.runtime)
}
```

### Alternativa

Evaluar `webextension-polyfill`, pero no lo adoptaria automaticamente. Suma dependencia y obliga a revisar build Chrome/Firefox. Para martabs, una capa propia explicita puede ser suficiente y mas liviana.

---

## 3. Centralizacion de mocks para tests

### Problema

Los tests pueden terminar creando mocks parciales de `chrome`/`browser` de forma repetida. Eso hace que cada nuevo test tenga pequenas diferencias y que los bugs de compatibilidad se cuelen.

### Mejora propuesta

Crear:

```text
tests/helpers/browser-mock.js
```

Debe exponer un mock reusable con:

- `storage.local`
- `bookmarks`
- `permissions`
- `runtime`
- `i18n`
- `topSites`
- `tabs`
- helpers para inspeccionar llamadas y estado guardado

### Beneficios

- Tests mas cortos.
- Menos duplicacion.
- Menos mocks incompletos.
- Mejor colaboracion entre agentes: todos prueban contra la misma forma de API.

---

## 4. Captura asincrona de miniaturas

### Problema

`CAPTURE_DELAY_MS` mejora o empeora segun la pagina, maquina y red. Subir el delay ayuda a algunas paginas, pero empeora la espera en otras.

### Mejora propuesta

Mantener un flujo conservador:

1. Al abrir un marcador desde martabs, armar captura pendiente.
2. Esperar `tabs.onUpdated` con `status === "complete"`.
3. Aplicar un delay corto posterior para dar tiempo al primer render.
4. Tener timeout maximo y fallback silencioso.

### Evitar por ahora

No inyectar content scripts en esta etapa. Puede chocar con CSP, permisos, paginas especiales, iframes o politicas de stores. La captura debe seguir siendo opcional, local y silenciosa.

---

## 5. Extra: schema y migraciones de settings

### Problema

`DEFAULT_SETTINGS` crece con cada version. Import/export, nuevas flags y cambios de estructura pueden dejar settings viejos incompletos.

### Mejora propuesta

Crear una funcion central:

```js
normalizeSettings(rawSettings)
```

Responsabilidades:

- mezclar con defaults;
- asegurar tipos esperados;
- limpiar valores invalidos;
- normalizar arrays/objetos;
- migrar claves viejas si aparecen.

Esto se deberia usar en:

- carga normal de settings;
- importacion;
- tests;
- futuras migraciones.

Beneficio: menos bugs por settings viejos o imports raros.

---

## 6. Extra: versionado y changelog interno

### Problema

La version vive en `package.json` y `manifest.base.json`. Si se desincronizan, aparecen paquetes confusos.

### Mejora propuesta

Agregar un test o script que verifique:

- `package.json.version === src/manifest.base.json.version`
- release notes o changelog tienen entrada para esa version cuando corresponda.

Tambien conviene exponer la version en Configuracion usando:

```js
api.runtime.getManifest().version
```

y no hardcodearla.

---

## 7. Extra: reducir estilos inline en Configuracion

### Problema

`setup.html` fue creciendo con estilos inline para resolver rapido layouts concretos. Funciona, pero dificulta:

- RTL;
- responsive;
- consistencia visual;
- mantenimiento por agentes.

### Mejora propuesta

Mover progresivamente estilos inline a clases en `setup.css`.

No hace falta hacerlo todo de golpe. Priorizar:

- encabezados de seccion;
- botones agrupados;
- seccion Estadisticas;
- controles de Accesibilidad;
- layouts que cambian con RTL.

---

## 8. Extra: validacion de paquetes de release

### Problema

Antes de subir a stores hay que asegurar que los zips contengan lo correcto y no incluyan basura.

### Mejora propuesta

Extender `npm run package` o agregar `npm run package:check` para validar:

- `manifest.json` en raiz del zip;
- version correcta;
- `_locales` incluido;
- archivos innecesarios excluidos;
- permisos esperados;
- `background` correcto en Chrome y Firefox;
- no incluir `test-results`, `playwright-report`, `docs` si no corresponde al paquete.

---

## 9. Extra: auditoria de privacidad automatizada

### Problema

martabs promete no usar servicios externos para previews, favicons, metadata, busqueda ni sincronizacion. Esa promesa debe protegerse con tests.

### Mejora propuesta

Ampliar tests de privacidad para detectar:

- URLs externas hardcodeadas no permitidas;
- `fetch()` fuera de revision de enlaces;
- permisos nuevos no documentados;
- uso accidental de `history`;
- content scripts agregados sin decision explicita.

---

## Cierre

Las mejoras mas rentables a corto plazo son:

- mocks centralizados;
- `browser-api.js` explicito;
- scripts i18n;
- schema/migracion de settings.

Todas reducen friccion para futuras features sin cambiar la experiencia del usuario ni aumentar permisos.

