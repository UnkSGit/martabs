# Plan de implementacion - Paso 13: limpieza, README publico y capturas

Objetivo: dejar el repositorio presentable, liviano y facil de levantar por cualquier persona antes de preparar la publicacion en stores. Este paso no debe mezclar tareas legales o de fichas publicas de Chrome Web Store / Firefox Add-ons; eso queda para el Paso 14.

## Criterios de exito

- El README explica que es martabs, como probarlo, como desarrollarlo y que datos usa.
- Las capturas muestran el producto actual con datos de ejemplo, no informacion personal.
- La documentacion viva queda ordenada y sin planes historicos que contradigan el estado actual.
- El repositorio no incluye artefactos temporales, reports o screenshots de ejecuciones fallidas.
- Un colaborador externo puede clonar, instalar, ejecutar tests, generar builds y cargar la extension en Chrome/Firefox.
- La colaboracion con IA queda mencionada de forma transparente, sin nombres de modelos inventados ni referencias a inspiraciones de producto.

## Alcance

### Incluido

- Limpieza general de archivos, carpetas de tests y documentacion obsoleta.
- README publico con instalacion, desarrollo, privacidad, permisos, capturas y colaboracion.
- Capturas reproducibles tomadas con Playwright o desde una build local controlada.
- Guia breve para colaboradores humanos o agentes con modelos propios.
- Ajustes menores de documentacion viva si durante la limpieza se detectan inconsistencias.

### Fuera de alcance

- Preparar ficha final para Chrome Web Store o Firefox Add-ons.
- Redactar textos legales definitivos para stores.
- Elegir licencia final del proyecto o revisar licencias de terceros.
- Cambios funcionales grandes en la extension.

## Tareas propuestas

### 1. Auditoria inicial del repositorio

- Revisar `git status --short` antes de tocar archivos.
- Identificar archivos generados que no deberian versionarse:
  - `dist/`
  - `playwright-report/`
  - `test-results/`
  - `blob-report/`
  - screenshots `*-actual.png`
  - zips o builds manuales.
- Revisar si `.gitignore` cubre los artefactos anteriores.
- Revisar si hay documentos historicos absorbidos por docs vivos:
  - conservar solo los que agregan valor actual;
  - mover informacion vigente a `docs/task.md`, `docs/implementation_plan.md`, `docs/maintenance_notes.md`, `docs/testing.md` o `docs/walkthrough.md`;
  - eliminar planes viejos solo si ya no aportan contexto unico.
- Revisar la convivencia de `test/` y `tests/`:
  - si se decide unificar, actualizar rutas y verificar que `npm test` siga encontrando todo;
  - no mover tests solo por estetica si agrega riesgo innecesario.

### 2. README publico

Reescribir `README.md` con tono claro y sobrio. Debe servir para usuarios tecnicos y para colaboradores.

Contenido minimo:

- Nombre y descripcion corta de martabs.
- Captura principal arriba del README cuando esten listas las imagenes.
- Lista de funciones actuales:
  - nueva pestana con dashboard de marcadores;
  - busqueda local;
  - etiquetas automaticas/manuales;
  - favoritos fijados;
  - modos visuales por carpeta;
  - orden global y por carpeta;
  - orden manual y movimientos locales;
  - edicion de marcadores;
  - iconos custom con fallback;
  - previews locales;
  - revision manual de enlaces;
  - tema claro/oscuro/sistema;
  - i18n con selector de idioma.
- Privacidad:
  - datos guardados localmente;
  - sin telemetria;
  - sin servicios externos para previews, favicons, metadata, busqueda o sincronizacion;
  - capturas locales solo si el usuario activa la opcion y abre un marcador desde martabs;
  - revision de enlaces solo por accion del usuario.
- Permisos:
  - `bookmarks`;
  - `storage`;
  - `favicon` solo en Chrome;
  - permisos opcionales de URLs para revision de enlaces y capturas.
- Instalacion en modo desarrollador:
  - requisitos;
  - `npm install`;
  - `npm run build`;
  - cargar `dist/chrome` en Chrome/Edge/Brave;
  - cargar `dist/firefox/manifest.json` como complemento temporal en Firefox.
- Desarrollo:
  - `npm test`;
  - `npm run build`;
  - `npm run test:e2e:chrome` si aplica;
  - explicar limitaciones actuales de Firefox E2E remitiendo a `docs/firefox-testing-issues.md`.
- Estructura del proyecto.
- Documentacion util:
  - `docs/task.md`;
  - `docs/implementation_plan.md`;
  - `docs/maintenance_notes.md`;
  - `docs/testing.md`;
  - `docs/collaboration.md`;
  - `docs/walkthrough.md`;
  - `docs/roadmap.md`.
- Colaboracion con IA:
  - no mencionar inspiraciones visuales ni productos usados como referencia;
  - no inventar nombres de modelos;
  - usar la denominacion acordada en `docs/task.md`: Antigravity, Gemini 3.5 Pro, Gemini 3.5 Fast y Codex GPT 5.5;
  - antes de publicar, verificar si esos nombres son la denominacion publica correcta o si conviene escribirlo de forma mas generica.

### 3. Capturas para documentacion

Usar datos de ejemplo controlados. No usar marcadores personales del perfil real.

Capturas recomendadas:

- Dashboard principal en modo oscuro.
- Dashboard principal en modo claro.
- Busqueda con resultados.
- Panel de Configuracion con buscador.
- Modos visuales por carpeta:
  - lista;
  - iconos;
  - quicklinks.
- Edicion de marcador.
- Vista de fallos/revision de enlaces si hay fixtures adecuados.

Ubicacion sugerida:

- `docs/assets/screenshots/`

Nombres sugeridos:

- `dashboard-dark.png`
- `dashboard-light.png`
- `search-results.png`
- `settings.png`
- `folder-modes.png`
- `edit-bookmark.png`
- `link-review.png`

Notas:

- Preferir Playwright para reproducibilidad.
- Si Playwright no puede cargar una extension en Firefox de forma estable, documentar la limitacion y tomar capturas de Chrome.
- Las capturas deben mostrar la UI real, no mockups externos.
- Evitar imagenes con datos privados, URLs internas o marcas no necesarias.

### 4. Documentacion para terceros

Agregar o mejorar una guia breve, idealmente `docs/development.md` o una seccion equivalente del README, con:

- Requisitos de entorno.
- Instalacion desde cero.
- Comandos de test y build.
- Como cargar la extension temporalmente en Chrome y Firefox.
- Como ejecutar E2E en Chrome.
- Limitaciones conocidas de E2E en Firefox.
- Como leer la documentacion viva antes de colaborar.
- Como trabajar con agentes/modelos propios:
  - leer `docs/collaboration.md`;
  - registrar cambios en `docs/task.md`;
  - actualizar maintenance notes si se corrige un bug delicado;
  - no reescribir decisiones previas sin revisar el historial documental.

### 5. Limpieza tecnica minima

- Revisar `package.json`:
  - nombres de scripts;
  - dependencias no usadas;
  - coherencia entre `build`, `build:chrome`, `build:firefox` y E2E.
- Revisar `scripts/build.mjs`:
  - que copie `_locales`;
  - que genere manifests correctos para Chrome y Firefox.
- Revisar tests:
  - mantener tests unitarios en una estructura clara;
  - evitar duplicados;
  - actualizar referencias si se mueve algun archivo.
- Revisar docs:
  - `docs/task.md` debe ser el estado vivo;
  - `docs/roadmap.md` debe contener futuro producto;
  - `docs/implementation_plan.md` debe describir arquitectura vigente;
  - `docs/maintenance_notes.md` debe contener reglas sensibles;
  - no dejar planes viejos contradiciendo estos documentos.

### 6. Verificacion de cierre

Ejecutar:

```powershell
npm test
npm run build
```

Si se actualizan o generan capturas con Playwright:

```powershell
npm run test:e2e:chrome
```

Validar manualmente:

- README renderiza bien en GitHub.
- Links internos a docs y capturas funcionan.
- No se subieron artefactos generados innecesarios.
- Build de Chrome y Firefox existe y contiene `_locales`.
- El README no contiene referencias a productos usados como inspiracion.
- Las menciones a herramientas/modelos coinciden con la formulacion aprobada o estan redactadas de forma generica.

## Orden recomendado de trabajo

1. Auditar archivos y decidir que limpiar.
2. Ordenar tests/docs si hay cambios obvios y seguros.
3. Crear o actualizar capturas con datos de ejemplo.
4. Reescribir README.
5. Agregar guia para colaboradores si el README queda demasiado largo.
6. Ejecutar verificacion.
7. Actualizar `docs/task.md` con el resultado del Paso 13.

## Riesgos y cuidados

- No borrar documentacion historica que todavia contiene decisiones no copiadas a docs vivos.
- No usar capturas del perfil real del usuario.
- No afirmar compatibilidad o comportamiento que no este probado.
- No mezclar Paso 13 con checklist legal/publicacion de stores.
- No mencionar marcas, productos o servicios como inspiracion visual.
- No presentar herramientas de IA como autores principales; describirlas como colaboracion asistida.
