# Verificacion y tests

Este documento define que revisar despues de cada cambio importante. Aplica para Codex y Gemini/Antigravity.

## Comandos base

Ejecutar siempre:

```powershell
npm test
npm run build
```

`npm test` corre los tests automaticos con `node --test`.

`npm run build` genera los paquetes de extension en `dist/chrome` y `dist/firefox`.

Puede aparecer `MaxListenersExceededWarning`. Si el proceso termina con exit code 0 y los tests pasan, ese warning no bloquea.

## Cobertura actual

- Bookmarks e indice.
- Busqueda.
- Tags.
- Setup y guardado de configuracion.
- Nueva pestana y layout principal.
- Privacidad y permisos.
- Salud de enlaces.
- Capturas locales.
- Edicion de marcadores.
- Iconos custom y fallback.
- Fijados.
- Modos visuales.
- Cambio de modo visual in-place sin redibujado completo.
- Ordenamiento y orden manual.
- Movimiento local de marcadores.
- Internacionalizacion (paridad de claves, mojibake, CJK, selector de idioma).
- Filtrado de rebuild en service worker (solo settings estructurales).

## Verificacion manual recomendada

Despues de cambios visuales o de interaccion:

- Carga inicial de Nueva pestana.
- Busqueda, `Escape` y `Enter`.
- Cambio de vista por carpeta.
- Foco suave al cambiar vista.
- Editar titulo, URL, tags e icono custom.
- Fallback cuando un icono custom falla.
- Fijar y desfijar marcadores.
- Revision de enlaces activada y desactivada.
- Capturas locales activadas y desactivadas.
- Modo claro, oscuro y sistema.
- Configuracion de carpetas, vistas y orden.
- Buscador de Configuracion.
- Guardado global sin perder ordenes, movimientos ni iconos personalizados.
- Acciones avanzadas con confirmacion.
- Drag & drop de marcadores y carpetas.

## Cuando agregar tests

Agregar o actualizar tests si el cambio:

- corrige un bug que podria volver;
- toca `storage.local`, permisos o APIs del navegador;
- cambia el render de `newtab`;
- cambia Configuracion;
- agrega botones, estados visuales o clases CSS que sostienen comportamiento;
- modifica busqueda, tags, revision de enlaces, previews, pinning, modos visuales, ordenamiento o edicion.

## Secuencia para cambios grandes

1. Identificar que test deberia fallar si el flujo no existe o esta roto.
2. Agregar o actualizar ese test.
3. Ejecutar `npm test` y confirmar que falla por la razon esperada.
4. Implementar el cambio.
5. Ejecutar `npm test` hasta que pase.
6. Ejecutar `npm run build`.
7. Hacer prueba manual si el cambio es visual o interactivo.
8. Actualizar docs si cambia comportamiento visible o una regla tecnica.

## Tests visuales

Los tests actuales son livianos y revisan estructura, reglas CSS y flujos clave. No reemplazan una prueba visual real cuando se cambia layout.

Para cambios grandes de UI conviene revisar:

- escritorio ancho;
- ventana angosta;
- pocas carpetas;
- muchas carpetas;
- carpetas con muchos marcadores;
- modo oscuro;
- modo claro.
