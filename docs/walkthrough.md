# Walkthrough - martabs

Este recorrido explica como se usa martabs y que sucede internamente en cada paso.

## Primer uso

1. El usuario abre la extension o una Nueva pestana.
2. Si todavia no hay configuracion, martabs pide elegir carpetas.
3. En `Configurar`, el usuario selecciona carpetas y preferencias.
4. Al guardar, se crea el indice local de marcadores.
5. La Nueva pestana muestra las carpetas como paneles visuales.

## Uso diario

- La busqueda filtra al escribir.
- `Esc` limpia la busqueda.
- `Enter` abre el primer resultado encontrado.
- Los marcadores se actualizan cuando Chrome o Firefox informan cambios.
- La vista rapida aparece al pasar el mouse sobre un marcador.

## Layout

- Una carpeta: panel amplio con grilla si hay muchos marcadores.
- Dos a cuatro carpetas: columnas lado a lado con scroll independiente.
- Mas de cuatro carpetas: grilla de paneles con scroll general.

## Revision de enlaces

La revision de enlaces es opcional y manual.

1. El usuario activa `Revision de enlaces` en configuracion.
2. El navegador pide permisos opcionales para URLs `http` y `https`.
3. Cada carpeta muestra un boton `Revisar`.
4. Al hacer click, martabs revisa los enlaces de esa carpeta y muestra progreso.
5. Si hay fallos, aparece un boton compacto con la cantidad de fallos en esa carpeta.
6. La vista de fallos permite volver, eliminar un enlace puntual o eliminar todos los fallos de esa carpeta.

Si la opcion esta desactivada, no se muestran estados de salud de enlaces y no aparece el boton `Revisar`.

## Privacidad

- El indice vive en `storage.local`.
- La preview es local: no hay capturas remotas.
- No se usan fuentes externas.
- La revision de enlaces solo se ejecuta cuando el usuario la pide.

## Validacion rapida

```powershell
npm test
npm run build
```

Pruebas manuales sugeridas:

- elegir carpetas y guardar;
- abrir Nueva pestana;
- buscar por texto, dominio y carpeta;
- cambiar tema;
- activar revision de enlaces, revisar una carpeta y abrir la vista de fallos;
- desactivar revision de enlaces y confirmar que desaparecen los estados de salud.
