# Plan ASO/SEO v1.0.0 - martabs

Este documento separa las tareas de descubrimiento y publicacion de **martabs v1.0.0** segun quien puede ejecutarlas:

- **IA / repo**: tareas que Codex o Gemini pueden preparar dentro del proyecto.
- **Gabriel / manual**: tareas que requieren acceso a cuentas, tiendas o comunidades.
- **Compartido**: tareas donde la IA prepara materiales y Gabriel decide/publica.

El objetivo no es "hacer spam de backlinks", sino presentar martabs con claridad: una nueva pestana rapida, local-first, privada y centrada en marcadores.

---

## Principios

- Mantener todas las afirmaciones verificables. No prometer seguridad, ranking o rendimiento sin evidencia.
- Evitar referencias a productos que inspiraron el proyecto.
- No usar practicas insistentes para pedir reviews. Si se agrega una tarjeta de valoracion, debe ser opcional, secundaria y no intrusiva.
- Priorizar confianza: privacidad local, permisos claros, codigo abierto y documentacion honesta.
- Preparar textos en ingles como fuente principal y luego localizar.

---

## Posicionamiento Base

**Nombre sugerido para tiendas**

`martabs: New Tab Bookmark Dashboard`

Alternativas:

- `martabs: Bookmark Manager & New Tab Dashboard`
- `martabs: Visual Bookmark Manager`
- `martabs: Bookmark Dashboard`

**Mensajes centrales**

1. Organiza tus marcadores en una nueva pestana rapida y visual.
2. Local-first: sin cuentas, sin servidores propios de martabs, sin analiticas externas.
3. Busqueda, carpetas, previews locales, widgets y personalizacion sin convertir la extension en algo pesado.

---

## Fase 1 - Metadatos de Tiendas

### IA / repo

- Redactar short description en ingles y espanol.
- Redactar long description en ingles y espanol.
- Preparar variantes de copy para Chrome Web Store y Firefox Add-ons.
- Revisar que el copy no mencione inspiraciones ni comparaciones directas innecesarias.
- Crear archivo fuente versionado, por ejemplo:
  - `docs/store_listing/en.md`
  - `docs/store_listing/es.md`
  - `docs/store_listing/translations.md`
- Traducir el texto base a los idiomas ya soportados por martabs.
- Dejar checklist de campos exactos para copiar/pegar en cada tienda.

### Gabriel / manual

- Entrar al Chrome Web Store Developer Dashboard.
- Entrar a Firefox Add-ons Developer Hub.
- Pegar nombre, resumen, descripcion y categoria.
- Confirmar URLs publicas reales de Chrome Web Store y AMO.
- Revisar que las politicas de privacidad, licencia y datos queden bien declaradas en ambas tiendas.

### Compartido

- Gabriel aprueba el nombre final antes de cambiarlo en tiendas.
- IA propone keywords; Gabriel decide si el tono se siente natural.

---

## Fase 2 - Recursos Visuales

### IA / repo

- Preparar hasta **5 screenshots para Chrome Web Store**. Chrome acepta hasta 5 capturas; deben ser full bleed y en `1280x800` o `640x400`.
- Preparar capturas equivalentes para Firefox Add-ons si se usan assets separados.
- Generar variantes por idioma prioritario:
  - Ingles
  - Espanol
  - Opcional: Japones, Chino simplificado, Arabe si ya hay capturas RTL listas.
- Preparar textos cortos sobre screenshots, no demasiado promocionales.
- Actualizar capturas en:
  - `docs/assets/store_screenshots/en/`
  - `docs/assets/store_screenshots/es/`
  - otros idiomas si aplica.
- Generar/actualizar demo WebM para README o GitHub Pages.
- Preparar imagen promocional de Chrome:
  - Small promo tile: `440x280`
  - Marquee promo tile opcional: `1400x560`
- Evitar texto en imagenes promocionales, porque no son locale-specific.

### Gabriel / manual

- Subir las imagenes a Chrome Web Store.
- Subir las imagenes a Firefox Add-ons.
- Verificar en la vista previa de cada tienda que no queden cortadas, borrosas o con texto demasiado chico.

### Compartido

- IA genera assets; Gabriel elige version final.
- Si hay dudas con el estilo, priorizar capturas reales de la interfaz por encima de composiciones demasiado publicitarias.

---

## Fase 3 - Integracion Dentro de martabs

### IA / repo

- Agregar una tarjeta opcional en `Avanzado` o `Acerca de`:
  - Titulo: `Support martabs`
  - Descripcion: mensaje breve y no insistente.
  - Boton: `Write a review`
- Detectar navegador para abrir el enlace correcto:
  - Chrome Web Store reviews.
  - Firefox Add-ons listing/reviews.
- Agregar claves i18n en todos los idiomas.
- Agregar tests para:
  - El boton existe.
  - No aparece como modal/popup.
  - Usa URLs correctas segun navegador.
  - Las claves i18n estan sincronizadas.
- Mantenerlo como accion voluntaria; no mostrarlo automaticamente.

### Gabriel / manual

- Proveer URLs definitivas de las tiendas cuando esten publicadas.
- Confirmar si quiere incluir el boton en v1.0.0 o dejarlo para v1.0.1.

### Nota de politica

El pedido de valoracion debe ser sobrio. No se deben ofrecer recompensas, bloquear funciones, insistir luego de cada uso ni condicionar experiencia a una review.

---

## Fase 4 - GitHub, README y GitHub Pages

### IA / repo

- Actualizar `README.md` con:
  - Badges de Chrome Web Store y Firefox Add-ons.
  - Capturas actuales.
  - Demo WebM o GIF liviano.
  - Lista de features v1.0.0.
  - Privacidad local-first.
  - Instalacion desde tiendas y modo desarrollo.
- Actualizar GitHub Pages si el proyecto la usa:
  - Hero simple.
  - Links oficiales.
  - Capturas reales.
  - Politica de privacidad.
- Revisar que no haya menciones a productos inspiradores.

### Gabriel / manual

- Activar/verificar GitHub Pages desde GitHub si no esta activo.
- Confirmar URLs publicas.
- Revisar que los badges apunten a listados reales.

---

## Fase 5 - Lanzamiento y Comunidad

### IA / repo

- Preparar borradores de publicaciones:
  - Product Hunt.
  - Indie Hackers.
  - Reddit.
  - GitHub Release.
- Preparar una version corta y honesta del pitch:
  - Que hace.
  - Por que existe.
  - Que datos no recolecta.
  - Que limitaciones tiene.

### Gabriel / manual

- Publicar en Product Hunt si decide hacerlo.
- Publicar en Indie Hackers.
- Crear entrada en AlternativeTo.
- Publicar en Reddit solo si las reglas del subreddit lo permiten.
- Responder comentarios con transparencia.

### Recomendacion de canales

- Mejor encaje:
  - `r/productivity`
  - comunidades de Firefox/Chrome si permiten lanzamientos.
  - Product Hunt si ya hay pagina publica prolija.
  - AlternativeTo como ficha informativa.
- Evitar o revisar con mucho cuidado:
  - `r/selfhosted`, porque martabs es local-first pero no self-hosted.

---

## Fase 6 - Medicion

### IA / repo

- Documentar metricas a revisar semanalmente.
- Preparar una plantilla simple en `docs/release_metrics_v1.0.0.md`.
- Actualizar benchmarks de performance si se modifica la pagina principal.

### Gabriel / manual

- Tomar datos desde:
  - Chrome Web Store dashboard.
  - Firefox Add-ons dashboard.
  - GitHub traffic.
  - GitHub Pages si se configura analitica compatible con privacidad.

### KPIs Sugeridos

| Metrica | Fuente | Objetivo inicial |
| --- | --- | --- |
| Instalaciones activas | CWS / AMO | Medir baseline y crecimiento semanal |
| Conversion de ficha | CWS / AMO | Mejorar con screenshots/copy |
| Reviews reales | CWS / AMO | Conseguir feedback organico |
| Clicks desde GitHub | GitHub traffic | Confirmar que README convierte |
| Issues abiertos | GitHub | Detectar friccion post-lanzamiento |

Los objetivos agresivos como `Top 15 para Bookmark Manager` deben quedar como aspiracionales, no como promesa del plan.

---

## Checklist Consolidado Por Responsable

### IA / repo

- [ ] Crear textos de tienda en `docs/store_listing/`.
- [ ] Traducir textos base.
- [ ] Preparar hasta 5 screenshots por idioma prioritario.
- [ ] Preparar promo tile `440x280`.
- [ ] Preparar marquee promo tile `1400x560` si se decide usar.
- [ ] Actualizar README y GitHub Pages.
- [ ] Implementar tarjeta opcional de review si Gabriel la aprueba.
- [ ] Agregar i18n y tests para esa tarjeta.
- [ ] Crear borradores de posts externos.
- [ ] Crear plantilla de metricas.

### Gabriel / manual

- [ ] Elegir nombre final de tienda.
- [ ] Copiar/pegar metadatos en CWS y AMO.
- [ ] Subir screenshots y promo images.
- [ ] Confirmar URLs publicas de tiendas.
- [ ] Activar/verificar GitHub Pages.
- [ ] Publicar GitHub Release.
- [ ] Publicar en AlternativeTo/Product Hunt/Indie Hackers/Reddit si decide hacerlo.
- [ ] Revisar metricas semanalmente.

### Compartido

- [ ] Revisar tono del copy.
- [ ] Revisar capturas finales.
- [ ] Revisar cumplimiento de politicas antes de publicar.
- [ ] Decidir si el boton de review entra en v1.0.0 o queda para v1.0.1.
