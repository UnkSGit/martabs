# Store Listing v1.0.0 - martabs

Este documento reemplaza el plan anterior de SEO/ASO por una guia practica para publicar o actualizar **martabs** en Chrome Web Store y Firefox Add-ons.

Punto importante: el nombre visible queda como **martabs**. No asumimos que se pueda cambiar el titulo desde la tienda. La optimizacion se concentra en subtitulo, descripcion, capturas, README, GitHub Pages y fichas externas.

---

## Responsabilidades

### IA / repo

- Preparar textos finales para copiar en tiendas.
- Preparar screenshots finales en carpetas listas para subir.
- Preparar captions/textos de apoyo para screenshots, si se decide usarlos.
- Actualizar README, GitHub Pages y release notes.
- Validar que no haya referencias a productos inspiradores.

### Gabriel / manual

- Copiar textos en Chrome Web Store y Firefox Add-ons.
- Subir screenshots y promo images.
- Confirmar URLs reales de las tiendas.
- Elegir categoria, idioma principal y politica de privacidad en los paneles.
- Publicar o enviar a revision.

---

## Nombre

**Nombre fijo**

```text
martabs
```

No intentar usar:

```text
martabs: Bookmark Manager & New Tab Dashboard
```

Si alguna tienda permite subtitulo, resumen o promotional text, usar ahi las palabras clave.

---

## Listing En Ingles

### Short Description

```text
A fast, private new tab dashboard for searching, organizing, and customizing your browser bookmarks locally.
```

### Long Description

```text
martabs replaces your browser's new tab page with a fast, private, and customizable bookmark dashboard.

It is designed for people who have many bookmarks spread across folders and want a cleaner way to search, scan, organize, and open them without relying on a cloud service.

FAST LOCAL BOOKMARK SEARCH
Search bookmarks by title, URL, domain, folder, and tags. Results are shown instantly from local browser data.

CUSTOM DASHBOARD
Choose which bookmark folders appear on your new tab page. Reorder columns, group folders into tabs, and select the visual mode that works best for each folder.

MULTIPLE FOLDER VIEWS
Use list, compact list, icon grids, large icons, or quicklinks depending on the type of bookmarks you keep in each folder.

LOCAL-FIRST PRIVACY
martabs stores your settings, tags, layouts, previews, and statistics locally in your browser.

- No account required.
- No martabs sync server.
- No external analytics.
- No remote bookmark indexing.

Optional connected widgets such as Weather and Sports only contact their public data providers when enabled. Your bookmarks are not sent to those services.

USEFUL WIDGETS
Add optional widgets to your dashboard:

- Clock
- Notes
- Checklist
- Weather
- Sports scores

BOOKMARK TOOLS

- Edit bookmark names and tags from the dashboard.
- Pin favorite bookmarks.
- Reorder bookmarks locally.
- Move bookmarks between displayed folders without changing your browser's original folder tree.
- Review broken or unreachable links.
- Capture local page previews for bookmarks opened from martabs.
- Import and export your martabs settings.

martabs is built to keep your bookmark workflow fast, visual, and private.
```

---

## Listing En Espanol

### Descripcion Corta

```text
Un tablero de nueva pestana rapido y privado para buscar, organizar y personalizar tus marcadores localmente.
```

### Descripcion Larga

```text
martabs reemplaza la pagina de nueva pestana de tu navegador por un tablero de marcadores rapido, privado y personalizable.

Esta pensado para personas que tienen muchos marcadores repartidos en carpetas y quieren una forma mas limpia de buscar, revisar, organizar y abrir enlaces sin depender de un servicio en la nube.

BUSQUEDA LOCAL RAPIDA
Busca marcadores por titulo, URL, dominio, carpeta y etiquetas. Los resultados aparecen al instante usando datos locales del navegador.

TABLERO PERSONALIZABLE
Elige que carpetas de marcadores aparecen en tu nueva pestana. Reordena columnas, agrupa carpetas en pestanas y selecciona el modo visual ideal para cada carpeta.

VARIOS MODOS DE VISTA
Usa lista, lista compacta, grilla de iconos, iconos grandes o quicklinks segun el tipo de marcadores que tengas en cada carpeta.

PRIVACIDAD LOCAL-FIRST
martabs guarda ajustes, etiquetas, disenos, previews y estadisticas localmente en tu navegador.

- No requiere cuenta.
- No usa servidor de sincronizacion propio.
- No incluye analiticas externas.
- No indexa tus marcadores en servidores remotos.

Los widgets conectados opcionales, como Clima y Deportes, solo consultan sus proveedores publicos cuando estan activados. Tus marcadores no se envian a esos servicios.

WIDGETS UTILES
Agrega widgets opcionales al tablero:

- Reloj
- Notas
- Lista de tareas
- Clima
- Resultados deportivos

HERRAMIENTAS PARA MARCADORES

- Edita nombres y etiquetas desde el tablero.
- Fija tus marcadores favoritos.
- Reordena marcadores localmente.
- Mueve marcadores entre carpetas visibles sin modificar el arbol original del navegador.
- Revisa enlaces rotos o inaccesibles.
- Captura previews locales de paginas abiertas desde martabs.
- Importa y exporta tu configuracion de martabs.

martabs esta hecho para que tu flujo con marcadores sea rapido, visual y privado.
```

---

## Screenshots Para Subir

### Chrome Web Store

Chrome permite hasta 5 screenshots. Preparar **5 imagenes finales** en `1280x800`.

Carpeta final:

```text
docs/assets/store_screenshots/final/chrome/{idioma}/
```

Set generado:

1. `01-dashboard.png`
   - Vista principal en modo oscuro.
   - Debe mostrar carpetas, logo, busqueda y widgets si estan activos.

2. `02-search.png`
   - Busqueda activa con resultados visibles.

3. `03-folder-views.png`
   - Ejemplo con distintos modos de carpeta: lista, iconos, quicklinks.

4. `04-settings.png`
   - Configuracion moderna, idealmente seccion Tablero o Widgets.

5. `05-bookmark-tools.png`
   - Edicion de marcador, etiquetas y herramientas locales.

No se agregaron overlays de texto sobre las capturas. Esto evita duplicar trabajo por idioma y reduce el riesgo de tener textos desactualizados en la tienda.

### Firefox Add-ons

Usar las mismas 5 capturas, salvo que Firefox requiera otra relacion/tamano en su panel.

Carpeta final:

```text
docs/assets/store_screenshots/final/firefox/{idioma}/
```

### Idiomas

Sets finales generados:

```text
en
es
ja
zh_CN
```

Si despues se agregan capturas para otros idiomas, mantener los mismos nombres y orden dentro de `final/chrome/{idioma}/` y `final/firefox/{idioma}/`.

---

## Promo Images

### Chrome Web Store

Preparar:

```text
docs/assets/store_screenshots/final/promo/chrome-small-440x280.png
docs/assets/store_screenshots/final/promo/chrome-marquee-1400x560.png
```

Recomendacion:

- Usar logo, fondo limpio y una captura o composicion real de la interfaz.
- Evitar mucho texto, porque estas imagenes no se localizan como las descripciones.
- No mencionar comparaciones ni inspiraciones.

Promos generadas:

```text
docs/assets/store_screenshots/final/promo/chrome-small-440x280.png
docs/assets/store_screenshots/final/promo/chrome-marquee-1400x560.png
```

---

## Que Podemos Hacer Con IA

- Generar las 5 capturas con Playwright usando datos de ejemplo.
- Crear versiones en ingles y espanol.
- Exportar imagenes al tamano correcto.
- Crear promo image limpia.
- Actualizar README con las mismas capturas.
- Preparar texto listo para copiar en CWS y AMO.

## Que Tiene Que Hacer Gabriel Manualmente

- Subir screenshots al panel de Chrome Web Store.
- Subir screenshots al panel de Firefox Add-ons.
- Pegar descripcion corta y larga.
- Revisar si la tienda deja editar algun campo adicional, como subtitulo o resumen.
- Confirmar que el nombre queda como `martabs`.
- Enviar a revision.

---

## Checklist

### IA / repo

- [x] Generar capturas finales `1280x800`.
- [x] Generar set `en`.
- [x] Generar set `es`.
- [x] Generar sets adicionales `ja` y `zh_CN`.
- [x] Generar promo `440x280`.
- [x] Generar marquee opcional `1400x560`.
- [ ] Revisar README y GitHub Pages.
- [x] Dejar todos los assets en `docs/assets/store_screenshots/final/`.

### Gabriel / manual

- [ ] Subir screenshots a Chrome Web Store.
- [ ] Subir screenshots a Firefox Add-ons.
- [ ] Copiar descripcion corta.
- [ ] Copiar descripcion larga.
- [ ] Revisar privacidad/categoria/permisos declarados.
- [ ] Confirmar publicacion o envio a revision.
