# Funcionalidades - martabs

Este documento explica las funcionalidades principales desde la perspectiva del usuario final.

## Interfaz Principal (Dashboard Masonry)

- **Layout Fluido (Masonry)**: Las carpetas se acomodan automáticamente utilizando todo el ancho disponible, apilándose verticalmente para evitar espacios en blanco (similar a un tablero estilo Pinterest o start.me). El contenedor se centra inteligentemente según la cantidad de carpetas que tengas activas.
- **Favoritos Fijados**: Si fijaste algún marcador, este aparecerá siempre **primero** dentro de su carpeta original. Además, si tenés habilitada la opción, aparecerá una carpeta virtual al principio de toda la página llamada "📌 Fijados" para un acceso más directo. Podés ocultar esta carpeta superior tocando el ícono del ojo ("Ocultar") junto a su título.
- **Carpetas Monitoreadas**: A continuación, se muestran las carpetas de marcadores que elegiste en la Configuración.
- **Búsqueda Instantánea**: La barra superior permite buscar en tiempo real por título, URL, dominio, etiqueta (tag) o carpeta. Usa la tecla `Escape` para borrar la búsqueda rápidamente. Al presionar `Enter` se abrirá el primer resultado.
- **Vista Rápida (Hover)**: Al dejar el cursor sobre un marcador, aparece una tarjeta flotante con más información:
  - Título completo
  - URL (Dominio)
  - Etiquetas (automáticas y manuales)
  - Carpeta de origen
  - Captura local del sitio (si está disponible y configurado)
- **Acciones Rápidas (Pin y Edición)**: Al pasar el cursor sobre un marcador, aparecen botones flotantes a la derecha:
  - **Fijar (Pin)**: Te permite anclar el marcador para que aparezca siempre en la sección superior de "Fijados".
  - **Editar (Lápiz)**: Se abre una ventana modal que permite cambiar el título, la URL, editar etiquetas personalizadas o eliminar el marcador por completo.

## Configuración y Setup

Accesible desde el botón "Configurar" en la esquina superior derecha.

- **Selección de Carpetas**: Permite marcar qué carpetas del navegador serán indexadas. Solo los marcadores dentro de las carpetas seleccionadas (o sus subcarpetas) aparecerán en martabs.
- **Reordenar carpetas**: Podés arrastrar y soltar (Drag & Drop) las carpetas en la lista para cambiar su orden. Ese mismo orden se reflejará en el tablero principal.
- **Etiquetas**: Activa o desactiva las etiquetas generadas automáticamente (según nombre de carpetas) o manuales.
- **Carpeta Fijados**: Activa o desactiva la visibilidad de la carpeta virtual "📌 Fijados" en el tope del dashboard.
- **Revisión de Enlaces**: Opcionalmente, permite a martabs detectar URLs caídas para que las borres (requiere permisos de acceso a red).

## Revisión de Enlaces Caídos

Si está habilitada en la Configuración:

1. Aparece un botón **"Revisar"** en el encabezado de cada carpeta en la interfaz principal.
2. Al presionarlo, la extensión realiza peticiones (fetch) locales a cada marcador de esa carpeta para ver si responden (HTTP 2xx, 3xx).
3. Aparece una barra de progreso. Si se detectan enlaces con error (4xx, 5xx, o inaccesibles), se sumará un contador al lado del botón Revisar.
4. Al terminar (o durante el proceso), si hubo fallos, puedes hacer clic en el botón de fallos (ej: **"3 fallo(s)"**) para entrar a una vista detallada.
5. **Vista de Revisión**: Muestra solo los enlaces rotos con su código de error (ej: 404). Desde aquí puedes usar el botón **"Eliminar todos"** para limpiar la carpeta de una vez, o volver a la vista normal usando **"Volver"**.
6. **Tarjetas de Vista Previa**: Los enlaces caídos se mostrarán con un borde naranja, y la tarjeta de vista previa al pasar el ratón te indicará su último estado de salud.
