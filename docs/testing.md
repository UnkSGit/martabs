# Verificacion y tests

Este documento define que se debe revisar despues de cada cambio importante. Aplica para Codex y Gemini/Antigravity.

## Comandos base

Ejecutar siempre:

```powershell
npm test
npm run build
```

`npm test` corre los tests automaticos con `node --test`.

`npm run build` genera los paquetes de extension en `dist/chrome` y `dist/firefox`.

En este proyecto puede aparecer `MaxListenersExceededWarning` durante los comandos. Si el proceso termina con exit code 0 y los tests pasan, ese warning no bloquea la verificacion.

## Que cubren hoy los tests

- **Bookmarks e indice:** lectura del arbol, filtrado por carpetas monitoreadas y datos base del indice.
- **Busqueda:** coincidencias por titulo, URL, dominio, carpeta, tags y normalizacion de acentos.
- **Tags:** generacion automatica y mezcla con tags manuales.
- **Setup:** estructura HTML/CSS, guardado de carpetas, opciones visuales y configuracion.
- **Nueva pestana:** estructura de UI, layout masonry, acciones de marcador, modal de edicion, estados de enlace, previews locales, modos visuales y regresiones de CSS importantes.
- **Privacidad/permisos:** evita servicios externos de previews/iconos, revisa que la salud de enlaces no corra en service worker y protege el flujo de capturas locales.
- **Salud de enlaces:** acumulacion y limpieza de fallos.

## Verificacion manual recomendada

Despues de cambios visuales o de interaccion, abrir la extension o una pagina local y revisar:

- Carga inicial de la Nueva pestana.
- Busqueda y tecla `Escape`.
- Cambio de modo visual por carpeta.
- Foco suave al cambiar la vista de una carpeta.
- Edicion de titulo, URL, tags e icono custom.
- Fallback cuando un icono custom falla.
- Fijar/desfijar marcadores.
- Revision de enlaces activada y desactivada.
- Modo claro/oscuro/sistema.
- Configuracion de carpetas y orden.

## Cuando agregar tests nuevos

Agregar o actualizar tests si el cambio:

- corrige un bug que podria volver;
- toca `storage.local`, permisos o APIs del navegador;
- cambia el render de `newtab`;
- cambia configuracion en `setup`;
- agrega botones, estados visuales o clases CSS que sostienen comportamiento;
- modifica busqueda, tags, revision de enlaces, previews, pinning, modos visuales o edicion.

## Testeo general para cambios grandes

Para cada agregado grande, usar esta secuencia:

1. Antes de tocar codigo, identificar que test deberia fallar si el flujo no existe o esta roto.
2. Agregar el test de regresion o comportamiento.
3. Ejecutar `npm test` y confirmar que falla por la razon esperada.
4. Implementar el cambio.
5. Ejecutar `npm test` hasta que pase.
6. Ejecutar `npm run build`.
7. Hacer una prueba manual del flujo principal afectado.
8. Actualizar `docs/task.md`, `docs/maintenance_notes.md` o `docs/walkthrough.md` si cambia comportamiento visible o una regla tecnica.

## Nota sobre tests visuales

Los tests actuales son livianos y revisan estructura, reglas CSS y presencia de flujos clave. No reemplazan una prueba visual real cuando se cambia layout. Para cambios grandes de UI conviene sumar una inspeccion manual con navegador, especialmente en:

- escritorio ancho;
- ventana angosta;
- pocas carpetas;
- muchas carpetas;
- carpetas con muchos marcadores;
- modo oscuro.
