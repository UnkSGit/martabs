# martabs

martabs es una extension WebExtension ligera que reemplaza la pagina de Nueva pestana por un tablero local de marcadores.

El objetivo es encontrar rapido marcadores guardados en carpetas grandes, con busqueda, etiquetas, vistas visuales, orden local y herramientas de limpieza, sin depender de servicios externos.

## Funciones actuales

- Nueva pestana con dashboard tipo masonry.
- Seleccion de carpetas monitoreadas.
- Busqueda instantanea por titulo, URL, dominio, carpeta y etiquetas.
- Etiquetas automaticas y manuales.
- Favoritos fijados dentro de su carpeta y, si el usuario quiere, en una carpeta virtual superior.
- Modos visuales por carpeta: lista, compacta, iconos, iconos grandes y quicklinks.
- Orden visual global y por carpeta: original, manual, titulo, fecha, dominio o fallidos primero.
- Drag & drop local para carpetas y para marcadores en carpetas con orden manual.
- Movimiento local de marcadores entre carpetas monitoreadas, sin modificar Chrome/Firefox.
- Edicion desde la UI: titulo, URL, etiquetas manuales, icono custom y eliminacion.
- Fallback para iconos custom rotos.
- Vista rapida opcional al pasar el mouse.
- Capturas locales opcionales al abrir marcadores desde martabs.
- Revision opcional de enlaces caidos por carpeta.
- Modo claro, oscuro o sistema.
- Configuracion organizada por secciones con buscador de ajustes.

## Privacidad

martabs guarda todo localmente en el navegador. No usa servicios externos para previews, iconos, busqueda o sincronizacion.

Permisos base:

- `bookmarks`: leer y editar marcadores cuando el usuario lo pide.
- `storage`: guardar configuracion local, etiquetas, ordenes, previews y estados.
- `favicon` solo en Chrome: leer favicons locales del navegador.

Permisos opcionales:

- Acceso a URLs para revisar enlaces caidos.
- Acceso a URLs para capturar previews locales cuando el usuario activa esa opcion.

Al desactivar esas opciones desde Configuracion, martabs intenta retirar los permisos opcionales.

## Instalacion en modo desarrollador

Requisitos:

- Node.js.

Pasos:

```powershell
npm install
npm run build
```

Chrome, Brave o Edge:

1. Abrir `chrome://extensions`, `brave://extensions` o `edge://extensions`.
2. Activar modo desarrollador.
3. Cargar la carpeta `dist/chrome` como extension descomprimida.

Firefox:

1. Abrir `about:debugging#/runtime/this-firefox`.
2. Elegir `Cargar complemento temporal`.
3. Seleccionar `dist/firefox/manifest.json`.

## Desarrollo

Comandos principales:

```powershell
npm test
npm run build
```

La documentacion de trabajo vive en `docs/`:

- `docs/task.md`: estado actual.
- `docs/walkthrough.md`: comportamiento para usuario final.
- `docs/implementation_plan.md`: arquitectura vigente.
- `docs/maintenance_notes.md`: reglas obligatorias para flujos sensibles.
- `docs/testing.md`: verificacion recomendada.
- `docs/collaboration.md`: forma de trabajo entre Codex y Gemini/Antigravity.
- `docs/roadmap.md`: pendientes futuros.

Pendiente principal actual: multilenguaje.
