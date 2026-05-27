# Ajustes Finales de Vista Principal v0.9.1

> **Para Gemini / Antigravity / Codex:** este plan reemplaza a `implementation_planFixes0.9.1.md` y `implementation_planFixes0.9.1vA.md`. Implementar solo estos ajustes de UI en la vista principal. No tocar permisos, stores, manifest, import/export ni i18n fuera de los textos nuevos necesarios.

## Objetivo

Pulir la pantalla principal para que sea mas practica y visualmente equilibrada:

- Quitar el boton global **Reordenar carpetas** del encabezado.
- Agregar ordenamiento rapido dentro de cada carpeta, porque ir a Configuracion para ordenar marcadores es incomodo.
- Asegurar que en la vista **Iconos grandes** entren 4 iconos por fila dentro de una carpeta.
- Compactar el encabezado para que logo/contador y Configurar no queden en puntas opuestas de la pantalla.

## Decision cerrada

- Si se agrega un boton de ordenamiento por carpeta, debe quedar visible por defecto.
- No agregar por ahora una opcion nueva tipo "Mostrar botones en carpetas". Puede ser util a futuro, pero no forma parte de este ajuste y suma configuracion innecesaria.
- El encabezado debe ser mas compacto que el tablero. No buscar que tenga el mismo ancho que las carpetas si eso separa demasiado logo y Configurar.

---

## Estado actual relevante

- `src/newtab/newtab.html` contiene el boton `#reorder-folders` dentro de `.topbar-actions`.
- `src/newtab/newtab.js` consulta `#reorder-folders` y tiene logica asociada.
- `src/newtab/newtab.js` crea `modeBtn` dentro de `renderFolders()`.
- `src/shared/bookmark-sort.js` define estos modos reales:
  - `browser`
  - `manual`
  - `title-asc`
  - `date-newest`
  - `domain-asc`
  - `health-broken-first`
- No existen modos internos `name`, `date` ni `url`.
- `src/newtab/newtab.css` tiene:
  - `.topbar { max-width: 1280px; justify-content: space-between; }`
  - `.layout-masonry { column-width: 300px; column-gap: 20px; }`
  - `.mode-icons-large .bookmark { padding: 10px; }`
  - `.mode-icons-large .favicon-* { width: 48px; height: 48px; }`
- `tests/newtab.test.js` puede tener una asercion que impide `sortBtn`. Si se agrega el boton, esa prueba debe actualizarse.

---

## 1. Quitar boton global "Reordenar carpetas"

**Intencion UX:** el encabezado principal debe tener solo identidad, estado y Configuracion. El ordenamiento debe ocurrir donde estan los marcadores.

**Archivos:**

- Modificar: `src/newtab/newtab.html`
- Modificar: `src/newtab/newtab.js`
- Modificar: `tests/newtab.test.js` si hay aserciones relacionadas

**Cambios:**

- Eliminar el bloque del boton `#reorder-folders` en `newtab.html`.
- Eliminar la constante `reorderFoldersButton` si queda sin uso.
- Eliminar el listener asociado.
- Mantener intacto el boton `#settings`.

**Aceptacion:**

- La pantalla principal no muestra "Reordenar carpetas".
- Configurar sigue abriendo la pantalla de configuracion.
- No queda codigo muerto consultando `#reorder-folders`.

---

## 2. Agregar ordenamiento rapido en cada carpeta

**Intencion UX:** aunque agrega un control mas, es util. Ordenar desde Configuracion es poco practico para una accion frecuente y contextual.

**Archivos:**

- Modificar: `src/newtab/newtab.js`
- Modificar: `src/newtab/newtab.css`
- Modificar: `src/shared/i18n.js` o archivo equivalente de traducciones si se agregan tooltips/textos
- Modificar: `tests/newtab.test.js`
- Revisar: `src/shared/bookmark-sort.js`
- Revisar: `src/setup/setup.js`

**Comportamiento requerido:**

- Agregar un boton compacto de ordenamiento en el encabezado de cada carpeta, junto al boton de cambio de vista.
- El boton debe modificar el orden de los marcadores de esa carpeta, no el orden de las carpetas.
- Debe guardar en `currentSettings.folderSorts[folderId]`.
- Debe persistir en storage.
- Debe actualizar visualmente la carpeta al instante.
- Debe usar tooltips/i18n para que el usuario entienda el orden actual o la accion.

**Modos permitidos:**

Usar solamente los modos actuales:

- `browser`: orden del navegador
- `manual`: orden manual
- `title-asc`: titulo A-Z
- `date-newest`: mas recientes primero
- `domain-asc`: dominio A-Z
- `health-broken-first`: enlaces con fallos primero

**No hacer en esta tarea:**

- No crear valores internos `name`, `date` ni `url`.
- No agregar un orden por URL salvo que se implemente formalmente como nuevo modo en `SORT_MODES`, setup, i18n y tests.
- No agregar una opcion global para ocultar botones de carpeta.

**UI recomendada:**

- Usar icono pequeno, sin texto visible permanente.
- Mantener el boton de orden junto al boton de vista.
- El orden visual recomendado de controles es:
  - Ordenar
  - Cambiar vista
- Los botones no deben aumentar la altura del encabezado de carpeta.
- Si el ciclo de modos queda confuso, preferir un menu liviano/popover. Si se usa ciclo, el tooltip debe dejar claro el modo actual y el siguiente.

**Manual + drag and drop:**

- Si el usuario arrastra marcadores dentro de la misma carpeta, la carpeta debe quedar en `manual`.
- Si el usuario selecciona `manual` desde el boton y aun no existe `folderBookmarkOrders[folderId]`, usar el orden visible actual como punto de partida.
- No romper el drag and drop entre carpetas.

**Tests:**

- Actualizar la prueba que actualmente espera que no exista `sortBtn`.
- Agregar/ajustar test para confirmar que el control usa `folderSorts`.
- Agregar/ajustar test para confirmar que se usan los valores reales de `SORT_MODES`.
- Mantener la garantia previa del boton de vista: si el test valida que no hace redraw completo, no romperlo.

---

## 3. Garantizar 4 iconos grandes por fila

**Intencion UX:** en vista **Iconos grandes**, una carpeta debe poder mostrar 4 accesos por fila. Con 3 se ve raro y desperdicia espacio.

**Archivos:**

- Modificar: `src/newtab/newtab.css`
- Agregar/modificar: E2E de layout si ya existe `columns-capacity.spec.mjs` o equivalente

**Problema actual:**

Con columna de 300px y gap de 20px, 4 columnas del tablero necesitan:

```text
4 * 300 + 3 * 20 = 1260px
```

En viewports comunes el espacio disponible puede ser menor, por eso baja a 3 columnas. Ademas, dentro de una carpeta, los iconos grandes tambien deben entrar de a 4.

**Cambios recomendados:**

- Reducir el ancho base de carpeta:

```css
.layout-masonry {
  column-width: 280px;
}
```

- Revisar los max-width derivados para que sigan coherentes con el nuevo ancho:

```css
.layout-masonry.masonry-1 { max-width: 280px o valor con padding visual; }
.layout-masonry.masonry-2 { max-width: 580px aprox.; }
.layout-masonry.masonry-3 { max-width: 880px aprox.; }
.layout-masonry.masonry-max { max-width: segun decision del tablero; }
```

- Ajustar iconos grandes para que 4 entren comodos:

```css
.mode-icons-large {
  gap: 10px;
}

.mode-icons-large .bookmark {
  padding: 6px;
}
```

Con icono de 48px y padding de 6px, cada item ocupa cerca de 60px. Cuatro items mas tres gaps de 10px ocupan cerca de 270px.

**Aceptacion:**

- En una carpeta de ancho aproximado 280px entran 4 iconos grandes por fila.
- En viewport desktop comun, especialmente 1280px, el tablero no cae a 3 columnas por exceso de ancho si hay espacio para 4.
- No hay overflow horizontal.
- Los titulos largos siguen truncando correctamente en las vistas con texto.

**Tests:**

- E2E con viewport 1280px para verificar 4 columnas/carpetas cuando hay 4 carpetas.
- E2E o test visual con una carpeta en `icons-large` y 4 marcadores, verificando que los 4 quedan en la misma fila.

---

## 4. Compactar encabezado: logo y Configurar mas cerca

**Intencion UX:** el encabezado actual se siente demasiado abierto: logo/contador a un extremo y Configurar al otro. Deben leerse como un unico bloque superior centrado.

**Archivos:**

- Modificar: `src/newtab/newtab.css`
- Revisar: `src/newtab/newtab.html`
- Modificar/agregar: `e2e/tests/header-layout.spec.mjs` si aplica

**Cambio recomendado:**

Separar el ancho del encabezado del ancho del tablero. El tablero puede ser mas amplio, pero el encabezado debe ser compacto.

Probar primero:

```css
.topbar {
  max-width: 900px;
  margin: 0 auto 20px auto;
  justify-content: space-between;
}
```

Si visualmente sigue demasiado abierto, bajar a `800px`. Si queda apretado en algun idioma o con contador largo, volver a `900px`.

**Importante:**

- No aumentar `.topbar` a 1440px para resolver este punto. Eso empeora la separacion entre logo y Configurar.
- El buscador puede seguir con su ancho actual.
- El tablero puede mantener otro max-width distinto.

**Aceptacion:**

- En 1280px, el encabezado se ve centrado y compacto.
- En 1600px/1920px, logo/contador y Configurar no quedan en extremos lejanos.
- El buscador queda visualmente relacionado con el encabezado.
- No hay superposicion con contador largo ni textos traducidos.

**Tests:**

- E2E de layout que valide que `.topbar` no supera el ancho maximo decidido.
- Capturas Playwright en 1280px y 1600px para validar visualmente.

---

## 5. Verificacion final

Ejecutar:

```powershell
npm test
```

Si estan disponibles:

```powershell
npm run test:e2e:chrome
```

Verificaciones manuales:

- Vista principal sin boton "Reordenar carpetas".
- Cada carpeta muestra boton compacto de ordenar y boton de vista.
- Ordenar cambia solo esa carpeta y persiste al recargar.
- Iconos grandes muestran 4 por fila.
- Encabezado compacto y centrado en 1280px y 1600px.
- No quedan `console.log` temporales de debug.

