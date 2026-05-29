# Documentación Técnica: Versión 0.9.4

Esta versión se ha centrado fuertemente en mejorar la accesibilidad (a11y), añadir soporte completo para el idioma Árabe e idiomas RTL (Right-To-Left), así como la simplificación visual de la interfaz.

## 1. Mejoras de Accesibilidad (a11y)
*   **Foco Visible**: Se implementaron estilos globales CSS para `:focus-visible` proporcionando anillos de enfoque de alto contraste (`outline: 2px solid var(--accent-color)`).
*   **Soporte a `prefers-reduced-motion`**: Se introdujeron medias queries en el CSS principal para desactivar animaciones de transición en hover y modales cuando el usuario lo solicita desde el sistema operativo.
*   **Etiquetas ARIA y `title`**: Agregado de atributos de accesibilidad (`aria-label`) a botones de sólo íconos, particularmente los botones de revisión de enlaces rotos (`.review-link-btn`, `.ignore-link-btn`, `.remove-link-btn`).
*   **Atajos de Teclado Universales**:
    *   Búsqueda global (`/`): Permite enfocar la barra de búsqueda inmediatamente ignorando si el usuario está en otro elemento interactivo.
    *   Limpieza (`Esc`): Limpia el buscador, desenfoca campos o cierra menús.
    *   **Motor de captura dinámica**: Se reescribió la lógica en `newtab.js` que escucha los atajos de marcadores fijados. Se migró de una verificación estricta de teclas modificadoras (ctrlKey, altKey, shiftKey) a un estado dinámico mediante un `Set` (`pressedKeys`) capturado por eventos de teclado locales (`keydown`, `keyup`).
    *   **Shortcut Catcher**: En `setup.html` y `setup.js`, se implementaron dos botones interactivos que permiten la asignación dinámica de cualquier tecla del sistema y migran el valor a `currentSettings.pinnedShortcutModifier`. Se ha establecido **Alt + 1..9** (`["Alt", ""]`) como la combinación predeterminada para el acceso rápido.

## 2. Soporte RTL (Right-To-Left) e Internacionalización
*   **Conversión a Propiedades Lógicas (CSS)**: Para facilitar el soporte de RTL (árabe) y LTR, se reemplazaron las reglas de posicionamiento y espaciado (como `margin-left`, `padding-right`, `border-left`) por sus contrapartes lógicas: `margin-inline-start`, `padding-inline-end`, `border-inline-start`, etc.
*   **Soporte Local de Árabe (`ar`)**:
    *   Traducción e inclusión de archivo base `_locales/ar/messages.json`.
    *   En `i18n-helper.js` (`localizeHtml()`), se inyecta dinámicamente `document.documentElement.dir = "rtl"` o `"ltr"` dependiendo si el idioma es Árabe, evitando inconsistencias gráficas al cambiar rápidamente el menú.
*   **Estandarización de Etiquetas y Selectores**: Modificación masiva del archivo de idioma para homogeneizar sintaxis (e.g., adición de nombres nativos y traducciones al inglés como _"(German)"_) y uso consistente de variables nativas `$COUNT$` sobre Regex rígidos en marcadores de interpolación.
*   **Traducciones en Vivo**: Se arregló un problema donde la carga inicial de los textos dinámicos de Estadísticas ("Descargar JSON" y los "Resultados Vacíos") quedaba estática, inyectándoles ahora un atributo `data-i18n` que permite la re-renderización reactiva.
*   **Corrección de Codificación (Mojibake) y Textos Cruzados**:
    *   Se resolvieron problemas de codificación rota (caracteres corruptos) y textos en español residuales que se encontraban por error dentro del archivo de localización ruso (`src/_locales/ru/messages.json`).
    *   Se validó y limpió el archivo de localización árabe (`src/_locales/ar/messages.json`) para asegurar que no posea mojibake ni traducciones cruzadas.
    *   Se expandió el set de pruebas automáticas en `tests/i18n.test.js` con una nueva suite de verificación que analiza recursivamente todos los archivos de traducción para prevenir caracteres mojibake (como `Ã`, `Â`, `ðŸ`) y rechaza la presencia accidental de caracteres latinos/españoles (`áéíóúñ¿¡`) en locales no latinos (ruso, árabe, chino, etc.).

## 3. Lógica de Nombres de Carpetas Limpios (Smart Naming)
*   Se agregó la funcionalidad `cleanFolderNames` que procesa el "path" completo de la ruta del marcador en el DOM.
*   Si no hay colisión dentro del mismo contexto visual, extrae e imprime unívocamente el último nivel (`split(' / ').pop()`).
*   Si detecta colisión (e.g. múltiples carpetas llamadas "Importados"), añade un retroceso concatenando con `·` para brindar el contexto padre (`Importados · Opera`).

## 4. Mejoras Generales de UX y Estabilidad
*   **Tiempo de Espera en Capturas Locales**: La constante `CAPTURE_DELAY_MS` en el archivo `service-worker.js` se incrementó en un 20% (pasando de `1200ms` a `1440ms`). Esto reduce la incidencia de "pantallas blancas o negras" en la miniatura temporal para páginas web pesadas que requieren más recursos asíncronos para el proceso de render inicial.
*   **Integración Directa a Chrome**: Modificación en el menú de Carpetas dentro del flujo de `setup.js` para incrustar un llamado directo a la API de Chrome (`api.tabs.create({ url: "chrome://bookmarks/" })`) mejorando la administración cruda del arbolado de favoritos. Adicionalmente, incluye detección explícita para Firefox para evitar fallos por políticas de seguridad, proveyendo instrucciones (`Ctrl+Shift+O`) vía un `alert` localizado.
*   **Ruta completa al posicionarse encima (Smart Naming Tooltip)**: Para complementar `cleanFolderNames`, el elemento `<h2>` generador inyecta ahora el "path" crudo y completo dentro del atributo nativo `title` del DOM. Esto permite una inferencia de colisión visual rápida sin comprometer el estilo minimalista.
