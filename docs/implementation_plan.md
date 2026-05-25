# Plan de Implementación

Este documento sirve para alinear la arquitectura y diseño técnico entre los agentes y el usuario.

## Tareas en curso

### Previews por Metadata Local (Roadmap Paso 1)

**Objetivo:** Enriquecer las vistas previas locales extrayendo las etiquetas `og:image` o `twitter:image` de los sitios cuando el usuario lo solicite, sin depender de servicios de terceros.

**Mecanismo propuesto:**
1. **Acción Manual:** Añadir un botón "Refrescar Vista Previa" (podría ser un ícono circular en la tarjeta de vista previa o al lado del botón de "Editar" en la fila del marcador).
2. **Fetch en Background:** Al presionar el botón, se enviará un mensaje al `service-worker.js` con la URL del marcador.
3. **Parseo de HTML:** El Service Worker hará un `fetch()` nativo al sitio. Como en Service Workers de Manifest V3 no existe `DOMParser`, usaremos expresiones regulares (Regex) seguras para buscar `<meta property="og:image" content="...">` o `<meta name="twitter:image" content="...">`.
4. **Manejo de CORS:** Si el sitio tiene políticas estrictas (CORS), el `fetch` puede fallar a menos que el usuario tenga otorgados los permisos de `<all_urls>` (los mismos que activamos para el Paso 2 de capturas automáticas).
5. **Almacenamiento:** Una vez hallada la URL de la imagen, la descargaremos como Blob, la redimensionaremos con `OffscreenCanvas` para que quede liviana y la guardaremos en el mismo caché de `capturedPreviews` (o uno nuevo `metadataPreviews`).
6. **Prioridad Visual:** Al mostrar la miniatura, martabs verificará primero si hay una *captura de pantalla* (Paso 2), luego si hay *metadata almacenada* (Paso 1), y por último mostrará el fondo gris predeterminado.

**Consideraciones para aprobar:**
- ¿Dónde te gustaría poner el botón de "Refrescar"? ¿Dentro del menú de Editar (clic), o como un botón adicional que aparece al hacer hover sobre el marcador?
- Dado que el `fetch` se hace localmente desde la conexión del usuario, algunos sitios pueden bloquear la lectura (ej: sitios que requieren login o anti-bots). Para esos casos, simplemente mostraremos un "No se pudo obtener imagen". ¿De acuerdo?
